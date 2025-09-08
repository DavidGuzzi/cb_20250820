# 🚀 Deployment Scripts

Sistema completo de scripts para deployment secuencial de la aplicación Retail Analytics en Google Cloud Run.

## Scripts Disponibles

### 1. `deploy-app.sh` - Deployment Completo (Recomendado)
Script principal con funcionalidades avanzadas:
- ✅ Deployment secuencial (backend → frontend)
- ✅ Validación de prerrequisitos
- ✅ Health checks pre y post deployment
- ✅ Logging detallado con timestamps
- ✅ Manejo de errores y rollback automático
- ✅ Monitoreo de progreso en tiempo real

```bash
# Deployment completo
./deploy-app.sh

# Ver ayuda
./deploy-app.sh --help

# Deployment en región específica
REGION=us-west1 ./deploy-app.sh
```

### 2. `update-app.sh` - Update Rápido
Script optimizado para actualizaciones rutinarias:
- ⚡ Ejecución rápida y minimal downtime
- ✅ Health checks básicos
- ✅ Logging simplificado
- ✅ Ideal para updates frecuentes

```bash
# Update rápido de ambos servicios
./update-app.sh
```

### 3. `deployment-status.sh` - Estado de Servicios
Verificación del estado actual de los servicios:
- 📊 Status completo de backend y frontend
- 🏥 Health checks automáticos
- 📈 Información de revisiones actuales
- 🧪 Test de integración end-to-end

```bash
# Ver estado actual
./deployment-status.sh
```

### 4. `rollback-app.sh` - Rollback Inteligente
Rollback a revisión anterior en caso de problemas:
- 🔄 Rollback de servicios individuales o ambos
- 📋 Listado de revisiones disponibles
- 🧪 Modo dry-run para testing
- ✅ Validación post-rollback

```bash
# Rollback completo
./rollback-app.sh

# Rollback solo backend
./rollback-app.sh backend

# Ver revisiones disponibles
./rollback-app.sh --list

# Dry run (sin cambios)
./rollback-app.sh --dry-run
```

## Requisitos

### Variables de Entorno
```bash
export OPENAI_API_KEY=your-openai-api-key
export REGION=us-central1  # Opcional, por defecto us-central1
```

### Herramientas Requeridas
- `gcloud` CLI configurado y autenticado
- Proyecto de Google Cloud configurado
- Docker (para builds locales)
- `curl` (para health checks)

## Configuración Inicial

1. **Configurar gcloud:**
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2. **Configurar variables de entorno:**
```bash
export OPENAI_API_KEY=your-openai-api-key
```

3. **Verificar configuración:**
```bash
./deployment-status.sh
```

## Flujo de Trabajo Recomendado

### Primer Deployment
```bash
# 1. Deployment inicial completo
./deploy-app.sh

# 2. Verificar estado
./deployment-status.sh
```

### Updates Regulares
```bash
# 1. Update rápido
./update-app.sh

# 2. Verificar estado
./deployment-status.sh
```

### En Caso de Problemas
```bash
# 1. Ver revisiones disponibles
./rollback-app.sh --list

# 2. Test de rollback (sin cambios)
./rollback-app.sh --dry-run

# 3. Rollback efectivo
./rollback-app.sh

# 4. Verificar estado post-rollback
./deployment-status.sh
```

## Arquitectura de Deployment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   deploy-app    │    │   update-app    │    │deployment-status│
│   (completo)    │    │   (rápido)      │    │   (monitor)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  rollback-app   │
                    │  (recovery)     │
                    └─────────────────┘
```

## Funcionalidades Avanzadas

### Logging y Monitoreo
- Logs detallados con timestamps en `deployment-YYYYMMDD-HHMMSS.log`
- Códigos de color para mejor legibilidad
- Tracking de tiempo de deployment
- Health checks automáticos

### Seguridad y Validación
- Validación de prerrequisitos antes de deployment
- Health checks pre y post deployment
- Rollback automático en caso de falla
- Test de integración end-to-end

### Performance
- Deployment secuencial optimizado
- Minimal downtime durante updates
- Cache de builds para mayor velocidad
- Monitoreo de recursos durante deployment

## Solución de Problemas

### Error: "Service not found"
```bash
# Verificar proyecto y región
gcloud config get-value project
echo $REGION

# Listar servicios existentes
gcloud run services list --region=$REGION
```

### Error: "Health check failed"
```bash
# Ver logs del servicio
gcloud run logs tail retail-backend --region=$REGION
gcloud run logs tail retail-frontend --region=$REGION

# Verificar estado
./deployment-status.sh
```

### Error: "Authentication failed"
```bash
# Re-autenticar
gcloud auth login
gcloud auth application-default login
```

## Comandos Útiles

```bash
# Ver logs en tiempo real
gcloud run logs tail retail-backend --region=$REGION
gcloud run logs tail retail-frontend --region=$REGION

# Listar revisiones
gcloud run revisions list --service=retail-backend --region=$REGION

# Ver configuración actual
gcloud run services describe retail-backend --region=$REGION

# Test manual de endpoints
curl https://your-backend-url/api/health
curl -I https://your-frontend-url
```

## Migración desde Scripts Anteriores

Si ya tienes deployment funcionando con `deploy-cloudrun.sh`:

1. **Backup del script actual:**
```bash
cp deploy-cloudrun.sh deploy-cloudrun.sh.backup
```

2. **Usar nuevo sistema:**
```bash
# En lugar de ./deploy-cloudrun.sh
./deploy-app.sh

# Para updates frecuentes
./update-app.sh
```

3. **Los scripts originales siguen funcionando** como fallback.

---

**💡 Tip:** Usa `./deploy-app.sh` para deployments completos y `./update-app.sh` para updates rápidos del día a día.