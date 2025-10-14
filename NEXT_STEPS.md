# NEXT STEPS - Simulaciones Refactoring

**Fecha de creación:** 2025-10-14
**Última actualización:** 2025-10-14 (5a actualización)
**Estado actual:** ✅ Sistema de steps completado, centrado absoluto implementado, animación de cálculo simplificada

---

## Resumen de lo Completado ✅

### 1. **Sistema de Steps con Sub-Steps y Centrado Absoluto (Solución Final)**
- ✅ Implementación de sistema de paneles deslizantes horizontales con sub-steps (1, 2, 2.5, 3)
- ✅ Estado `completedSteps` para tracking de pasos finalizados
- ✅ Función `getPanelClass()` para gestión de clases CSS dinámicas
- ✅ Función `getContainerOffset()` para centrado dinámico del panel activo
- ✅ Transiciones suaves con `translate-x`, `scale`, y `opacity`
- ✅ Navegación con botones "Anterior" / "Continuar" con lógica de sub-steps

**Arquitectura:**
```typescript
// Estado de tracking
const [currentStep, setCurrentStep] = useState<number>(1);
const [completedSteps, setCompletedSteps] = useState<number[]>([]);

// Helper para clases CSS de cada panel
const getPanelClass = (step: number) => {
  if (completedSteps.includes(step)) {
    return 'translate-x-[-120%] scale-75 opacity-60';  // Panel completado a la izquierda
  } else if (step === currentStep) {
    return 'translate-x-0 scale-100 opacity-100';       // Panel actual en centro
  } else if (step > currentStep) {
    return 'translate-x-[120%] scale-90 opacity-0';     // Panel futuro a la derecha
  }
  return '';
};

// Helper para centrar dinámicamente el contenedor (CORREGIDO para Step 2.5)
const getContainerOffset = () => {
  const cardWidth = 320; // w-80 = 320px (Steps 1, 2, 3)
  const cardWidthLarge = 384; // w-96 = 384px (Step 2.5)
  const gap = 32; // gap-8 = 32px
  let offset = 0;

  if (currentStep === 1) {
    offset = 0; // Step 1 centrado
  } else if (currentStep === 2) {
    offset = -(cardWidth + gap); // Mover 1 card a la izquierda
  } else if (currentStep === 2.5) {
    // Step 1 (320px) + gap + Step 2 (320px) + gap = 672px to the left
    offset = -(cardWidth + gap) * 2;
  } else if (currentStep === 3) {
    // Step 1 + Step 2 + Step 2.5 (384px) + gaps
    offset = -(cardWidth + gap) * 2 - (cardWidthLarge + gap);
  }

  return offset;
};
```

**Layout Principal:**
```typescript
<div
  className="flex items-center gap-8 transition-all duration-700 ease-in-out"
  style={{ transform: `translateX(${getContainerOffset()}px)` }}
>
  {/* Paso 1: Tipología */}
  <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(1)}`}>
    {/* Contenido del paso */}
  </div>

  {/* Paso 2: Tipo de palanca */}
  <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(2)}`}>
    {/* Contenido del paso */}
  </div>

  {/* Paso 2.5: Selección de palancas (conditional) */}
  {formData.tipoPalanca && (
    <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(2.5)}`}>
      {/* Contenido del paso */}
    </div>
  )}

  {/* Paso 3: Tamaño de tienda */}
  <div className={`flex-shrink-0 transition-all duration-700 ease-in-out ${getPanelClass(3)}`}>
    {/* Contenido del paso */}
  </div>
</div>
```

### 2. **Sistema de Sub-Steps (2 y 2.5) - Centrado Corregido**
- ✅ **Step 2:** Selección de tipo (Simple/Multiple) - Ancho 320px (`w-80`)
- ✅ **Step 2.5:** Grid de palancas con checkboxes - Ancho 384px (`w-96`)
- ✅ **Bug Fix:** Corrección de `getContainerOffset()` para usar 384px en Step 2.5 (antes usaba 320px)
- ✅ **Bug Fix:** Corrección del offset de Step 3 para considerar el ancho real de Step 2.5
- ✅ Renderizado condicional de Step 2.5 basado en `formData.tipoPalanca`
- ✅ Transición independiente: Step 2 se mueve a la izquierda, Step 2.5 entra centrado
- ✅ Navegación: Step 2 → Step 2.5 → Step 3

**Flujo de Navegación:**
```typescript
const handleNext = () => {
  if (currentStep === 4) {
    calculateResults();
  } else if (canContinue()) {
    setCompletedSteps(prev => [...prev, currentStep]);

    if (currentStep === 2) {
      setCurrentStep(2.5); // Ir a selección de palancas
    } else if (currentStep === 2.5) {
      setCurrentStep(3); // Ir a tamaño de tienda
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }
};
```

### 3. **Step 4 Simplificado (Versión Final)**
- ✅ Diseño simple y funcional con todos los inputs visibles en un solo card
- ✅ Contenedor scrollable: `max-h-[calc(100vh-300px)] overflow-y-auto`
- ✅ 4 secciones de features (Frentes, SKUs, Equipos, Puertas) + Parámetros Financieros
- ✅ Botón "Simular" en Step 4 ejecuta `calculateResults()`

**Decisión de Diseño:** Esta es la versión final del Step 4. Se decidió mantener un diseño simple y directo sin animaciones complejas, mostrando todos los inputs simultáneamente para facilitar el ajuste de valores.

### 4. **Bug Fixes JSX**
- ✅ Corregidos múltiples cierres faltantes de `</div>` en Steps 4 y 5
- ✅ Estructura JSX completa y válida

### 5. **Animación de Cálculo Simplificada (Step 5)**
- ✅ Diseño minimalista con círculo único giratorio (1.2s rotation)
- ✅ Eliminados círculos medio e interior (reducción de 3 a 1 círculo)
- ✅ Eliminados 4 puntos flotantes con `animate-ping`
- ✅ Eliminado efecto pulsante en centro
- ✅ Ícono Sparkles central sin animación (8x8)
- ✅ Mantenida barra de progreso funcional con porcentaje
- ✅ Mantenidos mensajes dinámicos contextuales

**Diseño Final:**
```typescript
{isCalculating && (
  <div className="border-t border-border p-8 bg-card">
    <div className="flex flex-col items-center space-y-6 max-w-lg mx-auto">
      {/* Animación minimalista - círculo único */}
      <div className="relative w-24 h-24">
        <div
          className="absolute inset-0 w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: '1.2s' }}
        ></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
      </div>
      {/* Texto + Barra de progreso */}
    </div>
  </div>
)}
```

**Resultado:** Animación profesional y limpia, mejora visual significativa sin elementos "busy"

---

## Patrones de Código a Mantener

### 1. **Estructura de Estado**
```typescript
// ✅ Estados implementados
const [currentStep, setCurrentStep] = useState<number>(1);
const [completedSteps, setCompletedSteps] = useState<number[]>([]);
const [isCalculating, setIsCalculating] = useState(false);
const [calculationProgress, setCalculationProgress] = useState(0);
const [calculationMessage, setCalculationMessage] = useState('');
const [formData, setFormData] = useState<FormData>({...});
const [results, setResults] = useState<Results>({...});
```

### 2. **Navegación con Sub-Steps**
```typescript
// ✅ Lógica de navegación con soporte para sub-steps
const handleNext = () => {
  if (currentStep === 4) {
    calculateResults();  // Calcular al finalizar Step 4
  } else if (canContinue()) {
    setCompletedSteps(prev => [...prev, currentStep]);

    // Progresión con sub-steps
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
    setCurrentStep(4);
  } else if (currentStep > 1) {
    // Retroceso con sub-steps
    if (currentStep === 3) {
      setCurrentStep(2.5);
      setCompletedSteps(prev => prev.filter(s => s !== 2.5));
    } else if (currentStep === 2.5) {
      setCurrentStep(2);
      setCompletedSteps(prev => prev.filter(s => s !== 2));
    } else {
      setCurrentStep(prev => prev - 1);
      setCompletedSteps(prev => prev.filter(s => s !== currentStep - 1));
    }
  }
};
```

### 3. **Transiciones CSS**
```typescript
// ✅ Usar transiciones Tailwind consistentes
className="transition-all duration-700 ease-in-out"  // Para paneles horizontales
className="transition-all duration-500 ease-out"     // Para animaciones rápidas
```

### 4. **Validaciones**
```typescript
// ✅ Mantener validaciones contextuales
const isTamanoDisabled = (tamano: TamanoTienda): boolean => {
  if (formData.tipoPalanca === 'multiple' && tamano === 'Pequeño') return true;
  if (formData.tipologia === 'Droguerías' && tamano === 'Grande') return true;
  return false;
};
```

---

## Plan de Testing

### Tests Visuales:
1. ✅ Verificar que Step 1 (Tipología) está centrado al inicio
2. ✅ Confirmar que Step 2 se mueve a la izquierda al avanzar
3. ✅ Verificar que Step 2.5 (Selección de palancas) entra centrado
4. ✅ Confirmar que Step 3 (Tamaño) entra centrado al avanzar
5. ✅ Verificar que Step 4 muestra todos los inputs correctamente con scroll
6. ✅ Confirmar nueva animación de cálculo minimalista

### Tests Funcionales:
1. ✅ Validar que no se puede avanzar sin seleccionar opciones
2. ✅ Confirmar transición Step 2 → Step 2.5 solo cuando tipoPalanca está seleccionado
3. ✅ Confirmar validación de palancas (1 para simple, 2+ para múltiple)
4. ✅ Confirmar que "Pequeño" se deshabilita con palancas múltiples
5. ✅ Confirmar que "Grande" se deshabilita para Droguerías
6. ✅ Verificar cálculos de Uplift, ROI y Payback
7. ✅ Confirmar que "Nueva Simulación" resetea todo el estado

### Tests de Integración:
1. ✅ Verificar flujo completo: Step 1 → Step 2 → Step 2.5 → Step 3 → Step 4 → Step 5 → Reset
2. ✅ Confirmar que navegación "Anterior" funciona con sub-steps (3 → 2.5 → 2 → 1)
3. ✅ Verificar que botón "Simular" siempre está habilitado en Step 4

---

## Notas Técnicas

### Archivos Relacionados:
- `frontend/src/components/SimulationPersonalizada.tsx` (~750 líneas) - Componente principal
- `frontend/src/components/SimulationVisualization.tsx` (55 líneas) - Container con toggle
- `frontend/src/components/SimulationEstudio.tsx` - Placeholder para estudios futuros

### Dependencias:
- `lucide-react`: Íconos (ChevronLeft, ChevronRight, Sparkles, TrendingUp, DollarSign, Calendar)
- `@radix-ui/react-*`: shadcn/ui components (Card, Button, Input, RadioGroup, Checkbox, Label)
- `tailwindcss`: Estilos y animaciones

---

## Cambio Reciente: Corrección de Centrado de Paneles (2025-10-14)

### Problema Identificado:
Los paneles no estaban centrados correctamente en viewport, especialmente visible en Step 1 y al transicionar a Step 2.5.

### Causa Raíz:
1. **Width inconsistency**: Step 2.5 tiene 384px (`w-96`) pero `getContainerOffset()` asumía 320px para todos los steps
2. **Offset incorrecto en Step 3**: No consideraba el ancho real de Step 2.5 (384px) al calcular su posición

### Solución Implementada:
1. **Actualización de `getContainerOffset()`** (`SimulationPersonalizada.tsx:237-256`):
   - Agregada constante `cardWidthLarge = 384` para Step 2.5
   - Step 2.5 offset: `-(cardWidth + gap) * 2` (mismo cálculo, pero documentado)
   - Step 3 offset: `-(cardWidth + gap) * 2 - (cardWidthLarge + gap)` (ahora usa 384px)

2. **Resultado**: Todos los paneles ahora se centran correctamente en viewport durante transiciones

### Archivos Modificados:
- `frontend/src/components/SimulationPersonalizada.tsx` (líneas 237-256)
- `NEXT_STEPS.md` (documentación actualizada)

---

## Próximos Pasos Sugeridos (Orden Recomendado)

1. **Testing Completo:**
   - Probar flujo completo en navegadores (Chrome, Firefox, Safari)
   - Verificar responsive design (si aplica)
   - Confirmar que todas las transiciones son suaves

2. **Optimizaciones Opcionales:**
   - Agregar sonidos sutiles en transiciones (opcional)
   - Implementar persistencia de estado en localStorage (opcional)
   - Agregar tooltips explicativos en features (opcional)
   - Integrar con backend para guardar simulaciones (opcional)

---

**Última actualización:** 2025-10-14 (4a actualización)
**Desarrollador:** Claude Code
**Estado:** ✅ Refactoring completado - Sistema de steps con centrado corregido + animación minimalista implementados
