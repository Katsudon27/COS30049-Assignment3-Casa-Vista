import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error, mean_squared_error
import joblib

# A random forest regression model
class RandomForestModel:
    def __init__(self, training, testing):
        # Initialize with training and testing dataset
        self.training = training
        self.testing = testing
        self.load_data() # Prepare data for training
        self.train() # Train the model

    def load_data(self):
        # Load the training and testing files
        self.house_market_train = pd.read_csv(self.training)
        self.house_market_test = pd.read_csv(self.testing)
        
        # Extract features and target from the datasets
        self.X_train = self.house_market_train.drop('Price', axis=1)
        self.y_train = self.house_market_train['Price']
        self.X_test = self.house_market_test.drop('Price', axis=1)
        self.y_test = self.house_market_test['Price']
        
        self.numcols = self.X_train.select_dtypes(include=['int64', 'float64']).columns # Set columns that contain numbers as numerical columns
        self.catcols = self.X_train.select_dtypes(include=['object']).columns # Set columns that contain words as categorical columns

        # Combine the preprocessed numerical and categorical columns
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', Pipeline(steps=[('scaler', StandardScaler())]), self.numcols), # Standardized the numerical features
                ('cat', Pipeline(steps=[('onehot', OneHotEncoder(handle_unknown='ignore'))]), self.catcols) # Convert categorical value into binary
            ]
        )

    def train(self):
        # Build the random forest pipeline
        self.model = Pipeline(steps=[
            ('preprocessor', self.preprocessor),
            ('model', RandomForestRegressor(n_estimators=100, max_depth=20, min_samples_split=10, random_state=42))
        ])
        
        # Fit the model to the training set to train it
        self.model.fit(self.X_train, self.y_train)

        # Save the model as random_forest.pkl
        joblib.dump(self.model, 'random_forest.pkl')

        # Make predictions using the testing set
        y_pred = self.model.predict(self.X_test)
        
        # Evaluate random forest using the evaluation metrics
        print('-'*50)
        print("Random Forest Evaluation:")
        print(f"Mean Squared Error: {mean_squared_error(self.y_test, y_pred):.4f}")
        print(f"Root Mean Squared Error: {np.sqrt(mean_squared_error(self.y_test, y_pred)):.4f}")
        print(f"Mean Absolute Error: {mean_absolute_error(self.y_test, y_pred):.4f}")
        print(f"R-Squared (R2 Score): {r2_score(self.y_test, y_pred):.4f}")
        print('-'*50)

    def predict(self, region_name, house_type):
        # Extract the saved model
        model = joblib.load('random_forest.pkl')
        
        # Creat empty input dataframe with columns same as training dataset
        inputdata = pd.DataFrame(columns=self.X_train.columns)
        inputdata.loc[0, 'Region Name'] = region_name  # Replace with actual column name if its different
        inputdata.loc[0, 'Type of Property'] = house_type    # Replace with actual column name if its different

        # Fill the missing field with their mean values for the numerical columns from the training set
        for col in self.numcols:
            if col not in inputdata.columns or pd.isnull(inputdata.loc[0, col]):
                inputdata.loc[0, col] = self.X_train[col].mean()

        # Fill the missing field with their mode for the categorical columns from the training set
        for col in self.catcols:
            if col not in inputdata.columns or pd.isnull(inputdata.loc[0, col]):
                inputdata.loc[0, col] = self.X_train[col].mode()[0]

        # Preprocess data from the input 
        processed_input = model.named_steps['preprocessor'].transform(inputdata)
        
        # Make prediction and return it
        return model.named_steps['model'].predict(processed_input)

# Usage of initializing training and saving the model
if __name__ == "__main__":
    model = RandomForestModel('data/training_dataset.csv', 'data/testing_dataset.csv')
    model.train()