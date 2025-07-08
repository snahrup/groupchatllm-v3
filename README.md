# GroupChatLLM v3 - Revolutionary Collaborative AI Platform

## 🚀 Quick Start

To launch the entire application stack:

```bash
./launch.bat
```

To shutdown all services:

```bash
./shutdown.bat
```

## 🏗️ Architecture

GroupChatLLM v3 is a groundbreaking platform that enables multiple AI models to collaborate in real-time:

- **Backend**: FastAPI server with concurrent AI streaming
- **Frontend**: React 19 with glassmorphic UI design
- **AI Models**: GPT-4o, Claude 3.5, Gemini 2.0
- **Innovation**: Real-time synapse detection between AI responses

## 📁 Project Structure

```
groupchatllm-v3/
├── backend/                    # FastAPI backend with AI orchestration
│   ├── api/                   # REST + SSE endpoints
│   ├── streaming/             # Concurrent AI streaming engine
│   └── config/personas.yaml   # AI personality definitions
├── frontend/                   # React TypeScript frontend
│   ├── components/
│   │   ├── CollaborativeSession.tsx      # Enhanced chat mode
│   │   ├── ImmersiveCollaborativeSession.tsx  # Graph-based mode
│   │   └── logos/ModelLogos.tsx          # Official AI logos
│   └── styles/
│       ├── glassmorphic.css   # Glass UI effects
│       └── immersive.css      # Immersive mode styles
├── context/                    # Project documentation
├── .venv/                     # Python virtual environment
├── launch.bat                 # Elegant production launcher
└── shutdown.bat               # Graceful shutdown script
```

## 🎯 Features

### Two Revolutionary UI Modes

#### ✨ Enhanced Mode
- **Traditional chat interface** with advanced visual enhancements
- **Real-time synapse animations** showing AI collaboration
- **Typewriter text effects** for natural conversation flow
- **Sound feedback** for enhanced engagement
- **Model thinking indicators** with bouncing animations
- **Proper AI branding** with official logos (ChatGPT, Claude, Gemini)

#### 🌐 Immersive Mode (NEW!)
- **Graph-based visualization** with AI models arranged in a circle
- **Interactive controls** - interrupt, elaborate, or redirect models while they type
- **Live accomplishments panel** tracking key insights and contributors
- **Floating node interface** showing each model's current state
- **Message preview bubbles** with real-time content
- **Particle effects background** for immersive experience
- **Visual synapse connections** between collaborating models

### Core Platform Features
- **Concurrent AI Collaboration**: Multiple models respond simultaneously
- **Instant Context Propagation**: <100ms memory updates across models
- **SSE Streaming**: Real-time response streaming with visual feedback
- **Glassmorphic UI**: Premium, futuristic interface design
- **Multi-Provider Support**: OpenAI, Anthropic, Google integration
- **Professional Branding**: Actual AI model logos replace generic icons

## 🛠️ Prerequisites

- Python 3.11+
- Node.js 18+
- API keys for OpenAI, Anthropic, and Google (in backend/.env)

## 📋 Environment Setup

1. Copy `backend/.env.example` to `backend/.env`
2. Add your API keys:
   ```
   OPENAI_API_KEY=your-key-here
   ANTHROPIC_API_KEY=your-key-here
   GOOGLE_API_KEY=your-key-here
   ```

## 🌐 Access Points

- **Frontend UI**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🎨 Demo Instructions

1. Run `launch.bat` - Watch the elegant startup sequence
2. Browser opens automatically to the frontend
3. Create a mission and select AI experts
4. Experience real-time collaborative AI responses
5. Observe synapse connections between models

## 🔧 Development

For development mode with hot-reload:

Backend:
```bash
cd backend
..\\.venv\\Scripts\\activate
python main.py
```

Frontend:
```bash
cd frontend
npm run dev
```

---

**Version 3.0** - Production Ready 🎉