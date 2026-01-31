import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/auth';
import { FiSend, FiMessageSquare, FiX } from 'react-icons/fi';
import { BiBot } from 'react-icons/bi';
import { HiSparkles } from 'react-icons/hi';
import '../styles/floatingWidget.css';

function AIFloatingWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'ai',
            content: '👋 Hello! I\'m your AI financial advisor. I can help you with budgeting, expense management, and financial planning based on your transaction data. What would you like to know?'
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

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

    const toggleWidget = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Floating Button */}
            <button
                className={`floating-chat-button ${isOpen ? 'open' : ''}`}
                onClick={toggleWidget}
                aria-label="AI Assistant"
            >
                {isOpen ? <FiX size={24} /> : <HiSparkles size={24} />}
            </button>

            {/* Chat Modal */}
            {isOpen && (
                <div className="floating-chat-modal">
                    {/* Header */}
                    <div className="floating-chat-header">
                        <div className="header-title">
                            <BiBot className="header-icon" />
                            <div>
                                <h3>AI Financial Assistant</h3>
                                <p>Your personal finance advisor</p>
                            </div>
                        </div>
                        <button
                            className="close-button"
                            onClick={toggleWidget}
                            aria-label="Close chat"
                        >
                            <FiX size={20} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="floating-chat-messages">
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
                        <div className="floating-suggestions">
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
                    <div className="floating-chat-input">
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
            )}
        </>
    );
}

export default AIFloatingWidget;
