# Dashboard Implementation Notes

## Current Implementation (Updated: October 2025)

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

### Future Improvements

- [ ] Add control group data to timeline (currently null)
- [ ] Implement caching for filter options (15-min TTL)
- [ ] Add loading skeletons for better UX
- [ ] Export table data to Excel/CSV
- [ ] Add drill-down capability in table rows
