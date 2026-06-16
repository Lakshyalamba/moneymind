import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiBot, BiChip } from 'react-icons/bi';
import FinanceChatPanel from '../components/chat/FinanceChatPanel';
import { useFinanceChat } from '../hooks/useFinanceChat';
import { apiRequest, API_BASE_URL } from '../utils/auth';
import '../styles/chat.css';

function AIChat() {
  const navigate = useNavigate();
  const [pageLoading, setPageLoading] = useState(true);
  const { errorMessage, isLoading, messages, sendMessage, showSuggestions, suggestions } = useFinanceChat({
    onUnauthorized: () => navigate('/login')
  });

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const response = await apiRequest(`${API_BASE_URL}/api/profile`);

        if (!response.ok) {
          navigate('/login');
          return;
        }
      } catch (error) {
        navigate('/login');
        return;
      }

      setPageLoading(false);
    };

    verifyAccess();
  }, [navigate]);

  if (pageLoading) {
    return (
      <div className="chat-page-wrapper">
        <div className="chat-page-header">
          <div className="chat-page-header-icon">
            <BiBot />
          </div>
          <div className="chat-page-header-text">
            <h1>AI Chat</h1>
            <p>Chat with your personal finance assistant</p>
          </div>
        </div>
        <div className="chat-page-shell">
          <div className="chat-page-loading">
            <div className="chat-page-loading-spinner" />
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page-wrapper">
      <div className="chat-page-header">
        <div className="chat-page-header-icon">
          <BiBot />
        </div>
        <div className="chat-page-header-text">
          <h1>AI Chat</h1>
          <p>Chat with your personal finance assistant</p>
        </div>
        <span className="chat-page-header-badge">
          <BiChip style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
          Gemini AI
        </span>
      </div>

      <div className="chat-page-shell">
        <FinanceChatPanel
          errorMessage={errorMessage}
          isLoading={isLoading}
          messages={messages}
          onSendMessage={sendMessage}
          showSuggestions={showSuggestions}
          subtitle="Ask about spending, saving, budgets, and financial habits."
          suggestions={suggestions}
          title="AI Financial Assistant"
          variant="page"
        />
      </div>
    </div>
  );
}

export default AIChat;
