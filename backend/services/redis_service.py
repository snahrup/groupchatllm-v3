"""
Redis Service
Handles all Redis operations for session persistence and scalability
"""

import json
import os
from typing import Any, Dict, Optional, List
from datetime import datetime
import redis.asyncio as redis
from loguru import logger
from models.schemas import Session, Message, SynapseConnection, CollaborationEvent


class RedisService:
    """
    Manages Redis connections and operations for session persistence
    """
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.client: Optional[redis.Redis] = None
        self.is_connected = False
        
    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.client = await redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await self.client.ping()
            self.is_connected = True
            logger.info(f"Connected to Redis at {self.redis_url}")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Falling back to in-memory storage.")
            self.is_connected = False
    
    async def disconnect(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
            self.is_connected = False    
    # Session Management Methods
    async def save_session(self, session: Session) -> bool:
        """Save session to Redis"""
        if not self.is_connected:
            return False
            
        try:
            # Serialize session data
            session_data = {
                "id": session.id,
                "mission": session.mission,
                "created_at": session.created_at.isoformat(),
                "updated_at": session.updated_at.isoformat(),
                "is_active": session.is_active,
                "panelist_configs": [
                    {
                        "id": config.id,
                        "personality": {
                            "provider": config.personality.provider,
                            "model_name": config.personality.model_name,
                            "role": config.personality.role,
                            "icon": config.personality.icon,
                            "description": config.personality.description,
                            "collaboration_style": config.personality.collaboration_style,
                            "color_theme": config.personality.color_theme
                        },
                        "is_active": config.is_active
                    }
                    for config in session.panelist_configs
                ]
            }
            
            # Store session data            await self.client.hset(
                f"session:{session.id}",
                mapping={
                    "data": json.dumps(session_data),
                    "last_accessed": datetime.utcnow().isoformat()
                }
            )
            
            # Add to active sessions set
            await self.client.sadd("active_sessions", session.id)
            
            # Set expiration (24 hours)
            await self.client.expire(f"session:{session.id}", 86400)
            
            logger.debug(f"Saved session {session.id} to Redis")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save session to Redis: {e}")
            return False
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session from Redis"""
        if not self.is_connected:
            return None
            
        try:
            # Get session data
            session_data = await self.client.hget(f"session:{session_id}", "data")            if not session_data:
                return None
                
            # Update last accessed time
            await self.client.hset(
                f"session:{session_id}",
                "last_accessed",
                datetime.utcnow().isoformat()
            )
            
            # Reset expiration
            await self.client.expire(f"session:{session_id}", 86400)
            
            return json.loads(session_data)
            
        except Exception as e:
            logger.error(f"Failed to get session from Redis: {e}")
            return None
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete session from Redis"""
        if not self.is_connected:
            return False
            
        try:
            # Remove from active sessions
            await self.client.srem("active_sessions", session_id)
            
            # Delete session data            await self.client.delete(f"session:{session_id}")
            await self.client.delete(f"memory:{session_id}")
            await self.client.delete(f"orchestrator:{session_id}")
            
            logger.debug(f"Deleted session {session_id} from Redis")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete session from Redis: {e}")
            return False
    
    async def get_active_sessions(self) -> List[str]:
        """Get all active session IDs"""
        if not self.is_connected:
            return []
            
        try:
            return list(await self.client.smembers("active_sessions"))
        except Exception as e:
            logger.error(f"Failed to get active sessions: {e}")
            return []
    
    # Memory Management Methods
    async def save_memory_state(self, session_id: str, memory_state: Dict[str, Any]) -> bool:
        """Save group memory state to Redis"""
        if not self.is_connected:
            return False