import { useState, useEffect, useCallback } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaTimes, 
  FaCalendarCheck,
  FaCreditCard,
  FaExclamationTriangle
} from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import '../styles/dashboard.css';

function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [form, setForm] = useState({
    name: '',
    provider: '',
    amount: '',
    frequency: 'monthly',
    category: 'Entertainment',
    startDate: '',
    cancellationDate: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring?isSubscription=true`);
      if (response.ok) {
        const data = await response.json();
        setSubs(data);
      } else {
        setError('Failed to fetch subscriptions data');
      }
    } catch (err) {
      setError('Network error loading subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sub) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring/${sub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !sub.isActive })
      });
      if (response.ok) {
        showToast(`Subscription ${!sub.isActive ? 'activated' : 'deactivated'}`, 'success');
        fetchSubscriptions();
      }
    } catch (err) {
      showToast('Failed to update subscription status', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Subscription deleted', 'success');
        fetchSubscriptions();
      } else {
        showToast('Failed to delete subscription', 'error');
      }
    } catch (err) {
      showToast('Error deleting subscription', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingSub(null);
    setForm({
      name: '',
      provider: '',
      amount: '',
      frequency: 'monthly',
      category: 'Entertainment',
      startDate: new Date().toISOString().slice(0, 10),
      cancellationDate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sub) => {
    setEditingSub(sub);
    setForm({
      name: sub.name,
      provider: sub.provider || '',
      amount: sub.amount,
      frequency: sub.frequency,
      category: sub.category,
      startDate: sub.startDate,
      cancellationDate: sub.cancellationDate || '',
      notes: sub.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.amount || parseFloat(form.amount) <= 0 || !form.startDate) {
      showToast('Please fill in all required fields correctly', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const url = editingSub 
        ? `${API_BASE_URL}/api/recurring/${editingSub.id}` 
        : `${API_BASE_URL}/api/recurring`;
      const method = editingSub ? 'PUT' : 'POST';

      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          type: 'expense', // subscriptions are always expenses
          isSubscription: true
        })
      });

      if (response.ok) {
        showToast(editingSub ? 'Subscription updated' : 'Subscription configured', 'success');
        setShowModal(false);
        fetchSubscriptions();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save subscription', 'error');
      }
    } catch (err) {
      showToast('Network error saving details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Aggregate stats calculations
  const activeSubs = subs.filter(s => s.isActive);
  
  const calculateMonthlyCost = (sub) => {
    const amt = parseFloat(sub.amount);
    if (sub.frequency === 'daily') return amt * 30;
    if (sub.frequency === 'weekly') return amt * 4.33;
    if (sub.frequency === 'monthly') return amt;
    if (sub.frequency === 'yearly') return amt / 12;
    return amt;
  };

  const totalMonthlyCost = activeSubs.reduce((sum, s) => sum + calculateMonthlyCost(s), 0);
  const totalAnnualCost = totalMonthlyCost * 12;
  
  const largestSubscription = activeSubs.length > 0 
    ? [...activeSubs].sort((a, b) => calculateMonthlyCost(b) - calculateMonthlyCost(a))[0]
    : null;

  // Filter upcoming renewals within next 7 days
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const upcomingRenewals = activeSubs
    .map(s => {
      const [y, m, d] = s.nextOccurrence.split('-').map(Number);
      return { ...s, nextDateObj: new Date(y, m - 1, d) };
    })
    .sort((a, b) => a.nextDateObj - b.nextDateObj);

  const renewalsWithin7Days = upcomingRenewals.filter(s => s.nextDateObj <= nextWeek);

  return (
    <div className="dashboard-content-container">
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="content-header">
        <div className="welcome-section">
          <h1>Subscription Management</h1>
          <p>Track active recurring service subscriptions and costs</p>
        </div>
        <div className="filter-controls" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <button className="panel-header-action-btn" onClick={handleOpenCreate}>
            <FaPlus /> Add Subscription
          </button>
        </div>
      </div>

      {/* Aggregate metrics */}
      <div className="kpi-grid">
        <div className="kpi-analytics-card">
          <div className="kpi-top">
            <span className="kpi-title">Monthly Cost</span>
            <span className="kpi-icon-wrapper kpi-exp"><FaCreditCard /></span>
          </div>
          <div className="kpi-value">₹{totalMonthlyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="kpi-bottom-text">Calculated monthly equivalent</div>
        </div>

        <div className="kpi-analytics-card">
          <div className="kpi-top">
            <span className="kpi-title">Annual Cost</span>
            <span className="kpi-icon-wrapper kpi-inc"><FaCalendarCheck /></span>
          </div>
          <div className="kpi-value">₹{totalAnnualCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="kpi-bottom-text">Projected yearly expenditure</div>
        </div>

        <div className="kpi-analytics-card">
          <div className="kpi-top">
            <span className="kpi-title">Active Subscriptions</span>
            <span className="kpi-icon-wrapper kpi-save"><FaCheckCircle /></span>
          </div>
          <div className="kpi-value">{activeSubs.length}</div>
          <div className="kpi-bottom-text">Excludes paused plans</div>
        </div>

        {largestSubscription && (
          <div className="kpi-analytics-card">
            <div className="kpi-top">
              <span className="kpi-title">Largest Subscription</span>
              <span className="kpi-icon-wrapper kpi-rate"><FaExclamationTriangle /></span>
            </div>
            <div className="kpi-value" style={{ fontSize: '1.25rem', height: '2.7rem', display: 'flex', alignItems: 'center' }}>
              {largestSubscription.name} (₹{parseFloat(largestSubscription.amount).toLocaleString('en-IN')})
            </div>
            <div className="kpi-bottom-text">Highest equivalent cost</div>
          </div>
        )}
      </div>

      {/* Alerts for upcoming renewals */}
      {renewalsWithin7Days.length > 0 && (
        <div className="insights-panel-card" style={{ background: '#fffbeb', borderColor: '#fef3c7' }}>
          <h3 style={{ borderBottomColor: 'rgba(217, 119, 6, 0.1)' }}>
            <FaExclamationTriangle className="insight-header-icon" style={{ color: '#d97706' }} />
            Upcoming Subscription Renewals (Next 7 Days)
          </h3>
          <ul className="insights-list">
            {renewalsWithin7Days.map(sub => (
              <li key={sub.id} className="insight-item" style={{ color: '#92400e' }}>
                <strong>{sub.name}</strong> billing of ₹{parseFloat(sub.amount).toLocaleString('en-IN')} is due on <strong>{sub.nextOccurrence}</strong>.
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div className="analytics-inner-loading">
          <div className="analytics-spinner" />
          <p>Loading subscriptions...</p>
        </div>
      ) : error ? (
        <div className="analytics-error-card">
          <FaExclamationCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchSubscriptions} className="retry-btn">Retry</button>
        </div>
      ) : subs.length === 0 ? (
        <div className="analytics-dashboard-loading" style={{ padding: '6rem 2rem' }}>
          <FaCreditCard style={{ fontSize: '3rem', color: '#0f766e', marginBottom: '1rem' }} />
          <h3>No Active Subscriptions</h3>
          <p>Configure subscriptions to track your monthly and yearly software/services billings.</p>
          <button className="custom-date-btn" onClick={handleOpenCreate} style={{ marginTop: '1rem' }}>Add Subscription</button>
        </div>
      ) : (
        <div className="budget-goals-section-grid" style={{ gridTemplateColumns: '1.8fr 1fr' }}>
          {/* Active subscriptions */}
          <div className="dashboard-subpanel-card">
            <h3>Configure Subscriptions</h3>
            <div className="panel-content-list">
              {subs.map(sub => (
                <div key={sub.id} className={`configured-budget-row ${sub.isActive ? 'active' : 'paused'}`} style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a' }}>{sub.name}</h4>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{sub.provider || 'No Merchant'} • {sub.frequency}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', color: '#ef4444' }}>₹{parseFloat(sub.amount).toLocaleString('en-IN')}</span>
                      <div className="recurring-item-toggle" style={{ justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                        <label className="switch-toggle-label">
                          <input 
                            type="checkbox" 
                            checked={sub.isActive} 
                            onChange={() => handleToggleActive(sub)} 
                          />
                          <span className="switch-toggle-slider" />
                        </label>
                        <span className="switch-toggle-text">{sub.isActive ? 'Active' : 'Paused'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', color: '#64748b' }}>
                    <span>Next Billing: <strong>{sub.nextOccurrence}</strong></span>
                    {sub.cancellationDate && <span>Cancel Date: <strong>{sub.cancellationDate}</strong></span>}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                    <button className="delete-budget-btn" style={{ color: '#0f766e' }} onClick={() => handleOpenEdit(sub)}><FaEdit /> Edit</button>
                    <button className="delete-budget-btn" onClick={() => handleDelete(sub.id)}><FaTrash /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming payment calendar timeline */}
          <div className="dashboard-subpanel-card">
            <h3>Upcoming Billing Dates</h3>
            <div className="panel-content-list">
              {upcomingRenewals.length === 0 ? (
                <p className="panel-empty-state">No upcoming payments scheduled.</p>
              ) : (
                upcomingRenewals.slice(0, 6).map(sub => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f8fafc', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#1e293b' }}>{sub.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.nextOccurrence}</div>
                    </div>
                    <span style={{ fontWeight: '700', color: '#ef4444' }}>₹{parseFloat(sub.amount).toLocaleString('en-IN')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal create/edit subscription */}
      {showModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-container" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit} className="budget-config-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Subscription Name *</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Netflix Premium"
                    className="tool-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Provider / Merchant</label>
                  <input 
                    type="text" 
                    value={form.provider} 
                    onChange={e => setForm(prev => ({ ...prev, provider: e.target.value }))}
                    placeholder="e.g. Netflix India"
                    className="tool-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Billing Amount (₹) *</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 649"
                    className="tool-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Billing Cycle *</label>
                  <select 
                    value={form.frequency} 
                    onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="tool-input"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="tool-input"
                  >
                    <option value="Entertainment">Entertainment</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Housing">Housing</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Food & Dining">Food & Dining</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Next Billing Date *</label>
                  <input 
                    type="date" 
                    value={form.startDate} 
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="tool-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cancellation Date (Optional)</label>
                <input 
                  type="date" 
                  value={form.cancellationDate} 
                  onChange={e => setForm(prev => ({ ...prev, cancellationDate: e.target.value }))}
                  className="tool-input"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={form.notes} 
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details..."
                  className="tool-input"
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <button type="submit" className="save-budget-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingSub ? 'Save Subscription' : 'Add Subscription'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscriptions;
