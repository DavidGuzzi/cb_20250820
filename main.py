#!/usr/bin/env python3
"""
Chatbot para Análisis de A/B Testing
Usando OpenAI Responses API

Comandos disponibles:
- /load <experimento>: Cargar datos de experimento (cta, pricing, landing)
- /status: Ver estado actual
- /clear: Limpiar conversación
- /help: Mostrar ayuda
- /quit: Salir
"""

import sys
from chatbot import ABTestingChatbot

def print_welcome():
    print("=" * 60)
    print("📊 CHATBOT ANÁLISIS DE DATOS RETAIL")
    print("=" * 60)
    print("¡Hola! Soy tu asistente para analizar datos de PDVs y revenue.")
    print("Tengo acceso a información de 8 puntos de venta con datos")
    print("de revenue, visitantes y conversiones por mes.")
    print("\nComandos disponibles:")
    print("  /status - Ver estado actual")
    print("  /clear  - Limpiar conversación")
    print("  /help   - Mostrar ayuda")
    print("  /quit   - Salir")
    print("\nEscribe tu pregunta sobre los datos:")
    print("-" * 60)

def print_help():
    print("\n📋 AYUDA - COMANDOS DISPONIBLES:")
    print("=" * 50)
    print("/status - Ver estado actual del chatbot")
    print("/clear  - Reiniciar la conversación")
    print("/help   - Mostrar esta ayuda")
    print("/quit   - Salir del programa")
    print("\n💡 EJEMPLOS DE PREGUNTAS:")
    print("- ¿Cuál es el PDV con mejor performance?")
    print("- Compara el revenue entre regiones")
    print("- ¿Cómo evolucionó el PDV001 en los últimos meses?")
    print("- ¿Qué tipo de tienda tiene mejor conversión?")
    print("- Muéstrame las tendencias de diciembre")
    print("- ¿Qué PDV debería optimizar primero?")
    print("-" * 50)

def handle_command(chatbot, command):
    """Maneja comandos especiales del chatbot"""
    parts = command.strip().split()
    cmd = parts[0].lower()
    
    if cmd == "/quit":
        print("\n👋 ¡Hasta luego! Que tengas un buen análisis.")
        return False
    
    elif cmd == "/help":
        print_help()
        return True
    
    elif cmd == "/status":
        status = chatbot.get_conversation_status()
        print(f"\n📊 ESTADO ACTUAL:")
        print(f"Datos de PDVs: ✅ Cargados (8 PDVs, 3 meses)")
        print(f"{status['memory_status']}")
        return True
    
    elif cmd == "/clear":
        result = chatbot.clear_conversation()
        print(f"\n🔄 {result}")
        return True
    
    
    else:
        print(f"\n❌ Comando '{cmd}' no reconocido. Usa /help para ver comandos disponibles.")
        return True

def main():
    """Función principal del chatbot"""
    try:
        # Inicializar chatbot
        chatbot = ABTestingChatbot()
        print_welcome()
        
        while True:
            try:
                # Obtener input del usuario
                user_input = input("\n> ").strip()
                
                if not user_input:
                    continue
                
                # Manejar comandos
                if user_input.startswith("/"):
                    if not handle_command(chatbot, user_input):
                        break
                    continue
                
                # Procesar pregunta normal
                print("\n🤖 Analizando...")
                response = chatbot.get_response(user_input)
                print(f"\n{response}")
                
            except KeyboardInterrupt:
                print("\n\n👋 Saliendo... ¡Hasta luego!")
                break
            except Exception as e:
                print(f"\n❌ Error: {str(e)}")
                print("Intenta de nuevo o usa /help para ver comandos disponibles.")
    
    except Exception as e:
        print(f"❌ Error al inicializar el chatbot: {str(e)}")
        print("Verifica que tengas configurada tu OPENAI_API_KEY en el archivo .env")
        sys.exit(1)

if __name__ == "__main__":
    main()