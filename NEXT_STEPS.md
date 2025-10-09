# 🚀 Próximos Pasos - Migración PostgreSQL

## ✅ Completado Hoy (Sesión 1 - ~2.5 horas)

- [x] Decisión PostgreSQL documentada
- [x] Schema PostgreSQL creado (`backend/database/schema.sql`)
- [x] Docker Compose configurado (`docker-compose.postgres.yml`)
- [x] Script de migración Excel→PostgreSQL (`backend/scripts/migrate_excel_to_postgres.py`)
- [x] UnifiedDatabaseService con SQLAlchemy (`backend/app/services/unified_database_service.py`)
- [x] Dependencies actualizadas (psycopg2, SQLAlchemy, alembic)
- [x] Documentación completa en `MIGRACION_UNIFICACION_DATOS.md`

---

## 🔥 Para Empezar Mañana

### **PASO 1: Levantar PostgreSQL (15 min)**

```bash
# 1. Asegurar .env existe con OPENAI_API_KEY
cp .env.example .env
# Editar .env: agregar tu OPENAI_API_KEY

# 2. Levantar solo PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d db

# 3. Ver logs (verificar que inició correctamente)
docker-compose -f docker-compose.postgres.yml logs db

# Deberías ver: "database system is ready to accept connections"
```

### **PASO 2: Migrar Datos desde Excel (15 min)**

```bash
# Instalar dependencias Python (si no están)
pip install psycopg2-binary pandas openpyxl

# Ejecutar migración
python backend/scripts/migrate_excel_to_postgres.py --truncate

# Validar que se migraron los datos
python backend/scripts/migrate_excel_to_postgres.py --validate-only

# Deberías ver el conteo de filas de cada tabla
```

### **PASO 3: Verificar Datos en PostgreSQL (10 min)**

```bash
# Conectar a PostgreSQL vía CLI
docker exec -it gatorade_postgres psql -U gatorade_user -d gatorade_ab_testing

# Dentro de psql, ejecutar:
\dt                           # Ver todas las tablas
SELECT COUNT(*) FROM store_master;
SELECT * FROM v_chatbot_complete LIMIT 5;
\q                            # Salir
```

**O usar pgAdmin (GUI):**
```bash
# Levantar pgAdmin
docker-compose -f docker-compose.postgres.yml --profile tools up -d

# Acceder: http://localhost:5050
# Email: admin@gatorade.com
# Password: admin

# Agregar servidor:
# Host: db
# Port: 5432
# User: gatorade_user
# Password: gatorade_dev_password (o el de tu .env)
```

---

## 📋 Siguientes Bloques de Trabajo

### **BLOQUE 1: Migrar Dashboard Endpoints (2 horas)**

**Archivo:** `backend/app/routes/analytics.py`

Cambiar:
```python
from app.services.excel_service import excel_service

@analytics_bp.route('/api/dashboard/results', methods=['GET'])
def get_dashboard_results():
    tipologia = request.args.get('tipologia')
    results = excel_service.get_results_data(tipologia)
    return jsonify(results), 200
```

Por:
```python
from app.services.unified_database_service import unified_db

@analytics_bp.route('/api/dashboard/results', methods=['GET'])
def get_dashboard_results():
    tipologia = request.args.get('tipologia')
    results = unified_db.get_dashboard_results(tipologia)
    return jsonify(results), 200
```

**Endpoints a actualizar:**
- `/api/dashboard/results`
- `/api/dashboard/evolution-data`
- `/api/dashboard/filter-options`

**Testing:**
```bash
# Levantar backend con PostgreSQL
docker-compose -f docker-compose.postgres.yml up backend

# En otra terminal, testear:
curl http://localhost:5000/api/dashboard/results
curl http://localhost:5000/api/dashboard/filter-options
```

### **BLOQUE 2: Migrar Chatbot (2 horas)**

**Archivo:** `backend/app/chatbot.py`

Cambiar:
```python
from app.data_store import DataStore
from app.sql_engine import SQLEngine

class ABTestingChatbot:
    def __init__(self):
        self.data_store = DataStore()
        self.sql_engine = SQLEngine()
```

Por:
```python
from app.services.unified_database_service import unified_db

class ABTestingChatbot:
    def __init__(self):
        self.db_service = unified_db
```

Actualizar métodos:
- `get_response()` → usar `self.db_service.get_schema_info()`
- `_execute_sql_from_response()` → usar `self.db_service.execute_query()`

**Testing:**
```bash
curl -X POST http://localhost:5000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@test.com"}'

# Guardar el session_id y enviar mensaje:
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"session_id":"SESSION_ID", "message":"¿Cuántas tiendas hay?"}'
```

### **BLOQUE 3: Tests Automatizados (1 hora)**

Crear: `backend/tests/test_unified_database.py`

```python
import unittest
from app.services.unified_database_service import unified_db

class TestUnifiedDatabase(unittest.TestCase):
    def test_connection(self):
        self.assertTrue(unified_db.health_check())

    def test_dashboard_results(self):
        result = unified_db.get_dashboard_results()
        self.assertTrue(result['success'])

    def test_chatbot_query(self):
        result = unified_db.execute_query("SELECT COUNT(*) FROM store_master")
        self.assertTrue(result['success'])

if __name__ == '__main__':
    unittest.main()
```

Ejecutar:
```bash
python -m pytest backend/tests/test_unified_database.py -v
```

---

## 📊 Checklist de Migración

### Base de Datos
- [ ] PostgreSQL corriendo en Docker
- [ ] Datos migrados desde Excel
- [ ] Vistas SQL funcionando
- [ ] Índices creados

### Backend
- [ ] `analytics.py` usa `unified_db`
- [ ] `chatbot.py` usa `unified_db`
- [ ] `chatbot_service.py` actualizado
- [ ] Health check PostgreSQL agregado

### Testing
- [ ] Endpoints dashboard responden correctamente
- [ ] Chatbot responde con datos de PostgreSQL
- [ ] Frontend muestra datos (sin cambios)
- [ ] Tests automatizados pasan

### Cleanup
- [ ] Deprecar `data_store.py`
- [ ] Deprecar `sql_engine.py`
- [ ] Deprecar `excel_service.py`
- [ ] Actualizar imports en toda la app

---

## 🐛 Troubleshooting

### PostgreSQL no inicia
```bash
# Ver logs detallados
docker-compose -f docker-compose.postgres.yml logs db

# Verificar puerto no está ocupado
lsof -i :5432

# Reiniciar contenedor
docker-compose -f docker-compose.postgres.yml restart db
```

### Script de migración falla
```bash
# Verificar que Excel existe
ls -la app_db_20251008_2014.xlsx

# Verificar conexión PostgreSQL
docker exec -it gatorade_postgres psql -U gatorade_user -d gatorade_ab_testing -c "SELECT 1"

# Ver errores detallados
python backend/scripts/migrate_excel_to_postgres.py --truncate 2>&1 | tee migration.log
```

### Backend no conecta a PostgreSQL
```bash
# Verificar DATABASE_URL en .env
cat .env | grep DATABASE_URL

# Verificar que backend puede alcanzar db
docker-compose -f docker-compose.postgres.yml exec backend ping db

# Ver logs de backend
docker-compose -f docker-compose.postgres.yml logs backend
```

---

## 📞 Contacto y Soporte

- **Documentación completa:** `MIGRACION_UNIFICACION_DATOS.md`
- **Schema SQL:** `backend/database/schema.sql`
- **Service principal:** `backend/app/services/unified_database_service.py`

**Progreso:** ~30% completado | ~7-10 días restantes
