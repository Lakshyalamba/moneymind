import { useCallback, useEffect, useState } from 'react';
import { apiRequest, API_BASE_URL } from '../utils/auth';

const SUGGESTIONS = [
  'How can I reduce expenses?',
  'How should I plan my budget?',
  'Is my spending healthy?',
  'Give me savings tips'
];

const WELCOME_MESSAGE =
  "Hello! I'm your AI financial advisor. I can help you with budgeting, expense management, and financial planning based on your transaction data. What would you like to know?";

function createMessage(role, content, type = 'message') {
  const fallbackId = `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return {
    id: globalThis.crypto?.randomUUID?.() || fallbackId,
    role,
    content,
    type,
    createdAt: new Date().toISOString()
  };
}

function debugLog(label, payload) {
  if (import.meta.env.DEV) {
    console.debug(`[finance-chat] ${label}`, payload);
  }
}

export function useFinanceChat({ onUnauthorized } = {}) {
  const [messages, setMessages] = useState(() => [
    createMessage('assistant', WELCOME_MESSAGE)
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    debugLog('messages:state', messages.map(({ id, role, type, content }) => ({
      id,
      role,
      type,
      preview: content.slice(0, 80)
    })));
  }, [messages]);

  useEffect(() => {
    debugLog('loading:state', { isLoading });
  }, [isLoading]);

  useEffect(() => {
    if (errorMessage) {
      debugLog('error:state', { errorMessage });
    }
  }, [errorMessage]);

  const sendMessage = useCallback(async (rawMessage) => {
    const messageText = String(rawMessage || '').trim();

    debugLog('request:outgoing', {
      messageText,
      isLoading,
      currentMessageCount: messages.length
    });

    if (!messageText || isLoading) {
      return false;
    }

    setErrorMessage('');
    setMessages((prev) => [...prev, createMessage('user', messageText)]);
    setIsLoading(true);

    try {
      const response = await apiRequest(`${API_BASE_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText })
      });

      debugLog('response:meta', {
        ok: response.ok,
        status: response.status
      });

      let data = null;

      try {
        data = await response.json();
      } catch (parseError) {
        debugLog('response:parse-failed', parseError);
      }

      debugLog('response:body', data);

      if (response.status === 401) {
        onUnauthorized?.();
        throw new Error('Your session expired. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to get a response right now. Please try again.');
      }

      const assistantText = typeof data?.message === 'string' ? data.message.trim() : '';

      if (!assistantText) {
        throw new Error('The assistant returned an empty response. Please try again.');
      }

      setMessages((prev) => [...prev, createMessage('assistant', assistantText)]);
      return true;
    } catch (error) {
      const visibleError = error?.message || 'Unable to get a response right now. Please try again.';

      debugLog('request:error', {
        visibleError,
        rawError: error
      });

      setErrorMessage(visibleError);
      setMessages((prev) => [...prev, createMessage('assistant', visibleError, 'error')]);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages.length, onUnauthorized]);

  const hasConversation = messages.some((message) => message.role === 'user');
  const showSuggestions = !hasConversation && !isLoading;

  return {
    errorMessage,
    isLoading,
    messages,
    sendMessage,
    showSuggestions,
    suggestions: SUGGESTIONS
  };
}
