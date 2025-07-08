"""
GroupChatLLM v3 - Main FastAPI Application
Collaborative AI Intelligence Orchestration Platform
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Enable LangSmith tracing
if os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true":
    logger.info("LangSmith tracing enabled for project: {}", os.getenv("LANGCHAIN_PROJECT", "groupchatllm-v3"))
    logger.info("LangSmith endpoint: {}", os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com"))

# Import routers
from api.sessions import router as sessions_router
from api.panels import router as panels_router
from api.chat import router as chat_router
from api.personas import router as personas_router
from api.debug import router as debug_router
from api.test_sse import router as test_sse_router

# Import core services
from core.session_manager import SessionManager

# Global session manager instance
session_manager = None


def get_session_manager():
    """Dependency injection for session manager"""
    return session_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown"""
    # Startup
    logger.info("Starting GroupChatLLM v3 Backend...")
    
    # Initialize session manager
    global session_manager
    session_manager = SessionManager()
    
    # Initialize Redis connection
    await session_manager.initialize()
    
    # Test API keys
    api_status = {
        "openai": bool(os.getenv("OPENAI_API_KEY")),
        "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
        "google": bool(os.getenv("GOOGLE_API_KEY"))
    }
    
    logger.info(f"API Key Status: {api_status}")
    
    if not any(api_status.values()):
        logger.warning("No API keys configured! Please set at least one provider API key.")
    
    logger.info("GroupChatLLM v3 Backend started successfully!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down GroupChatLLM v3 Backend...")
    # Cleanup resources here if needed

# Create FastAPI app
app = FastAPI(
    title="GroupChatLLM v3",
    description="Collaborative AI Intelligence Orchestration Platform",
    version="3.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Allow all in dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency override for routers
app.dependency_overrides[SessionManager] = get_session_manager

# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "name": "GroupChatLLM v3",
        "version": "3.0.0",
        "status": "operational",
        "message": "Collaborative AI Intelligence Orchestration Platform"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    from providers.model_factory import ModelFactory
    
    available_models = ModelFactory.get_available_models()
    
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "session_manager": "operational" if session_manager else "not_initialized",
            "providers": {
                "openai": bool(os.getenv("OPENAI_API_KEY")),
                "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
                "google": bool(os.getenv("GOOGLE_API_KEY"))
            },
            "available_models": list(available_models.keys())
        }
    }

# Register routers
app.include_router(sessions_router, prefix="/api/sessions", tags=["sessions"])
app.include_router(panels_router, prefix="/api/panels", tags=["panels"])
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(personas_router, prefix="/api/personas", tags=["personas"])
app.include_router(debug_router, prefix="/api/debug", tags=["debug"])
app.include_router(test_sse_router, prefix="/api/test", tags=["test"])

if __name__ == "__main__":
    import uvicorn
    import signal
    import sys
    
    def signal_handler(sig, frame):
        logger.info("Gracefully shutting down...")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        uvicorn.run(
            "main:app",
            host=os.getenv("HOST", "0.0.0.0"),
            port=int(os.getenv("PORT", 8000)),
            reload=os.getenv("RELOAD", "true").lower() == "true"
        )
    except KeyboardInterrupt:
        logger.info("Shutdown requested via keyboard interrupt")
        sys.exit(0)
