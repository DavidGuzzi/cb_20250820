import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface TimelineChartProps {
  filters: {
    tipologia: string;
    palanca: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
}

export function TimelineChart({ filters }: TimelineChartProps) {
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [palancaName, setPalancaName] = useState<string>('');
  const [projectStartFormatted, setProjectStartFormatted] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingFilters, setMissingFilters] = useState<string[]>([]);

  // Color mapping for tipologías (matching radar chart colors)
  const TIPOLOGIA_COLORS: Record<string, string> = {
    'Super e hiper': '#3b82f6',   // Blue
    'Conveniencia': '#10b981',     // Green
    'Droguerías': '#f97316',       // Orange
  };

  // Get color for current tipología
  const palancaColor = TIPOLOGIA_COLORS[filters.tipologia] || '#3b82f6';

  // Custom label component for project start date
  const CustomLabel = (props: any) => {
    const { viewBox } = props;
    if (!viewBox) return null;

    // Position the label at the top of the chart area
    const labelY = 12;
    const arrowY = labelY + 3;

    return (
      <g>
        {/* Label text */}
        <text
          x={viewBox.x}
          y={labelY}
          textAnchor="middle"
          fill={palancaColor}
          fontSize="12"
          fontWeight="600"
        >
          Fecha inicio de Palanca
        </text>
        {/* Arrow pointing down */}
        <polygon
          points={`${viewBox.x - 6},${arrowY} ${viewBox.x + 6},${arrowY} ${viewBox.x},${arrowY + 10}`}
          fill={palancaColor}
        />
      </g>
    );
  };

  useEffect(() => {
    const loadEvolutionData = async () => {
      try {
        setLoading(true);
        setError(null);
        setMissingFilters([]);

        // Convert 'all' to undefined for API calls
        const tipologia = filters.tipologia;
        const fuente = filters.fuente === 'all' ? undefined : filters.fuente;
        const unidad = filters.unidad === 'all' ? undefined : filters.unidad;
        const categoria = filters.categoria === 'all' ? undefined : filters.categoria;
        const palanca = filters.palanca;

        const response = await apiService.getEvolutionData(
          tipologia,
          fuente,
          unidad,
          categoria,
          palanca
        );

        if (response.success) {
          // Transform data for the chart
          const chartData = response.data.map(item => ({
            period: item.period,
            date_formatted: item.date_formatted,
            control: item.control_value,
            palanca: item.palanca_value
          }));

          setEvolutionData(chartData);
          setPalancaName(response.palanca_name || filters.palanca);
          setProjectStartFormatted(response.project_start_formatted || null);
        } else {
          // Check if missing filters
          if (response.missing_filters && response.missing_filters.length > 0) {
            setMissingFilters(response.missing_filters);
          } else {
            setError(response.error || response.message || 'Error loading evolution data');
          }
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
  }, [filters.tipologia, filters.palanca, filters.fuente, filters.unidad, filters.categoria]);

  if (loading) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando evolución temporal...</div>
        </CardContent>
      </Card>
    );
  }

  // Show missing filters message
  if (missingFilters.length > 0) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground">Evolución Temporal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-80px)]">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">
              Para visualizar la evolución, selecciona:
            </p>
            <p className="text-foreground font-semibold">
              {missingFilters.join(', ')}
            </p>
          </div>
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
          Evolución Temporal - {palancaName}
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

                {/* Project start date reference line */}
                {projectStartFormatted && (
                  <ReferenceLine
                    x={projectStartFormatted}
                    stroke={palancaColor}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label={<CustomLabel />}
                  />
                )}

                <XAxis
                  dataKey="date_formatted"
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
                    name === 'palanca' ? palancaName : name
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
                    value === 'palanca' ? palancaName : value
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

                {/* Línea de palanca - color según tipología */}
                <Line
                  type="monotone"
                  dataKey="palanca"
                  stroke={palancaColor}
                  strokeWidth={3}
                  dot={{ r: 4, fill: palancaColor }}
                  activeDot={{ r: 6, fill: palancaColor, stroke: "hsl(var(--background))", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}