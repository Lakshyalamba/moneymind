import { Link } from 'react-router-dom';
import '../styles/landing.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">MoneyMind</h1>
          <div className="nav-links">
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/signup" className="nav-btn primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <section className="hero">
          <div className="hero-content">
            <h1 className="hero-title">Master Your Financial Future</h1>
            <p className="hero-subtitle">Take control of your finances with smart budgeting, expense tracking, and personalized insights that transform your relationship with money.</p>
            <div className="hero-quote">"Financial peace isn't the acquisition of stuff. It's learning to live on less than you make, so you can give money back and have money to invest." - Dave Ramsey</div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">$2M+</span>
                <span className="stat-label">Money Tracked</span>
              </div>
              <div className="stat">
                <span className="stat-number">95%</span>
                <span className="stat-label">User Satisfaction</span>
              </div>
            </div>
            <div className="cta-buttons">
              <Link to="/signup" className="cta-btn primary">Start Free Today</Link>
              <Link to="/login" className="cta-btn secondary">Sign In</Link>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="features-container">
            <h2 className="section-title">Why Choose MoneyMind?</h2>
            
            <div className="features-grid">
              <div className="feature-card">
                <h3>Smart Budgeting</h3>
                <p>Create personalized budgets with automated tracking and intelligent spending alerts.</p>
                <div className="feature-quote">"A budget is telling your money where to go instead of wondering where it went." - John C. Maxwell</div>
              </div>
              
              <div className="feature-card">
                <h3>Expense Analytics</h3>
                <p>Visualize spending patterns with detailed reports and interactive charts.</p>
                <div className="feature-quote">"What gets measured gets managed." - Peter Drucker</div>
              </div>
              
              <div className="feature-card">
                <h3>Secure & Private</h3>
                <p>Bank-level security with 256-bit encryption and multi-factor authentication.</p>
                <div className="feature-quote">"Trust is the glue of life. It's the most essential ingredient in effective communication." - Stephen Covey</div>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-container">
            <h2>Ready to Take Control?</h2>
            <p>Join thousands who've transformed their financial lives with MoneyMind.</p>
            <Link to="/signup" className="cta-btn large">Get Started for Free</Link>
            <p className="cta-note">No credit card required • Cancel anytime</p>
          </div>
        </section>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2024 MoneyMind. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;