"""
Flask Application Factory
"""
from flask import Flask, request, g
from flask_cors import CORS
import os
from dotenv import load_dotenv
from app.utils.logger import setup_logging, log_api_call
import uuid

def create_app():
    """Create and configure Flask application"""
    load_dotenv()
    
    # Setup logging
    logger = setup_logging()
    
    app = Flask(__name__)
    
    # Configuration
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev-secret-key'),
        OPENAI_API_KEY=os.getenv('OPENAI_API_KEY'),
        DEBUG=os.getenv('FLASK_ENV') == 'development'
    )
    
    # Smart CORS configuration for local and cloud
    env = os.getenv('FLASK_ENV', 'development')
    port = os.getenv('PORT')  # Cloud Run sets this automatically
    
    # Cloud Run detection: check if PORT env var exists (Cloud Run specific)
    if port or env == 'production':
        # Cloud Run production - allow all origins (secure as Cloud Run handles auth)
        # This allows any *.run.app domain to access the API
        CORS(app,
             origins="*",
             supports_credentials=False,
             allow_headers=['Content-Type', 'Authorization'],
             methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
        logger.info(f"CORS enabled for all origins (Cloud Run production)")
    else:
        # Local development
        allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
        CORS(app, origins=allowed_origins)
        logger.info(f"CORS enabled for: {allowed_origins}")
    
    # Request logging middleware
    @app.before_request
    def log_request_info():
        """Log incoming requests and set correlation id"""
        # Correlation ID: read header or create one
        g.request_id = request.headers.get('X-Request-Id') or str(uuid.uuid4())
        if request.path.startswith('/api/'):
            log_api_call(
                endpoint=request.path,
                method=request.method,
                remote_addr=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')
            )

    @app.after_request
    def add_request_id(response):
        """Attach request id to response headers"""
        try:
            if hasattr(g, 'request_id'):
                response.headers['X-Request-Id'] = g.request_id
        except Exception:
            pass
        return response
    
    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.chat import chat_bp
    from app.routes.analytics import analytics_bp
    
    app.register_blueprint(health_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(analytics_bp)
    
    logger.info("Flask application created successfully")
    
    return app
