import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Target, Zap, Star, Settings, ShoppingCart, Award, Compass, Gift, MapPin, Palette, Rocket } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import '../styles/competition-tooltip.css';

interface CompetitionTableProps {
  filters: {
    tipologia: string;
    palanca: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
}

// Component for displaying cell values
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
    <TooltipContent
      side="top"
      className="max-w-xs bg-red-600 text-white border-red-700 competition-tooltip"
    >
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

export function CompetitionTable({ filters }: CompetitionTableProps) {
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [palancas, setPalancas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompetitionData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert 'all' to undefined for API call
        const response = await apiService.getCompetitionResults(
          filters.tipologia,
          filters.fuente === 'all' ? undefined : filters.fuente,
          filters.unidad === 'all' ? undefined : filters.unidad
        );

        if (response.success) {
          setResultsData(response.data);
          setPalancas(response.palancas);
        } else {
          setError('Error loading competition data');
        }
      } catch (err) {
        console.error('Error loading competition:', err);
        setError('Error connecting to server');
        setResultsData([]);
        setPalancas([]);
      } finally {
        setLoading(false);
      }
    };

    loadCompetitionData();
  }, [filters.tipologia, filters.fuente, filters.unidad]);

  // Helper function to find data for a specific combination
  const findDataForCell = (source: string, category: string, unit: string, palanca: string) => {
    return resultsData.find(item =>
      item.source === source &&
      item.category === category &&
      item.unit === unit &&
      item.palanca === palanca
    );
  };

  // Create rows: Group by source, then unit, then category
  interface RowGroup {
    source: string;
    unit: string;
    category: string;
  }

  const rowGroups: RowGroup[] = [];
  const seenKeys = new Set<string>();

  // Build unique combinations of source-unit-category
  resultsData.forEach(item => {
    const key = `${item.source}|||${item.unit}|||${item.category}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      rowGroups.push({
        source: item.source,
        unit: item.unit,
        category: item.category
      });
    }
  });

  // Sort by source, then unit, then category
  rowGroups.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    if (a.unit !== b.unit) return a.unit.localeCompare(b.unit);
    return a.category.localeCompare(b.category);
  });

  // Calculate rowspan for each source
  const sourceRowspans = new Map<string, number>();
  rowGroups.forEach(group => {
    sourceRowspans.set(group.source, (sourceRowspans.get(group.source) || 0) + 1);
  });

  // Calculate rowspan for each source-unit combination
  const unitRowspans = new Map<string, number>();
  rowGroups.forEach(group => {
    const key = `${group.source}|||${group.unit}`;
    unitRowspans.set(key, (unitRowspans.get(key) || 0) + 1);
  });

  if (loading) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando datos de competencia...</div>
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
          <div className="text-muted-foreground">No hay datos de competencia disponibles</div>
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
                <TableHead className="w-32 text-muted-foreground font-medium">Unidad</TableHead>
                <TableHead className="w-32 text-muted-foreground font-medium">Categoría</TableHead>
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
                let lastUnit = '';
                let sourceRowIndex = 0;

                return rowGroups.map((group, index) => {
                  const isFirstRowOfSource = group.source !== lastSource;
                  const sourceRowspan = isFirstRowOfSource ? sourceRowspans.get(group.source) || 1 : 0;

                  const unitKey = `${group.source}|||${group.unit}`;
                  const isFirstRowOfUnit = group.source !== lastSource || group.unit !== lastUnit;
                  const unitRowspan = isFirstRowOfUnit ? unitRowspans.get(unitKey) || 1 : 0;

                  if (isFirstRowOfSource) {
                    lastSource = group.source;
                    lastUnit = group.unit;
                    sourceRowIndex = 0;
                  } else if (isFirstRowOfUnit) {
                    lastUnit = group.unit;
                  } else {
                    sourceRowIndex++;
                  }

                  return (
                    <TableRow key={`${group.source}_${group.unit}_${group.category}`} className="hover:bg-muted/50">
                      {isFirstRowOfSource && (
                        <TableCell className="font-medium text-foreground" rowSpan={sourceRowspan}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
                            <span>{group.source}</span>
                          </div>
                        </TableCell>
                      )}
                      {isFirstRowOfUnit && (
                        <TableCell className="font-medium text-sm text-foreground" rowSpan={unitRowspan}>
                          {group.unit}
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-foreground">
                        {group.category}
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
