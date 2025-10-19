import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types for Dashboard State
interface DashboardFilters {
  tipologia: string;
  palanca: string;
  fuente: string;
  unidad: string;
  categoria: string;
}

interface DashboardState {
  filters: DashboardFilters;
  resultsViewMode: 'table' | 'radar' | 'competition';
}

// Types for Analysis State
interface MonteCarloState {
  selectedTipologia: string;
  selectedUnidad: string;
  selectedPalancas: string[];
}

interface SimulationFormData {
  currentStep: number;
  tipologia: string;
  tipoPalanca: 'simple' | 'multiple' | '';
  palancasSeleccionadas: string[];
  tamanoTienda: string;
  features: {
    frentesPropios: number;
    frentesCompetencia: number;
    skuPropios: number;
    skuCompetencia: number;
    equiposFrioPropios: number;
    equiposFrioCompetencia: number;
    puertasPropias: number;
    puertasCompetencia: number;
  };
  exchangeRate: number;
  maco: number;
  results: {
    uplift: number;
    roi: number;
    payback: number;
  } | null;
}

interface AnalysisState {
  viewMode: 'personalizada' | 'estudio';
  monteCarloState: MonteCarloState;
  simulationFormData: SimulationFormData;
}

// Global App State
interface AppState {
  currentView: 'login' | 'dashboard' | 'results';
  dashboardState: DashboardState;
  analysisState: AnalysisState;
}

// Context type with methods
interface AppStateContextType extends AppState {
  // Navigation
  setCurrentView: (view: 'login' | 'dashboard' | 'results') => void;

  // Dashboard methods
  setDashboardFilters: (filters: Partial<DashboardFilters>) => void;
  setDashboardViewMode: (mode: 'table' | 'radar' | 'competition') => void;

  // Analysis methods
  setAnalysisViewMode: (mode: 'personalizada' | 'estudio') => void;
  setMonteCarloState: (state: Partial<MonteCarloState>) => void;
  setSimulationFormData: (data: Partial<SimulationFormData>) => void;

  // Reset methods
  resetDashboardState: () => void;
  resetAnalysisState: () => void;
  resetAllState: () => void;
}

// Default values
const defaultDashboardState: DashboardState = {
  filters: {
    tipologia: 'Super e hiper',
    palanca: '',
    fuente: 'all',
    unidad: 'all',
    categoria: 'all',
  },
  resultsViewMode: 'table',
};

const defaultAnalysisState: AnalysisState = {
  viewMode: 'personalizada',
  monteCarloState: {
    selectedTipologia: 'Super e hiper',
    selectedUnidad: 'Cajas 8oz',
    selectedPalancas: [],
  },
  simulationFormData: {
    currentStep: 1,
    tipologia: '',
    tipoPalanca: '',
    palancasSeleccionadas: [],
    tamanoTienda: '',
    features: {
      frentesPropios: 4,
      frentesCompetencia: 6,
      skuPropios: 12,
      skuCompetencia: 18,
      equiposFrioPropios: 1,
      equiposFrioCompetencia: 2,
      puertasPropias: 2,
      puertasCompetencia: 3,
    },
    exchangeRate: 3912,
    maco: 35,
    results: null,
  },
};

const defaultAppState: AppState = {
  currentView: 'login',
  dashboardState: defaultDashboardState,
  analysisState: defaultAnalysisState,
};

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// LocalStorage key
const STORAGE_KEY = 'gatorade_app_state';

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<AppState>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure new fields are present
        return {
          ...defaultAppState,
          ...parsed,
          dashboardState: {
            ...defaultDashboardState,
            ...parsed.dashboardState,
            filters: {
              ...defaultDashboardState.filters,
              ...parsed.dashboardState?.filters,
            },
          },
          analysisState: {
            ...defaultAnalysisState,
            ...parsed.analysisState,
            monteCarloState: {
              ...defaultAnalysisState.monteCarloState,
              ...parsed.analysisState?.monteCarloState,
            },
            simulationFormData: {
              ...defaultAnalysisState.simulationFormData,
              ...parsed.analysisState?.simulationFormData,
              features: {
                ...defaultAnalysisState.simulationFormData.features,
                ...parsed.analysisState?.simulationFormData?.features,
              },
            },
          },
        };
      }
    } catch (error) {
      console.error('Error loading app state from localStorage:', error);
    }
    return defaultAppState;
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (error) {
      console.error('Error saving app state to localStorage:', error);
    }
  }, [appState]);

  // Navigation
  const setCurrentView = (view: 'login' | 'dashboard' | 'results') => {
    setAppState(prev => ({ ...prev, currentView: view }));
  };

  // Dashboard methods
  const setDashboardFilters = (filters: Partial<DashboardFilters>) => {
    setAppState(prev => ({
      ...prev,
      dashboardState: {
        ...prev.dashboardState,
        filters: {
          ...prev.dashboardState.filters,
          ...filters,
        },
      },
    }));
  };

  const setDashboardViewMode = (mode: 'table' | 'radar' | 'competition') => {
    setAppState(prev => ({
      ...prev,
      dashboardState: {
        ...prev.dashboardState,
        resultsViewMode: mode,
      },
    }));
  };

  // Analysis methods
  const setAnalysisViewMode = (mode: 'personalizada' | 'estudio') => {
    setAppState(prev => ({
      ...prev,
      analysisState: {
        ...prev.analysisState,
        viewMode: mode,
      },
    }));
  };

  const setMonteCarloState = (state: Partial<MonteCarloState>) => {
    setAppState(prev => ({
      ...prev,
      analysisState: {
        ...prev.analysisState,
        monteCarloState: {
          ...prev.analysisState.monteCarloState,
          ...state,
        },
      },
    }));
  };

  const setSimulationFormData = (data: Partial<SimulationFormData>) => {
    setAppState(prev => ({
      ...prev,
      analysisState: {
        ...prev.analysisState,
        simulationFormData: {
          ...prev.analysisState.simulationFormData,
          ...data,
          // Deep merge for nested objects
          features: {
            ...prev.analysisState.simulationFormData.features,
            ...(data.features || {}),
          },
          results: data.results !== undefined ? data.results : prev.analysisState.simulationFormData.results,
        },
      },
    }));
  };

  // Reset methods
  const resetDashboardState = () => {
    setAppState(prev => ({
      ...prev,
      dashboardState: defaultDashboardState,
    }));
  };

  const resetAnalysisState = () => {
    setAppState(prev => ({
      ...prev,
      analysisState: defaultAnalysisState,
    }));
  };

  const resetAllState = () => {
    setAppState(defaultAppState);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AppStateContextType = {
    ...appState,
    setCurrentView,
    setDashboardFilters,
    setDashboardViewMode,
    setAnalysisViewMode,
    setMonteCarloState,
    setSimulationFormData,
    resetDashboardState,
    resetAnalysisState,
    resetAllState,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to use the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
