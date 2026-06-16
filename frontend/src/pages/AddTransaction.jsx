import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaCheck, FaCalendar, FaTag, FaPencilAlt } from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import '../styles/addTransaction.css';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Rent', 'Utilities', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Refund', 'Other'];

function AddTransaction() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const setCategory = (cat) => {
    setFormData({ ...formData, category: cat });
    setErrors({ ...errors, category: '' });
  };

  const setDatePreset = (preset) => {
    const today = new Date();
    let date;
    if (preset === 'today') {
      date = today;
    } else if (preset === 'yesterday') {
      date = new Date(today);
      date.setDate(date.getDate() - 1);
    } else {
      date = today;
    }
    setFormData({ ...formData, date: date.toISOString().split('T')[0] });
  };

  const validate = () => {
    const errs = {};
    if (!formData.amount || parseFloat(formData.amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!formData.category.trim()) errs.category = 'Select or enter a category';
    if (!formData.date) errs.date = 'Select a date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await apiRequest(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        const data = await response.json().catch(() => ({}));
        setErrors({ form: data.error || 'Failed to add transaction' });
      }
    } catch (error) {
      setErrors({ form: 'Error adding transaction' });
    } finally {
      setLoading(false);
    }
  };

  const formattedAmount = formData.amount
    ? `₹${parseFloat(formData.amount || 0).toLocaleString('en-IN')}`
    : '';

  return (
    <>
      <div className="page-header">
        <h1>Add Transaction</h1>
        <p>Record your income and expenses</p>
      </div>

      <div className="at-form-container">
        {success ? (
          <div className="at-success">
            <div className="at-success-icon"><FaCheck /></div>
            <h2>Transaction Added!</h2>
            <p>Redirecting to dashboard...</p>
          </div>
        ) : (
          <form className="at-form" onSubmit={handleSubmit} noValidate>
            {errors.form && <div className="at-form-error">{errors.form}</div>}

            <div className="at-type-toggle">
              <button
                type="button"
                className={`at-type-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
              >
                <FaArrowDown /> Expense
              </button>
              <button
                type="button"
                className={`at-type-btn ${formData.type === 'income' ? 'active income' : ''}`}
                onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
              >
                <FaArrowUp /> Income
              </button>
            </div>

            <div className="at-form-row">
              <div className="at-field">
                <label className="at-label">
                  <FaTag className="at-field-icon" /> Amount
                </label>
                <div className="at-amount-wrap">
                  <span className="at-currency">₹</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className={`at-input at-amount-input ${errors.amount ? 'error' : ''}`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                {formattedAmount && <span className="at-amount-preview">{formattedAmount}</span>}
                {errors.amount && <span className="at-error">{errors.amount}</span>}
              </div>

              <div className="at-field">
                <label className="at-label">
                  <FaCalendar className="at-field-icon" /> Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className={`at-input ${errors.date ? 'error' : ''}`}
                  required
                />
                <div className="at-date-presets">
                  <button type="button" className="at-date-chip" onClick={() => setDatePreset('today')}>Today</button>
                  <button type="button" className="at-date-chip" onClick={() => setDatePreset('yesterday')}>Yesterday</button>
                </div>
                {errors.date && <span className="at-error">{errors.date}</span>}
              </div>
            </div>

            <div className="at-field">
              <label className="at-label">
                <FaTag className="at-field-icon" /> Category
              </label>
              <div className="at-category-chips">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`at-cat-chip ${formData.category === cat ? 'active' : ''} ${formData.type === 'expense' ? 'expense' : 'income'}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="at-custom-cat">
                <FaPencilAlt className="at-field-icon-sm" />
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`at-input at-cat-input ${errors.category ? 'error' : ''}`}
                  placeholder="Or type a custom category..."
                />
              </div>
              {errors.category && <span className="at-error">{errors.category}</span>}
            </div>

            <div className="at-field">
              <label className="at-label">
                <FaPencilAlt className="at-field-icon" /> Note <span className="at-optional">(optional)</span>
              </label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                className="at-input at-textarea"
                placeholder="Add a note or description..."
                rows="3"
              />
            </div>

            <button type="submit" className="at-submit" disabled={loading}>
              {loading ? (
                <><span className="at-spinner"></span> Adding...</>
              ) : (
                <>Add {formData.type === 'income' ? 'Income' : 'Expense'}</>
              )}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export default AddTransaction;