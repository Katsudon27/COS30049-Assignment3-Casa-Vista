import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error

# Define a class to handle the housing price prediction machine learning model
class GradientBoostingModel:
    def __init__(self):
        # Initialize the Gradient Boosting model with tuned parameters
        self.model = GradientBoostingRegressor(n_estimators=500, learning_rate=0.1, max_depth=3, random_state=42)
        # Create label encoders for each categorical feature
        self.label_encoders = {
            'Region Name': LabelEncoder(),  # Encoder for 'Region Name'
            'Type of Property': LabelEncoder()  # Encoder for 'Type of Property'
        }
        self.original_columns = None

    def load_and_prepare_data(self, train_file, test_file):
        # Load the training and testing datasets
        train_df = pd.read_csv(train_file)
        test_df = pd.read_csv(test_file)

        # Combine the two datasets (training and testing) for preprocessing of categorical variables
        combined_df = pd.concat([train_df, test_df], ignore_index=True)

        # Encode categorical variables in both datasets
        for column in ['Region Name', 'Type of Property']:
            # Fit the label encoder on the combined dataset for each categorical column
            self.label_encoders[column].fit(combined_df[column])  
            # Transform the categorical column in the combined dataset using the fitted encoder
            combined_df[column] = self.label_encoders[column].transform(combined_df[column])  

        # Split the combined dataset back into training and testing sets
        self.train_df = combined_df.iloc[:len(train_df), :]
        self.test_df = combined_df.iloc[len(train_df):, :]

        # Define features (X) and target (y) for both training and testing datasets
        self.X_train = self.train_df[['Region Name', 'Type of Property']]
        self.y_train = self.train_df['Price']   # Set the price as target variable for training
        self.X_test = self.test_df[['Region Name', 'Type of Property']]
        self.y_test = self.test_df['Price']     # Set the price as target variable for

    def train(self):
        # Train the model
        self.model.fit(self.X_train, self.y_train)

        # Save the trained model
        joblib.dump(self.model, 'gradient_boosting.pkl')

    def predict(self):
        # Make predictions on the test set
        return self.model.predict(self.X_test)

    def evaluate(self, y_pred):
        # Evaluate the model
        mse = mean_squared_error(self.y_test, y_pred)   # Mean Squared Error
        rmse = np.sqrt(mse)  # Root Mean Squared Error
        mae = mean_absolute_error(self.y_test, y_pred)  # Mean Absolute Error
        r2 = r2_score(self.y_test, y_pred)  # R-squared score

        # Print out evaluation results for the model
        print("\n-------- Model Evaluation Results --------")
        print(f"Mean Squared Error (MSE): {mse}")
        print(f"Root Mean Squared Error (RMSE): {rmse}")
        print(f"Mean Absolute Error (MAE): {mae}")
        print(f"R² Score: {r2}")

    def predict_price(self, region_name, property_type):
        # Prepare input for the model based on user input
        input_data = pd.DataFrame({
            'Region Name': [region_name],   # User-input 'Region Name'
            'Type of Property': [property_type],    # User-input 'Type of Property'
        })

        # Encode categorical features in the input data using the defined fitted label encoders
        for column in ['Region Name', 'Type of Property']:
            input_data[column] = self.label_encoders[column].transform(input_data[column])

        # Make prediction based on the input data
        predicted_price = self.model.predict(input_data)

        # Return the predicted price rounded to two decimal places
        return round(predicted_price[0], 2)

if __name__ == "__main__":
    # Create an instance of the HousingPriceModel class
    model = GradientBoostingModel()
    # Load and prepare data from the training and testing files 
    model.load_and_prepare_data(r'data/training_dataset.csv', r'data/testing_dataset.csv')
    # Train the model on the training data
    model.train()
    # Generate predictions on the test dataset
    y_pred = model.predict()
    # Evaluate the model's predictions and print the results
    model.evaluate(y_pred)
