"""
Personas API Endpoints
Manages user-created AI personas
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from loguru import logger
import uuid

router = APIRouter()


# Request/Response models
class CreatePersonaRequest(BaseModel):
    """Request to create a new persona"""
    name: str
    provider: str
    model_name: str
    role: str
    icon: str
    prompt_prefix: str
    collaboration_style: str
    color_theme: str
    custom_settings: Optional[Dict[str, Any]] = {}
    is_public: bool = False


class UpdatePersonaRequest(BaseModel):
    """Request to update a persona"""
    name: Optional[str] = None
    role: Optional[str] = None
    icon: Optional[str] = None
    prompt_prefix: Optional[str] = None
    collaboration_style: Optional[str] = None
    color_theme: Optional[str] = None
    custom_settings: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None

# In-memory storage for now (would be database in production)
user_personas_store: Dict[str, Dict[str, Any]] = {}


@router.get("/", response_model=List[Dict[str, Any]])
async def list_personas(
    user_id: str = Query(..., description="User ID"),
    include_public: bool = Query(True, description="Include public personas"),
    include_defaults: bool = Query(True, description="Include default personas")
):
    """List all personas available to a user"""
    try:
        personas = []
        
        # Add default personas if requested
        if include_defaults:
            from providers.model_factory import ModelFactory
            default_personas = ModelFactory.load_personas()
            for persona_id, personality in default_personas.items():
                personas.append({
                    "id": f"default-{persona_id}",
                    "name": personality.role,
                    "is_default": True,
                    "is_public": True,
                    "provider": personality.provider,
                    "model_name": personality.model_name,
                    "role": personality.role,
                    "icon": personality.icon,
                    "prompt_prefix": personality.prompt_prefix,
                    "collaboration_style": personality.collaboration_style,
                    "color_theme": personality.color_theme
                })        
        # Add user personas
        for persona_id, persona in user_personas_store.items():
            if persona["user_id"] == user_id or (include_public and persona.get("is_public")):
                if persona.get("is_active", True):
                    personas.append({
                        "id": persona_id,
                        "name": persona["name"],
                        "is_default": False,
                        "is_public": persona.get("is_public", False),
                        **persona
                    })
        
        return personas
        
    except Exception as e:
        logger.error(f"Error listing personas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=Dict[str, Any])
async def create_persona(
    request: CreatePersonaRequest,
    user_id: str = Query(..., description="User ID")
):
    """Create a new custom persona"""
    try:
        persona_id = str(uuid.uuid4())
        
        persona = {
            "id": persona_id,
            "user_id": user_id,
            "name": request.name,
            "provider": request.provider,
            "model_name": request.model_name,
            "role": request.role,
            "icon": request.icon,
            "prompt_prefix": request.prompt_prefix,
            "collaboration_style": request.collaboration_style,
            "color_theme": request.color_theme,
            "custom_settings": request.custom_settings,
            "is_public": request.is_public,
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        user_personas_store[persona_id] = persona
        
        logger.info(f"Created persona {persona_id} for user {user_id}")
        return persona
        
    except Exception as e:
        logger.error(f"Error creating persona: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{persona_id}", response_model=Dict[str, Any])
async def update_persona(
    persona_id: str,
    request: UpdatePersonaRequest,
    user_id: str = Query(..., description="User ID")
):
    """Update an existing persona"""
    try:
        if persona_id not in user_personas_store:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        persona = user_personas_store[persona_id]
        
        # Check ownership
        if persona["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this persona")
        
        # Update fields
        if request.name is not None:
            persona["name"] = request.name
        if request.role is not None:
            persona["role"] = request.role
        if request.icon is not None:
            persona["icon"] = request.icon
        if request.prompt_prefix is not None:
            persona["prompt_prefix"] = request.prompt_prefix
        if request.collaboration_style is not None:
            persona["collaboration_style"] = request.collaboration_style
        if request.color_theme is not None:
            persona["color_theme"] = request.color_theme
        if request.custom_settings is not None:
            persona["custom_settings"] = request.custom_settings
        if request.is_public is not None:
            persona["is_public"] = request.is_public
        
        persona["updated_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"Updated persona {persona_id}")
        return persona
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating persona: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{persona_id}")
async def delete_persona(
    persona_id: str,
    user_id: str = Query(..., description="User ID")
):
    """Delete a persona (soft delete)"""
    try:
        if persona_id not in user_personas_store:
            raise HTTPException(status_code=404, detail="Persona not found")
        
        persona = user_personas_store[persona_id]
        
        # Check ownership
        if persona["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this persona")
        
        # Soft delete
        persona["is_active"] = False
        persona["updated_at"] = datetime.utcnow().isoformat()
        
        logger.info(f"Deleted persona {persona_id}")
        return {"message": "Persona deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting persona: {e}")
        raise HTTPException(status_code=500, detail=str(e))