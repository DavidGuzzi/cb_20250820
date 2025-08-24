// Custom hook for managing chat functionality
import { useState, useCallback, useEffect } from 'react';
import { apiService, ChatMessage } from '../services/api';

interface UseChatOptions {
  userEmail: string;
  onError?: (error: string) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  sessionId: string | null;
  sendMessage: (message: string) => Promise<void>;
  clearMessages: () => void;
  clearConversation: () => void;
  analytics: {
    cache_hit_rate?: number;
    total_queries?: number;
    avg_execution_time?: number;
  };
}

export function useChat({ userEmail, onError }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({});

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      localStorage.setItem(`chat-messages-${userEmail}`, JSON.stringify(messages));
      localStorage.setItem(`chat-session-${userEmail}`, sessionId);
    }
  }, [messages, sessionId, userEmail]);

  // Load persisted messages and session on mount
  useEffect(() => {
    if (userEmail) {
      const savedMessages = localStorage.getItem(`chat-messages-${userEmail}`);
      const savedSessionId = localStorage.getItem(`chat-session-${userEmail}`);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages);
        } catch (error) {
          console.warn('Failed to parse saved messages:', error);
        }
      }
      
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    }
  }, [userEmail]);

  // Initialize chat session only once per userEmail
  useEffect(() => {
    const initializeChat = async () => {
      try {
        setIsLoading(true);
        
        // Check backend health
        const health = await apiService.healthCheck();
        if (!health.chatbot_ready) {
          throw new Error('Chatbot is not ready');
        }

        // Only start new session if we don't have a persisted one
        if (!sessionId) {
          const session = await apiService.startChatSession(userEmail);
          setSessionId(session.session_id);

          // Add welcome message only if we don't have persisted messages
          if (messages.length === 0) {
            const welcomeMessage: ChatMessage = {
              id: '1',
              text: session.welcome_message,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages([welcomeMessage]);
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize chat';
        onError?.(errorMessage);
        console.error('Chat initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail && !sessionId) {
      initializeChat();
    }
  }, [userEmail, sessionId, messages.length]); // Added sessionId and messages.length as dependencies

  // Send message function
  const sendMessage = useCallback(async (messageText: string) => {
    if (!sessionId || !messageText.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send to backend
      const response = await apiService.sendMessage(sessionId, messageText);

      if (response.success) {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response.text,
          sender: 'bot',
          timestamp: new Date(),
          data: response.response.data,
          sql_used: response.response.sql_used,
          sql_executed: response.response.sql_executed,
          confidence: response.response.confidence,
          execution_time: response.response.execution_time,
          cached: response.response.cached,
          insights: response.response.insights,
        };

        setMessages(prev => [...prev, botMessage]);

        // Update analytics
        setAnalytics(prev => ({
          ...prev,
          total_queries: (prev.total_queries || 0) + 1,
          avg_execution_time: response.response.execution_time,
        }));
      } else {
        throw new Error('Failed to get response from chatbot');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      onError?.(errorMessage);
      
      // Add error message
      const errorBotMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Lo siento, hubo un error: ${errorMessage}. Por favor intenta de nuevo.`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsTyping(false);
    }
  }, [sessionId, onError]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear entire conversation and start fresh
  const clearConversation = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem(`chat-messages-${userEmail}`);
    localStorage.removeItem(`chat-session-${userEmail}`);
  }, [userEmail]);

  // Load analytics periodically
  useEffect(() => {
    if (!sessionId) return;

    const loadAnalytics = async () => {
      try {
        const analyticsData = await apiService.getAnalytics();
        if (analyticsData.success) {
          setAnalytics({
            cache_hit_rate: analyticsData.analytics.cache.cache_hit_rate,
            total_queries: analyticsData.analytics.cache.total_cached_queries,
          });
        }
      } catch (error) {
        console.warn('Failed to load analytics:', error);
      }
    };

    // Load analytics every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    loadAnalytics(); // Load immediately

    return () => clearInterval(interval);
  }, [sessionId]);

  return {
    messages,
    isLoading,
    isTyping,
    sessionId,
    sendMessage,
    clearMessages,
    clearConversation,
    analytics,
  };
}