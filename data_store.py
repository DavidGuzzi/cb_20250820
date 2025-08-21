"""
Base de datos simulada con información de PDVs y revenue
"""

import pandas as pd

# Maestro de PDVs (Puntos de Venta)
PDV_MASTER = {
    'PDV001': {'nombre': 'Sucursal Centro', 'region': 'Norte', 'tipo': 'Flagship', 'ciudad': 'Buenos Aires'},
    'PDV002': {'nombre': 'Local Palermo', 'region': 'Norte', 'tipo': 'Standard', 'ciudad': 'Buenos Aires'},
    'PDV003': {'nombre': 'Mall Córdoba', 'region': 'Centro', 'tipo': 'Standard', 'ciudad': 'Córdoba'},
    'PDV004': {'nombre': 'Sucursal Rosario', 'region': 'Centro', 'tipo': 'Flagship', 'ciudad': 'Rosario'},
    'PDV005': {'nombre': 'Local Mendoza', 'region': 'Sur', 'tipo': 'Standard', 'ciudad': 'Mendoza'},
    'PDV006': {'nombre': 'Plaza Oeste', 'region': 'Norte', 'tipo': 'Express', 'ciudad': 'Buenos Aires'},
    'PDV007': {'nombre': 'Centro Tucumán', 'region': 'Norte', 'tipo': 'Standard', 'ciudad': 'Tucumán'},
    'PDV008': {'nombre': 'Mall Santa Fe', 'region': 'Centro', 'tipo': 'Standard', 'ciudad': 'Santa Fe'},
}

# Datos de revenue por PDV y mes
REVENUE_DATA = [
    # Enero 2025
    {'pdv': 'PDV001', 'mes': '2025-01', 'revenue': 850000, 'visitantes': 12500, 'conversiones': 1125},
    {'pdv': 'PDV002', 'mes': '2025-01', 'revenue': 420000, 'visitantes': 8200, 'conversiones': 656},
    {'pdv': 'PDV003', 'mes': '2025-01', 'revenue': 380000, 'visitantes': 7600, 'conversiones': 608},
    {'pdv': 'PDV004', 'mes': '2025-01', 'revenue': 720000, 'visitantes': 11200, 'conversiones': 896},
    {'pdv': 'PDV005', 'mes': '2025-01', 'revenue': 290000, 'visitantes': 5800, 'conversiones': 464},
    {'pdv': 'PDV006', 'mes': '2025-01', 'revenue': 180000, 'visitantes': 4500, 'conversiones': 315},
    {'pdv': 'PDV007', 'mes': '2025-01', 'revenue': 310000, 'visitantes': 6200, 'conversiones': 496},
    {'pdv': 'PDV008', 'mes': '2025-01', 'revenue': 340000, 'visitantes': 6800, 'conversiones': 544},
    
    # Diciembre 2024
    {'pdv': 'PDV001', 'mes': '2024-12', 'revenue': 920000, 'visitantes': 13200, 'conversiones': 1188},
    {'pdv': 'PDV002', 'mes': '2024-12', 'revenue': 470000, 'visitantes': 8800, 'conversiones': 704},
    {'pdv': 'PDV003', 'mes': '2024-12', 'revenue': 410000, 'visitantes': 8100, 'conversiones': 648},
    {'pdv': 'PDV004', 'mes': '2024-12', 'revenue': 780000, 'visitantes': 12000, 'conversiones': 960},
    {'pdv': 'PDV005', 'mes': '2024-12', 'revenue': 320000, 'visitantes': 6200, 'conversiones': 496},
    {'pdv': 'PDV006', 'mes': '2024-12', 'revenue': 200000, 'visitantes': 4800, 'conversiones': 336},
    {'pdv': 'PDV007', 'mes': '2024-12', 'revenue': 340000, 'visitantes': 6600, 'conversiones': 528},
    {'pdv': 'PDV008', 'mes': '2024-12', 'revenue': 370000, 'visitantes': 7200, 'conversiones': 576},
    
    # Noviembre 2024
    {'pdv': 'PDV001', 'mes': '2024-11', 'revenue': 780000, 'visitantes': 11800, 'conversiones': 1062},
    {'pdv': 'PDV002', 'mes': '2024-11', 'revenue': 390000, 'visitantes': 7800, 'conversiones': 624},
    {'pdv': 'PDV003', 'mes': '2024-11', 'revenue': 350000, 'visitantes': 7200, 'conversiones': 576},
    {'pdv': 'PDV004', 'mes': '2024-11', 'revenue': 680000, 'visitantes': 10600, 'conversiones': 848},
    {'pdv': 'PDV005', 'mes': '2024-11', 'revenue': 270000, 'visitantes': 5600, 'conversiones': 448},
    {'pdv': 'PDV006', 'mes': '2024-11', 'revenue': 160000, 'visitantes': 4200, 'conversiones': 294},
    {'pdv': 'PDV007', 'mes': '2024-11', 'revenue': 290000, 'visitantes': 5800, 'conversiones': 464},
    {'pdv': 'PDV008', 'mes': '2024-11', 'revenue': 320000, 'visitantes': 6400, 'conversiones': 512},
]

class DataStore:
    def __init__(self):
        self.pdv_master = PDV_MASTER
        self.revenue_df = pd.DataFrame(REVENUE_DATA)
        
    def get_pdv_info(self, pdv_code):
        """Obtiene información de un PDV específico"""
        return self.pdv_master.get(pdv_code, None)
    
    def get_revenue_data(self, pdv=None, mes=None):
        """Obtiene datos de revenue filtrados"""
        df = self.revenue_df.copy()
        
        if pdv:
            df = df[df['pdv'] == pdv]
        if mes:
            df = df[df['mes'] == mes]
            
        return df
    
    def get_summary_stats(self):
        """Obtiene estadísticas resumen"""
        total_revenue = self.revenue_df['revenue'].sum()
        total_visitantes = self.revenue_df['visitantes'].sum()
        total_conversiones = self.revenue_df['conversiones'].sum()
        
        conversion_rate = (total_conversiones / total_visitantes) * 100
        revenue_per_visitor = total_revenue / total_visitantes
        
        return {
            'total_revenue': total_revenue,
            'total_visitantes': total_visitantes,
            'total_conversiones': total_conversiones,
            'conversion_rate': conversion_rate,
            'revenue_per_visitor': revenue_per_visitor,
            'num_pdvs': len(self.pdv_master),
            'meses_disponibles': sorted(self.revenue_df['mes'].unique())
        }
    
    def get_raw_data_summary(self):
        """Proporciona resumen de datos para que el LLM pueda hacer consultas ad-hoc"""
        return {
            'pdv_master': self.pdv_master,
            'revenue_data': self.revenue_df.to_dict('records')
        }
    
    def format_data_for_llm(self):
        """Formatea los datos completos para que el LLM pueda hacer análisis ad-hoc"""
        stats = self.get_summary_stats()
        
        context = f"""
DATOS COMPLETOS DISPONIBLES PARA ANÁLISIS:

RESUMEN:
- {stats['num_pdvs']} PDVs activos
- Revenue Total: ${stats['total_revenue']:,.0f}
- Meses disponibles: {', '.join(stats['meses_disponibles'])}

MAESTRO DE PDVs:
"""
        for pdv_code, info in self.pdv_master.items():
            context += f"{pdv_code}: {info['nombre']} - {info['ciudad']}, {info['region']} ({info['tipo']})\n"
        
        context += "\nDATOS DE REVENUE POR PDV Y MES:\n"
        for record in self.revenue_df.to_dict('records'):
            pdv_info = self.pdv_master[record['pdv']]
            context += f"{record['pdv']} ({pdv_info['nombre']}) - {record['mes']}: ${record['revenue']:,} revenue, {record['visitantes']:,} visitantes, {record['conversiones']} conversiones\n"
        
        context += "\nPuedes hacer cualquier cálculo, comparación o análisis sobre estos datos. Calcula métricas como tasas de conversión, revenue por visitante, comparaciones entre PDVs, regiones, meses, etc."
        
        return context