import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface TimelineChartProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
  };
}

export function TimelineChart({ filters }: TimelineChartProps) {
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [palancaName, setPalancaName] = useState<string>('');
  const [kpiName, setKpiName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maestroMappings, setMaestroMappings] = useState<any>(null);

  // Load maestro mappings once
  useEffect(() => {
    const loadMappings = async () => {
      try {
        const response = await apiService.getMaestroMappings();
        if (response.success) {
          setMaestroMappings(response.mappings);
        }
      } catch (err) {
        console.error('Error loading maestro mappings:', err);
      }
    };

    loadMappings();
  }, []);

  useEffect(() => {
    const loadEvolutionData = async () => {
      if (!maestroMappings) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Convert filter names to IDs, with defaults
        const defaultPalancaId = maestroMappings.palanca_name_to_id['Punta de Góndola'] || 8;
        const defaultKpiId = maestroMappings.kpi_name_to_id['Cajas Estandarizadas'] || 1;
        
        const palancaId = filters.palanca ? maestroMappings.palanca_name_to_id[filters.palanca] || defaultPalancaId : defaultPalancaId;
        const kpiId = filters.kpi ? maestroMappings.kpi_name_to_id[filters.kpi] || defaultKpiId : defaultKpiId;
        
        const response = await apiService.getEvolutionData(palancaId, kpiId, filters.tipologia);
        
        if (response.success) {
          // Transform data for the chart
          const chartData = response.data.map(item => ({
            period: item.period,
            control: item.control_value,
            test: item.test_value,
            difference: item.difference
          }));
          
          setEvolutionData(chartData);
          setPalancaName(response.palanca_name);
          setKpiName(response.kpi_name);
        } else {
          setError(response.error || 'Error loading evolution data');
        }
      } catch (err) {
        console.error('Error loading evolution data:', err);
        setError('Error connecting to server');
        setEvolutionData([]);
      } finally {
        setLoading(false);
      }
    };

    loadEvolutionData();
  }, [maestroMappings, filters.palanca, filters.kpi, filters.tipologia]);

  if (loading) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando evolución temporal...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">
          Evolución Temporal - {kpiName} | {palancaName}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <div className="h-full">
          {evolutionData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No hay datos disponibles para esta combinación
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="period" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    Number(value).toFixed(2), 
                    name === 'control' ? 'Control' : 
                    name === 'test' ? palancaName : name
                  ]}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend 
                  formatter={(value: string) => 
                    value === 'control' ? 'Control' : 
                    value === 'test' ? palancaName : value
                  }
                />
                
                {/* Línea de control - gris discontinua */}
                <Line 
                  type="monotone" 
                  dataKey="control" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ r: 4, fill: "hsl(var(--muted-foreground))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--muted-foreground))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
                
                {/* Línea de test - naranja continua */}
                <Line 
                  type="monotone" 
                  dataKey="test" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}