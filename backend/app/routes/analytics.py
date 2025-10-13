"""
Analytics API endpoints
"""
from flask import Blueprint, jsonify, request
from app.services.session_manager import session_manager
from app.services.cache_service import query_cache
from app.data_store import DataStore
from app.services.unified_database_service import unified_db

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics/sessions', methods=['GET'])
def get_session_analytics():
    """Get session analytics"""
    try:
        cache_stats = query_cache.get_stats()
        
        active_sessions = session_manager.get_active_sessions_count()
        total_messages = session_manager.get_total_messages_count()
        
        avg_turns_per_session = (
            round(total_messages / active_sessions, 2) 
            if active_sessions > 0 else 0
        )
        
        return jsonify({
            'success': True,
            'analytics': {
                'cache': cache_stats,
                'sessions': {
                    'active_sessions': active_sessions,
                    'total_conversation_turns': total_messages,
                    'avg_turns_per_session': avg_turns_per_session
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/analytics/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the query cache"""
    try:
        query_cache.clear()
        return jsonify({
            'success': True,
            'message': 'Cache cleared successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/analytics/revenue-by-region', methods=['GET'])
def get_revenue_by_region():
    """Get revenue data aggregated by region"""
    try:
        data_store = DataStore()
        revenue_df = data_store.revenue_df
        pdv_master = data_store.pdv_master
        
        # Agregar información de región a los datos
        revenue_with_region = []
        for _, row in revenue_df.iterrows():
            pdv_info = pdv_master[row['pdv']]
            revenue_with_region.append({
                'pdv': row['pdv'],
                'mes': row['mes'],
                'revenue': row['revenue'],
                'visitantes': row['visitantes'],
                'conversiones': row['conversiones'],
                'region': pdv_info['region'],
                'ciudad': pdv_info['ciudad'],
                'tipo': pdv_info['tipo']
            })
        
        # Agregar por región
        region_totals = {}
        for record in revenue_with_region:
            region = record['region']
            if region not in region_totals:
                region_totals[region] = {
                    'revenue': 0,
                    'visitantes': 0,
                    'conversiones': 0,
                    'pdv_count': set()
                }
            region_totals[region]['revenue'] += record['revenue']
            region_totals[region]['visitantes'] += record['visitantes']
            region_totals[region]['conversiones'] += record['conversiones']
            region_totals[region]['pdv_count'].add(record['pdv'])
        
        # Formatear para gráfico de torta
        chart_data = []
        total_revenue = sum(data['revenue'] for data in region_totals.values())
        
        for region, data in region_totals.items():
            percentage = (data['revenue'] / total_revenue) * 100 if total_revenue > 0 else 0
            chart_data.append({
                'name': region,
                'value': data['revenue'],
                'percentage': round(percentage, 1),
                'visitantes': data['visitantes'],
                'conversiones': data['conversiones'],
                'pdv_count': len(data['pdv_count']),
                'conversion_rate': round((data['conversiones'] / data['visitantes']) * 100, 2) if data['visitantes'] > 0 else 0
            })
        
        return jsonify({
            'success': True,
            'data': chart_data,
            'total_revenue': total_revenue,
            'summary': {
                'total_regions': len(region_totals),
                'total_pdvs': len(pdv_master),
                'period_covered': sorted(set(record['mes'] for record in revenue_with_region))
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/analytics/revenue-by-city', methods=['GET']) 
def get_revenue_by_city():
    """Get revenue data aggregated by city"""
    try:
        data_store = DataStore()
        revenue_df = data_store.revenue_df
        pdv_master = data_store.pdv_master
        
        # Agregar información de ciudad a los datos
        revenue_with_city = []
        for _, row in revenue_df.iterrows():
            pdv_info = pdv_master[row['pdv']]
            revenue_with_city.append({
                'pdv': row['pdv'],
                'mes': row['mes'],
                'revenue': row['revenue'],
                'visitantes': row['visitantes'],
                'conversiones': row['conversiones'],
                'ciudad': pdv_info['ciudad'],
                'region': pdv_info['region'],
                'tipo': pdv_info['tipo']
            })
        
        # Agregar por ciudad
        city_totals = {}
        for record in revenue_with_city:
            city = record['ciudad']
            if city not in city_totals:
                city_totals[city] = {
                    'revenue': 0,
                    'visitantes': 0,
                    'conversiones': 0,
                    'region': record['region'],
                    'pdv_count': set()
                }
            city_totals[city]['revenue'] += record['revenue']
            city_totals[city]['visitantes'] += record['visitantes']
            city_totals[city]['conversiones'] += record['conversiones']
            city_totals[city]['pdv_count'].add(record['pdv'])
        
        # Formatear para gráfico
        chart_data = []
        total_revenue = sum(data['revenue'] for data in city_totals.values())
        
        for city, data in city_totals.items():
            percentage = (data['revenue'] / total_revenue) * 100 if total_revenue > 0 else 0
            chart_data.append({
                'name': city,
                'value': data['revenue'],
                'percentage': round(percentage, 1),
                'region': data['region'],
                'visitantes': data['visitantes'],
                'conversiones': data['conversiones'],
                'pdv_count': len(data['pdv_count']),
                'conversion_rate': round((data['conversiones'] / data['visitantes']) * 100, 2) if data['visitantes'] > 0 else 0
            })
        
        # Ordenar por revenue descendente
        chart_data.sort(key=lambda x: x['value'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': chart_data,
            'total_revenue': total_revenue
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/filter-options', methods=['GET'])
def get_filter_options():
    """Get filter options from PostgreSQL maestro tables"""
    try:
        options = unified_db.get_filter_options()
        return jsonify({
            'success': True,
            'options': options
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/palancas-by-tipologia', methods=['GET'])
def get_palancas_by_tipologia():
    """Get palancas filtered by tipologia from store_master"""
    try:
        tipologia = request.args.get('tipologia')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Missing tipologia parameter'
            }), 400

        result = unified_db.get_palancas_by_tipologia(tipologia)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/fuentes-by-tipologia', methods=['GET'])
def get_fuentes_by_tipologia():
    """Get data sources filtered by tipologia from ab_test_result"""
    try:
        tipologia = request.args.get('tipologia')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Missing tipologia parameter'
            }), 400

        result = unified_db.get_fuentes_by_tipologia(tipologia)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/categorias-by-tipologia', methods=['GET'])
def get_categorias_by_tipologia():
    """Get categories filtered by tipologia from ab_test_result"""
    try:
        tipologia = request.args.get('tipologia')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Missing tipologia parameter'
            }), 400

        result = unified_db.get_categorias_by_tipologia(tipologia)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/results', methods=['GET'])
def get_dashboard_results():
    """Get dashboard results data with multiple filters from PostgreSQL"""
    try:
        tipologia = request.args.get('tipologia')
        fuente = request.args.get('fuente')
        unidad = request.args.get('unidad')
        categoria = request.args.get('categoria')

        results = unified_db.get_dashboard_results(
            tipologia=tipologia,
            fuente=fuente,
            unidad=unidad,
            categoria=categoria
        )

        return jsonify(results), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/data-summary', methods=['GET'])
def get_data_summary():
    """Get summary of available PostgreSQL data"""
    try:
        result = unified_db.get_data_summary()
        if result.get('success'):
            return jsonify({
                'success': True,
                'summary': result['summary']
            }), 200
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/evolution-data', methods=['GET'])
def get_evolution_data():
    """Get evolution data for timeline chart from PostgreSQL ab_test_result"""
    try:
        tipologia = request.args.get('tipologia')
        fuente = request.args.get('fuente')
        unidad = request.args.get('unidad')
        categoria = request.args.get('categoria')
        palanca = request.args.get('palanca')

        # Call new method that queries ab_test_result with palanca vs control
        results = unified_db.get_evolution_timeline_data(
            tipologia=tipologia,
            fuente=fuente,
            unidad=unidad,
            categoria=categoria,
            palanca=palanca
        )

        return jsonify(results), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/radar-data', methods=['GET'])
def get_radar_data():
    """Get aggregated data for radar chart visualization from PostgreSQL"""
    try:
        tipologia = request.args.get('tipologia')
        fuente = request.args.get('fuente')
        unidad = request.args.get('unidad')
        categoria = request.args.get('categoria')

        results = unified_db.get_radar_chart_data(
            tipologia=tipologia,
            fuente=fuente,
            unidad=unidad,
            categoria=categoria
        )

        return jsonify(results), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/maestro-mappings', methods=['GET'])
def get_maestro_mappings():
    """Get mappings between names and IDs for all maestros"""
    try:
        # Get maestro mappings
        tipologia_mapping = dict(zip(excel_service.maestro_tipologia_df['tipologia_name'], excel_service.maestro_tipologia_df['tipologia_id']))
        palanca_mapping = dict(zip(excel_service.maestro_palanca_df['palanca_name'], excel_service.maestro_palanca_df['palanca_id']))
        kpi_mapping = dict(zip(excel_service.maestro_kpi_df['kpi_name'], excel_service.maestro_kpi_df['kpi_id']))
        
        # Also get reverse mappings (ID to name)
        tipologia_reverse = dict(zip(excel_service.maestro_tipologia_df['tipologia_id'], excel_service.maestro_tipologia_df['tipologia_name']))
        palanca_reverse = dict(zip(excel_service.maestro_palanca_df['palanca_id'], excel_service.maestro_palanca_df['palanca_name']))
        kpi_reverse = dict(zip(excel_service.maestro_kpi_df['kpi_id'], excel_service.maestro_kpi_df['kpi_name']))
        
        return jsonify({
            'success': True,
            'mappings': {
                'tipologia_name_to_id': tipologia_mapping,
                'palanca_name_to_id': palanca_mapping,
                'kpi_name_to_id': kpi_mapping,
                'tipologia_id_to_name': tipologia_reverse,
                'palanca_id_to_name': palanca_reverse,
                'kpi_id_to_name': kpi_reverse
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Error getting maestro mappings: {str(e)}'
        }), 500

@analytics_bp.route('/api/dashboard/evolution-debug', methods=['GET'])
def get_evolution_debug():
    """Debug evolution data structure"""
    try:
        evolution_df = excel_service.evolution_df
        
        # Get basic info
        columns = list(evolution_df.columns)
        unique_periods_semana = sorted(evolution_df['semana_fecha_inicio'].unique()) if 'semana_fecha_inicio' in columns else []
        unique_periods_periodo = sorted(evolution_df['periodo'].unique()) if 'periodo' in columns else []
        unique_palancas = sorted(evolution_df['palanca_id'].unique())
        unique_kpis = sorted(evolution_df['kpi'].unique())
        unique_tipologias = sorted(evolution_df['tipologia_id'].unique())
        
        # Sample data for palanca=5, kpi=1
        sample_cols = ['cliente_sell_in_id', 'tipologia_id', 'palanca_id', 'kpi', 'valor']
        if 'periodo' in columns:
            sample_cols.append('periodo')
        if 'semana_fecha_inicio' in columns:
            sample_cols.append('semana_fecha_inicio')
            
        sample_data = evolution_df[
            (evolution_df['palanca_id'] == 5) & 
            (evolution_df['kpi'] == 1)
        ][sample_cols].head(10)
        
        return jsonify({
            'success': True,
            'total_rows': len(evolution_df),
            'columns': columns,
            'unique_periods_semana': [str(p) for p in unique_periods_semana],
            'unique_periods_periodo': [str(p) for p in unique_periods_periodo],
            'unique_palancas': [int(p) for p in unique_palancas],
            'unique_kpis': [int(k) for k in unique_kpis],
            'unique_tipologias': [int(t) for t in unique_tipologias],
            'sample_data_palanca5_kpi1': sample_data.to_dict('records')
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Debug error: {str(e)}'
        }), 500