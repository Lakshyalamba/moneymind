import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/transactions.css';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: '',
    note: ''
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([
        { id: 1, type: 'income', category: 'Salary', amount: 350000, date: '2024-01-15', note: 'Monthly salary payment' },
        { id: 2, type: 'expense', category: 'Food', amount: 12050, date: '2024-01-14', note: 'Grocery shopping' },
        { id: 3, type: 'expense', category: 'Transport', amount: 4500, date: '2024-01-13', note: 'Gas station' },
        { id: 4, type: 'income', category: 'Freelance', amount: 80000, date: '2024-01-12', note: 'Web design project' },
        { id: 5, type: 'expense', category: 'Bills', amount: 8530, date: '2024-01-11', note: 'Electricity bill' },
        { id: 6, type: 'expense', category: 'Shopping', amount: 25000, date: '2024-01-10', note: 'Clothing purchase' }
      ]);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
      note: transaction.note
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setTransactions(transactions.filter(t => t.id !== id));
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/transactions/${editingTransaction.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTransactions();
      setShowEditModal(false);
      setEditingTransaction(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? { ...t, ...formData } : t
      ));
      setShowEditModal(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.note.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && transaction.type === filter;
  });

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>View and manage your financial records</p>
      </div>

      <div className="transactions-container">
        <div className="controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
              onClick={() => setFilter('income')}
            >
              Income
            </button>
            <button 
              className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
              onClick={() => setFilter('expense')}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div className="header-cell">Type</div>
            <div className="header-cell">Category</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Date</div>
            <div className="header-cell">Note</div>
            <div className="header-cell">Actions</div>
          </div>
          
          <div className="table-body">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className={`table-row ${transaction.type}`}>
                <div className="table-cell type-cell">
                  <span className={`type-badge ${transaction.type}`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="table-cell">{transaction.category}</div>
                <div className={`table-cell amount-cell ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                </div>
                <div className="table-cell">{transaction.date}</div>
                <div className="table-cell note-cell">{transaction.note}</div>
                <div className="table-cell actions-cell">
                  <button onClick={() => handleEdit(transaction)} className="edit-btn">✏️</button>
                  <button onClick={() => handleDelete(transaction.id)} className="delete-btn">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="no-results">
            <p>No transactions found matching your criteria.</p>
          </div>
        )}

        {showEditModal && (
          <div className="edit-modal">
            <div className="modal-content">
              <h2>Edit Transaction</h2>
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Note</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="save-btn">Update</button>
                  <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;