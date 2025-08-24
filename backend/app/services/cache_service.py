"""
Simple in-memory cache for SQL queries
"""
import hashlib
import json
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

class QueryCache:
    """Simple in-memory cache for SQL query results"""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default TTL
        self.cache: Dict[str, dict] = {}
        self.default_ttl = default_ttl
        
        # Analytics
        self.total_queries = 0
        self.cache_hits = 0
        self.cache_misses = 0
    
    def _get_cache_key(self, sql_query: str) -> str:
        """Generate cache key from SQL query"""
        normalized_query = sql_query.strip().lower()
        return hashlib.md5(normalized_query.encode()).hexdigest()
    
    def get(self, sql_query: str) -> Optional[dict]:
        """Get cached result for SQL query"""
        self.total_queries += 1
        cache_key = self._get_cache_key(sql_query)
        
        if cache_key in self.cache:
            cached_item = self.cache[cache_key]
            
            # Check if expired
            if datetime.now() > cached_item['expires_at']:
                del self.cache[cache_key]
                self.cache_misses += 1
                return None
            
            self.cache_hits += 1
            return {
                'success': cached_item['result']['success'],
                'data': cached_item['result']['data'],
                'columns': cached_item['result']['columns'],
                'row_count': cached_item['result']['row_count'],
                'cached': True,
                'cache_timestamp': cached_item['created_at'].isoformat()
            }
        
        self.cache_misses += 1
        return None
    
    def set(self, sql_query: str, result: dict, ttl: Optional[int] = None) -> None:
        """Cache SQL query result"""
        cache_key = self._get_cache_key(sql_query)
        ttl = ttl or self.default_ttl
        
        self.cache[cache_key] = {
            'query': sql_query,
            'result': result,
            'created_at': datetime.now(),
            'expires_at': datetime.now() + timedelta(seconds=ttl)
        }
    
    def clear(self) -> None:
        """Clear all cached items"""
        self.cache.clear()
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        cache_hit_rate = (self.cache_hits / self.total_queries * 100) if self.total_queries > 0 else 0
        
        return {
            'total_cached_queries': len(self.cache),
            'total_query_requests': self.total_queries,
            'total_cache_hits': self.cache_hits,
            'total_cache_misses': self.cache_misses,
            'cache_hit_rate': round(cache_hit_rate, 2)
        }
    
    def cleanup_expired(self) -> int:
        """Remove expired items from cache"""
        now = datetime.now()
        expired_keys = [
            key for key, item in self.cache.items() 
            if now > item['expires_at']
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        return len(expired_keys)

# Global cache instance
query_cache = QueryCache()