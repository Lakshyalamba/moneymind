import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Transactions from './pages/Transactions';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import AIChat from './pages/AIChat';
import RecurringTransactions from './pages/RecurringTransactions';
import Subscriptions from './pages/Subscriptions';
import NotificationsPage from './pages/NotificationsPage';
import AIFloatingWidget from './components/AIFloatingWidget';
import AppLayout from './components/AppLayout';
import './App.css';

function AppContent() {
  const location = useLocation();

  const hideFloatingChat = ['/', '/login', '/signup', '/chat', '/dashboard'].includes(location.pathname);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-transaction" element={<AddTransaction />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/recurring" element={<RecurringTransactions />} />
          <Route path="/subscriptions" element={<Subscriptions />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
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
