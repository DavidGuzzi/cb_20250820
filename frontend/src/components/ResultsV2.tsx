import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { 
  Send, 
  TrendingUp, 
  ArrowLeft, 
  Bot, 
  User, 
  CheckCircle, 
  Database, 
  Clock, 
  Zap,
  AlertCircle,
  Sun,
  Moon,
  BarChart3,
  MessageSquare,
  Brain,
  Sparkles,
  UserCircle,
  Crown,
  Star,
  UserCheck
} from 'lucide-react';
import { useChatContext } from '../contexts/ChatContext';
import { apiService } from '../services/api';
import { useTheme } from './ThemeProvider';
import gatoradeLogo from '../assets/4de2379cad6c1c3cdddbd220d1ac6ce242ae078f.png';
import gatoradeLogoDark from '../assets/0ebfb34dd11ac7b6cf64b19c7b02742c273e0b93.png';

interface ResultsProps {
  userEmail: string;
  onBackToDashboard: () => void;
}

export function Results({ userEmail, onBackToDashboard }: ResultsProps) {
  const { theme, toggleTheme } = useTheme();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Estados para el gráfico dinámico
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [chartType, setChartType] = useState<'region' | 'city'>('region');
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Use chat context instead of direct hook
  const {
    messages,
    isLoading,
    isTyping,
    sessionId,
    sendMessage,
    analytics,
    suggestedQuestions,
    suggestedQuestionsCount,
    isInSuggestedMode,
    sendSuggestedQuestion,
    refreshSuggestedQuestions
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

  // Cargar datos del gráfico
  useEffect(() => {
    const loadChartData = async () => {
      try {
        setChartLoading(true);
        const response = chartType === 'region' 
          ? await apiService.getRevenueByRegion()
          : await apiService.getRevenueByCity();
        
        if (response.success) {
          setChartData(response.data);
          setTotalRevenue(response.total_revenue);
        }
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setChartLoading(false);
      }
    };

    loadChartData();
  }, [chartType]);

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


  // Colores para el gráfico de torta
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const detailedData = [
    {
      id: 1,
      name: 'CTA Button Principal',
      variants: [
        { name: 'Control', visitors: 5420, conversions: 678, rate: 12.5, lift: 'baseline' },
        { name: 'Naranja', visitors: 5380, conversions: 817, rate: 15.2, lift: '+21.6%' },
        { name: 'Rojo', visitors: 5310, conversions: 993, rate: 18.7, lift: '+49.6%' }
      ],
      winner: 'Botón Rojo',
      duration: '14 días',
      status: 'Completado',
      significance: 99,
      revenue_impact: '+$142,500'
    },
    {
      id: 2,
      name: 'Landing Hero Banner',
      variants: [
        { name: 'Atleta', visitors: 3240, conversions: 421, rate: 13.0, lift: 'baseline' },
        { name: 'Producto', visitors: 3180, conversions: 509, rate: 16.0, lift: '+23.1%' }
      ],
      winner: 'Imagen Producto',
      duration: '12 días',
      status: 'Completado',
      significance: 95,
      revenue_impact: '+$89,200'
    },
    {
      id: 3,
      name: 'Email Subject Line',
      variants: [
        { name: 'Control', visitors: 8920, conversions: 1248, rate: 14.0, lift: 'baseline' },
        { name: 'Personalizado', visitors: 8850, conversions: 1983, rate: 22.4, lift: '+60.0%' }
      ],
      winner: 'Personalizado',
      duration: '7 días',
      status: 'Completado',
      significance: 99,
      revenue_impact: '+$230,800'
    }
  ];

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
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <img 
                src={theme === 'dark' ? gatoradeLogoDark : gatoradeLogo} 
                alt="Gatorade Logo" 
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">
                Gatorade A/B Testing
              </h1>
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant="default"
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Análisis</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-81px)]">
        {/* Panel izquierdo - Resultados detallados */}
        <div className="flex-1 p-6 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview">Resumen Final</TabsTrigger>
              <TabsTrigger value="details">Análisis Detallado</TabsTrigger>
              <TabsTrigger value="insights">Impacto & ROI</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full space-y-4 overflow-y-auto">
                {detailedData.map((test) => (
                  <Card key={test.id} className="bg-card border-l-4 border-l-accent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">{test.name}</CardTitle>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-accent text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completado
                          </Badge>
                          <Badge variant="outline">{test.significance}% confianza</Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{test.duration} • Ganador: {test.winner}</span>
                        <span className="font-medium text-accent">{test.revenue_impact}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {test.variants.map((variant, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-foreground">{variant.name}</h4>
                                <div className="flex items-center space-x-3">
                                  <span className={`text-lg font-semibold ${variant.rate === Math.max(...test.variants.map(v => v.rate)) ? 'text-accent' : 'text-foreground'}`}>
                                    {variant.rate}%
                                  </span>
                                  {variant.rate === Math.max(...test.variants.map(v => v.rate)) && (
                                    <TrendingUp className="w-4 h-4 text-accent" />
                                  )}
                                  <Badge variant={variant.lift === 'baseline' ? 'secondary' : 'default'} 
                                         className={variant.lift !== 'baseline' ? 'bg-primary text-white' : ''}>
                                    {variant.lift}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Visitantes</p>
                                  <p className="font-medium">{variant.visitors.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Conversiones</p>
                                  <p className="font-medium">{variant.conversions.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="details" className="h-full overflow-y-auto">
                <Card className="bg-card h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground">Revenue por {chartType === 'region' ? 'Región' : 'Ciudad'}</CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant={chartType === 'region' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType('region')}
                        >
                          Por Región
                        </Button>
                        <Button
                          variant={chartType === 'city' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType('city')}
                        >
                          Por Ciudad
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      Total Revenue: ${totalRevenue.toLocaleString()} • Datos en tiempo real
                    </div>
                  </CardHeader>
                  <CardContent className="h-96">
                    {chartLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-muted-foreground">Cargando datos...</div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                            labelFormatter={(label) => `${label}`}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    
                    {/* Estadísticas adicionales */}
                    {!chartLoading && chartData.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                        {chartData.map((item, index) => (
                          <div key={item.name} className="p-3 border rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              ></div>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="space-y-1 text-muted-foreground">
                              <div>Revenue: ${item.value.toLocaleString()}</div>
                              <div>Visitantes: {item.visitantes.toLocaleString()}</div>
                              <div>Conversiones: {item.conversiones.toLocaleString()}</div>
                              <div>Tasa conversión: {item.conversion_rate}%</div>
                              <div>PDVs: {item.pdv_count}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="h-full overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="p-4 bg-accent/10 border-accent/30">
                    <h4 className="font-medium text-accent mb-2">🏆 Experimentos Exitosos</h4>
                    <p className="text-sm text-muted-foreground">3 de 3 tests completados con resultados positivos significativos. 100% de tasa de éxito.</p>
                  </Card>

                  <Card className="p-4 bg-primary/10 border-primary/30">
                    <h4 className="font-medium text-primary mb-2">💰 Impacto Total</h4>
                    <p className="text-sm text-muted-foreground">+$462,500 en revenue proyectado anual. ROI promedio del 340% sobre inversión.</p>
                  </Card>

                  <Card className="p-4 bg-secondary/10 border-secondary/30">
                    <h4 className="font-medium text-foreground mb-2">📊 Mejor Performance</h4>
                    <p className="text-sm text-muted-foreground">Email personalizado: +60% lift. Mayor oportunidad de escalamiento inmediato.</p>
                  </Card>

                  <Card className="p-4 bg-green-600/10 border-green-600/30">
                    <h4 className="font-medium text-green-600 dark:text-green-400 mb-2">✅ Listos para Implementar</h4>
                    <p className="text-sm text-muted-foreground">Todos los cambios validados estadísticamente. Implementación recomendada inmediata.</p>
                  </Card>

                  <Card className="lg:col-span-2 p-4 bg-orange-500/10 border-orange-500/30">
                    <h4 className="font-medium text-orange-600 mb-2">🎯 Estrategia de Expansión</h4>
                    <p className="text-sm text-muted-foreground">
                      Próximos pasos: 1) Implementar cambios ganadores, 2) Escalar a mercados similares, 
                      3) Testear variaciones avanzadas, 4) Optimizar segmentación por demografía.
                    </p>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Panel derecho - Chatbot integrado */}
        <div className="w-[35%] min-w-[450px] max-w-[35%] bg-card border-l border-border flex flex-col" data-chat-area>
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
                  🟢 Conectado • Base de datos real • Memoria conversacional
                </p>
              </div>
            </div>
          </div>

          {/* Chat messages area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
        </div>
      </main>
    </div>
  );
}