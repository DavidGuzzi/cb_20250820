import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
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
  <div className="text-center">
    <div className={`font-medium text-sm ${
      diferencia_vs_control >= 0 ? 'text-green-600' : 'text-red-600'
    }`}>
      {diferencia_vs_control >= 0 ? '+' : ''}{(diferencia_vs_control * 100).toFixed(1)}%
      <span className="text-xs text-muted-foreground ml-1">
        ({variacion_promedio >= 0 ? '+' : ''}{(variacion_promedio * 100).toFixed(1)}%)
      </span>
    </div>
  </div>
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

  // Create row groups: Source + Category combinations, with Unit as sub-rows
  const rowGroups: Array<{ source: string; category: string; units: string[] }> = [];

  // Create unique Source-Category combinations
  const sourceCategories = Array.from(new Set(
    resultsData.map(item => `${item.source}|||${item.category}`)
  )).map(key => {
    const [source, category] = key.split('|||');
    return { source, category };
  });

  // For each Source-Category, get its units
  sourceCategories.forEach(({ source, category }) => {
    const unitsForGroup = Array.from(new Set(
      resultsData
        .filter(item => item.source === source && item.category === category)
        .map(item => item.unit)
    ));

    rowGroups.push({
      source,
      category,
      units: unitsForGroup
    });
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
    <Card className="h-full bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground">
          Resultados por Fuente-Categoría y Palanca - {filters.tipologia}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48 text-muted-foreground font-medium">Grupo (Fuente - Categoría)</TableHead>
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
              {rowGroups.map((group, groupIndex) => (
                <Fragment key={`${group.source}_${group.category}`}>
                  {group.units.map((unit, unitIndex) => (
                    <TableRow key={`${group.source}_${group.category}_${unit}`} className="hover:bg-muted/50">
                      {unitIndex === 0 && (
                        <TableCell className="font-medium text-foreground" rowSpan={group.units.length}>
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-8 bg-gradient-to-b from-blue-600 to-green-600 rounded-full"></div>
                            <span>{group.source} - {group.category}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="font-medium text-sm text-muted-foreground">{unit}</TableCell>
                      {palancas.map((palanca) => {
                        const data = findDataForCell(group.source, group.category, unit, palanca);
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
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}