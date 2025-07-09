# COS30049 Assignment 3 Casa Vista 
Casa Vista is a powerful data-driven platform designed to revolutionize how users view housing market data. 

The full-stack web application uses machine learning algorithms to offer property price predictions and hidden market trends, enabling users to make informed decisions. 

# Table of Contents 
- [Setup Instructions for front-end](#Environment_Setup_Front_End)
- [Setup Instructions for back-end](#Environment_Setup_Back_End)

# Environment_Setup_Front_End

Contains commands to configure the project environment for front-end components

1. Navigate into the frontend folder with the following command:
    cd frontend

2. Install the mui library with the following command:
    npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

2. Install the react-router-dom dependency for web page navigation with the following command:
    npm install react-router-dom

3. Install the axios dependency for communication with back-end server with the following command:
    npm install axios

4. Install the react-transition-group dependency for transition animations with the following command:
    npm install react-transition-group

5. Initialize the front-end for the web application with the following command:
    npm start

# Environment_Setup_Back_End

Contains commands to configure the project environment for back-end components

1. Navigate into the backend folder with the following command:
    cd backend

2. Run the following command to install the necessary libraries for backend:
    pip install fastapi uvicorn numpy pandas scikit-learn joblib pydantic

3. Run the following command to pre-train the Random Forest model for web deployment:
    python randomForest.py

4. Run the following command to pre-train the Gradient Boosting model for web deployment:
    python gradientBoosting.py

5. Start the application server with the following command:
    uvicorn main:app --reload
