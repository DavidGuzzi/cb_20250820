import { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { ExperimentTable } from './ExperimentTable';
import { RadarChartContainer } from './RadarChartContainer';
import { CompetitionTable } from './CompetitionTable';

interface ResultsVisualizationProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
}

export function ResultsVisualization({ filters }: ResultsVisualizationProps) {
  const [viewMode, setViewMode] = useState<'table' | 'radar' | 'competition'>('table');

  // Color mapping for tipologías (matching radar chart colors)
  const TIPOLOGIA_COLORS: Record<string, string> = {
    'Super e hiper': '#3b82f6',   // Blue
    'Conveniencia': '#10b981',     // Green
    'Droguerías': '#f97316',       // Orange
  };

  // Get color for current tipología
  const tipologiaColor = TIPOLOGIA_COLORS[filters.tipologia] || '#6b7280';

  return (
    <div className="h-full">
      <Card className="h-full bg-card shadow-sm">
        <CardHeader className="pb">
          {/* Header with toggles on opposite corners */}
          <div className="flex items-center justify-between">
            {/* Left side: Cuadro and Visual toggle */}
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'table'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cuadro
                </button>
                <button
                  onClick={() => setViewMode('radar')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === 'radar'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Visual
                </button>
              </div>

              <h3 className="font-semibold text-base">
                {viewMode === 'table' ? (
                  <>
                    <span className="text-foreground">Resultados descriptivos para Tipología </span>
                    <span style={{ color: tipologiaColor }}>{filters.tipologia}</span>
                  </>
                ) : viewMode === 'radar' ? (
                  <span className="text-foreground">Resultados descriptivos entre Tipologías</span>
                ) : (
                  <span className="text-foreground">Análisis de Competencia</span>
                )}
              </h3>
            </div>

            {/* Right side: Competition button */}
            <button
              onClick={() => setViewMode('competition')}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                viewMode === 'competition'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900'
              }`}
            >
              Competencia
            </button>
          </div>
        </CardHeader>

        <CardContent className="h-[calc(100%-60px)] p-0">
          {viewMode === 'table' ? (
            <ExperimentTable filters={filters} />
          ) : viewMode === 'radar' ? (
            <RadarChartContainer filters={filters} />
          ) : (
            <CompetitionTable filters={filters} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
