import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaPlusCircle, 
  FaListAlt, 
  FaBullseye, 
  FaUser 
} from 'react-icons/fa';
import { apiRequest, logout, API_BASE_URL } from '../utils/auth';
import { useState, useEffect } from 'react';

function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

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

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
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
        <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
          <span className="link-icon"><FaUser /></span>
          <span className="link-text">Profile</span>
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