import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadarChartView } from './RadarChartView';
import { apiService } from '../services/api';

interface RadarChartContainerProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
}

export function RadarChartContainer({ filters }: RadarChartContainerProps) {
  const [radarData, setRadarData] = useState<any[]>([]);
  const [tipologias, setTipologias] = useState<string[]>([]);
  const [detailedData, setDetailedData] = useState<Record<string, any[]>>({});  // Store detailed data by tipología
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRadarData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Convert 'all' to undefined for API calls
        const fuenteFilter = filters.fuente === 'all' ? undefined : filters.fuente;
        const unidadFilter = filters.unidad === 'all' ? undefined : filters.unidad;
        const categoriaFilter = filters.categoria === 'all' ? undefined : filters.categoria;

        // Always fetch all 3 tipologías, but apply other filters
        const radarResponse = await apiService.getRadarData(
          'all',  // Always show all tipologías
          fuenteFilter,
          unidadFilter,
          categoriaFilter
        );

        if (radarResponse.success) {
          setRadarData(radarResponse.data);
          setTipologias(radarResponse.tipologias);

          // Fetch detailed data for each tipología for tooltips with filters applied
          const detailedDataByTipologia: Record<string, any[]> = {};
          for (const tipologia of radarResponse.tipologias) {
            const detailResponse = await apiService.getDashboardResults(
              tipologia,
              fuenteFilter,
              unidadFilter,
              categoriaFilter
            );
            if (detailResponse.success) {
              detailedDataByTipologia[tipologia] = detailResponse.data;
            }
          }
          setDetailedData(detailedDataByTipologia);
        } else {
          setError(radarResponse.error || 'Error loading radar data');
        }
      } catch (err) {
        console.error('Error loading radar data:', err);
        setError('Error connecting to server');
        setRadarData([]);
        setTipologias([]);
        setDetailedData({});
      } finally {
        setLoading(false);
      }
    };

    loadRadarData();
  }, [filters.fuente, filters.unidad, filters.categoria]);  // Reload when these filters change

  if (loading) {
    return (
      <Card className="h-full bg-card shadow-sm">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Cargando radar chart...</div>
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

  // Separate data by tipología for individual radars
  const tipologiaData = {
    'Super e hiper': radarData.filter(item => item.tipologia === 'Super e hiper'),
    'Conveniencia': radarData.filter(item => item.tipologia === 'Conveniencia'),
    'Droguerías': radarData.filter(item => item.tipologia === 'Droguerías')
  };

  return (
    <div className="h-full flex flex-col p-4">
      {/* Grid 1x3 horizontal layout */}
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Super e hiper */}
        <div className="flex flex-col">
          <h3 className="text-center text-base font-bold mb-3" style={{ color: '#3b82f6' }}>
            Super e hiper
          </h3>
          <div className="flex-1 min-h-0">
            <RadarChartView
              data={tipologiaData['Super e hiper']}
              tipologias={['Super e hiper']}
              mode="simple"
              detailedData={detailedData['Super e hiper'] || []}
            />
          </div>
        </div>

        {/* Conveniencia */}
        <div className="flex flex-col">
          <h3 className="text-center text-base font-bold mb-3" style={{ color: '#10b981' }}>
            Conveniencia
          </h3>
          <div className="flex-1 min-h-0">
            <RadarChartView
              data={tipologiaData['Conveniencia']}
              tipologias={['Conveniencia']}
              mode="simple"
              detailedData={detailedData['Conveniencia'] || []}
            />
          </div>
        </div>

        {/* Droguerías */}
        <div className="flex flex-col">
          <h3 className="text-center text-base font-bold mb-3" style={{ color: '#f97316' }}>
            Droguerías
          </h3>
          <div className="flex-1 min-h-0">
            <RadarChartView
              data={tipologiaData['Droguerías']}
              tipologias={['Droguerías']}
              mode="simple"
              detailedData={detailedData['Droguerías'] || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
