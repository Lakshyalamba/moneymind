import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
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
            <h1 className="hero-title">Master Your Financial Future with AI</h1>
            <p className="hero-subtitle">Get personalized financial advice from your AI advisor, track expenses effortlessly, and make smarter money decisions with intelligent insights tailored just for you.</p>
            <div className="hero-quote">"The best investment you can make is in yourself and your financial education." - Warren Buffett</div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10,000+</span>
                <span className="stat-label">Active Users</span>
              </div>
              <div className="stat">
                <span className="stat-number">₹2M+</span>
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
            <p className="section-subtitle">Discover the tools that make financial management effortless and rewarding</p>

            <div className="features-grid">
              <div className="feature-card">
                <h3>AI Financial Advisor</h3>
                <p>Get personalized financial advice powered by Google Gemini AI. Ask questions and receive smart, actionable insights based on your spending patterns.</p>
                <div className="feature-quote">"Intelligence is the ability to adapt to change." - Stephen Hawking</div>
              </div>

              <div className="feature-card">
                <h3>Transaction Tracking</h3>
                <p>Effortlessly track income and expenses with detailed categorization. Visualize your financial data with interactive charts and analytics.</p>
                <div className="feature-quote">"What gets measured gets managed." - Peter Drucker</div>
              </div>

              <div className="feature-card">
                <h3>Financial Calculators</h3>
                <p>Built-in SIP, EMI, FD, and GST calculators. Plus currency converter and basic calculator for quick financial computations.</p>
                <div className="feature-quote">"Compound interest is the eighth wonder of the world." - Albert Einstein</div>
              </div>
            </div>
          </div>
        </section>

        <section className="reviews">
          <div className="reviews-container">
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">Real stories from people who transformed their finances</p>

            <div className="reviews-grid">
              <div className="review-card">
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="review-text">"MoneyMind helped me save ₹2 lakhs in just 6 months! The budgeting tools are incredible."</p>
                <div className="reviewer">
                  <div className="reviewer-avatar">P</div>
                  <div className="reviewer-info">
                    <h4>Priya Sharma</h4>
                    <span>Software Engineer, Mumbai</span>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="review-text">"Finally, an app that makes expense tracking simple. My financial stress is gone!"</p>
                <div className="reviewer">
                  <div className="reviewer-avatar">R</div>
                  <div className="reviewer-info">
                    <h4>Rahul Gupta</h4>
                    <span>Business Owner, Delhi</span>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <div className="stars">
                  <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                </div>
                <p className="review-text">"The insights helped me identify where I was overspending. Saved ₹50k this year!"</p>
                <div className="reviewer">
                  <div className="reviewer-avatar">A</div>
                  <div className="reviewer-info">
                    <h4>Anita Patel</h4>
                    <span>Teacher, Bangalore</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="faq">
          <div className="faq-container">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Everything you need to know about MoneyMind</p>

            <div className="faq-grid">
              <div className="faq-item">
                <h3>Is MoneyMind free to use?</h3>
                <p>Yes! MoneyMind offers a comprehensive free plan with all essential features. Premium plans are available for advanced analytics.</p>
              </div>

              <div className="faq-item">
                <h3>How secure is my financial data?</h3>
                <p>We use bank-level 256-bit encryption and never store your banking passwords. Your data is completely secure and private.</p>
              </div>

              <div className="faq-item">
                <h3>Can I connect my bank accounts?</h3>
                <p>Currently, we support manual transaction entry. Bank integration is coming soon with top Indian banks.</p>
              </div>

              <div className="faq-item">
                <h3>Does it work on mobile devices?</h3>
                <p>Absolutely! MoneyMind is fully responsive and works perfectly on all devices - mobile, tablet, and desktop.</p>
              </div>

              <div className="faq-item">
                <h3>Can I export my financial data?</h3>
                <p>Yes, you can export your transaction data and reports in CSV format anytime. Your data belongs to you.</p>
              </div>

              <div className="faq-item">
                <h3>How do I get started?</h3>
                <p>Simply sign up with your email, verify your account, and start adding your transactions. It takes less than 2 minutes!</p>
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