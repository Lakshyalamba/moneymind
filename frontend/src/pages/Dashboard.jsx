import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  // Sample data
  const summaryData = {
    income: 5420.00,
    expense: 3280.50,
    balance: 2139.50
  };

  const pieData = [
    { name: 'Income', value: summaryData.income, color: '#28a745' },
    { name: 'Expense', value: summaryData.expense, color: '#dc3545' }
  ];

  const barData = [
    { month: 'Jan', amount: 2400 },
    { month: 'Feb', amount: 1398 },
    { month: 'Mar', amount: 9800 },
    { month: 'Apr', amount: 3908 },
    { month: 'May', amount: 4800 },
    { month: 'Jun', amount: 3800 }
  ];

  const recentTransactions = [
    { id: 1, description: 'Salary Payment', amount: 3500, type: 'income', date: '2024-01-15' },
    { id: 2, description: 'Grocery Shopping', amount: -120.50, type: 'expense', date: '2024-01-14' },
    { id: 3, description: 'Freelance Work', amount: 800, type: 'income', date: '2024-01-13' },
    { id: 4, description: 'Electricity Bill', amount: -85.30, type: 'expense', date: '2024-01-12' },
    { id: 5, description: 'Coffee Shop', amount: -12.75, type: 'expense', date: '2024-01-11' }
  ];

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3333/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user?.name || 'User'}!</h1>
            <p>Here's your financial overview</p>
          </div>
          <div className="header-right">
            <nav className="dashboard-nav">
              <Link to="/add-transaction" className="nav-link">Add Transaction</Link>
              <Link to="/transactions" className="nav-link">View Transactions</Link>
              <Link to="/goals" className="nav-link">Goals</Link>
            </nav>
            <div className="profile-section">
              <div 
                className="profile-trigger" 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                {user?.profilePhoto ? (
                  <img 
                    src={user.profilePhoto} 
                    alt="Profile" 
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-initial">
                    {getInitial(user?.name)}
                  </div>
                )}
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              {showProfileMenu && (
                <div className="profile-dropdown">
                  <Link to="/profile" className="dropdown-item">View Profile</Link>
                  <button onClick={handleLogout} className="dropdown-item" style={{border: 'none', background: 'none', width: '100%', textAlign: 'left'}}>Logout</button>
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
            <h3 className="chart-title">Income vs Expense</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Monthly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="amount" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="transactions-section">
          <div className="section-header">
            <h2 className="section-title">Recent Transactions</h2>
            <div className="action-buttons">
              <Link to="/add-transaction" className="btn btn-primary">Add Transaction</Link>
              <Link to="/transactions" className="btn btn-secondary">View All</Link>
            </div>
          </div>

          {recentTransactions.length > 0 ? (
            <ul className="transactions-list">
              {recentTransactions.map((transaction) => (
                <li key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <h4>{transaction.description}</h4>
                    <p>{transaction.date}</p>
                  </div>
                  <div className={`transaction-amount ${transaction.type}`}>
                    {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p>No transactions yet</p>
              <Link to="/add-transaction" className="btn btn-primary">Add Your First Transaction</Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;