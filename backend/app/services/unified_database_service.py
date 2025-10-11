"""
Unified Database Service with PostgreSQL + SQLAlchemy
Replaces: data_store.py, sql_engine.py, excel_service.py
Provides unified access for both Dashboard and Chatbot
"""

import os
import logging
from typing import Dict, List, Any, Optional
from contextlib import contextmanager
from sqlalchemy import create_engine, text, MetaData
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
import pandas as pd

logger = logging.getLogger('chatbot_app.database')


class UnifiedDatabaseService:
    """Servicio unificado para acceso a datos - PostgreSQL + SQLAlchemy"""

    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or os.getenv(
            'DATABASE_URL',
            'postgresql://gatorade_user:gatorade_dev_password@localhost:5432/gatorade_ab_testing'
        )

        # Create engine with connection pooling
        self.engine = create_engine(
            self.database_url,
            pool_pre_ping=True,  # Verify connections before using
            pool_size=10,
            max_overflow=20,
            echo=False  # Set True for SQL debugging
        )

        # Create session factory
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )

        # Metadata for schema introspection
        self.metadata = MetaData()

        logger.info(f"✅ UnifiedDatabaseService initialized with PostgreSQL")

    @contextmanager
    def get_session(self) -> Session:
        """Context manager for database sessions"""
        session = self.SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Session error: {e}")
            raise
        finally:
            session.close()

    # ========================================================================
    # DASHBOARD METHODS
    # ========================================================================

    def get_dashboard_results(
        self,
        tipologia: Optional[str] = None,
        fuente: Optional[str] = None,
        unidad: Optional[str] = None,
        categoria: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos para la tabla del dashboard
        Compatible con endpoint: /api/dashboard/results
        """
        try:
            with self.get_session() as session:
                # Use the view for simplified queries with multiple filters
                query = text("""
                    SELECT
                        source_name,
                        typology_name,
                        lever_name,
                        category_name,
                        unit_name,
                        average_variation,
                        difference_vs_control
                    FROM v_dashboard_summary
                    WHERE (:tipologia IS NULL OR typology_name = :tipologia)
                      AND (:fuente IS NULL OR source_name = :fuente)
                      AND (:unidad IS NULL OR unit_name = :unidad)
                      AND (:categoria IS NULL OR category_name = :categoria)
                      AND lever_name != 'Control'
                    ORDER BY source_name, category_name, unit_name, lever_name
                """)

                result = session.execute(query, {
                    'tipologia': tipologia,
                    'fuente': fuente,
                    'unidad': unidad,
                    'categoria': categoria
                })
                rows = result.fetchall()

                # Convert to dict format expected by frontend
                data = []
                for row in rows:
                    data.append({
                        'source': row.source_name,
                        'category': row.category_name,
                        'unit': row.unit_name,
                        'palanca': row.lever_name,
                        'variacion_promedio': float(row.average_variation) if row.average_variation else 0,
                        'diferencia_vs_control': float(row.difference_vs_control) if row.difference_vs_control else 0
                    })

                # Extract unique palancas, sources, categories, and units
                palancas = sorted(list(set(item['palanca'] for item in data)))
                sources = sorted(list(set(item['source'] for item in data)))
                categories = sorted(list(set(item['category'] for item in data)))
                units = sorted(list(set(item['unit'] for item in data)))

                return {
                    'success': True,
                    'data': data,
                    'palancas': palancas,
                    'sources': sources,
                    'categories': categories,
                    'units': units,
                    'filtered_by': {
                        'tipologia': tipologia,
                        'fuente': fuente,
                        'unidad': unidad,
                        'categoria': categoria
                    }
                }

        except Exception as e:
            logger.error(f"Error in get_dashboard_results: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': [],
                'palancas': [],
                'sources': [],
                'categories': [],
                'units': []
            }

    def get_evolution_data(
        self,
        palanca: str,
        kpi: str,
        tipologia: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos para el timeline chart
        Compatible con endpoint: /api/dashboard/evolution-data
        Now accepts names directly instead of IDs
        """
        try:
            with self.get_session() as session:
                # Get evolution data from view using names directly
                query = text("""
                    SELECT
                        period_label,
                        start_date,
                        avg_value
                    FROM v_evolution_timeline
                    WHERE lever_name = :lever
                      AND category_name = :kpi
                      AND (:tipologia IS NULL OR typology_name = :tipologia)
                    ORDER BY start_date
                """)

                result = session.execute(query, {
                    'lever': palanca,
                    'kpi': kpi,
                    'tipologia': tipologia
                })
                rows = result.fetchall()

                # Format for frontend timeline chart
                timeline_data = []
                for i, row in enumerate(rows, 1):
                    timeline_data.append({
                        'period': f'Período {i}',
                        'test_value': float(row.avg_value) if row.avg_value else None,
                        'control_value': None,  # TODO: Add control group logic
                        'difference': None,
                        'periodo_original': row.period_label
                    })

                return {
                    'success': True,
                    'data': timeline_data,
                    'palanca_name': palanca,
                    'kpi_name': kpi,
                    'filtered_by': tipologia
                }

        except Exception as e:
            logger.error(f"Error in get_evolution_data: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }

    def get_filter_options(self) -> Dict[str, List[str]]:
        """
        Get filter options for dashboard
        Compatible with: /api/dashboard/filter-options
        """
        try:
            with self.get_session() as session:
                # Get typologies
                tipologia_query = text("SELECT typology_name FROM typology_master ORDER BY typology_name")
                tipologias = [row.typology_name for row in session.execute(tipologia_query)]

                # Get levers (exclude "Control")
                palanca_query = text("SELECT lever_name FROM lever_master WHERE lever_name != 'Control' ORDER BY lever_name")
                palancas = [row.lever_name for row in session.execute(palanca_query)]

                # Get categories (KPIs)
                kpi_query = text("SELECT category_name FROM category_master ORDER BY category_name")
                kpis = [row.category_name for row in session.execute(kpi_query)]

                # Get data sources
                fuente_query = text("SELECT source_name FROM data_source_master ORDER BY source_name")
                fuentes = [row.source_name for row in session.execute(fuente_query)]

                # Get measurement units
                unidad_query = text("SELECT unit_name FROM measurement_unit_master ORDER BY unit_name")
                unidades = [row.unit_name for row in session.execute(unidad_query)]

                # Get categories (same as kpi for now)
                categoria_query = text("SELECT category_name FROM category_master ORDER BY category_name")
                categorias = [row.category_name for row in session.execute(categoria_query)]

                return {
                    'tipologia': tipologias,
                    'palanca': palancas,
                    'kpi': kpis,
                    'fuente_datos': fuentes,
                    'unidad_medida': unidades,
                    'categoria': categorias
                }

        except Exception as e:
            logger.error(f"Error in get_filter_options: {e}")
            return {
                'tipologia': [],
                'palanca': [],
                'kpi': [],
                'fuente_datos': [],
                'unidad_medida': [],
                'categoria': []
            }

    # ========================================================================
    # CHATBOT METHODS (Text-to-SQL)
    # ========================================================================

    def execute_query(self, sql_query: str) -> Dict[str, Any]:
        """
        Ejecuta consulta SQL para el chatbot (text-to-SQL)
        Compatible con sql_engine.py execute_query()
        """
        try:
            with self.get_session() as session:
                # Use pandas for easy DataFrame conversion
                df = pd.read_sql_query(sql_query, session.bind)

                return {
                    'success': True,
                    'data': df.to_dict('records'),
                    'columns': df.columns.tolist(),
                    'row_count': len(df)
                }

        except Exception as e:
            logger.error(f"SQL execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': sql_query,
                'data': [],
                'columns': [],
                'row_count': 0
            }

    def get_schema_info(self) -> str:
        """
        Información del schema para el LLM (compatible con sql_engine.py)
        Provee el schema completo para text-to-SQL del chatbot
        """
        return """
ESQUEMA DE BASE DE DATOS POSTGRESQL DISPONIBLE:

=== TABLAS MAESTRAS ===

TABLA: city_master
- city_id (INTEGER): ID único de ciudad
- city_name (VARCHAR): Nombre de la ciudad

TABLA: typology_master
- typology_id (INTEGER): ID único de tipología
- typology_name (VARCHAR): Tipo de tienda (ej: "Super & Hyper", "Convenience", "Pharmacies")

TABLA: lever_master
- lever_id (INTEGER): ID único de palanca
- lever_name (VARCHAR): Nombre de la palanca (ej: "Square meters", "Checkout cooler")

TABLA: category_master
- category_id (INTEGER): ID único de categoría
- category_name (VARCHAR): Categoría de producto (ej: "Gatorade", "500ml", "1000ml")

TABLA: measurement_unit_master
- unit_id (INTEGER): ID único de unidad
- unit_name (VARCHAR): Unidad de medida (ej: "Standardized Cases", "Sales")

TABLA: data_source_master
- source_id (INTEGER): ID único de fuente
- source_name (VARCHAR): Fuente de datos (ej: "Sell In", "Sell Out")

TABLA: period_master
- period_id (INTEGER): ID único de período
- period_label (VARCHAR): Etiqueta del período (ej: "202501", "2025-W14")
- period_type (VARCHAR): Tipo (ej: "Week", "Month")
- start_date (DATE): Fecha inicio
- end_date (DATE): Fecha fin

TABLA: store_master
- id (INTEGER): ID único de tienda
- store_code_sellin (VARCHAR): Código PDV Sell In
- store_code_sellout (VARCHAR): Código PDV Sell Out
- store_name (VARCHAR): Nombre de la tienda
- city_id (INTEGER): FK a city_master
- typology_id (INTEGER): FK a typology_master
- lever_id (INTEGER): FK a lever_master (palanca asignada)
- is_active (BOOLEAN): Tienda activa

=== TABLAS DE HECHOS ===

TABLA: ab_test_result
- id (INTEGER): ID único
- store_id (INTEGER): FK a store_master
- category_id (INTEGER): FK a category_master
- unit_id (INTEGER): FK a measurement_unit_master
- source_id (INTEGER): FK a data_source_master
- period_id (INTEGER): FK a period_master
- value (DECIMAL): Valor medido

TABLA: ab_test_summary
- id (INTEGER): ID único
- typology_id (INTEGER): FK a typology_master
- lever_id (INTEGER): FK a lever_master
- category_id (INTEGER): FK a category_master
- unit_id (INTEGER): FK a measurement_unit_master
- source_id (INTEGER): FK a data_source_master
- average_variation (DECIMAL): Variación promedio
- difference_vs_control (DECIMAL): Diferencia vs control

=== VISTAS (Recomendadas para consultas) ===

VISTA: v_chatbot_complete
- Todos los campos de ab_test_result con JOINs resueltos
- Incluye: store_name, city_name, typology_name, lever_name, category_name, etc.
- Uso: SELECT * FROM v_chatbot_complete WHERE ...

VISTA: v_dashboard_summary
- Resúmenes agregados con nombres legibles
- Incluye: typology_name, lever_name, category_name, average_variation, difference_vs_control

VISTA: v_evolution_timeline
- Evolución temporal agregada por período
- Incluye: period_label, start_date, typology_name, lever_name, avg_value

=== SINÓNIMOS RECONOCIDOS ===
- palanca = lever
- tipología = typology
- categoría = category
- período = period
- tienda = store = PDV
- variación = variation
- diferencia = difference

=== EJEMPLOS DE CONSULTAS ===

1. Resultados por tienda:
   SELECT store_name, category_name, value
   FROM v_chatbot_complete
   WHERE typology_name = 'Super & Hyper'

2. Promedio por palanca:
   SELECT lever_name, AVG(value) as promedio
   FROM v_chatbot_complete
   GROUP BY lever_name

3. Evolución temporal:
   SELECT period_label, lever_name, avg_value
   FROM v_evolution_timeline
   WHERE typology_name = 'Convenience'
   ORDER BY start_date
"""

    # ========================================================================
    # UTILITY METHODS
    # ========================================================================

    def get_data_summary(self) -> Dict[str, Any]:
        """Get summary of available data"""
        try:
            with self.get_session() as session:
                summary = {}

                # Count rows in each table
                tables = [
                    'city_master', 'typology_master', 'lever_master',
                    'category_master', 'store_master', 'ab_test_result', 'ab_test_summary'
                ]

                for table in tables:
                    result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    summary[f'{table}_count'] = result.fetchone()[0]

                return {
                    'success': True,
                    'summary': summary
                }

        except Exception as e:
            logger.error(f"Error in get_data_summary: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def health_check(self) -> bool:
        """Check database connection health"""
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Global instance
unified_db = UnifiedDatabaseService()
