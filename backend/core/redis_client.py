"""
Redis Client for Session State Management
Provides persistent, scalable storage for GroupChatLLM sessions
Updated: 2025-07-06 23:15:05
"""

import os
import json
import pickle
from typing import Any, Dict, Optional, List
from datetime import datetime, timedelta
import redis.asyncio as redis
from loguru import logger
from models.schemas import Session, Message, SynapseConnection, CollaborationEvent

class RedisClient:
    """
    Redis client wrapper for session state management
    Handles serialization and deserialization of complex objects
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._client: Optional[redis.Redis] = None
        self._connected = False
        
    async def connect(self) -> bool:
        """Connect to Redis server"""
        try:
            self._client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=False  # We'll handle encoding ourselves
            )
            # Test connection
            await self._client.ping()
            self._connected = True
            logger.info(f"Connected to Redis at {self.redis_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self._connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self._client:
            await self._client.close()
            self._connected = False
            
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self._connected
            
    # Session Management Methods
    async def save_session(self, session: Session) -> bool:
        """Save a session to Redis"""
        if not self._connected:
            return False
            
        try:
            key = f"session:{session.id}"
            # Convert Pydantic model to dict and serialize
            session_data = session.model_dump_json()
            
            # Set with expiration (24 hours)
            await self._client.setex(
                key, 
                timedelta(hours=24), 
                session_data
            )
            
            # Add to active sessions set
            await self._client.sadd("active_sessions", session.id)
            
            return True
        except Exception as e:
            logger.error(f"Error saving session {session.id}: {e}")
            return False    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get a session from Redis"""
        if not self._connected:
            return None
            
        try:
            key = f"session:{session_id}"
            session_data = await self._client.get(key)
            
            if session_data:
                # Deserialize from JSON
                return Session.model_validate_json(session_data)
            return None
        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None
    
    async def update_session(self, session: Session) -> bool:
        """Update an existing session"""
        return await self.save_session(session)
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session from Redis"""
        if not self._connected:
            return False
            
        try:
            # Remove from Redis
            await self._client.delete(f"session:{session_id}")
            
            # Remove from active sessions set
            await self._client.srem("active_sessions", session_id)
            
            # Clean up related data
            await self._client.delete(f"memory:{session_id}")
            await self._client.delete(f"orchestrator:{session_id}")
            
            return True
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False    
    async def get_active_sessions(self) -> List[str]:
        """Get all active session IDs"""
        if not self._connected:
            return []
            
        try:
            session_ids = await self._client.smembers("active_sessions")
            return [sid.decode() if isinstance(sid, bytes) else sid for sid in session_ids]
        except Exception as e:
            logger.error(f"Error getting active sessions: {e}")
            return []
    
    # Memory State Management
    async def save_memory_state(self, session_id: str, memory_data: Dict[str, Any]) -> bool:
        """Save GroupMemory state to Redis"""
        if not self._connected:
            return False
            
        try:
            key = f"memory:{session_id}"
            # Serialize complex objects (messages, synapses, events)
            serialized_data = json.dumps(memory_data, default=str)
            
            await self._client.setex(
                key,
                timedelta(hours=24),
                serialized_data
            )
            return True
        except Exception as e:
            logger.error(f"Error saving memory state for {session_id}: {e}")
            return False    
    async def get_memory_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get GroupMemory state from Redis"""
        if not self._connected:
            return None
            
        try:
            key = f"memory:{session_id}"
            memory_data = await self._client.get(key)
            
            if memory_data:
                return json.loads(memory_data)
            return None
        except Exception as e:
            logger.error(f"Error getting memory state for {session_id}: {e}")
            return None
    
    # Orchestrator State Management
    async def save_orchestrator_state(self, session_id: str, orchestrator_data: Dict[str, Any]) -> bool:
        """Save StreamingOrchestrator state to Redis"""
        if not self._connected:
            return False
            
        try:
            key = f"orchestrator:{session_id}"
            # Use pickle for complex orchestrator state
            serialized_data = pickle.dumps(orchestrator_data)
            
            await self._client.setex(
                key,
                timedelta(hours=24),
                serialized_data
            )
            return True
        except Exception as e:
            logger.error(f"Error saving orchestrator state for {session_id}: {e}")
            return False
    
    async def get_orchestrator_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get StreamingOrchestrator state from Redis"""
        if not self._connected:
            return None
            
        try:
            key = f"orchestrator:{session_id}"
            orchestrator_data = await self._client.get(key)
            
            if orchestrator_data:
                return pickle.loads(orchestrator_data)
            return None
        except Exception as e:
            logger.error(f"Error getting orchestrator state for {session_id}: {e}")
            return None

# Singleton instance
redis_client = RedisClient()