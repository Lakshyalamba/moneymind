import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaStar, FaRobot, FaChartLine, FaCalculator, FaBullseye, FaShieldAlt, FaBrain, FaBolt, FaLock, FaExchangeAlt, FaGithub, FaTwitter } from 'react-icons/fa';
import '../styles/landing.css';

function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const reviews = [
    {
      quote: 'I finally know where my money goes each month.',
      initial: 'P',
      name: 'Priya Sharma',
      role: 'Software Engineer'
    },
    {
      quote: 'Simple tracking, clear charts, less stress.',
      initial: 'R',
      name: 'Rahul Gupta',
      role: 'Business Owner'
    },
    {
      quote: 'The insights helped me cut waste fast.',
      initial: 'A',
      name: 'Anita Patel',
      role: 'Teacher'
    },
    {
      quote: 'The calculators make planning feel easy.',
      initial: 'K',
      name: 'Karan Mehta',
      role: 'Product Manager'
    },
    {
      quote: 'The AI assistant feels like having a personal financial advisor in my pocket.',
      initial: 'N',
      name: 'Neha Iyer',
      role: 'Consultant'
    },
    {
      quote: 'Budgeting used to be overwhelming. MoneyMind made it simple and even fun.',
      initial: 'V',
      name: 'Vikram Singh',
      role: 'Freelancer'
    },
    {
      quote: 'I love how the AI explains my spending patterns without judgment.',
      initial: 'S',
      name: 'Sneha Kapoor',
      role: 'Marketing Manager'
    },
    {
      quote: 'Finally a finance app that doesn\'t feel like a spreadsheet.',
      initial: 'A',
      name: 'Arun Nair',
      role: 'Designer'
    }
  ];

  const faqs = [
    {
      question: 'Is it free?',
      answer: 'Yes. You can track, plan, and use the core tools for free.'
    },
    {
      question: 'Is my data safe?',
      answer: 'Your data stays private and is protected with secure auth.'
    },
    {
      question: 'Can I link my bank?',
      answer: 'Not yet. Manual tracking is available now; bank sync is planned.'
    },
    {
      question: 'Does it work on mobile?',
      answer: 'Yes. MoneyMind works on phone, tablet, and desktop.'
    },
    {
      question: 'Can I export data?',
      answer: 'Yes. You can export your transaction data when needed.'
    },
    {
      question: 'How do I start?',
      answer: 'Create an account, add transactions, and view your dashboard.'
    }
  ];

  const heroFeatures = [
    {
      icon: <FaRobot />,
      title: 'AI Financial Assistant',
      desc: 'Ask questions, get insights, and receive personalized advice based on your spending habits.',
      accent: true
    },
    {
      icon: <FaChartLine />,
      title: 'Smart Tracking',
      desc: 'Log expenses and income, then visualize patterns with beautiful charts.',
      accent: false
    },
    {
      icon: <FaCalculator />,
      title: 'Quick Calculators',
      desc: 'SIP, EMI, FD, GST, currency — all in one place.',
      accent: false
    },
    {
      icon: <FaBullseye />,
      title: 'Goal Planning',
      desc: 'Set savings goals and track progress over time.',
      accent: false
    }
  ];

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="logo">MoneyMind</h1>
          <button
            className={`mobile-toggle ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
          <div className={`nav-links ${mobileOpen ? 'open' : ''}`}>
            <button className="nav-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="nav-link" onClick={() => scrollTo('reviews')}>Reviews</button>
            <button className="nav-link" onClick={() => scrollTo('faq')}>FAQ</button>
            <Link to="/login" className="nav-btn">Login</Link>
            <Link to="/signup" className="nav-btn primary">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="main-content">
        <section className="hero">
          <div className="hero-split">
            <div className="hero-left">
              <div className="hero-stat-banner">
                <span role="img" aria-label="sparkle">✨</span> Trusted by <strong>10,000+</strong> users
              </div>
              <h1 className="hero-title">Money Clarity,<br />Powered by AI</h1>
              <p className="hero-subtitle">
                Track every rupee, get instant AI insights, and hit your financial goals — all from one beautiful dashboard. No spreadsheets, no stress.
              </p>
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
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
              <div className="cta-buttons">
                <Link to="/signup" className="cta-btn primary">Start Free</Link>
                <Link to="/login" className="cta-btn secondary">Sign In</Link>
              </div>
              <p className="hero-note">No credit card required. Free to start.</p>
            </div>

            <div className="hero-right">
              <div className="hero-features-grid">
                {heroFeatures.map((f, i) => (
                  <div className={`hero-feature-card ${f.accent ? 'accent' : ''}`} key={f.title} style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
                    <div className="hero-feature-icon">{f.icon}</div>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hero-shield">
                <FaShieldAlt /> Your data stays private and secure
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features">
          <div className="features-bg-shapes" />
          <div className="features-container">
            <div className="features-header">
              <span className="features-badge">Why MoneyMind?</span>
              <h2 className="features-title"><span className="features-highlight">Real control</span> over your money</h2>
              <p className="features-subtitle">No fluff, no spreadsheets — just tools to track smarter and spend better.</p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-card-top">
                  <div className="feature-icon-wrap"><FaRobot /></div>
                  <span className="feature-tag">AI-Powered</span>
                </div>
                <h3>AI Financial Advisor</h3>
                <p className="feature-desc">Instant, personalized advice based on your spending habits.</p>
                <ul className="feature-list">
                  <li><FaBrain /> Analyze spending patterns</li>
                  <li><FaBolt /> Get savings suggestions</li>
                </ul>
              </div>

              <div className="feature-card accent">
                <div className="feature-card-top">
                  <div className="feature-icon-wrap"><FaChartLine /></div>
                  <span className="feature-tag">Visual</span>
                </div>
                <h3>Beautiful Tracking</h3>
                <p className="feature-desc">Log expenses in seconds. Watch your money flow through interactive charts.</p>
                <ul className="feature-list">
                  <li><FaExchangeAlt /> Income vs expenses at a glance</li>
                  <li><FaChartLine /> Category-wise breakdowns</li>
                </ul>
              </div>

              <div className="feature-card">
                <div className="feature-card-top">
                  <div className="feature-icon-wrap"><FaBullseye /></div>
                  <span className="feature-tag">Goal-Oriented</span>
                </div>
                <h3>Goal Planning</h3>
                <p className="feature-desc">Set targets, track progress, and stay motivated.</p>
                <ul className="feature-list">
                  <li><FaBullseye /> Custom savings goals</li>
                  <li><FaChartLine /> Real-time progress bars</li>
                </ul>
              </div>
            </div>

            <div className="features-cta">
              <p><FaLock style={{ marginRight: '0.5rem' }} />Your data stays private. Always.</p>
            </div>
          </div>
        </section>

        <section id="reviews" className="reviews">
          <div className="reviews-container">
            <div className="section-head">
              <span className="section-badge">Testimonials</span>
              <h2 className="section-head-title">Loved by Users</h2>
              <p className="section-head-sub">Short wins from real MoneyMind users.</p>
            </div>

            <div className="reviews-grid">
              {reviews.map((review) => (
                <div className="review-card" key={review.name}>
                  <div className="stars">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                  <p className="review-text">"{review.quote}"</p>
                  <div className="reviewer">
                    <div className="reviewer-avatar">{review.initial}</div>
                    <div className="reviewer-info">
                      <h4>{review.name}</h4>
                      <span>{review.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="faq">
          <div className="faq-container">
            <div className="section-head">
              <span className="section-badge">FAQ</span>
              <h2 className="section-head-title">Quick answers</h2>
              <p className="section-head-sub">Everything you need to know before you start.</p>
            </div>

            <div className="faq-grid">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div className={`faq-item ${isOpen ? 'open' : ''}`} key={faq.question}>
                    <button
                      className="faq-question"
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{faq.question}</span>
                      <FaPlus className="faq-icon" />
                    </button>
                    {isOpen && <p>{faq.answer}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-glow" />
          <div className="cta-container">
            <div className="cta-badge">Join 10,000+ users</div>
            <h2>Ready to Take Control?</h2>
            <p className="cta-desc">Sign up free and start tracking in under 2 minutes.</p>
            <div className="cta-benefits">
              <span>✓ AI insights</span>
              <span>✓ Smart tracking</span>
              <span>✓ Free forever</span>
            </div>
            <div className="cta-actions">
              <Link to="/signup" className="cta-btn large">Get Started Free</Link>
              <Link to="/login" className="cta-btn outline">Sign In</Link>
            </div>
            <p className="cta-note">No credit card required</p>
          </div>
        </section>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>MoneyMind</h3>
            <p>Know your money. Grow it smarter.</p>
          </div>
          <div className="footer-links">
            <button className="footer-link" onClick={() => scrollTo('features')}>Features</button>
            <button className="footer-link" onClick={() => scrollTo('reviews')}>Reviews</button>
            <button className="footer-link" onClick={() => scrollTo('faq')}>FAQ</button>
            <Link to="/login" className="footer-link">Login</Link>
            <Link to="/signup" className="footer-link">Sign Up</Link>
          </div>
          <div className="footer-social">
            <a href="#" aria-label="GitHub"><FaGithub /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
          </div>
          <p className="footer-copy">MoneyMind &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
