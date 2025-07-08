"""
Google Provider Implementation
Handles Gemini 1.5 Pro and other Google models
"""

from typing import AsyncGenerator, Optional
import google.generativeai as genai
from providers.base_provider import AIProvider
from models.schemas import ModelPersonality
from loguru import logger
import asyncio


class GoogleProvider(AIProvider):
    """Google API provider for Gemini models"""
    
    def __init__(self, api_key: str, model_name: str, personality: ModelPersonality):
        super().__init__(api_key, model_name, personality)
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        
    async def generate_stream(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """Stream response from Google Gemini"""
        try:
            # Convert messages to Gemini format
            chat_history = self._convert_to_gemini_format(messages)
            
            # Create chat session
            chat = self.model.start_chat(history=chat_history[:-1])
            
            # Stream the response
            response = await chat.send_message_async(
                chat_history[-1]["parts"][0],
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                ),
                stream=True
            )            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Google Gemini streaming error: {e}")
            yield f"[Error: {str(e)}]"
    
    async def generate_complete(
        self,
        messages: list,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> str:
        """Get complete response from Google Gemini"""
        try:
            chat_history = self._convert_to_gemini_format(messages)
            chat = self.model.start_chat(history=chat_history[:-1])
            
            response = await chat.send_message_async(
                chat_history[-1]["parts"][0],
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens
                )
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Google Gemini completion error: {e}")
            return f"[Error: {str(e)}]"    
    def _convert_to_gemini_format(self, messages: list) -> list:
        """Convert messages to Gemini's expected format"""
        gemini_messages = []
        
        # Add system context as first user message
        system_prompt = f"{self.personality.prompt_prefix}\n\n" \
                       f"You are participating in a collaborative panel discussion. " \
                       f"Build on other responses when relevant, showing your {self.personality.collaboration_style} approach."
        
        gemini_messages.append({
            "role": "user",
            "parts": [system_prompt]
        })
        
        gemini_messages.append({
            "role": "model",
            "parts": ["I understand. I'll participate as the " + self.personality.role + " in this collaborative discussion."]
        })
        
        # Convert remaining messages
        for msg in messages:
            if msg["role"] != "system":
                role = "user" if msg["role"] == "user" else "model"
                gemini_messages.append({
                    "role": role,
                    "parts": [msg["content"]]
                })
        
        return gemini_messages
    
    def get_token_count(self, text: str) -> int:
        """Estimate token count for Gemini models"""
        # Rough estimation similar to other models
        return len(text) // 4
