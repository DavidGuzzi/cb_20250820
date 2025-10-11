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
- **UnifiedDatabaseService**: PostgreSQL integration with SQLAlchemy and connection pooling
- **Structured Logging**: JSON logs for production monitoring

#### **UnifiedDatabaseService Methods:**
- `get_filter_options()` → Returns 6 filter arrays from master tables (excludes "Control" palanca)
- `get_dashboard_results(tipologia, fuente, unidad, categoria)` → Table data with multiple filters
- `get_evolution_data(palanca, kpi, tipologia)` → Timeline data (accepts names, not IDs)
- `execute_query(sql_query)` → Text-to-SQL execution for chatbot
- `get_schema_info()` → Schema description for LLM context

### API Endpoints

**Chat:**
- `POST /api/chat/start` - Initialize chat session
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/history/{session_id}` - Get conversation history
- `POST /api/chat/suggested-questions` - Get AI-generated follow-up questions

**Dashboard:**
- `GET /api/dashboard/filter-options` - Get dynamic filter options from PostgreSQL master tables
- `GET /api/dashboard/results?tipologia=X&fuente=Y&unidad=Z&categoria=W` - Get A/B test results with multiple filters
- `GET /api/dashboard/evolution-data?palanca=X&kpi=Y&tipologia=Z` - Get timeline chart data (accepts names, not IDs)
- `GET /api/dashboard/data-summary` - Get data summary and row counts

**Health & Analytics:**
- `GET /api/health` - Health check
- `GET /api/analytics/sessions` - System metrics and cache stats

### Frontend Structure
- **React + TypeScript + Vite** stack
- **Tailwind CSS** with **shadcn/ui** component library (Radix UI components)
- **Custom hooks**: useChat for chat state management
- **API Service**: Centralized API communication with typed interfaces
- **Local persistence**: localStorage for session continuity
- **Theme System**: Dark/Light mode with ThemeProvider context
- **Modern Dashboard**: Figma-based design with dynamic A/B testing analytics

#### **Dashboard Components:**
- **Dashboard.tsx**: Main container, manages global filter state (6 filters)
- **FilterPanel.tsx**: Left sidebar with dynamic filters from PostgreSQL
- **ExperimentTable.tsx**: Results table with Source-Category groups and Unit sub-rows
- **TimelineChart.tsx**: Evolution chart using Recharts (LineChart)
- **SummaryCards.tsx**: Static summary cards (top-left sidebar)

#### **Table Structure (ExperimentTable):**
- **Row Groups**: Combinations of `Source - Category` (e.g., "Sell In - Gatorade")
- **Sub-rows**: By Unit (Cajas 8oz, Ventas)
- **Columns**: Dynamic Palancas with icons
- **Cell Values**: `difference_vs_control` (colored) + `average_variation` (parentheses)
- **Percentage Format**: Values multiplied by 100 (0.3 → 30.0%)
- **Color Logic**: Green for positive, Red for negative

### Data Layer
- **PostgreSQL Database**: Unified data source for both Dashboard and Chatbot
- **225 stores** with A/B testing data across multiple cities
- **10 master tables + 2 fact tables**: Normalized schema for scalability
- **Text-to-SQL**: Natural language queries executed on PostgreSQL
- **Real-time analytics**: Cache performance and session metrics
- **38,470+ records**: Including experiments, stores, periods, and categories

## Development Workflow

### Quick Start (PostgreSQL)
1. `cp .env.example .env` (add OPENAI_API_KEY)
2. `docker-compose -f docker-compose.postgres.yml up -d`
3. Frontend: http://localhost:5173
4. Backend API: http://localhost:5000/api
5. PostgreSQL: localhost:5432
6. (Optional) pgAdmin: http://localhost:5050 (run with `--profile tools`)

### Legacy Quick Start (In-Memory SQLite)
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
- **Integrated Filters**: Global filter system that impacts both table and timeline chart
- **Dark/Light Theme**: Complete theme system with session isolation
- **Responsive Design**: Mobile-friendly interface with adaptive layouts
- **AI-Powered Suggested Questions**: Contextual follow-up questions with OpenAI integration and intelligent flow management

### Dashboard Filter System

The dashboard includes an **enhanced filter system** with dynamic options from PostgreSQL:

#### **Filter Types:**
1. **Table Filters** (Impact ExperimentTable):
   - **Tipología**: Mandatory filter, always active (default: "Super e hiper")
   - **Fuente de Datos**: Optional filter (Sell In, Sell Out, etc.) - Default: "all"
   - **Unidad de Medida**: Optional filter (Cajas 8oz, Ventas) - Default: "all"
   - **Categoría**: Optional filter (Gatorade, Electrolit, etc.) - Default: "all"

2. **Timeline Filters** (Impact TimelineChart only):
   - **Palanca**: Required for timeline (default: "Punta de góndola")
   - **KPI**: Required for timeline (default: "Cajas 8oz")

#### **Technical Details:**
- **All filters are dynamic**: Loaded from PostgreSQL master tables (no hardcoded values)
- **"Control" palanca excluded**: Filter logic excludes "Control" from palanca options
- **'all' value handling**: Frontend uses `'all'` for "Todas" option, converted to `undefined` in API calls
- **SelectItem compatibility**: Uses `value="all"` instead of `value=""` for Radix UI compatibility
- **Filter persistence**: Global state managed in Dashboard.tsx, propagated to child components

#### **Data Flow:**
1. `FilterPanel.tsx` → Loads options from `/api/dashboard/filter-options`
2. `Dashboard.tsx` → Manages filter state with defaults
3. `ExperimentTable.tsx` → Converts 'all' to undefined, calls `/api/dashboard/results`
4. `TimelineChart.tsx` → Uses palanca/kpi names directly (no ID conversion)

### Intelligent Suggested Questions System

The chatbot now includes an advanced suggested questions system with contextual AI-generated follow-ups:

#### **Core Features:**
- **Initial Questions**: 4 curated questions appear below the welcome message for new conversations
- **Contextual Follow-ups**: After each bot response, AI generates 4 new relevant questions based on conversation context
- **Smart Limits**: Maximum 4 suggested questions per session, then automatic switch to free-text mode
- **Visual Flow Indicators**: Users see their progress (1/4, 2/4, etc.) and mode transitions
- **Session Isolation**: Each new session resets to suggested mode regardless of previous sessions

#### **Technical Architecture:**

**Backend (Python/Flask):**
- **QuestionGeneratorService**: Uses OpenAI GPT-3.5-turbo for contextual question generation with intelligent fallback to rule-based questions
- **New Endpoint**: `POST /api/chat/suggested-questions` for dynamic question generation
- **ChatbotService Enhanced**: Every bot response now includes `suggested_questions` array
- **Caching Strategy**: Generated questions cached for 30 minutes to optimize API usage

**Frontend (React/TypeScript):**
- **useChat Hook Extended**: Manages suggested questions state, counters, and mode transitions
- **Enhanced ChatContext**: Includes `suggestedQuestions`, `suggestedQuestionsCount`, `isInSuggestedMode`, and `sendSuggestedQuestion()`
- **Smart UI**: Questions appear as interactive cards below bot messages with responsive multi-line layout
- **State Persistence**: Per-user localStorage with intelligent session reset logic

#### **User Experience Flow:**
1. **Session Start**: User sees welcome message + 4 initial questions
2. **Question Selection**: Click sends question and increments counter (1/4, 2/4, etc.)
3. **Bot Response + New Questions**: AI generates 4 contextual follow-ups based on conversation
4. **Progression**: Continue up to 4 suggested questions total
5. **Mode Transition**: Auto-switch to free-text after 4 questions OR manual typing
6. **Session Reset**: Each new session starts fresh in suggested mode

#### **AI Question Generation:**
- **Primary**: OpenAI analysis of conversation context for relevant follow-ups
- **Fallback**: Rule-based questions categorized by context (PDV analysis, revenue analysis, etc.)
- **Categories**: `pdv_analysis`, `revenue_analysis`, `conversion_analysis`, `regional_analysis`
- **Context Awareness**: Uses last 3 conversation exchanges for optimal relevance

#### **Visual Design:**
- **Responsive Buttons**: Auto-expand height for long questions with proper line breaks
- **Mode Indicators**: Visual badges showing current mode and progress
- **Fixed Width Chat**: 35% viewport width (min 450px) to prevent layout shifts
- **Smooth Transitions**: Hover effects and visual feedback for better UX

### Enhanced Chatbot UI & UX

The chatbot interface has been significantly improved for better user experience:

#### **Visual Enhancements:**
- **Gradient Icons**: Bot uses blue-purple gradient with Bot icon, User uses orange-red gradient with Star icon
- **Animated Elements**: Bot icon pulses during typing, connection status indicator with green pulse
- **Improved Branding**: Consistent color scheme and professional visual identity
- **Message Styling**: Enhanced message bubbles with gradients, shadows, and hover effects
- **Typing Indicator**: Colorful bouncing dots matching the bot's brand colors

#### **Smart Focus Management:**
- **Intelligent Auto-Focus**: Input maintains focus during active conversations
- **Conversation Flow Focus**: Automatic focus after sending messages and receiving responses  
- **Respectful Navigation**: Allows natural UI navigation without aggressive focus stealing
- **Chat Area Detection**: Focus only when interacting within chat area (`data-chat-area`)
- **React.forwardRef Fix**: Proper ref handling for Input component ensures focus system works reliably

#### **Technical Implementation:**
- **RequestAnimationFrame**: Uses modern animation frame timing for smooth focus transitions
- **Event Listener Optimization**: Minimal, targeted event listeners for better performance
- **Focus State Management**: Tracks conversation state to determine appropriate focus behavior
- **Anti-Pattern Prevention**: Prevents focus conflicts with scroll animations and UI interactions

## PostgreSQL Database

### Schema Overview
- **10 Master Tables**:
  - `city_master`: City names (Bogotá, Medellín, Cali, etc.)
  - `typology_master`: Store types (Super e hiper, Conveniencia, Droguerías)
  - `lever_master`: Marketing levers/palancas (Punta de góndola, Metro cuadrado, etc.)
  - `category_master`: Product categories (Gatorade, Electrolit, Powerade, etc.)
  - `measurement_unit_master`: Units (Cajas 8oz, Ventas)
  - `data_source_master`: Data sources (Sell In, Sell Out, Sell Out - SOM, etc.)
  - `period_master`: Time periods with start/end dates
  - `store_master`: 225 stores with city, typology, and lever assignments

- **2 Fact Tables**:
  - `ab_test_result`: 37,840 rows - Detailed A/B test results by store/period
  - `ab_test_summary`: 312 rows - Aggregated results by typology/lever/category

- **3 SQL Views** (for optimized queries):
  - `v_chatbot_complete`: Denormalized view with all JOINs for text-to-SQL
  - `v_dashboard_summary`: Aggregated view for ExperimentTable
  - `v_evolution_timeline`: Time-series view for TimelineChart

- **Indexes**: Optimized for both Dashboard queries and Chatbot text-to-SQL
- **Auto-triggers**: `updated_at` columns automatically maintained on UPDATE

### Data Migration
```bash
# Migrate data from Excel to PostgreSQL
python backend/scripts/migrate_excel_to_postgres.py --truncate

# Validate migration
python backend/scripts/migrate_excel_to_postgres.py --validate-only
```

### Database Access
```bash
# Connect to PostgreSQL CLI
docker exec -it gatorade_postgres psql -U gatorade_user -d gatorade_ab_testing

# View tables
\dt

# Sample queries
SELECT COUNT(*) FROM store_master;
SELECT * FROM v_chatbot_complete LIMIT 5;

# Exit
\q
```

### pgAdmin (Optional GUI)
```bash
# Start with pgAdmin
docker-compose -f docker-compose.postgres.yml --profile tools up -d

# Access: http://localhost:5050
# Email: admin@gatorade.com
# Password: admin (or check .env)
```

### Backup & Restore
```bash
# Backup
docker exec gatorade_postgres pg_dump -U gatorade_user gatorade_ab_testing > backup.sql

# Restore
docker exec -i gatorade_postgres psql -U gatorade_user gatorade_ab_testing < backup.sql
```

## Environment Variables

### Local Development with PostgreSQL (.env):
```bash
FLASK_ENV=development
OPENAI_API_KEY=your-openai-api-key
SECRET_KEY=dev-secret-key-local
LOG_LEVEL=DEBUG

# PostgreSQL Configuration
DB_PASSWORD=gatorade_dev_password
DATABASE_URL=postgresql://gatorade_user:gatorade_dev_password@db:5432/gatorade_ab_testing

# pgAdmin (optional)
PGADMIN_PASSWORD=admin
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