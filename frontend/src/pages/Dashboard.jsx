import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import '../styles/dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summaryData, setSummaryData] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
        
        // Calculate summary
        const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        setSummaryData({
          income,
          expense,
          balance: income - expense
        });
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const pieData = [
    { name: 'Income', value: summaryData.income, color: '#28a745' },
    { name: 'Expense', value: summaryData.expense, color: '#dc3545' }
  ];

  const barData = [
    { month: 'Jan', amount: 240000 },
    { month: 'Feb', amount: 139800 },
    { month: 'Mar', amount: 980000 },
    { month: 'Apr', amount: 390800 },
    { month: 'May', amount: 480000 },
    { month: 'Jun', amount: 380000 }
  ];

  const recentTransactions = transactions.slice(0, 5).map(t => ({
    id: t.id,
    description: t.category,
    amount: t.type === 'income' ? t.amount : -t.amount,
    type: t.type,
    date: t.date
  }));

  useEffect(() => {
    fetchUserProfile();
    fetchTransactions();
    initializeTools();
  }, []);

  const initializeTools = () => {
    // Currency Converter
    const rupeesInput = document.getElementById('rupees');
    const dollarsInput = document.getElementById('dollars');
    const exchangeRate = 90.23;

    if (rupeesInput && dollarsInput) {
      rupeesInput.addEventListener('input', (e) => {
        const rupees = parseFloat(e.target.value) || 0;
        dollarsInput.value = (rupees / exchangeRate).toFixed(2);
      });

      dollarsInput.addEventListener('input', (e) => {
        const dollars = parseFloat(e.target.value) || 0;
        rupeesInput.value = (dollars * exchangeRate).toFixed(2);
      });
    }

    // Calculator
    let calcDisplay = '';
    const display = document.getElementById('calc-display');
    const buttons = document.querySelectorAll('.calc-btn');

    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const value = button.textContent;
        
        if (value === 'C') {
          calcDisplay = '';
        } else if (value === '=') {
          try {
            calcDisplay = eval(calcDisplay.replace(/×/g, '*').replace(/÷/g, '/')).toString();
          } catch {
            calcDisplay = 'Error';
          }
        } else {
          calcDisplay += value;
        }
        
        if (display) display.value = calcDisplay;
      });
    });

    // SIP Calculator
    const sipBtn = document.querySelector('.calc-sip-btn');
    if (sipBtn) {
      sipBtn.addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('sip-amount').value) || 0;
        const rate = parseFloat(document.getElementById('sip-rate').value) || 0;
        const years = parseFloat(document.getElementById('sip-years').value) || 0;
        
        const monthlyRate = rate / 12 / 100;
        const months = years * 12;
        const invested = amount * months;
        
        const futureValue = amount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
        const returns = futureValue - invested;
        
        document.getElementById('invested').textContent = `₹${invested.toLocaleString('en-IN')}`;
        document.getElementById('returns').textContent = `₹${returns.toLocaleString('en-IN')}`;
        document.getElementById('total').textContent = `₹${futureValue.toLocaleString('en-IN')}`;
      });
    }
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profile`, {
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
            <div className="card-amount">₹{summaryData.income.toLocaleString('en-IN')}</div>
            <div className="card-quote">"Every rupee earned is a step towards freedom"</div>
          </div>
          <div className="summary-card expense">
            <div className="card-title">Total Expense</div>
            <div className="card-amount">₹{summaryData.expense.toLocaleString('en-IN')}</div>
            <div className="card-quote">"Smart spending builds wealth"</div>
          </div>
          <div className="summary-card balance">
            <div className="card-title">Balance</div>
            <div className="card-amount">₹{summaryData.balance.toLocaleString('en-IN')}</div>
            <div className="card-quote">"Your financial foundation"</div>
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
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3 className="chart-title">Monthly Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="tools-section">
          <h2 className="section-title">Financial Tools</h2>
          <div className="tools-grid">
            <div className="tool-card">
              <h3>Currency Converter</h3>
              <div className="converter-inputs">
                <div className="input-group">
                  <input type="number" id="rupees" placeholder="Rupees" className="tool-input" />
                  <span>₹</span>
                </div>
                <div className="input-group">
                  <input type="number" id="dollars" placeholder="Dollars" className="tool-input" />
                  <span>$</span>
                </div>
              </div>
              <p className="rate">1 USD = ₹90.23</p>
            </div>

            <div className="tool-card">
              <h3>Calculator</h3>
              <div className="calculator">
                <input type="text" id="calc-display" className="calc-display" readOnly />
                <div className="calc-buttons">
                  <button className="calc-btn clear">C</button>
                  <button className="calc-btn">±</button>
                  <button className="calc-btn">%</button>
                  <button className="calc-btn operator">÷</button>
                  <button className="calc-btn">7</button>
                  <button className="calc-btn">8</button>
                  <button className="calc-btn">9</button>
                  <button className="calc-btn operator">×</button>
                  <button className="calc-btn">4</button>
                  <button className="calc-btn">5</button>
                  <button className="calc-btn">6</button>
                  <button className="calc-btn operator">-</button>
                  <button className="calc-btn">1</button>
                  <button className="calc-btn">2</button>
                  <button className="calc-btn">3</button>
                  <button className="calc-btn operator">+</button>
                  <button className="calc-btn zero">0</button>
                  <button className="calc-btn">.</button>
                  <button className="calc-btn equals">=</button>
                </div>
              </div>
            </div>

            <div className="tool-card">
              <h3>SIP Calculator</h3>
              <div className="sip-inputs">
                <input type="number" id="sip-amount" placeholder="Monthly Investment" className="tool-input" />
                <input type="number" id="sip-rate" placeholder="Annual Return (%)" className="tool-input" />
                <input type="number" id="sip-years" placeholder="Years" className="tool-input" />
                <button className="calc-sip-btn">Calculate</button>
              </div>
              <div className="sip-result">
                <p>Invested: <span id="invested">₹0</span></p>
                <p>Returns: <span id="returns">₹0</span></p>
                <p>Total: <span id="total">₹0</span></p>
              </div>
            </div>
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
                    {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
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