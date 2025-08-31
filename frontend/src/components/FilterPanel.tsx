import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { X, Filter } from 'lucide-react';

interface FilterPanelProps {
  filters: {
    tipologia: string;
    palanca: string;
    kpi: string;
    periodo: string;
  };
  onFiltersChange: (filters: any) => void;
}

const filterOptions = {
  tipologia: ['Packaging', 'Precio', 'Promoción', 'Distribución'],
  palanca: ['Descuento', 'Bundle', 'Display', 'Sampling', '2x1'],
  kpi: ['Sell Out', 'Sell In', 'SOM', 'Penetración', 'Frecuencia'],
  periodo: ['Última semana', 'Último mes', 'Último trimestre', 'Último año']
};

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      tipologia: '',
      palanca: '',
      kpi: '',
      periodo: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

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
          <Select value={filters.tipologia} onValueChange={(value) => updateFilter('tipologia', value)}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder="Seleccionar tipología" />
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
          <Select value={filters.palanca} onValueChange={(value) => updateFilter('palanca', value)}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder="Seleccionar palanca" />
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
          <Select value={filters.kpi} onValueChange={(value) => updateFilter('kpi', value)}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder="Seleccionar KPI" />
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

        <div>
          <Label htmlFor="periodo" className="text-xs text-muted-foreground mb-1 block">Período</Label>
          <Select value={filters.periodo} onValueChange={(value) => updateFilter('periodo', value)}>
            <SelectTrigger className="h-8 bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.periodo.map((option) => (
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