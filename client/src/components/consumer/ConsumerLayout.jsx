import React, { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Badge, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Drawer,
  List,
  ListItem,
  Divider,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  useMediaQuery,
  useTheme,
  Container
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  QrCodeScanner as ScanIcon,
  EmojiEvents as RewardsIcon,
  History as HistoryIcon,
  Person as ProfileIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Help as HelpIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const ConsumerLayout = ({ children, title = 'Vanguard' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [bottomNavValue, setBottomNavValue] = useState(0);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };

  const handleBottomNavChange = (event, newValue) => {
    setBottomNavValue(newValue);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Scan Product', icon: <ScanIcon />, path: '/scan' },
    { text: 'My Rewards', icon: <RewardsIcon />, path: '/rewards' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { text: 'Report', icon: <ReportIcon />, path: '/report' },
    { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" color="primary" elevation={0}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={handleNotificationMenuOpen}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.secondary.main,
                }}
              >
                U
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Side Drawer (Mobile) */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: theme.palette.primary.main,
              mr: 2,
            }}
          >
            U
          </Avatar>
          <Box>
            <Typography variant="subtitle1">User Name</Typography>
            <Typography variant="body2" color="text.secondary">
              1,250 Points
            </Typography>
          </Box>
        </Box>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem button key={item.text}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <List>
          <ListItem button>
            <ListItemIcon><HelpIcon /></ListItemIcon>
            <ListItemText primary="Help & Support" />
          </ListItem>
          <ListItem button>
            <ListItemIcon><SettingsIcon /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
      
      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <RewardsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>My Rewards</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <HistoryIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>History</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 },
        }}
      >
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" color="primary">Verification Successful!</Typography>
            <Typography variant="body2" color="text.secondary">
              You earned 50 points for verifying Premium Headphones
            </Typography>
            <Typography variant="caption" color="text.secondary">
              5 minutes ago
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2" color="error">Suspicious Product Alert</Typography>
            <Typography variant="body2" color="text.secondary">
              The Smart Watch you scanned might be counterfeit
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Yesterday
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle2">Level Up!</Typography>
            <Typography variant="body2" color="text.secondary">
              Congratulations! You've reached Level 3
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3 days ago
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Typography variant="body2" color="text.secondary" align="center">
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 },
          pb: { xs: 7, sm: 3 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
      
      {/* Bottom Navigation (Mobile) */}
      {isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
          }}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={handleBottomNavChange}
            showLabels
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Scan" icon={<ScanIcon />} />
            <BottomNavigationAction label="Rewards" icon={<RewardsIcon />} />
            <BottomNavigationAction label="Profile" icon={<ProfileIcon />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default ConsumerLayout;