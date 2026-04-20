import { useEffect, useId, useRef, useState } from 'react';
import { FiAlertCircle, FiMessageSquare, FiSend, FiX } from 'react-icons/fi';
import { BiBot } from 'react-icons/bi';
import '../../styles/financeChat.css';

function debugRender(label, payload) {
  if (import.meta.env.DEV) {
    console.debug(`[finance-chat:render] ${label}`, payload);
  }
}

function FinanceChatPanel({
  errorMessage,
  isLoading,
  messages,
  onClose,
  onSendMessage,
  showSuggestions,
  subtitle,
  suggestions,
  title,
  variant = 'page'
}) {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);
  const headingId = useId();
  const logId = useId();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  useEffect(() => {
    debugRender('conditions', {
      errorMessage,
      isLoading,
      messageCount: messages.length,
      showSuggestions,
      variant
    });
  }, [errorMessage, isLoading, messages.length, showSuggestions, variant]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const wasSent = await onSendMessage(draft);

    if (wasSent) {
      setDraft('');
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    const wasSent = await onSendMessage(suggestion);

    if (wasSent) {
      setDraft('');
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <section className={`finance-chat finance-chat--${variant}`} aria-labelledby={headingId}>
      <header className="finance-chat__header">
        <div className="finance-chat__header-copy">
          <BiBot className="finance-chat__header-icon" />
          <div>
            <h2 id={headingId} className="finance-chat__header-title">{title}</h2>
            <p className="finance-chat__header-subtitle">{subtitle}</p>
          </div>
        </div>

        {onClose && (
          <button
            className="finance-chat__close"
            onClick={onClose}
            aria-label="Close chat"
            type="button"
          >
            <FiX />
          </button>
        )}
      </header>

      <div className="finance-chat__body">
        {errorMessage && (
          <div className="finance-chat__notice finance-chat__notice--error" role="status">
            <FiAlertCircle />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="finance-chat__messages" id={logId} role="log" aria-live="polite" aria-relevant="additions">
          {!hasMessages && !isLoading && (
            <div className="finance-chat__empty">
              <BiBot className="finance-chat__empty-icon" />
              <p>No messages yet. Ask your first finance question to begin.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`finance-chat__message finance-chat__message--${message.role} ${message.type === 'error' ? 'finance-chat__message--error' : ''}`}
            >
              <div className="finance-chat__message-inner">
                {message.role === 'assistant' && <BiBot className="finance-chat__message-icon" />}
                <div className="finance-chat__message-bubble">{message.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="finance-chat__message finance-chat__message--assistant">
              <div className="finance-chat__message-inner">
                <BiBot className="finance-chat__message-icon" />
                <div className="finance-chat__message-bubble finance-chat__message-bubble--loading">
                  <div className="finance-chat__typing" aria-label="Assistant is typing">
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

        {showSuggestions && (
          <div className="finance-chat__suggestions">
            <p className="finance-chat__suggestions-label">Try asking:</p>
            <div className="finance-chat__suggestions-grid">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="finance-chat__suggestion"
                  disabled={isLoading}
                  onClick={() => handleSuggestionClick(suggestion)}
                  type="button"
                >
                  <FiMessageSquare className="finance-chat__suggestion-icon" />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="finance-chat__composer">
        <form className="finance-chat__composer-form" onSubmit={handleSubmit}>
          <textarea
            aria-controls={logId}
            className="finance-chat__composer-input"
            disabled={isLoading}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Ask me anything about your finances..."
            rows="1"
            value={draft}
          />

          <button
            aria-label="Send message"
            className="finance-chat__composer-send"
            disabled={isLoading}
            type="submit"
          >
            <FiSend />
          </button>
        </form>
      </div>
    </section>
  );
}

export default FinanceChatPanel;
