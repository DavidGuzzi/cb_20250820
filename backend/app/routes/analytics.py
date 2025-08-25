"""
Analytics API endpoints
"""
from flask import Blueprint, jsonify
from app.services.session_manager import session_manager
from app.services.cache_service import query_cache
from app.data_store import DataStore

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