import { useState, useEffect, useCallback } from 'react';
import { 
  FaPlus, 
  FaTrash, 
  FaEdit, 
  FaPlay, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaTimes, 
  FaCalendarAlt,
  FaSpinner
} from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../../utils/auth';
import '../../styles/dashboard.css';

function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  // Form Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    amount: '',
    type: 'expense',
    category: 'Food & Dining',
    frequency: 'monthly',
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRecurring = async () => {
    setLoading(true);
    setError(null);
    try {
      // Filter out subscriptions to keep them in Subscriptions panel
      const response = await apiRequest(`${API_BASE_URL}/api/recurring?isSubscription=false`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      } else {
        setError('Failed to fetch recurring transactions');
      }
    } catch (err) {
      setError('Network error. Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive })
      });
      if (response.ok) {
        showToast(`Transaction ${!item.isActive ? 'activated' : 'deactivated'}`, 'success');
        fetchRecurring();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleProcessDue = async () => {
    setProcessing(true);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring/process`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        showToast(data.message, 'success');
        fetchRecurring();
      } else {
        showToast('Failed to process recurring transactions', 'error');
      }
    } catch (err) {
      showToast('Network error processing occurrences', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring transaction? This will not remove already generated transactions.')) return;
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/recurring/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Recurring transaction deleted', 'success');
        fetchRecurring();
      } else {
        showToast('Failed to delete transaction', 'error');
      }
    } catch (err) {
      showToast('Error deleting transaction', 'error');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      name: '',
      amount: '',
      type: 'expense',
      category: 'Food & Dining',
      frequency: 'monthly',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate || '',
      notes: item.notes || ''
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
      const url = editingItem 
        ? `${API_BASE_URL}/api/recurring/${editingItem.id}` 
        : `${API_BASE_URL}/api/recurring`;
      const method = editingItem ? 'PUT' : 'POST';

      const response = await apiRequest(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (response.ok) {
        showToast(editingItem ? 'Changes saved' : 'Recurring transaction configured', 'success');
        setShowModal(false);
        fetchRecurring();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save configuration', 'error');
      }
    } catch (err) {
      showToast('Network error saving details', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

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
          <h1>Recurring Transactions</h1>
          <p>Configure scheduled income and expense transactions</p>
        </div>
        <div className="filter-controls" style={{ gap: '1rem', border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
          <button 
            className="panel-header-action-btn" 
            style={{ background: '#0f766e', color: 'white' }}
            onClick={handleProcessDue} 
            disabled={processing}
          >
            {processing ? <FaSpinner className="analytics-spinner" style={{ width: 14, height: 14, borderLeftColor: 'white' }} /> : <FaPlay />} 
            Run Generator
          </button>
          <button className="panel-header-action-btn" onClick={handleOpenCreate}>
            <FaPlus /> Configure Schedule
          </button>
        </div>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="analytics-inner-loading">
          <div className="analytics-spinner" />
          <p>Loading recurring transactions list...</p>
        </div>
      ) : error ? (
        <div className="analytics-error-card">
          <FaExclamationCircle className="error-icon" />
          <p>{error}</p>
          <button onClick={fetchRecurring} className="retry-btn">Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div className="analytics-dashboard-loading" style={{ padding: '6rem 2rem' }}>
          <FaCalendarAlt style={{ fontSize: '3rem', color: '#0f766e', marginBottom: '1rem' }} />
          <h3>No Scheduled Transactions</h3>
          <p>You have not configured any recurring income or expenses yet.</p>
          <button className="custom-date-btn" onClick={handleOpenCreate} style={{ marginTop: '1rem' }}>Create One Now</button>
        </div>
      ) : (
        <div className="recurring-list-grid">
          {items.map(item => (
            <div key={item.id} className={`recurring-item-card ${item.isActive ? 'active' : 'inactive'}`}>
              <div className="recurring-item-top">
                <div>
                  <h3 className="recurring-item-name">{item.name}</h3>
                  <span className={`recurring-item-type ${item.type}`}>
                    {item.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                  <span className="recurring-item-freq">{item.frequency}</span>
                </div>
                <div className="recurring-item-amount-col">
                  <div className={`recurring-item-amount ${item.type}`}>
                    {item.type === 'income' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="recurring-item-toggle">
                    <label className="switch-toggle-label">
                      <input 
                        type="checkbox" 
                        checked={item.isActive} 
                        onChange={() => handleToggleActive(item)} 
                      />
                      <span className="switch-toggle-slider" />
                    </label>
                    <span className="switch-toggle-text">{item.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              <div className="recurring-item-body">
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Next Date:</strong> {item.nextOccurrence}</p>
                {item.endDate && <p><strong>End Date:</strong> {item.endDate}</p>}
                {item.notes && <p className="recurring-item-notes"><em>{item.notes}</em></p>}
              </div>

              <div className="recurring-item-footer">
                <button className="item-action-btn edit" onClick={() => handleOpenEdit(item)}>
                  <FaEdit /> Edit
                </button>
                <button className="item-action-btn delete" onClick={() => handleDelete(item.id)}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-container" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Scheduled Transaction' : 'Configure Scheduled Transaction'}</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><FaTimes /></button>
            </div>

            <form onSubmit={handleSubmit} className="budget-config-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Apartment Rent"
                    className="tool-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Amount (₹) *</label>
                  <input 
                    type="number" 
                    value={form.amount} 
                    onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="e.g. 15000"
                    className="tool-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label>Type *</label>
                  <select 
                    value={form.type} 
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                    className="tool-input"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Frequency *</label>
                  <select 
                    value={form.frequency} 
                    onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="tool-input"
                  >
                    <option value="daily">Daily</option>
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
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Salary">Salary</option>
                    <option value="Housing">Housing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
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
                <label>End Date (Optional)</label>
                <input 
                  type="date" 
                  value={form.endDate} 
                  onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
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
                {submitting ? 'Configuring...' : editingItem ? 'Save Changes' : 'Schedule Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringTransactions;
