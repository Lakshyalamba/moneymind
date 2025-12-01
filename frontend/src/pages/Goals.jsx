import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/goals.css';

function Goals() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: ''
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(response.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingGoal) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/goals/${editingGoal.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/goals`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchGoals();
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', targetAmount: '', currentAmount: '', deadline: '' });
    setShowForm(false);
    setEditingGoal(null);
  };

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="goals-page">
      <div className="page-header">
        <h1>Savings Goals</h1>
        <p>Track and achieve your financial objectives</p>
        <button 
          className="add-goal-btn"
          onClick={() => setShowForm(true)}
        >
          Add New Goal
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <div className="form-container">
            <h2>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  name="targetAmount"
                  value={formData.targetAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Saved Amount</label>
                <input
                  type="number"
                  name="currentAmount"
                  value={formData.currentAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-btn">
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="goals-grid">
        {goals.map((goal) => (
          <div key={goal.id} className="goal-card">
            <div className="goal-header">
              <h3>{goal.name}</h3>
              <div className="goal-actions">
                <button onClick={() => handleEdit(goal)} className="edit-btn">✏️</button>
                <button onClick={() => handleDelete(goal.id)} className="delete-btn">🗑️</button>
              </div>
            </div>
            <div className="goal-amounts">
              <div className="amount-item">
                <span className="label">Target:</span>
                <span className="value">${goal.targetAmount}</span>
              </div>
              <div className="amount-item">
                <span className="label">Saved:</span>
                <span className="value">${goal.currentAmount}</span>
              </div>
            </div>
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${calculateProgress(goal.currentAmount, goal.targetAmount)}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {calculateProgress(goal.currentAmount, goal.targetAmount).toFixed(1)}%
              </span>
            </div>
            <div className="goal-deadline">
              <span>Deadline: {new Date(goal.deadline).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="empty-state">
          <h3>No goals yet</h3>
          <p>Start by creating your first savings goal</p>
          <button className="add-goal-btn" onClick={() => setShowForm(true)}>
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}

export default Goals;