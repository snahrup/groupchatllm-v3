"""
API endpoint to get session details for debugging
"""
from fastapi import APIRouter, Depends, HTTPException
from core.session_manager import SessionManager
from loguru import logger

router = APIRouter()

@router.get("/{session_id}/details")
async def get_session_details(
    session_id: str,
    session_manager: SessionManager = Depends()
):
    """Get detailed session information for debugging"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    orchestrator = session_manager.orchestrators.get(session_id)
    
    return {
        "session_id": session.id,
        "mission": session.mission,
        "created_at": session.created_at.isoformat(),
        "panelists": [
            {
                "id": config.id,
                "role": config.personality.role,
                "model": config.personality.model_name,
                "provider": config.personality.provider,
                "is_active": config.is_active,
                "state": config.state.value
            }
            for config in session.panelist_configs
        ],
        "has_orchestrator": orchestrator is not None,
        "active_providers": list(orchestrator.providers.keys()) if orchestrator else [],
        "provider_count": len(orchestrator.providers) if orchestrator else 0
    }