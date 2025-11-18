import { useState } from 'react';
import '../styles/addTransaction.css';

function AddTransaction() {
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Transaction added:', formData);
    // Reset form
    setFormData({
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      note: ''
    });
  };

  return (
    <div className="add-transaction-page">
      <div className="page-header">
        <h1>Add Transaction</h1>
        <p>Record your income and expenses</p>
      </div>

      <div className="form-container">
        <form className="transaction-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Food, Transport, Salary"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Note</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Optional description..."
              rows="3"
            />
          </div>

          <button type="submit" className="submit-button">
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddTransaction;