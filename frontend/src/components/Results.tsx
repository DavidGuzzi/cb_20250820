import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Send, MessageSquare, TrendingUp, ArrowLeft, Bot, User, CheckCircle } from 'lucide-react';

interface ResultsProps {
  userEmail: string;
  onBackToDashboard: () => void;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Results({ userEmail, onBackToDashboard }: ResultsProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente de AB Testing de Gatorade. Todos los experimentos han sido completados exitosamente. ¿Qué análisis detallado necesitas?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = generateBotResponse(inputMessage);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const generateBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('conversión') || input.includes('conversion')) {
      return 'El mejor resultado fue el botón rojo con 18.7% de conversión (+49.6% vs control). El email personalizado también destacó con 22.4% (+60% vs control).';
    }
    
    if (input.includes('ganador') || input.includes('mejor') || input.includes('ganadore')) {
      return 'Los ganadores fueron: 1) Botón Rojo (+$142.5K), 2) Email Personalizado (+$230.8K), 3) Hero con Producto (+$89.2K). Total de impacto: +$462.5K.';
    }
    
    if (input.includes('visitantes') || input.includes('tráfico')) {
      return 'Se testaron 31,300 visitantes totales: CTA Button (16,110), Email Campaign (17,770), Landing Hero (6,420). Todos los tests alcanzaron significancia estadística.';
    }
    
    if (input.includes('recomendación') || input.includes('siguiente') || input.includes('implementar')) {
      return 'Recomendaciones: 1) Implementar inmediatamente el botón rojo y email personalizado, 2) Aplicar hero con producto, 3) Escalar estos cambios a otras regiones, 4) Testear variaciones similares.';
    }

    if (input.includes('estadística') || input.includes('significancia') || input.includes('confianza')) {
      return 'Todos los tests completados con alta confianza: CTA Button 99%, Email Campaign 99%, Landing Hero 95%. Resultados estadísticamente robustos y listos para implementación.';
    }

    if (input.includes('revenue') || input.includes('dinero') || input.includes('impacto') || input.includes('roi')) {
      return 'Impacto total en revenue: +$462,500. ROI promedio del 340%. El email personalizado fue el de mayor impacto individual (+$230.8K), seguido del botón rojo (+$142.5K).';
    }
    
    return 'Puedo ayudarte con análisis de conversiones finales, impacto en revenue, recomendaciones de implementación, significancia estadística y próximos pasos estratégicos.';
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-r from-muted/30 via-background to-muted/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-border shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={onBackToDashboard}
              className="text-secondary hover:text-secondary/80"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div className="w-px h-6 bg-border"></div>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-secondary">Resultados Finales</h1>
              <p className="text-sm text-muted-foreground">Experimentos Completados • IA Asistente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal horizontal */}
      <div className="flex-1 flex overflow-hidden">
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
                    <CardTitle className="text-secondary">Análisis Comparativo Final</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={detailedData[0].variants}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{fontSize: 12}} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip 
                          formatter={(value, name) => {
                            if (name === 'rate') return [`${value}%`, 'Conversión'];
                            if (name === 'visitors') return [value.toLocaleString(), 'Visitantes'];
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="rate" fill="#ff6600" name="rate" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
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

        {/* Panel derecho - Chatbot */}
        <div className="w-96 bg-white border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-secondary">Consultor de Resultados</h3>
                <p className="text-xs text-muted-foreground">Análisis experto de experimentos completados</p>
              </div>
            </div>
          </div>

          {/* Chat messages area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {chatMessages.map((message) => (
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
                    <div className={`px-3 py-2 rounded-lg text-sm ${message.sender === 'user' ? 'bg-primary text-white' : 'bg-muted text-secondary'}`}>
                      {message.text}
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
            </div>
          </ScrollArea>

          {/* Input area */}
          <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
              <Input
                placeholder="Consulta sobre los resultados finales..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 text-sm"
              />
              <Button 
                onClick={handleSendMessage} 
                size="sm"
                className="bg-primary hover:bg-primary/90"
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}