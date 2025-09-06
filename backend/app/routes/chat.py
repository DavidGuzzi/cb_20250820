"""
Chat API endpoints
"""
from flask import Blueprint, request, jsonify, g
from app.services.chatbot_service import chatbot_service
from app.services.question_generator_service import question_generator_service

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
        
        # Attach session_id to request context for logging
        g.session_id = session_id

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
        
        # Attach session_id to request context for logging
        g.session_id = session_id

        result = chatbot_service.get_session_history(session_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500

@chat_bp.route('/api/chat/suggested-questions', methods=['POST'])
def get_suggested_questions():
    """Get contextual follow-up questions based on conversation history"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is required'
            }), 400
        
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': False,
                'error': 'session_id is required'
            }), 400
        
        # Attach session_id to request context for logging
        g.session_id = session_id

        # Get conversation history
        history_result = chatbot_service.get_session_history(session_id)
        if not history_result['success']:
            return jsonify(history_result), 400
        
        history = history_result['history']
        
        # If no conversation history, return initial questions
        if not history:
            questions = question_generator_service.get_initial_questions()
            return jsonify({
                'success': True,
                'questions': questions,
                'question_type': 'initial'
            }), 200
        
        # Get last exchange
        last_exchange = history[-1]
        last_question = last_exchange['question']
        last_response = last_exchange['answer']
        
        # Build conversation history for context
        conversation_context = []
        for exchange in history:
            conversation_context.append({'role': 'user', 'content': exchange['question']})
            conversation_context.append({'role': 'assistant', 'content': exchange['answer']})
        
        # Generate follow-up questions
        questions = question_generator_service.generate_follow_up_questions(
            last_question=last_question,
            last_response=last_response,
            conversation_history=conversation_context,
            session_id=session_id
        )
        
        return jsonify({
            'success': True,
            'questions': questions,
            'question_type': 'follow_up',
            'based_on_last_question': last_question
        }), 200
        
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
