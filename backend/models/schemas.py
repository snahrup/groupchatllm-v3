"""
Core data models for GroupChatLLM v3
Defines the structure for sessions, messages, and collaboration events
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


# Enums matching naming conventions
class MessageType(str, Enum):
    MISSION = "mission"
    RESPONSE = "response"
    GUIDANCE = "guidance"
    SYNTHESIS = "synthesis"
    ANALYSIS = "analysis"
    CREATIVE = "creative"
    SYSTEM = "system"


class CollaborationState(str, Enum):
    THINKING = "thinking"
    RESPONDING = "responding"
    BUILDING = "building"
    SYNTHESIZING = "synthesizing"
    COMPLETE = "complete"
    STANDBY = "standby"
    ERROR = "error"


class SynapseType(str, Enum):
    REINFORCEMENT = "reinforcement"
    BUILDING = "building"
    SYNTHESIS = "synthesis"
    CONTRAST = "contrast"
    CLARIFICATION = "clarification"


# Model configurations
class ModelPersonality(BaseModel):
    """Configuration for AI model personalities"""
    provider: str
    model_name: str
    role: str
    icon: str
    prompt_prefix: str
    collaboration_style: str
    color_theme: str  # For frontend styling


class PanelistConfig(BaseModel):
    """Configuration for a single panelist (AI model)"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personality: ModelPersonality
    is_active: bool = True
    state: CollaborationState = CollaborationState.STANDBY
    
    
class Message(BaseModel):
    """Individual message in a conversation"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    content: str
    message_type: MessageType
    model_source: Optional[str] = None  # Which model sent this
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    synapse_connections: List[str] = Field(default_factory=list)  # Message IDs this builds on


class SynapseConnection(BaseModel):
    """Represents a collaboration connection between messages"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_message_id: str
    to_message_id: str
    synapse_type: SynapseType
    strength: float = Field(ge=0.0, le=1.0)  # 0-1 collaboration strength
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CollaborationEvent(BaseModel):
    """Event tracking when models collaborate"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    event_type: str  # "synapse_detected", "building_started", etc.
    involved_models: List[str]
    description: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Session(BaseModel):
    """Complete session with panel configuration"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mission: str
    panelist_configs: List[PanelistConfig]
    messages: List[Message] = Field(default_factory=list)
    synapse_connections: List[SynapseConnection] = Field(default_factory=list)
    collaboration_events: List[CollaborationEvent] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    metadata: Dict[str, Any] = Field(default_factory=dict)


# Request/Response models for API
class CreateSessionRequest(BaseModel):
    """Request to create a new session"""
    mission: str
    selected_models: List[str] = Field(default=None)  # Model identifiers like "gpt-4o", "claude-3.5"
    panelists: Optional[List[Dict[str, Any]]] = Field(default=None)  # New: support custom personas
    
    def validate_request(self):
        """Validate that either selected_models or panelists is provided"""
        if not self.selected_models and not self.panelists:
            raise ValueError("Either selected_models or panelists must be provided")
        return self


class StreamingResponse(BaseModel):
    """Format for SSE streaming responses"""
    session_id: str
    model_source: str
    content: str
    message_type: MessageType
    is_complete: bool = False
    synapse_detected: Optional[str] = None  # Message ID if building on another
    metadata: Dict[str, Any] = Field(default_factory=dict)
