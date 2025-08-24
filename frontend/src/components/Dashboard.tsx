import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, Activity, BarChart3, MessageSquare, LogOut, Filter, MapPin } from 'lucide-react';

interface DashboardProps {
  userEmail: string;
  onNavigateToResults: () => void;
}

export function Dashboard({ userEmail, onNavigateToResults }: DashboardProps) {
  const [experimentFilter, setExperimentFilter] = useState('all');
  const [businessFilter, setBusinessFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');

  // Datos filtrados basados en selecciones
  const getFilteredData = () => {
    // Simulamos datos diferentes según filtros
    let conversionData = [
      { name: 'Variant A', conversion: 12.5, visitors: 2400 },
      { name: 'Variant B', conversion: 15.2, visitors: 2210 },
      { name: 'Variant C', conversion: 18.7, visitors: 2290 },
    ];

    let mapData = [
      { region: 'Norte', experiments: 15, avgConversion: 16.2, color: '#ff6600' },
      { region: 'Sur', experiments: 12, avgConversion: 14.8, color: '#EE3D42' },
      { region: 'Centro', experiments: 18, avgConversion: 17.1, color: '#231F20' },
      { region: 'Este', experiments: 9, avgConversion: 13.5, color: '#4A4A4A' },
      { region: 'Oeste', experiments: 11, avgConversion: 15.9, color: '#ff6600' },
    ];

    // Aplicar filtros
    if (experimentFilter === 'email') {
      conversionData = conversionData.map(item => ({ 
        ...item, 
        conversion: item.conversion * 0.8 
      }));
    } else if (experimentFilter === 'landing') {
      conversionData = conversionData.map(item => ({ 
        ...item, 
        conversion: item.conversion * 1.2 
      }));
    }

    if (regionFilter !== 'all') {
      mapData = mapData.filter(item => item.region.toLowerCase() === regionFilter);
    }

    return { conversionData, mapData };
  };

  const { conversionData, mapData } = getFilteredData();

  const timelineData = [
    { day: 'L', variantA: 12.5, variantB: 15.2, variantC: 18.7 },
    { day: 'M', variantA: 13.1, variantB: 16.3, variantC: 19.2 },
    { day: 'X', variantA: 11.8, variantB: 14.9, variantC: 17.8 },
    { day: 'J', variantA: 14.2, variantB: 17.1, variantC: 20.3 },
    { day: 'V', variantA: 16.1, variantB: 19.2, variantC: 22.1 },
  ];

  const pieData = [
    { name: 'Email Tests', value: 40, color: '#ff6600' },
    { name: 'Landing Tests', value: 35, color: '#231F20' },
    { name: 'Product Tests', value: 25, color: '#EE3D42' },
  ];

  const completedTests = [
    { id: 1, name: 'CTA Button Principal', status: 'completed', result: '+18.7%', variant: 'C', category: 'Landing' },
    { id: 2, name: 'Hero Banner Landing', status: 'completed', result: '+16.0%', variant: 'B', category: 'Landing' },
    { id: 3, name: 'Email Subject Line', status: 'completed', result: '+22.3%', variant: 'A', category: 'Email' },
    { id: 4, name: 'Product Gallery', status: 'completed', result: '+14.5%', variant: 'B', category: 'Product' },
    { id: 5, name: 'Checkout Flow', status: 'completed', result: '+12.8%', variant: 'A', category: 'Product' },
  ];

  return (
    <div className="h-screen w-screen bg-gradient-to-r from-muted via-background to-muted/50 flex flex-col overflow-hidden">
      {/* Header horizontal */}
      <div className="bg-white border-b border-border shadow-sm flex-shrink-0">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-secondary">Gatorade AB Testing</h1>
              <p className="text-sm text-muted-foreground">Bienvenido, {userEmail}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={onNavigateToResults}
              className="bg-accent hover:bg-accent/90 text-white"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Análisis Avanzado
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal expandido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Columna izquierda - Métricas y Tests (más estrecha) */}
        <div className="w-72 bg-white border-r border-border p-4 overflow-y-auto">
          {/* Métricas principales compactas */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-secondary mb-3">Métricas Finales</h3>
            
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Tests Completados</span>
                </div>
                <span className="text-xl font-semibold text-secondary">54</span>
              </div>
            </div>

            <div className="bg-secondary/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span className="text-sm text-muted-foreground">Total Visitantes</span>
                </div>
                <span className="text-xl font-semibold text-secondary">847K</span>
              </div>
            </div>

            <div className="bg-accent/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <span className="text-sm text-muted-foreground">CVR Promedio</span>
                </div>
                <span className="text-xl font-semibold text-secondary">16.8%</span>
              </div>
            </div>

            <div className="bg-orange-500/5 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-muted-foreground">Éxito Rate</span>
                </div>
                <span className="text-xl font-semibold text-secondary">89%</span>
              </div>
            </div>
          </div>

          {/* Tests completados más recientes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-secondary">Tests Recientes</h3>
            {completedTests.slice(0, 4).map((test) => (
              <div key={test.id} className="p-3 border border-border rounded-lg bg-card">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm text-secondary leading-tight">{test.name}</h4>
                    <Badge className="text-xs bg-accent text-white">
                      Completado
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {test.category} • Variante {test.variant}
                    </span>
                    <span className="text-xs font-medium text-accent">{test.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón logout abajo izquierda */}
          <div className="absolute bottom-4 left-4">
            <Button variant="outline" size="sm" className="text-muted-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        {/* Columna principal expandida - Gráficos y filtros */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Filtros interactivos */}
          <div className="bg-white rounded-lg p-4 border border-border">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="font-medium text-secondary">Filtros:</span>
              </div>
              
              <Select value={experimentFilter} onValueChange={setExperimentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipo de Experimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los Experimentos</SelectItem>
                  <SelectItem value="email">Tests de Email</SelectItem>
                  <SelectItem value="landing">Tests de Landing</SelectItem>
                  <SelectItem value="product">Tests de Producto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Tipología de Negocio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Líneas</SelectItem>
                  <SelectItem value="sports">Deportes</SelectItem>
                  <SelectItem value="nutrition">Nutrición</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Zona Geográfica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las Regiones</SelectItem>
                  <SelectItem value="norte">Norte</SelectItem>
                  <SelectItem value="sur">Sur</SelectItem>
                  <SelectItem value="centro">Centro</SelectItem>
                  <SelectItem value="este">Este</SelectItem>
                  <SelectItem value="oeste">Oeste</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gráficos principales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mapa de resultados por región */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-secondary">
                  <MapPin className="w-5 h-5 mr-2 text-primary" />
                  Resultados por Región
                </CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mapData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{fontSize: 12}} />
                    <YAxis dataKey="region" type="category" tick={{fontSize: 12}} width={60} />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'avgConversion') return [`${value}%`, 'CVR Promedio'];
                        if (name === 'experiments') return [value, 'Tests'];
                        return [value, name];
                      }}
                      labelFormatter={(label) => `Región: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="avgConversion" fill="#ff6600" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de distribución de tests */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-secondary">Distribución por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Tests']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos expandidos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline horizontal expandido */}
            <Card className="lg:col-span-2 bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-secondary">Evolución de Resultados</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{fontSize: 12}} />
                    <YAxis tick={{fontSize: 12}} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name.replace('variant', 'Variant ')]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Line type="monotone" dataKey="variantA" stroke="#ff6600" strokeWidth={3} name="variantA" />
                    <Line type="monotone" dataKey="variantB" stroke="#231F20" strokeWidth={3} name="variantB" />
                    <Line type="monotone" dataKey="variantC" stroke="#EE3D42" strokeWidth={3} name="variantC" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Resumen de conversión filtrado */}
            <Card className="bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-secondary">
                  <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                  CVR Filtrado
                </CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{fontSize: 11}} />
                    <YAxis tick={{fontSize: 11}} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Conversión']}
                      labelFormatter={(label) => `Variante: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="conversion" fill="#ff6600" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}