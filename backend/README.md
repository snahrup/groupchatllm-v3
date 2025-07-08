# GroupChatLLM v3 Backend

## 🚀 Quick Start

### Prerequisites
- Python 3.11+ OR Docker
- At least one AI provider API key (OpenAI, Anthropic, or Google)

### Option 1: Docker (Recommended)
```bash
# From project root
docker-compose up

# Backend will be available at http://localhost:8000
```

### Option 2: Local Development
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env and add your API keys

# Run the server
python main.py
```

## 🔑 Configuration

Create a `.env` file with your API keys:
```env
# At least one of these is required
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  
GOOGLE_API_KEY=your_google_key_here

# Optional
LANGSMITH_API_KEY=your_langsmith_key_here
REDIS_URL=redis://localhost:6379/0
```


## 📡 API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Available Models
```bash
GET http://localhost:8000/api/panels/available-models
```

### Create Session
```bash
POST http://localhost:8000/api/chat/sessions/create
Content-Type: application/json

{
  "mission": "Help me design a REST API",
  "selected_models": ["gpt-4o", "claude-3.5", "gemini-1.5"]
}
```

### Stream Responses (SSE)
```bash
GET http://localhost:8000/api/chat/{session_id}/stream?message=Your%20question%20here
```

## 🧪 Testing with cURL

### 1. Check Available Models
```bash
curl http://localhost:8000/api/panels/available-models
```

### 2. Create a Session
```bash
curl -X POST http://localhost:8000/api/chat/sessions/create \
  -H "Content-Type: application/json" \
  -d '{
    "mission": "Discuss the future of AI",
    "selected_models": ["gpt-4o", "claude-3.5"]
  }'
```
Save the `session_id` from the response.

### 3. Test SSE Streaming
```bash
# Replace SESSION_ID with actual session ID
curl -N http://localhost:8000/api/chat/SESSION_ID/stream?message=Hello%20panel
```

## 🛠️ Development

### Project Structure
```
backend/
├── api/              # API endpoints
│   ├── chat.py       # SSE streaming endpoints
│   ├── sessions.py   # Session management
│   └── panels.py     # Model configuration
├── core/             # Core business logic
│   └── session_manager.py
├── memory/           # Shared memory system
│   └── group_memory.py
├── streaming/        # Concurrent streaming
│   └── streaming_orchestrator.py
├── providers/        # AI model integrations
│   ├── openai_provider.py
│   ├── anthropic_provider.py
│   ├── google_provider.py
│   └── model_factory.py
├── models/           # Data models
│   └── schemas.py
└── main.py           # FastAPI application
```

### Adding a New Model

1. Add personality configuration in `providers/model_factory.py`:
```python
"new-model": ModelPersonality(
    provider="provider_name",
    model_name="actual-model-name",
    role="The Role",
    icon="🎯",
    prompt_prefix="As the...",
    collaboration_style="style",
    color_theme="color"
)
```

2. Implement provider if needed in `providers/`

## 🐛 Troubleshooting

### "No API keys configured"
- Ensure `.env` file exists with at least one valid API key
- Check that API keys are correctly formatted
- Restart the server after adding keys

### "Session not found"
- Sessions are stored in memory by default
- Use Redis for persistence across restarts
- Check session ID is correct

### SSE Connection Issues
- Ensure CORS is properly configured
- Check firewall/proxy settings
- Use `curl -N` flag for SSE testing

## 📚 Key Features

- **Concurrent AI Processing**: All models respond simultaneously
- **Real-time Collaboration Detection**: Identifies when models build on each other
- **Instant Context Sharing**: <100ms propagation between models
- **Multi-Provider Support**: OpenAI, Anthropic, Google integrated
- **SSE Streaming**: Real-time response delivery
- **Docker Ready**: Easy deployment with docker-compose

## 🔗 Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](http://localhost:8000/docs) (when running)
- [Frontend Integration Guide](../frontend/README.md) (Phase 2)

---

Built with ❤️ for collaborative AI intelligence
