import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaSearch, FaArrowUp, FaArrowDown, FaWallet, FaTimes, FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { apiRequest, API_BASE_URL } from '../utils/auth';
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  useEffect(() => {
    fetchTransactions();
  }, [search, filter, categoryFilter, sortBy, sortOrder, currentPage]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit,
        search,
        filter: categoryFilter !== 'all' ? categoryFilter : filter,
        sortBy,
        sortOrder
      });

      const response = await apiRequest(`${API_BASE_URL}/api/transactions?${params}`);

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
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

  const summary = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category).filter(Boolean))];
    return cats;
  }, [transactions]);

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
        const response = await apiRequest(`${API_BASE_URL}/api/transactions/${id}`, {
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
      const response = await apiRequest(`${API_BASE_URL}/api/transactions/${editingTransaction.id}`, {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setSearch('');
    setFilter('all');
    setCategoryFilter('all');
    setSortBy('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || filter !== 'all' || categoryFilter !== 'all' || sortBy !== 'date' || sortOrder !== 'desc';

  return (
    <>
      <div className="page-header">
        <h1>Transactions</h1>
        <p>View and manage your financial records</p>
      </div>

      <div className="transactions-container">

        <div className="tx-summary-bar">
          <div className="tx-summary-item">
            <div className="tx-summary-icon income-bg"><FaArrowUp /></div>
            <div>
              <div className="tx-summary-label">Income</div>
              <div className="tx-summary-value income-text">₹{summary.income.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="tx-summary-divider"></div>
          <div className="tx-summary-item">
            <div className="tx-summary-icon expense-bg"><FaArrowDown /></div>
            <div>
              <div className="tx-summary-label">Expense</div>
              <div className="tx-summary-value expense-text">₹{summary.expense.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="tx-summary-divider"></div>
          <div className="tx-summary-item">
            <div className="tx-summary-icon balance-bg"><FaWallet /></div>
            <div>
              <div className="tx-summary-label">Balance</div>
              <div className="tx-summary-value balance-text">₹{summary.balance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        <div className="tx-controls">
          <div className="tx-search-wrap">
            <FaSearch className="tx-search-icon" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="tx-search-input"
            />
            {search && <FaTimes className="tx-search-clear" onClick={() => setSearch('')} />}
          </div>

          <div className="tx-filters-row">
            <div className="tx-type-chips">
              {['all', 'income', 'expense'].map(t => (
                <button
                  key={t}
                  onClick={() => { setFilter(t); setCategoryFilter('all'); setCurrentPage(1); }}
                  className={`tx-chip ${filter === t ? 'active' : ''} ${t !== 'all' ? t : ''}`}
                >
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div className="tx-sort-group">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="tx-select">
                <option value="date">Date</option>
                <option value="amount">Amount</option>
              </select>
              <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="tx-order-btn" title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}>
                {sortOrder === 'desc' ? <FaChevronRight /> : <FaChevronLeft />}
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="tx-clear-btn">
              <FaTimes /> Clear filters
            </button>
          )}
        </div>

        <div className="tx-table-wrap">
          <div className="tx-table">
            <div className="tx-table-head">
              <div className="tx-th">Type</div>
              <div className="tx-th">Category</div>
              <div className="tx-th">Amount</div>
              <div className="tx-th">Date</div>
              <div className="tx-th tx-th--note">Note</div>
              <div className="tx-th tx-th--actions">Actions</div>
            </div>

            <div className="tx-table-body">
              {transactions.map((t, i) => (
                <div key={t.id} className={`tx-row ${t.type}`} style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="tx-cell tx-cell-type">
                    <span className={`tx-type-badge ${t.type}`}>{t.type}</span>
                  </div>
                  <div className="tx-cell tx-cell-cat">
                    <span className="tx-cat-badge">{t.category}</span>
                  </div>
                  <div className={`tx-cell tx-cell-amount ${t.type}`}>
                    <span className="tx-amount-sign">{t.type === 'income' ? '+' : '-'}</span>
                    <span>₹{t.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="tx-cell tx-cell-date">{t.date}</div>
                  <div className="tx-cell tx-cell-note">{t.note || <span className="tx-no-note">—</span>}</div>
                  <div className="tx-cell tx-cell-actions">
                    <button onClick={() => handleEdit(t)} className="tx-action-btn edit" title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(t.id)} className="tx-action-btn delete" title="Delete"><FaTrash /></button>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="tx-empty">
                  <p>No transactions found</p>
                  {hasActiveFilters && <button onClick={clearFilters} className="tx-clear-btn">Clear filters</button>}
                </div>
              )}
            </div>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="tx-pagination">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="tx-page-btn">First</button>
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="tx-page-btn">
              <FaChevronLeft /> Prev
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (currentPage <= 4) {
                page = i + 1;
              } else if (currentPage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = currentPage - 3 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`tx-page-btn ${currentPage === page ? 'active' : ''}`}
                >
                  {page}
                </button>
              );
            })}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="tx-page-btn">
              Next <FaChevronRight />
            </button>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="tx-page-btn">Last</button>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="tx-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="tx-modal" onClick={e => e.stopPropagation()}>
            <button className="tx-modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            <h2>Edit Transaction</h2>
            <form onSubmit={handleUpdate}>
              <div className="tx-form-row">
                <div className="tx-form-group">
                  <label>Amount</label>
                  <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} step="0.01" required />
                </div>
                <div className="tx-form-group">
                  <label>Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} required>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div className="tx-form-group">
                <label>Category</label>
                <input type="text" name="category" value={formData.category} onChange={handleInputChange} required />
              </div>
              <div className="tx-form-group">
                <label>Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="tx-form-group">
                <label>Note</label>
                <textarea name="note" value={formData.note} onChange={handleInputChange} rows="3" />
              </div>
              <div className="tx-form-actions">
                <button type="submit" className="tx-save-btn">Update Transaction</button>
                <button type="button" className="tx-cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Transactions;
