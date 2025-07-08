# GroupChatLLM v3 - Global Project Context

## 🎯 Project Overview

**GroupChatLLM v3** is a revolutionary collaborative AI intelligence orchestration platform that transforms traditional Q&A chatbot interactions into dynamic group discussions where multiple AI models work together as expert panelists to deliver synthesized, nuanced solutions.

**Core Mission**: *"Replace the one-to-one exchange with a single chatbot with the experience of walking into a room of trusted specialists who all care about solving your problem together."*

## 🏗️ System Architecture

### Technology Stack

**Backend (Complete)**
- **Framework**: FastAPI + Python 3.11+
- **AI Orchestration**: LangChain + LangGraph + Custom streaming
- **Streaming**: Server-Sent Events (SSE) for real-time concurrent responses
- **Memory**: In-memory with Redis backup for scaling
- **AI Providers**: OpenAI (GPT-4/4o), Anthropic (Claude 3/3.5), Google (Gemini 1.5/2.0)
- **Monitoring**: LangSmith integration for observability

**Frontend (In Progress)**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom Glassmorphic Design System
- **State Management**: React hooks + Context API
- **Streaming**: EventSource API for SSE consumption
- **UI Library**: Custom glass components with Framer Motion animations

### Core Innovation: True Concurrent Collaboration

Unlike traditional sequential AI interactions, GroupChatLLM v3 enables:
- **Simultaneous Processing**: All models process and respond at the same time
- **Instant Context Propagation**: Sub-100ms memory updates across all models
- **Real-time Synapse Detection**: Identifies when models build on each other's ideas
- **Natural Interruption**: Models can "cut each other off" like real collaborators

## 📁 Project Structure

```
groupchatllm-v3/
├── backend/                    # FastAPI backend application
│   ├── api/                   # REST + SSE endpoints
│   ├── core/                  # Session management
│   ├── memory/                # Shared context system
│   ├── streaming/             # Concurrent orchestration
│   ├── providers/             # AI model integrations
│   ├── config/                # Configuration files
│   │   └── personas.yaml      # AI personality definitions
│   ├── models/                # Data schemas
│   ├── services/              # Business logic services
│   ├── main.py               # FastAPI application entry
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client services
│   │   ├── types/            # TypeScript definitions
│   │   └── App.tsx           # Main application component
│   ├── index.html            # Entry HTML
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite configuration
│
├── .project_memory/           # Original design documentation
├── context/                   # Current context management
├── docker-compose.yml         # Docker services configuration
└── launch.bat/ps1            # Windows launch scripts
```

## 🔧 Key Components

### Backend Components

**1. SessionManager** (`core/session_manager.py`)
- Manages collaborative session lifecycle
- Coordinates memory and streaming components
- Handles Redis persistence when available

**2. StreamingOrchestrator** (`streaming/streaming_orchestrator.py`)
- Manages simultaneous API calls to multiple providers
- Merges multiple SSE streams into unified output
- Handles timing and coordination between models

**3. GroupMemory** (`memory/group_memory.py`)
- Maintains conversation history with instant propagation
- Detects synapses (collaboration connections) between messages
- Provides token-aware context for each model
- Implements dynamic summarization for long conversations

**4. ModelFactory** (`providers/model_factory.py`)
- Creates AI provider instances with personalities
- Loads personas from YAML configuration
- Supports custom user-defined personas

**5. ContextSummarizer** (`services/context_summarizer.py`)
- Uses GPT-3.5 for intelligent context summarization
- Manages token limits per model
- Preserves conversation coherence beyond limits

### Frontend Components

**1. Dashboard** (`components/Dashboard.tsx`)
- Landing page with session management
- Mission input and AI model selection
- Quick mission suggestions

**2. CollaborativeSession** (`components/CollaborativeSession.tsx`)
- Main chat interface with concurrent streaming
- Real-time message display from multiple models
- Synapse visualization placeholders
- Debug panel for troubleshooting

**3. useCollaborativeStream** (`hooks/useCollaborativeStream.ts`)
- Custom hook for SSE connection management
- Handles concurrent message streaming
- Manages model states and error handling

## 🔌 API Specification

### Core Endpoints

**Session Management**
- `POST /api/chat/sessions/create` - Create new collaborative session
- `GET /api/sessions/{session_id}` - Get session details

**Model Information**
- `GET /api/panels/available-models` - List available AI models with personalities

**Streaming Chat**
- `GET /api/chat/{session_id}/stream?message={text}` - SSE endpoint for concurrent responses

**Persona Management**
- `GET /api/personas` - List all personas (default + custom)
- `POST /api/personas` - Create custom persona
- `PUT /api/personas/{id}` - Update persona
- `DELETE /api/personas/{id}` - Delete custom persona

**Debug & Health**
- `GET /api/health` - System health check
- `GET /api/debug/{session_id}/details` - Session debug information

### SSE Event Format

```typescript
// Event types
type SSEEvent = 
  | { event: 'connected', data: { session_id: string, message: string } }
  | { event: 'response', data: ResponseData }
  | { event: 'model_complete', data: { model: string, timestamp: string } }
  | { event: 'all_complete', data: { session_id: string, stats: CollaborationStats } }
  | { event: 'error', data: { error: string, session_id: string } };

// Response data structure
interface ResponseData {
  model: string;        // Model UUID
  content: string;      // Streaming text chunk
  type: MessageType;    // "response", "synthesis", "analysis"
  complete: boolean;    // Is this model done?
  synapse?: {          // Collaboration detected
    detected: boolean;
    building_on: string;
  };
}
```

## 🎨 Design System

### Glassmorphic Theme

The UI implements a white glassmorphic design system with:
- HSL-based color system (base hue: 220)
- Glass opacity range: 25% to 65%
- Backdrop blur: 0.75rem to 1rem
- Layered inset shadows for depth
- Model-specific color themes

### Key UI Patterns

**1. Briefing Room Flow**
- Phase 1: Mission setting
- Phase 2: Expert selection
- Phase 3: Session launch

**2. Collaboration Visualization**
- Synapse lines between related messages
- Model status indicators (thinking, responding, complete)
- Message badges for collaboration types
- Spatial separation of concurrent responses

**3. Director Controls**
- Always-accessible input at bottom
- Quick action buttons for common prompts
- Real-time ability to guide discussion

## 🔐 Configuration

### Environment Variables

Required API keys (at least one):
- `OPENAI_API_KEY` - For GPT models
- `ANTHROPIC_API_KEY` - For Claude models
- `GOOGLE_API_KEY` - For Gemini models

Optional configuration:
- `REDIS_URL` - Redis connection (falls back to in-memory)
- `LANGSMITH_API_KEY` - For tracing and monitoring
- `LANGCHAIN_TRACING_V2` - Enable/disable tracing
- `PORT` - Server port (default: 8000)

### AI Personas

Default personas defined in `backend/config/personas.yaml`:
- **The Strategist** (GPT-4o) - Strategic thinking, analytical
- **The Architect** (GPT-4) - Structural design, patterns
- **The Creative** (Claude 3.5) - Innovation, outside-the-box
- **The Synthesizer** (Claude 3) - Integration, weaving ideas
- **The Analyst** (Gemini 1.5) - Data-driven, evidence-based
- **The Explorer** (Gemini 2.0) - Broad connections, discovery

## 🚀 Running the Application

### Quick Start

```bash
# 1. Clone and navigate to project
cd C:\Users\steve\CascadeProjects\groupchatllm-v3

# 2. Set up backend environment
cd backend
copy .env.example .env
# Edit .env to add API keys

# 3. Launch both services
cd ..
launch.bat  # or ./launch.ps1
```

### Manual Start

**Backend**:
```bash
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

## 📊 Performance Specifications

- **First Response Time**: <3 seconds across all models
- **Memory Propagation**: <100ms between models
- **Concurrent Models**: Supports 6+ simultaneous
- **Animation Framerate**: 60fps for UI animations
- **Session Support**: 10+ concurrent user sessions
- **Context Window**: Dynamic per model with summarization

## 🎯 Success Metrics

**Technical Performance**
- Sub-3-second first response time ✓
- Instant context propagation ✓
- Smooth concurrent streaming ✓
- Graceful error handling ✓

**User Experience Goals**
- Sessions lasting 10+ minutes
- 5+ collaboration events per session
- 80% user return rate
- Natural, flowing AI discussions

## 🔧 Development Guidelines

### Naming Conventions

**Frontend (TypeScript/React)**
- Components: PascalCase (e.g., `CollaborativeSession`)
- Hooks: camelCase with 'use' prefix (e.g., `useCollaborativeStream`)
- Types/Interfaces: PascalCase (e.g., `StreamingMessage`)
- Event handlers: on + PascalCase (e.g., `onMessageSend`)

**Backend (Python)**
- Classes: PascalCase (e.g., `StreamingOrchestrator`)
- Functions/methods: snake_case (e.g., `stream_responses`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_CONTEXT_LENGTH`)
- Modules/files: snake_case (e.g., `session_manager.py`)

### Code Quality Standards

- Type safety enforced (TypeScript frontend, type hints in Python)
- Comprehensive error handling with user-friendly messages
- Logging for debugging (Loguru in backend, console in frontend)
- Clean separation of concerns
- DRY principle adherence
- Comments for complex logic only

---

This global context provides everything a new AI model needs to understand and work on the GroupChatLLM v3 project. The system is a sophisticated collaborative AI platform with a complete backend and in-progress frontend, focusing on real-time concurrent AI collaboration with visual feedback.