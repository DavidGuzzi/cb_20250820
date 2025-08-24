"""
Flask Application Factory
"""
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

def create_app():
    """Create and configure Flask application"""
    load_dotenv()
    
    app = Flask(__name__)
    
    # Configuration
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev-secret-key'),
        OPENAI_API_KEY=os.getenv('OPENAI_API_KEY'),
        DEBUG=os.getenv('FLASK_ENV') == 'development'
    )
    
    # Enable CORS for all domains
    CORS(app, origins=['http://localhost:5173', 'http://127.0.0.1:5173'])
    
    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.chat import chat_bp
    from app.routes.analytics import analytics_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(analytics_bp)
    
    return app