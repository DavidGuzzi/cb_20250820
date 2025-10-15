import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
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
  Info
} from 'lucide-react';

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
  inversion: number;
  maco: number;
}

interface Results {
  uplift: number;
  roi: number;
  payback: number;
}

// Datos ficticios
const TIPOLOGIAS: Tipologia[] = ['Super e hiper', 'Conveniencia', 'Droguerías'];
const PALANCAS = [
  'Punta de góndola',
  'Metro cuadrado',
  'Isla',
  'Cooler',
  'Nevera vertical',
  'Activación en tienda',
  'Material POP'
];

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
  'Droguerías_Mediano': {
    frentes: '3-5 frentes',
    skus: '10-14 SKUs',
    equipos: '1-2 equipos',
    puertas: '2-3 puertas'
  },
  'Droguerías_Pequeño': {
    frentes: '2-4 frentes',
    skus: '6-10 SKUs',
    equipos: '1 equipo',
    puertas: '1-2 puertas'
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
      <div className="flex flex-wrap items-center gap-2">
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
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationProgress, setCalculationProgress] = useState(0);
  const [calculationMessage, setCalculationMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
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
      puertasCompetencia: 3
    },
    inversion: 50000000,
    maco: 35
  });
  const [results, setResults] = useState<Results>({
    uplift: 0,
    roi: 0,
    payback: 0
  });

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
      items.push({
        icon: Wallet,
        label: 'Financieros',
        value: `${(formData.inversion / 1000000).toFixed(0)}M COP, ${formData.maco}%`,
        variant: 'outline',
        step: 6
      });
    }

    return items;
  };

  // Validaciones
  const isTamanoDisabled = (tamano: TamanoTienda): boolean => {
    if (formData.tipoPalanca === 'multiple' && tamano === 'Pequeño') return true;
    if (formData.tipologia === 'Droguerías' && tamano === 'Grande') return true;
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
      case 6: // Financieros
        return true;
      default:
        return true;
    }
  };

  // Cálculo completo: Uplift, ROI y Payback
  const calculateResults = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setCurrentStep(7); // Ir a pantalla de resultados (Paso 7)

    // Simular progreso con mensajes dinámicos
    const steps = [
      { progress: 33, message: 'Analizando features...', delay: 800 },
      { progress: 66, message: 'Ejecutando modelo OLS...', delay: 900 },
      { progress: 100, message: 'Calculando resultados...', delay: 800 }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setCalculationProgress(step.progress);
      setCalculationMessage(step.message);
    }

    // Fórmula mock simplificada para Uplift
    const featuresScore =
      formData.features.frentesPropios * 0.8 +
      formData.features.skuPropios * 0.5 +
      formData.features.equiposFrioPropios * 1.2 +
      formData.features.puertasPropias * 1.0 -
      (formData.features.frentesCompetencia * 0.4) -
      (formData.features.skuCompetencia * 0.3);

    const uplift = Math.max(5, Math.min(35, 12 + (featuresScore * 0.15)));

    // Fórmulas mock para ROI y Payback
    const ventasEstimadas = formData.inversion * (uplift / 100);
    const ganancia = ventasEstimadas * (formData.maco / 100);
    const roi = ganancia / formData.inversion;
    const payback = roi > 0 ? 12 / roi : 0;

    setResults({
      uplift: parseFloat(uplift.toFixed(1)),
      roi: parseFloat(roi.toFixed(2)),
      payback: parseFloat(payback.toFixed(1))
    });

    setIsCalculating(false);
  };

  const handleNext = () => {
    if (currentStep === 6) {
      // Ejecutar cálculo al finalizar Step 6 (Financieros)
      calculateResults();
    } else if (canContinue()) {
      // Avanzar al siguiente paso
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep === 7 && results.uplift > 0) {
      // Si ya calculó, volver a paso 6
      setCurrentStep(6);
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNewSimulation = () => {
    setCurrentStep(1);
    setIsCalculating(false);
    setFormData({
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
        puertasCompetencia: 3
      },
      inversion: 50000000,
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
      setFormData({ ...formData, palancasSeleccionadas: [palanca] });
    } else {
      const isSelected = formData.palancasSeleccionadas.includes(palanca);
      if (isSelected) {
        setFormData({
          ...formData,
          palancasSeleccionadas: formData.palancasSeleccionadas.filter(p => p !== palanca)
        });
      } else {
        setFormData({
          ...formData,
          palancasSeleccionadas: [...formData.palancasSeleccionadas, palanca]
        });
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb superior */}
      <SelectionBreadcrumb items={getBreadcrumbItems()} onItemClick={handleBreadcrumbClick} />

      {/* Content area */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="relative h-full flex items-center justify-center">
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
                    onValueChange={(value) => setFormData({ ...formData, tipologia: value as Tipologia })}
                  >
                    <div className="space-y-3">
                      {TIPOLOGIAS.map((tip) => (
                        <Label
                          key={tip}
                          htmlFor={`tip-${tip}`}
                          className="flex items-center space-x-3 p-5 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                      setFormData({
                        ...formData,
                        tipoPalanca: value as TipoPalanca,
                        palancasSeleccionadas: []
                      });
                    }}
                  >
                    <div className="space-y-3">
                      <Label htmlFor="simple" className="flex items-center space-x-3 p-5 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                        <RadioGroupItem value="simple" id="simple" />
                        <div className="flex-1">
                          <div className="font-medium">Simple</div>
                          <div className="text-xs text-muted-foreground">Una palanca</div>
                        </div>
                      </Label>
                      <Label htmlFor="multiple" className="flex items-center space-x-3 p-5 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
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
                    <div className="grid grid-cols-2 gap-2">
                      {PALANCAS.map((palanca) => (
                        <div
                          key={palanca}
                          className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                            formData.palancasSeleccionadas.includes(palanca)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:bg-muted/50'
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
                    onValueChange={(value) => setFormData({ ...formData, tamanoTienda: value as TamanoTienda })}
                  >
                    <div className="space-y-3">
                      {(['Pequeño', 'Mediano', 'Grande'] as TamanoTienda[]).map((tamano) => {
                        const disabled = isTamanoDisabled(tamano);
                        return (
                          <Label
                            key={tamano}
                            htmlFor={`tam-${tamano}`}
                            className={`flex items-center space-x-3 p-5 border rounded-lg transition-colors ${
                              disabled
                                ? 'opacity-50 cursor-not-allowed bg-muted/30'
                                : 'border-border hover:bg-muted/50 cursor-pointer'
                            }`}
                          >
                            <RadioGroupItem value={tamano} id={`tam-${tamano}`} disabled={disabled} />
                            <div className="flex-1">
                              <div className="font-medium">{tamano}</div>
                              {disabled && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {tamano === 'Pequeño' && 'No disponible para palancas múltiples'}
                                  {tamano === 'Grande' && 'No disponible para Droguerías'}
                                </div>
                              )}
                            </div>
                          </Label>
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
                  <div className="flex items-start space-x-2 mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Los valores precargados son recomendaciones basadas en promedios observados en tiendas similares
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-350px)] overflow-y-auto">
                  {/* Tabla minimalista */}
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-semibold">Feature</th>
                          <th className="text-center p-3 text-sm font-semibold">Propios</th>
                          <th className="text-center p-3 text-sm font-semibold">Competencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {/* Frentes de góndola */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">Frentes de góndola</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Rango observado: {FEATURE_RANGES[`${formData.tipologia}_${formData.tamanoTienda}`]?.frentes || 'N/A'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.frentesPropios}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, frentesPropios: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.frentesCompetencia}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, frentesCompetencia: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                        </tr>

                        {/* SKUs disponibles */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">SKUs disponibles</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Rango observado: {FEATURE_RANGES[`${formData.tipologia}_${formData.tamanoTienda}`]?.skus || 'N/A'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.skuPropios}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, skuPropios: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.skuCompetencia}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, skuCompetencia: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                        </tr>

                        {/* Equipos de frío */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">Equipos de frío</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Rango observado: {FEATURE_RANGES[`${formData.tipologia}_${formData.tamanoTienda}`]?.equipos || 'N/A'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.equiposFrioPropios}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, equiposFrioPropios: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.equiposFrioCompetencia}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, equiposFrioCompetencia: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                        </tr>

                        {/* Puertas de refrigerador */}
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-sm">Puertas de refrigerador</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Rango observado: {FEATURE_RANGES[`${formData.tipologia}_${formData.tamanoTienda}`]?.puertas || 'N/A'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.puertasPropias}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, puertasPropias: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              value={formData.features.puertasCompetencia}
                              onChange={(e) => setFormData({
                                ...formData,
                                features: { ...formData.features, puertasCompetencia: parseInt(e.target.value) || 0 }
                              })}
                              className="w-24 text-center mx-auto"
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
            <div className="animate-in fade-in duration-500">
              <Card className="border-2 border-primary/20 w-full max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    <span>Parámetros financieros</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Define la inversión y el margen de contribución
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Inversión Total (COP)</Label>
                        <Input
                          type="number"
                          value={formData.inversion}
                          onChange={(e) => setFormData({ ...formData, inversion: parseInt(e.target.value) || 0 })}
                          className="w-full"
                          placeholder="50000000"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Monto total a invertir en la palanca
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">MACO (%)</Label>
                        <Input
                          type="number"
                          value={formData.maco}
                          onChange={(e) => setFormData({ ...formData, maco: parseInt(e.target.value) || 0 })}
                          className="w-full"
                          placeholder="35"
                          min="0"
                          max="100"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Margen de contribución sobre ventas
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 7: Resultados */}
          {currentStep === 7 && results.uplift > 0 && (
            <div className="animate-in fade-in duration-500 w-full max-w-3xl">
              <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Resultados de la Simulación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tabla de resultados */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-semibold">Métrica</th>
                        <th className="text-center p-3 text-sm font-semibold">Valor</th>
                        <th className="text-left p-3 text-sm font-semibold">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="font-medium">Uplift</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-lg font-bold text-green-600">+{results.uplift}%</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          Incremento estimado en ventas
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-primary" />
                            <span className="font-medium">ROI</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-lg font-bold text-primary">{results.roi.toFixed(2)}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          Retorno por cada $1 invertido
                        </td>
                      </tr>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-orange-600" />
                            <span className="font-medium">Payback</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-lg font-bold text-orange-600">{results.payback.toFixed(1)}</span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          Meses para recuperar inversión
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Resumen compacto */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="text-sm font-semibold mb-3">Resumen</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipología:</span>
                      <span className="font-medium">{formData.tipologia}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tamaño:</span>
                      <span className="font-medium">{formData.tamanoTienda}</span>
                    </div>
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">Palancas:</span>
                      <span className="font-medium">{formData.palancasSeleccionadas.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Inversión:</span>
                      <span className="font-medium">${formData.inversion.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">MACO:</span>
                      <span className="font-medium">{formData.maco}%</span>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={handleNewSimulation}
                    className="w-full"
                  >
                    Nueva Simulación
                  </Button>
                  <Button
                    className="w-full"
                    disabled
                  >
                    Guardar Simulación
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      {currentStep < 7 && !isCalculating && (
        <div className="border-t border-border p-4 bg-card">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canContinue()}
              className="bg-primary hover:bg-primary/90"
            >
              {currentStep === 6 ? 'Simular' : 'Continuar'}
              {currentStep !== 6 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}

      {/* Calculating overlay - centered */}
      {isCalculating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
