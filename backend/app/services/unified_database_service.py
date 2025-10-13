"""
Unified Database Service with PostgreSQL + SQLAlchemy
Replaces: data_store.py, sql_engine.py, excel_service.py
Provides unified access for both Dashboard and Chatbot
"""

import os
import logging
import math
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
                    # Handle NaN/None values for average_variation
                    avg_var = row.average_variation
                    if avg_var is None:
                        avg_var_value = 0.0
                    else:
                        try:
                            avg_var_value = float(avg_var)
                            if math.isnan(avg_var_value):
                                avg_var_value = 0.0
                        except (ValueError, TypeError):
                            avg_var_value = 0.0

                    # Handle NaN/None values for difference_vs_control
                    diff_control = row.difference_vs_control
                    if diff_control is None:
                        diff_control_value = 0.0
                    else:
                        try:
                            diff_control_value = float(diff_control)
                            if math.isnan(diff_control_value):
                                diff_control_value = 0.0
                        except (ValueError, TypeError):
                            diff_control_value = 0.0

                    data.append({
                        'source': row.source_name,
                        'category': row.category_name,
                        'unit': row.unit_name,
                        'palanca': row.lever_name,
                        'variacion_promedio': avg_var_value,
                        'diferencia_vs_control': diff_control_value
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

    def get_evolution_timeline_data(
        self,
        tipologia: Optional[str] = None,
        fuente: Optional[str] = None,
        unidad: Optional[str] = None,
        categoria: Optional[str] = None,
        palanca: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos de evolución temporal desde ab_test_result
        con líneas separadas para palanca y control
        Compatible con endpoint: /api/dashboard/evolution-data

        Requiere 5 filtros obligatorios:
        - tipologia, fuente, unidad, categoria, palanca
        """
        try:
            # Check for missing filters
            missing_filters = []
            filter_labels = {
                'tipologia': 'Tipología',
                'fuente': 'Fuente de Datos',
                'unidad': 'Unidad de Medida',
                'categoria': 'Categoría',
                'palanca': 'Palanca'
            }

            if not tipologia:
                missing_filters.append(filter_labels['tipologia'])
            if not fuente:
                missing_filters.append(filter_labels['fuente'])
            if not unidad:
                missing_filters.append(filter_labels['unidad'])
            if not categoria:
                missing_filters.append(filter_labels['categoria'])
            if not palanca:
                missing_filters.append(filter_labels['palanca'])

            # Return early if filters are missing
            if missing_filters:
                return {
                    'success': False,
                    'message': 'Filtros faltantes para mostrar evolución',
                    'missing_filters': missing_filters,
                    'data': []
                }

            with self.get_session() as session:
                # Query 0: Calculate project start date (mode) based on data source
                # Determine which start_date column to use
                start_date_column = 'start_date_sellin' if fuente == 'Sell In' else 'start_date_sellout'

                project_start_query = text(f"""
                    SELECT {start_date_column} as start_date, COUNT(*) as count
                    FROM store_master s
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    WHERE t.typology_name = :tipologia
                      AND l.lever_name = :palanca
                      AND s.is_active = TRUE
                      AND {start_date_column} IS NOT NULL
                    GROUP BY {start_date_column}
                    ORDER BY count DESC, {start_date_column}
                    LIMIT 1
                """)

                project_start_result = session.execute(project_start_query, {
                    'tipologia': tipologia,
                    'palanca': palanca
                })
                project_start_row = project_start_result.fetchone()
                project_start_date = project_start_row.start_date if project_start_row else None

                # Query 1: Get palanca data (avg value per period for selected lever)
                palanca_query = text("""
                    SELECT
                        p.period_label,
                        p.start_date,
                        p.end_date,
                        AVG(r.value) as avg_value
                    FROM ab_test_result r
                    JOIN store_master s ON r.store_id = s.id
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    JOIN period_master p ON r.period_id = p.period_id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN data_source_master ds ON r.source_id = ds.source_id
                    JOIN measurement_unit_master u ON r.unit_id = u.unit_id
                    JOIN category_master c ON r.category_id = c.category_id
                    WHERE l.lever_name = :palanca
                      AND t.typology_name = :tipologia
                      AND ds.source_name = :fuente
                      AND u.unit_name = :unidad
                      AND c.category_name = :categoria
                      AND s.is_active = TRUE
                    GROUP BY p.period_label, p.start_date, p.end_date
                    ORDER BY p.start_date
                """)

                palanca_result = session.execute(palanca_query, {
                    'palanca': palanca,
                    'tipologia': tipologia,
                    'fuente': fuente,
                    'unidad': unidad,
                    'categoria': categoria
                })
                palanca_rows = palanca_result.fetchall()

                # Query 2: Get control data (avg value per period for control group in same typology)
                control_query = text("""
                    SELECT
                        p.period_label,
                        p.start_date,
                        p.end_date,
                        AVG(r.value) as avg_value
                    FROM ab_test_result r
                    JOIN store_master s ON r.store_id = s.id
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    JOIN period_master p ON r.period_id = p.period_id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN data_source_master ds ON r.source_id = ds.source_id
                    JOIN measurement_unit_master u ON r.unit_id = u.unit_id
                    JOIN category_master c ON r.category_id = c.category_id
                    WHERE l.lever_name = 'Control'
                      AND t.typology_name = :tipologia
                      AND ds.source_name = :fuente
                      AND u.unit_name = :unidad
                      AND c.category_name = :categoria
                      AND s.is_active = TRUE
                    GROUP BY p.period_label, p.start_date, p.end_date
                    ORDER BY p.start_date
                """)

                control_result = session.execute(control_query, {
                    'tipologia': tipologia,
                    'fuente': fuente,
                    'unidad': unidad,
                    'categoria': categoria
                })
                control_rows = control_result.fetchall()

                # Find the first period with positive palanca value
                first_positive_date = None
                for row in palanca_rows:
                    if row.avg_value and float(row.avg_value) > 0:
                        first_positive_date = row.start_date
                        break

                # Build dictionaries for easy lookup by period_label
                palanca_dict = {}
                for row in palanca_rows:
                    # Only include periods from first positive value onwards
                    if first_positive_date and row.start_date >= first_positive_date:
                        palanca_dict[row.period_label] = {
                            'value': float(row.avg_value) if row.avg_value else 0.0,
                            'start_date': row.start_date,
                            'end_date': row.end_date
                        }

                control_dict = {}
                for row in control_rows:
                    # Only include periods from first positive value onwards
                    if first_positive_date and row.start_date >= first_positive_date:
                        control_dict[row.period_label] = {
                            'value': float(row.avg_value) if row.avg_value else 0.0,
                            'start_date': row.start_date,
                            'end_date': row.end_date
                        }

                # Get all unique periods (only from first positive onwards)
                all_periods = {}
                for period_label, data in palanca_dict.items():
                    all_periods[period_label] = data
                for period_label, data in control_dict.items():
                    if period_label not in all_periods:
                        all_periods[period_label] = data

                # Sort periods by start_date
                sorted_periods = sorted(all_periods.items(), key=lambda x: x[1]['start_date'])

                # Build combined timeline data
                timeline_data = []
                for period_label, period_info in sorted_periods:
                    palanca_value = palanca_dict.get(period_label, {}).get('value', None)
                    control_value = control_dict.get(period_label, {}).get('value', None)
                    start_date = period_info['start_date']

                    # Format date as DD/MM
                    date_formatted = start_date.strftime('%d/%m') if start_date else period_label

                    timeline_data.append({
                        'period': period_label,
                        'period_label': period_label,
                        'start_date': start_date.isoformat() if start_date else None,
                        'date_formatted': date_formatted,
                        'palanca_value': palanca_value,
                        'control_value': control_value
                    })

                # Format project start date as DD/MM for frontend
                project_start_formatted = project_start_date.strftime('%d/%m') if project_start_date else None

                return {
                    'success': True,
                    'data': timeline_data,
                    'palanca_name': palanca,
                    'tipologia': tipologia,
                    'project_start_date': project_start_date.isoformat() if project_start_date else None,
                    'project_start_formatted': project_start_formatted,
                    'filtered_by': {
                        'tipologia': tipologia,
                        'fuente': fuente,
                        'unidad': unidad,
                        'categoria': categoria,
                        'palanca': palanca
                    }
                }

        except Exception as e:
            logger.error(f"Error in get_evolution_timeline_data: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': []
            }

    def get_palancas_by_tipologia(self, tipologia: str) -> Dict[str, Any]:
        """
        Get palancas filtered by tipologia
        Returns only palancas that exist in stores with the specified tipologia
        Compatible with: /api/dashboard/palancas-by-tipologia
        """
        try:
            with self.get_session() as session:
                # Get palancas used by stores of the specified tipologia
                query = text("""
                    SELECT DISTINCT l.lever_name
                    FROM store_master s
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    WHERE t.typology_name = :tipologia
                      AND l.lever_name != 'Control'
                      AND s.is_active = TRUE
                    ORDER BY l.lever_name
                """)

                result = session.execute(query, {'tipologia': tipologia})
                palancas = [row.lever_name for row in result.fetchall()]

                return {
                    'success': True,
                    'palancas': palancas,
                    'tipologia': tipologia
                }

        except Exception as e:
            logger.error(f"Error in get_palancas_by_tipologia: {e}")
            return {
                'success': False,
                'error': str(e),
                'palancas': []
            }

    def get_fuentes_by_tipologia(self, tipologia: str) -> Dict[str, Any]:
        """
        Get data sources filtered by tipologia
        Returns only sources that have data for the specified tipologia
        Compatible with: /api/dashboard/fuentes-by-tipologia
        """
        try:
            with self.get_session() as session:
                # Get data sources that have results for this tipologia
                query = text("""
                    SELECT DISTINCT ds.source_name
                    FROM ab_test_result r
                    JOIN store_master s ON r.store_id = s.id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN data_source_master ds ON r.source_id = ds.source_id
                    WHERE t.typology_name = :tipologia
                      AND s.is_active = TRUE
                    ORDER BY ds.source_name
                """)

                result = session.execute(query, {'tipologia': tipologia})
                fuentes = [row.source_name for row in result.fetchall()]

                return {
                    'success': True,
                    'fuentes': fuentes,
                    'tipologia': tipologia
                }

        except Exception as e:
            logger.error(f"Error in get_fuentes_by_tipologia: {e}")
            return {
                'success': False,
                'error': str(e),
                'fuentes': []
            }

    def get_categorias_by_tipologia(self, tipologia: str) -> Dict[str, Any]:
        """
        Get categories filtered by tipologia
        Returns only categories that have data for the specified tipologia
        Compatible with: /api/dashboard/categorias-by-tipologia
        """
        try:
            with self.get_session() as session:
                # Get categories that have results for this tipologia
                query = text("""
                    SELECT DISTINCT c.category_name
                    FROM ab_test_result r
                    JOIN store_master s ON r.store_id = s.id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN category_master c ON r.category_id = c.category_id
                    WHERE t.typology_name = :tipologia
                      AND s.is_active = TRUE
                """)

                result = session.execute(query, {'tipologia': tipologia})
                categorias_raw = [row.category_name for row in result.fetchall()]

                # Apply custom order
                categoria_order = ['Gatorade', 'Gatorade 500ml', 'Gatorade 1000ml', 'Gatorade Sugar-free', 'Electrolit', 'Powerade', 'Otros']
                categorias = [c for c in categoria_order if c in categorias_raw]
                # Add any remaining categories not in the custom order
                categorias.extend([c for c in categorias_raw if c not in categoria_order])

                return {
                    'success': True,
                    'categorias': categorias,
                    'tipologia': tipologia
                }

        except Exception as e:
            logger.error(f"Error in get_categorias_by_tipologia: {e}")
            return {
                'success': False,
                'error': str(e),
                'categorias': []
            }

    def get_filter_options(self) -> Dict[str, List[str]]:
        """
        Get filter options for dashboard
        Compatible with: /api/dashboard/filter-options
        """
        try:
            with self.get_session() as session:
                # Get typologies
                tipologia_query = text("SELECT typology_name FROM typology_master")
                tipologias_raw = [row.typology_name for row in session.execute(tipologia_query)]

                # Custom order for tipologías
                tipologia_order = ['Super e hiper', 'Conveniencia', 'Droguerías']
                tipologias = [t for t in tipologia_order if t in tipologias_raw]
                # Add any remaining tipologías not in the custom order
                tipologias.extend([t for t in tipologias_raw if t not in tipologia_order])

                # Get levers (exclude "Control")
                palanca_query = text("SELECT lever_name FROM lever_master WHERE lever_name != 'Control' ORDER BY lever_name")
                palancas = [row.lever_name for row in session.execute(palanca_query)]

                # Get categories (KPIs)
                kpi_query = text("SELECT category_name FROM category_master")
                kpis_raw = [row.category_name for row in session.execute(kpi_query)]

                # Custom order for categorías
                categoria_order = ['Gatorade', 'Gatorade 500ml', 'Gatorade 1000ml', 'Gatorade Sugar-free', 'Electrolit', 'Powerade', 'Otros']
                kpis = [c for c in categoria_order if c in kpis_raw]
                # Add any remaining categories not in the custom order
                kpis.extend([c for c in kpis_raw if c not in categoria_order])

                # Get data sources
                fuente_query = text("SELECT source_name FROM data_source_master ORDER BY source_name")
                fuentes = [row.source_name for row in session.execute(fuente_query)]

                # Get measurement units
                unidad_query = text("SELECT unit_name FROM measurement_unit_master ORDER BY unit_name")
                unidades = [row.unit_name for row in session.execute(unidad_query)]

                # Get categories (same as kpi with same custom order)
                categorias = kpis  # Use the same ordered list

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

    def get_radar_chart_data(
        self,
        tipologia: Optional[str] = None,
        fuente: Optional[str] = None,
        unidad: Optional[str] = None,
        categoria: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos agregados para Radar Chart
        Compatible con endpoint: /api/dashboard/radar-data

        Si tipologia='all' o None, retorna datos para todas las tipologías (modo comparativo)
        Si tipologia específica, retorna solo datos para esa tipología
        """
        try:
            with self.get_session() as session:
                # Build dynamic query based on tipologia filter
                if tipologia and tipologia != 'all':
                    # Single typology mode
                    query = text("""
                        SELECT
                            t.typology_name as tipologia,
                            l.lever_name as palanca,
                            AVG(s.difference_vs_control) as avg_score
                        FROM ab_test_summary s
                        JOIN typology_master t ON s.typology_id = t.typology_id
                        JOIN lever_master l ON s.lever_id = l.lever_id
                        WHERE l.lever_name != 'Control'
                          AND t.typology_name = :tipologia
                          AND s.category_id NOT IN (5, 6, 7)
                          AND (:fuente IS NULL OR s.source_id = (SELECT source_id FROM data_source_master WHERE source_name = :fuente))
                          AND (:unidad IS NULL OR s.unit_id = (SELECT unit_id FROM measurement_unit_master WHERE unit_name = :unidad))
                          AND (:categoria IS NULL OR s.category_id = (SELECT category_id FROM category_master WHERE category_name = :categoria))
                        GROUP BY t.typology_name, l.lever_name
                        ORDER BY l.lever_name
                    """)
                else:
                    # Comparative mode (all typologies)
                    query = text("""
                        SELECT
                            t.typology_name as tipologia,
                            l.lever_name as palanca,
                            AVG(s.difference_vs_control) as avg_score
                        FROM ab_test_summary s
                        JOIN typology_master t ON s.typology_id = t.typology_id
                        JOIN lever_master l ON s.lever_id = l.lever_id
                        WHERE l.lever_name != 'Control'
                          AND s.category_id NOT IN (5, 6, 7)
                          AND (:fuente IS NULL OR s.source_id = (SELECT source_id FROM data_source_master WHERE source_name = :fuente))
                          AND (:unidad IS NULL OR s.unit_id = (SELECT unit_id FROM measurement_unit_master WHERE unit_name = :unidad))
                          AND (:categoria IS NULL OR s.category_id = (SELECT category_id FROM category_master WHERE category_name = :categoria))
                        GROUP BY t.typology_name, l.lever_name
                        ORDER BY t.typology_name, l.lever_name
                    """)

                result = session.execute(query, {
                    'tipologia': tipologia if tipologia != 'all' else None,
                    'fuente': fuente,
                    'unidad': unidad,
                    'categoria': categoria
                })
                rows = result.fetchall()

                # Convert to list of dicts
                data = []
                for row in rows:
                    # Handle NaN/None values properly for JSON serialization
                    avg_score = row.avg_score
                    if avg_score is None:
                        avg_score_value = 0.0
                    else:
                        try:
                            avg_score_value = float(avg_score)
                            # Check if it's NaN and convert to 0 (math.isnan is more reliable)
                            if math.isnan(avg_score_value):
                                avg_score_value = 0.0
                        except (ValueError, TypeError):
                            avg_score_value = 0.0

                    data.append({
                        'tipologia': row.tipologia,
                        'palanca': row.palanca,
                        'avg_score': avg_score_value
                    })

                # Extract unique tipologias and palancas
                tipologias = sorted(list(set(item['tipologia'] for item in data)))
                palancas = sorted(list(set(item['palanca'] for item in data)))

                return {
                    'success': True,
                    'data': data,
                    'tipologias': tipologias,
                    'palancas': palancas,
                    'filtered_by': {
                        'tipologia': tipologia,
                        'fuente': fuente,
                        'unidad': unidad,
                        'categoria': categoria
                    }
                }

        except Exception as e:
            logger.error(f"Error in get_radar_chart_data: {e}")
            return {
                'success': False,
                'error': str(e),
                'data': [],
                'tipologias': [],
                'palancas': []
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
