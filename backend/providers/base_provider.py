"""
Base AI Provider Interface
Defines the contract for all AI model providers
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, Optional
from models.schemas import ModelPersonality, CollaborationState
import asyncio
from loguru import logger


class AIProvider(ABC):
    """Abstract base class for AI model providers"""
    
    def __init__(self, api_key: str, model_name: str, personality: ModelPersonality):
        self.api_key = api_key
        self.model_name = model_name
        self.personality = personality
        self.state = CollaborationState.STANDBY
        
    @abstractmethod
    async def generate_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Generate streaming response from the model"""
        pass
    
    @abstractmethod
    async def generate_complete(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """Generate complete response (non-streaming)"""
        pass

    
    def prepare_messages(self, context: list, current_input: str) -> list:
        """Prepare messages with personality prefix"""
        # Add system message with personality
        system_message = {
            "role": "system",
            "content": f"{self.personality.prompt_prefix}\n\n"
                      f"You are participating in a collaborative panel discussion. "
                      f"Build on other responses when relevant, showing your {self.personality.collaboration_style} approach. "
                      f"Be concise but insightful."
        }
        
        # Combine context and current input
        messages = [system_message] + context + [
            {"role": "user", "content": current_input}
        ]
        
        return messages
    
    def set_state(self, state: CollaborationState):
        """Update the provider's collaboration state"""
        self.state = state
        logger.debug(f"{self.personality.role} state changed to: {state}")
    
    @abstractmethod
    def get_token_count(self, text: str) -> int:
        """Get token count for the given text"""
        pass
    
    def __repr__(self):
        return f"{self.__class__.__name__}(model={self.model_name}, role={self.personality.role})"
