import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest, logout } from '../utils/auth';
import { FiSend, FiMessageSquare } from 'react-icons/fi';
import { BiBot } from 'react-icons/bi';
import '../styles/chat.css';

function AIChat() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            content: '👋 Hello! I\'m your AI financial advisor. I can help you with budgeting, expense management, and financial planning based on your transaction data. What would you like to know?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Predefined suggestion buttons
    const suggestions = [
        'How can I reduce expenses?',
        'How should I plan my budget?',
        'Is my spending healthy?',
        'Give me savings tips'
    ];

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchUserProfile();
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

    const handleSendMessage = async (messageText = null) => {
        const textToSend = messageText || inputMessage;

        if (!textToSend.trim()) return;

        // Add user message to chat
        const userMessage = {
            role: 'user',
            content: textToSend
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            // Send message to backend AI endpoint
            const response = await apiRequest(`${import.meta.env.VITE_API_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: textToSend })
            });

            if (response.ok) {
                const data = await response.json();

                // Add AI response to chat
                const aiMessage = {
                    role: 'ai',
                    content: data.message
                };

                setMessages(prev => [...prev, aiMessage]);
            } else {
                const errorData = await response.json();

                // Add error message
                const errorMessage = {
                    role: 'ai',
                    content: `⚠️ Sorry, I encountered an error: ${errorData.error || 'Please try again.'}`
                };

                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);

            // Add error message
            const errorMessage = {
                role: 'ai',
                content: '⚠️ Sorry, I\'m having trouble connecting. Please check your internet connection and try again.'
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        handleSendMessage(suggestion);
    };

    if (loading) {
        return (
            <div className="ai-chat-container">
                <div style={{ textAlign: 'center', padding: '3rem' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div className="ai-chat-container">
            {/* Header */}
            <header className="chat-header">
                <div className="header-content">
                    <div className="welcome-section">
                        <BiBot className="ai-icon" />
                        <div>
                            <h1>AI Financial Assistant</h1>
                            <p>Your personal finance advisor</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <nav className="dashboard-nav">
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/transactions" className="nav-link">Transactions</Link>
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

            {/* Chat Messages */}
            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-content">
                            {msg.role === 'ai' && <BiBot className="message-icon" />}
                            <div className="message-bubble">
                                {msg.content}
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="message ai">
                        <div className="message-content">
                            <BiBot className="message-icon" />
                            <div className="message-bubble loading">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Buttons */}
            {messages.length === 1 && (
                <div className="suggestions">
                    <p className="suggestions-label">Try asking:</p>
                    <div className="suggestion-buttons">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                className="suggestion-btn"
                                onClick={() => handleSuggestionClick(suggestion)}
                                disabled={isLoading}
                            >
                                <FiMessageSquare className="suggestion-icon" />
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-area">
                <div className="input-container">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your finances..."
                        className="chat-input"
                        rows="1"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        className="send-button"
                        disabled={isLoading || !inputMessage.trim()}
                    >
                        <FiSend />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AIChat;
