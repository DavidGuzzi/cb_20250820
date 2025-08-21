# Chatbot para Análisis de Datos Retail

Chatbot especializado en análisis de datos de puntos de venta (PDVs) usando OpenAI Responses API con capacidades text-to-SQL.

## Características

- 🧠 **Memoria conversacional**: Mantiene contexto durante la sesión
- 🔍 **Text-to-SQL**: Convierte preguntas en lenguaje natural a consultas SQL
- 📊 **Análisis de datos**: Calcula métricas de revenue, conversión y performance
- 💾 **Datos precargados**: 8 PDVs con datos de 3 meses (Nov 2024 - Ene 2025)
- 🚀 **Preparado para integración**: Diseñado para backend/frontend futuro

## Instalación

1. **Clonar/descargar el proyecto**
```bash
cd chatbot_20250820
```

2. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

3. **Configurar API Key**
```bash
cp .env.example .env
# Editar .env y añadir tu OPENAI_API_KEY
```

## Uso

### Ejecutar el chatbot
```bash
python main.py
```

### Comandos disponibles
- `/status` - Ver estado actual
- `/clear` - Limpiar conversación
- `/help` - Mostrar ayuda
- `/quit` - Salir

### Datos disponibles
- **8 PDVs**: Sucursales en Buenos Aires, Córdoba, Rosario, Mendoza, Tucumán, Santa Fe
- **3 regiones**: Norte, Centro, Sur
- **3 tipos**: Flagship, Standard, Express
- **3 meses**: Noviembre 2024, Diciembre 2024, Enero 2025
- **Métricas**: Revenue, visitantes, conversiones, tasas de conversión

### Ejemplos de preguntas
```
> ¿Cuál es el PDV con mejor performance?
> Compara los ingresos entre regiones
> ¿Cómo evolucionó el PDV001 mes a mes?
> ¿Qué tipo de tienda tiene mejor conversión?
> Muéstrame el top 3 de PDVs por revenue
> ¿Cuál es el revenue máximo y de quién?
```

## Estructura del proyecto

```
chatbot_20250820/
├── main.py                 # Script principal
├── chatbot.py             # Clase principal del chatbot
├── config.py              # Configuración y API keys
├── conversation_memory.py # Sistema de memoria
├── data_store.py          # Datos de PDVs y revenue
├── sql_engine.py          # Motor text-to-SQL
├── requirements.txt       # Dependencias
├── .env.example          # Ejemplo de configuración
└── README.md             # Este archivo
```

## Cómo funciona

1. **Text-to-SQL**: El LLM convierte preguntas en lenguaje natural a consultas SQL
2. **Ejecución automática**: Las consultas se ejecutan automáticamente sobre los datos
3. **Resultados formateados**: Los resultados se presentan en formato legible
4. **Memoria conversacional**: Mantiene contexto de la conversación durante la sesión

## Integración futura

El chatbot está preparado para integrarse en aplicaciones web:

- **Backend**: Usar la clase `ABTestingChatbot` directamente
- **API REST**: Exponer métodos como endpoints  
- **Frontend**: Interfaz web para análisis interactivo
- **Base de datos**: Conectar a bases de datos reales en lugar de datos en memoria

## Requisitos

- Python 3.8+
- OpenAI API Key
- Dependencias en requirements.txt