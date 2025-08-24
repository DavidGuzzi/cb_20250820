"""
Session management for chat sessions
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

class SessionManager:
    """Manages chat sessions with in-memory storage"""
    
    def __init__(self):
        self.sessions: Dict[str, dict] = {}
    
    def create_session(self, user_email: str) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        
        self.sessions[session_id] = {
            'session_id': session_id,
            'user_email': user_email,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_activity': datetime.now(timezone.utc).isoformat(),
            'message_count': 0,
            'is_active': True
        }
        
        return session_id
    
    def get_session(self, session_id: str) -> Optional[dict]:
        """Get session by ID"""
        return self.sessions.get(session_id)
    
    def update_session_activity(self, session_id: str) -> bool:
        """Update last activity timestamp"""
        if session_id in self.sessions:
            self.sessions[session_id]['last_activity'] = datetime.now(timezone.utc).isoformat()
            self.sessions[session_id]['message_count'] += 1
            return True
        return False
    
    def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        return len([s for s in self.sessions.values() if s.get('is_active', True)])
    
    def get_total_messages_count(self) -> int:
        """Get total message count across all sessions"""
        return sum(s.get('message_count', 0) for s in self.sessions.values())
    
    def get_sessions_by_user(self, user_email: str) -> list:
        """Get all sessions for a user"""
        return [s for s in self.sessions.values() if s['user_email'] == user_email]

# Global session manager instance
session_manager = SessionManager()