feat(openai): unify to Responses API + structured logging

Summary
- Unifica todo el uso de OpenAI al cliente moderno y Responses API.
- Estandariza logging estructurado con request_id y session_id, y mide latencias de OpenAI/SQL.

Changes
- Unificación OpenAI:
  - backend/app/services/question_generator_service.py:1
  - backend/app/chatbot.py:1
- Logging consistente:
  - backend/app/utils/logger.py:1
  - backend/app/__init__.py:1
  - backend/app/routes/chat.py:1

Details
- Cliente único: from openai import OpenAI en ambos servicios.
- Modelo: toma Config.OPENAI_MODEL (fallback gpt-4o-mini).
- Parámetros homogéneos: temperature=0.7, timeout=10, max_output_tokens adaptados.
- Retries simples (2 intentos) con backoff corto en llamadas OpenAI.
- Logs estructurados:
  - Request ID: genera/propaga X-Request-Id por request.
  - Incluye session_id en requests de chat.
  - Métricas de latencia para OpenAI y SQL.
  - Reemplazo de prints por loggers jerárquicos.

Motivation
- Reducir deuda técnica (mezcla de SDKs).
- Mejor observabilidad y trazabilidad en prod y para costos de LLM.

How To Test
- Pre requisitos:
  - `.env` con `OPENAI_API_KEY`, `FLASK_ENV=development`.
- Dev:
  - docker-compose up -d
  - curl http://localhost:5000/api/health → 200
  - Iniciar sesión: POST /api/chat/start con {"userEmail":"test@example.com"}
  - Mensaje: POST /api/chat/message con session_id y un prompt
- Verifica:
  - Respuesta HTTP incluye header `X-Request-Id`.
  - Logs muestran JSON con `request_id`, `session_id`, `model`, `latency_ms`.
- Generador de preguntas:
  - POST /api/chat/suggested-questions con session_id
  - Se reciben 4 preguntas; si el modelo devuelve ruido, el parser extrae el array JSON.

Sample Log (JSON)
- {"timestamp":"...","level":"INFO","logger":"chatbot_app.openai","message":"OpenAI call finished","event":"openai_call_end","model":"gpt-4o-mini","latency_ms":742.13,"request_id":"...","session_id":"..."}

Risks
- Dependencia de Responses API; requiere OPENAI_API_KEY válida.
- Cambios de logging pueden incrementar volumen; ajustar LOG_LEVEL según entorno.

Rollback
- Revertir con git revert o volver a HEAD anterior de main.

Follow-ups sugeridos
- Usar logger en question_generator_service para cache hits/misses.
- Añadir métricas de coste estimado por llamada a OpenAI.
- Streaming de respuestas.
- CI simple (lint/test) y deploy.
