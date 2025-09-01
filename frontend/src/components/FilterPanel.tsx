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
  };
  onFiltersChange: (filters: any) => void;
}

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [filterOptions, setFilterOptions] = useState({
    tipologia: ['Super e Hiper'],
    palanca: [],
    kpi: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDashboardFilterOptions();
        if (response.success) {
          setFilterOptions(response.options);
          // Set default tipologia if not already set
          if (!filters.tipologia && response.options.tipologia?.length > 0) {
            const defaultTipologia = response.options.tipologia.find((t: string) => t === 'Super e Hiper') || response.options.tipologia[0];
            onFiltersChange({ ...filters, tipologia: defaultTipologia });
          }
        }
      } catch (error) {
        console.error('Error loading filter options:', error);
        // Fallback to default options
        setFilterOptions({
          tipologia: ['Super e Hiper', 'Conveniencia', 'Tradicional'],
          palanca: ['Palanca A', 'Palanca B', 'Palanca C'],
          kpi: ['Sell Out', 'Sell In', 'SOM', 'Penetración', 'Frecuencia']
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
    onFiltersChange({
      tipologia: 'Super e Hiper', // Keep default tipologia
      palanca: '',
      kpi: ''
    });
  };

  const hasActiveFilters = filters.palanca !== '' || filters.kpi !== '' || (filters.tipologia !== '' && filters.tipologia !== 'Super e Hiper');

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
  );
}