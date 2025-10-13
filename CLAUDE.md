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
- `get_filter_options()` → Returns 6 filter arrays from master tables with custom ordering (excludes "Control" palanca)
- `get_palancas_by_tipologia(tipologia)` → Returns palancas filtered by tipologia from store_master
- `get_fuentes_by_tipologia(tipologia)` → Returns data sources filtered by tipologia from ab_test_result
- `get_categorias_by_tipologia(tipologia)` → Returns categories filtered by tipologia with custom ordering
- `get_dashboard_results(tipologia, fuente, unidad, categoria)` → Table data with multiple filters
- `get_evolution_timeline_data(tipologia, fuente, unidad, categoria, palanca)` → Timeline data with palanca vs control, starts from first positive value
- `get_radar_chart_data(tipologia, fuente, unidad, categoria)` → Aggregated data for radar charts (excludes categories 5, 6, 7)
- `execute_query(sql_query)` → Text-to-SQL execution for chatbot
- `get_schema_info()` → Schema description for LLM context

### API Endpoints

**Chat:**
- `POST /api/chat/start` - Initialize chat session
- `POST /api/chat/message` - Send message to chatbot
- `GET /api/chat/history/{session_id}` - Get conversation history
- `POST /api/chat/suggested-questions` - Get AI-generated follow-up questions

**Dashboard:**
- `GET /api/dashboard/filter-options` - Get dynamic filter options with custom ordering from PostgreSQL master tables
- `GET /api/dashboard/palancas-by-tipologia?tipologia=X` - Get palancas filtered by tipologia
- `GET /api/dashboard/fuentes-by-tipologia?tipologia=X` - Get data sources filtered by tipologia
- `GET /api/dashboard/categorias-by-tipologia?tipologia=X` - Get categories filtered by tipologia
- `GET /api/dashboard/results?tipologia=X&fuente=Y&unidad=Z&categoria=W` - Get A/B test results with multiple filters
- `GET /api/dashboard/evolution-data?tipologia=X&fuente=Y&unidad=Z&categoria=W&palanca=P` - Get timeline chart data (starts from first positive value, includes project start date)
- `GET /api/dashboard/radar-data?tipologia=X&fuente=Y&unidad=Z&categoria=W` - Get aggregated radar chart data (excludes categories 5, 6, 7)
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
- **Dashboard.tsx**: Main container, manages global filter state (5 filters: tipología, palanca, fuente, unidad, categoría)
- **FilterPanel.tsx**: Left sidebar with dynamic filters from PostgreSQL (tipología-dependent filtering)
- **ResultsVisualization.tsx**: Toggle between table and radar chart views
- **ExperimentTable.tsx**: Results table with Source-Category groups and Unit sub-rows
- **RadarChartContainer.tsx**: Container managing 3 radar charts (one per typology)
- **RadarChartView.tsx**: Individual radar chart using Recharts with custom tooltips
- **TimelineChart.tsx**: Evolution chart with palanca vs control lines, starts from first positive value, shows project start marker with arrow
- **SummaryCards.tsx**: Static summary cards (top-left sidebar)

#### **Table Structure (ExperimentTable):**
- **Row Groups**: Combinations of `Source - Category` (e.g., "Sell In - Gatorade")
- **Sub-rows**: By Unit (Cajas 8oz, Ventas)
- **Columns**: Dynamic Palancas with icons
- **Cell Values**: `difference_vs_control` (colored) + `average_variation` (parentheses)
- **Percentage Format**: Values multiplied by 100 (0.3 → 30.0%)
- **Color Logic**: Green for positive, Red for negative

#### **Radar Chart Visualization:**
- **Dual View System**: Toggle between "Cuadro" (table) and "Visual" (radar charts)
- **3 Radar Charts**: One per typology (Super e hiper, Conveniencia, Droguerías)
- **Horizontal Layout**: 1x3 grid showing all typologies side by side
- **Color-Coded Titles**: Blue (#3b82f6), Green (#10b981), Orange (#f97316)
- **Data Aggregation**: Averages `difference_vs_control` across all source-category combinations per palanca
- **Category Filtering**: Excludes Electrolit (ID 5), Powerade (ID 6), Otros (ID 7) from calculations
- **Enhanced Tooltips**:
  - Shows palanca name
  - Breakdown by source-category with individual percentages
  - Final average (matches radar value)
  - Color-coded values (green for positive, red for negative)
- **Smart Label Wrapping**: Long palanca names automatically split into two lines
- **Filter Independence**: Always shows all 3 typologies regardless of selected filters
- **NaN Handling**: Converts PostgreSQL NaN values to 0.0 for JSON serialization

#### **Timeline Chart (Evolución Temporal):**
- **Dual Line Display**: Shows both palanca (treatment) and control group in same chart
- **Smart Start Point**: Timeline automatically starts from the first positive value of the palanca (control adapts to same date range)
- **Project Start Marker**: Visual arrow with "Fecha inicio de Palanca" label marking project start date
  - Calculated as mode (most frequent date) from `store_master.start_date_sellin` or `start_date_sellout`
  - Color-coded to match tipología (blue, green, or orange)
  - Custom SVG arrow component for visibility
- **Date Formatting**: X-axis displays dates in DD/MM format (e.g., "13/01", "20/01") instead of period labels
- **Color Coding**: Palanca line color matches selected tipología:
  - Super e hiper: Blue (#3b82f6)
  - Conveniencia: Green (#10b981)
  - Droguerías: Orange (#f97316)
- **Control Line**: Gray (#muted-foreground) dashed line for easy comparison
- **Required Filters**: Needs all 5 filters (tipología, fuente, unidad, categoría, palanca) to display
- **Missing Filter Handling**: Shows friendly message indicating which filters are needed

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

The dashboard includes an **enhanced filter system** with dynamic options and smart filtering from PostgreSQL:

#### **Filter Types (5 filters total):**
1. **Tipología**: Mandatory filter, always active (default: "Super e hiper")
   - Custom order: Super e hiper → Conveniencia → Droguerías
   - Controls all dependent filters (palanca, fuente, categoría)

2. **Palanca**: Optional filter (default: empty/no selection)
   - **Dynamically filtered** by selected tipología
   - Only shows palancas available for stores of selected tipología
   - Color-coded by tipología in timeline chart (blue, green, orange)

3. **Fuente de Datos**: Optional filter (default: "all")
   - **Dynamically filtered** by selected tipología
   - Only shows sources with data for selected tipología
   - Example: "Droguerías" excludes "Sell Out - SOM"

4. **Unidad de Medida**: Optional filter (default: "all")
   - Options: Cajas 8oz, Ventas

5. **Categoría**: Optional filter (default: "all")
   - **Dynamically filtered** by selected tipología
   - Custom order: Gatorade → Gatorade 500ml → Gatorade 1000ml → Gatorade Sugar-free → Electrolit → Powerade → Otros
   - Only shows categories with data for selected tipología

#### **Smart Filter Behavior:**
- **Auto-reset on tipología change**: When tipología changes, palanca, fuente, and categoría reset to default values
- **"Control" palanca excluded**: Filter logic excludes "Control" from all palanca options
- **'all' value handling**: Frontend uses `'all'` for "Todas" option, converted to `undefined` in API calls
- **Custom ordering**: Tipologías and categorías maintain specific display order regardless of database order

#### **Technical Details:**
- **All filters are dynamic**: Loaded from PostgreSQL master tables (no hardcoded values)
- **Tipología-dependent filtering**: Three endpoints provide filtered options based on tipología:
  - `/api/dashboard/palancas-by-tipologia?tipologia=X`
  - `/api/dashboard/fuentes-by-tipologia?tipologia=X`
  - `/api/dashboard/categorias-by-tipologia?tipologia=X`
- **SelectItem compatibility**: Uses `value="all"` instead of `value=""` for Radix UI compatibility
- **Filter persistence**: Global state managed in Dashboard.tsx, propagated to child components

#### **Data Flow:**
1. `FilterPanel.tsx` → Loads initial options from `/api/dashboard/filter-options`
2. `FilterPanel.tsx` → When tipología changes, loads filtered options from tipología-specific endpoints
3. `Dashboard.tsx` → Manages filter state with defaults and propagates to children
4. `ExperimentTable.tsx` → Converts 'all' to undefined, calls `/api/dashboard/results`
5. `TimelineChart.tsx` → Uses all 5 filters to load evolution data

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

### Prerequisites:
1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project YOUR_PROJECT_ID`
4. Create `.env` file with `OPENAI_API_KEY` (see `.env.example`)

### Quick Deploy (Recommended):
```bash
# Option 1: Automatic .env loading + enhanced deployment
./deploy.sh

# Option 2: Manual environment variable + enhanced deployment
export OPENAI_API_KEY=your-key-here
./deploy-app.sh

# Option 3: Set region (default: us-central1)
REGION=us-west1 ./deploy.sh
```

**What happens during deployment:**
- ✅ Pre-deployment health checks
- ✅ Backend deployment (builds + deploys to Cloud Run)
- ✅ Frontend deployment (builds with backend URL + deploys)
- ✅ Post-deployment validation
- ✅ Detailed logging to `deployment-YYYYMMDD-HHMMSS.log`

### Check Deployment Status:
```bash
./deployment-status.sh
```

### Manual Deploy (Advanced):
```bash
# 1. Configure project
gcloud config set project DG-firstApp

# 2. Deploy backend
./deploy-backend-cloudrun.sh

# 3. Get backend URL and deploy frontend
export BACKEND_URL=$(gcloud run services describe retail-backend --region=us-central1 --format="value(status.url)")
./deploy-frontend-cloudrun.sh
```

### Deployment Files:
- **`deploy.sh`** - Wrapper that auto-loads `.env` and calls `deploy-app.sh`
- **`deploy-app.sh`** - Enhanced deployment script with logging, validation, and monitoring
- **`deploy-backend-cloudrun.sh`** - Backend-specific deployment
- **`deploy-frontend-cloudrun.sh`** - Frontend-specific deployment
- **`deployment-status.sh`** - Quick status check for deployed services
- **`.gcloudignore`** - Files excluded from Cloud Build (in `backend/` and `frontend/`)

### Troubleshooting:
```bash
# View logs
gcloud run logs tail retail-backend --region=us-central1
gcloud run logs tail retail-frontend --region=us-central1

# Test endpoints
curl https://retail-backend-xxx.run.app/api/health
curl https://retail-frontend-xxx.run.app
```

---

## Recent Updates (2025-10-12)

### Timeline Chart Enhancements
- **Smart Start Point**: Chart now begins from first positive palanca value
- **Project Start Marker**: Visual arrow indicator showing "Fecha inicio de Palanca"
  - Calculated using mode of store start dates from `store_master`
  - Color-coded to match tipología
- **Date Display**: X-axis shows DD/MM format dates instead of period labels
- **Color Consistency**: Palanca line color matches tipología across all visualizations

### Dynamic Filter System
- **KPI Filter Removed**: Simplified to 5 core filters (tipología, palanca, fuente, unidad, categoría)
- **Tipología-Dependent Filtering**: Palanca, fuente, and categoría now filter dynamically based on selected tipología
  - New backend methods: `get_palancas_by_tipologia()`, `get_fuentes_by_tipologia()`, `get_categorias_by_tipologia()`
  - New API endpoints for filtered options
  - Example: "Droguerías" only shows relevant data sources
- **Auto-Reset**: Changing tipología automatically resets dependent filters to default values
- **Custom Ordering**:
  - Tipologías: Super e hiper → Conveniencia → Droguerías
  - Categorías: Gatorade → Gatorade 500ml → Gatorade 1000ml → Gatorade Sugar-free → Electrolit → Powerade → Otros

### Technical Improvements
- **Backend**: Added three new service methods for tipología-based filtering
- **API**: Three new GET endpoints for dynamic filter options
- **Frontend**: Enhanced FilterPanel with smart state management and auto-refresh on tipología change
- **Performance**: Filters load only relevant options, reducing UI clutter and improving UX