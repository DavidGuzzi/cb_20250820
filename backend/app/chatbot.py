from openai import OpenAI
from app.config import Config
from app.conversation_memory import ConversationMemory
from app.data_store import DataStore
from app.sql_engine import SQLEngine
import json
import re
import time
import logging

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
            logger = logging.getLogger('chatbot_app.chatbot')
            openai_logger = logging.getLogger('chatbot_app.openai')
            sql_logger = logging.getLogger('chatbot_app.sql')
            # Añadir mensaje del usuario a la memoria
            self.memory.add_message("user", user_message)
            
            logger.info("Processing user message", extra={
                'extra_fields': {
                    'event': 'chatbot_process',
                    'message_preview': user_message[:100]
                }
            })
            
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

REGLA CRÍTICA: Para CUALQUIER pregunta sobre datos específicos, SIEMPRE incluir consulta SQL en formato ```sql\n[QUERY]\n``` 

EJEMPLOS OBLIGATORIOS:
USUARIO: ¿Cuántos puntos de venta tenemos?
ASISTENTE: ```sql
SELECT COUNT(*) as total FROM pdvs;
```
Basado en nuestros registros, tenemos X puntos de venta distribuidos en diferentes regiones.

USUARIO: ¿Qué te pregunté anteriormente?
ASISTENTE: Antes me preguntaste sobre la cantidad de puntos de venta que tenemos en los experimentos.

IMPORTANTE: Siempre ejecutar SQL primero, luego dar respuesta natural con los datos reales.

{conversation_history}

USUARIO: {user_message}

ASISTENTE:"""
            
            # Usar la Responses API de OpenAI
            openai_logger.info("Calling OpenAI Responses API", extra={
                'extra_fields': {
                    'event': 'openai_call_start'
                }
            })
            # Unified call options with simple retry
            model = getattr(Config, 'OPENAI_MODEL', None) or "gpt-4o-mini"
            last_err = None
            response = None
            t0 = time.time()
            for _ in range(2):
                try:
                    response = self.client.responses.create(
                        model=model,
                        input=enhanced_input,
                        temperature=0.7,
                        max_output_tokens=1200,
                        timeout=10
                    )
                    break
                except Exception as e:
                    last_err = e
                    time.sleep(0.5)
            if last_err and not response:
                raise last_err
            openai_logger.info("OpenAI call finished", extra={
                'extra_fields': {
                    'event': 'openai_call_end',
                    'model': model,
                    'latency_ms': round((time.time() - t0) * 1000, 2)
                }
            })
            assistant_message = response.output_text
            
            # Detectar y ejecutar consultas SQL
            sql_executed = False
            if "```sql" in assistant_message:
                sql_logger.info("SQL block detected in LLM response", extra={
                    'extra_fields': {
                        'event': 'sql_detected'
                    }
                })
                sql_results = self._execute_sql_from_response(assistant_message)
                if sql_results:
                    assistant_message = sql_results
                    sql_executed = True
                    sql_logger.info("SQL executed and response updated", extra={
                        'extra_fields': {
                            'event': 'sql_executed'
                        }
                    })
                else:
                    sql_logger.warning("SQL execution failed or no results", extra={
                        'extra_fields': {
                            'event': 'sql_failed'
                        }
                    })
            else:
                logger.info("No SQL query detected in response", extra={
                    'extra_fields': {
                        'event': 'sql_not_detected'
                    }
                })
            
            # Añadir respuesta a la memoria
            self.memory.add_message("assistant", assistant_message)
            
            return assistant_message
            
        except Exception as e:
            return f"Error al generar respuesta: {str(e)}"
    
    def _execute_sql_from_response(self, response_text):
        """Extrae y ejecuta consultas SQL de la respuesta del LLM"""
        logger = logging.getLogger('chatbot_app.sql')
        # Extraer consulta SQL
        sql_pattern = r'```sql\s*(.*?)\s*```'
        matches = re.findall(sql_pattern, response_text, re.DOTALL | re.IGNORECASE)
        
        if not matches:
            return None
        
        sql_query = matches[0].strip()
        logger.info("Executing SQL", extra={
            'extra_fields': {
                'event': 'sql_execute',
                'query_preview': sql_query[:120]
            }
        })
        
        # Ejecutar consulta
        t0 = time.time()
        result = self.sql_engine.execute_query(sql_query)
        latency_ms = round((time.time() - t0) * 1000, 2)
        
        if result['success']:
            data = result.get('data', [])
            logger.info("SQL executed successfully", extra={
                'extra_fields': {
                    'event': 'sql_success',
                    'row_count': len(data),
                    'latency_ms': latency_ms
                }
            })
            
            # Remover el bloque SQL de la respuesta original
            clean_response = re.sub(r'```sql.*?```', '', response_text, flags=re.DOTALL | re.IGNORECASE).strip()
            
            # Si hay datos, pedirle al LLM que reformule la respuesta con los datos reales
            if data:
                return self._reformulate_response_with_data(clean_response, sql_query, data)
            else:
                return clean_response + "\n\nNo encontré datos que coincidan con tu consulta."
        else:
            logger.error("SQL execution failed", extra={
                'extra_fields': {
                    'event': 'sql_error',
                    'error': result.get('error', 'Unknown error'),
                    'latency_ms': latency_ms
                }
            })
            return response_text + f"\n\nLo siento, no pude obtener esa información en este momento."
    
    def _reformulate_response_with_data(self, original_response, sql_query, data):
        """Usa el LLM para reformular la respuesta con los datos reales"""
        try:
            openai_logger = logging.getLogger('chatbot_app.openai')
            # Convertir datos a formato legible
            data_summary = f"Datos obtenidos de la consulta SQL:\n"
            for i, row in enumerate(data[:10]):  # Máximo 10 filas para el contexto
                data_summary += f"Fila {i+1}: {row}\n"
            if len(data) > 10:
                data_summary += f"... y {len(data)-10} filas más\n"
            
            reformulation_prompt = f"""Basándote en estos datos reales, reformula la respuesta de manera natural:

RESPUESTA ORIGINAL: {original_response}

DATOS REALES:
{data_summary}

INSTRUCCIONES:
- Usa los números y datos exactos obtenidos
- Mantén un tono natural y conversacional
- No menciones aspectos técnicos
- Si es un conteo, da el número exacto
- Si son múltiples registros, resume de manera útil

RESPUESTA REFORMULADA:"""

            model = getattr(Config, 'OPENAI_MODEL', None) or "gpt-4o-mini"
            last_err = None
            response = None
            t0 = time.time()
            for _ in range(2):
                try:
                    response = self.client.responses.create(
                        model=model,
                        input=reformulation_prompt,
                        temperature=0.7,
                        max_output_tokens=600,
                        timeout=10
                    )
                    break
                except Exception as e:
                    last_err = e
                    time.sleep(0.5)
            if not response:
                raise last_err if last_err else RuntimeError("OpenAI Responses error")
            openai_logger.info("OpenAI reformulation finished", extra={
                'extra_fields': {
                    'event': 'openai_reformulate',
                    'model': model,
                    'latency_ms': round((time.time() - t0) * 1000, 2)
                }
            })
            
            return response.output_text
            
        except Exception as e:
            logging.getLogger('chatbot_app.chatbot').error("Error in reformulation", extra={
                'extra_fields': {
                    'event': 'openai_reformulate_error',
                    'error': str(e)
                }
            })
            # Fallback: respuesta simple con datos básicos
            if len(data) == 1 and len(data[0]) == 1:
                # Probablemente un COUNT
                return f"{original_response.replace('X', str(data[0][0]))}"
            else:
                return f"{original_response}\n\nEncontré {len(data)} registro(s) en los datos."
    
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
