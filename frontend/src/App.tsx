import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import GoalsPage from './pages/GoalsPage';
import CheckinPage from './pages/CheckinPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';
import WeeklyLeaderboard from './components/WeeklyLeaderboard';  // ADD THIS


function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/checkin" element={<CheckinPage />} />
      </Routes>
    </Router>
  );
}


export default App;
