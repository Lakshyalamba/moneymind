import { useState } from 'react';
import { HiSparkles } from 'react-icons/hi';
import FinanceChatPanel from './chat/FinanceChatPanel';
import { useFinanceChat } from '../hooks/useFinanceChat';
import '../styles/floatingWidget.css';

function AIFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const { errorMessage, isLoading, messages, sendMessage, showSuggestions, suggestions } = useFinanceChat({
    onUnauthorized: () => window.location.replace('/login')
  });

  return (
    <>
      <button
        aria-label="AI Assistant"
        className={`floating-chat-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <HiSparkles size={24} />
      </button>

      {isOpen && (
        <div className="floating-chat-modal">
          <FinanceChatPanel
            errorMessage={errorMessage}
            isLoading={isLoading}
            messages={messages}
            onClose={() => setIsOpen(false)}
            onSendMessage={sendMessage}
            showSuggestions={showSuggestions}
            subtitle="Your personal finance advisor"
            suggestions={suggestions}
            title="AI Financial Assistant"
            variant="floating"
          />
        </div>
      )}
    </>
  );
}

export default AIFloatingWidget;
