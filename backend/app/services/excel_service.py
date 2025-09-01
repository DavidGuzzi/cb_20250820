"""
Excel Service for reading sell_in, sell_out and maestro files
"""
import pandas as pd
import os
from typing import Dict, List, Optional

class ExcelService:
    def __init__(self):
        self.data_path = os.path.join(os.path.dirname(__file__), '../../data')
        self._sell_in_df = None
        self._sell_out_df = None
        self._maestro_tipologia_df = None
        self._maestro_palanca_df = None
        self._maestro_kpi_df = None
    
    @property
    def sell_in_df(self):
        """Load sell_in data lazily"""
        if self._sell_in_df is None:
            file_path = os.path.join(self.data_path, 'sell_in.xlsx')
            self._sell_in_df = pd.read_excel(file_path)
        return self._sell_in_df
    
    @property
    def sell_out_df(self):
        """Load sell_out data lazily"""
        if self._sell_out_df is None:
            file_path = os.path.join(self.data_path, 'sell_out.xlsx')
            self._sell_out_df = pd.read_excel(file_path)
        return self._sell_out_df
    
    @property
    def maestro_tipologia_df(self):
        """Load maestro tipologia data lazily"""
        if self._maestro_tipologia_df is None:
            file_path = os.path.join(self.data_path, 'maestro_tipologia.xlsx')
            self._maestro_tipologia_df = pd.read_excel(file_path)
        return self._maestro_tipologia_df
    
    @property
    def maestro_palanca_df(self):
        """Load maestro palanca data lazily"""
        if self._maestro_palanca_df is None:
            file_path = os.path.join(self.data_path, 'maestro_palanca.xlsx')
            self._maestro_palanca_df = pd.read_excel(file_path)
        return self._maestro_palanca_df
    
    @property
    def maestro_kpi_df(self):
        """Load maestro kpi data lazily"""
        if self._maestro_kpi_df is None:
            file_path = os.path.join(self.data_path, 'maestro_kpi.xlsx')
            self._maestro_kpi_df = pd.read_excel(file_path)
        return self._maestro_kpi_df
    
    @property
    def evolution_df(self):
        """Load evolution data lazily"""
        if not hasattr(self, '_evolution_df') or self._evolution_df is None:
            file_path = os.path.join(self.data_path, 'sell_in_evolución.xlsx')
            self._evolution_df = pd.read_excel(file_path)
        return self._evolution_df
    
    def get_filter_options(self) -> Dict[str, List[str]]:
        """Get filter options from maestro files"""
        try:
            # Get tipologia options from name column
            tipologia_options = self.maestro_tipologia_df['tipologia_name'].dropna().tolist()
            
            # Get palanca options from name column
            palanca_options = self.maestro_palanca_df['palanca_name'].dropna().tolist()
            
            # Get kpi options from name column
            kpi_options = self.maestro_kpi_df['kpi_name'].dropna().tolist()
            
            return {
                'tipologia': tipologia_options,
                'palanca': palanca_options, 
                'kpi': kpi_options
            }
        except Exception as e:
            # Fallback to default options if files can't be read
            return {
                'tipologia': ['Super e Hiper', 'Conveniencia', 'Tradicional'],
                'palanca': ['Palanca A', 'Palanca B', 'Palanca C'],
                'kpi': ['Cajas Estandarizadas', 'Ventas']
            }
    
    def get_results_data(self, tipologia: Optional[str] = None) -> Dict:
        """Get dashboard results data filtered by tipologia"""
        try:
            # Create lookup dictionaries for IDs to names
            tipologia_lookup = dict(zip(self.maestro_tipologia_df['tipologia_id'], self.maestro_tipologia_df['tipologia_name']))
            palanca_lookup = dict(zip(self.maestro_palanca_df['palanca_id'], self.maestro_palanca_df['palanca_name']))
            kpi_lookup = dict(zip(self.maestro_kpi_df['kpi_id'], self.maestro_kpi_df['kpi_name']))
            
            # Find tipologia_id if tipologia name is provided
            tipologia_id = None
            if tipologia:
                for tid, tname in tipologia_lookup.items():
                    if tname == tipologia:
                        tipologia_id = tid
                        break
            
            results_data = []
            
            # Process sell_in data (uses IDs)
            sell_in_filtered = self.sell_in_df.copy()
            if tipologia_id is not None:
                sell_in_filtered = sell_in_filtered[sell_in_filtered['tipologia_id'] == tipologia_id]
            
            for _, row in sell_in_filtered.iterrows():
                kpi_name = kpi_lookup.get(row.get('kpi_id'), f"KPI_{row.get('kpi_id')}")
                palanca_name = palanca_lookup.get(row.get('palanca_id'), f"Palanca_{row.get('palanca_id')}")
                
                results_data.append({
                    'source': 'sell_in',
                    'kpi': kpi_name,
                    'palanca': palanca_name,
                    'variacion_promedio': float(row.get('variacion_promedio', 0)) * 100,  # Convert to percentage
                    'diferencia_vs_control': float(row.get('diferencia_vs_control', 0)) * 100  # Convert to percentage
                })
            
            # Process sell_out data (uses names or IDs depending on structure)
            sell_out_filtered = self.sell_out_df.copy()
            if tipologia:
                # sell_out has mixed structure, let's check what columns it has
                if 'tipología' in sell_out_filtered.columns:
                    # If it uses tipologia_id, convert name to id first
                    if sell_out_filtered['tipología'].dtype == 'int64':
                        if tipologia_id is not None:
                            sell_out_filtered = sell_out_filtered[sell_out_filtered['tipología'] == tipologia_id]
                    else:
                        # If it uses name directly
                        sell_out_filtered = sell_out_filtered[sell_out_filtered['tipología'] == tipologia]
            
            for _, row in sell_out_filtered.iterrows():
                # sell_out might use direct names or IDs
                kpi_col = row.get('kpi')
                if isinstance(kpi_col, (int, float)):
                    kpi_name = kpi_lookup.get(int(kpi_col), f"KPI_{kpi_col}")
                else:
                    kpi_name = str(kpi_col)
                
                palanca_col = row.get('palanca')
                if isinstance(palanca_col, (int, float)):
                    palanca_name = palanca_lookup.get(int(palanca_col), f"Palanca_{palanca_col}")
                else:
                    palanca_name = str(palanca_col)
                
                results_data.append({
                    'source': 'sell_out',
                    'kpi': kpi_name,
                    'palanca': palanca_name,
                    'variacion_promedio': float(row.get('variacion_promedio', 0)) * 100,  # Convert to percentage
                    'diferencia_vs_control': float(row.get('diferencia_vs_control', 0)) * 100  # Convert to percentage
                })
            
            # Get available palancas and kpis for table structure
            palancas = sorted(list(set([item['palanca'] for item in results_data])))
            kpis = sorted(list(set([item['kpi'] for item in results_data])))
            
            return {
                'success': True,
                'data': results_data,
                'palancas': palancas,
                'kpis': kpis,
                'filtered_by': tipologia
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error processing results data: {str(e)}',
                'data': [],
                'palancas': [],
                'kpis': []
            }
    
    def get_evolution_data(self, palanca_id: int = 5, kpi_id: int = 1, tipologia: Optional[str] = None) -> Dict:
        """Get evolution data for timeline chart with control comparison"""
        try:
            # Find tipologia_id if tipologia name is provided
            tipologia_id = None
            if tipologia:
                tipologia_lookup = dict(zip(self.maestro_tipologia_df['tipologia_name'], self.maestro_tipologia_df['tipologia_id']))
                tipologia_id = tipologia_lookup.get(tipologia)
            
            # Filter evolution data
            evolution_filtered = self.evolution_df.copy()
            
            # Apply tipologia filter if provided
            if tipologia_id is not None:
                evolution_filtered = evolution_filtered[evolution_filtered['tipologia_id'] == tipologia_id]
            
            # Get test palanca data 
            test_data = evolution_filtered[
                (evolution_filtered['palanca_id'] == palanca_id) &
                (evolution_filtered['kpi'] == kpi_id)
            ].copy()
            
            # Group test data by periodo and calculate mean (average across clients)
            test_grouped = test_data.groupby(['periodo', 'semana_fecha_inicio'])['valor'].mean().reset_index()
            test_grouped.columns = ['periodo', 'semana_fecha_inicio', 'test_value']
            
            # Get control data (palanca_id = 0) 
            control_data = evolution_filtered[
                (evolution_filtered['palanca_id'] == 0) &
                (evolution_filtered['kpi'] == kpi_id)
            ].copy()
            
            # Group control data by periodo and calculate mean (average across clients)
            control_grouped = control_data.groupby(['periodo', 'semana_fecha_inicio'])['valor'].mean().reset_index()
            control_grouped.columns = ['periodo', 'semana_fecha_inicio', 'control_value']
            
            # Merge test and control data on both periodo and semana_fecha_inicio
            merged_data = pd.merge(
                test_grouped, 
                control_grouped, 
                on=['periodo', 'semana_fecha_inicio'], 
                how='inner'
            )
            
            # Sort by periodo chronologically
            merged_data = merged_data.sort_values('periodo')
            
            # Convert to "Período X" format
            timeline_data = []
            for i, (_, row) in enumerate(merged_data.iterrows(), 1):
                test_val = float(row['test_value']) if pd.notna(row['test_value']) else None
                control_val = float(row['control_value']) if pd.notna(row['control_value']) else None
                difference = float(test_val - control_val) if (test_val is not None and control_val is not None) else None
                
                timeline_data.append({
                    'period': f'Período {i}',
                    'test_value': test_val,
                    'control_value': control_val,
                    'difference': difference,
                    'periodo_original': int(row['periodo'])
                })
            
            # Get palanca and KPI names for labels
            palanca_lookup = dict(zip(self.maestro_palanca_df['palanca_id'], self.maestro_palanca_df['palanca_name']))
            kpi_lookup = dict(zip(self.maestro_kpi_df['kpi_id'], self.maestro_kpi_df['kpi_name']))
            
            palanca_name = palanca_lookup.get(palanca_id, f"Palanca {palanca_id}")
            kpi_name = kpi_lookup.get(kpi_id, f"KPI {kpi_id}")
            
            # Get available options for controls
            available_palancas = sorted(evolution_filtered[evolution_filtered['palanca_id'] != 0]['palanca_id'].unique().tolist())
            available_kpis = sorted(evolution_filtered['kpi'].unique().tolist())
            
            return {
                'success': True,
                'data': timeline_data,
                'palanca_name': palanca_name,
                'kpi_name': kpi_name,
                'palanca_id': palanca_id,
                'kpi_id': kpi_id,
                'available_palancas': available_palancas,
                'available_kpis': available_kpis,
                'filtered_by': tipologia
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error processing evolution data: {str(e)}',
                'data': [],
                'palanca_name': '',
                'kpi_name': '',
                'available_palancas': [],
                'available_kpis': []
            }

    def get_data_summary(self) -> Dict:
        """Get summary information about available data"""
        try:
            return {
                'sell_in_rows': len(self.sell_in_df),
                'sell_out_rows': len(self.sell_out_df),
                'sell_in_columns': list(self.sell_in_df.columns),
                'sell_out_columns': list(self.sell_out_df.columns),
                'tipologia_options': len(self.maestro_tipologia_df),
                'palanca_options': len(self.maestro_palanca_df),
                'kpi_options': len(self.maestro_kpi_df)
            }
        except Exception as e:
            return {
                'error': f'Error getting data summary: {str(e)}'
            }

# Global instance
excel_service = ExcelService()