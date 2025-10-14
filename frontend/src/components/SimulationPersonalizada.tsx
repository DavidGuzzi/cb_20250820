import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Checkbox } from './ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  DollarSign,
  Calendar
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

export function SimulationPersonalizada() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
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

  // Validaciones
  const isTamanoDisabled = (tamano: TamanoTienda): boolean => {
    if (formData.tipoPalanca === 'multiple' && tamano === 'Pequeño') return true;
    if (formData.tipologia === 'Droguerías' && tamano === 'Grande') return true;
    return false;
  };

  const canContinue = (): boolean => {
    switch (currentStep) {
      case 1:
        return formData.tipologia !== '';
      case 2:
        return formData.tipoPalanca !== '';
      case 2.5:
        if (formData.tipoPalanca === 'multiple') {
          return formData.palancasSeleccionadas.length >= 2;
        }
        return formData.palancasSeleccionadas.length === 1;
      case 3:
        return formData.tamanoTienda !== '';
      case 4:
        return true; // Step 4 simplificado - siempre puede simular
      default:
        return true;
    }
  };

  // Cálculo completo: Uplift, ROI y Payback
  const calculateResults = async () => {
    setIsCalculating(true);
    setCalculationProgress(0);
    setCurrentStep(5); // Ir a pantalla de resultados

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
    if (currentStep === 4) {
      // Ejecutar cálculo al finalizar Step 4
      calculateResults();
    } else if (canContinue()) {
      // Marcar el paso actual como completado
      setCompletedSteps(prev => [...prev, currentStep]);

      // Lógica de progresión de steps
      if (currentStep === 2) {
        setCurrentStep(2.5); // Ir a selección de palancas
      } else if (currentStep === 2.5) {
        setCurrentStep(3); // Ir a tamaño de tienda
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep === 5 && results.uplift > 0) {
      // Si ya calculó, volver a paso 4
      setCurrentStep(4);
    } else if (currentStep > 1) {
      // Lógica de retroceso de steps
      if (currentStep === 3) {
        setCurrentStep(2.5); // Volver a selección de palancas
        setCompletedSteps(prev => prev.filter(s => s !== 2.5));
      } else if (currentStep === 2.5) {
        setCurrentStep(2); // Volver a tipo de palanca
        setCompletedSteps(prev => prev.filter(s => s !== 2));
      } else {
        setCurrentStep(prev => prev - 1);
        setCompletedSteps(prev => prev.filter(s => s !== currentStep - 1));
      }
    }
  };

  const handleNewSimulation = () => {
    setCurrentStep(1);
    setCompletedSteps([]);
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

  // Helper para determinar clases de panel
  // NOTA: Solo aplicamos scale y opacity, NO translate-x
  // El translate-x se maneja a nivel del contenedor completo
  const getPanelClass = (step: number) => {
    if (completedSteps.includes(step)) {
      return 'scale-75 opacity-40'; // Panel completado: más pequeño y transparente
    } else if (step === currentStep) {
      return 'scale-100 opacity-100'; // Panel activo: tamaño completo
    } else if (step > currentStep) {
      return 'scale-90 opacity-0'; // Panel futuro: ligeramente pequeño e invisible
    }
    return '';
  };

  // Calcular desplazamiento para centrar el panel activo
  // Con justify-center, Step 1 ya está centrado en offset 0
  // Para steps posteriores, desplazamos a la izquierda sumando anchos + gaps
  const getContainerOffset = () => {
    const borderWidth = 4; // border-2 = 4px total (2px cada lado)
    const cardWidth = 320 + borderWidth; // w-80 + border = 324px (Steps 1, 2, 3)
    const cardWidthLarge = 384 + borderWidth; // w-96 + border = 388px (Step 2.5)
    const gap = 32; // gap-8 = 32px

    let offset = 0;

    if (currentStep === 1) {
      offset = 0; // Ya centrado por justify-center
    } else if (currentStep === 2) {
      offset = -(cardWidth + gap); // -356px
    } else if (currentStep === 2.5) {
      offset = -((cardWidth + gap) * 2); // -712px
    } else if (currentStep === 3) {
      offset = -((cardWidth + gap) * 2 + (cardWidthLarge + gap)); // -1132px
    }

    return offset;
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
      {/* Content area */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="relative h-full flex items-center justify-center overflow-hidden">
          {/* Horizontal sliding panels for Steps 1-3 */}
          <div
            className="flex items-center gap-8 transition-all duration-700 ease-in-out"
            style={{ transform: `translateX(${getContainerOffset()}px)` }}
          >
            {/* Paso 1: Tipología */}
            <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(1)}`}>
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-primary" />
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
                        <div key={tip} className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={tip} id={`tip-${tip}`} />
                          <Label htmlFor={`tip-${tip}`} className="flex-1 cursor-pointer text-base">
                            {tip}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Paso 2a: Tipo de Palanca */}
            <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(2)}`}>
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle>Tipo de simulación</CardTitle>
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
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="simple" id="simple" />
                        <Label htmlFor="simple" className="flex-1 cursor-pointer">
                          <div className="font-medium">Simple</div>
                          <div className="text-xs text-muted-foreground">Una palanca</div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="multiple" id="multiple" />
                        <Label htmlFor="multiple" className="flex-1 cursor-pointer">
                          <div className="font-medium">Múltiple</div>
                          <div className="text-xs text-muted-foreground">Combinación</div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>

            {/* Paso 2.5: Grid de Palancas */}
            <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(2.5)} ${!formData.tipoPalanca ? 'opacity-0 pointer-events-none' : ''}`}>
                <Card className="border-2 border-primary/20 w-96">
                  <CardHeader>
                    <CardTitle>
                      Selecciona {formData.tipoPalanca === 'simple' ? 'una palanca' : 'palancas (mínimo 2)'}
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

            {/* Paso 3: Tamaño de tienda */}
            <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(3)}`}>
              <Card className="border-2 border-primary/20 w-80">
                <CardHeader>
                  <CardTitle>Tamaño de tienda</CardTitle>
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
                          <div
                            key={tamano}
                            className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                              disabled
                                ? 'opacity-50 cursor-not-allowed bg-muted/30'
                                : 'border-border hover:bg-muted/50'
                            }`}
                          >
                            <RadioGroupItem value={tamano} id={`tam-${tamano}`} disabled={disabled} />
                            <Label
                              htmlFor={`tam-${tamano}`}
                              className={`flex-1 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className="font-medium">{tamano}</div>
                              {disabled && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {tamano === 'Pequeño' && 'No disponible para palancas múltiples'}
                                  {tamano === 'Grande' && 'No disponible para Droguerías'}
                                </div>
                              )}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Paso 4: Matriz de features (Versión Simplificada Temporal) */}
        {currentStep === 4 && (
          <div className="flex items-center justify-center h-full">
            <Card className="border-2 border-primary/20 w-full max-w-4xl">
              <CardHeader>
                <CardTitle>Matriz de features</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ajusta los valores o usa los valores por defecto sugeridos
                </p>
              </CardHeader>
              <CardContent className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Frentes */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">Frentes de góndola</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Propios</Label>
                      <Input
                        type="number"
                        value={formData.features.frentesPropios}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, frentesPropios: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Competencia</Label>
                      <Input
                        type="number"
                        value={formData.features.frentesCompetencia}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, frentesCompetencia: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* SKU */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">SKUs disponibles</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Propios</Label>
                      <Input
                        type="number"
                        value={formData.features.skuPropios}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, skuPropios: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Competencia</Label>
                      <Input
                        type="number"
                        value={formData.features.skuCompetencia}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, skuCompetencia: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Equipos de frío */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">Equipos de frío</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Propios</Label>
                      <Input
                        type="number"
                        value={formData.features.equiposFrioPropios}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, equiposFrioPropios: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Competencia</Label>
                      <Input
                        type="number"
                        value={formData.features.equiposFrioCompetencia}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, equiposFrioCompetencia: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Puertas */}
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
                  <Label className="text-base font-semibold">Puertas de refrigerador</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Propias</Label>
                      <Input
                        type="number"
                        value={formData.features.puertasPropias}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, puertasPropias: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Competencia</Label>
                      <Input
                        type="number"
                        value={formData.features.puertasCompetencia}
                        onChange={(e) => setFormData({
                          ...formData,
                          features: { ...formData.features, puertasCompetencia: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Inversión y MACO */}
                <div className="pt-6 border-t border-border">
                  <Label className="text-base font-semibold mb-4 block">Parámetros financieros</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Inversión Total (COP)</Label>
                      <Input
                        type="number"
                        value={formData.inversion}
                        onChange={(e) => setFormData({ ...formData, inversion: parseInt(e.target.value) || 0 })}
                        className="w-full"
                        placeholder="50000000"
                      />
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          {/* Paso 5: Resultados completos */}
        {currentStep === 5 && results.uplift > 0 && (
          <div className="flex items-center justify-center h-full">
            <Card className="border-2 border-primary/20 w-full max-w-3xl">
              <CardHeader>
                <CardTitle className="text-lg">Resultados de la Simulación</CardTitle>
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

      {/* Navigation buttons */}
      {currentStep < 5 && !isCalculating && (
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
              {currentStep === 4 ? 'Simular' : 'Continuar'}
              {currentStep !== 4 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}

      {/* Calculating overlay */}
      {isCalculating && (
        <div className="border-t border-border p-8 bg-card">
          <div className="flex flex-col items-center space-y-6 max-w-lg mx-auto">
            {/* Animación minimalista - círculo único */}
            <div className="relative w-24 h-24">
              {/* Círculo giratorio simple */}
              <div
                className="absolute inset-0 w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
                style={{ animationDuration: '1.2s' }}
              ></div>

              {/* Ícono central (sin pulse) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Texto dinámico */}
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">
                {calculationMessage || 'Iniciando cálculo...'}
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="w-full max-w-md">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${calculationProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Progreso</span>
                <span>{calculationProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
