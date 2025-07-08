"""
Anthropic Provider Implementation
Handles Claude 3.5 Sonnet and other Claude models
"""

from typing import AsyncGenerator, Optional
import anthropic
from anthropic import AsyncAnthropic
from providers.base_provider import AIProvider
from models.schemas import ModelPersonality
from loguru import logger


class AnthropicProvider(AIProvider):
    """Anthropic API provider for Claude models"""
    
    def __init__(self, api_key: str, model_name: str, personality: ModelPersonality):
        super().__init__(api_key, model_name, personality)
        self.client = AsyncAnthropic(api_key=api_key)
        
    async def generate_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response from Anthropic"""
        try:
            # Convert messages to Anthropic format
            prepared_messages = self._convert_to_anthropic_format(messages)
            
            async with self.client.messages.stream(
                model=self.model_name,
                messages=prepared_messages["messages"],
                system=prepared_messages["system"],
                temperature=temperature,
                max_tokens=max_tokens or 4096
            ) as stream:
                async for text in stream.text_stream:
                    yield text
                    
        except Exception as e:
            logger.error(f"Anthropic streaming error: {e}")
            yield f"[Error: {str(e)}]"
    
    async def generate_complete(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """Get complete response from Anthropic"""
        try:
            prepared_messages = self._convert_to_anthropic_format(messages)
            
            response = await self.client.messages.create(
                model=self.model_name,
                messages=prepared_messages["messages"],
                system=prepared_messages["system"],
                temperature=temperature,
                max_tokens=max_tokens or 4096
            )
            
            return response.content[0].text
            
        except Exception as e:
            logger.error(f"Anthropic completion error: {e}")
            return f"[Error: {str(e)}]"
    
    def _convert_to_anthropic_format(self, messages: list) -> dict:
        """Convert messages to Anthropic's expected format"""
        # Extract system message
        system_content = f"{self.personality.prompt_prefix}\n\n" \
                        f"You are participating in a collaborative panel discussion. " \
                        f"Build on other responses when relevant, showing your {self.personality.collaboration_style} approach."        
        # Filter out system messages and prepare for Anthropic
        anthropic_messages = []
        for msg in messages:
            if msg["role"] != "system":
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        return {
            "system": system_content,
            "messages": anthropic_messages
        }
    
    def get_token_count(self, text: str) -> int:
        """Estimate token count for Claude models"""
        # Rough estimation: ~4 characters per token
        return len(text) // 4
