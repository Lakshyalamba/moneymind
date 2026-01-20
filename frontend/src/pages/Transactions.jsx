import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { apiRequest } from '../utils/auth';
import '../styles/transactions.css';

function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    type: 'expense',
    category: '',
    date: '',
    note: ''
  });
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 7;

  useEffect(() => {
    fetchTransactions();
  }, [search, filter, sortBy, sortOrder, currentPage]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        search,
        filter,
        sortBy,
        sortOrder
      });

      const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/transactions?${params}`);

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
        setTotalPages(data.totalPages);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      navigate('/login');
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
        const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/transactions/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchTransactions();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        fetchTransactions();
        setShowEditModal(false);
        setEditingTransaction(null);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      setShowEditModal(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };



  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>View and manage your financial records</p>
      </div>

      <div className="transactions-container">
        <div className="controls">
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="sort-order-select">
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
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
            {transactions && transactions.map((transaction) => (
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
                  <button onClick={() => handleEdit(transaction)} className="edit-btn"><FaEdit /></button>
                  <button onClick={() => handleDelete(transaction.id)} className="delete-btn"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {transactions && transactions.length === 0 && (
          <div className="no-results">
            <p>No transactions found.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-btn"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="page-btn"
            >
              Last
            </button>
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