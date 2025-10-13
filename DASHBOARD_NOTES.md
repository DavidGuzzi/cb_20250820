# Dashboard Implementation Notes

## Current Implementation (Updated: October 12, 2025)

### Filter System Architecture

#### 6 Dynamic Filters from PostgreSQL:
1. **Tipología** (mandatory) - Default: "Super e hiper"
2. **Fuente de Datos** (optional) - Default: "all"
3. **Unidad de Medida** (optional) - Default: "all"
4. **Categoría** (optional) - Default: "all"
5. **Palanca** (timeline only) - Default: "Punta de góndola"
6. **KPI** (timeline only) - Default: "Cajas 8oz"

#### Important Implementation Details:

**Radix UI SelectItem Compatibility:**
- ❌ DO NOT use `<SelectItem value="">` - Radix UI throws error
- ✅ USE `<SelectItem value="all">` for "Todas" options
- Frontend converts `'all'` to `undefined` before API calls

**Filter Exclusions:**
- "Control" palanca is excluded from filter options
- Query: `WHERE lever_name != 'Control'` in `get_filter_options()`

**Percentage Formatting:**
- Database stores decimals (0.3, 0.185, etc.)
- Frontend multiplies by 100 for display (30.0%, 18.5%)
- Formula: `(value * 100).toFixed(1)%`

### Table Structure (ExperimentTable)

**Row Grouping:**
- Groups: `{Source} - {Category}` (e.g., "Sell In - Gatorade")
- Sub-rows: By Unit (Cajas 8oz, Ventas)
- Uses `React.Fragment` with unique keys to avoid warnings

**Cell Display:**
- Primary: `difference_vs_control` (colored green/red)
- Secondary: `average_variation` (in parentheses)
- Format: `+30.0% (+18.5%)` or `-10.2% (-8.9%)`

**Columns:**
- Dynamic palancas from PostgreSQL
- Icon mapping for each palanca (Star, Zap, Target, etc.)

### API Evolution (Names vs IDs)

**Old System (Removed):**
- ❌ Used `maestro-mappings` endpoint to convert names → IDs
- ❌ Timeline accepted `palanca_id` and `kpi_id` integers
- ❌ Frontend had to maintain ID-to-name mappings

**New System (Current):**
- ✅ Direct name-based queries
- ✅ Timeline accepts `palanca` and `kpi` as strings
- ✅ No ID conversion needed
- ✅ Simpler and more maintainable

**Endpoint Changes:**
```
GET /api/dashboard/evolution-data?palanca=Punta de góndola&kpi=Cajas 8oz&tipologia=Super e hiper
```

### Key Files Modified (Latest Session)

**Backend:**
1. `unified_database_service.py`:
   - `get_filter_options()` - Returns 6 filter arrays, excludes "Control"
   - `get_dashboard_results()` - Accepts 4 optional filters
   - `get_evolution_data()` - Changed from IDs to names

2. `analytics.py`:
   - Updated endpoints to accept names instead of IDs
   - Multiple filter support in `/api/dashboard/results`

**Frontend:**
1. `Dashboard.tsx` - Filter state with 'all' defaults
2. `FilterPanel.tsx` - Dynamic filters with `value="all"`
3. `ExperimentTable.tsx` - Percentage formatting + 'all' handling
4. `TimelineChart.tsx` - Removed maestro-mappings dependency
5. `api.ts` - Updated interfaces for name-based queries

### Radar Chart Visualization

**Toggle System:**
- Elegant tabs toggle: "Cuadro" and "Visual"
- Positioned left side of card header next to dynamic title
- Smooth transitions with Tailwind CSS

**3 Radar Charts Layout:**
- **Horizontal grid (1x3)**: All typologies side by side
- **Independent radars**: One per tipología with color-coded titles
- **Colors**:
  - Super e hiper: Blue (#3b82f6)
  - Conveniencia: Green (#10b981)
  - Droguerías: Orange (#f97316)

**Data Aggregation:**
- **Source**: `get_radar_chart_data()` in `unified_database_service.py`
- **Calculation**: `AVG(difference_vs_control)` grouped by tipología and palanca
- **Category Exclusions**: Filters out categories 5, 6, 7 (Electrolit, Powerade, Otros)
- **SQL Filter**: `WHERE s.category_id NOT IN (5, 6, 7)`

**Visual Enhancements:**
- **Titles**: text-base, font-bold, colored (removed legend from bottom)
- **Palanca Labels**: Bold font with custom line-wrapping component
- **Smart Wrapping**: Labels >2 words split into two lines
- **NaN Handling**: Backend converts NaN to 0.0 using `math.isnan()`

**Enhanced Tooltips:**
- Shows palanca name as header
- Lists all source-category combinations with individual percentages
- Excludes Electrolit, Powerade, Otros in frontend filter
- Displays final average (matches radar value)
- Color-coded values: green (positive), red (negative)

**Filter Independence:**
- Radar data ALWAYS fetches all 3 tipologías
- Ignores tipología, fuente, unidad, categoria filters
- Only loads once on component mount
- Endpoint: `GET /api/dashboard/radar-data?tipologia=all`

**Technical Components:**
1. `ResultsVisualization.tsx` - Parent with toggle
2. `RadarChartContainer.tsx` - Manages 3 radars and detailed data
3. `RadarChartView.tsx` - Individual radar with Recharts
4. Uses Recharts: `RadarChart`, `PolarGrid`, `PolarAngleAxis`, `Radar`, `Tooltip`

### Common Issues & Solutions

**Issue 1: SelectItem Error**
- Error: "A <Select.Item /> must have a value prop that is not an empty string"
- Solution: Use `value="all"` instead of `value=""`

**Issue 2: Wrong Percentage Display**
- Problem: 0.3 displayed as 0.3% instead of 30%
- Solution: Multiply by 100 before display

**Issue 3: React Key Warning**
- Problem: Fragment in map without key
- Solution: Use `<Fragment key={uniqueId}>` instead of `<>`

**Issue 4: Maestro Mappings 500 Error**
- Problem: Old system tried to fetch non-existent endpoint
- Solution: Use names directly, removed ID conversion logic

**Issue 5: NaN in JSON Response**
- Problem: PostgreSQL returns NaN when insufficient data for calculations
- Solution: Backend uses `math.isnan()` to detect and convert to 0.0
- Affected: Both `get_dashboard_results()` and `get_radar_chart_data()`

**Issue 6: Radar Labels Cut Off**
- Problem: Long palanca names truncated at edges
- Solution: Custom `CustomTick` component with intelligent line splitting
- Logic: Names ≤2 words → one line, >2 words → two lines

### Future Improvements

- [ ] Add control group data to timeline (currently null)
- [ ] Implement caching for filter options (15-min TTL)
- [ ] Add loading skeletons for better UX
- [ ] Export table data to Excel/CSV
- [ ] Add drill-down capability in table rows
- [ ] Consider adding zoom/fullscreen for radar charts
- [ ] Add export functionality for radar chart data
