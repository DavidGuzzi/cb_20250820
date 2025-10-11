import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { X, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface FilterPanelProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    fuente: string;
    unidad: string;
    categoria: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState({
    tipologia: ['Super e hiper'],
    palanca: [],
    kpi: [],
    fuente_datos: [],
    unidad_medida: [],
    categoria: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDashboardFilterOptions();
        if (response.success) {
          setFilterOptions(response.options);

          // Set defaults for all filters if not already set
          const newFilters = { ...filters };
          let hasChanges = false;

          // Set default tipologia if not already set
          if (!newFilters.tipologia && response.options.tipologia?.length > 0) {
            newFilters.tipologia = response.options.tipologia.find((t: string) => t === 'Super e hiper') || response.options.tipologia[0];
            hasChanges = true;
          }

          // Set default palanca if not already set (solo para timeline)
          if (!newFilters.palanca && response.options.palanca?.length > 0) {
            newFilters.palanca = response.options.palanca.find((p: string) => p === 'Punta de góndola') || response.options.palanca[0];
            hasChanges = true;
          }

          if (hasChanges) {
            onFiltersChange(newFilters);
          }
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
        // Fallback to default options
        setFilterOptions({
          tipologia: ['Super e hiper', 'Conveniencia', 'Droguerías'],
          palanca: [],
          kpi: [],
          fuente_datos: [],
          unidad_medida: [],
          categoria: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadFilterOptions();
  }, []);
  
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    // Reset to default values
    const defaultPalanca = filterOptions.palanca.find((p: string) => p === 'Punta de góndola') || filterOptions.palanca[0] || '';

    onFiltersChange({
      tipologia: 'Super e hiper',
      palanca: defaultPalanca,
      kpi: '',
      fuente: 'all',
      unidad: 'all',
      categoria: 'all'
    });
  };

  // Check if filters are different from their default values
  const defaultPalanca = filterOptions.palanca.find((p: string) => p === 'Punta de góndola') || filterOptions.palanca[0] || '';

  const hasActiveFilters = filters.tipologia !== 'Super e hiper' ||
                          filters.palanca !== defaultPalanca ||
                          filters.kpi !== '' ||
                          filters.fuente !== 'all' ||
                          filters.unidad !== 'all' ||
                          filters.categoria !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm text-foreground">Filtros</Label>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-6 px-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <X className="h-3 w-3 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="tipologia" className="text-xs text-muted-foreground mb-1 block">Tipología</Label>
          <Select value={filters.tipologia} onValueChange={(value) => updateFilter('tipologia', value)} disabled={loading}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar tipología"} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.tipologia.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fuente" className="text-xs text-muted-foreground mb-1 block">Fuente de Datos</Label>
          <Select value={filters.fuente} onValueChange={(value) => updateFilter('fuente', value)} disabled={loading}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Todas las fuentes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filterOptions.fuente_datos.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unidad" className="text-xs text-muted-foreground mb-1 block">Unidad de Medida</Label>
          <Select value={filters.unidad} onValueChange={(value) => updateFilter('unidad', value)} disabled={loading}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Todas las unidades"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filterOptions.unidad_medida.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="categoria" className="text-xs text-muted-foreground mb-1 block">Categoría</Label>
          <Select value={filters.categoria} onValueChange={(value) => updateFilter('categoria', value)} disabled={loading}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Todas las categorías"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {filterOptions.categoria.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2 border-t border-border">
          <Label className="text-xs text-muted-foreground mb-2 block">Filtros para Timeline</Label>

          <div className="space-y-2">
            <div>
              <Label htmlFor="palanca" className="text-xs text-muted-foreground mb-1 block">Palanca</Label>
              <Select value={filters.palanca} onValueChange={(value) => updateFilter('palanca', value)} disabled={loading}>
                <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
                  <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar palanca"} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.palanca.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="kpi" className="text-xs text-muted-foreground mb-1 block">KPI</Label>
              <Select value={filters.kpi} onValueChange={(value) => updateFilter('kpi', value)} disabled={loading}>
                <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
                  <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar KPI"} />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.kpi.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}