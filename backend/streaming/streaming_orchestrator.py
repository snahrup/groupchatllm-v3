"""
Streaming Orchestrator
Manages concurrent AI model responses and streaming coordination
"""

import asyncio
from typing import List, Dict, Any, AsyncGenerator, Optional
from providers.base_provider import AIProvider
from memory.group_memory import GroupMemory
from models.schemas import Message, MessageType, CollaborationState, StreamingResponse
from datetime import datetime
from loguru import logger
import uuid
import json


class StreamingOrchestrator:
    """
    Orchestrates concurrent streaming from multiple AI models
    Handles timing, coordination, and synapse detection
    """
    
    def __init__(self, memory: GroupMemory):
        self.memory = memory
        self.active_streams: Dict[str, Any] = {}
        self.providers: Dict[str, AIProvider] = {}
        
    def add_provider(self, model_id: str, provider: AIProvider):
        """Add an AI provider to the orchestration"""
        self.providers[model_id] = provider
        logger.info(f"Added provider: {model_id} - {provider.personality.role}")
    
    async def stream_concurrent_responses(
        self, 
        user_input: str,
        message_type: MessageType = MessageType.MISSION
    ) -> AsyncGenerator[StreamingResponse, None]:
        """
        Stream responses from all active models concurrently
        This is the main method that enables collaborative intelligence
        """
        # Add user message to memory
        user_message = Message(
            session_id=self.memory.session_id,
            content=user_input,
            message_type=message_type,
            model_source=None  # User message
        )
        await self.memory.add_message(user_message, "user")
        
        # Create streaming tasks for each provider with token-aware context
        tasks = []
        for model_id, provider in self.providers.items():
            # Get token-aware context for this specific model
            model_context = self.memory.get_token_aware_context(
                provider.model_name,
                token_limit=8000 if "gpt-4" in provider.model_name else 4000
            )
            
            task = asyncio.create_task(
                self._stream_from_provider(model_id, provider, model_context)
            )
            tasks.append((model_id, task))
        
        # Stream responses as they arrive
        active_tasks = dict(tasks)
        completed_models = set()        
        while active_tasks:
            # Wait for any task to produce a result
            done, pending = await asyncio.wait(
                active_tasks.values(),
                return_when=asyncio.FIRST_COMPLETED
            )
            
            for task in done:
                # Find which model this task belongs to
                model_id = next(m for m, t in active_tasks.items() if t == task)
                
                try:
                    # Get the streaming response chunk
                    response_chunk = await task
                    
                    if response_chunk:  # Still streaming
                        yield response_chunk
                        
                        # Create a new task to continue streaming
                        provider = self.providers[model_id]
                        new_task = asyncio.create_task(
                            self._get_next_chunk(model_id, provider)
                        )
                        active_tasks[model_id] = new_task
                    else:
                        # Model finished streaming
                        completed_models.add(model_id)
                        del active_tasks[model_id]
                        
                        # Send completion signal
                        yield StreamingResponse(
                            session_id=self.memory.session_id,
                            model_source=model_id,
                            content="",
                            message_type=MessageType.RESPONSE,
                            is_complete=True
                        )
                        
                except Exception as e:
                    logger.error(f"Error streaming from {model_id}: {e}")
                    del active_tasks[model_id]
                    
                    # Inject system message about provider failure
                    failure_response = await self._handle_provider_failure(model_id, str(e))
                    if failure_response:
                        yield failure_response    
    async def _stream_from_provider(
        self, 
        model_id: str, 
        provider: AIProvider, 
        context: List[Dict[str, Any]]
    ) -> Optional[StreamingResponse]:
        """
        Start streaming from a single provider
        """
        try:
            # Update provider state
            provider.set_state(CollaborationState.THINKING)
            
            # Initialize streaming for this model
            self.active_streams[model_id] = {
                "buffer": "",
                "message_id": str(uuid.uuid4()),
                "started_at": datetime.utcnow(),
                "generator": provider.generate_stream(context)
            }
            
            # Start streaming
            provider.set_state(CollaborationState.RESPONDING)
            
            # Get first chunk
            return await self._get_next_chunk(model_id, provider)
            
        except Exception as e:
            logger.error(f"Error starting stream for {model_id}: {e}")
            provider.set_state(CollaborationState.ERROR)
            # Don't return the failure response here - let the main loop handle it
            raise e    
    async def _get_next_chunk(self, model_id: str, provider: AIProvider) -> Optional[StreamingResponse]:
        """
        Get the next chunk from a model's stream
        """
        if model_id not in self.active_streams:
            return None
        
        stream_data = self.active_streams[model_id]
        
        try:
            # Get next chunk from generator
            chunk = await anext(stream_data["generator"], None)
            
            if chunk:
                # Add to buffer
                stream_data["buffer"] += chunk
                
                # Check for synapse patterns in real-time
                synapse_detected = await self._detect_realtime_synapse(
                    model_id, stream_data["buffer"]
                )
                
                # Return streaming response
                return StreamingResponse(
                    session_id=self.memory.session_id,
                    model_source=model_id,
                    content=chunk,
                    message_type=MessageType.RESPONSE,
                    is_complete=False,
                    synapse_detected=synapse_detected
                )
            else:
                # Stream completed - save complete message
                await self._complete_message(model_id, provider)
                return None
                
        except Exception as e:
            logger.error(f"Error getting chunk from {model_id}: {e}")
            # Set error state and raise to be handled by main loop
            if model_id in self.providers:
                self.providers[model_id].set_state(CollaborationState.ERROR)
            raise e    
    async def _complete_message(self, model_id: str, provider: AIProvider):
        """
        Complete a message and add it to memory
        """
        if model_id not in self.active_streams:
            return
        
        stream_data = self.active_streams[model_id]
        complete_content = stream_data["buffer"]
        
        # Create message object
        message = Message(
            id=stream_data["message_id"],
            session_id=self.memory.session_id,
            content=complete_content,
            message_type=MessageType.RESPONSE,
            model_source=model_id
        )
        
        # Add to memory (will trigger synapse detection)
        await self.memory.add_message(message, model_id)
        
        # Update provider state
        provider.set_state(CollaborationState.COMPLETE)
        
        # Clean up streaming data
        del self.active_streams[model_id]
        
        logger.info(f"Completed message from {model_id}: {len(complete_content)} chars")
    
    async def _detect_realtime_synapse(self, model_id: str, partial_content: str) -> Optional[str]:
        """
        Detect synapses in real-time as models are streaming
        """
        # Look for phrases that indicate building on others
        building_phrases = [
            "building on", "as mentioned", "following up",
            "to add to", "expanding on", "great point"
        ]
        
        content_lower = partial_content.lower()
        
        # Quick check for building phrases
        if any(phrase in content_lower for phrase in building_phrases):
            # Find the most recent message from another model
            recent_messages = self.memory.messages[-5:]
            for msg in reversed(recent_messages):
                if msg.model_source and msg.model_source != model_id:
                    return msg.id
        
        return None
    
    def get_active_models(self) -> List[str]:
        """Get list of currently active/streaming models"""
        return list(self.active_streams.keys())
    
    def get_provider_states(self) -> Dict[str, CollaborationState]:
        """Get current state of all providers"""
        return {
            model_id: provider.state 
            for model_id, provider in self.providers.items()
        }
    
    async def _handle_provider_failure(self, model_id: str, error_message: str) -> Optional[StreamingResponse]:
        """Handle provider failure by injecting system message"""
        # Get the provider's personality for a proper name
        provider = self.providers.get(model_id)
        if not provider:
            return None
            
        model_name = provider.personality.role if hasattr(provider, 'personality') else model_id
        
        # Create system message
        system_message = Message(
            session_id=self.memory.session_id,
            content=f"[System Notice] {model_name} has temporarily left the conversation due to a technical issue.",
            model_source="system",
            message_type=MessageType.SYSTEM,
            metadata={
                "error_type": "provider_failure",
                "failed_model": model_id,
                "error_details": error_message
            }
        )
        
        # Add to memory - this will propagate to other models
        await self.memory.add_message(system_message, "system")
        
        # Notify through SSE
        failure_response = StreamingResponse(
            session_id=self.memory.session_id,
            model_source="system",
            content=system_message.content,
            message_type=MessageType.SYSTEM,
            is_complete=True,
            metadata={
                "event": "provider_failure",
                "model": model_id
            }
        )
        
        # Update provider state
        provider.set_state(CollaborationState.ERROR)
        
        logger.warning(f"Provider {model_id} failed and system message injected")
        
        return failure_response
