import React, { useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Typography, Button, Box, FormControl,FormLabel, Snackbar, Alert, MenuItem, Select
} from '@mui/material';
import {
  Download as DownloadIcon,
} from '@mui/icons-material';

function Prediction1({darkMode}) {
  const [region, setRegion] = useState(''); // Select the region variable
  const [propertype, setPropertyType] = useState(''); // Select the property type variable
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snack bar for user input
  const [chartVisible, setChartVisible] = useState(false); // Visibility of the line chart
  const chartRef = useRef();

  // Random Forest line chart code
  // Set the region variable to user choice
  const handleRegionChange = (event) => {
    setRegion(event.target.value);
  };

  // set the type of property to user choice
  const handlePropertyTypeChange = (event) => {
    setPropertyType(event.target.value);
  };

  // get price from year 2016 to 2018 data from backend
  const fetchHistoryData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/get_year_price/', { // connect backend and run get_year_price method
        method: 'POST', // method for get_year_price method is post
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ region: region, property_type: propertype }), // connect variables from frontend with backend
      });
      const data = await response.json();
      console.log("Fetched historical data:", data); // log to see if the data fetched is correct
  
      // Check if the data is an array
      if (Array.isArray(data)) {
        return data; // return data if its valid
      } else {
        console.error('Fetched data is not an array:', data);
        return []; // if its not an array, return empty array
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return []; // return empty array when error
    }
  };
  
  // get predicted price from year 2019 to 2020 data from backend
  const fetchPredictionData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/predict/', { // connect backend and use predict method
        method: 'POST', // method for predict method is post
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ region: region, property_type: propertype }), // connect variables from frontend with backend
      });
      const result = await response.json();
      return result.predicted_price; // return the predicted price
    } catch (error) {
      console.error('Error fetching prediction data:', error);
      return []; // return empty array when error
    }
  };

  // handle the submission for displaying the line chart
  const handleSubmit = async () => {
    setChartVisible(true); // display the line chart
    setOpenSnackbar(true); // display snack bar for user input changes

    const historicaldata = await fetchHistoryData(); // get data for year 2016 to 2018
    const predictionprice = await fetchPredictionData(); // get data for prediction price

    // format the historical data
    const formathistoricaldata = historicaldata.map(data => ({
      year: parseInt(data["Year Sold"], 10), // set year as integer in base 10
      price: data["Price"]
    }));
  
    // format the prediction data
    const formatpredictiondata = [
        { year: 2019, price: predictionprice }, // Add predicted price for 2019
        { year: 2020, price: predictionprice }, // Add predicted price for 2020
    ];

    // merge the data together
    const mergedata = formathistoricaldata.concat(formatpredictiondata);
    
    console.log("Combined Data:", mergedata); // get log to check if the combined data is correct
    drawChart(mergedata); // use the combined data as data to draw line chart
  };

  // function to draw line chart
  const drawChart = (data) => {
    // Clear existing chart if there is any
    d3.select(chartRef.current).selectAll("*").remove();
  
    // define the margin for the chart
    const margin = { top: 40, right: 30, bottom: 50, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 400 - margin.top - margin.bottom;
  
    // create SVG container to hold and organize graphics
    const svg = d3.select(chartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
  
    // Add title for the line chart
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .attr("text-anchor", "middle") // set the title to center
      .style("font-size", "16px") // set the title font sie to 16px
      .style("font-weight", "bold") // set the title font to bold
      .text("Line Chart Prediction of Normalized Price over Year"); // this is the title for the line chart
  
    // tooltip for hovering
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute") // hover exactly on the dot
      .style("background-color", "#f9f9f9")
      .style("border", "1px solid #333")
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("opacity", 0)
      .style("pointer-events", "none"); // does not react to pointer events
  
    // scale for x-axis
    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year)) // get year data for x aixs
      .range([0, width]); // width for x axis
  
    // scale for y axis
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.price)]) // get price data for y axis
      .range([height, 0]); // height for y axis
  
    // add x axis to the line chart
    svg.append("g")
      .attr("transform", `translate(0, ${height})`) // move x axis to the bottom of the chart
      .call(d3.axisBottom(x).ticks(5)); // create x axis with 5 tick marks
  
    // add y axis to the line chart
    svg.append("g")
      .call(d3.axisLeft(y)); // move y axis to the left

    // add label for x axis
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle") // place the label in the center of x aixs
      .text("Year"); // this is the label for x axis
  
    // add label for y-axis
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)") // rotate the text to display it vertically
      .attr("y", -margin.left + 15)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle") // place the label in the center of y aixs
      .text("Normalized Price"); // this is the label for y axis
  
    // generate line to connect the dots
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.price));
  
    // path for the line to create a race animation
    const path = svg.append("path")
      .datum(data) // put data to the path
      .attr("fill", "none") // initialize the fill colour to none so that it is not filled first
      .attr("stroke", "steelblue") // colour of the line
      .attr("stroke-width", 2)
      .attr("d", line); // define the path from line function
  
    const totalLength = path.node().getTotalLength(); // get the total length of the path
  
    // line drawing animation
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`) // create stroke pattern same as total length
      .attr("stroke-dashoffset", totalLength) // hide the path at the start
      .transition() // call transition to start
      .duration(4000) // duration of the animation
      .ease(d3.easeLinear) // smooth effect
      .attr("stroke-dashoffset", 0); // reveal path by setting offset
  
    // add dots at each data point
    svg.selectAll(".dot") // select all dots
      .data(data) // put data to the path
      .enter() // each data points will create a new element
      .append("circle") // dots is in circle shape
      .attr("class", "dot")
      .attr("cx", d => x(d.year)) // set x position for point to year
      .attr("cy", d => y(d.price)) // set y position for point to price
      .attr("r", 5) // set the radius
      .attr("fill", "steelblue") // set the colour for the point
      .attr("opacity", 0) // start the race with the points hidden
      .transition() // call transition to start
      .duration(1000) // duration of animation
      .delay((_, i) => i * 700) // dots appear based on their index
      .attr("opacity", 1); // reveal the dots
  
    // tooltip when hover to the points
    svg.selectAll(".dot") // select all dots
      .on("mouseover", (event, d) => { 
        const priceText = d.price !== undefined ? `${d.price.toLocaleString()}` : "Price data unavailable"; 
  
        // show the year and price when hover
        tooltip.style("opacity", 1)
          .html(`Year: ${d.year}<br>Normalized Price: ${priceText}`) // this is the content of the tooltip
          .style("left", `${event.pageX + 5}px`) // tooltip positioned at the right of the mouse
          .style("top", `${event.pageY - 28}px`); // tooltip positioned slightly above of the mouse
      })
      // information is hidden when the mouse is not on the point
      .on("mouseout", () => {
        tooltip.transition().duration(100).style("opacity", 0);
      });
  };

  // function to download the line chart as image
  const downloadChart = () => {
    const svg = chartRef.current; // get SVG element with chartref as reference
    const xmlserializer = new XMLSerializer(); // convert SVG element to string format
    const xmlString = xmlserializer.serializeToString(svg); // serialized to a string representation of xml
  
    // Get dimensions for SVG
    const svgDimensions = svg.getBoundingClientRect();
    const width = svgDimensions.width; // set width to actual SVG width
    const height = svgDimensions.height; // set height to actual SVG height

    // create canvas size same as SVG element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctwod = canvas.getContext('2d'); // get the 2d drawing

    const img = new Image(); // create an image element

    // create blob using SVG string with SVG image format
    const svgBlob = new Blob([xmlString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob); // create url for blob

    // function for image to load
    img.onload = function () {
      ctwod.drawImage(img, 0, 0, width, height); // Draw SVG image by filling the canvas dimensions
      const jpgurl = canvas.toDataURL('image/jpeg'); // convert content in canvas into jpeg format
      const link = document.createElement('a'); // create temporary link for downloading the image
      link.href = jpgurl; 
      link.download = 'linechart.jpg'; // set the filename for the download image
      document.body.appendChild(link); // allow download to works on different browsers
      link.click(); // click the link to download
      document.body.removeChild(link); // remove link after download
      URL.revokeObjectURL(url); // free up memory by releasing the blob url
    };

    img.src = url; // set the image source to blob url 
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
      
      {/* Output of Random Forest Line Chart Webpage */}
      {/* Box division for user input form */}
      <Box sx={{ mx: "auto", mt: 10, mb: 2, maxWidth: 1000, width: "90%", backgroundColor: '#F7F2EB', p: 2, borderRadius: 1 }}>
        {/* Title of the user input form */}
        <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
          Enter Prediction Details
        </Typography>
        {/* Descriptiom of the page */}
        <Typography variant="h6" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
          This is a prediction line chart using Random Forest model.
        </Typography>

        {/* Dropdown for user to select the region variable */}
        <FormControl fullWidth margin="normal">
          <FormLabel color={darkMode ? '#333' : '#333'}>Region</FormLabel>
          <Select
            value={region} // this is for the region variable
            onChange={handleRegionChange} // set the region variable based on user input
            displayEmpty>
            <MenuItem value="" disabled>Select Regions</MenuItem> {/* This cannot be selected */}
            <MenuItem value="Northern Metropolitan">Northern Metropolitan</MenuItem>
            <MenuItem value="Eastern Metropolitan">Eastern Metropolitan</MenuItem>
            <MenuItem value="Southern Metropolitan">Southern Metropolitan</MenuItem>
            <MenuItem value="Western Metropolitan">Western Metropolitan</MenuItem>
            <MenuItem value="South-Eastern Metropolitan">South-Eastern Metropolitan</MenuItem>
          </Select>
        </FormControl>

        {/* Dropdown for user to select the type of property variable */}
        <FormControl fullWidth margin="normal">
          <FormLabel color={darkMode ? '#333' : '#333'}>Type of House</FormLabel>
          <Select
            value={propertype} // this is for the type of property variable
            onChange={handlePropertyTypeChange} // set the type of property variable based on user input
            displayEmpty
          >
            <MenuItem value="" disabled>Select House Types</MenuItem> {/* This cannot be selected */}
            <MenuItem value="unit">Unit</MenuItem>
            <MenuItem value="house">House</MenuItem>
            <MenuItem value="townhouse">Townhouse</MenuItem>
          </Select>
        </FormControl>

        {/* Submit button after filling up the two variables */}
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit} // clicking the buttom will generate the line chart
          disabled={!region || !propertype} // button cannot be used if the fields are empty
        >
          Submit
        </Button>
      </Box>

        {/* Generate the line chart */}
        {chartVisible && (
            // box for the chart and the download button where download button is below the line chart
            <Box sx={{ pb: 8, mx: "auto", mb: 4, width: "90%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {/* enable slide when screen is smaller, center the chart when screen is large */}
                <div style={{ overflowX: 'auto', width: '100%', maxWidth: "900px" }}> 
                    <svg ref={chartRef} style={{ backgroundColor: darkMode ? '#F7F2EB' : '#fff', color: "#333", border: "2px solid #081F5C" }}></svg>
                </div>

                {/* Download Button */}
                <Box sx={{ mt: 2, textAlign: "center" }}>
                  <Typography 
                    variant="body1" 
                    component="span" 
                    sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'primary.main' }}
                    onClick={downloadChart}
                  >
                    <DownloadIcon sx={{ mr: 1 }} /> Download Image
                  </Typography>
                </Box>
            </Box>
        )}

        {/* Snack bar after user make changes to the input */}
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} sx={{ bottom: '60px' }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }}>
          Chart data has been updated!
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Prediction1;