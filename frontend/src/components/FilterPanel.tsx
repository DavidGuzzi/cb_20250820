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
    fuente_datos: [],
    unidad_medida: [],
    categoria: []
  });
  const [palancasByTipologia, setPalancasByTipologia] = useState<string[]>([]);
  const [fuentesByTipologia, setFuentesByTipologia] = useState<string[]>([]);
  const [categoriasByTipologia, setCategoriasByTipologia] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load general filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDashboardFilterOptions();
        if (response.success) {
          setFilterOptions(response.options);

          // Set default tipologia if not already set
          const newFilters = { ...filters };
          let hasChanges = false;

          if (!newFilters.tipologia && response.options.tipologia?.length > 0) {
            newFilters.tipologia = response.options.tipologia.find((t: string) => t === 'Super e hiper') || response.options.tipologia[0];
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

  // Load palancas, fuentes, and categorias filtered by tipologia whenever tipologia changes
  useEffect(() => {
    const loadFilteredOptions = async () => {
      if (!filters.tipologia) return;

      try {
        // Load palancas
        const palancasResponse = await apiService.getPalancasByTipologia(filters.tipologia);
        if (palancasResponse.success) {
          setPalancasByTipologia(palancasResponse.palancas || []);
        }

        // Load fuentes
        const fuentesResponse = await apiService.getFuentesByTipologia(filters.tipologia);
        if (fuentesResponse.success) {
          setFuentesByTipologia(fuentesResponse.fuentes || []);
        }

        // Load categorias
        const categoriasResponse = await apiService.getCategoriasByTipologia(filters.tipologia);
        if (categoriasResponse.success) {
          setCategoriasByTipologia(categoriasResponse.categorias || []);
        }
      } catch (error) {
        console.error('Error loading filtered options for tipologia:', error);
        setPalancasByTipologia([]);
        setFuentesByTipologia([]);
        setCategoriasByTipologia([]);
      }
    };

    loadFilteredOptions();
  }, [filters.tipologia]);
  
  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };

    // Si cambia la tipología, limpiar las selecciones dependientes
    if (key === 'tipologia') {
      newFilters.palanca = '';
      newFilters.fuente = 'all';
      newFilters.categoria = 'all';
    }

    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    // Reset to default values
    onFiltersChange({
      tipologia: 'Super e hiper',
      palanca: '',
      fuente: 'all',
      unidad: 'all',
      categoria: 'all'
    });
  };

  // Check if filters are different from their default values
  const hasActiveFilters = filters.tipologia !== 'Super e hiper' ||
                          filters.palanca !== '' ||
                          filters.fuente !== 'all' ||
                          filters.unidad !== 'all' ||
                          filters.categoria !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-base text-foreground font-bold">Filtros</Label>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-5 px-1.5 text-[10px] text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <X className="h-2.5 w-2.5 mr-0.5" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="space-y-2.5">
        <div>
          <Label htmlFor="tipologia" className="text-[10px] text-muted-foreground mb-0.5 block">Tipología</Label>
          <Select value={filters.tipologia} onValueChange={(value) => updateFilter('tipologia', value)} disabled={loading}>
            <SelectTrigger className="h-7 text-xs bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Seleccionar tipología"} />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.tipologia.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="fuente" className="text-[10px] text-muted-foreground mb-0.5 block">Fuente de Datos</Label>
          <Select value={filters.fuente} onValueChange={(value) => updateFilter('fuente', value)} disabled={loading || fuentesByTipologia.length === 0}>
            <SelectTrigger className="h-7 text-xs bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : fuentesByTipologia.length === 0 ? "Sin fuentes disponibles" : "Todas las fuentes"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {fuentesByTipologia.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="unidad" className="text-[10px] text-muted-foreground mb-0.5 block">Unidad de Medida</Label>
          <Select value={filters.unidad} onValueChange={(value) => updateFilter('unidad', value)} disabled={loading}>
            <SelectTrigger className="h-7 text-xs bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : "Todas las unidades"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {filterOptions.unidad_medida.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="categoria" className="text-[10px] text-muted-foreground mb-0.5 block">Categoría</Label>
          <Select value={filters.categoria} onValueChange={(value) => updateFilter('categoria', value)} disabled={loading || categoriasByTipologia.length === 0}>
            <SelectTrigger className="h-7 text-xs bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={loading ? "Cargando..." : categoriasByTipologia.length === 0 ? "Sin categorías disponibles" : "Todas las categorías"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {categoriasByTipologia.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="palanca" className="text-[10px] text-muted-foreground mb-0.5 block">Palanca</Label>
          <Select
            value={filters.palanca || ''}
            onValueChange={(value) => updateFilter('palanca', value)}
            disabled={loading || palancasByTipologia.length === 0}
          >
            <SelectTrigger className="h-7 text-xs bg-gray-100 dark:bg-gray-800">
              <SelectValue placeholder={
                loading ? "Cargando..." :
                palancasByTipologia.length === 0 ? "Sin palancas disponibles" :
                "Seleccionar palanca"
              } />
            </SelectTrigger>
            <SelectContent>
              {palancasByTipologia.map((option) => (
                <SelectItem key={option} value={option} className="text-xs">
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