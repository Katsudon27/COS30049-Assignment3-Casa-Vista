import React, { useState, useRef, useEffect} from 'react';
import axios from 'axios';
import {
  AppBar, Toolbar, Typography, Container, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Switch, Snackbar,
  Alert, FormControl, FormLabel, Radio, RadioGroup, FormControlLabel, Divider, Select, MenuItem, Button
} from '@mui/material';
import * as d3 from 'd3';


function Classification() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [clusterColumn, setClusterColumn] = useState('');
  const [clusterData, setClusterData] = useState(null);  // State to store clustering data
  const [error, setError] = useState(null);
  const chartRef = useRef(null); 
  
  const handleChange = (event) => {
    setSelectedColumn(event.target.value);
  };

  const handleClusteringColumnSubmit = async (e) => {
    e.preventDefault();
    try{
        const response = await axios.post('http://localhost:8000/cluster', {column: selectedColumn});
    
        setClusterData(response.data.data);
        setClusterColumn(response.data.selected_column);
    }catch (err) {
        setError('Error predicting price. Please try again.');
        console.error(err);
    }
  };

  useEffect(() => {
    if (clusterData) {
      renderD3Chart();
    }
  }, [clusterData]);

  const renderD3Chart = () => {
    // Clear previous chart if it exists
    d3.select(chartRef.current).selectAll("*").remove();

    // Set up SVG dimensions and margins
    const margin = { top: 20, right: 100, bottom: 40, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales based on data
    const x = d3.scaleLinear()
      .domain(d3.extent(clusterData, d => d[clusterColumn])).nice()
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(clusterData, d => d.Price)).nice()
      .range([height, 0]);

    // Set up color scale for clusters
    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(clusterData.map(d => d.ClusterLabel))]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append("text")
      .attr("x", width)
      .attr("y", -10)
      .attr("fill", "currentColor")
      .style("text-anchor", "end")
      .text(clusterColumn);

    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("x", -10)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .style("text-anchor", "end")
      .text("Price");

    // Add points
    svg.selectAll("circle")
      .data(clusterData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d[clusterColumn]))
      .attr("cy", d => y(d.Price))
      .attr("r", 5)
      .attr("fill", d => color(d.ClusterLabel))
      .attr("opacity", 0.7);

    // Optional: Add legend
    const legend = svg.selectAll(".legend")
      .data(color.domain())
      .enter().append("g")
      .attr("class", "legend")
      .attr("transform", (d, i) => `translate(${width + 30},${i * 20})`);

    legend.append("rect")
      .attr("x", width - 18)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", color);

    legend.append("text")
      .attr("x", width - 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .style("text-anchor", "end")
      .text(d => `Cluster ${d}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
      <Container component="main" sx={{ mt: 2, mb: 2, flex: 1 }}>
          <Box sx={{ mb: 4, backgroundColor: darkMode ? '#fff' : '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Enter Clustering Details
            </Typography>

            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Column to be compared with House Price</FormLabel>
              <Select
                value={selectedColumn}
                onChange={handleChange}
                displayEmpty>
                <MenuItem value="" disabled>Select Column</MenuItem>
                <MenuItem value="NR">No. of Rooms</MenuItem>
                <MenuItem value="D">Distance from CBD</MenuItem>
                <MenuItem value="NS">No. of Properties in Suburb</MenuItem>
                <MenuItem value="TP">Total Population</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handleClusteringColumnSubmit}
            >
              Submit
            </Button>

            {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}

            <Box sx={{ mt: 4 }}>
                <div ref={chartRef}></div> {/* D3 chart container */}
            </Box>

          </Box>
      </Container>
    </Box>
  );
}

export default Classification;