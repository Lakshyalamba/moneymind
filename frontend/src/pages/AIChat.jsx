import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-content">
          <div className="page-header">
            <h1>Chat</h1>
            <p>Chat with your personal finance assistant</p>
          </div>
          <div className="chat-page-shell">
            <div className="chat-page-loading">Loading chat...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-content">
        <div className="page-header">
          <h1>Chat</h1>
          <p>Chat with your personal finance assistant</p>
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
      </main>
    </div>
  );
}

export default AIChat;
