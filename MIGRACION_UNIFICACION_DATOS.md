# Plan de Migración: Unificación de Fuentes de Datos

## 📋 Resumen Ejecutivo

**Objetivo**: Migrar de fuentes de datos híbridas (datos simulados para chatbot + datos reales para dashboard) hacia una única fuente de verdad centralizada.

**Opciones evaluadas**: SQLite (recomendado) vs PostgreSQL

**Impacto**: Consistencia total entre chatbot y dashboard, eliminación de duplicación de datos, mejora en mantenimiento.

----

## 🎯 Situación Actual vs Objetivo

### **ANTES (Estado Híbrido)**
```
Chatbot:
├── data_store.py (datos simulados)
├── sql_engine.py (SQLite in-memory)
└── 8 PDVs + 3 meses ficticios

Dashboard:
├── API endpoints separados
├── Datos reales de A/B testing
└── Sin conexión con chatbot
```

### **DESPUÉS (Fuente Unificada)**
```
Base de Datos Única:
├── Todos los datos reales
├── Chatbot y Dashboard consumen la misma fuente
└── Consistencia garantizada
```

---

## 🛠️ OPCIÓN 1: Migración a SQLite (RECOMENDADA)

### **Ventajas**
- ✅ Ideal para datasets pequeños/medianos
- ✅ Sin dependencias externas
- ✅ Perfecto para text-to-SQL del LLM
- ✅ Deploy simple (archivo único)
- ✅ Performance excelente para reads
- ✅ Backup/restore trivial

### **Limitaciones**
- ⚠️ Concurrencia limitada (suficiente para la app actual)
- ⚠️ No escalable a múltiples instancias sin coordinación

---

## 📅 Plan de Implementación SQLite

### **FASE 1: Preparación y Análisis (1-2 días)**

#### **1.1 Auditoría de Datos Actuales**
```bash
# Tareas:
- Inventario completo de endpoints dashboard existentes
- Identificar estructura de datos reales vs simulados
- Mapear dependencies entre frontend y backend
- Documentar schemas actuales
```

#### **1.2 Diseño del Schema Unificado**
```sql
-- Archivo: backend/database/schema.sql

-- Tabla principal de experimentos A/B
CREATE TABLE experimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    tipologia TEXT NOT NULL,
    palanca TEXT NOT NULL,
    kpi TEXT NOT NULL,
    variacion_promedio REAL NOT NULL,
    diferencia_vs_control REAL NOT NULL,
    period TEXT,
    test_value REAL,
    control_value REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de maestros (mapeos)
CREATE TABLE maestros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL, -- 'tipologia', 'palanca', 'kpi'
    codigo INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    UNIQUE(tipo, codigo)
);

-- Tabla de PDVs (unificada)
CREATE TABLE pdvs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    region TEXT NOT NULL,
    tipo TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1
);

-- Tabla de métricas de revenue (para chatbot)
CREATE TABLE metricas_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pdv_codigo TEXT NOT NULL,
    periodo TEXT NOT NULL, -- YYYY-MM format
    revenue REAL NOT NULL,
    visitantes INTEGER NOT NULL,
    conversiones INTEGER NOT NULL,
    tasa_conversion REAL GENERATED ALWAYS AS (
        CASE WHEN visitantes > 0 
        THEN (CAST(conversiones AS REAL) / visitantes) * 100 
        ELSE 0 END
    ) STORED,
    revenue_por_visitante REAL GENERATED ALWAYS AS (
        CASE WHEN visitantes > 0 
        THEN revenue / visitantes 
        ELSE 0 END
    ) STORED,
    FOREIGN KEY (pdv_codigo) REFERENCES pdvs(codigo),
    UNIQUE(pdv_codigo, periodo)
);

-- Vista unificada para el chatbot (equivalente a vista_completa actual)
CREATE VIEW vista_completa AS
SELECT 
    m.*,
    p.nombre as pdv_nombre,
    p.ciudad,
    p.region,
    p.tipo as pdv_tipo
FROM metricas_revenue m
JOIN pdvs p ON m.pdv_codigo = p.codigo
WHERE p.activo = 1;

-- Índices para performance
CREATE INDEX idx_experimentos_tipologia ON experimentos(tipologia);
CREATE INDEX idx_experimentos_palanca ON experimentos(palanca);
CREATE INDEX idx_experimentos_kpi ON experimentos(kpi);
CREATE INDEX idx_metricas_periodo ON metricas_revenue(periodo);
CREATE INDEX idx_metricas_pdv ON metricas_revenue(pdv_codigo);
```

### **FASE 2: Backend - Nueva Capa de Datos (2-3 días)**

#### **2.1 Crear Servicio de Base de Datos Unificado**
```python
# Archivo: backend/app/services/database_service.py

import sqlite3
import pandas as pd
from typing import List, Dict, Any, Optional
from contextlib import contextmanager
import logging

class UnifiedDatabaseService:
    """Servicio unificado para acceso a datos - SQLite"""
    
    def __init__(self, db_path: str = 'data/unified.db'):
        self.db_path = db_path
        self.logger = logging.getLogger('chatbot_app.database')
        self._initialize_database()
    
    def _initialize_database(self):
        """Inicializa la base de datos con el schema"""
        with sqlite3.connect(self.db_path) as conn:
            # Ejecutar schema.sql
            with open('database/schema.sql', 'r') as f:
                conn.executescript(f.read())
    
    @contextmanager
    def get_connection(self):
        """Context manager para conexiones SQLite"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Para acceso por nombre de columna
        try:
            yield conn
        finally:
            conn.close()
    
    # Métodos para Dashboard
    def get_dashboard_results(self, tipologia: Optional[str] = None) -> List[Dict]:
        """Obtiene datos para la tabla del dashboard"""
        with self.get_connection() as conn:
            query = """
                SELECT source, kpi, palanca, variacion_promedio, diferencia_vs_control
                FROM experimentos 
                WHERE ($1 IS NULL OR tipologia = $1)
                ORDER BY source, palanca, kpi
            """
            return [dict(row) for row in conn.execute(query, [tipologia])]
    
    def get_evolution_data(self, palanca_id: int, kpi_id: int, tipologia: Optional[str] = None) -> List[Dict]:
        """Obtiene datos para el timeline chart"""
        with self.get_connection() as conn:
            # Convertir IDs a nombres usando tabla maestros
            palanca_query = "SELECT nombre FROM maestros WHERE tipo='palanca' AND codigo=?"
            kpi_query = "SELECT nombre FROM maestros WHERE tipo='kpi' AND codigo=?"
            
            palanca_name = conn.execute(palanca_query, [palanca_id]).fetchone()
            kpi_name = conn.execute(kpi_query, [kpi_id]).fetchone()
            
            if not palanca_name or not kpi_name:
                return []
            
            query = """
                SELECT period, test_value, control_value,
                       (test_value - COALESCE(control_value, 0)) as difference
                FROM experimentos 
                WHERE palanca = ? AND kpi = ?
                  AND ($3 IS NULL OR tipologia = $3)
                  AND period IS NOT NULL
                ORDER BY period
            """
            return [dict(row) for row in conn.execute(query, [palanca_name[0], kpi_name[0], tipologia])]
    
    # Métodos para Chatbot (compatibilidad con sql_engine actual)
    def execute_query(self, sql_query: str) -> Dict[str, Any]:
        """Ejecuta consulta SQL para el chatbot (text-to-SQL)"""
        try:
            with self.get_connection() as conn:
                df = pd.read_sql_query(sql_query, conn)
                return {
                    'success': True,
                    'data': df.to_dict('records'),
                    'columns': df.columns.tolist(),
                    'row_count': len(df)
                }
        except Exception as e:
            self.logger.error(f"SQL execution failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': sql_query
            }
    
    def get_schema_info(self) -> str:
        """Información del schema para el LLM (compatible con sql_engine actual)"""
        return """
ESQUEMA DE BASE DE DATOS DISPONIBLE:

TABLA: pdvs
- codigo (TEXT): Código único del PDV (ej: PDV001, PDV002...)
- nombre (TEXT): Nombre del punto de venta
- ciudad (TEXT): Ciudad donde está ubicado
- region (TEXT): Región geográfica
- tipo (TEXT): Tipo de tienda

TABLA: metricas_revenue
- pdv_codigo (TEXT): Código del PDV
- periodo (TEXT): Período YYYY-MM
- revenue (REAL): Ingresos en pesos
- visitantes (INTEGER): Número de visitantes
- conversiones (INTEGER): Número de conversiones
- tasa_conversion (REAL): Tasa de conversión calculada (%)
- revenue_por_visitante (REAL): Revenue promedio por visitante

TABLA: experimentos
- source (TEXT): Fuente del experimento
- tipologia (TEXT): Tipo de tienda
- palanca (TEXT): Palanca del experimento
- kpi (TEXT): KPI medido
- variacion_promedio (REAL): Variación promedio
- diferencia_vs_control (REAL): Diferencia vs control

VISTA: vista_completa
- Combina pdvs y metricas_revenue con todos los campos

SINÓNIMOS RECONOCIDOS:
- revenue = ingreso = ingresos = facturación
- conversiones = compras = transacciones
- visitantes = visitas = tráfico = clientes
"""

# Instancia global
unified_db = UnifiedDatabaseService()
```

#### **2.2 Migrar Endpoints del Dashboard**
```python
# Archivo: backend/app/routes/dashboard_unified.py

from flask import Blueprint, request, jsonify
from app.services.database_service import unified_db

dashboard_bp = Blueprint('dashboard_unified', __name__)

@dashboard_bp.route('/api/dashboard/results', methods=['GET'])
def get_dashboard_results():
    """Endpoint unificado para datos de dashboard"""
    try:
        tipologia = request.args.get('tipologia')
        data = unified_db.get_dashboard_results(tipologia)
        
        # Extraer palancas y KPIs únicos
        palancas = list(set(row['palanca'] for row in data))
        kpis = list(set(row['kpi'] for row in data))
        
        return jsonify({
            'success': True,
            'data': data,
            'palancas': sorted(palancas),
            'kpis': sorted(kpis),
            'filtered_by': tipologia
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@dashboard_bp.route('/api/dashboard/evolution-data', methods=['GET'])
def get_evolution_data():
    """Endpoint unificado para timeline chart"""
    try:
        palanca_id = int(request.args.get('palanca', 5))
        kpi_id = int(request.args.get('kpi', 1))
        tipologia = request.args.get('tipologia')
        
        data = unified_db.get_evolution_data(palanca_id, kpi_id, tipologia)
        
        return jsonify({
            'success': True,
            'data': data,
            'palanca_id': palanca_id,
            'kpi_id': kpi_id,
            'filtered_by': tipologia
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
```

#### **2.3 Actualizar Chatbot para usar DB Unificada**
```python
# Modificaciones en: backend/app/chatbot.py

# Cambiar:
from app.data_store import DataStore
from app.sql_engine import SQLEngine

# Por:
from app.services.database_service import unified_db

class ABTestingChatbot:
    def __init__(self):
        Config.validate()
        self.client = OpenAI()
        self.memory = ConversationMemory()
        # Usar servicio unificado en lugar de DataStore + SQLEngine separados
        self.db_service = unified_db
    
    def get_response(self, user_message: str) -> str:
        """Método actual sin cambios significativos"""
        # ... código existente ...
        
        # Cambiar sql_engine por db_service:
        schema_info = self.db_service.get_schema_info()
        # ... resto del código igual ...
    
    def _execute_sql_from_response(self, response_text, user_message: str):
        """Usar servicio unificado en lugar de sql_engine"""
        # ... extraer SQL igual que antes ...
        
        # Cambiar:
        result = self.sql_engine.execute_query(sql_query)
        
        # Por:
        result = self.db_service.execute_query(sql_query)
        
        # ... resto del código igual ...
```

### **FASE 3: Migración de Datos (1 día)**

#### **3.1 Script de Migración**
```python
# Archivo: backend/scripts/migrate_data.py

import sqlite3
import requests
import json
from app.services.database_service import unified_db

def migrate_dashboard_data():
    """Migra datos del dashboard actual a la nueva DB"""
    
    # Obtener datos actuales via API
    current_data = requests.get('http://localhost:5000/api/dashboard/results').json()
    
    with unified_db.get_connection() as conn:
        for item in current_data['data']:
            conn.execute("""
                INSERT OR REPLACE INTO experimentos 
                (source, tipologia, palanca, kpi, variacion_promedio, diferencia_vs_control)
                VALUES (?, ?, ?, ?, ?, ?)
            """, [
                item['source'],
                'Super e Hiper',  # Valor por defecto
                item['palanca'],
                item['kpi'],
                item['variacion_promedio'],
                item['diferencia_vs_control']
            ])
        conn.commit()

def populate_sample_pdv_data():
    """Puebla datos de PDVs reales en lugar de simulados"""
    pdvs_data = [
        {'codigo': 'PDV001', 'nombre': 'Sucursal Centro', 'ciudad': 'Buenos Aires', 'region': 'Norte', 'tipo': 'Flagship'},
        {'codigo': 'PDV002', 'nombre': 'Local Palermo', 'ciudad': 'Buenos Aires', 'region': 'Norte', 'tipo': 'Standard'},
        # ... más PDVs reales
    ]
    
    with unified_db.get_connection() as conn:
        for pdv in pdvs_data:
            conn.execute("""
                INSERT OR REPLACE INTO pdvs (codigo, nombre, ciudad, region, tipo)
                VALUES (?, ?, ?, ?, ?)
            """, [pdv['codigo'], pdv['nombre'], pdv['ciudad'], pdv['region'], pdv['tipo']])
        conn.commit()

if __name__ == '__main__':
    migrate_dashboard_data()
    populate_sample_pdv_data()
    print("✅ Migración completada")
```

### **FASE 4: Frontend - Sin Cambios Necesarios (0.5 días)**

El frontend **no requiere cambios** ya que:
- Los endpoints mantienen la misma interfaz
- Las respuestas JSON tienen el mismo formato
- Solo cambia la fuente de datos en el backend

**Verificación requerida:**
```typescript
// Verificar que estos endpoints sigan funcionando:
apiService.getDashboardResults()
apiService.getEvolutionData()
apiService.sendMessage() // Para chatbot
```

### **FASE 5: Testing y Validación (1-2 días)**

#### **5.1 Tests Automatizados**
```python
# Archivo: backend/tests/test_unified_database.py

import unittest
from app.services.database_service import unified_db

class TestUnifiedDatabase(unittest.TestCase):
    
    def test_dashboard_results_consistency(self):
        """Verifica que dashboard devuelve datos consistentes"""
        results = unified_db.get_dashboard_results()
        self.assertGreater(len(results), 0)
        
        for result in results:
            self.assertIn('source', result)
            self.assertIn('palanca', result)
            self.assertIn('kpi', result)
    
    def test_chatbot_sql_execution(self):
        """Verifica que chatbot puede ejecutar SQL correctamente"""
        result = unified_db.execute_query("SELECT COUNT(*) as total FROM pdvs")
        self.assertTrue(result['success'])
        self.assertGreater(result['data'][0]['total'], 0)
    
    def test_schema_consistency(self):
        """Verifica que el schema incluye todas las tablas necesarias"""
        schema_info = unified_db.get_schema_info()
        self.assertIn('pdvs', schema_info)
        self.assertIn('experimentos', schema_info)
        self.assertIn('vista_completa', schema_info)

if __name__ == '__main__':
    unittest.main()
```

#### **5.2 Tests de Integración**
```bash
# Verificar endpoints funcionando
curl http://localhost:5000/api/dashboard/results
curl http://localhost:5000/api/chat/start -X POST -d '{"userEmail":"test@test.com"}'

# Verificar frontend carga correctamente
npm run dev # Verificar dashboard muestra datos
```

### **FASE 6: Deploy y Monitoreo (0.5 días)**

#### **6.1 Actualizar Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    # ... configuración existente ...
    volumes:
      - ./data:/app/data  # Persistir SQLite
    environment:
      - DATABASE_PATH=/app/data/unified.db
```

#### **6.2 Backup Strategy**
```bash
# Script de backup automático
#!/bin/bash
# backup-db.sh
cp data/unified.db "backups/unified_$(date +%Y%m%d_%H%M%S).db"
```

---

## 🐘 OPCIÓN 2: Migración a PostgreSQL

### **Cuándo Elegir PostgreSQL**
- 📈 Dataset > 100MB o crecimiento proyectado
- 👥 Múltiples usuarios concurrentes (>50)
- 🌐 Deploy multi-instancia/escalabilidad
- 🔐 Requerimientos de seguridad avanzados
- 📊 Necesidad de funciones SQL avanzadas

### **Cambios Adicionales vs SQLite**

#### **Dependencias**
```python
# requirements.txt - añadir:
psycopg2-binary==2.9.7
SQLAlchemy==2.0.21  # ORM recomendado para PostgreSQL
```

#### **Configuración**
```python
# backend/app/config.py - añadir:
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/dbname')
```

#### **Servicio de Base de Datos**
```python
# backend/app/services/database_service.py
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

class UnifiedDatabaseService:
    def __init__(self):
        self.engine = create_engine(Config.DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
    
    def execute_query(self, sql_query: str):
        """PostgreSQL version con mejor manejo de concurrencia"""
        try:
            with self.engine.connect() as conn:
                result = conn.execute(text(sql_query))
                return {
                    'success': True,
                    'data': [dict(row) for row in result],
                    'row_count': result.rowcount
                }
        except Exception as e:
            return {'success': False, 'error': str(e)}
```

#### **Docker Compose con PostgreSQL**
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: gatorade_ab
      POSTGRES_USER: gatorade
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  backend:
    # ... resto de configuración ...
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://gatorade:secure_password@db:5432/gatorade_ab

volumes:
  postgres_data:
```

---

## 📊 Comparación Final

| Aspecto | SQLite | PostgreSQL |
|---------|--------|------------|
| **Complejidad Setup** | ⭐⭐⭐⭐⭐ Simple | ⭐⭐⭐ Media |
| **Performance (Dataset Actual)** | ⭐⭐⭐⭐⭐ Excelente | ⭐⭐⭐⭐ Muy Bueno |
| **Escalabilidad** | ⭐⭐⭐ Limitada | ⭐⭐⭐⭐⭐ Excelente |
| **Mantenimiento** | ⭐⭐⭐⭐⭐ Mínimo | ⭐⭐⭐ Medio |
| **Deploy Complexity** | ⭐⭐⭐⭐⭐ Trivial | ⭐⭐ Complejo |
| **Backup/Restore** | ⭐⭐⭐⭐⭐ Copy File | ⭐⭐⭐ Scripts |
| **Costo Infraestructura** | ⭐⭐⭐⭐⭐ Cero | ⭐⭐⭐ Medio |

---

## 🎯 Recomendación Final

**Para tu proyecto actual: SQLite es la opción óptima**

**Razones:**
1. Dataset pequeño/mediano ✅
2. Aplicación single-tenant ✅  
3. Text-to-SQL funciona mejor con SQLite ✅
4. Deploy simplificado ✅
5. Cero overhead de infraestructura ✅

**Considera PostgreSQL si:**
- Planeas >1000 usuarios concurrentes
- Dataset >500MB
- Requieres múltiples instancias
- Necesitas features SQL avanzados

---

## 📅 Timeline Estimado

| Fase | SQLite | PostgreSQL |
|------|--------|------------|
| **Preparación** | 1-2 días | 2-3 días |
| **Backend Changes** | 2-3 días | 3-4 días |
| **Data Migration** | 1 día | 1-2 días |
| **Frontend** | 0.5 días | 0.5 días |
| **Testing** | 1-2 días | 2-3 días |
| **Deploy** | 0.5 días | 1-2 días |
| **TOTAL** | **5-8 días** | **8-14 días** |

---

## ✅ Criterios de Éxito

- [ ] Chatbot y dashboard muestran datos consistentes
- [ ] Performance mantenida o mejorada  
- [ ] Zero downtime deployment
- [ ] Todos los tests automatizados pasan
- [ ] Backup/restore funcional
- [ ] Documentación actualizada

¿Te parece bien empezar con SQLite y migrar a PostgreSQL posteriormente si crece la necesidad de escalabilidad?