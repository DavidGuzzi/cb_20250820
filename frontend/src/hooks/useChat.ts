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
  suggestedQuestions: string[];
  suggestedQuestionsCount: number;
  isInSuggestedMode: boolean;
  sendSuggestedQuestion: (question: string) => Promise<void>;
  refreshSuggestedQuestions: () => Promise<void>;
}

export function useChat({ userEmail, onError }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState({});
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [suggestedQuestionsCount, setSuggestedQuestionsCount] = useState(0);
  const [isInSuggestedMode, setIsInSuggestedMode] = useState(true);

  // Save messages and suggested questions state to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      localStorage.setItem(`chat-messages-${userEmail}`, JSON.stringify(messages));
      localStorage.setItem(`chat-session-${userEmail}`, sessionId);
      localStorage.setItem(`chat-suggested-questions-${userEmail}`, JSON.stringify(suggestedQuestions));
      // Only persist suggested questions state if there has been interaction (count > 0)
      if (suggestedQuestionsCount > 0) {
        localStorage.setItem(`chat-questions-count-${userEmail}`, suggestedQuestionsCount.toString());
        localStorage.setItem(`chat-suggested-mode-${userEmail}`, isInSuggestedMode.toString());
      }
    }
  }, [messages, sessionId, userEmail, suggestedQuestions, suggestedQuestionsCount, isInSuggestedMode]);

  // Load persisted messages and session on mount
  useEffect(() => {
    if (userEmail) {
      const savedMessages = localStorage.getItem(`chat-messages-${userEmail}`);
      const savedSessionId = localStorage.getItem(`chat-session-${userEmail}`);
      const savedSuggestedQuestions = localStorage.getItem(`chat-suggested-questions-${userEmail}`);
      const savedQuestionsCount = localStorage.getItem(`chat-questions-count-${userEmail}`);
      const savedSuggestedMode = localStorage.getItem(`chat-suggested-mode-${userEmail}`);
      
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
      
      if (savedSuggestedQuestions) {
        try {
          const parsedQuestions = JSON.parse(savedSuggestedQuestions);
          setSuggestedQuestions(parsedQuestions);
        } catch (error) {
          console.warn('Failed to parse saved suggested questions:', error);
        }
      }
      
      if (savedQuestionsCount) {
        setSuggestedQuestionsCount(parseInt(savedQuestionsCount, 10) || 0);
      }
      
      if (savedSuggestedMode) {
        setIsInSuggestedMode(savedSuggestedMode === 'true');
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

          // Reset suggested questions state for new session
          setSuggestedQuestionsCount(0);
          setIsInSuggestedMode(true);
          localStorage.removeItem(`chat-questions-count-${userEmail}`);
          localStorage.removeItem(`chat-suggested-mode-${userEmail}`);

          // Set initial suggested questions
          if (session.suggested_questions) {
            setSuggestedQuestions(session.suggested_questions);
          }

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
  }, [userEmail, sessionId, messages.length, onError]); // Removed resetSuggestedQuestionsState to avoid infinite loop

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

    // If user types manually and has used suggested questions, switch to free mode
    if (suggestedQuestionsCount > 0) {
      setIsInSuggestedMode(false);
    }

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

        // Update suggested questions from response
        if (response.response.suggested_questions) {
          setSuggestedQuestions(response.response.suggested_questions);
        }

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
    setSuggestedQuestions([]);
    setSuggestedQuestionsCount(0);
    setIsInSuggestedMode(true);
    localStorage.removeItem(`chat-messages-${userEmail}`);
    localStorage.removeItem(`chat-session-${userEmail}`);
    localStorage.removeItem(`chat-suggested-questions-${userEmail}`);
    localStorage.removeItem(`chat-questions-count-${userEmail}`);
    localStorage.removeItem(`chat-suggested-mode-${userEmail}`);
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

  // Send a suggested question with tracking
  const sendSuggestedQuestion = useCallback(async (question: string) => {
    if (!sessionId || !question.trim() || isTyping) return;
    
    // Increment suggested questions count
    const newCount = suggestedQuestionsCount + 1;
    setSuggestedQuestionsCount(newCount);
    
    // Check if we've reached the limit of 4 suggested questions
    if (newCount >= 4) {
      setIsInSuggestedMode(false);
    }
    
    // Send the message normally
    await sendMessage(question);
  }, [sessionId, isTyping, suggestedQuestionsCount, sendMessage]);

  // Refresh suggested questions manually
  const refreshSuggestedQuestions = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await apiService.getSuggestedQuestions(sessionId);
      if (response.success) {
        setSuggestedQuestions(response.questions);
      }
    } catch (error) {
      console.warn('Failed to refresh suggested questions:', error);
    }
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
    suggestedQuestions,
    suggestedQuestionsCount,
    isInSuggestedMode,
    sendSuggestedQuestion,
    refreshSuggestedQuestions,
  };
}