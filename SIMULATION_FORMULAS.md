# Fórmulas de Cálculo - Simulador de Palancas

Este documento describe las fórmulas utilizadas en el simulador de palancas para calcular las métricas financieras: **Uplift**, **ROI** y **Payback**.

---

## 📊 Variables de Entrada

| Variable | Descripción | Unidad |
|----------|-------------|--------|
| `prediction_with_palanca` | Predicción de ventas CON palanca (tratamiento) | COP/mes |
| `prediction_control` | Predicción de ventas SIN palanca (control) | COP/mes |
| `MACO` | Margen de contribución | % |
| `CAPEX` | Inversión inicial (una sola vez) | COP |
| `Fee` | Costo operativo mensual recurrente | COP/mes |

---

## 1️⃣ UPLIFT (Incremento de Ventas)

### Fórmula:
```
Uplift (%) = ((Predicción con Palanca - Predicción Control) / Predicción Control) × 100
```

### Interpretación:
- Mide el **porcentaje de aumento en ventas** respecto al grupo control (baseline)
- **Siempre es positivo** si la palanca genera más ventas que el control

### Ejemplo:
```python
prediction_with_palanca = 2,276,299.54 COP
prediction_control = 1,989,250.87 COP

uplift = ((2,276,299.54 - 1,989,250.87) / 1,989,250.87) × 100
uplift = (287,048.67 / 1,989,250.87) × 100
uplift = 14.43%
```

**Resultado:** La palanca aumenta las ventas en **14.43%** respecto al control.

---

## 2️⃣ PAYBACK (Período de Recuperación)

### Fórmula:
```
Payback (meses) = CAPEX / (Ganancia Incremental Mensual - Fee Mensual)
```

### Donde:
```
Ganancia Incremental Mensual = (Predicción con Palanca - Predicción Control) × (MACO / 100)
Ganancia Neta Mensual = Ganancia Incremental Mensual - Fee Mensual
```

### Condición:
- Si `Ganancia Neta Mensual ≤ 0` → **Payback = null (N/A)**
- La inversión nunca se recupera porque los costos operativos superan las ganancias

### Ejemplo:
```python
# Paso 1: Calcular ganancia incremental mensual
diferencia_ventas = 2,276,299.54 - 1,989,250.87 = 287,048.67 COP
ganancia_incremental = 287,048.67 × (23.5 / 100) = 67,456.44 COP/mes

# Paso 2: Calcular ganancia neta (descontando fee)
fee_mensual = 2,518,022.66 COP/mes
ganancia_neta = 67,456.44 - 2,518,022.66 = -2,450,566.22 COP/mes ❌

# Paso 3: Calcular payback
if ganancia_neta > 0:
    payback = 89,179.97 / ganancia_neta
else:
    payback = null  # Nunca se recupera
```

**Resultado:** Payback = **null (N/A)** porque la ganancia mensual (67,456 COP) no supera el fee mensual (2,518,023 COP).

---

## 3️⃣ ROI (Return on Investment a 12 meses)

### Fórmula:
```
ROI (12 meses) = (Ganancia Anual - Fee Anual - CAPEX) / (CAPEX + Fee Anual)
```

### Donde:
```
Ganancia Anual = Ganancia Incremental Mensual × 12
Fee Anual = Fee Mensual × 12
Inversión Total = CAPEX + Fee Anual
```

### Interpretación:
- Mide el **retorno por cada peso invertido** en 12 meses
- **ROI > 0**: Inversión rentable (ganancias superan costos)
- **ROI < 0**: Inversión no rentable (pérdidas)
- **ROI = -1**: Pérdida total de la inversión

### Ejemplo:
```python
# Paso 1: Calcular flujos anuales
ganancia_anual = 67,456.44 × 12 = 809,477.28 COP/año
fee_anual = 2,518,022.66 × 12 = 30,216,271.92 COP/año

# Paso 2: Calcular inversión total
inversion_total = 89,179.97 + 30,216,271.92 = 30,305,451.89 COP

# Paso 3: Calcular ROI
numerador = 809,477.28 - 30,216,271.92 - 89,179.97 = -29,495,974.61 COP
roi = -29,495,974.61 / 30,305,451.89 = -0.97
```

**Resultado:** ROI = **-0.97 (-97%)** → Por cada peso invertido, se pierden 0.97 pesos en 12 meses.

---

## 📈 Resumen de Interpretación

| Métrica | Valor | Interpretación |
|---------|-------|----------------|
| **Uplift** | 14.43% | ✅ La palanca aumenta ventas 14.43% |
| **Ganancia Incremental** | 67,456 COP/mes | ✅ Ganancia bruta mensual |
| **Fee Mensual** | 2,518,023 COP/mes | ❌ Costo operativo muy alto |
| **Ganancia Neta** | -2,450,566 COP/mes | ❌ Pérdida mensual |
| **Payback** | null (N/A) | ❌ Nunca se recupera la inversión |
| **ROI (12m)** | -0.97 (-97%) | ❌ Pérdida del 97% de la inversión |

---

## 🔍 Casos Especiales

### ¿Cuándo Payback es null (N/A)?
- Cuando `Ganancia Neta Mensual ≤ 0`
- Significa que el **costo operativo mensual (fee)** supera la **ganancia incremental**
- La inversión **nunca se recupera**

### ¿Cuándo ROI es negativo?
- Cuando `Ganancia Anual < (Fee Anual + CAPEX)`
- Significa que la inversión genera **pérdidas netas** en 12 meses
- Cuanto más cercano a -1, mayor es la pérdida

---

## 💡 Ejemplo con Resultados Positivos

Para que el proyecto sea rentable, necesitas:
- **Mayor uplift** (más incremento de ventas)
- **Mayor MACO** (mejor margen)
- **Menor fee** (costos operativos reducidos)

**Escenario hipotético:**
```python
# Inputs
uplift = 50% (mayor incremento)
MACO = 40% (mejor margen)
fee_mensual = 20,000 COP (fee mucho menor)
diferencia_ventas = 600,000 COP

# Cálculos
ganancia_incremental = 600,000 × 0.40 = 240,000 COP/mes
ganancia_neta = 240,000 - 20,000 = 220,000 COP/mes ✅

payback = 89,180 / 220,000 = 0.41 meses ✅ (12 días)

roi = ((240k × 12) - (20k × 12) - 89k) / (89k + 240k)
roi = (2,880k - 240k - 89k) / 329k
roi = 2,551k / 329k = 7.75 ✅ (775% retorno)
```

**Resultado:**
- ✅ Payback: **0.4 meses** (recuperas inversión en 12 días)
- ✅ ROI: **7.75 (775%)** → Ganas 7.75 pesos por cada peso invertido

---

## 🔗 Referencias

- **Archivo backend:** `/backend/app/services/unified_database_service.py`
- **Método:** `calculate_simulation()` (líneas 1345-1503)
- **Endpoint API:** `POST /api/simulation/calculate`

---

**Última actualización:** 2025-10-17
