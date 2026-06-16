import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaBullseye, FaArrowLeft, FaRobot, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { API_BASE_URL } from '../utils/auth';

import '../styles/auth.css';

function Login() {
  const DEMO_EMAIL = 'moneymind@gmail.com';
  const DEMO_PASSWORD = 'happytransactions';

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setMessage('');
    setMessageType('');
    setIsLoggingIn(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Welcome back, ${data.user.name}!`);
        setMessageType('success');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setMessage(data.error || 'Login failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
      setMessageType('error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setFormData({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD
    });
  };

  return (
    <div className="auth-page">
      <Link to="/" className="back-button-top">
        <FaArrowLeft /> Back to Home
      </Link>
      <div className="auth-split">
        <div className="auth-left">
          <div className="auth-left-content">
            <div className="auth-brand">
              <h1 className="auth-brand-logo">MoneyMind</h1>
              <p className="auth-brand-tagline">Know your money. Grow it smarter.</p>
            </div>

            <div className="auth-illustration">
              <div className="illu-card illu-card-1">
                <FaRobot />
                <span>AI insights on your spending</span>
              </div>
              <div className="illu-card illu-card-2">
                <FaChartLine />
                <span>Track every rupee effortlessly</span>
              </div>
              <div className="illu-card illu-card-3">
                <FaShieldAlt />
                <span>Your data stays private</span>
              </div>
            </div>

            <div className="auth-testimonial">
              <p>"I finally know where my money goes each month."</p>
              <span>— Priya Sharma, Software Engineer</span>
            </div>

            <div className="auth-left-bg-circles">
              <div className="auth-circle auth-circle-1" />
              <div className="auth-circle auth-circle-2" />
              <div className="auth-circle auth-circle-3" />
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-container">
            <div className="auth-header">
              <h1 className="auth-logo">MoneyMind</h1>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Sign in to your account to continue</p>
            </div>

            {message && (
              <div className={`message ${messageType}`}>
                {message}
              </div>
            )}

            <div className="demo-credentials">
              <div className="demo-header">
                <FaBullseye className="demo-icon" />
                <strong>Demo Account</strong>
              </div>
              <div className="demo-info">
                <p><strong>Email:</strong> {DEMO_EMAIL}</p>
                <p><strong>Password:</strong> {DEMO_PASSWORD}</p>
              </div>
              <button type="button" className="use-demo-button" onClick={handleUseDemoCredentials}>
                Use Demo Credentials
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  disabled={isLoggingIn}
                  required
                />
              </div>

              <button type="submit" className="auth-button" disabled={isLoggingIn}>
                {isLoggingIn ? 'Logging In...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-link">
              Don't have an account? <Link to="/signup">Create one here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
