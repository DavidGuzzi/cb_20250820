"""
Chat API endpoints
"""
from flask import Blueprint, request, jsonify
from app.services.chatbot_service import chatbot_service

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/api/chat/start', methods=['POST'])
def start_chat_session():
    """Start a new chat session"""
    try:
        data = request.get_json()
        
        if not data or 'userEmail' not in data:
            return jsonify({
                'success': False,
                'error': 'userEmail is required'
            }), 400
        
        user_email = data['userEmail']
        
        if not user_email.strip():
            return jsonify({
                'success': False,
                'error': 'userEmail cannot be empty'
            }), 400
        
        result = chatbot_service.start_session(user_email)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@chat_bp.route('/api/chat/message', methods=['POST'])
def send_message():
    """Send a message to the chatbot"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        session_id = data.get('session_id')
        message = data.get('message')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        if not message or not message.strip():
            return jsonify({
                'success': False,
                'error': 'message cannot be empty'
            }), 400
        
        result = chatbot_service.process_message(session_id, message.strip())
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@chat_bp.route('/api/chat/history/<session_id>', methods=['GET'])
def get_chat_history(session_id):
    """Get chat history for a session"""
    try:
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        result = chatbot_service.get_session_history(session_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@chat_bp.route('/api/data/summary', methods=['GET'])
def get_data_summary():
    """Get summary of available data"""
    try:
        result = chatbot_service.get_data_summary()
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500