import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Reports from './pages/Reports'
import Rewards from './pages/Rewards'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ResponsibleDrinking from './pages/ResponsibleDrinking'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected routes with layout */}
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
    </Routes>
  )
}

export default App