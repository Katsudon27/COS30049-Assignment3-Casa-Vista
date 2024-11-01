from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from utils import logger
from model import SimpleModel

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
model = SimpleModel()

# Define a Pydantic model to validate and parse input data for prediction
class PredictionInput(BaseModel):
    # Field defines constraints for input validation
    square_footage: int = Field(..., gt=0, description="Square footage of the house")
    bedrooms: int = Field(..., ge=1, le=10, description="Number of bedrooms")

@app.post("/predict")
async def predict_price(input: PredictionInput):
    try:
        # Call the model's predict method using the input data
        price = model.predict(input.square_footage, input.bedrooms)[0]
        
        # Log the prediction details (price, square footage, and bedrooms)
        logger.info(f"Prediction made: {price} for {input.square_footage} sq ft, {input.bedrooms} bedrooms")
        
        # Return the predicted price in JSON format, rounding to 2 decimal places
        return {"predicted_price": round(price, 2)}
    
    except Exception as e:
        # Log the error if an exception occurs during prediction
        logger.error(f"Error during prediction: {str(e)}")
        
        # Raise an HTTP 500 Internal Server Error if prediction fails
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/")
async def root():
    return {"message": "Welcome to the House Price Prediction API"}

@app.get("/predict/{square_footage}/{bedrooms}")
async def predict_price(square_footage: int, bedrooms: int):
    price = model.predict(square_footage, bedrooms)[0]
    return {"predicted_price": round(price, 2)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)