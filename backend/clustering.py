import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
import joblib

# A DBSCAN clustering model
class ClusteringModel:
    def __init__(self):
        self.model = DBSCAN()

    def train(self, column):
        # Load the training dataset
        training_dataset = 'data/training_dataset.csv'
        df = pd.read_csv(training_dataset)

        #Initialize and categorize each column name into the corresponding array
        numerical_columns = ['No. of Rooms', 'Distance from CBD', 'No. of properties in Suburb', 'Total population']

        #Assign the appropriate column name based on the abbreviation provided
        if column == "NR":
            column = numerical_columns[0]
            epsilon = 0.32
            min_samples = 2
        elif column == "D":
            column = numerical_columns[1]
            epsilon = 1
            min_samples = 8
        elif column == "NS":
            column = numerical_columns[2]
            epsilon = 0.06
            min_samples = 2
        else:
            column = numerical_columns[3]
            epsilon = 0.01
            min_samples = 8
        
        #Filter the dataframe to only contain Price and the column specified by the user
        selected_columns = ['Price', column]
        df_selected = df[selected_columns]


        # Train the model
        self.model = DBSCAN(eps=epsilon, min_samples=min_samples)
        self.model.fit(df_selected)
        
        # Save the model
        joblib.dump(self.model, 'clustering_model.pkl')

    def cluster(self, column):
        # Load the model
        self.train(column)
        model = joblib.load('clustering_model.pkl')

        return model.labels_

# Example usage (for initial training)
if __name__ == "__main__":
    model = ClusteringModel()
    model.train()