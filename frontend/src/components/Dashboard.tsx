import { useState } from 'react';
import { Button } from './ui/button';
import { Sun, Moon, BarChart3, MessageSquare, LogOut } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { SummaryCards } from './SummaryCards';
import { FilterPanel } from './FilterPanel';
import { ResultsVisualization } from './ResultsVisualization';
import { TimelineChart } from './TimelineChart';
import gatoradeLogo from '../assets/4de2379cad6c1c3cdddbd220d1ac6ce242ae078f.png';
import gatoradeLogoDark from '../assets/0ebfb34dd11ac7b6cf64b19c7b02742c273e0b93.png';
import poweredByImageLight from '../assets/8388e6abe7aa42dbcd9db7058b9d67171b1d8c24b.png';
import poweredByImageDark from '../assets/8388e6abe7aa42dbcd9db7058b9d67171b1d8c24.png';

interface DashboardProps {
  userEmail: string;
  onNavigateToResults: () => void;
  onLogout: () => void;
}

export function Dashboard({ userEmail, onNavigateToResults, onLogout }: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const [filters, setFilters] = useState({
    tipologia: 'Super e hiper', // Default tipologia
    palanca: '', // Sin palanca seleccionada por defecto
    fuente: 'all', // Default fuente (all = sin filtro)
    unidad: 'all', // Default unidad (all = sin filtro)
    categoria: 'all' // Default categoria (all = sin filtro)
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b bg-card px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <img
                src={theme === 'dark' ? gatoradeLogoDark : gatoradeLogo}
                alt="Gatorade Logo"
                className="w-14 h-14 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">
                Gatorade A/B Testing
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onNavigateToResults}
              className="flex items-center space-x-2 bg-orange-500/60 dark:bg-orange-600/50 text-white hover:!bg-primary transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Análisis</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-65px-48px)]">
        {/* Left Sidebar */}
        <div className="w-80 border-r bg-card flex flex-col h-full overflow-y-auto px-4 pt-4 pb-4">
          <div className="mb-4">
            <h2 className="mb-2 text-foreground font-bold text-base">Resumen de la ejecución</h2>
            <SummaryCards tipologia={filters.tipologia} palanca={filters.palanca} />
          </div>

          <div>
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4 bg-background">
          {/* Results Section (Table/Radar) - Takes 55% of height */}
          <div className="flex-[1.1] min-h-0">
            <h2 className="mb-2 text-foreground font-bold text-xl">Resumen de resultados descriptivos</h2>
            <ResultsVisualization filters={filters} />
          </div>

          {/* Chart Section - Takes 45% of height */}
          <div className="flex-[0.7] min-h-0 mt-12">
            <h2 className="mb-2 text-foreground font-bold text-xl">Evolución temporal</h2>
            <div className="h-[calc(100%-1rem)] max-h-80">
              <TimelineChart filters={filters} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-background h-12">
        <div className="h-full flex items-center justify-center relative">
          <div className="absolute inset-0 flex items-center px-6">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex items-center space-x-3 bg-background px-4">
            <span className="text-xs text-muted-foreground font-medium">Powered by</span>
            <a
              href="https://marketone.co/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <img
                src={theme === 'dark' ? poweredByImageDark : poweredByImageLight}
                alt="MarketOne Logo"
                className="h-8 opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
              />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}