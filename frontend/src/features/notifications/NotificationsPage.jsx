import { useState, useEffect } from 'react';
import { 
  FaBell, 
  FaCheck, 
  FaCheckDouble, 
  FaTrash, 
  FaExclamationTriangle, 
  FaExclamationCircle, 
  FaCalendarAlt, 
  FaCreditCard, 
  FaBullseye,
  FaSpinner
} from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../../utils/auth';
import '../../styles/dashboard.css';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      setError('Network error. Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PUT'
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    setActionLoading(true);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/notifications`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'budget_exceeded':
        return <FaExclamationCircle style={{ color: '#ef4444' }} />;
      case 'budget_warning':
        return <FaExclamationTriangle style={{ color: '#f59e0b' }} />;
      case 'upcoming_recurring':
        return <FaCalendarAlt style={{ color: '#0f766e' }} />;
      case 'upcoming_subscription':
        return <FaCreditCard style={{ color: '#8b5cf6' }} />;
      case 'goal_milestone':
        return <FaBullseye style={{ color: '#10b981' }} />;
      case 'unusual_spending':
        return <FaExclamationTriangle style={{ color: '#b45309' }} />;
      default:
        return <FaBell style={{ color: '#64748b' }} />;
    }
  };

  return (
    <div className="dashboard-content-container">
      {/* Header Panel */}
      <div className="content-header">
        <div className="welcome-section">
          <h1>Financial Alerts Center</h1>
          <p>Important budget forecasts, recurring bills, and spending anomalies</p>
        </div>
        <div className="filter-controls" style={{ gap: '1rem', border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
          {notifications.length > 0 && (
            <>
              <button 
                className="panel-header-action-btn" 
                onClick={handleMarkAllRead} 
                disabled={actionLoading}
                style={{ background: '#f1f5f9', color: '#0f766e', border: '1px solid #cbd5e1' }}
              >
                <FaCheckDouble /> Mark All Read
              </button>
              <button 
                className="panel-header-action-btn" 
                onClick={handleClearAll} 
                disabled={actionLoading}
                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5' }}
              >
                <FaTrash /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="analytics-inner-loading">
          <div className="analytics-spinner" />
          <p>Loading alerts list...</p>
        </div>
      ) : error ? (
        <div className="analytics-error-card">
          <FaExclamationCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchNotifications} className="retry-btn">Retry</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="analytics-dashboard-loading" style={{ padding: '6rem 2rem' }}>
          <FaBell style={{ fontSize: '3rem', color: '#0f766e', marginBottom: '1rem' }} />
          <h3>All Caught Up!</h3>
          <p>No new budget warnings or upcoming subscription alerts found.</p>
        </div>
      ) : (
        <div className="dashboard-subpanel-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3>Alerts History ({notifications.length})</h3>
          <div className="panel-content-list" style={{ marginTop: '1rem' }}>
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`configured-budget-row ${notif.isRead ? 'read' : 'unread'}`} 
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  gap: '1rem', 
                  alignItems: 'flex-start',
                  background: notif.isRead ? '#f8fafc' : '#ffffff',
                  borderLeft: notif.isRead ? '4px solid #e2e8f0' : '4px solid #0f766e',
                  boxShadow: notif.isRead ? 'none' : '0 2px 8px rgba(15, 118, 110, 0.04)'
                }}
              >
                <div style={{ fontSize: '1.25rem', marginTop: '0.15rem' }}>
                  {getIcon(notif.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <h4 style={{ 
                      margin: 0, 
                      fontSize: '0.98rem', 
                      color: '#0f172a',
                      fontWeight: notif.isRead ? '600' : '700'
                    }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                  {!notif.isRead && (
                    <button 
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="delete-budget-btn"
                      style={{ color: '#0f766e', padding: '0.25rem' }}
                      title="Mark as Read"
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)}
                    className="delete-budget-btn"
                    style={{ color: '#ef4444', padding: '0.25rem' }}
                    title="Delete Alert"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
