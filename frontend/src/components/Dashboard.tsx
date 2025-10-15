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
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <img 
                src={theme === 'dark' ? gatoradeLogoDark : gatoradeLogo} 
                alt="Gatorade Logo" 
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-xl font-bold text-foreground">
                Gatorade A/B Testing
              </h1>
            </div>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="default"
              className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onNavigateToResults}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Análisis</span>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex h-[calc(100vh-81px)]">
        {/* Left Sidebar */}
        <div className="w-72 border-r bg-card p-4 flex flex-col h-full">
          <div className="mb-8">
            <h2 className="mb-3 text-foreground font-bold text-lg">Resumen General</h2>
            <SummaryCards />
          </div>
          
          <div className="flex-1">
            <FilterPanel filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Powered by section */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col items-center space-y-2 mb-4">
              <span className="text-sm text-muted-foreground font-medium">Powered by</span>
              <a
                href="https://marketone.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src={theme === 'dark' ? poweredByImageDark : poweredByImageLight}
                  alt="Powered by"
                  className="h-10 opacity-90 hover:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
                />
              </a>
            </div>
          </div>

          {/* Botón Salir abajo a la izquierda */}
          <div className="pt-2 border-t border-border">
            <Button 
              variant="outline"
              onClick={onLogout}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 gap-4 bg-background">
          {/* Results Section (Table/Radar) - Takes 55% of height */}
          <div className="flex-[1.1] min-h-0">
            <ResultsVisualization filters={filters} />
          </div>

          {/* Chart Section - Takes 45% of height */}
          <div className="flex-[0.9] min-h-0">
            <h2 className="mb-2 text-foreground font-bold text-xl">Evolución Temporal</h2>
            <div className="h-[calc(100%-2rem)] max-h-80">
              <TimelineChart filters={filters} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}