from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from utils import logger
from clustering import ClusteringModel
from randomForest import RandomForestModel
from gradientBoosting import GradientBoostingModel
import pandas as pd

# Initialize the FastAPI app
app = FastAPI()

# Setup CORS middleware to allow request from React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # URL of React application
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the integrated Machine Learning Models
# Initialize the DBSCAN model for clustering
try:
    clustering_model = ClusteringModel()
except Exception as e:
    # Log and raise exceptions for errors encountered during model initialization
    logger.error("Failed to initialize clustering model:", e)
    raise HTTPException(status_code=500, detail="Clustering Model initialization error")

# Load the pretrained Random Forest model with the training and testing datasets for price prediction
try:
    rf_model = RandomForestModel('data/training_dataset.csv', 'data/testing_dataset.csv')
except Exception as e:
    # Log and raise exceptions for errors encountered during model initialization
    logger.error("Failed to initialize Random Forest model:", e)
    raise HTTPException(status_code=500, detail="Random Forest Model initialization error")


# Load the pretrained Gradient Boosting model with the training and testing datasets for price prediction
try:
    # Load training and testing data for the model
    gb_model = GradientBoostingModel()
    gb_model.load_and_prepare_data(
        r'data/training_dataset.csv',
        r'data/testing_dataset.csv'
    )
    gb_model.train()  # Fit and train the model on the training data
except Exception as e:
    # Log and raise exceptions for errors encountered during model initialization
    logger.error("Failed to initialize Gradient Boosting model:", e)
    raise HTTPException(status_code=500, detail="Gradient Boosting Model initialization error")

# Load the dataset at start-up of application server
training_dataset = 'data/training_dataset.csv'
try:
    df = pd.read_csv(training_dataset)
except FileNotFoundError as e:
    #Log error and raise exception if the dataset cannot be found
    logger.error("Training dataset not found:", e)
    raise HTTPException(status_code=500, detail="Training Dataset file missing")
except Exception as e:
    logger.error("Error loading training dataset:", e)
    raise HTTPException(status_code=500, detail="Training Dataset loading error")

# Define a Pydantic model to validate and parse input data for prediction
class PredictionReq(BaseModel):
    region: str
    property_type: str

# Define a Pydantic model to validate and parse input data for clustering
class ClusteringReq(BaseModel):
    column: str 

# API endpoints
# Root endpoint: Welcome message at the root path for the API
@app.get("/")
async def root():
    return {"message": "Welcome to the House Price Prediction API"}

# Prediction endpoint for Random Forest: Retrieve the prediction price
@app.post("/predict/")
async def predict_price_with_body(data: PredictionReq):
    try:
        # Predict the housing price based on region and property type with Random Forest Model
        price = rf_model.predict(data.region, data.property_type)[0]
        
        # Return the predicted price as JSON
        return {"predicted_price": round(price, 2)}
    except Exception as e:
        #Raise exception if error occurs
        raise HTTPException(status_code=400, detail=str(e))
    
# History data endpoint : Retrive data from the training dataset based on user input
@app.post("/get_year_price/")
async def get_year_price(data: PredictionReq):
    try:
        # Load the training dataset
        house_data = df

        # Filter the data based on the requested region and property type
        filtered_data = house_data[
            (house_data['Region Name'] == data.region) & 
            (house_data['Type of Property'] == data.property_type)
        ]
        
        # Check if required columns 'Year Sold' and 'Price' are empty
        if 'Year Sold' not in filtered_data.columns or 'Price' not in filtered_data.columns:
            raise HTTPException(status_code=400, detail="'Year Sold' or 'Price' column not found in the data")

        # Calculate average price per year
        avg_price = filtered_data.groupby('Year Sold')['Price'].mean().reset_index()
        avg_price.columns = ['Year Sold', 'Price']  # Rename columns for clarity

        # Convert the results to a dictionary format 
        result = avg_price.to_dict(orient='records')
        
        # Return the result as JSON
        return result
    
    except Exception as e:
        # Raise an HTTP 400 error if there is something wrong
        raise HTTPException(status_code=400, detail=str(e))

# Prediction endpoint for Gradient Boosting: Retrieve the prediction price
@app.get("/predict/{region}/{house_type}")
async def get_predict_price(region: str, house_type: str):
    try:   
        # Log the user input for debugging purposes     
        print(f"Received prediction request: region='{region}', house_type='{house_type}'")  
        
        # Predict the housing price based on region and property type with Gradient Boosting Model
        predicted_price = gb_model.predict_price(region, house_type)
        
        # Return the predicted price as JSON
        return {"predicted_price": predicted_price}
    
    except Exception as e:
        # Log any errors encountered during prediction
        print(f"Error during prediction (GET): {e}")  # Log the error for debugging
        
        # Raise an HTTP 500 error if the prediction fails
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Clustering endpoint for DBCSAN : Retrieve the prediction price
@app.post("/cluster")
async def predict_price(input: ClusteringReq):

    # Map column abbreviations to full column names based on user input
    column_map = {"NR": "No. of Rooms", "D": "Distance from CBD", "NS": "No. of properties in Suburb", "TP": "Total population"}
    
    #Convert the column abbreviation from user input to full column name
    selected_column = column_map.get(input.column, None)

    # Raise an exception if the conversion fails
    if not selected_column:
        raise HTTPException(status_code=400, detail="Invalid column selection")

    # Filter the data to only keep columns for House Price and the column selected by user
    try:
        df_selected = df[['Price', selected_column]]
    except KeyError as e:
        # Log and raise an exception if error occurs
        logger.error("Invalid column in dataset:", e)
        raise HTTPException(status_code=500, detail="Invalid column in dataset")

    # Perform clustering
    try:
        #Retrieve clustering labels generated by the model
        labels = clustering_model.cluster(selected_column)

        #Add the labels to the filtered dataset as a new column for visualisation
        df_selected['ClusterLabel'] = labels

        #Generate cluster summary by grouping the filtered dataset by labels and calculate the mean values for each column
        cluster_summary = df_selected.groupby('ClusterLabel').agg({'Price': 'mean', selected_column: 'mean'}).reset_index()
        
        #Rename the columns with appropriate naming conventions
        cluster_summary = cluster_summary.rename(columns={
            'Price': 'Mean Price',
            selected_column: 'Mean ' + selected_column
        })

    except Exception as e:
        # Log and raise an exception if error occurs during clustering
        logger.error("Error during clustering:", e)
        raise HTTPException(status_code=500, detail="Clustering error")

    # Convert the filtered dataset and cluster summary to a dictionary for response
    data = df_selected.to_dict(orient="records")
    cluster_summary = cluster_summary.to_dict(orient="records")

    # Return the filtered dataset, full name of the selected column and cluster summary as JSON
    return {"data": data, "selected_column": selected_column, "cluster_summary": cluster_summary}

if __name__ == "__main__":
    import uvicorn # Import Uvicorn for ASGI server to run the FastAPI app
    uvicorn.run(app, host="0.0.0.0", port=8000) # Run the app on host 0.0.0.0 at port 8000