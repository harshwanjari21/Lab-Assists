import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Test from './components/Test';
import Reports from './components/Reports';
import Analytics from './components/Analytics';
import Administration from './components/Administration';
import LoginPage from './pages/LoginPage';
import SettingsDropdown from './components/Settings';
import Profile from './pages/Profile';
import Security from './pages/Security';
import './App.css'
import { AuthProvider, useAuth } from './AuthContext';

function RequireAuth({ children }) {
  const location = useLocation();
  const { auth } = useAuth();
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppLayout() {
  const location = window.location.pathname;
  const { auth } = useAuth();
  const isLogin = location === '/login';

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Only hide Sidebar on login page */}
      {!isLogin && auth && <Sidebar />}
      {!isLogin && auth && <SettingsDropdown />}
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/patients" element={<RequireAuth><Patients /></RequireAuth>} />
          <Route path="/tests" element={<RequireAuth><Test /></RequireAuth>} />
          <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
          <Route path="/analytics" element={<RequireAuth><Analytics /></RequireAuth>} />
          <Route path="/administration" element={<RequireAuth><Administration /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/security" element={<RequireAuth><Security /></RequireAuth>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
