"""
OpenAI Provider Implementation
Handles GPT-4, GPT-4o, and o1 models
"""

from typing import AsyncGenerator, Optional
import openai
from openai import AsyncOpenAI
from providers.base_provider import AIProvider
from models.schemas import ModelPersonality
from loguru import logger
import tiktoken


class OpenAIProvider(AIProvider):
    """OpenAI API provider for GPT models"""
    
    def __init__(self, api_key: str, model_name: str, personality: ModelPersonality):
        super().__init__(api_key, model_name, personality)
        self.client = AsyncOpenAI(api_key=api_key)
        self.encoding = tiktoken.encoding_for_model(model_name)
        
    async def generate_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response from OpenAI"""
        try:
            prepared_messages = self.prepare_messages(messages, messages[-1]["content"])
            
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=prepared_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.error(f"OpenAI streaming error: {e}")
            yield f"[Error: {str(e)}]"
    
    async def generate_complete(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """Get complete response from OpenAI"""
        try:
            prepared_messages = self.prepare_messages(messages, messages[-1]["content"])
            
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=prepared_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"OpenAI completion error: {e}")
            return f"[Error: {str(e)}]"
    
    def get_token_count(self, text: str) -> int:
        """Count tokens using tiktoken"""
        return len(self.encoding.encode(text))
