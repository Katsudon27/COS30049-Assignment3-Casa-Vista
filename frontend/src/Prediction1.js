import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  AppBar, Toolbar, Typography, Container, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Switch, Snackbar,
  Alert, FormControl, FormLabel, Radio, RadioGroup, FormControlLabel, Divider, Select, MenuItem, Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Mail as MailIcon,
} from '@mui/icons-material';

function Prediction1() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [chartType, setChartType] = useState(null);
  const [formVisible, setFormVisible] = useState(true);
  const [predictionDetailsVisible, setPredictionDetailsVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [houseType, setHouseType] = useState('');
  const [error, setError] = useState('');
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const chartRef = useRef(null);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleChartSelection = (event) => {
    setChartType(event.target.value);
    chartRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePredictionDetailsSubmit = async (e) => {
    e.preventDefault();
    setPredictionDetailsVisible(true);
    setFormVisible(false);
    setLoading(true);

    try {
      // Axios call to predict house price based on region and house type
      const response = await axios.get(`http://localhost:8000/predict/${location}/${houseType}`);
      setPredictedPrice(response.data.predicted_price);
    } catch (err) {
      setError('Error predicting price. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <Typography variant="h4" color={darkMode ? '#fff' : '#333'}>Line Chart for Housing Price Prediction</Typography>;
      case 'bar':
        return <Typography variant="h4" color={darkMode ? '#fff' : '#333'}>Bar Chart for Housing Price Prediction</Typography>;
      case 'pie':
        return <Typography variant="h4" color={darkMode ? '#fff' : '#333'}>Pie Chart for Housing Price Prediction</Typography>;
      default:
        return <Typography variant="h6" color={darkMode ? '#fff' : '#333'}>Please select a chart type.</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
      <Container component="main" sx={{ mt: 2, mb: 2, flex: 1 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <img
            src="/housing.jpg"
            alt="Housing"
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </Box>

        {formVisible && (
          <Box sx={{ mb: 4, backgroundColor: darkMode ? '#fff' : '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Enter Prediction Details
            </Typography>

            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Region</FormLabel>
              <Select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                displayEmpty>
                <MenuItem value="" disabled>Select Region</MenuItem>
                <MenuItem value="All Regions">All Regions</MenuItem>
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

            <FormControl fullWidth margin="normal">
              <FormLabel color={darkMode ? '#333' : '#333'}>Type of House</FormLabel>
              <Select
                value={houseType}
                onChange={(e) => setHouseType(e.target.value)}
                displayEmpty
              >
                <MenuItem value="" disabled>Select House Type</MenuItem>
                <MenuItem value="Unit">Apartment</MenuItem>
                <MenuItem value="House">House</MenuItem>
                <MenuItem value="Townhouse">Townhouse</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              color="primary"
              onClick={handlePredictionDetailsSubmit}
              disabled={!location || !houseType}
            >
              Submit
            </Button>
          </Box>
        )}

        {predictionDetailsVisible && (
          <Button variant="contained" color="primary" onClick={() => {
            setFormVisible(true);
            setLocation('');
            setHouseType('');
            setPredictionDetailsVisible(false);
          }} sx={{ mb: 2 }}>
            Modify Details
          </Button>
        )}

        {predictionDetailsVisible && (
          <Box sx={{ mb: 4, backgroundColor: darkMode ? '#fff' : '#F7F2EB', p: 2, borderRadius: 1 }}>
            <Typography variant="h5" component="h2" gutterBottom color={darkMode ? '#333' : '#333'}>
              Choose a Chart Type
            </Typography>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ color: darkMode ? '#333' : '#333' }}>
                Select a chart for housing price prediction:
              </FormLabel>
              <RadioGroup aria-label="chart" name="chart" value={chartType} onChange={handleChartSelection}>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    value="line"
                    control={<Radio sx={{ color: darkMode ? '#333' : '#333' }} />}
                    label={<Typography sx={{ color: darkMode ? '#333' : '#333' }}>Line Chart</Typography>}
                  />
                  <FormControlLabel
                    value="bar"
                    control={<Radio sx={{ color: darkMode ? '#333' : '#333' }} />}
                    label={<Typography sx={{ color: darkMode ? '#333' : '#333' }}>Bar Chart</Typography>}
                  />
                  <FormControlLabel
                    value="pie"
                    control={<Radio sx={{ color: darkMode ? '#333' : '#333' }} />}
                    label={<Typography sx={{ color: darkMode ? '#333' : '#333' }}>Pie Chart</Typography>}
                  />
                </Box>
              </RadioGroup>
            </FormControl>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mb: 2 }}>
          {loading ? (
            <Typography variant="h6" color={darkMode ? '#fff' : '#333'}>Loading...</Typography>
          ) : (
            <Typography variant="h6" color={darkMode ? '#fff' : '#333'}>
              {predictedPrice !== null && !error ? `Predicted Price: $${predictedPrice}` : error}
            </Typography>
          )}
        </Box>

        <Box ref={chartRef} sx={{ textAlign: 'center' }}>
          {renderChart()}
        </Box>
      </Container>
    </Box>
  );
}

export default Prediction1;