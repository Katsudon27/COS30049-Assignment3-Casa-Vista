import React, { useState } from 'react';
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
import Prediction1 from './Prediction1';
import Prediction2 from './Prediction2';
import Classification from './Classification';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [loading, setLoading] = useState(false);

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

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: darkMode ? '#333' : '#F7F2EB', color: darkMode ? '#fff' : '#333' }}>
        <AppBar position="static" sx={{ bgcolor: '#081F5C' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="menu" 
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }} // Margin right to add some space between icon and buttons
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', gap: 3 }}>
              <Button color="inherit" component={Link} to="/">Home</Button>
              <Button color="inherit" component={Link} to="/classification">Classification</Button>
              <Button color="inherit" component={Link} to="/prediction1">Prediction 1</Button>
              <Button color="inherit" component={Link} to="/prediction2">Prediction 2</Button>
            </Box>
          </Toolbar>
        </AppBar>

        <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
          <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
            <List>
              {['Home', 'About', 'Contact'].map((text, index) => (
                <ListItem button key={text}>
                  <ListItemIcon>
                    {index === 0 ? <HomeIcon /> : index === 1 ? <InfoIcon /> : <MailIcon />}
                  </ListItemIcon>
                  <ListItemText primary={text} />
                </ListItem>
              ))}
            </List>
            <Divider />
            <List>
              <ListItem>
                <ListItemText primary="Dark Mode" />
                <Switch checked={darkMode} onChange={handleDarkModeToggle} />
              </ListItem>
            </List>
          </Box>
        </Drawer>
        
        <Routes>
          <Route path="/" element={
            <Container component="main" sx={{ mt: 2, mb: 2, flex: 1 }}>
              
            </Container>
          }/>

          <Route path="/classification" element={<Classification />} />
          <Route path="/prediction1" element={<Prediction1 />} />
          <Route path="/prediction2" element={<Prediction2 />} />
        </Routes>

        <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
            Dark Mode {darkMode ? 'Enabled' : 'Disabled'}
          </Alert>
        </Snackbar>

        <Box component="footer" sx={{ p: 2, mt: 'auto', bgcolor: '#081F5C', color: '#fff', textAlign: 'center' }}>
          <Typography variant="body1">© Team H&M 2024</Typography>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
