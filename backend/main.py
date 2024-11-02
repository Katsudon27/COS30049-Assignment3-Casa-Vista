from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from utils import logger
from model import ClusteringModel
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
    model = ClusteringModel()
except Exception as e:
    logger.error("Failed to initialize clustering model:", e)
    raise HTTPException(status_code=500, detail="Model initialization error")

# Load the dataset only once at app start
training_dataset = 'data/training_dataset.csv'
try:
    df = pd.read_csv(training_dataset)
except FileNotFoundError as e:
    logger.error("Training dataset not found:", e)
    raise HTTPException(status_code=500, detail="Dataset file missing")
except Exception as e:
    logger.error("Error loading training dataset:", e)
    raise HTTPException(status_code=500, detail="Dataset loading error")


# Define a Pydantic model to validate and parse input data for prediction
class ClusteringInput(BaseModel):
    # Field defines constraints for input validation
    column: str = Field(..., description="Column to be compared with House Price")

@app.post("/cluster")
async def predict_price(input: ClusteringInput):
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
        labels = model.cluster(selected_column)
        df_selected['ClusterLabel'] = labels  # Attach labels to the DataFrame for visualization
    except Exception as e:
        logger.error("Error during clustering:", e)
        raise HTTPException(status_code=500, detail="Clustering error")

    # Convert to JSON format for response
    data = df_selected.to_dict(orient="records")
    return {"data": data, "selected_column": selected_column}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)