import React, { useContext, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getThemeByRole } from '../themes';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Theme provider component that applies the appropriate theme based on user role
 * Business users get a formal, professional theme
 * Consumer users get a friendly, engaging theme
 */
const ThemeProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // Determine the appropriate theme based on user role
  const theme = useMemo(() => {
    const role = user?.role || 'consumer';
    return getThemeByRole(role);
  }, [user]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;