import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Box,
  Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Switch, Snackbar,
  Alert, Divider, Button,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Workspaces as ClusteringIcon,
  Timeline as Prediction1Icon,
  BarChart as Prediction2Icon,
} from '@mui/icons-material';
import Prediction1 from './Prediction1';
import Prediction2 from './Prediction2';
import Clustering from './Clustering';
import { BrowserRouter as Router, Route, Routes, Link, useLocation} from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './App.css'; 



function App() {
  const [drawerOpen, setDrawerOpen] = useState(false); // Controls the visibility of the drawer
  const [darkMode, setDarkMode] = useState(false); // Toggles between the enabling and disabling of dark mode
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Controls the visibility of the snackbar
  const textColor = darkMode ? '#ffffff' : '#333333'; // Toggle text colour for dark mode
  const isMobile = useMediaQuery('(max-width: 390px)'); // Check if the screen width is 390px or less to determine if the device is mobile-sized

  // Set the visibility of the drawer to open/close
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open); // Set drawer to an open state
  };

  // Toggle dark mode and open snackbar 
  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode); // Toggle dark mode
    setSnackbarOpen(true);  // Open the snackbar 
  };

  // Close snackbar if clickaway is not triggered
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false); // Close the snackbar
  };

  return (
    <Router>
        {/* Main container for the entire application layout */}
        <Box 
          sx={{
            display: 'flex',  // Enable flexible layout
            flexDirection: 'column', // Stack children vertically
            minHeight: '100vh', // Ensure the Box takes the full height
            bgcolor: darkMode ? '#333' : '#F7F2EB', // Background color based on dark mode
            color: darkMode ? '#333' : '#333',
          }}>
          
          {/* Navigation bar component */}
          <AppBar position="static" sx={{ bgcolor: '#081F5C', width: "100%" }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* Menu icon for toggling drawer */}
              <IconButton 
                edge="start" 
                color="inherit" 
                aria-label="menu" 
                onClick={toggleDrawer(true)}
                sx={{ mr: 2 }} // Margin right to add some space between icon and buttons
              >
                <MenuIcon />
              </IconButton>
              {isMobile ? (
                <Typography variant="h6" component="div">
                  Casa Vista
                </Typography>
                ) : (
                  // Centered navigation buttons for viewing on larger screens
                  <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 3 }}>
                    <Button color="inherit" component={Link} to="/">Home</Button>
                    <Button color="inherit" component={Link} to="/clustering">Clustering</Button>
                    <Button color="inherit" component={Link} to="/prediction1">Prediction 1</Button>
                    <Button color="inherit" component={Link} to="/prediction2">Prediction 2</Button>
                  </Box>
              )}
            </Toolbar>
          </AppBar>
          
          {/* Drawer for mobile navigation */}
          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box sx={{ bgcolor: darkMode ? '#333' : '#F7F2EB', width: 250, height: '100%'}} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <List>
              {/* Drawer list items for navigation */}
              <ListItem button component={Link} to="/" key="Home">
                <ListItemIcon><HomeIcon sx={{ color: darkMode ? '#F7F2EB' : '#333' }}/></ListItemIcon>
                <ListItemText primary="Home" sx={{ color: textColor }}/>
              </ListItem>
              <ListItem button component={Link} to="/clustering" key="Clustering">
                <ListItemIcon><ClusteringIcon sx={{ color: darkMode ? '#F7F2EB' : '#333' }}/></ListItemIcon>
                <ListItemText primary="Clustering" sx={{ color: textColor }}/>
              </ListItem>
              <ListItem button component={Link} to="/prediction1" key="Prediction1">
                <ListItemIcon><Prediction1Icon sx={{ color: darkMode ? '#F7F2EB' : '#333' }}/></ListItemIcon>
                <ListItemText primary="Prediction 1" sx={{ color: textColor }}/>
              </ListItem>
              <ListItem button component={Link} to="/prediction2" key="Prediction2">
                <ListItemIcon><Prediction2Icon sx={{ color: darkMode ? '#F7F2EB' : '#333' }}/></ListItemIcon>
                <ListItemText primary="Prediction 2" sx={{ color: textColor }}/>
              </ListItem>
            </List>
              <Divider />
              <List>
                <ListItem>
                  <ListItemText primary="Dark Mode" sx={{ color: textColor }}/>
                  <Switch checked={darkMode} onChange={handleDarkModeToggle} />
                </ListItem>
              </List>
            </Box>
          </Drawer>
          
          {/* Renders animated routes with transition effect */}
          <RoutesWithAnimation darkMode={darkMode} setDarkMode={setDarkMode} />
          
          {/* Snackbar for dark mode toggle notification */}
          <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
            <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
              Dark Mode {darkMode ? 'Enabled' : 'Disabled'}
            </Alert>
          </Snackbar>
          
          {/* Footer for application */}
          <footer component="footer" style={{ bottom: 0, position: 'fixed', mt: "auto", width: "100%", backgroundColor: '#081F5C', color: '#fff', textAlign: 'center', padding: '1rem 0' }}>
            <Typography variant="body2">&copy; Casa Vista by Team H&M 2024</Typography>
          </footer>
        </Box>
    </Router>
  );
}

//Route to other pages with transitions
function RoutesWithAnimation({ darkMode, setDarkMode }) {
  const location = useLocation(); // Get the current route location

  return (
    <TransitionGroup component={null}> {/* TransitionGroup for managing route animations */}
      <CSSTransition key={location.key} timeout={300} classNames="transition">
         {/* Define routes with animations based on location changes */}
        <Routes location={location}>
          <Route
            path="/"
            element={
              <Box
                component="main"
                sx={{
                  position: 'relative',
                  flexGrow: 1,  // Fill the space
                  height: '100vh',  // Full height
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                  backgroundImage: `url('/images/housing_home.jpg')`, // Background image URL
                  backgroundSize: 'cover',  // Cover the entire area
                  backgroundPosition: 'center', // Center the image
                  backgroundRepeat: 'no-repeat',
                  padding: '20px',
                  paddingLeft: '20px',
                }}
              >
                {/* Transparent Box for Text */}
                <Box
                  sx={{
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)', // Transparent background
                    padding: '20px',
                    borderRadius: '8px', // Rounded corners
                    zIndex: 1, // Stack above other elements
                    mb: 4, // Margin at the bottom
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      color: '#091F5B', // Text color
                      fontWeight: 'bold', // Bold the text
                      lineHeight: 1.5,  // Line height for spacing
                      whiteSpace: 'pre-line',
                    }}
                  >
                    Explore the Latest{"\n"}
                    Trends in the Australian{"\n"}
                    Housing Market
                  </Typography>

                  <Typography
                    variant="h6"
                    component="p"
                    sx={{
                      color: '#091F5B', // Text color
                      fontWeight: '500',  // Semi-bold text
                      lineHeight: 1.4,  // Line height for spacing
                      mt: 2,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    Gain valuable insights into the{"\n"}
                    housing market statistics.
                  </Typography>
                </Box>

                {/* Transparent Box for Page Explanations */}
                <Box
                  sx={{
                    backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    padding: '20px',
                    borderRadius: '8px',
                    zIndex: 1,
                    mt: 4, // Margin from the main title section
                  }}
                >
                  <Typography variant="body1" component="p" sx={{ color: darkMode ? '#FFF' : '#091F5B', fontWeight: '400', lineHeight: 1.4, mt: 1 }}>
                    <strong>Clustering Page:</strong> Displays a scatter plot that shows housing price classifications based on different attributes using the DBSCAN model.
                  </Typography>
                  <Typography variant="body1" component="p" sx={{ color: darkMode ? '#FFF' : '#091F5B', fontWeight: '400', lineHeight: 1.4, mt: 1 }}>
                    <strong>Prediction 1 Page:</strong> Provides housing price predictions for selected regions and property types using a Random Forest model, with results visualized in a line chart.
                  </Typography>
                  <Typography variant="body1" component="p" sx={{ color: darkMode ? '#FFF' : '#091F5B', fontWeight: '400', lineHeight: 1.4, mt: 1 }}>
                    <strong>Prediction 2 Page:</strong> Shows housing price predictions based on selected regions and property types using a Gradient Boosting model, visualized with a bar chart for a detailed view of trends.
                  </Typography>
                </Box>

                {/* Background overlay for brightness adjustment */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                    zIndex: 0,
                  }}
                />
              </Box>
            }
          />
          {/* Additional routes with transition animations */}
          <Route path="/clustering" element={<Clustering darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/prediction1" element={<Prediction1 darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/prediction2" element={<Prediction2 darkMode={darkMode} setDarkMode={setDarkMode} />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}

export default App;
