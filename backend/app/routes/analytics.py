"""
Analytics API endpoints
"""
from flask import Blueprint, jsonify
from app.services.session_manager import session_manager
from app.services.cache_service import query_cache

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