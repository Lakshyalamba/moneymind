import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaWallet, 
  FaRobot, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaSave, 
  FaTimes, 
  FaPlus, 
  FaLightbulb,
  FaExchangeAlt,
  FaPercentage,
  FaHeartbeat,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { apiRequest, API_BASE_URL } from '../../utils/auth';
import FinanceChatPanel from '../ai/FinanceChatPanel';
import { useFinanceChat } from '../ai/useFinanceChat';

// Widgets, translation & formatter imports
import { useTranslation } from '../../utils/LanguageContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import IncomeWidget from './widgets/IncomeWidget';
import ExpenseWidget from './widgets/ExpenseWidget';
import NetWorthWidget from './widgets/NetWorthWidget';
import BudgetWidget from './widgets/BudgetWidget';
import GoalWidget from './widgets/GoalWidget';
import SpendingWidget from './widgets/SpendingWidget';
import RecentTransactionsWidget from './widgets/RecentTransactionsWidget';

import '../../styles/dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const navigate = useNavigate();

  const { t, language, currency } = useTranslation();

  // Recent Transactions state
  const [recentTx, setRecentTx] = useState([]);
  const [recentTxLoading, setRecentTxLoading] = useState(true);
  const [recentTxError, setRecentTxError] = useState(null);

  // Filter State
  const [period, setPeriod] = useState('current-month');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });
  const [analyticsData, setAnalyticsData] = useState(null);

  // Financial Health State
  const [healthData, setHealthData] = useState(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);
  const [anomalies, setAnomalies] = useState([]);

  // Budget management Modal State
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [userBudgets, setUserBudgets] = useState([]);
  const [budgetForm, setBudgetForm] = useState({ category: 'Food & Dining', limit: '' });
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Currency Converter State
  const [rupees, setRupees] = useState('');
  const [dollars, setDollars] = useState('');
  const exchangeRate = 93.36;

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

  // AI Chat
  const chat = useFinanceChat({
    onUnauthorized: () => navigate('/login')
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRecentTransactions = async () => {
    setRecentTxLoading(true);
    setRecentTxError(null);
    try {
      const res = await apiRequest(`${API_BASE_URL}/api/transactions?page=1&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setRecentTx(data.transactions || []);
      } else {
        setRecentTxError('Failed to load recent transactions');
      }
    } catch (err) {
      console.error('Error loading recent transactions:', err);
      setRecentTxError('Network error. Failed to load recent transactions.');
    } finally {
      setRecentTxLoading(false);
    }
  };

  const fetchAnalytics = async (selectedPeriod, start, end) => {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      let analyticsUrl = `${API_BASE_URL}/api/analytics?period=${selectedPeriod}`;
      let healthUrl = `${API_BASE_URL}/api/analytics/financial-health?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && start && end) {
        analyticsUrl += `&startDate=${start}&endDate=${end}`;
        healthUrl += `&startDate=${start}&endDate=${end}`;
      }

      const [resAnalytics, resHealth, resAnomalies] = await Promise.all([
        apiRequest(analyticsUrl),
        apiRequest(healthUrl),
        apiRequest(`${API_BASE_URL}/api/analytics/anomalies`),
        fetchRecentTransactions()
      ]);

      if (resAnalytics.ok) {
        const data = await resAnalytics.json();
        setAnalyticsData(data);
      } else {
        const errData = await resAnalytics.json().catch(() => ({}));
        setAnalyticsError(errData.error || 'Failed to load financial analytics');
      }

      if (resHealth.ok) {
        const data = await resHealth.json();
        setHealthData(data);
      }

      if (resAnomalies.ok) {
        const data = await resAnomalies.json();
        setAnomalies(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsError('Network error. Failed to connect to server.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchUserBudgets = async () => {
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/budgets`);
      if (response.ok) {
        const data = await response.json();
        setUserBudgets(data);
      }
    } catch (err) {
      console.error('Error loading budgets:', err);
    }
  };

  const handlePeriodChange = (e) => {
    const val = e.target.value;
    setPeriod(val);
    if (val !== 'custom') {
      fetchAnalytics(val);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    if (!customDates.startDate || !customDates.endDate) {
      showToast('Please enter both start and end dates', 'error');
      return;
    }
    fetchAnalytics('custom', customDates.startDate, customDates.endDate);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.limit || parseFloat(budgetForm.limit) <= 0) {
      showToast('Please enter a valid budget limit', 'error');
      return;
    }

    setBudgetSaving(true);
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: budgetForm.category,
          limit: parseFloat(budgetForm.limit)
        })
      });

      if (response.ok) {
        showToast('Budget configured successfully', 'success');
        fetchUserBudgets();
        // Refresh analytics as well to update utilization chart
        fetchAnalytics(period, customDates.startDate, customDates.endDate);
        setShowBudgetModal(false);
        setBudgetForm(prev => ({ ...prev, limit: '' }));
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save budget', 'error');
      }
    } catch (err) {
      showToast('Network error while saving budget', 'error');
    } finally {
      setBudgetSaving(false);
    }
  };

  const deleteBudget = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      const response = await apiRequest(`${API_BASE_URL}/api/budgets/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        showToast('Budget deleted', 'success');
        fetchUserBudgets();
        fetchAnalytics(period, customDates.startDate, customDates.endDate);
      }
    } catch (err) {
      showToast('Failed to delete budget', 'error');
    }
  };

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
    const fetchUserProfile = async () => {
      try {
        const response = await apiRequest(`${API_BASE_URL}/api/profile`);
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

    fetchUserProfile();
    fetchAnalytics('current-month');
    fetchUserBudgets();
  }, [navigate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowBudgetModal(false);
      }
    };
    if (showBudgetModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBudgetModal]);

  if (loading) {
    return (
      <div className="analytics-dashboard-loading">
        <div className="analytics-spinner" />
        <p>Initializing MoneyMind Dashboard...</p>
      </div>
    );
  }

  // Pre-process charts datasets
  const donutData = analyticsData ? [
    { name: 'Income', value: analyticsData.summary.totalIncome, color: '#10b981' },
    { name: 'Expenses', value: analyticsData.summary.totalExpense, color: '#ef4444' }
  ] : [];

  const fixedVsVariableData = analyticsData ? [
    { name: 'Fixed Expenses', value: analyticsData.breakdowns.fixedExpenses, color: '#f59e0b' },
    { name: 'Variable Expenses', value: analyticsData.breakdowns.variableExpenses, color: '#8b5cf6' }
  ] : [];

  const recurringVsOneTimeData = analyticsData ? [
    { name: 'Recurring', value: analyticsData.breakdowns.recurringExpenses, color: '#3b82f6' },
    { name: 'One-Time', value: analyticsData.breakdowns.oneTimeExpenses, color: '#ec4899' }
  ] : [];


  return (
    <div className="dashboard-content-container">
      {toast && (
        <div className={`profile-toast profile-toast--${toast.type}`}>
          {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header & Date Filters */}
      <div className="content-header">
        <div className="welcome-section">
          <h1>{t('common.welcome', { name: user?.name || 'User' })}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <div className="filter-controls">
          <FaCalendarAlt className="filter-icon" />
          <select value={period} onChange={handlePeriodChange} className="period-select">
            <option value="current-month">Current Month</option>
            <option value="previous-month">Previous Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="last-12-months">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {period === 'custom' && (
        <form onSubmit={handleCustomDateSubmit} className="custom-date-form">
          <div className="date-input-group">
            <label>Start Date</label>
            <input 
              type="date" 
              value={customDates.startDate} 
              onChange={(e) => setCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>
          <div className="date-input-group">
            <label>End Date</label>
            <input 
              type="date" 
              value={customDates.endDate} 
              onChange={(e) => setCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="custom-date-btn">Apply</button>
        </form>
      )}

      {/* Main Analytics Content */}
      {analyticsLoading ? (
        <div className="analytics-inner-loading">
          <div className="analytics-spinner" />
          <p>Aggregating and calculating metrics...</p>
        </div>
      ) : analyticsError ? (
        <div className="analytics-error-card">
          <FaExclamationCircle className="error-icon" />
          <p>{analyticsError}</p>
          <button onClick={() => fetchAnalytics(period, customDates.startDate, customDates.endDate)} className="retry-btn">Retry</button>
        </div>
      ) : (
        <>
          {/* Financial Health Hero Card */}
          {healthData && (
            <div className="health-score-hero-card">
              <div className="health-hero-main">
                <div className="health-hero-left">
                  <div className="health-icon-title-row">
                    <FaHeartbeat className="health-hero-icon" />
                    <h2>{t('dashboard.financialHealth')}</h2>
                  </div>
                  <p className="health-hero-desc">{t('dashboard.healthDesc')}</p>
                  
                  <div className="health-score-value-row">
                    <div className="health-large-score">{healthData.score}<span>/100</span></div>
                    <div className="health-grade-col">
                      <span className={`health-grade-badge grade-${healthData.grade.toLowerCase().replace(' ', '-')}`}>
                        {healthData.grade}
                      </span>
                      {healthData.change !== null && healthData.change !== undefined && (
                        <span className={`health-change-badge ${healthData.change >= 0 ? 'pos' : 'neg'}`}>
                          {healthData.change >= 0 ? <FaArrowUp /> : <FaArrowDown />} 
                          {Math.abs(healthData.change)} points from last period
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="health-toggle-details-btn" 
                    onClick={() => setShowHealthDetails(!showHealthDetails)}
                  >
                    {showHealthDetails ? t('dashboard.hideBreakdown') : t('dashboard.breakdown')}
                  </button>
                </div>

                <div className="health-hero-right">
                  <h3>{t('dashboard.recommendations')}</h3>
                  {healthData.recommendations && healthData.recommendations.length > 0 ? (
                    <ul className="health-recs-list">
                      {healthData.recommendations.map((rec, idx) => (
                        <li key={idx} className="health-rec-item">{rec}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-recs">Your financial health is looking strong! Continue maintaining your savings rate and budget discipline.</p>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown */}
              {showHealthDetails && (
                <div className="health-details-breakdown">
                  <h3>Component Score Breakdown</h3>
                  <div className="health-components-grid">
                    {healthData.components.map((comp, idx) => (
                      <div key={idx} className={`health-component-card ${comp.status}`}>
                        <div className="comp-card-top">
                          <span className="comp-card-name">{comp.name}</span>
                          <span className="comp-card-ratio">
                            {comp.status === 'unavailable' ? 'N/A' : `${comp.score} / ${comp.maxScore}`}
                          </span>
                        </div>
                        {comp.status !== 'unavailable' && (
                          <div className="comp-progress-outer">
                            <div 
                              className="comp-progress-fill" 
                              style={{ width: `${(comp.score / comp.maxScore) * 100}%` }}
                            />
                          </div>
                        )}
                        <p className="comp-card-explanation">{comp.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Unusual Spending Alerts */}
          {anomalies && anomalies.length > 0 && (
            <div className="insights-panel-card" style={{ background: '#fffbeb', borderColor: '#fde68a', marginBottom: '2rem' }}>
              <h3 style={{ borderBottomColor: 'rgba(217, 119, 6, 0.1)', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaExclamationTriangle style={{ color: '#d97706' }} />
                {t('dashboard.unusualSpending')}
              </h3>
              <ul className="insights-list">
                {anomalies.map(tx => (
                  <li key={tx.id} className="insight-item" style={{ color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px dashed rgba(217, 119, 6, 0.2)' }}>
                    <div>
                      <strong>{tx.category}</strong>: {tx.note || 'Uncategorized expense'} of {formatCurrency(tx.amount, currency, language)} on {tx.date}.
                      <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.2rem' }}>{tx.anomalyReason}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* KPI Dashboard Cards */}
          <div className="kpi-grid">
            <IncomeWidget
              data={{ totalIncome: analyticsData.summary.totalIncome, comparisonChange: analyticsData.comparison.incomeChange }}
              loading={analyticsLoading}
              error={analyticsError}
              currency={currency}
              language={language}
            />

            <ExpenseWidget
              data={{ totalExpense: analyticsData.summary.totalExpense, comparisonChange: analyticsData.comparison.expenseChange }}
              loading={analyticsLoading}
              error={analyticsError}
              currency={currency}
              language={language}
            />

            <NetWorthWidget
              data={{ netSavings: analyticsData.summary.netSavings, comparisonChange: analyticsData.comparison.savingsChange }}
              loading={analyticsLoading}
              error={analyticsError}
              currency={currency}
              language={language}
            />

            <div className="kpi-analytics-card">
              <div className="kpi-top">
                <span className="kpi-title">{t('dashboard.savingsRate')}</span>
                <span className="kpi-icon-wrapper kpi-rate"><FaPercentage /></span>
              </div>
              <div className="kpi-value">{analyticsData.summary.savingsRate.toFixed(1)}%</div>
              <div className="kpi-progress-bar">
                <div 
                  className="kpi-progress-fill" 
                  style={{ width: `${Math.min(100, Math.max(0, analyticsData.summary.savingsRate))}%` }}
                />
              </div>
            </div>
            <div className="kpi-analytics-card">
              <div className="kpi-top">
                <span className="kpi-title">Current Net Worth</span>
                <span className="kpi-icon-wrapper kpi-worth"><FaWallet /></span>
              </div>
              <div className="kpi-value">{formatCurrency(analyticsData.summary.netWorth, currency, language)}</div>
              <div className="kpi-bottom-text">Cumulative balance all-time</div>
            </div>
          </div>

          {/* Rule-Based Financial Insights */}
          <div className="insights-panel-card">
            <h3>
              <FaLightbulb className="insight-header-icon" />
              Smart Financial Insights
            </h3>
            {analyticsData.insights.length === 0 ? (
              <p className="no-insights">No spending data in this range to draw insights. Add more transactions to populate!</p>
            ) : (
              <ul className="insights-list">
                {analyticsData.insights.map((insight, idx) => (
                  <li key={idx} className="insight-item">{insight}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Primary Charts Section */}
          <div className="analytics-charts-grid">
            {/* Daily Spending Trend */}
            <div className="chart-card-wrapper chart-span-2">
              <h3>Daily Spending Trend</h3>
              <div className="chart-container-inner">
                {analyticsData.summary.totalExpense === 0 ? (
                  <div className="chart-empty-state">No expense transactions recorded in this period.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.dailyTrend}>
                      <defs>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 118, 110, 0.05)" />
                      <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                      <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Spent']} />
                      <Area type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Income vs Expense Pie */}
            <div className="chart-card-wrapper">
              <h3>Cash Distribution</h3>
              <div className="chart-container-inner">
                {analyticsData.summary.totalIncome === 0 && analyticsData.summary.totalExpense === 0 ? (
                  <div className="chart-empty-state">No data available for this range.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Rolling Monthly Cash Flow */}
            <div className="chart-card-wrapper chart-span-2">
              <h3>Monthly Cash Flow (Last 6 Months)</h3>
              <div className="chart-container-inner">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(15, 118, 110, 0.05)" />
                    <XAxis dataKey="month" stroke="#888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888" fontSize={11} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category spending Breakdown */}
            <div className="chart-card-wrapper">
              <h3>Spending by Category</h3>
              <div className="chart-container-inner">
                {analyticsData.categoryBreakdown.length === 0 ? (
                  <div className="chart-empty-state">No expenses to classify by category.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.categoryBreakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(15, 118, 110, 0.05)" />
                      <XAxis type="number" stroke="#888" fontSize={11} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                      <YAxis dataKey="category" type="category" stroke="#888" fontSize={11} width={80} tickLine={false} />
                      <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                      <Bar dataKey="amount" fill="#0f766e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Fixed vs Variable */}
            <div className="chart-card-wrapper">
              <h3>Fixed vs Variable Expenses</h3>
              <div className="chart-container-inner">
                {analyticsData.summary.totalExpense === 0 ? (
                  <div className="chart-empty-state">No expense details.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={fixedVsVariableData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                      >
                        {fixedVsVariableData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recurring vs One-Time */}
            <div className="chart-card-wrapper">
              <h3>Recurring vs One-Time</h3>
              <div className="chart-container-inner">
                {analyticsData.summary.totalExpense === 0 ? (
                  <div className="chart-empty-state">No expense details.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={recurringVsOneTimeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                      >
                        {recurringVsOneTimeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          {/* Budgets & Goals Section */}
          <div className="budget-goals-section-grid">
            <BudgetWidget
              userBudgets={userBudgets}
              loading={analyticsLoading}
              error={analyticsError}
              onManageBudgets={() => setShowBudgetModal(true)}
              currency={currency}
              language={language}
            />

            <GoalWidget
              goalProgress={analyticsData.goalProgress}
              loading={analyticsLoading}
              error={analyticsError}
              currency={currency}
              language={language}
            />
          </div>

          {/* Extensible Widgets: Spending Analysis & Recent Ledger */}
          <div className="budget-goals-section-grid" style={{ marginTop: '2rem' }}>
            <SpendingWidget
              categoryBreakdown={analyticsData.categoryBreakdown}
              loading={analyticsLoading}
              error={analyticsError}
              currency={currency}
              language={language}
            />

            <RecentTransactionsWidget
              transactions={recentTx}
              loading={recentTxLoading}
              error={recentTxError}
              currency={currency}
              language={language}
            />
          </div>
        </>
      )}

      {/* Floating AI Chat Assistant */}
      <section className="dashboard-ai-section">
        <div className="section-header-row">
          <h2 className="section-title">
            <FaRobot className="section-title-icon" />
            AI Financial Assistant
          </h2>
          <p className="section-subtitle">Get personalized financial advice based on your transaction data</p>
        </div>
        <FinanceChatPanel
          errorMessage={chat.errorMessage}
          isLoading={chat.isLoading}
          messages={chat.messages}
          onSendMessage={chat.sendMessage}
          showSuggestions={chat.showSuggestions}
          subtitle="Your personal finance advisor"
          suggestions={chat.suggestions}
          title="AI Financial Assistant"
          variant="page"
        />
      </section>

      {/* Financial Utility Calculators */}
      <section className="tools-section">
        <h2 className="section-title">Financial Utility Calculators</h2>
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
            <p className="rate">1 USD = ₹{exchangeRate}</p>
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
              <input type="number" value={sipAmount} onChange={(e) => setSipAmount(e.target.value)} placeholder="Monthly Investment (₹)" className="tool-input" />
              <input type="number" value={sipRate} onChange={(e) => setSipRate(e.target.value)} placeholder="Expected Return (% p.a.)" className="tool-input" />
              <input type="number" value={sipYears} onChange={(e) => setSipYears(e.target.value)} placeholder="Time Period (Years)" className="tool-input" />
              <button onClick={calculateSIP} className="calc-sip-btn">Calculate SIP</button>
            </div>
            {(sipResult.invested > 0) && (
              <div className="sip-result">
                <p>Invested Amount: <span>₹{sipResult.invested.toLocaleString('en-IN')}</span></p>
                <p>Est. Returns: <span>₹{sipResult.returns.toLocaleString('en-IN')}</span></p>
                <p>Total Value: <span>₹{sipResult.total.toLocaleString('en-IN')}</span></p>
              </div>
            )}
          </div>

          <div className="tool-card">
            <h3>EMI Calculator</h3>
            <div className="sip-inputs">
              <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} placeholder="Loan Amount (₹)" className="tool-input" />
              <input type="number" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} placeholder="Interest Rate (% p.a.)" className="tool-input" />
              <input type="number" value={loanTenure} onChange={(e) => setLoanTenure(e.target.value)} placeholder="Tenure (Years)" className="tool-input" />
              <button onClick={calculateEMI} className="calc-emi-btn">Calculate EMI</button>
            </div>
            {(emiResult.emi > 0) && (
              <div className="sip-result">
                <p>Monthly EMI: <span>₹{emiResult.emi.toLocaleString('en-IN')}</span></p>
                <p>Total Interest: <span>₹{emiResult.interest.toLocaleString('en-IN')}</span></p>
                <p>Total Payment: <span>₹{emiResult.total.toLocaleString('en-IN')}</span></p>
              </div>
            )}
          </div>

          <div className="tool-card">
            <h3>FD Calculator</h3>
            <div className="sip-inputs">
              <input type="number" value={fdAmount} onChange={(e) => setFdAmount(e.target.value)} placeholder="Principal Amount (₹)" className="tool-input" />
              <input type="number" value={fdRate} onChange={(e) => setFdRate(e.target.value)} placeholder="Interest Rate (% p.a.)" className="tool-input" />
              <input type="number" value={fdYears} onChange={(e) => setFdYears(e.target.value)} placeholder="Time Period (Years)" className="tool-input" />
              <button onClick={calculateFD} className="calc-fd-btn">Calculate FD</button>
            </div>
            {(fdResult.maturity > 0) && (
              <div className="sip-result">
                <p>Principal: <span>₹{fdResult.principal.toLocaleString('en-IN')}</span></p>
                <p>Interest Earned: <span>₹{fdResult.interest.toLocaleString('en-IN')}</span></p>
                <p>Maturity Amount: <span>₹{fdResult.maturity.toLocaleString('en-IN')}</span></p>
              </div>
            )}
          </div>

          <div className="tool-card">
            <h3>GST Calculator</h3>
            <div className="sip-inputs">
              <input type="number" value={gstAmount} onChange={(e) => setGstAmount(e.target.value)} placeholder="Amount (₹)" className="tool-input" />
              <select value={gstRate} onChange={(e) => setGstRate(e.target.value)} className="tool-input">
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
              <button onClick={calculateGST} className="calc-gst-btn">Calculate GST</button>
            </div>
            {(gstResult.total > 0) && (
              <div className="sip-result">
                <p>Base Amount: <span>₹{gstResult.base.toLocaleString('en-IN')}</span></p>
                <p>GST Amount: <span>₹{gstResult.tax.toLocaleString('en-IN')}</span></p>
                <p>Total Amount: <span>₹{gstResult.total.toLocaleString('en-IN')}</span></p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Manage Budgets Modal */}
      {showBudgetModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-container" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
            <div className="modal-header">
              <h2 id="budget-modal-title">Configure Monthly Budgets</h2>
              <button className="modal-close-btn" onClick={() => setShowBudgetModal(false)} aria-label="Close modal"><FaTimes /></button>
            </div>
            
            <form onSubmit={handleBudgetSubmit} className="budget-config-form">
              <div className="form-group">
                <label htmlFor="budget-category">Category</label>
                <select 
                  id="budget-category"
                  value={budgetForm.category} 
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, category: e.target.value }))}
                  className="tool-input"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Housing">Housing</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Utilities">Utilities</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="budget-limit">Monthly Limit (₹)</label>
                <input 
                  id="budget-limit"
                  type="number" 
                  value={budgetForm.limit} 
                  onChange={(e) => setBudgetForm(prev => ({ ...prev, limit: e.target.value }))}
                  placeholder="e.g. 15000"
                  className="tool-input"
                  required
                />
              </div>
              <button type="submit" className="save-budget-btn" disabled={budgetSaving}>
                {budgetSaving ? 'Saving...' : 'Set Limit'}
              </button>
            </form>

            <div className="configured-budgets-list">
              <h3>Active Monthly Limits</h3>
              {userBudgets.length === 0 ? (
                <p className="no-budgets-msg">No budgets configured yet.</p>
              ) : (
                <div className="budgets-scroll-wrapper">
                  {userBudgets.map(b => (
                    <div key={b.id} className="configured-budget-row">
                      <span>{b.category}: <strong>₹{b.limit.toLocaleString('en-IN')}</strong></span>
                      <button className="delete-budget-btn" onClick={() => deleteBudget(b.id)} aria-label={`Delete budget for ${b.category}`}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
