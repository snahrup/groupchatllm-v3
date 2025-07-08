"""
Model Factory
Creates appropriate AI provider instances based on model selection
Now loads personas from configuration file for flexibility
"""

from typing import Dict, Optional
from providers.base_provider import AIProvider
from providers.openai_provider import OpenAIProvider
from providers.anthropic_provider import AnthropicProvider
from providers.google_provider import GoogleProvider
from models.schemas import ModelPersonality
import os
import yaml
from pathlib import Path
from loguru import logger


class ModelFactory:
    """Factory for creating AI provider instances"""
    
    # Provider class mappings
    providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider
    }
    
    # Cache for loaded personas
    _personas_cache: Optional[Dict[str, ModelPersonality]] = None
    
    @classmethod
    def load_personas(cls) -> Dict[str, ModelPersonality]:
        """Load personas from configuration file"""
        # Always reload in development to catch changes
        # if cls._personas_cache is not None:
        #     return cls._personas_cache
        
        # Find personas.yaml
        config_path = Path(__file__).parent.parent / "config" / "personas.yaml"
        
        if not config_path.exists():
            logger.error(f"Personas config not found at {config_path}")
            return {}
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = yaml.safe_load(f)
                
            personas = {}
            for model_id, persona_data in config.get('personas', {}).items():
                try:
                    personas[model_id] = ModelPersonality(**persona_data)
                    logger.info(f"Successfully loaded persona: {model_id}")
                except Exception as e:
                    logger.error(f"Error creating ModelPersonality for {model_id}: {e}")
                    logger.error(f"Persona data: {persona_data}")
                    # Skip this persona if it fails to load
                    continue
            
            cls._personas_cache = personas
            logger.info(f"Loaded {len(personas)} personas from configuration")
            return personas
            
        except Exception as e:
            logger.error(f"Error loading personas: {e}")
            return {}    
    @classmethod
    def create_model(cls, model_identifier: str, custom_persona: Optional[dict] = None) -> Optional[AIProvider]:
        """
        Create an AI provider instance for the specified model
        
        Args:
            model_identifier: The model ID (e.g., "gpt-4o")
            custom_persona: Optional custom persona override
        """
        personas = cls.load_personas()
        
        # Use custom persona if provided, otherwise use default
        if custom_persona:
            try:
                personality = ModelPersonality(**custom_persona)
                logger.info(f"Using custom persona for {model_identifier}")
            except Exception as e:
                logger.error(f"Invalid custom persona: {e}")
                return None
        else:
            if model_identifier not in personas:
                logger.error(f"Unknown model identifier: {model_identifier}")
                return None
            personality = personas[model_identifier]
        
        provider_name = personality.provider
        
        # Get API key
        api_key = cls._get_api_key(provider_name)
        if not api_key:
            logger.error(f"No API key found for provider: {provider_name}")
            return None
        
        # Get provider class
        provider_class = cls.providers.get(provider_name)
        if not provider_class:
            logger.error(f"Unknown provider: {provider_name}")
            return None
        
        try:
            # Create provider instance
            provider = provider_class(
                api_key=api_key,
                model_name=personality.model_name,
                personality=personality
            )
            logger.info(f"Successfully created provider for {model_identifier}")
            return provider
        except Exception as e:
            logger.error(f"Error creating provider for {model_identifier}: {e}")
            return None    
    @classmethod
    def get_available_models(cls) -> Dict[str, ModelPersonality]:
        """Get all available models with their configurations"""
        personas = cls.load_personas()
        available = {}
        
        for model_id, personality in personas.items():
            # Check if API key exists for this provider
            api_key = cls._get_api_key(personality.provider)
            if api_key:
                available[model_id] = personality
        
        return available
    
    @classmethod
    def _get_api_key(cls, provider_name: str) -> Optional[str]:
        """Get API key for a provider from environment variables"""
        key_mapping = {
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY", 
            "google": "GOOGLE_API_KEY"
        }
        
        env_var = key_mapping.get(provider_name)
        if not env_var:
            return None
            
        return os.getenv(env_var)