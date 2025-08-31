# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack retail data analysis application consisting of:
- **Flask backend**: REST API with chatbot service for text-to-SQL retail data analysis
- **React frontend**: Modern dashboard interface with chat functionality
- **Docker setup**: Complete containerization for development and production

## Common Commands

### Docker Development (Recommended)

#### Local Development:
```bash
# Setup environment
cp .env.local .env  # For local development

# Start all services locally
docker-compose -f docker-compose.local.yml up -d

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Stop services
docker-compose -f docker-compose.local.yml down
```

#### Legacy Docker (still works):
```bash
# Setup environment
cp .env.example .env  # Add your OPENAI_API_KEY

# Start all services
docker-compose up -d
```

### Local Development

**Backend (Flask API):**
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py

# Run tests
python test_backend.py

# Production server
gunicorn wsgi:app
```

**Frontend (React + Vite):**
```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

## Architecture

### Backend (Flask) Structure
- **app/__init__.py**: Flask application factory with CORS and logging
- **app/routes/**: API endpoints (chat, health, analytics)
- **app/services/**: Business logic (chatbot, sessions, cache)
- **app/models/**: Request/response schemas
- **app/utils/**: Utilities (logging, helpers)
- **run.py**: Development server entry point
- **wsgi.py**: Production WSGI entry point

### Core Services
- **ChatbotService**: Integrates OpenAI text-to-SQL chatbot
- **SessionManager**: Manages chat sessions with UUIDs
- **QueryCache**: In-memory cache for SQL query optimization
- **Structured Logging**: JSON logs for production monitoring

### API Endpoints
- `POST /api/chat/start` - Initialize chat session
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/history/{session_id}` - Get conversation history
- `GET /api/health` - Health check
- `GET /api/analytics/sessions` - System metrics

### Frontend Structure
- **React + TypeScript + Vite** stack
- **Tailwind CSS** with **shadcn/ui** component library
- **Custom hooks**: useChat for chat state management
- **API Service**: Centralized API communication
- **Local persistence**: localStorage for session continuity
- **Theme System**: Dark/Light mode with ThemeProvider context
- **Modern Dashboard**: Figma-based design with A/B testing analytics

### Data Layer
- **8 PDVs** across 6 Argentine cities (Buenos Aires, Córdoba, Rosario, Mendoza, Tucumán, Santa Fe)
- **SQLite in-memory**: Text-to-SQL queries on retail metrics
- **3 months** of revenue, visitor, and conversion data
- **Real-time analytics**: Cache performance and session metrics

## Development Workflow

### Quick Start
1. `cp .env.example .env` (add OPENAI_API_KEY)
2. `docker-compose up -d`
3. Frontend: http://localhost:5173
4. Backend API: http://localhost:5000/api

### Testing
- Backend: `cd backend && python test_backend.py`
- API endpoints automatically tested
- Docker health checks included

### Production Deployment
```bash
# Using production compose
docker-compose -f deploy/docker-compose.prod.yml up -d

# Or automated script
./deploy/scripts/deploy.sh production
```

## Key Features

- **Text-to-SQL**: Natural language queries converted to SQL
- **Session Management**: Persistent conversations with memory
- **Query Caching**: Performance optimization for repeated queries
- **Real-time Analytics**: System performance monitoring
- **Containerized**: Docker for consistent deployment
- **Health Monitoring**: Automated health checks and structured logging
- **Modern Dashboard**: A/B Testing analytics with Figma-based design
- **Dark/Light Theme**: Complete theme system with session isolation
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## Environment Variables

### Local Development (.env.local):
```bash
FLASK_ENV=development
OPENAI_API_KEY=your-openai-api-key
SECRET_KEY=dev-secret-key-local
LOG_LEVEL=DEBUG
```

### Cloud Run Production:
```bash
FLASK_ENV=production
OPENAI_API_KEY=your-openai-api-key  # Set via gcloud
FRONTEND_URL=https://your-frontend-url.run.app
SECRET_KEY=secure-production-key
LOG_LEVEL=INFO
PORT=8080
```

## Cloud Run Deployment

### Quick Deploy:
```bash
./deploy-cloudrun.sh
```

### Manual Deploy:
```bash
# Backend
gcloud builds submit ./backend --tag gcr.io/PROJECT_ID/retail-backend
gcloud run deploy retail-backend --image gcr.io/PROJECT_ID/retail-backend --region us-central1

# Frontend  
gcloud builds submit ./frontend --tag gcr.io/PROJECT_ID/retail-frontend
gcloud run deploy retail-frontend --image gcr.io/PROJECT_ID/retail-frontend --region us-central1
```