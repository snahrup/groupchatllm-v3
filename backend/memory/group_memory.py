"""
Group Memory System
Manages shared context and instant propagation across all models
Updated: 2025-07-06 23:35:00 - Added semantic synapse detection
Updated: 2025-07-07 04:35:00 - Added dynamic context summarization
"""

from typing import List, Dict, Any, Optional
from models.schemas import Message, SynapseConnection, CollaborationEvent, MessageType, SynapseType
from memory.semantic_synapse_detector import semantic_detector
from services.context_summarizer import ContextSummarizer
from datetime import datetime
import asyncio
from loguru import logger
import json


class GroupMemory:
    """
    Shared memory system for collaborative AI sessions
    Enables instant context propagation and synapse detection
    """
    
    def __init__(self, session_id: str, max_context_length: int = 10000):
        self.session_id = session_id
        self.messages: List[Message] = []
        self.context_summary: str = ""
        self.synapse_connections: List[SynapseConnection] = []
        self.collaboration_events: List[CollaborationEvent] = []
        self.max_context_length = max_context_length
        
        # Track active models and their states
        self.active_models: Dict[str, Any] = {}
        
        # Callbacks for real-time updates
        self._update_callbacks = []
        
        # Initialize summarizer
        self.summarizer = ContextSummarizer()
        
        logger.info(f"GroupMemory initialized for session: {session_id}")
    
    async def add_message(self, message: Message, model_source: str):
        """
        Add a new message and propagate to all models instantly
        """
        # Set the model source
        message.model_source = model_source
        
        # Add to message history
        self.messages.append(message)
        
        # Detect synapses if this is a model response
        if message.message_type in [MessageType.RESPONSE, MessageType.SYNTHESIS, MessageType.ANALYSIS]:
            await self._detect_synapse_connections(message)
        
        # Update context summary
        await self._update_context_summary()
        
        # Propagate to all active models
        await self._propagate_context()
        
        # Trigger update callbacks
        await self._trigger_updates("message_added", message)
        
        logger.debug(f"Message added from {model_source}: {message.id}")
    
    async def _detect_synapse_connections(self, new_message: Message):
        """
        Detect when models build on each other's ideas
        """
        if len(self.messages) < 2:
            return
        
        # Look at recent messages for potential connections
        recent_messages = self.messages[-5:-1]  # Last 4 messages before current        
        for prev_message in recent_messages:
            # Skip if same model or not a model message
            if (prev_message.model_source == new_message.model_source or 
                not prev_message.model_source):
                continue
            
            # Detect building patterns (simplified for now)
            synapse_type, strength = self._analyze_connection(prev_message, new_message)
            
            if synapse_type and strength > 0.3:  # Threshold for meaningful connection
                connection = SynapseConnection(
                    from_message_id=prev_message.id,
                    to_message_id=new_message.id,
                    synapse_type=synapse_type,
                    strength=strength
                )
                
                self.synapse_connections.append(connection)
                new_message.synapse_connections.append(prev_message.id)
                
                # Log collaboration event
                event = CollaborationEvent(
                    session_id=self.session_id,
                    event_type="synapse_detected",
                    involved_models=[prev_message.model_source, new_message.model_source],
                    description=f"{new_message.model_source} {synapse_type.value} {prev_message.model_source}'s idea"
                )
                self.collaboration_events.append(event)
                
                await self._trigger_updates("synapse_detected", connection)
                
                logger.info(f"Synapse detected: {synapse_type.value} between {prev_message.model_source} and {new_message.model_source}")    
    def _analyze_connection(self, prev_message: Message, new_message: Message) -> tuple[Optional[SynapseType], float]:
        """
        Analyze the connection between two messages using semantic analysis
        Returns synapse type and strength (0-1)
        """
        # Use semantic detector for advanced analysis
        result = semantic_detector.detect_synapse(new_message, self.messages[-10:])
        
        if result:
            synapse_type, confidence, _ = result
            return synapse_type, confidence
            
        # Fallback: Simple keyword detection if semantic analysis fails
        # Keywords indicating different types of connections
        building_keywords = ["building on", "expanding", "adding to", "furthermore", "additionally"]
        synthesis_keywords = ["combining", "synthesizing", "bringing together", "integrating"]
        reinforcement_keywords = ["agree", "absolutely", "exactly", "reinforcing", "supporting"]
        clarification_keywords = ["clarifying", "specifically", "precisely", "to be clear"]
        
        content_lower = new_message.content.lower()
        
        # Check for explicit references
        if any(keyword in content_lower for keyword in building_keywords):
            return SynapseType.BUILDING, 0.8
        elif any(keyword in content_lower for keyword in synthesis_keywords):
            return SynapseType.SYNTHESIS, 0.9
        elif any(keyword in content_lower for keyword in reinforcement_keywords):
            return SynapseType.REINFORCEMENT, 0.7
        elif any(keyword in content_lower for keyword in clarification_keywords):
            return SynapseType.CLARIFICATION, 0.6
        
        # Check for implicit connections (simplified - could use embeddings in production)
        # For now, check if messages share significant terms
        prev_terms = set(prev_message.content.lower().split())
        new_terms = set(content_lower.split())
        overlap = len(prev_terms & new_terms) / max(len(prev_terms), len(new_terms))
        
        if overlap > 0.3:  # Significant term overlap
            return SynapseType.BUILDING, overlap
        
        return None, 0.0    
    async def _update_context_summary(self):
        """
        Update the context summary using intelligent LLM summarization
        """
        # Check if summarization is needed
        if self.summarizer.should_summarize(self.messages):
            logger.info(f"Creating context summary for session {self.session_id}")
            
            # Check for cached summary first
            cached_summary = await self.summarizer.get_cached_summary(self.session_id)
            
            if cached_summary:
                self.context_summary = cached_summary
            else:
                # Create new summary
                summary = await self.summarizer.create_summary(self.messages)
                
                if summary:
                    self.context_summary = summary
                    # Cache for future use
                    await self.summarizer.cache_summary(self.session_id, summary)
                else:
                    # Fallback to basic summary
                    message_count = len(self.messages) - 10
                    self.context_summary = f"Previous discussion covered {message_count} messages. "
                    self.context_summary += "Key topics included the initial mission and collaborative responses."
    
    async def _propagate_context(self):
        """
        Instantly propagate context to all active models
        """
        # This is called whenever context changes
        # Active models will receive this through their update callbacks
        context = self.get_context_for_models()
        
        await self._trigger_updates("context_updated", context)
        
    def get_context_for_models(self, max_messages: int = 20) -> List[Dict[str, Any]]:
        """
        Get formatted context for model consumption
        """
        context = []
        
        # Add context summary if exists
        if self.context_summary:
            context.append({
                "role": "system",
                "content": f"Context Summary: {self.context_summary}"
            })        
        # Add recent messages
        recent_messages = self.messages[-max_messages:] if len(self.messages) > max_messages else self.messages
        
        for msg in recent_messages:
            # Determine role based on message source and type
            if msg.message_type == MessageType.SYSTEM:
                role = "system"
            elif msg.model_source:
                role = "assistant"
            else:
                role = "user"
            
            # Add synapse information to content if relevant
            content = msg.content
            if msg.synapse_connections and role == "assistant":
                content = f"[Building on previous ideas] {content}"
            
            context.append({
                "role": role,
                "content": content,
                "metadata": {
                    "model_source": msg.model_source,
                    "message_type": msg.message_type.value,
                    "timestamp": msg.timestamp.isoformat(),
                    "synapse_connections": msg.synapse_connections
                }
            })
        
        return context
    
    def get_token_aware_context(self, model_name: str, token_limit: int = 4000) -> List[Dict[str, Any]]:
        """
        Get context that fits within token limits for specific models
        Uses dynamic summarization when needed
        """
        context = []
        
        # Always include the summary if available
        if self.context_summary:
            context.append({
                "role": "system", 
                "content": f"Previous Conversation Summary: {self.context_summary}"
            })
            # Estimate tokens used by summary
            summary_tokens = self.summarizer.estimate_tokens([
                Message(session_id="", content=self.context_summary, message_type=MessageType.SYSTEM, model_source="system")
            ], model_name)
        else:
            summary_tokens = 0
        
        # Calculate remaining token budget
        remaining_tokens = token_limit - summary_tokens - 200  # Reserve tokens for response
        
        # Add messages from most recent, backwards
        messages_to_include = []
        current_tokens = 0
        
        for msg in reversed(self.messages):
            msg_tokens = self.summarizer.estimate_tokens([msg], model_name)
            if current_tokens + msg_tokens <= remaining_tokens:
                messages_to_include.insert(0, msg)
                current_tokens += msg_tokens
            else:
                break
        
        # Format included messages
        for msg in messages_to_include:
            # Determine role based on message source and type
            if msg.message_type == MessageType.SYSTEM:
                role = "system"
            elif msg.model_source:
                role = "assistant"
            else:
                role = "user"
            
            content = msg.content
            if msg.synapse_connections and role == "assistant":
                content = f"[Building on previous ideas] {content}"
            
            context.append({
                "role": role,
                "content": content,
                "metadata": {
                    "model_source": msg.model_source,
                    "message_type": msg.message_type.value,
                    "timestamp": msg.timestamp.isoformat()
                }
            })
        
        return context
    
    def register_update_callback(self, callback):
        """Register a callback for memory updates"""
        self._update_callbacks.append(callback)
        
    def unregister_update_callback(self, callback):
        """Unregister a callback"""
        if callback in self._update_callbacks:
            self._update_callbacks.remove(callback)
    
    async def _trigger_updates(self, event_type: str, data: Any):
        """Trigger all registered callbacks"""
        for callback in self._update_callbacks:
            try:
                await callback(event_type, data)
            except Exception as e:
                logger.error(f"Error in update callback: {e}")
    
    def get_collaboration_stats(self) -> Dict[str, Any]:
        """Get statistics about collaboration in this session"""
        
        # Count synapses by type
        synapse_counts = {}
        for connection in self.synapse_connections:
            synapse_type = connection.synapse_type.value
            synapse_counts[synapse_type] = synapse_counts.get(synapse_type, 0) + 1
        
        # Count messages by model
        message_counts = {}
        for msg in self.messages:
            if msg.model_source:
                message_counts[msg.model_source] = message_counts.get(msg.model_source, 0) + 1
        
        return {
            "total_messages": len(self.messages),
            "total_synapses": len(self.synapse_connections),
            "synapse_breakdown": synapse_counts,
            "message_breakdown": message_counts,
            "collaboration_events": len(self.collaboration_events),
            "collaboration_density": len(self.synapse_connections) / max(len(self.messages), 1)
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize GroupMemory to dictionary for Redis storage"""
        return {
            "session_id": self.session_id,
            "messages": [msg.model_dump() for msg in self.messages],
            "synapse_connections": [syn.model_dump() for syn in self.synapse_connections],
            "collaboration_events": [evt.model_dump() for evt in self.collaboration_events],
            "context_summary": self.context_summary,
            "model_contexts": self.model_contexts
        }
    
    def from_dict(self, data: Dict[str, Any]):
        """Restore GroupMemory from dictionary"""
        self.session_id = data.get("session_id", self.session_id)
        self.messages = [Message(**msg) for msg in data.get("messages", [])]
        self.synapse_connections = [SynapseConnection(**syn) for syn in data.get("synapse_connections", [])]
        self.collaboration_events = [CollaborationEvent(**evt) for evt in data.get("collaboration_events", [])]
        self.context_summary = data.get("context_summary", "")
        self.model_contexts = data.get("model_contexts", {})
        return {
            "total_messages": len(self.messages),
            "total_synapses": len(self.synapse_connections),
            "collaboration_events": len(self.collaboration_events),
            "synapse_types": {
                synapse_type.value: sum(1 for s in self.synapse_connections if s.synapse_type == synapse_type)
                for synapse_type in SynapseType
            },
            "average_synapse_strength": sum(s.strength for s in self.synapse_connections) / len(self.synapse_connections) if self.synapse_connections else 0
        }
