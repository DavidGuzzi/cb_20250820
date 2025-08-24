"""
Health check endpoints
"""
from flask import Blueprint, jsonify
from app.config import Config

health_bp = Blueprint('health', __name__)

@health_bp.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Validate configuration
        Config.validate()
        
        return jsonify({
            'status': 'healthy',
            'chatbot_ready': True,
            'service': 'Retail Analytics Chatbot API',
            'version': '1.0.0'
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'chatbot_ready': False,
            'error': str(e)
        }), 503