import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import AIFloatingWidget from './components/AIFloatingWidget';
import './App.css';

function AppContent() {
  const location = useLocation();

  // Hide floating chat on landing, login, and signup pages
  const hideFloatingChat = ['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-transaction" element={<AddTransaction />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/goals" element={<Goals />} />
      </Routes>
      {!hideFloatingChat && <AIFloatingWidget />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;