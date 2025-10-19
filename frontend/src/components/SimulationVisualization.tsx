import { Card, CardContent, CardHeader } from './ui/card';
import { useAppState } from '../contexts/AppStateContext';
import { SimulationPersonalizada } from './SimulationPersonalizada';
import { SimulationEstudio } from './SimulationEstudio';

export function SimulationVisualization() {
  const { analysisState, setAnalysisViewMode } = useAppState();
  const viewMode = analysisState.viewMode;

  return (
    <div className="h-full">
      <Card className="h-full bg-card shadow-sm">
        <CardHeader className="pb-3">
          {/* Title and Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground">
              Simulaciones
            </h3>

            <div className="inline-flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setAnalysisViewMode('personalizada')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'personalizada'
                    ? 'bg-white dark:bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Personalizada
              </button>
              <button
                onClick={() => setAnalysisViewMode('estudio')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                  viewMode === 'estudio'
                    ? 'bg-white dark:bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Estudio Monte Carlo
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="h-[calc(100%-60px)] p-0">
          {viewMode === 'personalizada' ? (
            <SimulationPersonalizada />
          ) : (
            <SimulationEstudio />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
