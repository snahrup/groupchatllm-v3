"""
Simple test endpoint for SSE streaming
"""
from fastapi import APIRouter, Request
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
from loguru import logger

router = APIRouter()

@router.get("/test-sse")
async def test_sse(request: Request):
    """Simple SSE test endpoint"""
    async def event_generator():
        logger.info("Starting test SSE stream")
        
        # Send initial connection
        yield {
            "event": "connected",
            "data": json.dumps({"message": "Test SSE connected"})
        }
        
        # Send a few test messages
        for i in range(5):
            if await request.is_disconnected():
                break
                
            yield {
                "event": "response",
                "data": json.dumps({
                    "model": "test-model",
                    "content": f"Test message {i+1}\n",
                    "complete": i == 4
                })
            }
            await asyncio.sleep(1)
        
        yield {
            "event": "all_complete",
            "data": json.dumps({"message": "Test complete"})
        }
    
    return EventSourceResponse(event_generator())