class ConversationMemory:
    def __init__(self, max_messages=20):
        self.messages = []
        self.max_messages = max_messages
        self.system_prompt = """Eres un experto analista de datos de retail y A/B Testing. Tienes acceso a datos de PDVs (Puntos de Venta) con información de revenue, visitantes y conversiones.

Puedes:
- Analizar performance de PDVs específicos
- Comparar métricas entre regiones y tipos de tienda
- Calcular tasas de conversión y revenue por visitante
- Interpretar tendencias temporales
- Sugerir optimizaciones basadas en datos
- Mantener contexto de la conversación

Responde de manera clara y fundamentada en los datos disponibles. Usa números específicos cuando sea relevante."""
    
    def add_message(self, role, content):
        """Añade un mensaje a la memoria de conversación"""
        self.messages.append({"role": role, "content": content})
        
        # Mantener solo los últimos N mensajes (sin contar system prompt)
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
    
    def get_messages_for_api(self):
        """Retorna los mensajes formateados para la API de OpenAI"""
        return [{"role": "system", "content": self.system_prompt}] + self.messages
    
    def clear(self):
        """Limpia la memoria conversacional"""
        self.messages = []
    
    def get_conversation_summary(self):
        """Retorna un resumen de la conversación actual"""
        return f"Conversación actual: {len(self.messages)} mensajes"