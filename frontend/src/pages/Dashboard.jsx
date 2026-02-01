import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiRequest, logout } from '../utils/auth';
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

  // Currency Converter State
  const [rupees, setRupees] = useState('');
  const [dollars, setDollars] = useState('');
  const exchangeRate = 90.23;

  // Calculator State
  const [calcDisplay, setCalcDisplay] = useState('');

  // SIP Calculator State
  const [sipAmount, setSipAmount] = useState('');
  const [sipRate, setSipRate] = useState('');
  const [sipYears, setSipYears] = useState('');
  const [sipResult, setSipResult] = useState({ invested: 0, returns: 0, total: 0 });

  // EMI Calculator State
  const [loanAmount, setLoanAmount] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanTenure, setLoanTenure] = useState('');
  const [emiResult, setEmiResult] = useState({ emi: 0, interest: 0, total: 0 });

  // FD Calculator State
  const [fdAmount, setFdAmount] = useState('');
  const [fdRate, setFdRate] = useState('');
  const [fdYears, setFdYears] = useState('');
  const [fdResult, setFdResult] = useState({ principal: 0, interest: 0, maturity: 0 });

  // GST Calculator State
  const [gstAmount, setGstAmount] = useState('');
  const [gstRate, setGstRate] = useState('18');
  const [gstResult, setGstResult] = useState({ base: 0, tax: 0, total: 0 });

  // Monthly Spending State
  const [monthlyData, setMonthlyData] = useState([]);

  const fetchTransactions = async () => {
    try {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/transactions?limit=100`);

      if (response.ok) {
        const data = await response.json();
        const transactionsList = data.transactions || [];
        setTransactions(transactionsList);

        // Calculate summary
        const income = transactionsList.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactionsList.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        setSummaryData({
          income,
          expense,
          balance: income - expense
        });

        // Calculate Monthly Spending (Last 6 Months)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          last6Months.push({
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            monthName: months[d.getMonth()]
          });
        }

        const spendingData = last6Months.map(m => {
          const monthlyAmount = transactionsList
            .filter(t => {
              const tDate = new Date(t.date);
              return t.type === 'expense' &&
                tDate.getMonth() === m.monthIndex &&
                tDate.getFullYear() === m.year;
            })
            .reduce((sum, t) => sum + t.amount, 0);

          return {
            month: m.monthName,
            amount: monthlyAmount
          };
        });

        setMonthlyData(spendingData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const pieData = [
    { name: 'Income', value: summaryData.income, color: '#28a745' },
    { name: 'Expense', value: summaryData.expense, color: '#dc3545' }
  ];

  const recentTransactions = (transactions || []).slice(0, 5).map(t => ({
    id: t.id,
    description: t.category,
    amount: t.type === 'income' ? t.amount : -t.amount,
    type: t.type,
    date: t.date
  }));

  // Currency Converter Handlers
  const handleRupeesChange = (e) => {
    const value = e.target.value;
    setRupees(value);
    setDollars(value ? (parseFloat(value) / exchangeRate).toFixed(2) : '');
  };

  const handleDollarsChange = (e) => {
    const value = e.target.value;
    setDollars(value);
    setRupees(value ? (parseFloat(value) * exchangeRate).toFixed(2) : '');
  };

  // Calculator Handlers
  const handleCalcButtonClick = (value) => {
    if (value === 'C') {
      setCalcDisplay('');
    } else if (value === '=') {
      try {
        const result = eval(calcDisplay.replace(/×/g, '*').replace(/÷/g, '/'));
        setCalcDisplay(result.toString());
      } catch {
        setCalcDisplay('Error');
      }
    } else {
      setCalcDisplay(calcDisplay + value);
    }
  };

  // SIP Calculator Handler
  const calculateSIP = () => {
    const amount = parseFloat(sipAmount) || 0;
    const rate = parseFloat(sipRate) || 0;
    const years = parseFloat(sipYears) || 0;

    const monthlyRate = rate / 12 / 100;
    const months = years * 12;
    const invested = amount * months;

    const futureValue = amount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
    const returns = futureValue - invested;

    setSipResult({
      invested: invested,
      returns: returns,
      total: futureValue
    });
  };

  // EMI Calculator Handler
  const calculateEMI = () => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = parseFloat(loanRate) || 0;
    const tenure = parseFloat(loanTenure) || 0;

    const monthlyRate = rate / 12 / 100;
    const months = tenure * 12;

    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPayment = emi * months;
    const totalInterest = totalPayment - principal;

    setEmiResult({
      emi: emi,
      interest: totalInterest,
      total: totalPayment
    });
  };

  // FD Calculator Handler
  const calculateFD = () => {
    const principal = parseFloat(fdAmount) || 0;
    const rate = parseFloat(fdRate) || 0;
    const years = parseFloat(fdYears) || 0;

    const maturityAmount = principal * Math.pow(1 + rate / 100, years);
    const interest = maturityAmount - principal;

    setFdResult({
      principal: principal,
      interest: interest,
      maturity: maturityAmount
    });
  };

  // GST Calculator Handler
  const calculateGST = () => {
    const amount = parseFloat(gstAmount) || 0;
    const rate = parseFloat(gstRate) || 0;

    const gstAmt = (amount * rate) / 100;
    const totalAmount = amount + gstAmt;

    setGstResult({
      base: amount,
      tax: gstAmt,
      total: totalAmount
    });
  };

  useEffect(() => {
    fetchUserProfile();
    fetchTransactions();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/profile`);

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
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
          {summaryData.expense > 100000 && (
            <div className="expense-alert" style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#b91c1c',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              <span>⚠️ Alert: Monthly expenses have exceeded ₹1,00,000! Please review your spending.</span>
            </div>
          )}
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
                  <button onClick={handleLogout} className="dropdown-item" style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}>Logout</button>
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
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
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
                  <input type="number" value={rupees} onChange={handleRupeesChange} placeholder="Rupees" className="tool-input" />
                  <span>₹</span>
                </div>
                <div className="input-group">
                  <input type="number" value={dollars} onChange={handleDollarsChange} placeholder="Dollars" className="tool-input" />
                  <span>$</span>
                </div>
              </div>
              <p className="rate">1 USD = ₹90.23</p>
            </div>

            <div className="tool-card">
              <h3>Calculator</h3>
              <div className="calculator">
                <input type="text" value={calcDisplay} className="calc-display" readOnly />
                <div className="calc-buttons">
                  <button className="calc-btn clear" onClick={() => handleCalcButtonClick('C')}>C</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('±')}>±</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('%')}>%</button>
                  <button className="calc-btn operator" onClick={() => handleCalcButtonClick('÷')}>÷</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('7')}>7</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('8')}>8</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('9')}>9</button>
                  <button className="calc-btn operator" onClick={() => handleCalcButtonClick('×')}>×</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('4')}>4</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('5')}>5</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('6')}>6</button>
                  <button className="calc-btn operator" onClick={() => handleCalcButtonClick('-')}>-</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('1')}>1</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('2')}>2</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('3')}>3</button>
                  <button className="calc-btn operator" onClick={() => handleCalcButtonClick('+')}>+</button>
                  <button className="calc-btn zero" onClick={() => handleCalcButtonClick('0')}>0</button>
                  <button className="calc-btn" onClick={() => handleCalcButtonClick('.')}>.</button>
                  <button className="calc-btn equals" onClick={() => handleCalcButtonClick('=')}>=</button>
                </div>
              </div>
            </div>

            <div className="tool-card">
              <h3>SIP Calculator</h3>
              <div className="sip-inputs">
                <input type="number" value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="Monthly Investment" className="tool-input" />
                <input type="number" value={sipRate} onChange={(e) => setSipRate(e.target.value)} placeholder="Annual Return (%)" className="tool-input" />
                <input type="number" value={sipYears} onChange={(e) => setSipYears(e.target.value)} placeholder="Years" className="tool-input" />
                <button className="calc-sip-btn" onClick={calculateSIP}>Calculate</button>
              </div>
              <div className="sip-result">
                <p>Invested: <span>₹{sipResult.invested.toLocaleString('en-IN')}</span></p>
                <p>Returns: <span>₹{sipResult.returns.toLocaleString('en-IN')}</span></p>
                <p>Total: <span>₹{sipResult.total.toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="tool-card">
              <h3>EMI Calculator</h3>
              <div className="sip-inputs">
                <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="Loan Amount" className="tool-input" />
                <input type="number" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} placeholder="Interest Rate (%)" className="tool-input" />
                <input type="number" value={loanTenure} onChange={(e) => setLoanTenure(e.target.value)} placeholder="Tenure (Years)" className="tool-input" />
                <button className="calc-emi-btn" onClick={calculateEMI}>Calculate EMI</button>
              </div>
              <div className="sip-result">
                <p>Monthly EMI: <span>₹{emiResult.emi.toLocaleString('en-IN')}</span></p>
                <p>Total Interest: <span>₹{emiResult.interest.toLocaleString('en-IN')}</span></p>
                <p>Total Payment: <span>₹{emiResult.total.toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="tool-card">
              <h3>FD Calculator</h3>
              <div className="sip-inputs">
                <input type="number" value={fdAmount} onChange={(e) => setFdAmount(e.target.value)} placeholder="Principal Amount" className="tool-input" />
                <input type="number" value={fdRate} onChange={(e) => setFdRate(e.target.value)} placeholder="Interest Rate (%)" className="tool-input" />
                <input type="number" value={fdYears} onChange={(e) => setFdYears(e.target.value)} placeholder="Years" className="tool-input" />
                <button className="calc-fd-btn" onClick={calculateFD}>Calculate FD</button>
              </div>
              <div className="sip-result">
                <p>Principal: <span>₹{fdResult.principal.toLocaleString('en-IN')}</span></p>
                <p>Interest: <span>₹{fdResult.interest.toLocaleString('en-IN')}</span></p>
                <p>Maturity: <span>₹{fdResult.maturity.toLocaleString('en-IN')}</span></p>
              </div>
            </div>

            <div className="tool-card">
              <h3>GST Calculator</h3>
              <div className="sip-inputs">
                <input type="number" value={gstAmount} onChange={(e) => setGstAmount(e.target.value)} placeholder="Amount" className="tool-input" />
                <select value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="tool-input">
                  <option value="5">5% GST</option>
                  <option value="12">12% GST</option>
                  <option value="18">18% GST</option>
                  <option value="28">28% GST</option>
                </select>
                <button className="calc-gst-btn" onClick={calculateGST}>Calculate GST</button>
              </div>
              <div className="sip-result">
                <p>Base Amount: <span>₹{gstResult.base.toLocaleString('en-IN')}</span></p>
                <p>GST Amount: <span>₹{gstResult.tax.toLocaleString('en-IN')}</span></p>
                <p>Total Amount: <span>₹{gstResult.total.toLocaleString('en-IN')}</span></p>
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