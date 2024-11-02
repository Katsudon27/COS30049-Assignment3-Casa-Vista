from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from utils import logger
from clustering import ClusteringModel
from randomForest import RandomForestModel
from gradientBoosting import GradientBoostingModel
import pandas as pd

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # URL of React application
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the model
try:
    clustering_model = ClusteringModel()
except Exception as e:
    logger.error("Failed to initialize clustering model:", e)
    raise HTTPException(status_code=500, detail="Model initialization error")

try:
    rf_model = RandomForestModel('data/training_dataset.csv', 'data/testing_dataset.csv')
except Exception as e:
    logger.error("Failed to initialize clustering model:", e)
    raise HTTPException(status_code=500, detail="Model initialization error")


# Load and prepare data and train the model on startup
try:
    # Load training and testing data for the model
    gb_model = GradientBoostingModel()
    gb_model.load_and_prepare_data(
        r'data/training_dataset.csv',
        r'data/testing_dataset.csv'
    )
    gb_model.train()  # Fit and train the model on the training data
except Exception as e:
    # Print any errors encountered during loading or training data
    print(f"Error loading data and training model: {e}")

# Load the dataset only once at app start
training_dataset = 'data/training_dataset.csv'
try:
    df = pd.read_csv(training_dataset)
except FileNotFoundError as e:
    logger.error("Training dataset not found:", e)
    raise HTTPException(status_code=500, detail="Training Dataset file missing")
except Exception as e:
    logger.error("Error loading training dataset:", e)
    raise HTTPException(status_code=500, detail="Training Dataset loading error")

# Create Pydantic model for the request
class PredictionReq(BaseModel):
    region: str
    property_type: str

# Define a Pydantic model to validate and parse input data for prediction
class ClusteringReq(BaseModel):
    # Field defines constraints for input validation
    column: str = Field(..., description="Column to be compared with House Price")

@app.get("/")
async def root():
    return {"message": "Welcome to the House Price Prediction API"}

# Prediction endpoint: Retrieve the prediction price
@app.post("/predict/")
async def predict_price_with_body(data: PredictionReq):
    try:
        price = rf_model.predict(data.region, data.property_type)[0]
        return {"predicted_price": round(price, 2)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# History data endpoint: Retrive data from the training dataset based on user input
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

# Define a GET endpoint for predicting the housing price based on region and property type
@app.get("/predict/{region}/{house_type}")
async def get_predict_price(region: str, house_type: str):
    try:   
        # Log the user input for debugging purposes     
        print(f"Received prediction request: region='{region}', house_type='{house_type}'")  
        
        # Predict the housing price based on region and property type
        predicted_price = gb_model.predict_price(region, house_type)
        
        # Return the predicted price as JSON
        return {"predicted_price": predicted_price}
    
    except Exception as e:
        # Log any errors encountered during prediction
        print(f"Error during prediction (GET): {e}")  # Log the error for debugging
        # Raise an HTTP 500 error if the prediction fails
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/cluster")
async def predict_price(input: ClusteringReq):
    column = input.column

    # Map column abbreviations to full column names
    column_map = {"NR": "No. of Rooms", "D": "Distance from CBD", "NS": "No. of properties in Suburb", "TP": "Total population"}
    selected_column = column_map.get(column, None)
    if not selected_column:
        raise HTTPException(status_code=400, detail="Invalid column selection")

    # Filter the dataframe to get only Price and the selected column
    try:
        df_selected = df[['Price', selected_column]]
    except KeyError as e:
        logger.error("Invalid column in dataset:", e)
        raise HTTPException(status_code=500, detail="Invalid column in dataset")

    # Perform clustering
    try:
        labels = clustering_model.cluster(selected_column)
        df_selected['ClusterLabel'] = labels  # Attach labels to the DataFrame for visualization
        cluster_summary = df_selected.groupby('ClusterLabel').agg({'Price': 'mean', selected_column: 'mean'}).reset_index()
        cluster_summary = cluster_summary.rename(columns={
            'Price': 'Mean Price',
            selected_column: 'Mean ' + selected_column
        })

    except Exception as e:
        logger.error("Error during clustering:", e)
        raise HTTPException(status_code=500, detail="Clustering error")

    # Convert to JSON format for response
    data = df_selected.to_dict(orient="records")
    cluster_summary = cluster_summary.to_dict(orient="records")
    return {"data": data, "selected_column": selected_column, "cluster_summary": cluster_summary}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)