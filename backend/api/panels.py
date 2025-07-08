"""
Panels API Endpoints
Manages AI panel configurations and available models
"""

from fastapi import APIRouter, HTTPException
from providers.model_factory import ModelFactory
from loguru import logger
from typing import List, Dict, Any, Optional


router = APIRouter()


@router.get("/test-models")
async def test_models():
    """Test endpoint to debug model loading"""
    try:
        from providers.model_factory import ModelFactory
        
        # Try to load personas directly
        personas = ModelFactory.load_personas()
        logger.info(f"Loaded personas: {list(personas.keys())}")
        
        # Check types
        for model_id, persona in personas.items():
            logger.info(f"Model {model_id}: type={type(persona)}, has_provider={hasattr(persona, 'provider')}")
        
        # Try get_available_models
        available = ModelFactory.get_available_models()
        logger.info(f"Available models: {list(available.keys())}")
        
        return {
            "personas_loaded": list(personas.keys()),
            "available_models": list(available.keys()),
            "test": "success"
        }
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        return {"error": str(e), "test": "failed"}


@router.get("/available-models", response_model=Dict[str, List[Dict[str, Any]]])
async def get_available_models():
    """Get all available AI models that can be used in panels"""
    try:
        models = ModelFactory.get_available_models()
        logger.info(f"Got {len(models)} models from factory")
        
        result_models = []
        for model_id, personality in models.items():
            logger.info(f"Processing model {model_id}: type={type(personality)}")
            
            # Handle both dict and ModelPersonality types
            if hasattr(personality, 'provider'):
                # It's a ModelPersonality object
                model_data = {
                    "id": model_id,
                    "provider": personality.provider,
                    "model_name": personality.model_name,
                    "role": personality.role,
                    "icon": personality.icon,
                    "description": personality.prompt_prefix,
                    "collaboration_style": personality.collaboration_style,
                    "color_theme": personality.color_theme
                }
            else:
                # It's a dict
                model_data = {
                    "id": model_id,
                    "provider": personality.get('provider'),
                    "model_name": personality.get('model_name'),
                    "role": personality.get('role'),
                    "icon": personality.get('icon'),
                    "description": personality.get('prompt_prefix'),
                    "collaboration_style": personality.get('collaboration_style'),
                    "color_theme": personality.get('color_theme')
                }
            
            result_models.append(model_data)
        
        return {"models": result_models}
    except Exception as e:
        logger.error(f"Error getting available models: {e}")
        logger.error(f"Full traceback: ", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/presets", response_model=Dict[str, List[Dict[str, Any]]])
async def get_panel_presets():
    """Get predefined panel configurations"""
    presets = [
        {
            "id": "balanced",
            "name": "Balanced Panel",
            "description": "A well-rounded team with strategic, creative, and analytical perspectives",
            "models": ["gpt-4o", "claude-3.5", "gemini-1.5"],
            "icon": "⚖️"
        },
        {
            "id": "creative",
            "name": "Creative Think Tank",
            "description": "Maximum innovation with creative and exploratory models",
            "models": ["claude-3.5", "claude-3", "gemini-2.0"],
            "icon": "🎨"
        },
        {
            "id": "analytical",
            "name": "Data-Driven Team",
            "description": "Deep analysis with strategic and evidence-based approaches",
            "models": ["gpt-4o", "gpt-4", "gemini-1.5"],
            "icon": "📊"
        },
        {
            "id": "full",
            "name": "Full Expert Panel", 
            "description": "All available models for maximum perspective diversity",
            "models": ["gpt-4o", "claude-3.5", "gemini-1.5", "gpt-4", "claude-3", "gemini-2.0"],
            "icon": "🌟"
        }
    ]
    
    # Filter presets to only include available models
    available_models = set(ModelFactory.get_available_models().keys())
    
    filtered_presets = []
    for preset in presets:
        available_in_preset = [m for m in preset["models"] if m in available_models]
        if len(available_in_preset) >= 2:  # At least 2 models needed
            preset["models"] = available_in_preset
            preset["available_count"] = len(available_in_preset)
            filtered_presets.append(preset)
    
    return {"presets": filtered_presets}


@router.post("/validate", response_model=Dict[str, Any])
async def validate_panel_configuration(models: List[str]):
    """Validate a panel configuration"""
    if len(models) < 2:
        return {
            "valid": False,
            "reason": "At least 2 models required for collaboration"
        }
    
    if len(models) > 6:
        return {
            "valid": False,
            "reason": "Maximum 6 models recommended for optimal performance"
        }
    
    available_models = ModelFactory.get_available_models()
    invalid_models = [m for m in models if m not in available_models]
    
    if invalid_models:
        return {
            "valid": False,
            "reason": f"Invalid or unavailable models: {', '.join(invalid_models)}"
        }
    
    return {
        "valid": True,
        "message": "Panel configuration is valid"
    }
