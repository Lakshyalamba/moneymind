import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBullseye, FaEdit, FaTrash, FaTimes, FaCheckCircle, FaCalendarAlt, FaPlus, FaTrophy, FaRocket, FaHourglassHalf } from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import '../styles/goals.css';

function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/goals`);
      if (response.ok) {
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + (parseFloat(g.targetAmount) || 0), 0);
    const totalSaved = goals.reduce((s, g) => s + (parseFloat(g.currentAmount) || 0), 0);
    const completed = goals.filter(g => calculateProgress(g.currentAmount, g.targetAmount) >= 100).length;
    return { totalTarget, totalSaved, completed, total: goals.length };
  }, [goals]);

  function calculateProgress(current, target) {
    return target > 0 ? Math.min((parseFloat(current) / parseFloat(target)) * 100, 100) : 0;
  }

  function daysRemaining(deadline) {
    const diff = new Date(deadline) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getProgressColor(pct) {
    if (pct >= 100) return '#10b981';
    if (pct >= 75) return '#14b8a6';
    if (pct >= 50) return '#f59e0b';
    if (pct >= 25) return '#f97316';
    return '#ef4444';
  }

  function getProgressEmoji(pct) {
    if (pct >= 100) return <FaTrophy />;
    if (pct >= 75) return <FaRocket />;
    if (pct >= 50) return <FaHourglassHalf />;
    return <FaBullseye />;
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingGoal) {
        response = await apiRequest(`${API_BASE_URL}/api/goals/${editingGoal.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        response = await apiRequest(`${API_BASE_URL}/api/goals`, {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (response.ok) {
        fetchGoals();
        resetForm();
      } else if (response.status === 401) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        const response = await apiRequest(`${API_BASE_URL}/api/goals/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchGoals();
        }
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', targetAmount: '', currentAmount: '', deadline: '' });
    setShowForm(false);
    setEditingGoal(null);
  };

  return (
    <>
      <div className="page-header">
        <h1>Savings Goals</h1>
        <p>Track and achieve your financial objectives</p>
      </div>

      {!loading && goals.length > 0 && (
        <div className="gl-summary-bar">
          <div className="gl-summary-item">
            <div className="gl-summary-icon target"><FaBullseye /></div>
            <div>
              <div className="gl-summary-label">Total Target</div>
              <div className="gl-summary-value">₹{summary.totalTarget.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="gl-summary-divider"></div>
          <div className="gl-summary-item">
            <div className="gl-summary-icon saved"><FaRocket /></div>
            <div>
              <div className="gl-summary-label">Total Saved</div>
              <div className="gl-summary-value">₹{summary.totalSaved.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="gl-summary-divider"></div>
          <div className="gl-summary-item">
            <div className="gl-summary-icon count"><FaCheckCircle /></div>
            <div>
              <div className="gl-summary-label">Completed</div>
              <div className="gl-summary-value">{summary.completed}/{summary.total}</div>
            </div>
          </div>
        </div>
      )}

      <div className="gl-toolbar">
        <button className="gl-add-btn" onClick={() => setShowForm(true)}>
          <FaPlus /> Add New Goal
        </button>
      </div>

      {loading ? (
        <div className="gl-loading">
          <div className="gl-spinner"></div>
          <p>Loading your goals...</p>
        </div>
      ) : (
        <>
          <div className="gl-grid">
            {goals.map((goal, i) => {
              const pct = calculateProgress(goal.currentAmount, goal.targetAmount);
              const days = daysRemaining(goal.deadline);
              const color = getProgressColor(pct);
              const remaining = (parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount)).toFixed(2);

              return (
                <div key={goal.id} className="gl-card" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
                  <div className="gl-card-accent" style={{ background: `linear-gradient(90deg, ${color}, ${color}dd)` }}></div>
                  <div className="gl-card-body">
                    <div className="gl-card-top">
                      <div className="gl-card-icon-wrap" style={{ background: `${color}18`, color }}>
                        {getProgressEmoji(pct)}
                      </div>
                      <div className="gl-card-actions">
                        <button onClick={() => handleEdit(goal)} className="gl-action-btn edit" title="Edit"><FaEdit /></button>
                        <button onClick={() => handleDelete(goal.id)} className="gl-action-btn delete" title="Delete"><FaTrash /></button>
                      </div>
                    </div>

                    <h3 className="gl-card-title">{goal.title}</h3>

                    <div className="gl-progress-section">
                      <div className="gl-progress-bar" style={{ background: `${color}18` }}>
                        <div
                          className="gl-progress-fill"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}dd)` }}
                        ></div>
                      </div>
                      <div className="gl-progress-info">
                        <span className="gl-progress-pct" style={{ color }}>{pct.toFixed(1)}%</span>
                        {pct >= 100 ? (
                          <span className="gl-progress-done">Goal achieved!</span>
                        ) : (
                          <span className="gl-progress-left">₹{parseFloat(remaining).toLocaleString('en-IN')} left</span>
                        )}
                      </div>
                    </div>

                    <div className="gl-amounts">
                      <div className="gl-amount-item">
                        <span className="gl-amount-label">Target</span>
                        <span className="gl-amount-value">₹{parseFloat(goal.targetAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="gl-amount-divider"></div>
                      <div className="gl-amount-item">
                        <span className="gl-amount-label">Saved</span>
                        <span className="gl-amount-value">₹{parseFloat(goal.currentAmount).toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="gl-deadline">
                      <FaCalendarAlt className="gl-deadline-icon" />
                      <span>
                        {days > 0 ? `${days} days remaining` : days === 0 ? 'Due today' : 'Overdue'}
                      </span>
                      <span className="gl-deadline-date">{new Date(goal.deadline).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {goals.length === 0 && (
            <div className="gl-empty">
              <div className="gl-empty-icon"><FaBullseye /></div>
              <h3>No goals yet</h3>
              <p>Start by creating your first savings goal</p>
              <button className="gl-add-btn" onClick={() => setShowForm(true)}>
                <FaPlus /> Create Your First Goal
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="gl-modal-overlay" onClick={resetForm}>
          <div className="gl-modal" onClick={e => e.stopPropagation()}>
            <button className="gl-modal-close" onClick={resetForm}><FaTimes /></button>
            <h2>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="gl-form-group">
                <label>Goal Name</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g., Emergency Fund" required />
              </div>
              <div className="gl-form-row">
                <div className="gl-form-group">
                  <label>Target Amount (₹)</label>
                  <input type="number" name="targetAmount" value={formData.targetAmount} onChange={handleInputChange} step="0.01" placeholder="1,00,000" required />
                </div>
                <div className="gl-form-group">
                  <label>Saved So Far (₹)</label>
                  <input type="number" name="currentAmount" value={formData.currentAmount} onChange={handleInputChange} step="0.01" placeholder="25,000" required />
                </div>
              </div>
              <div className="gl-form-group">
                <label>Deadline</label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} required />
              </div>
              <div className="gl-form-actions">
                <button type="submit" className="gl-save-btn">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button type="button" className="gl-cancel-btn" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Goals;