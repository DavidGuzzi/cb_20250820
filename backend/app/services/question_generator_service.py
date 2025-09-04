"""
Service for generating contextual follow-up questions using OpenAI
"""
import openai
import json
import time
from typing import List, Dict, Optional
from app.services.cache_service import query_cache

class QuestionGeneratorService:
    """Service for generating intelligent follow-up questions based on conversation context"""
    
    def __init__(self):
        self.cache_prefix = "questions_"
        self.cache_ttl = 1800  # 30 minutes
        
        # Base questions for different contexts
        self.base_questions = {
            'initial': [
                "¿Cuáles fueron los PDVs con mayor conversión este mes?",
                "Muéstrame el análisis de revenue por ciudad", 
                "¿Qué experimentos A/B tuvieron mejor performance?",
                "Comparar visitantes vs conversiones por región"
            ],
            'pdv_analysis': [
                "¿Cuál es el PDV más rentable por visitante?",
                "¿Qué factores influyen en la conversión de este PDV?",
                "¿Cómo se compara este PDV con otros de la misma región?",
                "¿Cuál es la tendencia mensual de este PDV?"
            ],
            'revenue_analysis': [
                "¿Qué ciudades tienen mayor potencial de crecimiento?",
                "¿Cómo impacta la estacionalidad en estos números?",
                "¿Qué estrategias funcionan mejor en cada región?",
                "¿Cuál es el ROI por cada peso invertido?"
            ],
            'conversion_analysis': [
                "¿Qué días de la semana tienen mejor conversión?",
                "¿Hay correlación entre visitantes y conversiones?",
                "¿Qué horarios son más efectivos?",
                "¿Cómo optimizar la tasa de conversión?"
            ],
            'regional_analysis': [
                "¿Qué región tiene mayor potencial sin explotar?",
                "¿Cómo se comportan los diferentes tipos de PDV?",
                "¿Qué factores demográficos influyen más?",
                "¿Cuáles son las mejores prácticas por región?"
            ]
        }
    
    def generate_follow_up_questions(
        self, 
        last_question: str, 
        last_response: str, 
        conversation_history: List[Dict],
        session_id: str
    ) -> List[str]:
        """
        Generate contextual follow-up questions based on the conversation
        
        Args:
            last_question: The user's last question
            last_response: The bot's last response
            conversation_history: List of previous messages
            session_id: Current session ID for caching
            
        Returns:
            List of 3-4 suggested follow-up questions
        """
        
        # Create cache key
        cache_key = f"{self.cache_prefix}{session_id}_{hash(last_question + last_response)}"
        
        # Check cache first
        cached_questions = query_cache.get(cache_key)
        if cached_questions:
            return cached_questions['questions']
        
        # Try to generate questions using OpenAI
        try:
            questions = self._generate_with_openai(last_question, last_response, conversation_history)
        except Exception as e:
            print(f"Error generating questions with OpenAI: {e}")
            # Fallback to rule-based generation
            questions = self._generate_rule_based(last_question, last_response)
        
        # Cache the result
        query_cache.set(cache_key, {'questions': questions}, self.cache_ttl)
        
        return questions
    
    def _generate_with_openai(
        self, 
        last_question: str, 
        last_response: str, 
        conversation_history: List[Dict]
    ) -> List[str]:
        """Generate questions using OpenAI based on conversation context"""
        
        # Build conversation context
        context = self._build_context(conversation_history, last_question, last_response)
        
        system_prompt = """
        Eres un experto analista de datos retail que ayuda a generar preguntas de seguimiento inteligentes.
        
        Tu tarea es generar exactamente 4 preguntas de seguimiento que:
        1. Sean relevantes al contexto de la conversación sobre datos de PDVs, revenue, conversiones
        2. Profundicen en el análisis anterior
        3. Abran nuevas líneas de investigación relacionadas
        4. Sean específicas y accionables
        
        Contexto de datos disponibles:
        - 8 PDVs en 6 ciudades argentinas (Buenos Aires, Córdoba, Rosario, Mendoza, Tucumán, Santa Fe)
        - Datos de revenue, visitantes, conversiones por mes
        - Análisis por región, ciudad, tipo de PDV
        
        Responde SOLO con un JSON array con 4 preguntas, ejemplo:
        ["¿Pregunta 1?", "¿Pregunta 2?", "¿Pregunta 3?", "¿Pregunta 4?"]
        """
        
        user_prompt = f"""
        Conversación actual:
        {context}
        
        Última pregunta del usuario: "{last_question}"
        Última respuesta del asistente: "{last_response[:500]}..."
        
        Genera 4 preguntas de seguimiento inteligentes y específicas.
        """
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.7,
            max_tokens=300,
            timeout=10
        )
        
        # Parse the JSON response
        questions_text = response.choices[0].message.content.strip()
        questions = json.loads(questions_text)
        
        # Validate and clean
        if isinstance(questions, list) and len(questions) >= 3:
            return questions[:4]  # Take first 4
        else:
            raise ValueError("Invalid response format from OpenAI")
    
    def _generate_rule_based(self, last_question: str, last_response: str) -> List[str]:
        """Fallback rule-based question generation"""
        
        # Analyze the last question to determine context
        question_lower = last_question.lower()
        
        if any(word in question_lower for word in ['pdv', 'punto', 'venta', 'tienda']):
            category = 'pdv_analysis'
        elif any(word in question_lower for word in ['revenue', 'ingresos', 'dinero', 'ganancias']):
            category = 'revenue_analysis'
        elif any(word in question_lower for word in ['conversión', 'conversion', 'tasa']):
            category = 'conversion_analysis'
        elif any(word in question_lower for word in ['región', 'region', 'ciudad', 'zona']):
            category = 'regional_analysis'
        else:
            category = 'initial'
        
        # Get questions from the selected category
        questions = self.base_questions.get(category, self.base_questions['initial'])
        
        # Return up to 4 questions, avoiding repetition with last question
        filtered_questions = [q for q in questions if q.lower() != last_question.lower()]
        
        return filtered_questions[:4]
    
    def _build_context(
        self, 
        conversation_history: List[Dict], 
        last_question: str, 
        last_response: str
    ) -> str:
        """Build conversation context for OpenAI prompt"""
        
        context_parts = []
        
        # Include last 3 exchanges to keep context manageable
        recent_history = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
        
        for msg in recent_history:
            if msg.get('role') == 'user':
                context_parts.append(f"Usuario: {msg.get('content', '')}")
            elif msg.get('role') == 'assistant':
                context_parts.append(f"Asistente: {msg.get('content', '')[:200]}...")
        
        return "\n".join(context_parts)
    
    def get_initial_questions(self) -> List[str]:
        """Get the initial set of questions for new conversations"""
        return self.base_questions['initial']
    
    def get_questions_by_category(self, category: str) -> List[str]:
        """Get questions for a specific category"""
        return self.base_questions.get(category, self.base_questions['initial'])

# Global question generator service instance
question_generator_service = QuestionGeneratorService()