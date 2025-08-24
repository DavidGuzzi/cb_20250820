"""
Logging configuration for the application
"""
import logging
import json
import sys
from datetime import datetime
from flask import request, g
import os

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add request context if available
        try:
            if request:
                log_entry['request'] = {
                    'method': request.method,
                    'path': request.path,
                    'remote_addr': request.remote_addr,
                    'user_agent': request.headers.get('User-Agent', ''),
                }
                
                # Add session ID if available
                if hasattr(g, 'session_id'):
                    log_entry['session_id'] = g.session_id
        except RuntimeError:
            # Outside request context
            pass
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
        
        return json.dumps(log_entry)

def setup_logging():
    """Configure application logging"""
    
    # Get log level from environment
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create logger
    logger = logging.getLogger('chatbot_app')
    logger.setLevel(getattr(logging, log_level))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    
    # Set formatter based on environment
    if os.getenv('FLASK_ENV') == 'production':
        # Use JSON formatter for production
        formatter = JSONFormatter()
    else:
        # Use simple formatter for development
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Set werkzeug logger level to WARNING to reduce noise
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    
    return logger

def log_api_call(endpoint: str, **kwargs):
    """Log API call with additional context"""
    logger = logging.getLogger('chatbot_app.api')
    
    extra_fields = {
        'api_endpoint': endpoint,
        'api_call': True,
        **kwargs
    }
    
    # Create a LogRecord with extra fields
    record = logger.makeRecord(
        logger.name, logging.INFO, '', 0, 
        f"API call to {endpoint}", (), None
    )
    record.extra_fields = extra_fields
    
    logger.handle(record)

def log_chatbot_interaction(session_id: str, message: str, response: str, **kwargs):
    """Log chatbot interaction"""
    logger = logging.getLogger('chatbot_app.chatbot')
    
    extra_fields = {
        'session_id': session_id,
        'message_preview': message[:100],
        'response_preview': response[:100],
        'chatbot_interaction': True,
        **kwargs
    }
    
    record = logger.makeRecord(
        logger.name, logging.INFO, '', 0,
        "Chatbot interaction", (), None
    )
    record.extra_fields = extra_fields
    
    logger.handle(record)

# Initialize logging
app_logger = setup_logging()