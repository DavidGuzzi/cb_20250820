# 🚀 Estado del Despliegue - DG-firstApp

**Última actualización**: 2025-10-13
**Proyecto**: DG-firstApp
**Región**: us-central1

---

## ✅ Despliegue Actual

### Backend
- **URL**: https://retail-backend-t2cfqx56wq-uc.a.run.app
- **Estado**: ✅ Funcionando correctamente
- **Base de Datos**: PostgreSQL embebido (localhost:5432)
- **Datos**: 38,470+ registros cargados
- **Encoding**: UTF-8 completo (C.UTF-8)

### Frontend
- **URL**: Pendiente de actualizar con nueva URL del backend
- **Estado**: Requiere redespliegue con BACKEND_URL actualizada

---

## 📁 Archivos de Despliegue Verificados

### ✅ Scripts Listos
- **`deploy-backend-cloudrun.sh`** - Despliegue backend standalone
- **`deploy-frontend-cloudrun.sh`** - Despliegue frontend standalone
- **`deploy-app.sh`** - Despliegue completo (backend + frontend)
- **`deploy.sh`** - Wrapper con auto-carga de .env
- **`deployment-status.sh`** - Verificación de estado

### ✅ Configuración de Build
- **`backend/cloudbuild.yaml`** - Usa `Dockerfile.cloudrun` (con PostgreSQL)
- **`frontend/cloudbuild.yaml`** - Recibe `_BACKEND_URL` como substitución
- **`backend/.gcloudignore`** - Excluye archivos innecesarios (427 bytes)
- **`frontend/.gcloudignore`** - Excluye archivos innecesarios (483 bytes)

### ✅ Dockerfile y Scripts
- **`backend/Dockerfile.cloudrun`** - Multi-stage con PostgreSQL 17
- **`backend/docker-entrypoint.sh`** - Inicialización automática (UTF-8)
- **`backend/database/init_complete.sql`** - Dump completo (3.1 MB)
- **`frontend/Dockerfile.simple`** - Build de React con Vite

---

## 🔄 Proceso de Despliegue para Nuevos Cambios

### Opción 1: Despliegue Completo (Recomendado)
```bash
# Carga automáticamente .env con OPENAI_API_KEY
./deploy.sh
```

### Opción 2: Despliegue Manual (Backend + Frontend)
```bash
# 1. Desplegar backend
export OPENAI_API_KEY='tu-api-key'
./deploy-backend-cloudrun.sh

# 2. Obtener URL del backend
export BACKEND_URL=$(gcloud run services describe retail-backend --region=us-central1 --format="value(status.url)")

# 3. Desplegar frontend
./deploy-frontend-cloudrun.sh
```

### Opción 3: Solo Backend (cambios en API)
```bash
export OPENAI_API_KEY='tu-api-key'
./deploy-backend-cloudrun.sh
```

### Opción 4: Solo Frontend (cambios en UI)
```bash
export BACKEND_URL='https://retail-backend-t2cfqx56wq-uc.a.run.app'
./deploy-frontend-cloudrun.sh
```

---

## 🔄 Actualizar Datos de PostgreSQL

Cuando necesites actualizar los datos (ej: cambios en Excel):

```bash
# 1. Levantar PostgreSQL local
docker-compose -f docker-compose.postgres.yml up -d

# 2. Migrar datos actualizados
python backend/scripts/migrate_excel_to_postgres.py --truncate

# 3. Generar nuevo dump SQL
docker exec gatorade_postgres pg_dump -U gatorade_user -d gatorade_ab_testing --clean --if-exists > backend/database/init_complete.sql

# 4. Verificar tamaño del dump
ls -lh backend/database/init_complete.sql

# 5. Desplegar backend con datos actualizados
export OPENAI_API_KEY='tu-api-key'
./deploy-backend-cloudrun.sh
```

---

## 🧪 Verificación Post-Despliegue

### Health Checks
```bash
# Backend
curl https://retail-backend-t2cfqx56wq-uc.a.run.app/api/health

# Dashboard data summary
curl https://retail-backend-t2cfqx56wq-uc.a.run.app/api/dashboard/data-summary

# Frontend
curl -I https://retail-frontend-XXX.run.app
```

### Ver Logs
```bash
# Backend
gcloud run logs tail retail-backend --region=us-central1 --limit=50

# Frontend
gcloud run logs tail retail-frontend --region=us-central1 --limit=50

# Filtrar errores
gcloud run logs tail retail-backend --region=us-central1 | grep -i error
```

### Verificar Encoding
```bash
# Revisar si hay problemas de UTF-8
gcloud run logs tail retail-backend --region=us-central1 | grep -i "utf\|ascii\|encoding"
```

---

## 📊 Características del Despliegue Actual

### ✅ Ventajas
- **Sin Cloud SQL**: $0/mes en costos de base de datos
- **Autocontenido**: Backend incluye PostgreSQL embebido
- **UTF-8 Completo**: Soporte para caracteres en español (Bogotá, Droguerías, etc.)
- **Rápido**: Inicialización en ~40 segundos (incluyendo DB)
- **Datos Precargados**: 38,470+ registros listos al iniciar

### ⚠️ Limitaciones
- **Stateless**: Cambios en DB no persisten entre reinicios
- **Solo Lectura**: Ideal para datos estáticos de análisis
- **Reinicio = Recarga**: Cada reinicio carga el dump desde cero

### 💡 Ideal Para
- ✅ Datos de A/B testing (históricos, no cambian frecuentemente)
- ✅ Dashboards de análisis
- ✅ Aplicaciones de demostración
- ✅ Reducción de costos en producción

---

## 🔧 Troubleshooting Común

### Error: "OPENAI_API_KEY not found"
```bash
# Verificar .env
cat .env | grep OPENAI_API_KEY

# O exportar manualmente
export OPENAI_API_KEY='sk-proj-...'
```

### Error: "No Google Cloud project configured"
```bash
gcloud config set project dg-firstapp
```

### Error: ASCII encoding
```bash
# El problema ya está resuelto con UTF-8 en docker-entrypoint.sh
# Si persiste, verificar logs:
gcloud run logs tail retail-backend --region=us-central1 | grep -i encoding
```

### Build timeout
```bash
# Aumentar timeout del build
gcloud config set builds/timeout 1200
```

---

## 📝 Notas Importantes

1. **Siempre usa** `.env` con `OPENAI_API_KEY` o exporta la variable antes de desplegar
2. **El dump SQL** (`backend/database/init_complete.sql`) debe estar actualizado antes de desplegar
3. **Frontend necesita** la URL del backend (`BACKEND_URL`) para funcionar
4. **Logs detallados** se guardan en `deployment-YYYYMMDD-HHMMSS.log` al usar `deploy-app.sh`
5. **Cold starts** toman ~40 segundos debido a inicialización de PostgreSQL

---

## 🎯 Próximos Pasos

1. ✅ **COMPLETADO**: Backend con PostgreSQL embebido desplegado
2. 🔄 **PENDIENTE**: Redesplegar frontend con nueva URL del backend
3. 🔄 **PENDIENTE**: Verificar que dashboard y chatbot funcionan correctamente
4. 📊 **RECOMENDADO**: Configurar alertas en Cloud Monitoring
5. 🔒 **OPCIONAL**: Configurar dominio personalizado

---

**Documentación completa**: Ver `CLAUDE.md` sección "Cloud Run Deployment"
