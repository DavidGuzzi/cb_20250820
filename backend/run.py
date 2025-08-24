"""
Development server runner
"""
from app import create_app
import os

if __name__ == '__main__':
    app = create_app()
    
    # Run in development mode
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )