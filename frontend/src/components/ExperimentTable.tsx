import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { TrendingUp, TrendingDown, Target, Zap, Star, Settings, Users, ShoppingCart, TrendingDown as Triangle, Award, Compass, Gift, MapPin, Palette, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface ExperimentTableProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
  };
}

// Component for displaying cell values horizontally
const CellValue = ({ 
  variacion_promedio, 
  diferencia_vs_control 
}: { 
  variacion_promedio: number; 
  diferencia_vs_control: number; 
}) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-2">
      <div className="font-medium text-sm text-foreground">
        {variacion_promedio.toFixed(1)}%
      </div>
      <div className={`text-xs font-medium ${
        diferencia_vs_control >= 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {diferencia_vs_control >= 0 ? '+' : ''}{diferencia_vs_control.toFixed(1)}%
      </div>
    </div>
  </div>
);

export function ExperimentTable({ filters }: ExperimentTableProps) {
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [palancas, setPalancas] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResultsData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getDashboardResults(filters.tipologia);
        
        if (response.success) {
          setResultsData(response.data);
          setPalancas(response.palancas);
          setKpis(response.kpis);
        } else {
          setError('Error loading results data');
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Error connecting to server');
        // Fallback to empty data
        setResultsData([]);
        setPalancas([]);
        setKpis([]);
      } finally {
        setLoading(false);
      }
    };

    loadResultsData();
  }, [filters.tipologia]); // Reload when tipologia changes

  // Helper function to find data for a specific KPI and palanca combination
  const findDataForCell = (kpi: string, palanca: string, source: 'sell_in' | 'sell_out') => {
    return resultsData.find(item => 
      item.kpi === kpi && 
      item.palanca === palanca && 
      item.source === source
    );
  };

  // Group KPIs by source (sell_in, sell_out)
  const groupedKpis = {
    sell_in: kpis.filter(kpi => resultsData.some(item => item.kpi === kpi && item.source === 'sell_in')),
    sell_out: kpis.filter(kpi => resultsData.some(item => item.kpi === kpi && item.source === 'sell_out'))
  };

  if (loading) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando resultados...</div>
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

  if (resultsData.length === 0) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">No hay datos disponibles para la tipología seleccionada</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">
          Resultados por KPI y Palanca - {filters.tipologia}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32 text-muted-foreground font-medium">Grupo</TableHead>
                <TableHead className="w-40 text-muted-foreground font-medium">KPI</TableHead>
                {palancas.map((palanca) => {
                  // Icon depends on specific palanca name (consistent across tipologías)
                  const getPalancaIcon = (palancaName: string) => {
                    // Map specific palancas to unique icons
                    const palancaIconMap: Record<string, any> = {
                      'Metro cuadrado': Target,
                      'Nevera en punto de pago': Zap,
                      'Punta de Góndola': Star,
                      'Rompe tráfico Cross Category': Settings,
                      'Zona de Hidratación ': Users,
                      'Cajero vendedor': ShoppingCart,
                      'Mini vallas en fachada': Award,
                      'Tienda Multipalanca': Compass,
                      'Entrepaño con comunicación': Gift,
                      'Exhibición Adicional - Mamut': MapPin
                    };
                    
                    // Return specific icon or fallback to a unique one based on string length + first char
                    if (palancaIconMap[palancaName]) {
                      return palancaIconMap[palancaName];
                    }
                    
                    // Fallback: use string length + first character for uniqueness
                    const fallbackIcons = [Palette, Rocket];
                    const index = (palancaName.length + palancaName.charCodeAt(0)) % fallbackIcons.length;
                    return fallbackIcons[index];
                  };
                  
                  const IconComponent = getPalancaIcon(palanca);
                  
                  return (
                    <TableHead key={palanca} className="text-center text-muted-foreground font-medium">
                      <div className="flex items-center justify-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{palanca}</span>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Sell In Group */}
              {groupedKpis.sell_in.length > 0 && (
                <>
                  {groupedKpis.sell_in.map((kpi, kpiIndex) => (
                    <TableRow key={`sell_in_${kpi}`} className="hover:bg-muted/50">
                      {kpiIndex === 0 && (
                        <TableCell className="font-medium text-foreground" rowSpan={groupedKpis.sell_in.length}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
                            <span>Sell In</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-muted-foreground">{kpi}</TableCell>
                      {palancas.map((palanca) => {
                        const data = findDataForCell(kpi, palanca, 'sell_in');
                        return (
                          <TableCell key={palanca}>
                            {data ? (
                              <CellValue 
                                variacion_promedio={data.variacion_promedio}
                                diferencia_vs_control={data.diferencia_vs_control}
                              />
                            ) : (
                              <div className="text-center text-muted-foreground text-sm">N/A</div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}

              {/* Sell Out Group */}
              {groupedKpis.sell_out.length > 0 && (
                <>
                  {groupedKpis.sell_out.map((kpi, kpiIndex) => (
                    <TableRow key={`sell_out_${kpi}`} className={`hover:bg-muted/50 ${kpiIndex === 0 && groupedKpis.sell_in.length > 0 ? 'border-t-2' : ''}`}>
                      {kpiIndex === 0 && (
                        <TableCell className="font-medium text-foreground" rowSpan={groupedKpis.sell_out.length}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 bg-green-600 rounded-full"></div>
                            <span>Sell Out</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-muted-foreground">{kpi}</TableCell>
                      {palancas.map((palanca) => {
                        const data = findDataForCell(kpi, palanca, 'sell_out');
                        return (
                          <TableCell key={palanca}>
                            {data ? (
                              <CellValue 
                                variacion_promedio={data.variacion_promedio}
                                diferencia_vs_control={data.diferencia_vs_control}
                              />
                            ) : (
                              <div className="text-center text-muted-foreground text-sm">N/A</div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}