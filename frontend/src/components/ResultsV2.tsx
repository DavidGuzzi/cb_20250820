import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card } from './ui/card';
import {
  Send,
  Bot,
  Database,
  Clock,
  Zap,
  Sun,
  Moon,
  BarChart3,
  MessageSquare,
  UserCheck,
  LogOut
} from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { useTheme } from './ThemeProvider';
import { SimulationVisualization } from './SimulationVisualization';
import gatoradeLogo from '../assets/4de2379cad6c1c3cdddbd220d1ac6ce242ae078f.png';
import gatoradeLogoDark from '../assets/0ebfb34dd11ac7b6cf64b19c7b02742c273e0b93.png';
import poweredByImageLight from '../assets/8388e6abe7aa42dbcd9db7058b9d67171b1d8c24b.png';
import poweredByImageDark from '../assets/8388e6abe7aa42dbcd9db7058b9d67171b1d8c24.png';

interface ResultsProps {
  userEmail: string;
  onBackToDashboard: () => void;
  onLogout: () => void;
}

export function Results({ userEmail, onBackToDashboard, onLogout }: ResultsProps) {
  const { theme, toggleTheme } = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use chat context instead of direct hook
  const {
    messages,
    isLoading,
    isTyping,
    sessionId,
    sendMessage,
    suggestedQuestions,
    suggestedQuestionsCount,
    isInSuggestedMode,
    sendSuggestedQuestion
  } = useChatContext();

  // Auto-scroll simplificado sin interferir con el foco
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const scrollViewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (scrollViewport) {
          // Scroll instantáneo para evitar conflictos con animaciones
          scrollViewport.scrollTo({
            top: scrollViewport.scrollHeight,
            behavior: 'auto' // Cambié de 'smooth' a 'auto'
          });
        } else if (messagesEndRef.current) {
          // Fallback también instantáneo
          messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        }
      }
    };
    
    // Solo hacer scroll, sin manejar foco aquí
    if (messages.length > 0) {
      // Usar requestAnimationFrame para scroll después del render
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToBottom);
      });
    }
  }, [messages.length]);


  // Enfocar input solo después de carga inicial (una vez)
  useEffect(() => {
    if (messages.length > 0 && inputRef.current && !isTyping) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [messages.length === 1]); // Solo cuando aparece el primer mensaje (bienvenida)

  // Enfocar cuando el bot termine de escribir usando requestAnimationFrame
  useEffect(() => {
    if (!isTyping && inputRef.current && messages.length > 0) {
      let rafId: number;
      
      const focusAfterTyping = () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      };
      
      // Usar múltiples requestAnimationFrame para asegurar que el DOM esté listo
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(focusAfterTyping);
        });
      });

      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
      };
    }
  }, [isTyping, messages.length]);

  // Click dentro del área de chat para enfocar (comportamiento normal)
  useEffect(() => {
    const handleChatAreaClick = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Solo enfocar si se hace click dentro del área de chat, no en botones
      if (target && 
          target.closest('[data-chat-area]') && 
          !target.closest('button') && 
          !target.closest('input') &&
          inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleChatAreaClick);
    
    return () => {
      document.removeEventListener('click', handleChatAreaClick);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    const messageToSend = inputMessage;
    
    // PASO 1: Mantener foco INMEDIATAMENTE antes de cualquier operación
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // PASO 2: Limpiar input
    setInputMessage('');
    
    // PASO 3: Foco inmediato después de limpiar
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // PASO 4: Enviar mensaje (async)
    await sendMessage(messageToSend);
    
    // PASO 5: Refocus usando requestAnimationFrame (más confiable)
    const refocus = () => {
      if (inputRef.current && !isTyping) {
        inputRef.current.focus();
      }
    };
    
    requestAnimationFrame(refocus);
    requestAnimationFrame(() => requestAnimationFrame(refocus));
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(refocus)));
  };

  const handleSuggestedQuestion = async (question: string) => {
    if (isTyping) return;

    await sendSuggestedQuestion(question);

    // Enfocar después de enviar pregunta sugerida
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gradient-to-r from-muted/30 via-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-secondary">Conectando con el asistente de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation - matching Dashboard */}
      <header className="border-b bg-card px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? gatoradeLogoDark : gatoradeLogo}
                alt="Gatorade Logo"
                className="w-14 h-14 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">
                Gatorade A/B Testing
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 bg-orange-500/60 dark:bg-orange-600/50 text-white hover:!bg-primary transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-65px-48px)] gap-6 p-6">
        {/* Panel izquierdo - Simulaciones */}
        <div className="flex-1 overflow-y-auto">
          <SimulationVisualization />
        </div>

        {/* Panel derecho - Chatbot integrado */}
        <div className="w-[35%] min-w-[450px] max-w-[35%]" data-chat-area>
          <Card className="h-full bg-card shadow-sm flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse"></div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Asistente de Datos IA</h3>
                <p className="text-xs text-muted-foreground">
                  Conectado • Base de datos real • Memoria conversacional
                </p>
              </div>
            </div>
          </div>

          {/* Chat messages area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden">
            <div className="p-4 space-y-4 min-h-full overflow-hidden">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-br from-orange-500 to-red-500' 
                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <UserCheck className="w-3 h-3 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 text-white animate-pulse" />
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden min-w-0">
                      <div className={`px-3 py-2 rounded-lg text-sm break-words transition-all duration-200 ${
                        message.sender === 'user' 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}>
                        {message.text}
                      </div>
                      
                      {/* Show additional info for bot messages */}
                      {message.sender === 'bot' && (message.sql_used || message.execution_time) && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {message.sql_executed !== undefined && (
                            <div className="flex items-center space-x-1">
                              <Database className="w-3 h-3" />
                              <span>SQL: {message.sql_executed ? 'Ejecutado' : 'No requerido'}</span>
                            </div>
                          )}
                          {message.execution_time && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{message.execution_time.toFixed(2)}s</span>
                            </div>
                          )}
                          {message.cached && (
                            <div className="flex items-center space-x-1">
                              <Zap className="w-3 h-3" />
                              <span>Desde cache</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Preguntas sugeridas - aparecen después del último mensaje del bot */}
              {messages.length > 0 && 
               messages[messages.length - 1]?.sender === 'bot' && 
               !isTyping && 
               isInSuggestedMode && 
               suggestedQuestions.length > 0 && (
                <div className="space-y-3 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-medium">
                      {suggestedQuestionsCount === 0 
                        ? "💡 Comienza con una de estas preguntas:"
                        : `💡 Preguntas sugeridas (${suggestedQuestionsCount}/4)`
                      }
                    </p>
                    {suggestedQuestionsCount >= 4 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400">
                        Límite alcanzado - continúa escribiendo libremente
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    {suggestedQuestions.slice(0, 4).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={isTyping || !sessionId || suggestedQuestionsCount >= 4}
                        className="text-left justify-between items-start text-xs h-auto min-h-[44px] py-3 px-3 text-muted-foreground hover:text-foreground border-muted hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 w-full whitespace-normal"
                      >
                        <span className="flex-1 break-words pr-2 leading-relaxed">{question}</span>
                        <span className="text-primary flex-shrink-0 ml-2">→</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Bot className="w-3 h-3 text-white animate-pulse" />
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-muted border border-border/50">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border">
            {/* Mode indicator */}
            {isInSuggestedMode && suggestedQuestionsCount > 0 && suggestedQuestionsCount < 4 && (
              <div className="mb-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span className="text-primary font-medium">
                      Modo preguntas sugeridas ({suggestedQuestionsCount}/4)
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    Selecciona arriba o escribe tu pregunta
                  </span>
                </div>
              </div>
            )}

            {/* Switched to free mode */}
            {!isInSuggestedMode && suggestedQuestionsCount > 0 && (
              <div className="mb-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    Modo escritura libre activado
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                placeholder={isInSuggestedMode && suggestedQuestionsCount < 4 
                  ? "Escribe tu pregunta o usa las sugerencias de arriba..." 
                  : "Pregunta sobre los datos de tiendas, experimentos, conversiones..."
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 text-sm"
                disabled={isTyping || !sessionId}
              />
              <Button 
                onClick={handleSendMessage} 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={!inputMessage.trim() || isTyping || !sessionId}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background h-12">
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex items-center space-x-3 bg-background px-4">
            <span className="text-xs text-muted-foreground font-medium">Powered by</span>
            <a
              href="https://marketone.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src={theme === 'dark' ? poweredByImageDark : poweredByImageLight}
                alt="MarketOne Logo"
                className="h-8 opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}