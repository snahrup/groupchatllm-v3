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
├── backend/          # FastAPI backend with AI orchestration
├── frontend/         # React TypeScript frontend
├── .venv/           # Python virtual environment
├── launch.bat       # Elegant production launcher
└── shutdown.bat     # Graceful shutdown script
```

## 🎯 Features

- **Concurrent AI Collaboration**: Multiple models respond simultaneously
- **Synapse Detection**: Visualize when AIs build on each other's ideas
- **SSE Streaming**: Real-time response streaming
- **Glassmorphic UI**: Premium, futuristic interface design
- **Multi-Provider Support**: OpenAI, Anthropic, Google integration

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