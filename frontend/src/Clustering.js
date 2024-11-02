import React, { useState, useRef, useEffect} from 'react';
import axios from 'axios';
import { CircularProgress, Box, Card, Grid, Container, Typography, FormControl, FormLabel, Select, MenuItem, Checkbox, FormControlLabel, FormGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import * as d3 from 'd3';


function Classification({darkMode}) {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [clusterColumn, setClusterColumn] = useState('');
  const [clusterData, setClusterData] = useState(null);  // State to store clustering data
  const [clusterSummary, setClusterSummary] = useState(null);
  const [selectedClusters, setSelectedClusters] = useState([]);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const chartRef = useRef(null);
  const tooltipRef = useRef(null);
  const legendRef = useRef(null);

  const isTablet = window.innerWidth <= 1024 && window.innerWidth > 600; // Adjust for tablet screen size
  const isMobile = window.innerWidth <= 600; 
  
  const handleChange = (event) => {
    setSelectedColumn(event.target.value);
  }

  // Fetch data automatically when `selectedColumn` changes
  useEffect(() => {
    if (selectedColumn) {
      fetchData();
    }
  }, [selectedColumn]);

  const fetchData = async () => {
    setLoading(true);
    try{
        const response = await axios.post('http://localhost:8000/cluster', {column: selectedColumn});
    
        setClusterData(response.data.data);
        setClusterColumn(response.data.selected_column);
        setClusterSummary(response.data.cluster_summary);
        setSelectedClusters([...new Set(response.data.data.map(d => d.ClusterLabel))]);
        setError(null);
    }catch (err) {
        setError('Error predicting price. Please try again.');
        console.error(err);
    }
    setLoading(false); 
  };

  useEffect(() => {
    if (Array.isArray(clusterData) && clusterData.length > 0) {
      renderD3Chart();
    }
  }, [clusterData, selectedClusters]);

  const handleClusterCheckboxChange = (event) => {
    const cluster = parseInt(event.target.value, 10);
    setSelectedClusters(prev =>
      event.target.checked ? [...prev, cluster] : prev.filter(c => c !== cluster)
    );
  }

  const renderD3Chart = () => {
    // Clear previous chart if it exists
    d3.select(chartRef.current).selectAll("*").remove();

    // Set up SVG dimensions and margins
    const margin = { top: 50, right: 100, bottom: 40, left: 50 };
    const width = (isMobile ? 500 : isTablet ? 800 : 1000) - margin.left - margin.right;
    const height = (isMobile ? 300 : isTablet ? 400 : 500) - margin.top - margin.bottom;

    // Create SVG element
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right + 100)
      .attr("height", height + margin.top + margin.bottom + (isMobile ? 50 : 10))
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const filteredData = clusterData.filter(d => selectedClusters.includes(d.ClusterLabel));
    const tooltip = d3.select(tooltipRef.current);

    // Set up scales based on data
    const x = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d[clusterColumn])).nice()
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain(d3.extent(filteredData, d => d.Price)).nice()
      .range([height, 0]);

    // Set up color scale for clusters
    const color = d3.scaleOrdinal(d3.schemeCategory10)
      .domain([...new Set(clusterData.map(d => d.ClusterLabel))]);

    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 10))
      .style("font-size", "14px")
      .append("text")
      .attr("x", width/2)
      .attr("y", 40)
      .attr("fill", "currentColor")
      .style("text-anchor", "middle")
      .style("font-size", isMobile ? "12px" : "16px")
      .text(clusterColumn);

     // Add Y axis
    svg.append("g")
    .call(d3.axisLeft(y).ticks(isMobile ? 5 : 10))
    .style("font-size", "14px");  // Increase font size of tick labels

    // Add Y-axis label positioned horizontally above the y-axis
    svg.append("text")
    .attr("x", -margin.left + 10)  // Position label above the y-axis ticks
    .attr("y", -10)                // Position label above the chart area
    .attr("fill", "currentColor")
    .style("text-anchor", "start") // Align text to the start (left)
    .style("font-size", "16px")
    .text("Normalised House Price");

    // Add points
    svg.selectAll("circle")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d[clusterColumn]))
      .attr("cy", d => y(d.Price))
      .attr("r", isMobile ? 3 : 5)
      .attr("fill", d => color(d.ClusterLabel))
      .attr("opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip.style("opacity", 1).html(`Price: ${d.Price}<br/>${clusterColumn}: ${d[clusterColumn]}`);
      })
      .on("mousemove", (event) => {
        tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });
    
    // Responsive Legend Positioning
  const legendXOffset = isMobile ? width + 10 : width + 20;  // Adjust x-offset on smaller screens
  const legendYOffset = isMobile ? 10 : 20;

  // Add legend
  const legend = svg.selectAll(".legend")
    .data(color.domain())
    .enter().append("g")
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${legendXOffset},${i * legendYOffset})`);

  legend.append("rect")
    .attr("width", 16)
    .attr("height", 16)
    .style("fill", color);

  legend.append("text")
    .attr("x", 24)
    .attr("y", 12)
    .style("text-anchor", "start")
    .style("font-size", isMobile ? "10px" : "14px")  // Smaller font on mobile
    .text(d => `Cluster ${d}`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
      <Container component="main" sx={{ mt: 2, mb: 2, flex: 1, px: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mx: "auto", mb: 2, maxWidth: 1000, width: "90%", backgroundColor: '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Identify hidden patterns within Australia's Housing Market from 2016 to 2018
            </Typography>

            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Select column to be compared with House Price</FormLabel>
              <Select
                value={selectedColumn}
                onChange={handleChange}
                displayEmpty>
                <MenuItem value="" disabled>Select Column</MenuItem>
                <MenuItem value="NR">Number of Rooms</MenuItem>
                <MenuItem value="D">Distance from CBD</MenuItem>
                <MenuItem value="NS">Number of Properties in Suburb</MenuItem>
                <MenuItem value="TP">Total Population</MenuItem>
              </Select>
            </FormControl>

            {error && (
            <Typography color="error" sx={{ mt: 2, fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {error}
            </Typography>
            )}

            {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
            ) : (
              <>
              {selectedColumn && (
                <Box sx={{ mt: 4 }}>
                <Card sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f9f9f9', boxShadow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2, color: '#333', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Filter by Cluster
                  </Typography>
            
                  {/* Arranged in a grid layout to align checkboxes */}
                  <Grid container spacing={2}>
                    {Array.isArray(clusterSummary) && clusterSummary.map((cluster) => (
                      <Grid item xs={6} sm={4} md={3} key={cluster.ClusterLabel}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedClusters.includes(cluster.ClusterLabel)}
                              onChange={handleClusterCheckboxChange}
                              value={cluster.ClusterLabel}
                            />
                          }
                          label={`Cluster ${cluster.ClusterLabel}`}
                          sx={{ color: '#333' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Box>
              )}

              {clusterColumn && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  // Adjust height based on screen size
                  height: 'auto',
                  width: '100%', // Full width to make it responsive
                  overflowX: { xs: 'auto', sm: 'auto', md: 'hidden' }
                }}>
                   {/* Chart container */}
                <Box
                  ref={chartRef}
                  sx={{
                    width: { xs: '100%', sm: '100%', md: '100%' },
                    maxWidth: { md: '800px' },
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

              {clusterSummary && (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Cluster Label</TableCell>
                      <TableCell align="center">Average Price</TableCell>
                      <TableCell align="center">{`Average ${clusterColumn}`}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {clusterSummary.map((row, index) => (
                      <TableRow key={index}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',  // Light gray on hover
                          cursor: 'pointer',  // Cursor pointer to indicate interactivity
                        },
                        transition: 'background-color 0.3s', // Smooth transition effect
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
          </Box>
      </Container>
    </Box>
  );
}

export default Classification;