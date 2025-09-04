import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ThemeProvider from './components/ThemeProvider';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';

// Original components
import Layout from './components/Layout';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import Rewards from './pages/Rewards';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResponsibleDrinking from './pages/ResponsibleDrinking';

// Business pages
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Authentication from './pages/Authentication';
import BusinessReports from './pages/BusinessReports';
import Settings from './pages/Settings';

// New business UI components
import BusinessLayout from './components/business/BusinessLayout';

// New consumer UI components
import ConsumerLayout from './components/consumer/ConsumerLayout';
import HomePage from './components/consumer/HomePage';
import ScanPage from './components/consumer/ScanPage';

// Auth components
import Login from './components/auth/Login';

// AI Chatbot
import AIChatbot from './components/AIChatbot';

function App() {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Determine which UI to show based on user role
  const isBusinessUser = user && hasRole(['manufacturer', 'distributor', 'admin']);

  return (
    <ThemeProvider>
      {/* AI Chatbot - Available on all pages when user is logged in */}
      {user && <AIChatbot />}
      
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Business UI routes */}
        {isBusinessUser && (
          <>
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/analytics" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/authentication" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <Authentication />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <BusinessReports />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
                <Settings />
              </ProtectedRoute>
            } />
          </>
        )}
        
        {/* Consumer UI routes */}
        {user && !isBusinessUser && (
          <>
            <Route path="/" element={<HomePage />} />
            <Route path="/scan" element={<ScanPage />} />
            <Route path="/rewards" element={<HomePage />} />
            <Route path="/history" element={<HomePage />} />
            <Route path="/report" element={<HomePage />} />
            <Route path="/profile" element={<HomePage />} />
          </>
        )}
        
        {/* Original routes with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="scan" element={<Scanner />} />
          <Route path="responsible-drinking" element={<ResponsibleDrinking />} />
          
          {/* Authenticated routes */}
          <Route path="reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="rewards" element={
            <ProtectedRoute>
              <Rewards />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Dashboard for manufacturers/distributors */}
          <Route path="dashboard" element={
            <ProtectedRoute roles={['manufacturer', 'distributor', 'admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Redirect to login if not authenticated */}
        <Route path="*" element={user ? <Navigate to="/" /> : <Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;