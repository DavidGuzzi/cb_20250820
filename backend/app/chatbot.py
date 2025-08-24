from openai import OpenAI
from app.config import Config
from app.conversation_memory import ConversationMemory
from app.data_store import DataStore
from app.sql_engine import SQLEngine
import json
import re

class ABTestingChatbot:
    def __init__(self):
        Config.validate()
        self.client = OpenAI()
        self.memory = ConversationMemory()
        self.data_store = DataStore()
        self.sql_engine = SQLEngine()
    
    def get_response(self, user_message: str) -> str:
        """Obtiene respuesta del chatbot usando Responses API"""
        try:
            # Añadir mensaje del usuario a la memoria
            self.memory.add_message("user", user_message)
            
            # Preparar contexto completo
            system_context = self.memory.system_prompt
            schema_info = self.sql_engine.get_schema_info()
            
            # Construir historial de conversación
            conversation_history = ""
            if len(self.memory.messages) > 1:  # Si hay mensajes previos
                conversation_history = "\n\nHISTORIAL DE CONVERSACIÓN:\n"
                for msg in self.memory.messages[-6:]:  # Últimos 6 mensajes
                    role = "USUARIO" if msg["role"] == "user" else "ASISTENTE"
                    conversation_history += f"{role}: {msg['content']}\n"
            
            # Construir input con capacidad SQL
            enhanced_input = f"""{system_context}

{schema_info}

INSTRUCCIONES PARA ANÁLISIS:
1. Si la pregunta requiere cálculos o consultas específicas sobre los datos, genera una consulta SQL.
2. Envuelve la consulta SQL entre ```sql y ``` para que pueda ser ejecutada.
3. Después de la consulta, proporciona análisis e interpretación de los resultados.
4. Puedes usar sinónimos: revenue=ingreso, conversiones=compras, visitantes=tráfico, etc.

{conversation_history}

USUARIO: {user_message}

ASISTENTE:"""
            
            # Usar la Responses API de OpenAI
            response = self.client.responses.create(
                model=Config.OPENAI_MODEL,
                input=enhanced_input
            )
            
            assistant_message = response.output_text
            
            # Detectar y ejecutar consultas SQL
            sql_executed = False
            if "```sql" in assistant_message:
                sql_results = self._execute_sql_from_response(assistant_message)
                if sql_results:
                    assistant_message = sql_results
                    sql_executed = True
            
            # Añadir respuesta a la memoria
            self.memory.add_message("assistant", assistant_message)
            
            return assistant_message
            
        except Exception as e:
            return f"Error al generar respuesta: {str(e)}"
    
    def _execute_sql_from_response(self, response_text):
        """Extrae y ejecuta consultas SQL de la respuesta del LLM"""
        # Extraer consulta SQL
        sql_pattern = r'```sql\s*(.*?)\s*```'
        matches = re.findall(sql_pattern, response_text, re.DOTALL | re.IGNORECASE)
        
        if not matches:
            return None
        
        sql_query = matches[0].strip()
        
        # Ejecutar consulta
        result = self.sql_engine.execute_query(sql_query)
        
        if result['success']:
            # Formatear resultados
            formatted_response = response_text.replace(f"```sql\n{sql_query}\n```", "")
            
            formatted_response += f"\n\n📊 **RESULTADOS DE LA CONSULTA:**\n"
            formatted_response += f"```sql\n{sql_query}\n```\n\n"
            
            if result['row_count'] == 0:
                formatted_response += "No se encontraron resultados.\n"
            else:
                formatted_response += f"**{result['row_count']} resultado(s) encontrado(s):**\n\n"
                
                # Mostrar resultados en formato tabla
                for i, row in enumerate(result['data'][:10], 1):  # Máximo 10 filas
                    formatted_response += f"**Resultado {i}:**\n"
                    for key, value in row.items():
                        if isinstance(value, float):
                            if key in ['revenue', 'ingreso', 'revenue_por_visitante']:
                                formatted_response += f"- {key}: ${value:,.2f}\n"
                            elif key in ['tasa_conversion']:
                                formatted_response += f"- {key}: {value:.2f}%\n"
                            else:
                                formatted_response += f"- {key}: {value:.2f}\n"
                        else:
                            formatted_response += f"- {key}: {value}\n"
                    formatted_response += "\n"
                
                if result['row_count'] > 10:
                    formatted_response += f"... y {result['row_count'] - 10} resultados más.\n"
            
            return formatted_response
        else:
            return response_text + f"\n\n❌ **Error en la consulta SQL:** {result['error']}\n"
    
    def clear_conversation(self):
        """Limpia la memoria conversacional"""
        self.memory.clear()
        return "Conversación reiniciada."
    
    def get_conversation_status(self):
        """Obtiene estado de la conversación"""
        status = {
            "memory_status": self.memory.get_conversation_summary(),
            "experiment_loaded": bool(self.analyzer.experiment_data),
            "experiment_name": self.analyzer.current_experiment
        }
        return status
    
    def export_conversation(self):
        """Exporta la conversación actual"""
        return {
            "messages": self.memory.messages,
            "experiment_data": self.analyzer.experiment_data,
            "timestamp": "session_only"
        }