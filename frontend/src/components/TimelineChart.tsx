import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface TimelineChartProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    periodo: string;
  };
}

// Datos del timeline basados en el diseño (sin sombras verdes/negras)
const timelineData = [
  { fecha: 'Sem 1', control: 2400, palancaA: 2700 },
  { fecha: 'Sem 2', control: 2450, palancaA: 2800 },
  { fecha: 'Sem 3', control: 2380, palancaA: 2900 },
  { fecha: 'Sem 4', control: 2420, palancaA: 2950 },
  { fecha: 'Sem 5', control: 2400, palancaA: 3100 },
  { fecha: 'Sem 6', control: 2460, palancaA: 3200 },
  { fecha: 'Sem 7', control: 2440, palancaA: 3150 },
  { fecha: 'Sem 8', control: 2480, palancaA: 3300 },
];

export function TimelineChart({ filters }: TimelineChartProps) {
  return (
    <Card className="h-full bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">Evolución Temporal - Sell Out (€K)</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)]">
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="fecha" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `€${value}K`, 
                  name === 'control' ? 'Control' : 'Palanca A'
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
                  value === 'palancaA' ? 'Palanca A' : value
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
              
              {/* Línea de palanca A - naranja continua */}
              <Line 
                type="monotone" 
                dataKey="palancaA" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={3}
                dot={{ r: 4, fill: "hsl(var(--chart-1))" }}
                activeDot={{ r: 6, fill: "hsl(var(--chart-1))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}