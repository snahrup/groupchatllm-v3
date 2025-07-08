"""
Chat API Endpoints
Handles SSE streaming and chat interactions
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from models.schemas import CreateSessionRequest, StreamingResponse as StreamResponse
from core.session_manager import SessionManager
from typing import AsyncGenerator, Dict, List, Any, Optional
import json
from loguru import logger


router = APIRouter()


@router.post("/sessions/create", response_model=Dict[str, Any])
async def create_session(
    request: CreateSessionRequest,
    session_manager: SessionManager = Depends()
):
    """Create a new collaborative AI session"""
    try:
        session = await session_manager.create_session(request)
        return {
            "session_id": session.id,
            "panelists": [
                {
                    "id": config.id,
                    "role": config.personality.role,
                    "icon": config.personality.icon,
                    "model": config.personality.model_name
                }
                for config in session.panelist_configs
            ]
        }
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/stream")
async def stream_chat(
    session_id: str,
    message: str,
    request: Request,
    session_manager: SessionManager = Depends()
):
    """
    SSE endpoint for streaming concurrent AI responses
    This is where the magic happens - multiple models respond simultaneously
    """
    # Verify session exists
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    async def event_generator() -> AsyncGenerator[str, None]:
        """Generate SSE events from streaming responses"""
        logger.info(f"Starting SSE stream for session {session_id} with message: {message}")
        
        try:
            # Start with connection event
            yield {
                "event": "connected",
                "data": json.dumps({
                    "session_id": session_id,
                    "message": "Connected to collaborative stream"
                })
            }
            logger.info(f"Sent connected event for session {session_id}")
            
            # Stream responses from all models
            response_count = 0
            async for response in session_manager.stream_responses(session_id, message):
                response_count += 1
                # Format as SSE event
                event_data = {
                    "model": response.model_source,
                    "content": response.content,
                    "type": response.message_type.value,
                    "complete": response.is_complete
                }
                
                logger.debug(f"Streaming response #{response_count} from {response.model_source}: {len(response.content)} chars")                
                # Add synapse info if detected
                if response.synapse_detected:
                    event_data["synapse"] = {
                        "detected": True,
                        "building_on": response.synapse_detected
                    }
                
                # Add metadata
                if response.metadata:
                    event_data["metadata"] = response.metadata
                
                yield {
                    "event": "response",
                    "data": json.dumps(event_data)
                }
                
                # If this completes a message, send completion event
                if response.is_complete:
                    yield {
                        "event": "model_complete", 
                        "data": json.dumps({
                            "model": response.model_source,
                            "timestamp": response.metadata.get("timestamp", "")
                        })
                    }
            
            # All models complete
            yield {
                "event": "all_complete",
                "data": json.dumps({
                    "session_id": session_id,
                    "stats": session_manager.get_session_stats(session_id)
                })
            }            
        except Exception as e:
            logger.error(f"Error in streaming: {e}")
            yield {
                "event": "error",
                "data": json.dumps({
                    "error": str(e),
                    "session_id": session_id
                })
            }
    
    # Return EventSourceResponse for SSE
    return EventSourceResponse(event_generator())


@router.get("/{session_id}/status", response_model=Dict[str, Any])
async def get_session_status(
    session_id: str,
    session_manager: SessionManager = Depends()
):
    """Get current status of all models in a session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    orchestrator = session_manager.orchestrators.get(session_id)
    if not orchestrator:
        return {"error": "No active orchestrator"}
    
    return {
        "session_id": session_id,
        "active_models": orchestrator.get_active_models(),
        "model_states": orchestrator.get_provider_states(),
        "stats": session_manager.get_session_stats(session_id)
    }


@router.get("/{session_id}/synapse-events", response_model=Dict[str, Any])
async def get_synapse_events(
    session_id: str,
    session_manager: SessionManager = Depends()
):
    """Get all synapse/collaboration events for a session"""
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "synapses": [
            {
                "id": conn.id,
                "from_message": conn.from_message_id,
                "to_message": conn.to_message_id,
                "type": conn.synapse_type.value,
                "strength": conn.strength
            }
            for conn in session.synapse_connections
        ],
        "events": [
            {
                "id": event.id,
                "type": event.event_type,
                "models": event.involved_models,
                "description": event.description,
                "timestamp": event.timestamp.isoformat()
            }
            for event in session.collaboration_events
        ]
    }
