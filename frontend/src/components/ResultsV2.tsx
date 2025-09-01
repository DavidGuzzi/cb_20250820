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
  MessageSquare 
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
    analytics
  } = useChatContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        // Find the scroll viewport within our ScrollArea component
        const scrollViewport = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]');
        if (scrollViewport) {
          // Use a longer timeout to ensure content has been rendered
          setTimeout(() => {
            scrollViewport.scrollTo({
              top: scrollViewport.scrollHeight,
              behavior: 'smooth'
            });
          }, 200);
        } else {
          // Fallback: try with messagesEndRef
          if (messagesEndRef.current) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 200);
          }
        }
      }
    };
    
    // Scroll on new messages or when typing indicator changes
    if (messages.length > 0 || isTyping) {
      scrollToBottom();
    }
  }, [messages.length, isTyping]); // Watch messages.length instead of messages array to avoid excessive re-renders

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

  // Mantener el input enfocado
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && !isTyping && !document.activeElement?.closest('.scroll-area')) {
        inputRef.current.focus();
      }
    };

    // Enfocar con un delay más largo para asegurar que el DOM esté listo
    const timer = setTimeout(focusInput, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [isTyping, messages.length]);

  // Enfocar cuando cambie el estado de typing
  useEffect(() => {
    if (!isTyping && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 500); // Delay mayor para después de que termine de escribir

      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // Enfocar al hacer click en cualquier parte del área de chat (excepto el scroll)
  useEffect(() => {
    const handleChatClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target && !target.closest('input') && !target.closest('button') && inputRef.current) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('click', handleChatClick);
    return () => document.removeEventListener('click', handleChatClick);
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
    
    // Enfocar explícitamente después de enviar
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
                  <Card key={test.id} className="bg-white border-l-4 border-l-accent">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-secondary">{test.name}</CardTitle>
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
                                <h4 className="font-medium text-secondary">{variant.name}</h4>
                                <div className="flex items-center space-x-3">
                                  <span className={`text-lg font-semibold ${variant.rate === Math.max(...test.variants.map(v => v.rate)) ? 'text-accent' : 'text-secondary'}`}>
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
                <Card className="bg-white h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-secondary">Revenue por {chartType === 'region' ? 'Región' : 'Ciudad'}</CardTitle>
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
                    <p className="text-sm text-secondary">3 de 3 tests completados con resultados positivos significativos. 100% de tasa de éxito.</p>
                  </Card>

                  <Card className="p-4 bg-primary/10 border-primary/30">
                    <h4 className="font-medium text-primary mb-2">💰 Impacto Total</h4>
                    <p className="text-sm text-secondary">+$462,500 en revenue proyectado anual. ROI promedio del 340% sobre inversión.</p>
                  </Card>

                  <Card className="p-4 bg-secondary/10 border-secondary/30">
                    <h4 className="font-medium text-secondary mb-2">📊 Mejor Performance</h4>
                    <p className="text-sm text-secondary">Email personalizado: +60% lift. Mayor oportunidad de escalamiento inmediato.</p>
                  </Card>

                  <Card className="p-4 bg-green-600/10 border-green-600/30">
                    <h4 className="font-medium text-green-700 mb-2">✅ Listos para Implementar</h4>
                    <p className="text-sm text-secondary">Todos los cambios validados estadísticamente. Implementación recomendada inmediata.</p>
                  </Card>

                  <Card className="lg:col-span-2 p-4 bg-orange-500/10 border-orange-500/30">
                    <h4 className="font-medium text-orange-600 mb-2">🎯 Estrategia de Expansión</h4>
                    <p className="text-sm text-secondary">
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
        <div className="w-96 bg-white border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary">Asistente de Datos IA</h3>
                <p className="text-xs text-muted-foreground">
                  Conectado a base de datos real • Memoria conversacional
                </p>
              </div>
            </div>
          </div>

          {/* Chat messages area */}
          <ScrollArea ref={scrollAreaRef} className="flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <div className="p-4 space-y-4 min-h-full">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user' ? 'bg-primary' : 'bg-secondary'}`}>
                      {message.sender === 'user' ? (
                        <User className="w-3 h-3 text-white" />
                      ) : (
                        <Bot className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className={`px-3 py-2 rounded-lg text-sm ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-muted text-secondary'}`}>
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
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-muted">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                placeholder="Pregunta sobre los datos de tiendas, experimentos, conversiones..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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