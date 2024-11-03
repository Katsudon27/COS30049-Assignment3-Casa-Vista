import React, { useState, useRef, useEffect, useCallback} from 'react';
import axios from 'axios';
import { CircularProgress, Box, Card, Grid, Container, Typography, 
  FormControl, FormLabel, Select, MenuItem, Checkbox, 
  FormControlLabel, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import * as d3 from 'd3';


function Classification({darkMode}) {
  const [selectedColumn, setSelectedColumn] = useState(''); // Holds the abbreviation of the column selected by the user
  const [clusterColumn, setClusterColumn] = useState(''); // Holds the full name of the selected column sent from the back-end
  const [clusterData, setClusterData] = useState(null);  // Holds the clustered data sent from back-end
  const [clusterSummary, setClusterSummary] = useState(null); // Holds the clustered summary sent from back-end
  const [selectedClusters, setSelectedClusters] = useState([]); // Holds clusters selected by the user for filtering
  const [loading, setLoading] = useState(false); // State for loading animation
  const [error, setError] = useState(null); // State for displaying error message
  const chartRef = useRef(null); // Reference for the chart container
  const tooltipRef = useRef(null); // Reference for the chart's tooltips

  //Responsiveness
  const isTablet = window.innerWidth <= 1024 && window.innerWidth > 600; //Holds state for tablet screen size 
  const isMobile = window.innerWidth <= 600; //Holds state for phone screen size 
  
  // Change the value of the selected column when the user makes a selection via the form
  const handleChange = (event) => {
    setSelectedColumn(event.target.value);
  }

  // Fetch clustering data from the server
  const fetchData = useCallback(async () => {

    //Start loading animation
    setLoading(true);

    try{
        //Retreive JSON response from server
        const response = await axios.post('http://localhost:8000/cluster', {column: selectedColumn});

        //Parse the response and assign values to appropriate states
        setClusterData(response.data.data);
        setClusterColumn(response.data.selected_column);
        setClusterSummary(response.data.cluster_summary);

        // Extract unique cluster labels from the response data and set them as selected clusters
        setSelectedClusters([...new Set(response.data.data.map(d => d.ClusterLabel))]);

        //Set the error state to null
        setError(null);
    }catch (err) {
        //Display and log error message
        setError('Error occurred while retrieving clustering data. Please try again.');
        console.error(err);
    }

    //End the loading animation
    setLoading(false); 
  }, [selectedColumn]);

  // Fetch data automatically when `selectedColumn` changes
  useEffect(() => {
    if (selectedColumn) {
      fetchData();
    }
  }, [selectedColumn, fetchData]);

  //Function for handling the filtering feature 
  const handleClusterCheckboxChange = (event) => {

    // Parse the value of the checkbox to an integer representing the cluster
    const cluster = parseInt(event.target.value, 10);

    // Update state based on whether the checkbox is checked or unchecked
    setSelectedClusters(prev =>
      event.target.checked 
      ? [...prev, cluster] // If checked, add the cluster to `selectedClusters`
      : prev.filter(c => c !== cluster) // If unchecked, remove the cluster from `selectedClusters`
    );
  }

  // Function for rendering chart for data visualisation
  const renderClusteringChart = useCallback(() => {
    // Clear previous chart 
    d3.select(chartRef.current).selectAll("*").remove();

    // Define chart margins, width, and height 
    const margin = { top: 50, right: 100, bottom: 40, left: 50 };
    const width = (isMobile ? 500 : isTablet ? 800 : 1000) - margin.left - margin.right; //Different width for different screen sizes
    const height = (isMobile ? 300 : isTablet ? 400 : 500) - margin.top - margin.bottom; //Different height for different screen sizes

    // Append an SVG element to the chart container and apply margins
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right + 100) // Set SVG width
      .attr("height", height + margin.top + margin.bottom + (isMobile ? 50 : 10)) // Set SVG height with different height for phone screen
      .append("g") // Append group element to apply margins
      .attr("transform", `translate(${margin.left},${margin.top})`); // Translate by margin
    
    // Produce a subset of `clusterData` based on user-selected clusters
    const filteredData = clusterData.filter(d => selectedClusters.includes(d.ClusterLabel));
    
    // Select the tooltip element in the DOM 
    const tooltip = d3.select(tooltipRef.current)
    .style("background-color", "rgba(0, 0, 0, 0.7)")  // Set tooltip background color
    .style("color", "white")  // Set text color to white
    .style("padding", "5px 10px") // Apply padding for better readability
    .style("border-radius", "4px");  // Set it to be rounded corners

    // Set up scales based on filtered data
    // Set up x-axis scales
    const x = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d[clusterColumn])).nice()
      .range([0, width]);

    // Set up y-axis scales
    const y = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d.Price)).nice()
      .range([height, 0]);

    // Set up color scale for clusters
    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(clusterData.map(d => d.ClusterLabel))]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`) // Position x-axis at the bottom
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 10)) // Configure the number of ticks for the axis (less for phone screen)
      .style("font-size", "14px") // Set font size for the tick labels
      .append("text") // Append label for x-axis
      .attr("x", width/2) // Center the label horizontally along the X-axis
      .attr("y", 40) // Position the label below the X-axis ticks
      .attr("fill", "currentColor") // Use the current text color for the label
      .style("text-anchor", "middle") // Center the label text horizontally
      .style("font-size", isMobile ? "12px" : "16px") // Adjust the label font size for mobile screens
      .text(clusterColumn);  // Set the label text to the value of `clusterColumn`

     // Add Y axis
    svg.append("g") // Configure the number of ticks for the axis (less for phone screen)
    .call(d3.axisLeft(y).ticks(isMobile ? 5 : 10))
    .style("font-size", "14px");  // Set font size of tick labels

    // Add Y-axis label positioned horizontally above the y-axis
    svg.append("text")
    .attr("x", -margin.left + 10)  // Position label above the y-axis ticks
    .attr("y", -10)                // Position label above the chart area
    .attr("fill", "currentColor")
    .style("text-anchor", "start") // Align text to the start (left)
    .style("font-size", "16px")
    .text("Normalised House Price");

    // Add data points to the chart as circles
    svg.selectAll("circle")
      .data(filteredData) // Bind the filtered data to the selection
      .enter()
      .append("circle") // Append a circle element for each data point

      // Set the circle's x and y coordinates based on the data values
      .attr("cx", d => x(d[clusterColumn]))
      .attr("cy", d => y(d.Price))

      // Configure the circle's appearance 
      .attr("r", isMobile ? 3 : 5) // Adjust circle radius based on screen size (smaller on mobile)
      .attr("fill", d => color(d.ClusterLabel)) // Set fill color based on `ClusterLabel`
      .attr("opacity", 0.7) // Set opacity for a semi-transparent effect
      
      // Configure tooltip for user interaction
      .on("mouseover", (event, d) => {
        // Round the values to the nearest integer or to two decimal places as needed
        const roundedPrice = d.Price.toFixed(2); 
        const roundedClusterValue = d[clusterColumn].toFixed(2); 
        
        // When the user hovers over a data point, show the tooltip with information about the data point
        tooltip.style("opacity", 1).html(`Price: ${roundedPrice}<br/>${clusterColumn}: ${roundedClusterValue}`);
      })
      .on("mousemove", (event) => {
        // When the user moves the cursor, position the tooltip near the cursor
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        // When the user moves beyond the data point, hide the tooltip
        tooltip.style("opacity", 0);
      });
    
    // Responsive Legend Positioning
    const legendXOffset = width + 10;  // Set the X-offset for the legend to position it beside the chart
    const legendYOffset = 20;  // Set the vertical spacing between legend items

    // Add legend
    const legend = svg.selectAll(".legend")
      .data(color.domain()) // Bind color domain (unique cluster labels) to legend items
      .enter().append("g") // Append a group element (`<g>`) for each legend item
      .attr("class", "legend") // Assign class name "legend" to each group for styling
      .attr("transform", (d, i) => `translate(${legendXOffset},${i * legendYOffset})`);  // Position each legend item
    
    // Add boxes to display color for each legend item
    legend.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .style("fill", color);
    
    // Add text labels for each legend item
    legend.append("text")
      .attr("x", 24)
      .attr("y", 12)
      .style("fill", darkMode ? '#F7F2EB' : '#333') //Adjust font color based on dark mode
      .style("text-anchor", "start") // Align text to the start (left)
      .style("font-size", isMobile ? "10px" : "14px")  // Use smaller font on mobile for readability
      .text(d => `Cluster ${d}`); // Display each cluster label
  }, [clusterData, selectedClusters, clusterColumn, darkMode, isMobile, isTablet]);

  //Function for running effect when attributes changes
  useEffect(() => {
    // Check if `clusterData` is a non-empty array
    if (Array.isArray(clusterData) && clusterData.length > 0) {

      // Call function to render or update the chart with the current data
      renderClusteringChart();
    }
  }, [clusterData, selectedClusters, renderClusteringChart]);

  return (
    // Main container with flex layout and conditional styling based on dark mode
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
      
      {/* Main content container */}
      <Container component="main" sx={{ mt: 4, mb: 2, flex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Place the image and description at the top */}
          <Box sx={{mb: 4, textAlign: 'center' }}>
              <img
                src="/images/clustering_home.jpeg"
                alt="Housing"
                style={{
                  width: '100%',          // Full width of the container
                  maxWidth: '500px',       // Limits max width to 500px for larger screens
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
                Identify hidden patterns within the Housing Market using DBSCAN model
              </Typography>
          </Box>

          {/* Box division for user input form */}
          <Box sx={{ mx: "auto", mb: 2, maxWidth: 1000, width: "90%", backgroundColor: '#F7F2EB', p: 2, borderRadius: 1 }}>
            
            {/* Descriptiom of the page */}
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Enter Clustering information
            </Typography>

            {/* Dropdown for user to select column */}
            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Select column to be compared with House Price</FormLabel>
              <Select
                value={selectedColumn} // Display selection based on user input
                onChange={handleChange} // Change the value when the user makes a different selection
                displayEmpty>
                <MenuItem value="" disabled>Select Column</MenuItem>
                <MenuItem value="NR">Number of Rooms</MenuItem>
                <MenuItem value="D">Distance from CBD</MenuItem>
                <MenuItem value="NS">Number of Properties in Suburb</MenuItem>
                <MenuItem value="TP">Total Population</MenuItem>
              </Select>
            </FormControl>

            {/* Display error message */}
            {error && (
            <Typography color="error" sx={{ mt: 2, fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {error}
            </Typography>
            )}
          </Box>

            {/* Display loading animation while data is processed in the back-end */}
            {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
            ) : (
              <>
              {/* Display form to allow user to filter the rendered chart by clusters */}
              {selectedColumn && (
                // Box for the filtering form
                <Box sx={{ mt: 4 }}>

                {/* Card component for displaying form title */}
                <Card sx={{ p: { xs: 2, md: 3 }, bgcolor: '#F7F2EB', boxShadow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Filter by Cluster
                  </Typography>
            
                   {/* Grid layout to align checkboxes in a responsive grid */}
                  <Grid container spacing={2}>
                    {Array.isArray(clusterSummary) && clusterSummary.map((cluster) => (
                      <Grid item xs={6} sm={4} md={3} key={cluster.ClusterLabel}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedClusters.includes(cluster.ClusterLabel)} // Check if the cluster is selected
                              onChange={handleClusterCheckboxChange} // Event handler to toggle selection
                              value={cluster.ClusterLabel} // Set the checkbox value to the cluster label
                            />
                          }
                          label={`Cluster ${cluster.ClusterLabel}`} // Display label for each checkbox
                          sx={{ color: '#333' }} // Style to match the form text color
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Box>
              )}

              {/* Generate the line chart */}
              {clusterColumn && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 'auto',
                  width: '100%', // Full width to make it responsive
                  overflowX: { xs: 'auto', sm: 'auto', md: 'hidden' } //Only allow overflow for smaller screen sizes
                }}>
                  
                  {/* Chart container */}
                  <Box
                    ref={chartRef}
                    sx={{
                      width: '100%',
                      maxWidth: { md: '1300px' },
                      margin: { md: '0 auto' }, // Center the chart container on desktop
                      height: '100%',   // Full height based on Box height above
                    }}
                  ></Box>

                  {/* Tooltip container */}
                  <Box
                    ref={tooltipRef}
                    sx={{
                      position: 'absolute',
                      textAlign: 'center',
                      padding: '8px',
                      fontSize: { xs: '10px', sm: '12px', md: '14px' },  // Adjust font size based on screen size
                      background: 'lightgray',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      pointerEvents: 'none',
                      opacity: 0,  // Hidden by default
                    }}
                  ></Box>
                </Box>
              )}

              {/* Generate table to display cluster summary */}
              {clusterSummary && (
                // Table container with margin-top for spacing
                <TableContainer component={Paper} sx={{ mt: 2, mb: 6 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">Cluster Label</TableCell> 
                        <TableCell align="center">Average Price</TableCell> 
                        <TableCell align="center">{`Average ${clusterColumn}`}</TableCell> 
                      </TableRow>
                    </TableHead>

                    {/* Table Body for displaying each cluster's summary */}
                    <TableBody>
                      {clusterSummary.map((row, index) => (
                        <TableRow key={index}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',  // Change background color on hover
                            cursor: 'pointer',  // Cursor pointer to indicate interactivity
                          },
                          transition: 'background-color 0.3s', // Transition effect for hover
                        }}>
                          <TableCell component="th" scope="row" align="center">
                            {row.ClusterLabel} 
                          </TableCell>
                          <TableCell align="center">{row['Mean Price'].toFixed(2)}</TableCell>  
                          <TableCell align="center">{row[`Mean ${clusterColumn}`].toFixed(2)}</TableCell> 
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
            )}
      </Container>
    </Box>
  );
}

export default Classification;