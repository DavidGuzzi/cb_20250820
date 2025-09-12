# Chatbot para A/B Test.

Sistema completo de chatbot especializado en análisis de datos de puntos de venta (PDVs) con capacidades text-to-SQL, desarrollado con Flask backend y React frontend. Incluye sistema inteligente de preguntas sugeridas con IA.

## 🏗️ Arquitectura

### Backend (Flask)
- **API REST** con endpoints para chat, analytics y health checks
- **Servicio de Chatbot** integrado con OpenAI Responses API
- **Motor Text-to-SQL** para consultas sobre datos retail
- **Sistema de Sesiones** para manejo de conversaciones
- **Cache in-memory** para optimizar consultas frecuentes
- **Logging estructurado** para monitoreo y debugging
- **🆕 Generador de Preguntas IA** con OpenAI GPT-3.5-turbo para preguntas contextuales

### Frontend (React + TypeScript)
- **Interfaz moderna** con Tailwind CSS y shadcn/ui components
- **Hook de chat** para gestión de estado y comunicación con backend
- **Persistencia local** de conversaciones
- **Analytics en tiempo real** de performance del sistema
- **Manejo de sesiones** con localStorage
- **🆕 Sistema de Preguntas Sugeridas** con flujo inteligente y límites automáticos

### Datos
- **8 PDVs** en 6 ciudades argentinas (Buenos Aires, Córdoba, Rosario, Mendoza, Tucumán, Santa Fe)
- **3 regiones** (Norte, Centro, Sur) y **3 tipos** de tienda (Flagship, Standard, Express)
- **3 meses** de datos históricos (Nov 2024 - Ene 2025)
- **Métricas completas**: Revenue, visitantes, conversiones, tasas de conversión

## 🚀 Inicio Rápido

### Requisitos previos
- Docker y Docker Compose
- OpenAI API Key

### Configuración inicial

1. **Clonar y configurar**
```bash
git clone <repo>
cd cb_20250820
cp .env.example .env
# Editar .env y añadir tu OPENAI_API_KEY
```

2. **Desarrollo con Docker**
```bash
# Iniciar servicios de desarrollo
docker-compose up -d

# Ver logs
docker-compose logs -f

# URLs
# Frontend: http://localhost:5173
# Backend API: http://localhost:5000/api
```

3. **Prueba del backend**
```bash
# Test de endpoints (opcional)
cd backend
python test_backend.py
```

### Desarrollo local (sin Docker)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
export OPENAI_API_KEY=tu_api_key
python run.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📋 API Endpoints

### Chat
- `POST /api/chat/start` - Iniciar sesión de chat
- `POST /api/chat/message` - Enviar mensaje al chatbot
- `GET /api/chat/history/{session_id}` - Obtener historial
- `POST /api/chat/suggested-questions` - 🆕 Obtener preguntas sugeridas contextuales

### System
- `GET /api/health` - Health check del sistema
- `GET /api/analytics/sessions` - Métricas de sesiones y cache
- `GET /api/data/summary` - Resumen de datos disponibles

### Ejemplos de request/response

**Iniciar chat:**
```bash
curl -X POST http://localhost:5000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "usuario@ejemplo.com"}'
```

**Enviar mensaje:**
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "uuid-generado",
    "message": "¿Cuál es el PDV con mejor revenue?"
  }'
```

## 🐳 Despliegue

### Desarrollo
```bash
docker-compose up -d
```

### Producción
```bash
# Usar compose de producción
docker-compose -f deploy/docker-compose.prod.yml up -d

# O usar script automatizado
./deploy/scripts/deploy.sh production
```

### Variables de entorno para producción
```env
OPENAI_API_KEY=tu_api_key_produccion
FLASK_ENV=production
LOG_LEVEL=INFO
SECRET_KEY=clave_secreta_segura
```

## 💬 Ejemplos de Uso

### Preguntas Directas
El chatbot puede responder preguntas como:

- "¿Cuál es el PDV con mejor performance?"
- "Compara los ingresos entre regiones"
- "¿Cómo evolucionó el PDV001 mes a mes?"
- "¿Qué tipo de tienda tiene mejor conversión?"
- "Muéstrame el top 3 de PDVs por revenue"
- "¿Cuál es la tasa de conversión promedio por región?"

### 🆕 Sistema de Preguntas Sugeridas
Al iniciar una conversación, aparecen **4 preguntas iniciales** debajo del mensaje de bienvenida:
- "¿Cuáles fueron los PDVs con mayor conversión este mes?"
- "Muéstrame el análisis de revenue por ciudad"
- "¿Qué experimentos A/B tuvieron mejor performance?"
- "Comparar visitantes vs conversiones por región"

**Flujo Inteligente:**
1. Selecciona una pregunta → Bot responde + genera 4 nuevas preguntas contextuales
2. Continúa hasta 4 preguntas máximo o escribe libremente
3. Cada nueva sesión reinicia el modo de preguntas sugeridas

**Ventajas:**
- **Guía para usuarios nuevos** que no saben qué preguntar
- **Preguntas contextuales** generadas por IA según la conversación
- **Transición fluida** entre preguntas sugeridas y escritura libre

## 🎨 Mejoras de UI/UX del Chatbot

### Interfaz Visual Mejorada
- **Iconos con Gradientes**: Bot con gradiente azul-púrpura, Usuario con gradiente naranja-rojo y ícono de estrella
- **Animaciones Sutiles**: Ícono del bot pulsa durante escritura, indicador de conexión con pulso verde
- **Branding Profesional**: Esquema de colores consistente y identidad visual moderna
- **Burbujas de Mensaje Mejoradas**: Gradientes, sombras y efectos hover para mejor experiencia
- **Indicador de Escritura**: Puntos que rebotan con colores que coinciden con la marca del bot

### Sistema de Foco Inteligente
- **Auto-Focus Durante Conversación**: El input mantiene el foco automáticamente durante intercambios activos
- **Navegación Respetuosa**: Permite navegación normal por la UI sin robar foco agresivamente
- **Detección de Área de Chat**: Solo enfoca cuando se interactúa dentro del área de chat
- **Gestión Optimizada**: Usa `requestAnimationFrame` y event listeners minimalistas para mejor rendimiento
- **Fix Técnico**: Implementación correcta de `React.forwardRef` en componente Input para manejo confiable de referencias

### Experiencia de Usuario Mejorada
- **Foco Contextual**: Se mantiene enfocado solo cuando es apropiado (después de enviar/recibir mensajes)
- **Interacciones Naturales**: Permite clicks en botones, navegación por header sin interferencia
- **Scroll Optimizado**: Scroll instantáneo durante conversación para evitar conflictos con el foco
- **Retroalimentación Visual**: Transiciones suaves y feedback inmediato para mejor experiencia

## 🔧 Desarrollo

### Estructura del proyecto
```
├── backend/                 # Flask API
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Lógica de negocio + 🆕 QuestionGeneratorService
│   │   ├── utils/          # Utilidades (logging, etc)
│   │   └── models/         # Schemas y modelos
│   ├── requirements.txt    # Dependencias Python
│   └── Dockerfile
├── frontend/               # React app
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API client
│   ├── package.json       # Dependencias Node
│   └── Dockerfile
├── deploy/                # Scripts de despliegue
└── docker-compose.yml     # Orquestación Docker
```

### Comandos útiles

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python run.py                    # Desarrollo
gunicorn wsgi:app               # Producción
python test_backend.py          # Tests
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev                     # Desarrollo
npm run build                   # Build producción
npm run lint                    # Linting
```

**Docker:**
```bash
docker-compose build           # Build imágenes
docker-compose up -d           # Iniciar servicios
docker-compose logs -f         # Ver logs
docker-compose down           # Detener servicios
```

## 📊 Monitoreo

El sistema incluye:
- **Health checks** automáticos en Docker
- **Logging estructurado** en JSON para producción
- **Métricas de cache** y performance
- **Analytics de sesiones** en tiempo real

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir nueva funcionalidad'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

**Desarrollado con:** Flask, React, TypeScript, Docker, OpenAI API