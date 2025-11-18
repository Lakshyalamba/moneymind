import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import '../styles/dashboard.css';

function Dashboard() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const summaryData = {
    income: 5420.00,
    expense: 3280.50,
    balance: 2139.50
  };

  const categoryData = [
    { name: 'Food', value: 850, color: '#D4AF37' },
    { name: 'Transport', value: 420, color: '#F4E4BC' },
    { name: 'Shopping', value: 680, color: '#B8941F' },
    { name: 'Bills', value: 1330, color: '#E6D07A' }
  ];

  const monthlyData = [
    { month: 'Jan', amount: 2400 },
    { month: 'Feb', amount: 1398 },
    { month: 'Mar', amount: 2800 },
    { month: 'Apr', amount: 3908 },
    { month: 'May', amount: 2800 },
    { month: 'Jun', amount: 3280 }
  ];

  const recentTransactions = [
    { id: 1, description: 'Grocery Shopping', amount: -120.50, date: '2024-01-15' },
    { id: 2, description: 'Salary Payment', amount: 3500, date: '2024-01-14' },
    { id: 3, description: 'Coffee Shop', amount: -12.75, date: '2024-01-13' },
    { id: 4, description: 'Electricity Bill', amount: -85.30, date: '2024-01-12' },
    { id: 5, description: 'Freelance Work', amount: 800, date: '2024-01-11' }
  ];

  const topCategories = [
    { name: 'Bills', amount: 1330 },
    { name: 'Food', amount: 850 },
    { name: 'Shopping', amount: 680 }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <div className="header-right">
            <nav className="dashboard-nav">
              <Link to="/add-transaction" className="nav-link">Add Transaction</Link>
              <Link to="/transactions" className="nav-link">View Transactions</Link>
            </nav>
            <div className="profile-section">
              <div 
                className="profile-trigger" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <img 
                  src="/default-avatar.png" 
                  alt="Profile" 
                  className="profile-avatar"
                />
                <span className="profile-name">John Doe</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to="/profile" className="dropdown-item">View Profile</Link>
                  <Link to="/" className="dropdown-item">Logout</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="summary-cards">
          <div className="summary-card income">
            <div className="card-title">Total Income</div>
            <div className="card-amount">${summaryData.income.toFixed(2)}</div>
          </div>
          <div className="summary-card expense">
            <div className="card-title">Total Expense</div>
            <div className="card-amount">${summaryData.expense.toFixed(2)}</div>
          </div>
          <div className="summary-card balance">
            <div className="card-title">Balance</div>
            <div className="card-amount">${summaryData.balance.toFixed(2)}</div>
          </div>
        </section>

        <section className="charts-section">
          <div className="chart-card">
            <h3>Category Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Line type="monotone" dataKey="amount" stroke="#D4AF37" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bottom-section">
          <div className="transactions-card">
            <h3>Recent Transactions</h3>
            <ul className="transactions-list">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <h4>{transaction.description}</h4>
                    <p>{transaction.date}</p>
                  </div>
                  <div className={`transaction-amount ${transaction.amount > 0 ? 'income' : 'expense'}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="categories-card">
            <h3>Top Spending</h3>
            <ul className="categories-list">
              {topCategories.map((category, index) => (
                <li key={index} className="category-item">
                  <span className="category-name">{category.name}</span>
                  <span className="category-amount">${category.amount}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;