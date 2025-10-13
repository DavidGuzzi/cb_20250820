import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from './ui/card';

interface RadarChartViewProps {
  data: Array<{
    tipologia: string;
    palanca: string;
    avg_score: number;
  }>;
  tipologias: string[];
  mode: 'simple' | 'comparative';
  detailedData?: Array<{
    source: string;
    category: string;
    unit: string;
    palanca: string;
    variacion_promedio: number;
    diferencia_vs_control: number;
  }>;
}

// Color mapping for tipologias
const TIPOLOGIA_COLORS: Record<string, string> = {
  'Super e hiper': '#3b82f6',      // Blue
  'Conveniencia': '#10b981',        // Green
  'Droguerías': '#f97316',          // Orange
};

export function RadarChartView({ data, tipologias, mode, detailedData = [] }: RadarChartViewProps) {
  if (data.length === 0) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">No hay datos disponibles para el radar chart</div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for Recharts format
  // Need structure: [{ palanca: "X", "Super e hiper": 0.23, "Conveniencia": 0.18, ... }]
  const palancas = Array.from(new Set(data.map(item => item.palanca))).sort();

  const chartData = palancas.map(palanca => {
    const point: any = { palanca };

    data
      .filter(item => item.palanca === palanca)
      .forEach(item => {
        // Convert to percentage (multiply by 100), handle NaN/null
        const value = item.avg_score;
        point[item.tipologia] = (value !== null && !isNaN(value)) ? (value * 100) : 0;
      });

    return point;
  });

  // Custom tick component for wrapping long labels
  const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
    const words = payload.value.split(' ');
    const lineHeight = 14;

    // If the label is short, show it in one line
    if (words.length <= 2) {
      return (
        <text
          x={x}
          y={y}
          fill="hsl(var(--muted-foreground))"
          fontSize={11}
          fontWeight="bold"
          textAnchor={textAnchor}
        >
          {payload.value}
        </text>
      );
    }

    // For longer labels, split into multiple lines
    const midPoint = Math.ceil(words.length / 2);
    const line1 = words.slice(0, midPoint).join(' ');
    const line2 = words.slice(midPoint).join(' ');

    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
        fontWeight="bold"
        textAnchor={textAnchor}
      >
        <tspan x={x} dy={-lineHeight / 2}>
          {line1}
        </tspan>
        <tspan x={x} dy={lineHeight}>
          {line2}
        </tspan>
      </text>
    );
  };

  // Custom tooltip component with detailed breakdown
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const palanca = payload[0].payload.palanca;

      // Categories to exclude (Electrolit, Powerade, Otros)
      const excludedCategories = ['Electrolit', 'Powerade', 'Otros'];

      // Get all detailed data for this palanca, excluding certain categories
      const palancaDetails = detailedData.filter(item =>
        item.palanca === palanca && !excludedCategories.includes(item.category)
      );

      // Calculate average (what's shown in the radar)
      const avgScore = payload[0].value;

      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <p className="font-semibold text-sm text-foreground mb-2 border-b border-border pb-2">
            {palanca}
          </p>

          {/* Desglose por Fuente - Categoría */}
          {palancaDetails.length > 0 && (
            <div className="space-y-1 mb-2">
              <p className="text-xs font-medium text-muted-foreground mb-1">Desglose:</p>
              {palancaDetails.map((item, index) => (
                <div key={index} className="text-xs pl-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground truncate">
                      {item.source} - {item.category}
                    </span>
                    <span className={`font-medium ${item.diferencia_vs_control >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(item.diferencia_vs_control * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Promedio final */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Promedio Final:</span>
              <span className="font-bold text-primary">
                {avgScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full bg-card shadow-sm">
      <CardContent className="h-full p-6">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="palanca"
              tick={<CustomTick />}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 'auto']}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />

            {tipologias.map((tipologia) => (
              <Radar
                key={tipologia}
                name={tipologia}
                dataKey={tipologia}
                stroke={TIPOLOGIA_COLORS[tipologia] || '#6b7280'}
                fill={TIPOLOGIA_COLORS[tipologia] || '#6b7280'}
                fillOpacity={mode === 'comparative' ? 0.25 : 0.4}
                strokeWidth={2}
              />
            ))}

            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
