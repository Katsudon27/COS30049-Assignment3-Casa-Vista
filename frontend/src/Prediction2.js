import React, { useState, useRef } from 'react';
import * as d3 from 'd3';
import {
  Typography, Container, Box, FormControl, FormLabel, Select, MenuItem, Button
} from '@mui/material';

// Define the main App function
function Prediction2({darkMode}) {
  const [formVisible, setFormVisible] = useState(true); // Tracks the visibility of the form 
  const [predictionDetailsVisible, setPredictionDetailsVisible] = useState(false);  // Tracks the visibility of prediction details
  const [region, setRegion] = useState(''); // Holds selected region for predictions
  const [houseType, setHouseType] = useState(''); // Holds selected property type for predictions
  const chartRef = useRef(null);  // Reference for the chart container
  const [isChartVisible, setIsChartVisible] = useState(false); // Tracks the visibility of the chart

  // Fetch training data from the server
  const fetchTrainingData = async () => {
    try {
        const response = await fetch('http://127.0.0.1:8000/get_year_price/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({region: region, property_type: houseType}), // Send region and property type
        });

        const data = await response.json(); // Parse response JSON
        console.log("Fetched training data:", data);

        // Check if data is an array
        if (Array.isArray(data)) {
            if (data.length === 0) {
                console.log('Fetched data array is empty.');
            } else {
                console.log(`Fetched data array has ${data.length} items.`);
            }
            return data; // Return data array
        } else {
            console.error('Fetched data is not an array:', data);
            return []; // Return an empty array if data is not an array
        }
    } catch (error) {
        console.error('Error fetching training data:', error);
        return []; // Return an empty array on error
    }
};

  // Fetch prediction data from the server
  const fetchPredictionData = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/predict/${region}/${houseType}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch prediction data'); // Handle fetch error
      }

      const result = await response.json(); // Parse response JSON
      return result.predicted_price;  // Return predicted price
    } catch (error) {
      console.error('Error fetching prediction data:', error);
      return [];   // Return empty array on error
    }
};

// Handle form submission for prediction details
const handlePredictionDetailsSubmit = async (e) => {
  e.preventDefault(); // Prevent default form submission
  setPredictionDetailsVisible(true);  // Show prediction details
  setFormVisible(false);  // Hide form after filling the form
  setIsChartVisible(true);

  // Fetch training and prediction data
  const trainingData = await fetchTrainingData();
  const predictionData = await fetchPredictionData();

  console.log("Fetched training data:", trainingData);
  console.log("Fetched prediction data:", predictionData);

  // Format training data for years 2016 to 2018
  const formattedTrainingData = trainingData
    .filter(data => {
      const year = parseInt(data["Year Sold"], 10);
      return year >= 2016 && year <= 2018; // Filter for years 2016-2018
    })
    .map(data => ({
      year: parseInt(data["Year Sold"], 10),  // Parse year
      price: data["Price"]  // Set price
    }));

  console.log("Formatted Training Data:", formattedTrainingData);

  // Define years for prediction data (2019 and 2020)
  const startYear = 2019;
  const endYear = 2020;

  // Format the prediction data
  const formattedPredictionData = Array.from({ length: endYear - startYear + 1 }, (_, index) => ({
    year: startYear + index,
    price: predictionData // Predicted price for years 2019-2020
  }));

  console.log("Formatted Prediction Data:", formattedPredictionData);

  // Combine training and prediction data
  const combinedData = [...formattedTrainingData, ...formattedPredictionData];

  console.log("Combined Data:", combinedData);

  // Call drawChart function to render the chart
  drawChart(combinedData);
};

// Draw chart with combined data
const drawChart = (data) => {
  // Clear previous chart elements
  d3.select(chartRef.current).selectAll("*").remove();

  // Define chart margins, width, and height
  const margin = { top: 30, right: 30, bottom: 40, left: 55 },
        width = 800 - margin.left - margin.right, // Chart width minus margins
        height = 400 - margin.top - margin.bottom;  // Chart height minus margins

  // Append an SVG element to the chart container and apply margins
  const svg = d3.select(chartRef.current)
      .attr("width", width + margin.left + margin.right)  // Set SVG width
      .attr("height", height + margin.top + margin.bottom)  // Set SVG height
      .append("g")  // Append group element to apply margins
      .attr("transform", `translate(${margin.left}, ${margin.top})`); // Translate by margin

  // Set up x-axis scales
  const x = d3.scaleBand()
      .domain(data.map(d => d.year))  // Use years as domain
      .range([0, width])  // Map to the full chart width
      .padding(0.1);  // Initialize space between bars

  // Set up y-axis scales
  const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price) || 0]).nice()  // Use max price for range
      .range([height, 0]);  // Map to full chart height

  // Add X axis
  svg.append("g")
      .attr("transform", `translate(0, ${height})`) // Position x-axis at the bottom
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format tick labels as integers

  // Add Y axis
  svg.append("g")
      .call(d3.axisLeft(y));  // Position y-axis on the left side of the chart

  // Create a tooltip for displaying data upon hover
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")  // Position relative to mouse pointer
    .style("background-color", "rgba(0, 0, 0, 0.7)")  // Set tooltip background color
    .style("color", "white")  // Set text color to white
    .style("padding", "5px 10px") // Apply padding for better readability
    .style("border-radius", "4px")  // Set it to be rounded corners
    .style("visibility", "hidden"); // Hide tooltip

  // Create bars with animation
  svg.selectAll(".bar")
      .data(data) // Convert data to bars
      .enter().append("rect") // Create rectangle shape for each data point
      .attr("class", "bar")
      .attr("x", d => x(d.year))  // Position according to year
      .attr("y", height)  // Start from chart base for animation
      .attr("width", x.bandwidth()) // Set width of each bar
      .attr("height", 0) // Initial height 0 for animation
      .attr("fill", "steelblue")  // Set bar color to steelblue
      .transition() // Transition for entrance effect
      .duration(750)  // Set the animation duration
      .attr("y", d => y(d.price)) // The final y position according to price
      .attr("height", d => height - y(d.price));  // Set final height of bar according to price

  // Add line graph with animation
  const line = d3.line()
      .x(d => x(d.year) + x.bandwidth() / 2)  // Set the line points to the centre within bars
      .y(d => y(d.price));  // Map y position to price

  // Create line path and apply transition
  const linePath = svg.append("path")
      .datum(data)  // Convert data to line
      .attr("class", "line")
      .attr("fill", "none") // Set the fill for line path to none
      .attr("stroke", "red")  // Set line color to red 
      .attr("stroke-width", 2)  // Set line thickness
      .attr("d", line);

  // Animate line drawing
  const totalLength = linePath.node().getTotalLength(); // Get total line length
  linePath.attr("stroke-dasharray", totalLength)
          .attr("stroke-dashoffset", totalLength) // Offset entire length initially
          .transition() // Apply animation to the line 
          .duration(2000) // Set the animation duration
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);  // Display line by reducing offset to 0

  // Add hover effects for bars to display tooltip and change color
  svg.selectAll(".bar")
      .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).transition() // Highlight bar on hover
              .duration(200)
              .attr("fill", "orange") // Change the color of bar to orange upon hover
              .attr("opacity", 0.7);  // Reduce opacity
          tooltip.style("visibility", "visible")  // Show tooltip
              .text(`Year: ${d.year}, Normalized Price: ${d.price}`)  // Display year and price
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", (event) => {
          tooltip.style("left", (event.pageX + 5) + "px") // Move tooltip with cursor
                 .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", (event) => {
          d3.select(event.currentTarget).transition() // Reset bar color
              .duration(200)
              .attr("fill", "steelblue")  // Restore original color of the bar
              .attr("opacity", 1);  // Reset opacity
          tooltip.style("visibility", "hidden");  // Hide tooltip
      });

  // Add chart title
  svg.append("text")
      .attr("x", width / 2) // Center horizontally
      .attr("y", -10) // Position above chart
      .attr("text-anchor", "middle")  // Center text
      .style("font-size", "16px") // Set font size
      .style("font-weight", "bold") // Bold font of chart title
      .style("fill", darkMode ? '#F7F2EB' : '#333') //Adjust font color based on dark mode
      .text("Normalized Housing Prices Over Years");

  // Add x-axis label
  svg.append("text")
      .attr("x", width / 2) // Center horizontally
      .attr("y", height + 35) // Position below x-axis
      .attr("text-anchor", "middle")  // Center text
      .style("font-size", "14px") // Set font size
      .style("fill", darkMode ? '#F7F2EB' : '#333') //Adjust font color based on dark mode
      .text("Year");

  // Add y-axis label
  svg.append("text")
      .attr("transform", "rotate(-90)") // Rotate text
      .attr("y", -41) // Position at the left of y-axis
      .attr("x", -height / 2) // Center vertically relative to chart height
      .attr("text-anchor", "middle")  // Center text
      .style("font-size", "14px") // Set font size
      .style("fill", darkMode ? '#F7F2EB' : '#333') //Adjust font color based on dark mode
      .text("Normalized Housing Price");
};

// Handle modification of prediction details
const handleModifyDetails = () => {
  // Show the form again and hide the prediction details section
  setFormVisible(true);
  setPredictionDetailsVisible(false);
};
  
  return (
    // Main container with flex layout and conditional styling based on dark mode
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: '375px', maxWidth: '100vw', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333', overflowX: 'auto' }}>
      {/* Main content container */}
      <Container component="main" sx={{ mt: 5, mb: 3, flex: 1, overflowX: 'auto' }}>
       {/* Place the image and description at the top */}
       <Box sx={{ mb: 4, textAlign: 'center' }}>
          <img
            src="/images/housing.jpg"
            alt="Housing"
            style={{
              width: '90%',          // Full width of the container
              maxWidth: '500px',       // Limits max width to 500px for larger screens      
              maxHeight: '300px',
              objectFit: 'cover',
              borderRadius: '12px'
            }}
          />
            {/* Displays the description of the chart */}
          <Typography 
            variant="subtitle1" 
            component="p" 
            sx={{ mt: 2, fontWeight: 'bold', fontSize: '1.25rem' }} // Adjust fontSize as needed
          >
            This is a prediction bar chart using Gradient Boosting Model
          </Typography>
        </Box>

        {/* Prediction details form section */}
        {formVisible && (
          <Box sx={{ mb: 4, backgroundColor: darkMode ? '#fff' : '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Enter Prediction Details
            </Typography>

            {/* Dropdown selection for region */}
            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Region</FormLabel>
              <Select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>Select Region</MenuItem>
                <MenuItem value="Northern Metropolitan">Northern Metropolitan</MenuItem>
                <MenuItem value="Eastern Metropolitan">Eastern Metropolitan</MenuItem>
                <MenuItem value="Southern Metropolitan">Southern Metropolitan</MenuItem>
                <MenuItem value="Western Metropolitan">Western Metropolitan</MenuItem>
                <MenuItem value="South-Eastern Metropolitan">South-Eastern Metropolitan</MenuItem>
                <MenuItem value="Northern Victoria">Northern Victoria</MenuItem>
                <MenuItem value="Eastern Victoria">Eastern Victoria</MenuItem>
                <MenuItem value="Western Victoria">Western Victoria</MenuItem>
              </Select>
            </FormControl>

            {/* Dropdown selection for property type */}
            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Type of House</FormLabel>
              <Select
                value={houseType}
                onChange={(e) => setHouseType(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>Select House Type</MenuItem>
                <MenuItem value="unit">Unit</MenuItem>
                <MenuItem value="house">House</MenuItem>
                <MenuItem value="townhouse">Townhouse</MenuItem>
              </Select>
            </FormControl>

            {/* Submit button for form */}
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handlePredictionDetailsSubmit}
              disabled={!region || !houseType} // Disable if either field is not selected
            >
              Submit
            </Button>
          </Box>
        )}

        {/* Prediction details display section */}
        {predictionDetailsVisible && (
          <Box sx={{ mb: 4, backgroundColor: darkMode ? '#fff' : '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Prediction Details
            </Typography>
            
            {/* Modify Details button */}
            <Button
                variant="contained"
                color="primary"
                onClick={handleModifyDetails}
                sx={{ mt: 2 }}
              >
                Modify Details
              </Button>
            </Box>
          )}

          {/* Chart container */}
          <Box sx={{ pb: 'auto', mx: 'auto', mb: 4, width: '90%', display: 'flex', justifyContent: 'center' }}>
            {isChartVisible && (
              <div
                style={{
                  overflowX: 'auto', // Only apply overflow if isChartVisible is true
                  width: '100%',
                  maxWidth: '900px'
                }}
              >
                <svg ref={chartRef} style={{ width: '800px', height: '400px' }}></svg>
              </div>
            )}
          </Box>

        </Container>
      </Box>
    );
  }

  export default Prediction2;