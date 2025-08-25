import { createContext, useContext, ReactNode } from 'react';
import { useChat } from '../hooks/useChat';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  data?: any[];
  sql_used?: string;
  sql_executed?: boolean;
  confidence?: number;
  execution_time?: number;
  cached?: boolean;
  insights?: {
    key_finding: string;
    supporting_metrics: string[];
    recommendations: string[];
    related_questions: string[];
  };
}

interface ChatContextType {
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

const ChatContext = createContext<ChatContextType | null>(null);

interface ChatProviderProps {
  children: ReactNode;
  userEmail: string;
  onError?: (error: string) => void;
}

export function ChatProvider({ children, userEmail, onError }: ChatProviderProps) {
  const chatState = useChat({ userEmail, onError });

  return (
    <ChatContext.Provider value={chatState}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}