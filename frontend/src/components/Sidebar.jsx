import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaPlusCircle, 
  FaListAlt,
  FaBullseye,
  FaComments,
  FaCalendarAlt,
  FaCreditCard,
  FaBell
} from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import { useState, useEffect } from 'react';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
    fetchUnreadNotifications();
    const interval = setInterval(fetchUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        const unread = data.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching unread notifications:', err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/profile`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest(`${API_BASE_URL}/api/auth/logout`, { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    navigate('/login');
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">MoneyMind</h1>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
          <span className="link-icon"><FaHome /></span>
          <span className="link-text">Dashboard</span>
        </Link>
        <Link to="/add-transaction" className={`sidebar-link ${isActive('/add-transaction') ? 'active' : ''}`}>
          <span className="link-icon"><FaPlusCircle /></span>
          <span className="link-text">Add Transaction</span>
        </Link>
        <Link to="/transactions" className={`sidebar-link ${isActive('/transactions') ? 'active' : ''}`}>
          <span className="link-icon"><FaListAlt /></span>
          <span className="link-text">Transactions</span>
        </Link>
        <Link to="/goals" className={`sidebar-link ${isActive('/goals') ? 'active' : ''}`}>
          <span className="link-icon"><FaBullseye /></span>
          <span className="link-text">Goals</span>
        </Link>
        <Link to="/chat" className={`sidebar-link ${isActive('/chat') ? 'active' : ''}`}>
          <span className="link-icon"><FaComments /></span>
          <span className="link-text">Chat</span>
        </Link>
        <Link to="/recurring" className={`sidebar-link ${isActive('/recurring') ? 'active' : ''}`}>
          <span className="link-icon"><FaCalendarAlt /></span>
          <span className="link-text">Recurring Bills</span>
        </Link>
        <Link to="/subscriptions" className={`sidebar-link ${isActive('/subscriptions') ? 'active' : ''}`}>
          <span className="link-icon"><FaCreditCard /></span>
          <span className="link-text">Subscriptions</span>
        </Link>
        <Link to="/notifications" className={`sidebar-link ${isActive('/notifications') ? 'active' : ''}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="link-icon"><FaBell /></span>
            <span className="link-text">Alerts</span>
          </div>
          {unreadCount > 0 && (
            <span className="sidebar-unread-badge" style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '10px', marginRight: '0.5rem', display: 'inline-block', lineHeight: 1 }}>
              {unreadCount}
            </span>
          )}
        </Link>
      </nav>

      <div className="sidebar-profile">
        <div className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt="Profile" className="profile-avatar" />
          ) : (
            <div className="profile-initial">{getInitial(user?.name)}</div>
          )}
          <div className="profile-info">
            <span className="profile-name">{user?.name || 'User'}</span>
            <span className="profile-email">{user?.email || ''}</span>
          </div>
        </div>
        {showProfileMenu && (
          <div className="profile-dropdown">
            <Link to="/profile" className="dropdown-item">View Profile</Link>
            <button onClick={handleLogout} className="dropdown-item">Logout</button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
