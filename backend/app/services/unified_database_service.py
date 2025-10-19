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
                      AND category_name NOT IN ('Electrolit', 'Powerade', 'Otros')
                      AND NOT (typology_name = 'Droguerías' AND lever_name = 'Tienda multipalanca')
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

    def get_competition_results(
        self,
        tipologia: Optional[str] = None,
        fuente: Optional[str] = None,
        unidad: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos de competencia (Gatorade principal, Electrolit, Powerade, Otros) para la tabla Competition
        Compatible con endpoint: /api/dashboard/competition-results
        Formato: Por fuente (agrupada), luego unidad, luego categoría
        """
        try:
            with self.get_session() as session:
                # Query for competition categories
                # Include Gatorade only for SOM sources, always include competition brands
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
                      AND lever_name != 'Control'
                      AND NOT (typology_name = 'Droguerías' AND lever_name = 'Tienda multipalanca')
                      AND (
                        category_name IN ('Electrolit', 'Powerade', 'Otros')
                        OR (
                          category_name = 'Gatorade'
                          AND source_name IN ('Sell Out - SOM', 'Sell Out - SOM - HIDR')
                        )
                      )
                    ORDER BY source_name, unit_name, category_name, lever_name
                """)

                result = session.execute(query, {
                    'tipologia': tipologia,
                    'fuente': fuente,
                    'unidad': unidad
                })
                rows = result.fetchall()

                # Convert to dict format expected by frontend
                data = []
                for row in rows:
                    # Handle NaN/None values
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
                        'unidad': unidad
                    }
                }

        except Exception as e:
            logger.error(f"Error in get_competition_results: {e}")
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
                # Query 0: Calculate project start date (mode) and end date (max) based on data source
                # Determine which columns to use
                start_date_column = 'start_date_sellin' if fuente == 'Sell In' else 'start_date_sellout'
                end_date_column = 'end_date_sellin' if fuente == 'Sell In' else 'end_date_sellout'

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

                # Query 0c: For Droguerías, get the city(ies) where the palanca stores are located
                # This is used to filter control stores to the same city
                palanca_cities = []
                if tipologia == 'Droguerías':
                    city_query = text("""
                        SELECT DISTINCT s.city_id
                        FROM store_master s
                        JOIN typology_master t ON s.typology_id = t.typology_id
                        JOIN lever_master l ON s.lever_id = l.lever_id
                        WHERE t.typology_name = :tipologia
                          AND l.lever_name = :palanca
                          AND s.is_active = TRUE
                          AND s.city_id IS NOT NULL
                    """)
                    city_result = session.execute(city_query, {
                        'tipologia': tipologia,
                        'palanca': palanca
                    })
                    palanca_cities = [row.city_id for row in city_result.fetchall()]

                project_start_result = session.execute(project_start_query, {
                    'tipologia': tipologia,
                    'palanca': palanca
                })
                project_start_row = project_start_result.fetchone()
                project_start_date = project_start_row.start_date if project_start_row else None

                # Query 0b: Calculate palanca end date (maximum end date from stores with this palanca)
                palanca_end_query = text(f"""
                    SELECT MAX({end_date_column}) as end_date
                    FROM store_master s
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    WHERE t.typology_name = :tipologia
                      AND l.lever_name = :palanca
                      AND s.is_active = TRUE
                      AND {end_date_column} IS NOT NULL
                """)

                palanca_end_result = session.execute(palanca_end_query, {
                    'tipologia': tipologia,
                    'palanca': palanca
                })
                palanca_end_row = palanca_end_result.fetchone()
                palanca_end_date = palanca_end_row.end_date if palanca_end_row else None

                # Determine which date to use for X-axis based on data source
                # Sell Out sources use end_date, Sell In uses start_date
                is_sell_out = fuente and ('Sell Out' in fuente or 'SOM' in fuente)

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
                # For Droguerías: only control stores from same city as palanca stores
                # For other typologies: all control stores in typology
                if tipologia == 'Droguerías' and palanca_cities:
                    # Droguerías: Filter control stores by city
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
                          AND s.city_id = ANY(:palanca_cities)
                        GROUP BY p.period_label, p.start_date, p.end_date
                        ORDER BY p.start_date
                    """)
                    control_result = session.execute(control_query, {
                        'tipologia': tipologia,
                        'fuente': fuente,
                        'unidad': unidad,
                        'categoria': categoria,
                        'palanca_cities': palanca_cities
                    })
                else:
                    # Other typologies: All control stores in typology
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
                    # Only include periods from first positive value onwards AND before palanca end date
                    include_period = (
                        first_positive_date and
                        row.start_date >= first_positive_date and
                        (not palanca_end_date or row.start_date <= palanca_end_date)
                    )
                    if include_period:
                        # Use end_date for Sell Out sources, start_date for Sell In
                        display_date = row.end_date if is_sell_out else row.start_date
                        palanca_dict[row.period_label] = {
                            'value': float(row.avg_value) if row.avg_value else 0.0,
                            'start_date': row.start_date,
                            'end_date': row.end_date,
                            'display_date': display_date
                        }

                control_dict = {}
                for row in control_rows:
                    # Only include periods from first positive value onwards AND before palanca end date
                    # Control should match the same date range as palanca
                    include_period = (
                        first_positive_date and
                        row.start_date >= first_positive_date and
                        (not palanca_end_date or row.start_date <= palanca_end_date)
                    )
                    if include_period:
                        # Use end_date for Sell Out sources, start_date for Sell In
                        display_date = row.end_date if is_sell_out else row.start_date
                        control_dict[row.period_label] = {
                            'value': float(row.avg_value) if row.avg_value else 0.0,
                            'start_date': row.start_date,
                            'end_date': row.end_date,
                            'display_date': display_date
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
                    display_date = period_info.get('display_date', start_date)

                    # Format date based on source type:
                    # - Sell Out sources: abbreviated month (jun, jul, etc.)
                    # - Sell In: DD/MM format
                    if display_date:
                        if is_sell_out:
                            # Spanish month abbreviations for Sell Out sources
                            month_abbr_es = {
                                1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun',
                                7: 'jul', 8: 'ago', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic'
                            }
                            date_formatted = month_abbr_es.get(display_date.month, display_date.strftime('%b').lower())
                        else:
                            # DD/MM format for Sell In
                            date_formatted = display_date.strftime('%d/%m')
                    else:
                        date_formatted = period_label

                    timeline_data.append({
                        'period': period_label,
                        'period_label': period_label,
                        'start_date': start_date.isoformat() if start_date else None,
                        'display_date': display_date.isoformat() if display_date else None,
                        'date_formatted': date_formatted,
                        'palanca_value': palanca_value,
                        'control_value': control_value
                    })

                # Format project start and end dates as DD/MM for frontend
                # For Sell Out sources, find the timeline period that contains project_start_date
                # and use its display_date (end_date) to match timeline data
                project_start_display = project_start_date
                if is_sell_out and project_start_date and timeline_data:
                    # Search through timeline_data to find the period containing project_start_date
                    from datetime import datetime
                    found_period = False
                    for data_point in timeline_data:
                        start_date_str = data_point.get('start_date')
                        display_date_str = data_point.get('display_date')

                        if start_date_str and display_date_str:
                            period_start = datetime.fromisoformat(start_date_str).date()
                            period_display = datetime.fromisoformat(display_date_str).date()

                            # Check if project_start_date falls within this period
                            # For Sell Out, display_date is the end_date of the period
                            if period_start <= project_start_date <= period_display:
                                project_start_display = period_display
                                found_period = True
                                logger.info(f"Sell Out: Found period containing {project_start_date}, using display_date {period_display}")
                                break

                    if not found_period:
                        logger.warning(f"Sell Out: Could not find timeline period containing project_start_date {project_start_date}")

                # Format project start marker to match timeline data format
                # - Sell Out sources: abbreviated month (jun, jul, etc.)
                # - Sell In: DD/MM format
                if project_start_display:
                    if is_sell_out:
                        # Spanish month abbreviations for Sell Out sources
                        month_abbr_es = {
                            1: 'ene', 2: 'feb', 3: 'mar', 4: 'abr', 5: 'may', 6: 'jun',
                            7: 'jul', 8: 'ago', 9: 'sep', 10: 'oct', 11: 'nov', 12: 'dic'
                        }
                        project_start_formatted = month_abbr_es.get(project_start_display.month, project_start_display.strftime('%b').lower())
                    else:
                        # DD/MM format for Sell In
                        project_start_formatted = project_start_display.strftime('%d/%m')
                else:
                    project_start_formatted = None

                palanca_end_formatted = palanca_end_date.strftime('%d/%m') if palanca_end_date else None

                logger.info(f"Timeline marker: project_start_formatted={project_start_formatted}, is_sell_out={is_sell_out}, timeline_periods={len(timeline_data)}")

                return {
                    'success': True,
                    'data': timeline_data,
                    'palanca_name': palanca,
                    'tipologia': tipologia,
                    'project_start_date': project_start_date.isoformat() if project_start_date else None,
                    'project_start_formatted': project_start_formatted,
                    'palanca_end_date': palanca_end_date.isoformat() if palanca_end_date else None,
                    'palanca_end_formatted': palanca_end_formatted,
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
                # Exclude "Tienda multipalanca" for Droguerías
                query = text("""
                    SELECT DISTINCT l.lever_name
                    FROM store_master s
                    JOIN lever_master l ON s.lever_id = l.lever_id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    WHERE t.typology_name = :tipologia
                      AND l.lever_name != 'Control'
                      AND NOT (t.typology_name = 'Droguerías' AND l.lever_name = 'Tienda multipalanca')
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
                # Get categories that have results for this tipologia (exclude competition)
                query = text("""
                    SELECT DISTINCT c.category_name
                    FROM ab_test_result r
                    JOIN store_master s ON r.store_id = s.id
                    JOIN typology_master t ON s.typology_id = t.typology_id
                    JOIN category_master c ON r.category_id = c.category_id
                    WHERE t.typology_name = :tipologia
                      AND s.is_active = TRUE
                      AND c.category_name NOT IN ('Electrolit', 'Powerade', 'Otros')
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

                # Get categories (KPIs) - exclude competition categories
                kpi_query = text("SELECT category_name FROM category_master WHERE category_name NOT IN ('Electrolit', 'Powerade', 'Otros')")
                kpis_raw = [row.category_name for row in session.execute(kpi_query)]

                # Custom order for categorías (exclude competition)
                categoria_order = ['Gatorade', 'Gatorade 500ml', 'Gatorade 1000ml', 'Gatorade Sugar-free']
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

    def get_pdv_summary(
        self,
        tipologia: str,
        palanca: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Obtiene resumen de PDV y Visitas por tipología
        Control vs Foco (palanca seleccionada o total de tipología)
        Incluye recuento de visitas desde audit_master
        Compatible con endpoint: /api/dashboard/pdv-summary
        """
        try:
            with self.get_session() as session:
                # Query to get control/foco PDV counts AND audit visit counts
                if palanca:
                    # With palanca: Control vs specific palanca
                    query = text("""
                        SELECT
                            COUNT(DISTINCT s.id) FILTER (WHERE l.lever_name = 'Control') as control_count,
                            COUNT(DISTINCT s.id) FILTER (WHERE l.lever_name = :palanca) as foco_count,
                            COUNT(DISTINCT a.id) FILTER (WHERE l.lever_name = 'Control') as control_visits,
                            COUNT(DISTINCT a.id) FILTER (WHERE l.lever_name = :palanca) as foco_visits
                        FROM store_master s
                        JOIN lever_master l ON s.lever_id = l.lever_id
                        JOIN typology_master t ON s.typology_id = t.typology_id
                        LEFT JOIN audit_master a ON s.store_code_sellin = a.store_code_sellin
                        WHERE t.typology_name = :tipologia
                          AND s.is_active = TRUE
                    """)
                    result = session.execute(query, {
                        'tipologia': tipologia,
                        'palanca': palanca
                    })
                else:
                    # Without palanca: Control vs All non-Control (Foco = total - control)
                    query = text("""
                        SELECT
                            COUNT(DISTINCT s.id) FILTER (WHERE l.lever_name = 'Control') as control_count,
                            COUNT(DISTINCT s.id) FILTER (WHERE l.lever_name != 'Control') as foco_count,
                            COUNT(DISTINCT a.id) FILTER (WHERE l.lever_name = 'Control') as control_visits,
                            COUNT(DISTINCT a.id) FILTER (WHERE l.lever_name != 'Control') as foco_visits
                        FROM store_master s
                        JOIN lever_master l ON s.lever_id = l.lever_id
                        JOIN typology_master t ON s.typology_id = t.typology_id
                        LEFT JOIN audit_master a ON s.store_code_sellin = a.store_code_sellin
                        WHERE t.typology_name = :tipologia
                          AND s.is_active = TRUE
                    """)
                    result = session.execute(query, {
                        'tipologia': tipologia
                    })

                row = result.fetchone()

                return {
                    'success': True,
                    'control_count': row.control_count if row else 0,
                    'foco_count': row.foco_count if row else 0,
                    'control_visits': row.control_visits if row else 0,
                    'foco_visits': row.foco_visits if row else 0,
                    'tipologia': tipologia,
                    'palanca': palanca
                }

        except Exception as e:
            logger.error(f"Error in get_pdv_summary: {e}")
            return {
                'success': False,
                'error': str(e),
                'control_count': 0,
                'foco_count': 0,
                'control_visits': 0,
                'foco_visits': 0
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
                          AND NOT (t.typology_name = 'Droguerías' AND l.lever_name = 'Tienda multipalanca')
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
                          AND NOT (t.typology_name = 'Droguerías' AND l.lever_name = 'Tienda multipalanca')
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

    # ========================================================================
    # SIMULATION METHODS
    # ========================================================================

    def get_ols_params(self, tipologia: str) -> Dict[str, Any]:
        """
        Get OLS model parameters for a specific tipologia
        Returns coefficients from appropriate ols_params_* table
        """
        try:
            # Map tipologia to table name
            table_mapping = {
                'Super e hiper': 'ols_params_super_hiper',
                'Conveniencia': 'ols_params_conveniencia',
                'Droguerías': 'ols_params_drogas'
            }

            table_name = table_mapping.get(tipologia)
            if not table_name:
                return {
                    'success': False,
                    'error': f'Tipología no válida: {tipologia}',
                    'params': {}
                }

            with self.get_session() as session:
                query = text(f"""
                    SELECT feature, parametro
                    FROM {table_name}
                    ORDER BY feature
                """)
                result = session.execute(query)
                rows = result.fetchall()

                # Convert to dict
                params = {row.feature: float(row.parametro) for row in rows}

                return {
                    'success': True,
                    'params': params,
                    'tipologia': tipologia,
                    'table': table_name
                }

        except Exception as e:
            logger.error(f"Error in get_ols_params: {e}")
            return {
                'success': False,
                'error': str(e),
                'params': {}
            }

    def get_capex_fee_by_palancas(self, tipologia: str, palancas: List[str]) -> Dict[str, Any]:
        """
        Get CAPEX and Fee costs for selected palancas in a tipologia
        Returns itemized breakdown and totals (in USD)
        """
        try:
            with self.get_session() as session:
                # Get tipologia_id
                tipologia_query = text("""
                    SELECT typology_id
                    FROM typology_master
                    WHERE typology_name = :tipologia
                """)
                tipologia_result = session.execute(tipologia_query, {'tipologia': tipologia})
                tipologia_row = tipologia_result.fetchone()

                if not tipologia_row:
                    return {
                        'success': False,
                        'error': f'Tipología no encontrada: {tipologia}',
                        'breakdown': [],
                        'total_capex_usd': 0,
                        'total_fee_usd': 0
                    }

                tipologia_id = tipologia_row.typology_id

                # Get lever_ids for palancas
                lever_query = text("""
                    SELECT lever_id, lever_name
                    FROM lever_master
                    WHERE lever_name = ANY(:palancas)
                """)
                lever_result = session.execute(lever_query, {'palancas': palancas})
                lever_rows = lever_result.fetchall()

                if not lever_rows:
                    return {
                        'success': False,
                        'error': 'No se encontraron palancas válidas',
                        'breakdown': [],
                        'total_capex_usd': 0,
                        'total_fee_usd': 0
                    }

                lever_ids = [row.lever_id for row in lever_rows]

                # Get capex/fee data
                capex_query = text("""
                    SELECT
                        l.lever_name,
                        c.capex,
                        c.fee
                    FROM capex_fee c
                    JOIN lever_master l ON c.lever_id = l.lever_id
                    WHERE c.typology_id = :tipologia_id
                      AND c.lever_id = ANY(:lever_ids)
                    ORDER BY l.lever_name
                """)
                capex_result = session.execute(capex_query, {
                    'tipologia_id': tipologia_id,
                    'lever_ids': lever_ids
                })
                capex_rows = capex_result.fetchall()

                # Build breakdown
                breakdown = []
                total_capex = 0.0
                total_fee = 0.0

                for row in capex_rows:
                    capex_val = float(row.capex) if row.capex else 0.0
                    fee_val = float(row.fee) if row.fee else 0.0

                    breakdown.append({
                        'palanca': row.lever_name,
                        'capex_usd': capex_val,
                        'fee_usd': fee_val
                    })

                    total_capex += capex_val
                    total_fee += fee_val

                return {
                    'success': True,
                    'breakdown': breakdown,
                    'total_capex_usd': total_capex,
                    'total_fee_usd': total_fee,
                    'tipologia': tipologia
                }

        except Exception as e:
            logger.error(f"Error in get_capex_fee_by_palancas: {e}")
            return {
                'success': False,
                'error': str(e),
                'breakdown': [],
                'total_capex_usd': 0,
                'total_fee_usd': 0
            }

    def calculate_simulation(
        self,
        tipologia: str,
        palancas: List[str],
        tamano_tienda: str,
        features: Dict[str, float],
        maco: float,
        exchange_rate: float
    ) -> Dict[str, Any]:
        """
        Calculate simulation results using OLS model
        Returns uplift, ROI, payback, and financial breakdown
        """
        try:
            # 1. Get OLS parameters
            ols_data = self.get_ols_params(tipologia)
            if not ols_data['success']:
                return {
                    'success': False,
                    'error': ols_data['error']
                }

            ols_params = ols_data['params']

            # 2. Get CAPEX/Fee data
            capex_data = self.get_capex_fee_by_palancas(tipologia, palancas)
            if not capex_data['success']:
                return {
                    'success': False,
                    'error': capex_data['error']
                }

            total_capex_usd = capex_data['total_capex_usd']
            total_fee_usd = capex_data['total_fee_usd']
            total_capex_cop = total_capex_usd * exchange_rate
            total_fee_cop = total_fee_usd * exchange_rate

            # 3. Define vol_inicial based on tamano_tienda and tipologia
            vol_inicial_mapping = {
                'Super e hiper': {'Pequeño': 50, 'Mediano': 100, 'Grande': 150},
                'Conveniencia': {'Pequeño': 20, 'Mediano': 40, 'Grande': 45},
                'Droguerías': {'Pequeño': 10, 'Mediano': 15, 'Grande': 20}
            }
            vol_inicial = vol_inicial_mapping.get(tipologia, {}).get(tamano_tienda, 50)

            # 4. Build feature vector for OLS prediction
            # Always-on features (execution checks)
            feature_vector = {
                'planograma_ejecución_check': 1.0,
                'precios_check': 1.0,
                'carga_check': 1.0
            }

            # User-defined features (from input)
            feature_vector['q_frentes'] = features.get('frentesPropios', 0)
            feature_vector['q_frentes_competencia'] = features.get('frentesCompetencia', 0)
            feature_vector['q_sku'] = features.get('skuPropios', 0)
            feature_vector['q_sku_competencia'] = features.get('skuCompetencia', 0)

            # EDF features (only for Super e hiper)
            if tipologia == 'Super e hiper':
                feature_vector['q_edf_ad'] = features.get('equiposFrioPropios', 0)
                feature_vector['q_edf_ad_competencia'] = features.get('equiposFrioCompetencia', 0)

            feature_vector['q_cof_puertas'] = features.get('puertasPropias', 0)
            feature_vector['q_cof_puertas_competencia'] = features.get('puertasCompetencia', 0)

            # Add vol_inicial to feature vector (store size factor)
            feature_vector['vol_inicial'] = vol_inicial

            # Palanca features mapping (name to OLS parameter name)
            palanca_mapping = {
                'Exhibición adicional mamut': 'exhibicion_adicional_mamut',
                'Nevera en punto de pago': 'nevera_en_punto_de_pago',
                'Entrepaño con comunicación': 'entrepano_con_comunicacion',
                'Cajero vendedor': 'cajero_vendedor',
                'Tienda multipalanca': 'tienda_multipalanca',
                'Punta de góndola': 'punta_de_gondola',
                'Mini vallas en fachada': 'mini_vallas_en_fachada',
                'Metro cuadrado': 'metro_cuadrado',
                'Rompe tráfico cross category': 'rompe_trafico_cross_category'
            }

            # Initialize all palanca features to 0
            for param_name in palanca_mapping.values():
                feature_vector[param_name] = 0.0

            # Activate selected palancas (set to 1)
            for palanca_name in palancas:
                param_name = palanca_mapping.get(palanca_name)
                if param_name:
                    feature_vector[param_name] = 1.0

            # 5. Calculate prediction with palanca (treatment group)
            prediction_with_palanca = ols_params.get('Intercept', 0.0)
            for feature_name, feature_value in feature_vector.items():
                coef = ols_params.get(feature_name, 0.0)
                prediction_with_palanca += coef * feature_value

            # 6. Calculate prediction without palanca (control group)
            # Same features but palancas = 0
            feature_vector_control = feature_vector.copy()
            for param_name in palanca_mapping.values():
                feature_vector_control[param_name] = 0.0

            prediction_control = ols_params.get('Intercept', 0.0)
            for feature_name, feature_value in feature_vector_control.items():
                coef = ols_params.get(feature_name, 0.0)
                prediction_control += coef * feature_value

            # 7. Calculate uplift percentage
            if prediction_control > 0:
                uplift_percent = ((prediction_with_palanca - prediction_control) / prediction_control) * 100
            else:
                uplift_percent = 0.0

            # 8. Calculate financial metrics
            # Ganancia incremental = difference in predictions * MACO
            ganancia_incremental = (prediction_with_palanca - prediction_control) * (maco / 100.0)

            # Payback (months) = CAPEX / (Ganancia incremental - Fee)
            monthly_profit = ganancia_incremental - total_fee_cop
            if monthly_profit > 0:
                payback_months = total_capex_cop / monthly_profit
            else:
                payback_months = float('inf')

            # ROI (12 months) = ((Ganancia - Fee) * 12 - CAPEX) / (CAPEX + Fee * 12)
            annual_profit = ganancia_incremental * 12
            annual_fee = total_fee_cop * 12
            denominator = total_capex_cop + annual_fee

            if denominator > 0:
                roi_12m = (annual_profit - annual_fee - total_capex_cop) / denominator
            else:
                roi_12m = 0.0

            return {
                'success': True,
                'uplift': round(uplift_percent, 2),
                'roi': round(roi_12m, 2),
                'payback': round(payback_months, 1) if payback_months != float('inf') else None,
                'capex_breakdown': capex_data['breakdown'],
                'total_capex_usd': total_capex_usd,
                'total_fee_usd': total_fee_usd,
                'total_capex_cop': total_capex_cop,
                'total_fee_cop': total_fee_cop,
                'prediction_with_palanca': round(prediction_with_palanca, 2),
                'prediction_control': round(prediction_control, 2),
                'vol_inicial': vol_inicial,
                'ganancia_incremental': round(ganancia_incremental, 2)
            }

        except Exception as e:
            logger.error(f"Error in calculate_simulation: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def get_monte_carlo_data(
        self,
        tipologia: str,
        unidad: str,
        selected_palancas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Obtiene datos de simulation_result para Estudio Monte Carlo

        Args:
            tipologia: Nombre de la tipología (Super e hiper, Conveniencia, Droguerías)
            unidad: Unidad de medida (Cajas 8oz, Ventas)
            selected_palancas: Lista de nombres de palancas a filtrar (filtro AND)

        Returns:
            Dict con:
            - uplift_values: array de valores uplift
            - statistics: {media, mediana, p25, p75}
            - available_palancas: lista de palancas disponibles para esta tipología
            - count: número de registros
        """
        try:
            with self.get_session() as session:
                # Mapeo de tipología a ID
                tipologia_map = {
                    'Droguerías': 1,
                    'Conveniencia': 2,
                    'Super e hiper': 3
                }

                # Mapeo de unidad a ID
                unidad_map = {
                    'Cajas 8oz': 1,
                    'Ventas': 2
                }

                tipologia_id = tipologia_map.get(tipologia)
                unidad_id = unidad_map.get(unidad)
                if not tipologia_id:
                    return {
                        'success': False,
                        'error': f'Tipología inválida: {tipologia}'
                    }
                if not unidad_id:
                    return {
                        'success': False,
                        'error': f'Unidad inválida: {unidad}'
                    }

                # Mapeo de palancas disponibles por tipología
                palancas_map = {
                    'Super e hiper': [
                        'punta_de_gondola',
                        'metro_cuadrado',
                        'nevera_en_punto_de_pago',
                        'rompe_trafico_cross_category'
                    ],
                    'Conveniencia': [
                        'punta_de_gondola',
                        'mini_vallas_en_fachada',
                        'cajero_vendedor',
                        'tienda_multipalanca'
                    ],
                    'Droguerías': [
                        'exhibicion_adicional_mamut',
                        'nevera_en_punto_de_pago',
                        'entrepano_con_comunicacion',
                        'cajero_vendedor',
                        'tienda_multipalanca'
                    ]
                }

                # Lista completa de TODAS las palancas en la tabla simulation_result
                all_palancas = [
                    'exhibicion_adicional_mamut',
                    'nevera_en_punto_de_pago',
                    'entrepano_con_comunicacion',
                    'cajero_vendedor',
                    'tienda_multipalanca',
                    'punta_de_gondola',
                    'mini_vallas_en_fachada',
                    'metro_cuadrado',
                    'rompe_trafico_cross_category'
                ]

                available_palancas = palancas_map.get(tipologia, [])

                # Construir query base con filtros de validación
                base_query = """
                    SELECT uplift
                    FROM simulation_result
                    WHERE typology_id = :tipologia_id
                      AND unit_id = :unidad_id
                      AND "planograma_ejecución_check" = 1
                      AND precios_check = 1
                      AND carga_check = 1
                """

                # Excluir vol_inicial = 15 para Conveniencia
                if tipologia == 'Conveniencia':
                    base_query += " AND vol_inicial != 15"

                # Agregar filtros para palancas seleccionadas
                # Lógica: palancas seleccionadas = 1, TODAS las demás (de todas las tipologías) = 0
                params = {'tipologia_id': tipologia_id, 'unidad_id': unidad_id}
                if selected_palancas and len(selected_palancas) > 0:
                    # Palancas seleccionadas deben ser = 1
                    for palanca in selected_palancas:
                        if palanca in available_palancas:
                            base_query += f" AND {palanca} = 1"

                    # TODAS las demás palancas (incluyendo de otras tipologías) deben ser = 0
                    for palanca in all_palancas:
                        if palanca not in selected_palancas:
                            base_query += f" AND {palanca} = 0"

                # Ejecutar query
                result = session.execute(text(base_query), params)
                # Convert Decimal to float to avoid type errors
                uplift_values = [float(row[0]) if row[0] is not None else 0.0 for row in result.fetchall()]

                if not uplift_values:
                    return {
                        'success': True,
                        'uplift_values': [],
                        'statistics': {
                            'media': 0,
                            'mediana': 0,
                            'p25': 0,
                            'p75': 0
                        },
                        'available_palancas': available_palancas,
                        'count': 0
                    }

                # Calcular estadísticas con pandas
                df = pd.DataFrame({'uplift': uplift_values})
                stats = {
                    'media': float(df['uplift'].mean()),
                    'mediana': float(df['uplift'].median()),
                    'p25': float(df['uplift'].quantile(0.25)),
                    'p75': float(df['uplift'].quantile(0.75))
                }

                logger.info(f"Monte Carlo data: {len(uplift_values)} records for {tipologia}, palancas: {selected_palancas}")

                return {
                    'success': True,
                    'uplift_values': uplift_values,
                    'statistics': stats,
                    'available_palancas': available_palancas,
                    'count': len(uplift_values)
                }

        except Exception as e:
            logger.error(f"Error in get_monte_carlo_data: {e}")
            return {
                'success': False,
                'error': str(e)
            }


# Global instance
unified_db = UnifiedDatabaseService()
