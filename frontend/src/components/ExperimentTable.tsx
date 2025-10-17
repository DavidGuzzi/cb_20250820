import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { TrendingUp, TrendingDown, Target, Zap, Star, Settings, Users, ShoppingCart, TrendingDown as Triangle, Award, Compass, Gift, MapPin, Palette, Rocket } from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import { apiService } from '../services/api';

interface ExperimentTableProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
}

// Component for displaying cell values: difference_vs_control in color + average_variation in parentheses
const CellValue = ({
  variacion_promedio,
  diferencia_vs_control
}: {
  variacion_promedio: number;
  diferencia_vs_control: number;
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="text-center cursor-help">
        <div className={`font-medium text-sm ${
          diferencia_vs_control >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {diferencia_vs_control >= 0 ? '+' : ''}{(diferencia_vs_control * 100).toFixed(1)}%
          <span className="text-xs text-muted-foreground ml-1">
            ({variacion_promedio >= 0 ? '+' : ''}{(variacion_promedio * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <div className="space-y-1">
        <div className="font-semibold">
          Cambio vs. Control: {diferencia_vs_control >= 0 ? '+' : ''}{(diferencia_vs_control * 100).toFixed(1)}%
        </div>
        <div className="text-xs opacity-90">
          Variación de la Palanca: ({variacion_promedio >= 0 ? '+' : ''}{(variacion_promedio * 100).toFixed(1)}%)
        </div>
      </div>
    </TooltipContent>
  </Tooltip>
);

export function ExperimentTable({ filters }: ExperimentTableProps) {
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [palancas, setPalancas] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadResultsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert 'all' to undefined for API call
        const response = await apiService.getDashboardResults(
          filters.tipologia,
          filters.fuente === 'all' ? undefined : filters.fuente,
          filters.unidad === 'all' ? undefined : filters.unidad,
          filters.categoria === 'all' ? undefined : filters.categoria
        );

        if (response.success) {
          setResultsData(response.data);
          setPalancas(response.palancas);
          setSources(response.sources);
          setCategories(response.categories);
          setUnits(response.units);
        } else {
          setError('Error loading results data');
        }
      } catch (err) {
        console.error('Error loading results:', err);
        setError('Error connecting to server');
        // Fallback to empty data
        setResultsData([]);
        setPalancas([]);
        setSources([]);
        setCategories([]);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    loadResultsData();
  }, [filters.tipologia, filters.fuente, filters.unidad, filters.categoria]); // Reload when filters change

  // Helper function to find data for a specific combination
  const findDataForCell = (source: string, category: string, unit: string, palanca: string) => {
    return resultsData.find(item =>
      item.source === source &&
      item.category === category &&
      item.unit === unit &&
      item.palanca === palanca
    );
  };

  // Create rows: Group by source, then category, then unit
  interface RowGroup {
    source: string;
    category: string;
    unit: string;
  }

  const rowGroups: RowGroup[] = [];
  const seenKeys = new Set<string>();

  // Build unique combinations of source-category-unit
  resultsData.forEach(item => {
    const key = `${item.source}|||${item.category}|||${item.unit}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      rowGroups.push({
        source: item.source,
        category: item.category,
        unit: item.unit
      });
    }
  });

  // Sort by source, then category, then unit
  rowGroups.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.unit.localeCompare(b.unit);
  });

  // Calculate rowspan for each source
  const sourceRowspans = new Map<string, number>();
  rowGroups.forEach(group => {
    sourceRowspans.set(group.source, (sourceRowspans.get(group.source) || 0) + 1);
  });

  // Calculate rowspan for each source-category combination
  const categoryRowspans = new Map<string, number>();
  rowGroups.forEach(group => {
    const key = `${group.source}|||${group.category}`;
    categoryRowspans.set(key, (categoryRowspans.get(key) || 0) + 1);
  });

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

  // Icon mapping for palancas
  const getPalancaIcon = (palancaName: string) => {
    const palancaIconMap: Record<string, any> = {
      'Metro cuadrado': Target,
      'Nevera en punto de pago': Zap,
      'Punta de góndola': Star,
      'Rompe tráfico cross category': Settings,
      'Cajero vendedor': ShoppingCart,
      'Mini vallas en fachada': Award,
      'Tienda multipalanca': Compass,
      'Entrepaño con comunicación': Gift,
      'Exhibición adicional - mamut': MapPin
    };

    if (palancaIconMap[palancaName]) {
      return palancaIconMap[palancaName];
    }

    const fallbackIcons = [Palette, Rocket];
    const index = (palancaName.length + palancaName.charCodeAt(0)) % fallbackIcons.length;
    return fallbackIcons[index];
  };

  return (
    <Card className="h-full bg-card shadow-sm border-0 shadow-none">
      <CardContent className="h-full p-0">
        <ScrollArea className="h-full px-6 pb-6 pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40 text-muted-foreground font-medium">Fuente</TableHead>
                <TableHead className="w-32 text-muted-foreground font-medium">Categoría</TableHead>
                <TableHead className="w-32 text-muted-foreground font-medium">Unidad</TableHead>
                {palancas.map((palanca) => {
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
              {(() => {
                let lastSource = '';
                let lastCategory = '';
                let sourceRowIndex = 0;

                return rowGroups.map((group, index) => {
                  const isFirstRowOfSource = group.source !== lastSource;
                  const sourceRowspan = isFirstRowOfSource ? sourceRowspans.get(group.source) || 1 : 0;

                  const categoryKey = `${group.source}|||${group.category}`;
                  const isFirstRowOfCategory = group.source !== lastSource || group.category !== lastCategory;
                  const categoryRowspan = isFirstRowOfCategory ? categoryRowspans.get(categoryKey) || 1 : 0;

                  if (isFirstRowOfSource) {
                    lastSource = group.source;
                    lastCategory = group.category;
                    sourceRowIndex = 0;
                  } else if (isFirstRowOfCategory) {
                    lastCategory = group.category;
                  } else {
                    sourceRowIndex++;
                  }

                  return (
                    <TableRow key={`${group.source}_${group.category}_${group.unit}`} className="hover:bg-muted/50">
                      {isFirstRowOfSource && (
                        <TableCell className="font-medium text-foreground" rowSpan={sourceRowspan}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-green-600 rounded-full"></div>
                            <span>{group.source}</span>
                          </div>
                        </TableCell>
                      )}
                      {isFirstRowOfCategory && (
                        <TableCell className="font-medium text-sm text-foreground" rowSpan={categoryRowspan}>
                          {group.category}
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-foreground">
                        {group.unit}
                      </TableCell>
                      {palancas.map((palanca) => {
                        const data = findDataForCell(group.source, group.category, group.unit, palanca);
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
                  );
                });
              })()}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}