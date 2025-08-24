"""
Request/Response schemas for API validation
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ChatMessage:
    """Chat message model"""
    id: str
    text: str
    sender: str  # 'user' or 'bot'
    timestamp: datetime
    data: Optional[List[Dict[str, Any]]] = None
    sql_used: Optional[str] = None
    sql_executed: bool = False
    confidence: Optional[float] = None
    execution_time: Optional[float] = None
    cached: bool = False

@dataclass
class ChatSession:
    """Chat session model"""
    session_id: str
    user_email: str
    created_at: str
    last_activity: str
    message_count: int = 0
    is_active: bool = True

@dataclass
class StartChatRequest:
    """Request to start a chat session"""
    userEmail: str

@dataclass
class SendMessageRequest:
    """Request to send a message"""
    session_id: str
    message: str

@dataclass
class ChatResponse:
    """Chatbot response"""
    text: str
    data: List[Dict[str, Any]]
    sql_used: str
    sql_executed: bool
    confidence: float
    execution_time: float
    cached: bool
    insights: Dict[str, Any]
    session_id: str

@dataclass
class ApiResponse:
    """Generic API response wrapper"""
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None