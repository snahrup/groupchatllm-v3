"""
Session Manager
Manages collaborative AI sessions and coordinates all components
Updated: 2025-07-06 23:20:00 - Added Redis support for scalable state management
"""

from typing import Any, Dict, List, Optional, AsyncGenerator
from models.schemas import Session, CreateSessionRequest, StreamingResponse, PanelistConfig, ModelPersonality
from memory.group_memory import GroupMemory
from streaming.streaming_orchestrator import StreamingOrchestrator
from providers.model_factory import ModelFactory
from core.redis_client import redis_client
from datetime import datetime
from loguru import logger
import uuid


class SessionManager:
    """
    Central manager for GroupChatLLM sessions
    Coordinates memory, streaming, and providers
    Now with Redis support for horizontal scaling and persistence
    """
    
    def __init__(self):
        # Fallback to in-memory if Redis is not available
        self.use_redis = False
        self.sessions: Dict[str, Session] = {}
        self.memory_managers: Dict[str, GroupMemory] = {}
        self.orchestrators: Dict[str, StreamingOrchestrator] = {}
        
    async def initialize(self):
        """Initialize session manager and connect to Redis if available"""
        self.use_redis = await redis_client.connect()
        if self.use_redis:
            logger.info("SessionManager initialized with Redis support")
        else:
            logger.warning("Redis not available, falling back to in-memory storage")
        
    async def create_session(self, request: CreateSessionRequest) -> Session:
        """Create a new collaborative session with support for custom personas"""
        # Validate request
        request.validate_request()
        
        session_id = str(uuid.uuid4())
        
        # Create panelist configurations
        panelist_configs = []
        
        # Handle backward compatibility with selected_models
        if request.selected_models and not request.panelists:
            # Convert selected_models to panelist configs
            personas = ModelFactory.load_personas()
            for model_id in request.selected_models:
                if model_id in personas:
                    config = PanelistConfig(
                        personality=personas[model_id],
                        is_active=True
                    )
                    # Store the model_id for later use
                    config._model_id = model_id
                    panelist_configs.append(config)
                else:
                    logger.warning(f"Model {model_id} not found in personas")
        
        # Handle new format with custom personas
        elif request.panelists:
            for panelist_data in request.panelists:
                model_id = panelist_data.get("model_id")
                persona_id = panelist_data.get("persona_id")
                custom_persona = panelist_data.get("custom_persona")
                
                if custom_persona:
                    # Use custom persona
                    config = PanelistConfig(
                        personality=ModelPersonality(**custom_persona),
                        is_active=True
                    )
                    # Store model_id for provider creation
                    config._model_id = model_id or custom_persona.get("model_name", "custom")
                    panelist_configs.append(config)
                elif persona_id:
                    # Use default persona by ID
                    personas = ModelFactory.load_personas()
                    if persona_id in personas:
                        config = PanelistConfig(
                            personality=personas[persona_id],
                            is_active=True
                        )
                        # Store persona_id as model_id
                        config._model_id = persona_id
                        panelist_configs.append(config)
                elif model_id:
                    # Backward compatibility - use model_id as persona_id
                    personas = ModelFactory.load_personas()
                    if model_id in personas:
                        config = PanelistConfig(
                            personality=personas[model_id],
                            is_active=True
                        )
                        # Store model_id
                        config._model_id = model_id
                        panelist_configs.append(config)        
        # Create session
        session = Session(
            id=session_id,
            mission=request.mission,
            panelist_configs=panelist_configs
        )
        
        # Initialize memory for this session
        memory = GroupMemory(session_id)
        self.memory_managers[session_id] = memory
        
        # Initialize orchestrator
        orchestrator = StreamingOrchestrator(memory)
        
        # Add providers to orchestrator
        for config in panelist_configs:
            # Use the stored model_id if available, otherwise use the reverse lookup
            if hasattr(config, '_model_id'):
                model_identifier = config._model_id
            else:
                model_identifier = self._get_model_identifier(config.personality.model_name)
            
            # Check if this is a custom persona
            custom_persona_dict = None
            if hasattr(config, '_model_id') and config._model_id == "custom":
                # Convert personality back to dict for custom personas
                custom_persona_dict = config.personality.dict()
            
            provider = ModelFactory.create_model(
                model_identifier, 
                custom_persona=custom_persona_dict
            )
            
            if provider:
                orchestrator.add_provider(config.id, provider)
                logger.info(f"Added provider for: {model_identifier}")
            else:
                logger.warning(f"Could not create provider for: {model_identifier}")
        
        self.orchestrators[session_id] = orchestrator
        self.sessions[session_id] = session
        
        # Save to Redis if available
        if self.use_redis:
            await redis_client.save_session(session)
            # Save memory state
            memory_state = memory.to_dict()
            await redis_client.save_memory_state(session_id, memory_state)
        
        logger.info(f"Created session {session_id} with {len(panelist_configs)} panelists")
        
        return session    
    def _get_model_identifier(self, model_name: str) -> str:
        """Get model identifier from model name"""
        # Reverse lookup from model name to identifier
        model_map = {
            "gpt-4-0125-preview": "gpt-4o",
            "gpt-4": "gpt-4",
            "claude-3-5-sonnet-20241022": "claude-3.5",
            "claude-3-sonnet-20240229": "claude-3",
            "gemini-1.5-pro": "gemini-1.5",
            "gemini-2.0-flash": "gemini-2.0"
        }
        
        return model_map.get(model_name, model_name)
    
    async def stream_responses(
        self, 
        session_id: str, 
        user_input: str
    ) -> AsyncGenerator[StreamingResponse, None]:
        """Stream concurrent responses for a session"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        orchestrator = self.orchestrators[session_id]
        
        # Stream responses from all models
        async for response in orchestrator.stream_concurrent_responses(user_input):
            yield response
            
        # Update session timestamp
        self.sessions[session_id].updated_at = datetime.utcnow()    
    async def get_session(self, session_id: str) -> Optional[Session]:
        """Get session by ID"""
        # Try Redis first if available
        if self.use_redis:
            session = await redis_client.get_session(session_id)
            if session:
                # Restore memory state
                memory_state = await redis_client.get_memory_state(session_id)
                if memory_state and session_id not in self.memory_managers:
                    memory = GroupMemory(session_id)
                    memory.from_dict(memory_state)
                    self.memory_managers[session_id] = memory
                
                # Update with latest memory data
                if session_id in self.memory_managers:
                    memory = self.memory_managers[session_id]
                    session.messages = memory.messages
                    session.synapse_connections = memory.synapse_connections
                    session.collaboration_events = memory.collaboration_events
                
                return session
        
        # Fallback to in-memory
        if session_id in self.sessions:
            session = self.sessions[session_id]
            # Update with latest memory data
            if session_id in self.memory_managers:
                memory = self.memory_managers[session_id]
                session.messages = memory.messages
                session.synapse_connections = memory.synapse_connections
                session.collaboration_events = memory.collaboration_events
            return session
        return None
    
    def get_active_sessions(self) -> List[Session]:
        """Get all active sessions"""
        return [s for s in self.sessions.values() if s.is_active]
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get collaboration statistics for a session"""
        if session_id not in self.memory_managers:
            return {}
        
        memory = self.memory_managers[session_id]
        return memory.get_collaboration_stats()
    
    async def end_session(self, session_id: str):
        """End a session and clean up resources"""
        if session_id in self.sessions:
            self.sessions[session_id].is_active = False
            
            # Clean up orchestrator
            if session_id in self.orchestrators:
                del self.orchestrators[session_id]
            
            # Clean up from Redis if available
            if self.use_redis:
                await redis_client.delete_session(session_id)
            
            logger.info(f"Ended session: {session_id}")
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get all available models that can be used"""
        return ModelFactory.get_available_models()