# Psychology Knowledge Platform

A psychology knowledge platform integrating psychological effect encyclopedia, book recommendations, video learning, AI psychologist assistant, celebrity dialogue (RAG), global search, and self-assessment scales.

## Architecture

```
Psy (Vue 3 Frontend)
  │
  ▼
Psy_back (Express + TypeScript)
  │
  ├── Tencent Hunyuan ──── AI Psychologist / Scale Analysis
  │
  └── Agent (FastAPI + Python)
       ├── ChromaDB ───── Vector Retrieval (Knowledge Base)
       └── Qwen (DashScope) ──── LLM Response Generation
```

| Layer | Tech Stack | Port |
|-------|-----------|------|
| Frontend (Psy) | Vue 3 + Vite 5 + TailwindCSS + Element Plus + Pinia | 5173 |
| Backend (Psy_back) | Express.js + TypeScript + MySQL + JWT | 3001 |
| Agent | FastAPI + LangChain + ChromaDB + DashScope | 8000 |

## Features

| Module | Description | AI Integration |
|--------|-------------|----------------|
| Effect Encyclopedia | Browse psychological effects with Markdown detail pages | - |
| Daily Effect | Daily featured effect on homepage | - |
| Book Recommendations | Psychology books showcase and recommendations | - |
| Video Learning | Bilibili video series with episode playback | - |
| AI Psychologist | Psychology Q&A | Tencent Hunyuan |
| Celebrity Dialogue | Chat with psychologists/philosophers backed by RAG | Qwen + ChromaDB |
| Self-Assessment | Psychology scales with auto-scoring and interpretation | Tencent Hunyuan (analysis) |
| Global Search | Cross-module full-text search | - |
| Admin Panel | Content management for effects/books/videos/celebrities/scales | - |

## Quick Start

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- MySQL 8.x

### 1. Agent (Start First)

```bash
cd Agent

# Install dependencies
pip install -r requirements_api.txt

# Configure API Key
# Edit .env and set DASHSCOPE_API_KEY

# Start
python api_server.py
```

Agent runs at `http://localhost:8000`

### 2. Backend

```bash
cd Psy_back

# Install dependencies
npm install

# Create database
# MySQL: CREATE DATABASE psychology_db;

# Configure environment variables (.env: DB connection, Hunyuan API Key, Agent API URL)

# Start
npm run dev
```

Backend runs at `http://localhost:3001`

### 3. Frontend

```bash
cd Psy

# Install dependencies
npm install

# Start
npm run dev
```

### Access

- User portal: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin`

## Knowledge Base Upload Flow

The Celebrity Dialogue feature depends on the Agent's knowledge base (RAG). Upload flow:

```
Admin Panel → Upload knowledge base files
  → Psy_back (multer receives)
    → Agent API (create partition + upload files)
      → ChromaDB auto vector indexing
    → constraint.txt stored locally (for dialogue constraints)
```

Files are immediately available for celebrity dialogue retrieval after upload.

## Project Structure

```
Psychology/
├── Psy/                  # Vue Frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Shared components
│   │   ├── lib/          # Utilities (axios, Markdown, etc.)
│   │   ├── stores/       # Pinia state
│   │   └── router/       # Router
│   └── public/
├── Psy_back/             # Express Backend
│   └── api/
│       ├── server.ts     # Entry point
│       ├── routes/       # Route definitions
│       └── controllers/  # Controllers
├── Agent/                # RAG Agent API
│   ├── api_server.py     # FastAPI entry point
│   ├── rag/              # Vector store & retrieval
│   ├── model/            # LLM & Embedding factory
│   ├── config/           # YAML configuration
│   └── chroma_db/        # ChromaDB persistence
└── Paga/                 # Effect content assets
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/effects` | GET | List effects |
| `/api/effects/:id` | GET | Effect detail |
| `/api/daily-effect` | GET | Daily recommendation |
| `/api/books` | GET | List books |
| `/api/books/:id` | GET | Book detail |
| `/api/videos/series` | GET | Video series |
| `/api/famous` | GET | List celebrities |
| `/api/famous/:id` | GET | Celebrity detail |
| `/api/famous/:id/knowledge` | GET | Knowledge base files (→ Agent) |
| `/api/famous/:id/knowledge` | POST | Upload knowledge base files (→ Agent) |
| `/api/famous/:id/knowledge` | DELETE | Delete knowledge base (→ Agent) |
| `/api/celebrity/chat` | POST | Celebrity dialogue (→ Agent RAG) |
| `/api/scales` | GET | List scales |
| `/api/scales/questions` | GET | Scale questions |
| `/api/scales/report` | GET | Scale report |
| `/api/scale-analyze` | POST | AI scale analysis (Hunyuan) |
| `/api/search` | GET | Global search |
| `/api/ai/chat` | POST | AI psychologist (Hunyuan) |
| `/api/auth/login` | POST | Admin login |
| `/api/upload/media` | POST | Image upload |

## Build & Deploy

```bash
# Build frontend
cd Psy && npm run build

# Output: Psy/dist/ — deploy to Nginx or any static server

# Agent production deployment
cd Agent
uvicorn api_server:app --host 0.0.0.0 --port 8000
```
