import { useState } from 'react';
import '../styles/transactions.css';

function Transactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const transactions = [
    { id: 1, type: 'income', category: 'Salary', amount: 3500, date: '2024-01-15', note: 'Monthly salary payment' },
    { id: 2, type: 'expense', category: 'Food', amount: 120.50, date: '2024-01-14', note: 'Grocery shopping' },
    { id: 3, type: 'expense', category: 'Transport', amount: 45.00, date: '2024-01-13', note: 'Gas station' },
    { id: 4, type: 'income', category: 'Freelance', amount: 800, date: '2024-01-12', note: 'Web design project' },
    { id: 5, type: 'expense', category: 'Bills', amount: 85.30, date: '2024-01-11', note: 'Electricity bill' },
    { id: 6, type: 'expense', category: 'Shopping', amount: 250, date: '2024-01-10', note: 'Clothing purchase' }
  ];

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
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </div>
                <div className="table-cell">{transaction.date}</div>
                <div className="table-cell note-cell">{transaction.note}</div>
              </div>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="no-results">
            <p>No transactions found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;