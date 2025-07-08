"""
Sessions API Endpoints
Manages session lifecycle and retrieval
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from core.session_manager import SessionManager
from loguru import logger


router = APIRouter()


@router.get("/", response_model=Dict[str, List[Dict[str, Any]]])
async def list_sessions(
    active_only: bool = True,
    session_manager: SessionManager = Depends()
):
    """List all sessions"""
    try:
        if active_only:
            sessions = session_manager.get_active_sessions()
        else:
            sessions = list(session_manager.sessions.values())
        
        return {
            "sessions": [
                {
                    "id": session.id,
                    "mission": session.mission,
                    "created_at": session.created_at.isoformat(),
                    "updated_at": session.updated_at.isoformat(),
                    "is_active": session.is_active,
                    "message_count": len(session.messages),
                    "synapse_count": len(session.synapse_connections)
                }
                for session in sessions
            ]
        }
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}", response_model=Dict[str, Any])
async def get_session(
    session_id: str,
    session_manager: SessionManager = Depends()
):
    """Get detailed session information"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "id": session.id,
        "mission": session.mission,
        "created_at": session.created_at.isoformat(),
        "updated_at": session.updated_at.isoformat(),
        "is_active": session.is_active,
        "panelists": [
            {
                "id": config.id,
                "role": config.personality.role,
                "icon": config.personality.icon,
                "model": config.personality.model_name,
                "state": config.state.value
            }
            for config in session.panelist_configs
        ],
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "type": msg.message_type.value,
                "model": msg.model_source,
                "timestamp": msg.timestamp.isoformat(),
                "synapses": msg.synapse_connections
            }
            for msg in session.messages[-50:]  # Last 50 messages
        ],
        "stats": session_manager.get_session_stats(session_id)
    }


@router.put("/{session_id}/end", response_model=Dict[str, str])
async def end_session(
    session_id: str,
    session_manager: SessionManager = Depends()
):
    """End an active session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    await session_manager.end_session(session_id)
    
    return {
        "message": "Session ended successfully",
        "session_id": session_id
    }
