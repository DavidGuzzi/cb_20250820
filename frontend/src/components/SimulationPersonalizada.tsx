import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui/tooltip';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  Zap,
  Ruler,
  Grid3x3,
  Wallet,
  Brain,
  Info,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { useAppState } from '../contexts/AppStateContext';

// Tipos
type Tipologia = 'Super e hiper' | 'Conveniencia' | 'Droguerías' | '';
type TipoPalanca = 'simple' | 'multiple' | '';
type TamanoTienda = 'Pequeño' | 'Mediano' | 'Grande' | '';

interface FormData {
  tipologia: Tipologia;
  tipoPalanca: TipoPalanca;
  palancasSeleccionadas: string[];
  tamanoTienda: TamanoTienda;
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
}

interface CapexBreakdown {
  palanca: string;
  capex_usd: number;
  fee_usd: number;
  capex_cop: number;
  fee_cop: number;
}

interface Results {
  uplift: number;
  roi: number;
  payback: number;
}

// Datos
const TIPOLOGIAS: Tipologia[] = ['Super e hiper', 'Conveniencia', 'Droguerías'];

// Store size descriptions by tipologia (for tooltips)
const STORE_SIZE_DESCRIPTIONS: Record<Tipologia, Record<TamanoTienda, string>> = {
  'Super e hiper': {
    'Pequeño': 'PDV con ventas mensuales entre 0-50 cajas',
    'Mediano': 'PDV con ventas mensuales entre 51-100 cajas',
    'Grande': 'PDV con ventas mensuales mayores a 100 cajas',
    '': ''
  },
  'Conveniencia': {
    'Pequeño': 'PDV con ventas mensuales entre 0-20 cajas',
    'Mediano': 'PDV con ventas mensuales entre 21-40 cajas',
    'Grande': 'PDV con ventas mensuales mayores a 40 cajas',
    '': ''
  },
  'Droguerías': {
    'Pequeño': 'PDV con ventas mensuales entre 0-10 cajas',
    'Mediano': 'PDV con ventas mensuales entre 11-15 cajas',
    'Grande': 'PDV con ventas mensuales mayores a 15 cajas',
    '': ''
  },
  '': { 'Pequeño': '', 'Mediano': '', 'Grande': '', '': '' }
};

// Rangos observados por tipología y tamaño (para tooltips)
const FEATURE_RANGES: Record<string, Record<string, string>> = {
  'Super e hiper_Grande': {
    frentes: '6-10 frentes',
    skus: '15-20 SKUs',
    equipos: '2-4 equipos',
    puertas: '3-5 puertas'
  },
  'Super e hiper_Mediano': {
    frentes: '4-8 frentes',
    skus: '10-15 SKUs',
    equipos: '1-3 equipos',
    puertas: '2-4 puertas'
  },
  'Super e hiper_Pequeño': {
    frentes: '2-5 frentes',
    skus: '8-12 SKUs',
    equipos: '1-2 equipos',
    puertas: '1-3 puertas'
  },
  'Conveniencia_Mediano': {
    frentes: '3-6 frentes',
    skus: '8-12 SKUs',
    equipos: '1-2 equipos',
    puertas: '2-3 puertas'
  },
  'Conveniencia_Pequeño': {
    frentes: '2-4 frentes',
    skus: '6-10 SKUs',
    equipos: '1 equipo',
    puertas: '1-2 puertas'
  },
  'Conveniencia_Grande': {
    frentes: '5-8 frentes',
    skus: '12-18 SKUs',
    equipos: '2-3 equipos',
    puertas: '3-4 puertas'
  },
  'Droguerías_Pequeño': {
    frentes: '2-4 frentes',
    skus: '6-10 SKUs',
    equipos: '1 equipo',
    puertas: '1-2 puertas'
  },
  'Droguerías_Mediano': {
    frentes: '3-5 frentes',
    skus: '10-14 SKUs',
    equipos: '1-2 equipos',
    puertas: '2-3 puertas'
  },
  'Droguerías_Grande': {
    frentes: '5-8 frentes',
    skus: '14-20 SKUs',
    equipos: '2-3 equipos',
    puertas: '3-5 puertas'
  }
};

// Componente Breadcrumb para mostrar selecciones completadas
interface BreadcrumbItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  variant?: 'default' | 'secondary' | 'outline';
  step?: number; // Número de paso para navegación
}

function SelectionBreadcrumb({
  items,
  onItemClick
}: {
  items: BreadcrumbItem[];
  onItemClick?: (step: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-b border-border bg-muted/30 px-6 py-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const isClickable = item.step !== undefined && onItemClick;

          return (
            <Badge
              key={index}
              variant={item.variant || 'default'}
              className={`px-3 py-1.5 text-xs gap-1.5 ${
                isClickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
              onClick={() => isClickable && item.step && onItemClick(item.step)}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="font-medium">{item.label}:</span>
              <span className="text-xs opacity-90">{item.value}</span>
            </Badge>
          );
        })}
      </div>
    </div>
  );
}

export function SimulationPersonalizada() {
  const { analysisState, setSimulationFormData } = useAppState();

  // Use global state for form data and currentStep
  const formData = analysisState.simulationFormData;
  const currentStep = formData.currentStep;
  const results = formData.results || { uplift: 0, roi: 0, payback: 0 };

  // Local state for UI-only concerns
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [calculationMessage, setCalculationMessage] = useState('');
  const [availablePalancas, setAvailablePalancas] = useState<string[]>([]);
  const [loadingPalancas, setLoadingPalancas] = useState(false);
  const [capexBreakdown, setCapexBreakdown] = useState<CapexBreakdown[]>([]);
  const [loadingCapex, setLoadingCapex] = useState(false);
  const [totalCapexUsd, setTotalCapexUsd] = useState<number>(0);
  const [totalFeeUsd, setTotalFeeUsd] = useState<number>(0);
  const [error, setError] = useState<string>('');

  // Helper function to update form data
  const updateFormData = (updates: Partial<typeof formData>) => {
    setSimulationFormData(updates);
  };

  // Helper function to update results
  const setResults = (results: Results) => {
    setSimulationFormData({ results });
  };

  const setCurrentStep = (step: number) => {
    setSimulationFormData({ currentStep: step });
  };

  // Load palancas when tipologia changes
  useEffect(() => {
    if (formData.tipologia) {
      loadPalancas();
    }
  }, [formData.tipologia]);

  // Load CAPEX/Fee when user reaches Step 6
  useEffect(() => {
    if (currentStep === 6 && formData.tipologia && formData.palancasSeleccionadas.length > 0) {
      loadCapexFee();
    }
  }, [currentStep, formData.tipologia, formData.palancasSeleccionadas]);

  const loadPalancas = async () => {
    if (!formData.tipologia) return;

    setLoadingPalancas(true);
    try {
      const response = await apiService.getPalancasByTipologia(formData.tipologia);
      if (response.success) {
        let palancas = response.palancas;

        // Filter out "Cajero vendedor" for Droguerías in simulation section only
        if (formData.tipologia === 'Droguerías') {
          palancas = palancas.filter(p => p !== 'Cajero vendedor');
        }

        setAvailablePalancas(palancas);
      } else {
        setError('Error al cargar palancas');
      }
    } catch (err) {
      console.error('Error loading palancas:', err);
      setError('Error al cargar palancas');
    } finally {
      setLoadingPalancas(false);
    }
  };

  const loadCapexFee = async () => {
    if (!formData.tipologia || formData.palancasSeleccionadas.length === 0) return;

    setLoadingCapex(true);
    try {
      const response = await apiService.getCapexFee(formData.tipologia, formData.palancasSeleccionadas);
      if (response.success) {
        setTotalCapexUsd(response.total_capex_usd);
        setTotalFeeUsd(response.total_fee_usd);
      } else {
        console.error('Error al cargar CAPEX/Fee');
      }
    } catch (err) {
      console.error('Error loading CAPEX/Fee:', err);
    } finally {
      setLoadingCapex(false);
    }
  };

  // Generar breadcrumb items basado en el estado actual
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    if (formData.tipologia) {
      items.push({
        icon: Building2,
        label: 'Tipología',
        value: formData.tipologia,
        variant: 'default',
        step: 1
      });
    }

    if (formData.tipoPalanca) {
      items.push({
        icon: Zap,
        label: 'Tipo',
        value: formData.tipoPalanca === 'simple' ? 'Simple' : 'Múltiple',
        variant: 'secondary',
        step: 2
      });
    }

    if (formData.palancasSeleccionadas.length > 0) {
      // Formatear lista de palancas con ", y" al final
      const formatPalancas = (palancas: string[]): string => {
        if (palancas.length === 1) return palancas[0];
        if (palancas.length === 2) return `${palancas[0]} y ${palancas[1]}`;
        const lastIndex = palancas.length - 1;
        return palancas.slice(0, lastIndex).join(', ') + ', y ' + palancas[lastIndex];
      };

      items.push({
        icon: Sparkles,
        label: formData.palancasSeleccionadas.length === 1 ? 'Palanca' : 'Palancas',
        value: formatPalancas(formData.palancasSeleccionadas),
        variant: 'default',
        step: 3
      });
    }

    if (formData.tamanoTienda) {
      items.push({
        icon: Ruler,
        label: 'Tamaño',
        value: formData.tamanoTienda,
        variant: 'secondary',
        step: 4
      });
    }

    if (currentStep > 5) {
      items.push({
        icon: Grid3x3,
        label: 'Features',
        value: 'Configuradas',
        variant: 'outline',
        step: 5
      });
    }

    if (currentStep > 6) {
      const totalInversion = (totalCapexUsd + totalFeeUsd) * formData.exchangeRate;
      items.push({
        icon: Wallet,
        label: 'Financieros',
        value: `${(totalInversion / 1000000).toFixed(0)}M COP, ${formData.maco}%`,
        variant: 'outline',
        step: 6
      });
    }

    return items;
  };

  // Validaciones
  const isTamanoDisabled = (tamano: TamanoTienda): boolean => {
    // Pequeño NO disponible cuando hay múltiples palancas seleccionadas (en cualquier tipología)
    if (formData.palancasSeleccionadas.length > 1 && tamano === 'Pequeño') return true;

    return false;
  };

  const canContinue = (): boolean => {
    switch (currentStep) {
      case 1: // Tipología
        return formData.tipologia !== '';
      case 2: // Tipo de simulación
        return formData.tipoPalanca !== '';
      case 3: // Palancas
        if (formData.tipoPalanca === 'multiple') {
          return formData.palancasSeleccionadas.length >= 2;
        }
        return formData.palancasSeleccionadas.length === 1;
      case 4: // Tamaño
        return formData.tamanoTienda !== '';
      case 5: // Features
        // Validate all feature fields are not empty (> 0)
        const allFeaturesValid =
          formData.features.frentesPropios > 0 &&
          formData.features.frentesCompetencia > 0 &&
          formData.features.skuPropios > 0 &&
          formData.features.skuCompetencia > 0 &&
          formData.features.puertasPropias > 0 &&
          formData.features.puertasCompetencia > 0 &&
          (formData.tipologia !== 'Super e hiper' ||
            (formData.features.equiposFrioPropios > 0 && formData.features.equiposFrioCompetencia > 0));
        return allFeaturesValid;
      case 6: // Financieros
        return formData.exchangeRate > 0; // Validate exchange rate is not empty
      default:
        return true;
    }
  };

  // Cálculo completo: Uplift, ROI y Payback con API real
  const calculateResults = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setError('');
    // NO cambiar de paso todavía, mantener en Paso 6 para animación en mismo cuadro

    // Duración aleatoria entre 0.5 y 3 segundos (500ms - 3000ms)
    const randomDuration = Math.random() * 2500 + 500; // 500-3000ms
    const step1Duration = randomDuration * 0.33;
    const step2Duration = randomDuration * 0.33;
    const step3Duration = randomDuration * 0.34;

    // Simular progreso con mensajes dinámicos
    const steps = [
      { progress: 33, message: 'Analizando features...', delay: step1Duration },
      { progress: 66, message: 'Ejecutando modelo OLS...', delay: step2Duration },
      { progress: 100, message: 'Calculando resultados...', delay: step3Duration }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setCalculationProgress(step.progress);
      setCalculationMessage(step.message);
    }

    try {
      // Call real API
      const response = await apiService.calculateSimulation({
        tipologia: formData.tipologia,
        palancas: formData.palancasSeleccionadas,
        tamanoTienda: formData.tamanoTienda,
        features: formData.features,
        maco: formData.maco,
        exchangeRate: formData.exchangeRate
      });

      if (response.success) {
        setResults({
          uplift: response.uplift,
          roi: response.roi,
          payback: response.payback || 0
        });

        // Build capex breakdown with COP conversion
        const breakdown = response.capex_breakdown.map(item => ({
          palanca: item.palanca,
          capex_usd: item.capex_usd,
          fee_usd: item.fee_usd,
          capex_cop: item.capex_usd * formData.exchangeRate,
          fee_cop: item.fee_usd * formData.exchangeRate
        }));
        setCapexBreakdown(breakdown);

        // Cambiar a paso 7 (resultados) solo después de completar la animación
        setCurrentStep(7);
      } else {
        setError(response.error || 'Error al calcular simulación');
        setResults({ uplift: 0, roi: 0, payback: 0 });
        setCurrentStep(7); // Mostrar error en paso 7
      }
    } catch (err) {
      console.error('Error calculating simulation:', err);
      setError('Error al calcular simulación');
      setResults({ uplift: 0, roi: 0, payback: 0 });
      setCurrentStep(7); // Mostrar error en paso 7
    } finally {
      setIsCalculating(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 6) {
      // Ejecutar cálculo al finalizar Step 6 (Financieros)
      calculateResults();
    } else if (canContinue()) {
      // Avanzar al siguiente paso
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 7 && results.uplift > 0) {
      // Si ya calculó, volver a paso 6
      setCurrentStep(6);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper to get default feature values based on tipologia
  const getDefaultFeatures = (tipologia: Tipologia) => {
    switch (tipologia) {
      case 'Super e hiper':
        return {
          frentesPropios: 50,
          frentesCompetencia: 70,
          skuPropios: 10,
          skuCompetencia: 10,
          equiposFrioPropios: 1,
          equiposFrioCompetencia: 1,
          puertasPropias: 2,
          puertasCompetencia: 2
        };
      case 'Conveniencia':
        return {
          frentesPropios: 20,
          frentesCompetencia: 30,
          skuPropios: 5,
          skuCompetencia: 5,
          equiposFrioPropios: 0, // Not used for Conveniencia
          equiposFrioCompetencia: 0, // Not used for Conveniencia
          puertasPropias: 1,
          puertasCompetencia: 1
        };
      case 'Droguerías':
        return {
          frentesPropios: 15,
          frentesCompetencia: 50,
          skuPropios: 5,
          skuCompetencia: 10,
          equiposFrioPropios: 0, // Not used for Droguerías
          equiposFrioCompetencia: 0, // Not used for Droguerías
          puertasPropias: 1,
          puertasCompetencia: 1
        };
      default:
        return {
          frentesPropios: 0,
          frentesCompetencia: 0,
          skuPropios: 0,
          skuCompetencia: 0,
          equiposFrioPropios: 0,
          equiposFrioCompetencia: 0,
          puertasPropias: 0,
          puertasCompetencia: 0
        };
    }
  };

  const handleNewSimulation = () => {
    setCurrentStep(1);
    setIsCalculating(false);
    setError('');
    setCapexBreakdown([]);
    updateFormData({
      tipologia: '',
      tipoPalanca: '',
      palancasSeleccionadas: [],
      tamanoTienda: '',
      features: {
        frentesPropios: 0,
        frentesCompetencia: 0,
        skuPropios: 0,
        skuCompetencia: 0,
        equiposFrioPropios: 0,
        equiposFrioCompetencia: 0,
        puertasPropias: 0,
        puertasCompetencia: 0
      },
      exchangeRate: 3912,
      maco: 35
    });
    setResults({ uplift: 0, roi: 0, payback: 0 });
  };

  // Manejar navegación desde breadcrumbs
  const handleBreadcrumbClick = (step: number) => {
    // Solo permitir navegar a pasos ya completados (menores o iguales al paso actual)
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const togglePalanca = (palanca: string) => {
    if (formData.tipoPalanca === 'simple') {
      updateFormData({ ...formData, palancasSeleccionadas: [palanca] });
    } else {
      const isSelected = formData.palancasSeleccionadas.includes(palanca);
      if (isSelected) {
        updateFormData({
          ...formData,
          palancasSeleccionadas: formData.palancasSeleccionadas.filter(p => p !== palanca)
        });
      } else {
        updateFormData({
          ...formData,
          palancasSeleccionadas: [...formData.palancasSeleccionadas, palanca]
        });
      }
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Breadcrumb superior */}
        <SelectionBreadcrumb items={getBreadcrumbItems()} onItemClick={handleBreadcrumbClick} />

      {/* Content area */}
      <div className="flex-1 p-2 sm:p-6 relative overflow-auto">
        <div className={`relative w-full h-full flex justify-center ${currentStep === 7 ? 'items-start py-2 sm:py-4' : 'items-center'}`}>
          {/* Paso 1: Tipología */}
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <span>¿Qué tipología deseas simular?</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.tipologia}
                    onValueChange={(value) => {
                      const tipologia = value as Tipologia;
                      // Reset all subsequent steps when tipologia changes
                      updateFormData({
                        tipologia,
                        tipoPalanca: '',
                        palancasSeleccionadas: [],
                        tamanoTienda: '',
                        features: getDefaultFeatures(tipologia),
                        exchangeRate: formData.exchangeRate,
                        maco: formData.maco
                      });
                    }}
                  >
                    <div className="space-y-3">
                      {TIPOLOGIAS.map((tip) => (
                        <Label
                          key={tip}
                          htmlFor={`tip-${tip}`}
                          className="flex items-center space-x-3 p-5 border-2 border-border hover:border-primary/50 hover:bg-muted/70 transition-all cursor-pointer rounded-lg"
                        >
                          <RadioGroupItem value={tip} id={`tip-${tip}`} />
                          <span className="flex-1 text-base">
                            {tip}
                          </span>
                        </Label>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 2: Tipo de simulación */}
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span>Tipo de simulación</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.tipoPalanca}
                    onValueChange={(value) => {
                      updateFormData({
                        ...formData,
                        tipoPalanca: value as TipoPalanca,
                        palancasSeleccionadas: []
                      });
                    }}
                  >
                    <div className="space-y-3">
                      <Label htmlFor="simple" className="flex items-center space-x-3 p-5 border-2 border-border rounded-lg bg-blue-50 dark:bg-blue-950/20 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all">
                        <RadioGroupItem value="simple" id="simple" />
                        <div className="flex-1">
                          <div className="font-medium">Simple</div>
                          <div className="text-xs text-muted-foreground">Una palanca</div>
                        </div>
                      </Label>
                      <Label htmlFor="multiple" className="flex items-center space-x-3 p-5 border-2 border-border rounded-lg bg-green-50 dark:bg-green-950/20 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all">
                        <RadioGroupItem value="multiple" id="multiple" />
                        <div className="flex-1">
                          <div className="font-medium">Múltiple</div>
                          <div className="text-xs text-muted-foreground">Combinación</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 3: Selección de Palancas */}
          {currentStep === 3 && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-2 border-primary/20 w-96">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span>Selecciona {formData.tipoPalanca === 'simple' ? 'una palanca' : 'palancas (mínimo 2)'}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingPalancas ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-sm text-muted-foreground">Cargando palancas...</div>
                      </div>
                    ) : availablePalancas.length === 0 ? (
                      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
                        No hay palancas disponibles para esta tipología
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {availablePalancas.map((palanca) => (
                          <div
                            key={palanca}
                            className={`flex items-center space-x-2 p-2 border-2 rounded-lg cursor-pointer transition-all text-sm ${
                              formData.palancasSeleccionadas.includes(palanca)
                                ? 'border-primary bg-primary/10 dark:bg-primary/5'
                                : 'border-border hover:border-primary/30 hover:bg-muted/70'
                            }`}
                            onClick={() => togglePalanca(palanca)}
                          >
                            <Checkbox
                              checked={formData.palancasSeleccionadas.includes(palanca)}
                              onCheckedChange={() => togglePalanca(palanca)}
                            />
                            <Label className="flex-1 cursor-pointer text-sm">{palanca}</Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 4: Tamaño de tienda */}
          {currentStep === 4 && (
            <div className="animate-in fade-in duration-500">
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Ruler className="w-5 h-5 text-primary" />
                    <span>Tamaño de tienda</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.tamanoTienda}
                    onValueChange={(value) => updateFormData({ ...formData, tamanoTienda: value as TamanoTienda })}
                  >
                    <div className="space-y-3">
                      {(['Pequeño', 'Mediano', 'Grande'] as TamanoTienda[]).map((tamano) => {
                        const disabled = isTamanoDisabled(tamano);
                        const description = formData.tipologia ? STORE_SIZE_DESCRIPTIONS[formData.tipologia as Tipologia][tamano] : '';

                        return (
                          <Tooltip key={tamano}>
                            <TooltipTrigger asChild>
                              <div
                                className={`flex items-center space-x-3 p-5 border-2 rounded-lg transition-all ${
                                  disabled
                                    ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border'
                                    : 'border-border hover:border-primary/50 hover:bg-muted/70 cursor-pointer'
                                }`}
                                onClick={() => !disabled && updateFormData({ ...formData, tamanoTienda: tamano })}
                              >
                                <RadioGroupItem value={tamano} id={`tam-${tamano}`} disabled={disabled} />
                                <Label htmlFor={`tam-${tamano}`} className="flex-1 cursor-pointer">
                                  <div className="font-medium">{tamano}</div>
                                  {disabled && tamano === 'Pequeño' && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      No disponible para múltiples palancas
                                    </div>
                                  )}
                                </Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 5: Matriz de Features */}
          {currentStep === 5 && (
            <div className="animate-in fade-in duration-500 w-full max-w-2xl">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Grid3x3 className="w-5 h-5 text-primary" />
                    <span>Matriz de features</span>
                  </CardTitle>

                  {/* Banner informativo */}
                  <div className="flex items-start space-x-2 mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Los valores precargados son recomendaciones basadas en promedios observados en tiendas similares
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-350px)] overflow-y-auto">
                  {/* Tabla minimalista */}
                  <div className="border-2 border-border rounded-lg overflow-hidden bg-card">
                    <table className="w-full">
                      <thead className="bg-muted/70 dark:bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold border-b-2 border-border">Feature</th>
                          <th className="text-center p-3 text-sm font-semibold border-b-2 border-border">Propios</th>
                          <th className="text-center p-3 text-sm font-semibold border-b-2 border-border">Competencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-border">
                        {/* Cantidad de frentes */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <span className="font-medium text-sm">Cantidad de frentes</span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.frentesPropios || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, frentesPropios: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.frentesCompetencia || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, frentesCompetencia: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                        </tr>

                        {/* Cantidad de SKU's */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <span className="font-medium text-sm">Cantidad de SKU's</span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.skuPropios || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, skuPropios: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.skuCompetencia || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, skuCompetencia: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                        </tr>

                        {/* EDF's adicionales - ONLY for Super e hiper */}
                        {formData.tipologia === 'Super e hiper' && (
                          <tr className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <span className="font-medium text-sm">EDF's adicionales</span>
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={formData.features.equiposFrioPropios || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateFormData({
                                    ...formData,
                                    features: { ...formData.features, equiposFrioPropios: value === '' ? 0 : parseInt(value) }
                                  });
                                }}
                                className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                type="number"
                                value={formData.features.equiposFrioCompetencia || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  updateFormData({
                                    ...formData,
                                    features: { ...formData.features, equiposFrioCompetencia: value === '' ? 0 : parseInt(value) }
                                  });
                                }}
                                className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        )}

                        {/* Cantidad puertas COF */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <span className="font-medium text-sm">Cantidad puertas COF</span>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.puertasPropias || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, puertasPropias: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.puertasCompetencia || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateFormData({
                                  ...formData,
                                  features: { ...formData.features, puertasCompetencia: value === '' ? 0 : parseInt(value) }
                                });
                              }}
                              className="w-24 text-center mx-auto bg-gray-50 dark:bg-input/30"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 6: Parámetros Financieros */}
          {currentStep === 6 && (
            <div className="animate-in fade-in duration-500 w-full max-w-4xl">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span>Parámetros financieros</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCapex ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-muted-foreground">Cargando costos...</div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Inputs horizontales: CAPEX, Fee, TRM, MACO */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">CAPEX (USD)</Label>
                          <Input
                            type="number"
                            value={totalCapexUsd ? Math.round(totalCapexUsd) : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTotalCapexUsd(value === '' ? 0 : parseFloat(value));
                            }}
                            className="w-full bg-gray-50 dark:bg-input/30"
                            placeholder="0"
                            step="1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Fee (USD)</Label>
                          <Input
                            type="number"
                            value={totalFeeUsd ? Math.round(totalFeeUsd) : ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setTotalFeeUsd(value === '' ? 0 : parseFloat(value));
                            }}
                            className="w-full bg-gray-50 dark:bg-input/30"
                            placeholder="0"
                            step="1"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Tipo de Cambio (TRM)</Label>
                          <Input
                            type="text"
                            value={formData.exchangeRate ? formData.exchangeRate.toLocaleString('es-CO') : ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\./g, '').replace(/,/g, '.');
                              updateFormData({ ...formData, exchangeRate: value === '' ? 0 : parseFloat(value) });
                            }}
                            className="w-full bg-gray-50 dark:bg-input/30"
                            placeholder="3.912"
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">MACO (%)</Label>
                          <Input
                            type="number"
                            value={formData.maco}
                            onChange={(e) => updateFormData({ ...formData, maco: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-gray-50 dark:bg-input/30"
                            placeholder="35"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>

                      {/* Resumen de inversión total */}
                      <div className="p-4 border-2 border-border rounded-lg bg-muted/40 dark:bg-muted/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">Inversión Total</Label>
                            <div className="text-2xl font-bold text-primary">
                              ${((totalCapexUsd + totalFeeUsd) * formData.exchangeRate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                            </div>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>CAPEX: ${(totalCapexUsd * formData.exchangeRate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            <div>Fee: ${(totalFeeUsd * formData.exchangeRate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                            <div className="mt-1 font-medium">MACO: {formData.maco}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 7: Resultados */}
          {currentStep === 7 && (
            <div className="animate-in fade-in duration-500 w-full max-w-6xl px-2">
              <Card className="border-2 border-primary/20">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      <span className="truncate">Resultados de la Simulación</span>
                    </CardTitle>
                    <Button
                      onClick={handleNewSimulation}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs sm:text-sm shrink-0"
                    >
                      <span className="hidden sm:inline">Nueva Simulación</span>
                      <span className="sm:hidden">Nueva</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-3 sm:p-6">
                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start space-x-2 p-4 bg-red-50 dark:bg-red-950/30 border-2 border-red-300 dark:border-red-700 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 dark:text-red-200">Error al calcular simulación</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Results - show if no error (including negative values) */}
                  {!error && (results.uplift !== 0 || results.roi !== 0) && (
                    <>
                      {/* Layout horizontal: Métricas (izquierda) + Configuración (derecha) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start lg:items-center">
                        {/* Columna Izquierda: 3 tarjetas de métricas */}
                        <div className="space-y-1.5 sm:space-y-2">
                          {/* Uplift */}
                          <div className={`p-3 sm:p-4 border-2 rounded-lg flex items-center justify-between ${
                            results.uplift >= 0
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30'
                              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                          }`}>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                results.uplift >= 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`} />
                              <div>
                                <p className={`text-xs sm:text-sm font-semibold mb-0.5 ${
                                  results.uplift >= 0
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}>Uplift</p>
                                <p className="text-xs text-muted-foreground hidden sm:block">
                                  {results.uplift >= 0 ? 'Incremento estimado en ventas' : 'Reducción estimada en ventas'}
                                </p>
                              </div>
                            </div>
                            <div className={`text-lg sm:text-xl font-bold ${
                              results.uplift >= 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {results.uplift >= 0 ? '+' : ''}{results.uplift.toFixed(1)}%
                            </div>
                          </div>

                          {/* ROI */}
                          <div className={`p-3 sm:p-4 border-2 rounded-lg flex items-center justify-between ${
                            results.roi >= 0
                              ? 'border-primary/30 dark:border-primary/40 bg-primary/10 dark:bg-primary/5'
                              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                          }`}>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                results.roi >= 0
                                  ? 'text-primary'
                                  : 'text-red-600 dark:text-red-400'
                              }`} />
                              <div>
                                <p className={`text-xs sm:text-sm font-semibold mb-0.5 ${
                                  results.roi >= 0
                                    ? 'text-primary'
                                    : 'text-red-700 dark:text-red-300'
                                }`}>ROI (12 meses)</p>
                                <p className="text-xs text-muted-foreground hidden sm:block">Retorno sobre inversión anual</p>
                              </div>
                            </div>
                            <div className={`text-lg sm:text-xl font-bold ${
                              results.roi >= 0
                                ? 'text-primary'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {(results.roi * 100).toFixed(1)}%
                            </div>
                          </div>

                          {/* Payback */}
                          <div className={`p-3 sm:p-4 border-2 rounded-lg flex items-center justify-between ${
                            results.payback > 0 && results.payback <= 12
                              ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30'
                              : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30'
                          }`}>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Calendar className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                results.payback > 0 && results.payback <= 12
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`} />
                              <div>
                                <p className={`text-xs sm:text-sm font-semibold mb-0.5 ${
                                  results.payback > 0 && results.payback <= 12
                                    ? 'text-green-700 dark:text-green-300'
                                    : 'text-red-700 dark:text-red-300'
                                }`}>
                                  Payback
                                </p>
                                <p className="text-xs text-muted-foreground hidden sm:block">Estado de repago mensual</p>
                              </div>
                            </div>
                            <div className={`text-lg sm:text-xl font-bold ${
                              results.payback > 0 && results.payback <= 12
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {results.payback > 0 && results.payback <= 12 ? 'Repaga' : 'No Repaga'}
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha: Resumen de Configuración completa */}
                        <div className="border-2 border-border rounded-lg overflow-hidden h-fit">
                          <div className="bg-muted/70 dark:bg-muted/50 px-2 sm:px-3 py-1.5 sm:py-2 border-b-2 border-border">
                            <h4 className="text-xs sm:text-sm font-semibold flex items-center space-x-2">
                              <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                              <span>Configuración de la Simulación</span>
                            </h4>
                          </div>
                          <div className="p-2 sm:p-3 space-y-1.5 sm:space-y-2">
                            {/* Row 1: Tipología, Tipo, Tamaño, Palancas */}
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Tipología</p>
                                <p className="text-xs sm:text-sm font-medium">{formData.tipologia}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Tipo</p>
                                <p className="text-xs sm:text-sm font-medium">{formData.tipoPalanca === 'simple' ? 'Simple' : 'Múltiple'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Tamaño</p>
                                <p className="text-xs sm:text-sm font-medium">{formData.tamanoTienda}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Palancas</p>
                                <div className="flex flex-wrap gap-0.5 sm:gap-1">
                                  {formData.palancasSeleccionadas.map((palanca, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5">
                                      {palanca}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Row 3: Features */}
                            <div className="border-t-2 border-border pt-1.5 sm:pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Features</p>
                              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                                <div>
                                  <span className="text-muted-foreground">Frentes:</span>{' '}
                                  <span className="font-medium">{formData.features.frentesPropios} vs {formData.features.frentesCompetencia}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">SKUs:</span>{' '}
                                  <span className="font-medium">{formData.features.skuPropios} vs {formData.features.skuCompetencia}</span>
                                </div>
                                {formData.tipologia === 'Super e hiper' && (
                                  <div>
                                    <span className="text-muted-foreground">EDFs:</span>{' '}
                                    <span className="font-medium">{formData.features.equiposFrioPropios} vs {formData.features.equiposFrioCompetencia}</span>
                                  </div>
                                )}
                                <div>
                                  <span className="text-muted-foreground">Puertas:</span>{' '}
                                  <span className="font-medium">{formData.features.puertasPropias} vs {formData.features.puertasCompetencia}</span>
                                </div>
                              </div>
                            </div>

                            {/* Row 4: Parámetros Financieros */}
                            <div className="border-t-2 border-border pt-1.5 sm:pt-2">
                              <p className="text-xs text-muted-foreground mb-1">Financieros</p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                  <span className="text-muted-foreground">Inversión Total</span>
                                  <span className="font-bold text-primary">
                                    ${((totalCapexUsd + totalFeeUsd) * formData.exchangeRate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                  </span>
                                </div>
                                <div className="text-[10px] sm:text-xs flex items-center justify-between">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-muted-foreground">CAPEX: <span className="font-medium text-foreground">${Math.round(totalCapexUsd).toLocaleString('es-CO')}</span></span>
                                    <span className="text-muted-foreground">Fee: <span className="font-medium text-foreground">${Math.round(totalFeeUsd).toLocaleString('es-CO')}</span></span>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-muted-foreground">TRM: <span className="font-medium text-foreground">${formData.exchangeRate.toLocaleString('es-CO')}</span></span>
                                    <span className="text-muted-foreground">MACO: <span className="font-medium text-foreground">{formData.maco}%</span></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Calculating overlay - covers entire simulation area */}
        {isCalculating && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center space-y-4">
              {/* Animación compacta - círculo con glow + partículas */}
              <div className="relative w-20 h-20">
                {/* Círculo giratorio con glow */}
                <div
                  className="absolute inset-0 w-20 h-20 rounded-full border-3 border-primary/20 border-t-primary animate-spin shadow-lg shadow-primary/40"
                  style={{ animationDuration: '1s' }}
                ></div>

                {/* Ícono central Sparkles con pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse" />
                </div>

                {/* Partículas flotantes más pequeñas */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.6s' }}></div>
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full animate-ping" style={{ animationDelay: '0.9s' }}></div>
              </div>

              {/* Texto dinámico más pequeño */}
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {calculationMessage || 'Iniciando cálculo...'}
                </p>
                <div className="w-48 h-1 bg-muted rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${calculationProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      {currentStep < 7 && !isCalculating && (
        <div className="border-t-2 border-border p-4 bg-card">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="border-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canContinue()}
              className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-shadow"
            >
              {currentStep === 6 ? 'Simular' : 'Continuar'}
              {currentStep !== 6 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
}
