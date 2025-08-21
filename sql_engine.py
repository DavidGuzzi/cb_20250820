"""
Motor SQL para análisis text-to-SQL
"""

import sqlite3
import pandas as pd
from data_store import DataStore

class SQLEngine:
    def __init__(self):
        self.data_store = DataStore()
        self.conn = sqlite3.connect(':memory:')
        self._setup_database()
        
    def _setup_database(self):
        """Configura la base de datos en memoria con los datos"""
        
        # Crear tabla de PDVs
        pdv_data = []
        for code, info in self.data_store.pdv_master.items():
            pdv_data.append({
                'pdv_codigo': code,
                'nombre': info['nombre'],
                'ciudad': info['ciudad'],
                'region': info['region'],
                'tipo': info['tipo']
            })
        
        pdv_df = pd.DataFrame(pdv_data)
        pdv_df.to_sql('pdvs', self.conn, index=False, if_exists='replace')
        
        # Crear tabla de revenue/ventas
        revenue_df = self.data_store.revenue_df.copy()
        revenue_df.columns = ['pdv_codigo', 'mes', 'revenue', 'visitantes', 'conversiones']
        
        # Agregar columnas calculadas útiles
        revenue_df['tasa_conversion'] = (revenue_df['conversiones'] / revenue_df['visitantes']) * 100
        revenue_df['revenue_por_visitante'] = revenue_df['revenue'] / revenue_df['visitantes']
        revenue_df['ingreso'] = revenue_df['revenue']  # Alias para revenue
        
        revenue_df.to_sql('ventas', self.conn, index=False, if_exists='replace')
        
        # Crear vista combinada
        self.conn.execute("""
            CREATE VIEW vista_completa AS
            SELECT 
                v.*,
                p.nombre as pdv_nombre,
                p.ciudad,
                p.region,
                p.tipo as pdv_tipo
            FROM ventas v
            JOIN pdvs p ON v.pdv_codigo = p.pdv_codigo
        """)
    
    def get_schema_info(self):
        """Proporciona información del esquema para el LLM"""
        schema_info = """
ESQUEMA DE BASE DE DATOS DISPONIBLE:

TABLA: pdvs
- pdv_codigo (TEXT): Código único del PDV (ej: PDV001, PDV002...)
- nombre (TEXT): Nombre del punto de venta (ej: "Sucursal Centro", "Local Palermo")
- ciudad (TEXT): Ciudad donde está ubicado (ej: "Buenos Aires", "Córdoba")
- region (TEXT): Región geográfica (Norte, Centro, Sur)
- tipo (TEXT): Tipo de tienda (Flagship, Standard, Express)

TABLA: ventas
- pdv_codigo (TEXT): Código del PDV (FK a pdvs.pdv_codigo)
- mes (TEXT): Mes en formato YYYY-MM (ej: "2025-01", "2024-12")
- revenue (REAL): Ingresos/revenue en pesos
- visitantes (INTEGER): Número de visitantes
- conversiones (INTEGER): Número de conversiones/compras
- tasa_conversion (REAL): Tasa de conversión calculada (%)
- revenue_por_visitante (REAL): Revenue promedio por visitante
- ingreso (REAL): Alias de revenue

VISTA: vista_completa
- Combina ambas tablas con todos los campos disponibles

SINÓNIMOS RECONOCIDOS:
- revenue = ingreso = ingresos = facturación = ventas_monto
- conversiones = compras = transacciones = ventas_cantidad
- visitantes = visitas = tráfico = clientes
- tasa_conversion = conversion_rate = porcentaje_conversion

EJEMPLOS DE CONSULTAS SQL:
- SELECT MAX(revenue), pdv_codigo, mes FROM ventas WHERE revenue = (SELECT MAX(revenue) FROM ventas)
- SELECT region, SUM(revenue) as total_revenue FROM vista_completa GROUP BY region
- SELECT pdv_nombre, AVG(tasa_conversion) as promedio_conversion FROM vista_completa GROUP BY pdv_nombre ORDER BY promedio_conversion DESC
"""
        return schema_info
    
    def execute_query(self, sql_query):
        """Ejecuta una consulta SQL y devuelve los resultados"""
        try:
            df = pd.read_sql_query(sql_query, self.conn)
            return {
                'success': True,
                'data': df.to_dict('records'),
                'columns': df.columns.tolist(),
                'row_count': len(df)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'query': sql_query
            }
    
    def close(self):
        """Cierra la conexión"""
        self.conn.close()