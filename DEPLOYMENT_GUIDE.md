# 🚀 Guía Rápida de Despliegue - DG-firstApp

## Preparación Inicial (Solo una vez)

### 1. Instalar Google Cloud SDK
```bash
# Instalar gcloud CLI
# https://cloud.google.com/sdk/docs/install

# Autenticarse
gcloud auth login

# Configurar proyecto
gcloud config set project DG-firstApp
```

### 2. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env y agregar tu OPENAI_API_KEY
# OPENAI_API_KEY=sk-...
```

## Despliegue a Cloud Run

### ✅ Método Recomendado (Automático)
```bash
# Este comando:
# 1. Carga automáticamente .env
# 2. Verifica prerequisites
# 3. Ejecuta health checks pre-deployment
# 4. Despliega backend + frontend
# 5. Valida el despliegue
# 6. Genera log detallado

./deploy.sh
```

### 📋 Métodos Alternativos

**Opción 1: Con variable manual**
```bash
export OPENAI_API_KEY=your-key-here
./deploy-app.sh
```

**Opción 2: Cambiar región**
```bash
REGION=us-west1 ./deploy.sh
```

**Opción 3: Despliegue paso a paso (avanzado)**
```bash
# 1. Backend primero
./deploy-backend-cloudrun.sh

# 2. Obtener URL del backend
export BACKEND_URL=$(gcloud run services describe retail-backend --region=us-central1 --format="value(status.url)")

# 3. Frontend
./deploy-frontend-cloudrun.sh
```

## Verificación Post-Despliegue

### Verificar Estado
```bash
./deployment-status.sh
```

### Ver Logs
```bash
# Backend
gcloud run logs tail retail-backend --region=us-central1

# Frontend
gcloud run logs tail retail-frontend --region=us-central1
```

### Probar Endpoints
```bash
# Health check del backend
curl https://retail-backend-XXX.us-central1.run.app/api/health

# Frontend
curl -I https://retail-frontend-XXX.us-central1.run.app
```

## Archivos de Despliegue

### Scripts Principales
- **`deploy.sh`** → 🎯 Wrapper con auto-carga de .env (RECOMENDADO)
- **`deploy-app.sh`** → Script maestro avanzado con logging y validaciones
- **`deployment-status.sh`** → Verificar estado de servicios desplegados

### Scripts Auxiliares
- **`deploy-backend-cloudrun.sh`** → Deploy backend específico
- **`deploy-frontend-cloudrun.sh`** → Deploy frontend específico
- **`rollback-app.sh`** → Rollback a versión anterior
- **`update-app.sh`** → Actualización rápida sin rebuild completo

### Archivos de Configuración
- **`backend/.gcloudignore`** → Excluye archivos innecesarios del build
- **`frontend/.gcloudignore`** → Excluye archivos innecesarios del build
- **`backend/cloudbuild.yaml`** → Config de Cloud Build para backend
- **`frontend/cloudbuild.yaml`** → Config de Cloud Build para frontend
- **`backend/Dockerfile.cloudrun`** → Dockerfile optimizado para backend
- **`frontend/Dockerfile.simple`** → Dockerfile optimizado para frontend

## Estructura de Servicios Cloud Run

### Backend Service
- **Nombre**: `retail-backend`
- **Puerto**: 8080
- **Memoria**: 1Gi
- **CPU**: 1
- **Timeout**: 300s
- **Max Instances**: 10
- **Concurrency**: 80

### Frontend Service
- **Nombre**: `retail-frontend`
- **Puerto**: 8080
- **Memoria**: 512Mi
- **CPU**: 1
- **Timeout**: 300s
- **Max Instances**: 10
- **Concurrency**: 80

## Troubleshooting

### Error: "OPENAI_API_KEY not found"
```bash
# Verificar que .env existe
cat .env | grep OPENAI_API_KEY

# O exportar manualmente
export OPENAI_API_KEY=your-key-here
```

### Error: "No Google Cloud project configured"
```bash
gcloud config set project DG-firstApp
```

### Error: "Backend health check failed"
```bash
# Ver logs del backend
gcloud run logs tail retail-backend --region=us-central1

# Verificar variables de entorno
gcloud run services describe retail-backend --region=us-central1
```

### Build falla por archivos grandes
Los archivos `.gcloudignore` ya están configurados para excluir:
- `node_modules/`
- `__pycache__/`
- `.env` y archivos de configuración local
- Tests y documentación

## Flujo de Despliegue (deploy.sh)

```
┌──────────────────────┐
│  Cargar .env         │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Verificar gcloud    │
│  + OPENAI_API_KEY    │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Health Check        │
│  Pre-deployment      │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Deploy Backend      │
│  (Build + Push + Run)│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Deploy Frontend     │
│  (Build + Push + Run)│
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Validación          │
│  Post-deployment     │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│  Resumen + URLs      │
│  + Log guardado      │
└──────────────────────┘
```

## Siguientes Pasos Post-Despliegue

1. ✅ Verificar que ambos servicios estén corriendo
2. ✅ Probar la aplicación en el navegador
3. 📊 Configurar monitoreo en Google Cloud Console
4. 🔒 Configurar dominio personalizado (opcional)
5. 📈 Configurar alertas de Cloud Monitoring
6. 💾 Configurar backups de PostgreSQL (si aplica)

## Costos Estimados

Cloud Run cobra por:
- **CPU**: Solo cuando procesa requests
- **Memoria**: Solo cuando procesa requests
- **Requests**: $0.40 por millón
- **Networking**: Ingress gratis, egress según uso

**Free tier mensual**:
- 2 millones de requests
- 360,000 GB-segundos de memoria
- 180,000 vCPU-segundos

---

**Proyecto**: DG-firstApp
**Región**: us-central1 (configurable)
**Stack**: Flask + React + PostgreSQL
**Última actualización**: 2025-10-13
