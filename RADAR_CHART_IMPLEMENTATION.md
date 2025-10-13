# Radar Chart Implementation Guide

## Overview

This document details the complete implementation of the radar chart visualization system in the Gatorade A/B Testing Dashboard.

**Last Updated:** October 12, 2025

---

## Architecture

### Component Hierarchy

```
Dashboard.tsx
  └─ ResultsVisualization.tsx (Toggle: Cuadro / Visual)
       ├─ ExperimentTable.tsx (Table view)
       └─ RadarChartContainer.tsx (Radar view)
            ├─ RadarChartView.tsx (Super e hiper)
            ├─ RadarChartView.tsx (Conveniencia)
            └─ RadarChartView.tsx (Droguerías)
```

### Data Flow

```
Backend                              Frontend
--------                             --------
PostgreSQL
   ↓
ab_test_summary table
   ↓
get_radar_chart_data()              RadarChartContainer
   ↓                                    ↓
/api/dashboard/radar-data           apiService.getRadarData()
   ↓                                    ↓
JSON Response                       3 x RadarChartView
   ↓                                    ↓
Aggregated by                       Display with
tipología + palanca                 Recharts + Tooltips
```

---

## Backend Implementation

### Database Query (`unified_database_service.py`)

**Method:** `get_radar_chart_data(tipologia, fuente, unidad, categoria)`

**Key SQL Query:**
```sql
SELECT
    t.typology_name as tipologia,
    l.lever_name as palanca,
    AVG(s.difference_vs_control) as avg_score
FROM ab_test_summary s
JOIN typology_master t ON s.typology_id = t.typology_id
JOIN lever_master l ON s.lever_id = l.lever_id
WHERE l.lever_name != 'Control'
  AND s.category_id NOT IN (5, 6, 7)  -- Exclude Electrolit, Powerade, Otros
GROUP BY t.typology_name, l.lever_name
ORDER BY t.typology_name, l.lever_name
```

**NaN Handling:**
```python
import math

# Check for NaN and convert to 0.0
avg_score = row.avg_score
if avg_score is None:
    avg_score_value = 0.0
else:
    try:
        avg_score_value = float(avg_score)
        if math.isnan(avg_score_value):
            avg_score_value = 0.0
    except (ValueError, TypeError):
        avg_score_value = 0.0
```

**Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "tipologia": "Super e hiper",
      "palanca": "Metro cuadrado",
      "avg_score": 0.08187307692307692
    },
    // ... more entries
  ],
  "tipologias": ["Conveniencia", "Droguerías", "Super e hiper"],
  "palancas": ["Cajero vendedor", "Metro cuadrado", ...]
}
```

### API Endpoint (`analytics.py`)

```python
@analytics_bp.route('/api/dashboard/radar-data', methods=['GET'])
def get_radar_data():
    """Get aggregated data for radar chart visualization"""
    tipologia = request.args.get('tipologia')
    fuente = request.args.get('fuente')
    unidad = request.args.get('unidad')
    categoria = request.args.get('categoria')

    results = unified_db.get_radar_chart_data(
        tipologia=tipologia, fuente=fuente, unidad=unidad, categoria=categoria
    )
    return jsonify(results), 200
```

---

## Frontend Implementation

### 1. ResultsVisualization.tsx (Toggle Component)

**Purpose:** Provides toggle between table and radar views

**Key Features:**
- Elegant tabs design with smooth transitions
- Dynamic title based on active view
- Positioned on left side of card header

**Code:**
```typescript
const [viewMode, setViewMode] = useState<'table' | 'radar'>('table');

return (
  <Card className="h-full bg-card shadow-sm">
    <CardHeader className="pb-3">
      <div className="flex items-center gap-4">
        {/* Toggle */}
        <div className="inline-flex items-center bg-muted rounded-lg p-0.5">
          <button onClick={() => setViewMode('table')} ...>
            Cuadro
          </button>
          <button onClick={() => setViewMode('radar')} ...>
            Visual
          </button>
        </div>

        {/* Dynamic Title */}
        <h3 className="text-foreground font-semibold text-base">
          {viewMode === 'table'
            ? `Resultados por Fuente-Categoría y Palanca - ${filters.tipologia}`
            : 'Visual Comparativo de Palancas'
          }
        </h3>
      </div>
    </CardHeader>

    <CardContent className="h-[calc(100%-60px)] p-0">
      {viewMode === 'table' ? (
        <ExperimentTable filters={filters} />
      ) : (
        <RadarChartContainer filters={filters} />
      )}
    </CardContent>
  </Card>
);
```

### 2. RadarChartContainer.tsx (Data Manager)

**Purpose:** Manages data fetching and layout for 3 radar charts

**Key Features:**
- Always fetches all 3 tipologías (filter-independent)
- Fetches detailed data per tipología for tooltips
- Horizontal grid layout (1x3)
- Color-coded titles

**Data Fetching:**
```typescript
useEffect(() => {
  const loadRadarData = async () => {
    // Always fetch all 3 tipologías (ignore all filters)
    const radarResponse = await apiService.getRadarData(
      'all',      // Always show all tipologías
      undefined,  // Ignore fuente filter
      undefined,  // Ignore unidad filter
      undefined   // Ignore categoria filter
    );

    setRadarData(radarResponse.data);
    setTipologias(radarResponse.tipologias);

    // Fetch detailed data for each tipología for tooltips
    const detailedDataByTipologia: Record<string, any[]> = {};
    for (const tipologia of radarResponse.tipologias) {
      const detailResponse = await apiService.getDashboardResults(
        tipologia, undefined, undefined, undefined
      );
      if (detailResponse.success) {
        detailedDataByTipologia[tipologia] = detailResponse.data;
      }
    }
    setDetailedData(detailedDataByTipologia);
  };

  loadRadarData();
}, []); // Only load once on mount, ignore all filter changes
```

**Layout:**
```typescript
<div className="grid grid-cols-3 gap-4 h-full">
  {/* Super e hiper */}
  <div className="flex flex-col">
    <h3 className="text-center text-base font-bold mb-3"
        style={{ color: '#3b82f6' }}>
      Super e hiper
    </h3>
    <div className="flex-1 min-h-0">
      <RadarChartView
        data={tipologiaData['Super e hiper']}
        tipologias={['Super e hiper']}
        mode="simple"
        detailedData={detailedData['Super e hiper'] || []}
      />
    </div>
  </div>
  {/* Repeat for Conveniencia and Droguerías */}
</div>
```

### 3. RadarChartView.tsx (Visualization Component)

**Purpose:** Renders individual radar chart with Recharts

**Key Features:**
- Custom tick component for label wrapping
- Enhanced tooltip with detailed breakdown
- Color mapping for tipologías
- NaN handling on frontend

**Color Mapping:**
```typescript
const TIPOLOGIA_COLORS: Record<string, string> = {
  'Super e hiper': '#3b82f6',      // Blue
  'Conveniencia': '#10b981',        // Green
  'Droguerías': '#f97316',          // Orange
};
```

**Data Transformation:**
```typescript
// Transform from flat data to Recharts format
// Input: [{ tipologia, palanca, avg_score }, ...]
// Output: [{ palanca: "X", "Super e hiper": 23.0, ... }, ...]

const chartData = palancas.map(palanca => {
  const point: any = { palanca };

  data
    .filter(item => item.palanca === palanca)
    .forEach(item => {
      // Convert to percentage (multiply by 100), handle NaN/null
      const value = item.avg_score;
      point[item.tipologia] = (value !== null && !isNaN(value))
        ? (value * 100)
        : 0;
    });

  return point;
});
```

**Custom Tick (Label Wrapping):**
```typescript
const CustomTick = ({ payload, x, y, textAnchor, stroke, radius }: any) => {
  const words = payload.value.split(' ');
  const lineHeight = 14;

  // If the label is short, show it in one line
  if (words.length <= 2) {
    return (
      <text
        x={x} y={y}
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
        fontWeight="bold"
        textAnchor={textAnchor}
      >
        {payload.value}
      </text>
    );
  }

  // For longer labels, split into multiple lines
  const midPoint = Math.ceil(words.length / 2);
  const line1 = words.slice(0, midPoint).join(' ');
  const line2 = words.slice(midPoint).join(' ');

  return (
    <text
      x={x} y={y}
      fill="hsl(var(--muted-foreground))"
      fontSize={11}
      fontWeight="bold"
      textAnchor={textAnchor}
    >
      <tspan x={x} dy={-lineHeight / 2}>{line1}</tspan>
      <tspan x={x} dy={lineHeight}>{line2}</tspan>
    </text>
  );
};
```

**Enhanced Tooltip:**
```typescript
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const palanca = payload[0].payload.palanca;

    // Categories to exclude (Electrolit, Powerade, Otros)
    const excludedCategories = ['Electrolit', 'Powerade', 'Otros'];

    // Get all detailed data for this palanca, excluding certain categories
    const palancaDetails = detailedData.filter(item =>
      item.palanca === palanca && !excludedCategories.includes(item.category)
    );

    const avgScore = payload[0].value;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 max-w-xs">
        {/* Palanca Name */}
        <p className="font-semibold text-sm text-foreground mb-2 border-b border-border pb-2">
          {palanca}
        </p>

        {/* Breakdown by Source-Category */}
        {palancaDetails.length > 0 && (
          <div className="space-y-1 mb-2">
            <p className="text-xs font-medium text-muted-foreground mb-1">Desglose:</p>
            {palancaDetails.map((item, index) => (
              <div key={index} className="text-xs pl-2">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground truncate">
                    {item.source} - {item.category}
                  </span>
                  <span className={`font-medium ${
                    item.diferencia_vs_control >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(item.diferencia_vs_control * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Final Average */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Promedio Final:</span>
            <span className="font-bold text-primary">
              {avgScore.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
```

**Recharts Integration:**
```typescript
<RadarChart data={chartData}>
  <PolarGrid stroke="#e5e7eb" />
  <PolarAngleAxis
    dataKey="palanca"
    tick={<CustomTick />}
  />
  <PolarRadiusAxis
    angle={90}
    domain={[0, 'auto']}
    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
  />

  {tipologias.map((tipologia) => (
    <Radar
      key={tipologia}
      name={tipologia}
      dataKey={tipologia}
      stroke={TIPOLOGIA_COLORS[tipologia] || '#6b7280'}
      fill={TIPOLOGIA_COLORS[tipologia] || '#6b7280'}
      fillOpacity={mode === 'comparative' ? 0.25 : 0.4}
      strokeWidth={2}
    />
  ))}

  <Tooltip content={<CustomTooltip />} />
</RadarChart>
```

---

## Key Design Decisions

### 1. Category Filtering (IDs 5, 6, 7)

**Categories Excluded:**
- ID 5: Electrolit
- ID 6: Powerade
- ID 7: Otros

**Reasoning:** These categories are not core Gatorade products and should not influence the radar chart averages.

**Implementation:**
- **Backend (SQL):** `WHERE s.category_id NOT IN (5, 6, 7)`
- **Frontend (Tooltip):** `excludedCategories = ['Electrolit', 'Powerade', 'Otros']`

### 2. Filter Independence

**Decision:** Radar charts ignore all filter selections

**Reasoning:**
- Radar charts are meant to show a comprehensive overview of all tipologías
- Comparing all 3 tipologías side-by-side provides better insights
- Filters primarily affect the detailed table view

**Implementation:**
- Always call API with `tipologia='all'`
- Ignore fuente, unidad, categoria filters
- Load data only once on mount

### 3. Color-Coded Titles (No Legend)

**Decision:** Move tipología names to top with colors, remove bottom legend

**Reasoning:**
- Cleaner visual appearance
- More space for radar chart
- Easier to identify which radar belongs to which tipología
- Better use of vertical space

**Implementation:**
- Inline styles for color: `style={{ color: '#3b82f6' }}`
- Removed `<Legend>` component from Recharts
- Titles: `text-base font-bold mb-3`

### 4. Smart Label Wrapping

**Decision:** Automatically split long palanca names into two lines

**Reasoning:**
- Prevents label truncation at radar edges
- Maintains readability for long names
- Adaptive based on word count

**Implementation:**
- Custom `CustomTick` component
- Logic: ≤2 words = one line, >2 words = two lines
- Uses `<tspan>` for multi-line SVG text

### 5. Enhanced Tooltips

**Decision:** Show detailed breakdown by source-category

**Reasoning:**
- Users want to understand what contributes to the average
- Transparency in data aggregation
- Ability to see individual components

**Implementation:**
- Fetch detailed data per tipología on mount
- Filter by palanca and exclude certain categories
- Display in structured format with color coding

---

## Performance Considerations

### Data Fetching Strategy

**Radar Data:**
- Fetched once on mount
- Cached in component state
- Filter-independent (doesn't re-fetch)

**Detailed Data (Tooltips):**
- Fetched per tipología on mount
- Stored in object: `{ 'Super e hiper': [...], ... }`
- Used only for tooltip display

**Total API Calls on Mount:**
- 1 call to `/api/dashboard/radar-data?tipologia=all`
- 3 calls to `/api/dashboard/results` (one per tipología)
- Total: 4 API calls

### Optimization Opportunities

1. **Backend Caching:**
   - Cache radar data for 5-15 minutes
   - Data changes infrequently

2. **Combine Detailed Data:**
   - Single API call to get all detailed data
   - Backend returns structured response

3. **Lazy Load Tooltips:**
   - Only fetch detailed data when user hovers
   - Reduces initial load time

---

## Testing

### Manual Testing Checklist

- [ ] Toggle switches between "Cuadro" and "Visual" smoothly
- [ ] All 3 radar charts render correctly
- [ ] Titles are color-coded (Blue, Green, Orange)
- [ ] Palanca labels are bold and wrap correctly
- [ ] No labels are cut off or overlapping
- [ ] Tooltips show on hover
- [ ] Tooltip displays palanca name
- [ ] Tooltip shows source-category breakdown
- [ ] Electrolit, Powerade, Otros are excluded from tooltips
- [ ] Final average matches radar value
- [ ] Colors are correct (green for positive, red for negative)
- [ ] Radar data ignores filter changes
- [ ] No NaN errors in console
- [ ] Charts render on different screen sizes

### Edge Cases

1. **No Data Available:**
   - Should show "No hay datos disponibles" message

2. **Single Palanca:**
   - Radar should still render (even with 1 axis)

3. **All Values Zero:**
   - Radar should show flat chart at center

4. **NaN Values:**
   - Should convert to 0.0, not crash

---

## Troubleshooting

### Issue: Radar doesn't update after filter change

**Expected:** Radar should NOT update (filter-independent design)
**If unexpected:** Check that `useEffect` dependency array is empty `[]`

### Issue: NaN in console or broken chart

**Cause:** PostgreSQL returning NaN values
**Solution:** Ensure backend uses `math.isnan()` to detect and convert to 0.0
**Files:** `unified_database_service.py` lines 352-369

### Issue: Labels cut off or overlapping

**Cause:** Long palanca names without wrapping
**Solution:** Verify `CustomTick` component is used in `PolarAngleAxis`
**Files:** `RadarChartView.tsx` lines 58-101, 167

### Issue: Tooltip shows excluded categories

**Cause:** Frontend filter not applied
**Solution:** Check `excludedCategories` array in `CustomTooltip`
**Files:** `RadarChartView.tsx` lines 63-69

### Issue: Colors not matching

**Cause:** Color mapping mismatch
**Solution:** Verify `TIPOLOGIA_COLORS` object
**Expected:**
- Super e hiper: #3b82f6 (blue)
- Conveniencia: #10b981 (green)
- Droguerías: #f97316 (orange)

---

## Future Enhancements

### Potential Features

1. **Zoom/Fullscreen Mode:**
   - Expand single radar to full screen
   - Better for presentations

2. **Export Functionality:**
   - Export radar data to CSV/Excel
   - Download chart as PNG/SVG

3. **Animation:**
   - Animate radar when switching to visual view
   - Smooth transitions between data updates

4. **Comparison Mode:**
   - Overlay all 3 tipologías on single radar
   - Toggle between separate and combined views

5. **Custom Color Themes:**
   - Allow users to customize tipología colors
   - Dark mode support for colors

### Technical Debt

1. **Type Safety:**
   - Add proper TypeScript interfaces for all props
   - Remove `any` types from tooltip components

2. **Component Size:**
   - `RadarChartView.tsx` is quite large (157 lines)
   - Consider splitting tooltip into separate component

3. **Magic Numbers:**
   - Category IDs (5, 6, 7) are hardcoded
   - Consider storing in config or fetching from API

---

## References

### External Libraries

- **Recharts:** https://recharts.org/
  - `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`, `Radar`, `Tooltip`

### Related Documentation

- `CLAUDE.md` - Full project overview
- `DASHBOARD_NOTES.md` - Dashboard implementation notes
- `backend/app/services/unified_database_service.py` - Database service
- `frontend/src/components/` - React components

### Database Schema

- `category_master` - Category IDs and names
- `typology_master` - Tipología IDs and names
- `lever_master` - Palanca IDs and names
- `ab_test_summary` - Aggregated test results

---

**Document End**
