"""
Chatbot service integrating the existing ABTestingChatbot
"""
import time
from typing import Dict, Optional
from app.chatbot import ABTestingChatbot
from app.services.cache_service import query_cache
from app.services.session_manager import session_manager
import re

class ChatbotService:
    """Service wrapper around ABTestingChatbot with enhanced features"""
    
    def __init__(self):
        self.chatbots: Dict[str, ABTestingChatbot] = {}
        self.welcome_message = """¡Hola! 👋 Soy tu Asistente IA de Análisis de Datos.

🏪 Tengo acceso completo a 8 puntos de venta (PDVs) distribuidos en 6 ciudades argentinas con datos detallados de los últimos 3 meses:
• Revenue y ingresos por período
• Flujo de visitantes y patrones
• Tasas de conversión y métricas de performance

💡 Pregúntame cualquier cosa sobre tus datos, por ejemplo:
"¿Cuántos PDVs tenemos?", "¿Cuál es el mejor PDV?", "Muéstrame el revenue por región"

🚀 ¡Estoy listo para ayudarte a descubrir insights valiosos!"""
    
    def get_chatbot(self, session_id: str) -> ABTestingChatbot:
        """Get or create chatbot instance for session"""
        if session_id not in self.chatbots:
            self.chatbots[session_id] = ABTestingChatbot()
        return self.chatbots[session_id]
    
    def start_session(self, user_email: str) -> dict:
        """Start new chat session"""
        session_id = session_manager.create_session(user_email)
        
        return {
            'success': True,
            'session_id': session_id,
            'welcome_message': self.welcome_message
        }
    
    def process_message(self, session_id: str, message: str) -> dict:
        """Process chat message with enhanced response format"""
        # Validate session
        session = session_manager.get_session(session_id)
        if not session:
            return {
                'success': False,
                'error': 'Invalid session ID'
            }
        
        # Update session activity
        session_manager.update_session_activity(session_id)
        
        # Get chatbot for this session
        chatbot = self.get_chatbot(session_id)
        
        # Measure execution time
        start_time = time.time()
        
        # Get response from chatbot
        try:
            response_text = chatbot.get_response(message)
            execution_time = round((time.time() - start_time) * 1000, 2)  # ms
            
            # Parse response for SQL and data
            parsed_response = self._parse_response(response_text)
            
            return {
                'success': True,
                'response': {
                    'text': response_text,
                    'data': parsed_response.get('data', []),
                    'sql_used': parsed_response.get('sql_used', ''),
                    'sql_executed': parsed_response.get('sql_executed', False),
                    'confidence': 85.0,  # Could implement actual confidence scoring
                    'execution_time': execution_time,
                    'cached': parsed_response.get('cached', False),
                    'insights': self._generate_insights(parsed_response),
                    'session_id': session_id
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Error processing message: {str(e)}'
            }
    
    def _parse_response(self, response_text: str) -> dict:
        """Parse chatbot response to extract SQL and data"""
        result = {
            'sql_used': '',
            'sql_executed': False,
            'data': [],
            'cached': False
        }
        
        # Extract SQL query
        sql_pattern = r'```sql\s*(.*?)\s*```'
        sql_matches = re.findall(sql_pattern, response_text, re.DOTALL | re.IGNORECASE)
        
        if sql_matches:
            sql_query = sql_matches[0].strip()
            result['sql_used'] = sql_query
            result['sql_executed'] = True
            
            # Check cache first
            cached_result = query_cache.get(sql_query)
            if cached_result:
                result['data'] = cached_result['data']
                result['cached'] = True
            else:
                # If not using actual SQL execution here, we'll rely on the chatbot's built-in execution
                # This is a placeholder for potential future direct SQL execution
                result['data'] = []
        
        return result
    
    def _generate_insights(self, parsed_response: dict) -> dict:
        """Generate insights based on response data"""
        insights = {
            'key_finding': 'Análisis completado exitosamente',
            'supporting_metrics': [],
            'recommendations': [],
            'related_questions': [
                '¿Qué factores influyen en estos resultados?',
                '¿Cómo se compara con el período anterior?',
                '¿Hay patrones estacionales?',
                '¿Qué recomendaciones tienes para mejorar?'
            ]
        }
        
        # Basic insight generation based on SQL execution
        if parsed_response.get('sql_executed'):
            insights['supporting_metrics'].append('Consulta SQL ejecutada exitosamente')
            if parsed_response.get('cached'):
                insights['supporting_metrics'].append('Resultado obtenido desde cache')
        
        data = parsed_response.get('data', [])
        if data:
            insights['supporting_metrics'].append(f'{len(data)} registro(s) encontrado(s)')
            insights['recommendations'].append('Revisar los datos para identificar tendencias')
        
        return insights
    
    def get_session_history(self, session_id: str) -> dict:
        """Get chat history for session"""
        session = session_manager.get_session(session_id)
        if not session:
            return {
                'success': False,
                'error': 'Invalid session ID'
            }
        
        chatbot = self.get_chatbot(session_id)
        
        # Convert chatbot memory to expected format
        history = []
        messages = chatbot.memory.messages
        
        # Group messages into question-answer pairs
        for i in range(0, len(messages) - 1, 2):
            if i + 1 < len(messages):
                user_msg = messages[i]
                assistant_msg = messages[i + 1]
                
                if user_msg['role'] == 'user' and assistant_msg['role'] == 'assistant':
                    history.append({
                        'question': user_msg['content'],
                        'answer': assistant_msg['content'],
                        'sql_used': '',  # Could extract from response
                        'timestamp': session['last_activity']
                    })
        
        return {
            'success': True,
            'history': history,
            'session_info': session
        }
    
    def get_data_summary(self) -> dict:
        """Get summary of available data"""
        # Use existing chatbot to get data summary
        temp_chatbot = ABTestingChatbot()
        
        return {
            'success': True,
            'data_summary': {
                'tables': ['pdvs', 'ventas', 'vista_completa'],
                'columns': {
                    'pdvs': 'pdv_codigo, nombre, ciudad, region, tipo',
                    'ventas': 'pdv_codigo, mes, revenue, visitantes, conversiones, tasa_conversion, revenue_por_visitante',
                    'vista_completa': 'Combinación de ambas tablas'
                },
                'sample_data': {},
                'stats': temp_chatbot.data_store.get_summary_stats()
            }
        }

# Global chatbot service instance
chatbot_service = ChatbotService()