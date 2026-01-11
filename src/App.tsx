import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Info from './pages/Info';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.svg" alt="Cashplan Logo" className="w-24 h-24 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-purple-300">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Login />
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Header />
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/info" element={<Info />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
