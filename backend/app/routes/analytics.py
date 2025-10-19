"""
Analytics API endpoints
"""
from flask import Blueprint, jsonify, request
from app.services.session_manager import session_manager
from app.services.cache_service import query_cache
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

@analytics_bp.route('/api/dashboard/competition-results', methods=['GET'])
def get_competition_results():
    """Get competition results (Electrolit, Powerade, Otros) with filters from PostgreSQL"""
    try:
        tipologia = request.args.get('tipologia')
        fuente = request.args.get('fuente')
        unidad = request.args.get('unidad')

        results = unified_db.get_competition_results(
            tipologia=tipologia,
            fuente=fuente,
            unidad=unidad
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

@analytics_bp.route('/api/dashboard/pdv-summary', methods=['GET'])
def get_pdv_summary():
    """Get PDV summary (Control vs Foco) by tipologia and palanca"""
    try:
        tipologia = request.args.get('tipologia')
        palanca = request.args.get('palanca')

        if not tipologia:
            return jsonify({
                'success': False,
                'error': 'Missing tipologia parameter'
            }), 400

        results = unified_db.get_pdv_summary(
            tipologia=tipologia,
            palanca=palanca if palanca else None
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