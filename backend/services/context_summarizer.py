"""
Context Summarization Service
Uses LLM to intelligently summarize conversation history
"""

from typing import List, Dict, Any, Optional
from models.schemas import Message, MessageType
from providers.openai_provider import OpenAIProvider
from loguru import logger
import tiktoken
import asyncio
import os


class ContextSummarizer:
    """
    Manages intelligent summarization of conversation context
    Uses a separate LLM call to create concise summaries
    """
    
    def __init__(self):
        # Use GPT-3.5 for cost-effective summarization
        self.summarizer = None
        api_key = os.getenv("OPENAI_API_KEY")
        
        if api_key:
            from models.schemas import ModelPersonality
            personality = ModelPersonality(
                provider="openai",
                model_name="gpt-3.5-turbo-16k",
                role="Summarizer",
                icon="📝",
                prompt_prefix="You are a concise summarizer. Create brief, informative summaries.",
                collaboration_style="analytical",
                color_theme="gray"
            )            
            try:
                self.summarizer = OpenAIProvider(
                    api_key=api_key,
                    model_name="gpt-3.5-turbo-16k",
                    personality=personality
                )
                logger.info("Context summarizer initialized with GPT-3.5")
            except Exception as e:
                logger.error(f"Failed to initialize summarizer: {e}")
        else:
            logger.warning("No OpenAI API key found - summarization disabled")
    
    def estimate_tokens(self, messages: List[Message], model: str = "gpt-4") -> int:
        """Estimate token count for messages"""
        try:
            encoding = tiktoken.encoding_for_model(model)
        except:
            encoding = tiktoken.get_encoding("cl100k_base")
        
        total_tokens = 0
        for msg in messages:
            total_tokens += len(encoding.encode(msg.content))
            # Add overhead for message structure
            total_tokens += 4  # Tokens for role, etc.
        
        return total_tokens    
    def should_summarize(self, messages: List[Message], context_limit: int = 3000) -> bool:
        """
        Determine if summarization is needed based on token count
        """
        if len(messages) < 10:
            return False
        
        # Check token count of recent messages
        recent_messages = messages[-20:]  # Last 20 messages
        token_count = self.estimate_tokens(recent_messages)
        
        # Summarize if approaching context limit
        return token_count > context_limit * 0.7
    
    async def create_summary(
        self, 
        messages: List[Message], 
        keep_recent: int = 10
    ) -> Optional[str]:
        """
        Create an intelligent summary of older messages
        """
        if not self.summarizer:
            return None
        
        if len(messages) <= keep_recent:
            return None
        
        # Messages to summarize
        to_summarize = messages[:-keep_recent]
        
        # Format messages for summarization
        conversation = []
        for msg in to_summarize:
            role = "User" if not msg.model_source else msg.model_source
            conversation.append(f"{role}: {msg.content[:500]}...")  # Truncate long messages        
        # Create summarization prompt
        prompt = f"""Summarize this collaborative AI discussion concisely:

{chr(10).join(conversation)}

Create a brief summary (max 200 words) that:
1. Captures the main mission/goal
2. Lists key insights from each AI participant
3. Notes any important decisions or conclusions
4. Highlights areas of collaboration/disagreement

Summary:"""
        
        try:
            # Get summary from LLM
            summary_context = [{"role": "user", "content": prompt}]
            
            # Collect full response
            full_summary = ""
            async for chunk in self.summarizer.generate_stream(summary_context):
                full_summary += chunk
            
            logger.info(f"Created summary of {len(to_summarize)} messages")
            return full_summary.strip()
            
        except Exception as e:
            logger.error(f"Error creating summary: {e}")
            # Fallback to basic summary
            return self._create_basic_summary(to_summarize)    
    def _create_basic_summary(self, messages: List[Message]) -> str:
        """Fallback basic summary without LLM"""
        # Count messages by source
        source_counts = {}
        for msg in messages:
            source = msg.model_source or "User"
            source_counts[source] = source_counts.get(source, 0) + 1
        
        # Build summary
        summary = f"Previous discussion ({len(messages)} messages): "
        summary += ", ".join([f"{source} ({count})" for source, count in source_counts.items()])
        
        # Add first user message as context
        for msg in messages:
            if not msg.model_source:  # User message
                summary += f". Initial request: {msg.content[:100]}..."
                break
        
        return summary
    
    async def get_cached_summary(self, session_id: str) -> Optional[str]:
        """Get cached summary if available (for Redis implementation)"""
        # TODO: Implement Redis caching
        return None
    
    async def cache_summary(self, session_id: str, summary: str):
        """Cache summary for reuse (for Redis implementation)"""
        # TODO: Implement Redis caching
        pass