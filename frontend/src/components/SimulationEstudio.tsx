import { useState, useEffect } from 'react';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ChevronDown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';
import { apiService } from '../services/api';
import { useAppState } from '../contexts/AppStateContext';

// Mapeo de nombres legibles a nombres de columna en DB
const PALANCA_LABELS: Record<string, string> = {
  'punta_de_gondola': 'Punta de góndola',
  'metro_cuadrado': 'Metro cuadrado',
  'nevera_en_punto_de_pago': 'Nevera en punto de pago',
  'rompe_trafico_cross_category': 'Rompe tráfico cross category',
  'mini_vallas_en_fachada': 'Mini vallas en fachada',
  'cajero_vendedor': 'Cajero vendedor',
  'exhibicion_adicional_mamut': 'Exhibición adicional mamut',
  'entrepano_con_comunicacion': 'Entrepaño con comunicación',
  'tienda_multipalanca': 'Tienda multipalanca'
};

// Colores por tipología
const TIPOLOGIA_COLORS: Record<string, string> = {
  'Super e hiper': '#3b82f6',    // Azul
  'Conveniencia': '#10b981',     // Verde
  'Droguerías': '#f97316'        // Naranja
};

interface MonteCarloData {
  uplift_values: number[];
  statistics: {
    media: number;
    mediana: number;
    p25: number;
    p75: number;
  };
  available_palancas: string[];
  count: number;
}

export function SimulationEstudio() {
  const { analysisState, setMonteCarloState } = useAppState();
  const { selectedTipologia, selectedUnidad, selectedPalancas } = analysisState.monteCarloState;
  const [data, setData] = useState<MonteCarloData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch data whenever tipologia, unidad, or selected palancas change
  useEffect(() => {
    fetchMonteCarloData();
  }, [selectedTipologia, selectedUnidad, selectedPalancas]);

  const fetchMonteCarloData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMonteCarloData(selectedTipologia, selectedUnidad, selectedPalancas);

      if (response.success) {
        setData({
          uplift_values: response.uplift_values,
          statistics: response.statistics,
          available_palancas: response.available_palancas,
          count: response.count
        });
      } else {
        setError(response.error || 'Error al cargar datos');
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
      console.error('Monte Carlo data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePalanca = (palanca: string) => {
    setMonteCarloState({
      selectedPalancas: selectedPalancas.includes(palanca)
        ? selectedPalancas.filter(p => p !== palanca)
        : [...selectedPalancas, palanca]
    });
  };

  // Prepare histogram data (create bins)
  const prepareHistogramData = () => {
    if (!data || data.uplift_values.length === 0) return [];

    const values = data.uplift_values;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Create 30 bins
    const numBins = 30;
    const binSize = (max - min) / numBins;

    const bins: { range: string; count: number; midpoint: number }[] = [];

    for (let i = 0; i < numBins; i++) {
      const binStart = min + i * binSize;
      const binEnd = binStart + binSize;
      const count = values.filter(v => v >= binStart && v < binEnd).length;

      bins.push({
        range: `${(binStart * 100).toFixed(0)}-${(binEnd * 100).toFixed(0)}`,
        count: count,
        midpoint: (binStart + binEnd) / 2
      });
    }

    return bins;
  };

  const histogramData = prepareHistogramData();
  const currentColor = TIPOLOGIA_COLORS[selectedTipologia] || '#3b82f6';

  // Helper function to get color based on value sign
  const getValueColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Helper function to format selected palancas for title
  const formatPalancasForTitle = (palancas: string[]): string => {
    if (palancas.length === 0) return '';
    const labels = palancas.map(p => PALANCA_LABELS[p] || p);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;
    const lastIndex = labels.length - 1;
    return labels.slice(0, lastIndex).join(', ') + ', y ' + labels[lastIndex];
  };

  return (
    <div className="h-full flex flex-col p-6 gap-4">
      {/* Header con botones de tipología, unidad y palancas */}
      <div className="flex items-start gap-8">
        {/* Grupo: Selecciona Tipología */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Selecciona Tipología</p>
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1 gap-1">
            {(['Super e hiper', 'Conveniencia', 'Droguerías'] as const).map((tip) => {
              const isSelected = selectedTipologia === tip;
              const colors: Record<typeof tip, string> = {
                'Super e hiper': 'from-blue-500 to-blue-600',
                'Conveniencia': 'from-green-500 to-green-600',
                'Droguerías': 'from-orange-500 to-orange-600'
              };
              return (
                <button
                  key={tip}
                  onClick={() => {
                    setMonteCarloState({
                      selectedTipologia: tip,
                      selectedPalancas: [] // Reset palancas on tipologia change
                    });
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${colors[tip]} text-white shadow-sm`
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tip}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grupo: Selecciona Unidad de Medida */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Selecciona Unidad de Medida</p>
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
            {['Cajas 8oz', 'Ventas'].map((unidad) => {
              const isSelected = selectedUnidad === unidad;

              return (
                <button
                  key={unidad}
                  onClick={() => setMonteCarloState({ selectedUnidad: unidad })}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-gray-800 text-white shadow-sm dark:bg-gray-900'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {unidad}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grupo: Selecciona Palancas (Multi-select) */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Filtrar por Palancas</p>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-between text-xs"
                disabled={!data?.available_palancas || data.available_palancas.length === 0}
              >
                <span className="truncate">
                  {selectedPalancas.length === 0
                    ? 'Seleccionar palancas...'
                    : `${selectedPalancas.length} palanca(s) seleccionada(s)`}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
                {data?.available_palancas && data.available_palancas.length > 0 ? (
                  <>
                    {data.available_palancas.map((palanca) => (
                      <div
                        key={palanca}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer transition-colors"
                        onClick={() => togglePalanca(palanca)}
                      >
                        <Checkbox
                          id={`palanca-${palanca}`}
                          checked={selectedPalancas.includes(palanca)}
                          onCheckedChange={() => togglePalanca(palanca)}
                        />
                        <label
                          htmlFor={`palanca-${palanca}`}
                          className="text-sm text-foreground cursor-pointer select-none flex-1"
                        >
                          {PALANCA_LABELS[palanca] || palanca}
                        </label>
                      </div>
                    ))}

                    {selectedPalancas.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMonteCarloState({ selectedPalancas: [] })}
                          className="w-full text-xs"
                        >
                          Limpiar selección
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No hay palancas disponibles
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main content: Histogram (left) + Stats (right centered) */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: Histogram */}
        <div className="flex-[7] p-4 flex flex-col bg-card rounded-lg">
          {selectedPalancas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">Selecciona al menos una palanca en filtro de arriba</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Cargando distribución...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-red-500">
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : !data || data.count === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">No hay datos disponibles para esta combinación</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Distribución de Uplift (%) - {selectedTipologia}
                </h4>
                {selectedPalancas.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Palancas seleccionadas: {formatPalancasForTitle(selectedPalancas)}
                  </p>
                )}
              </div>

              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                    />

                    {/* Bars */}
                    <Bar dataKey="count" fill={currentColor} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* Right: Stats card (centered vertically) */}
        <div className="flex-[3] flex items-center justify-center">
          {data && data.count > 0 && selectedPalancas.length > 0 && (
            <Card className="w-full max-w-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Resumen de uplifts esperados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Conservador</p>
                    <p className={`text-xl font-bold ${getValueColor(data.statistics.p25)}`}>
                      {(data.statistics.p25 * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground mb-1">Valor Esperado</p>
                    <p className={`text-xl font-bold ${getValueColor(data.statistics.mediana)}`}>
                      {(data.statistics.mediana * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center py-2">
                    <p className="text-xs text-muted-foreground mb-1">Optimista</p>
                    <p className={`text-xl font-bold ${getValueColor(data.statistics.p75)}`}>
                      {(data.statistics.p75 * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}