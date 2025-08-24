# Chatbot para Análisis de Datos Retail

Sistema completo de chatbot especializado en análisis de datos de puntos de venta (PDVs) con capacidades text-to-SQL, desarrollado con Flask backend y React frontend.

## 🏗️ Arquitectura

### Backend (Flask)
- **API REST** con endpoints para chat, analytics y health checks
- **Servicio de Chatbot** integrado con OpenAI Responses API
- **Motor Text-to-SQL** para consultas sobre datos retail
- **Sistema de Sesiones** para manejo de conversaciones
- **Cache in-memory** para optimizar consultas frecuentes
- **Logging estructurado** para monitoreo y debugging

### Frontend (React + TypeScript)
- **Interfaz moderna** con Tailwind CSS y shadcn/ui components
- **Hook de chat** para gestión de estado y comunicación con backend
- **Persistencia local** de conversaciones
- **Analytics en tiempo real** de performance del sistema
- **Manejo de sesiones** con localStorage

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

El chatbot puede responder preguntas como:

- "¿Cuál es el PDV con mejor performance?"
- "Compara los ingresos entre regiones"
- "¿Cómo evolucionó el PDV001 mes a mes?"
- "¿Qué tipo de tienda tiene mejor conversión?"
- "Muéstrame el top 3 de PDVs por revenue"
- "¿Cuál es la tasa de conversión promedio por región?"

## 🔧 Desarrollo

### Estructura del proyecto
```
├── backend/                 # Flask API
│   ├── app/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Lógica de negocio
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

## 📝 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

**Desarrollado con:** Flask, React, TypeScript, Docker, OpenAI API