import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import Dashboard from './features/analytics/Dashboard';
import AddTransaction from './features/transactions/AddTransaction';
import Transactions from './features/transactions/Transactions';
import Profile from './features/auth/Profile';
import Goals from './features/goals/Goals';
import AIChat from './features/ai/AIChat';
import RecurringTransactions from './features/subscriptions/RecurringTransactions';
import Subscriptions from './features/subscriptions/Subscriptions';
import NotificationsPage from './features/notifications/NotificationsPage';
import AIFloatingWidget from './features/ai/AIFloatingWidget';
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
