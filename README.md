# Psychology Knowledge Base

A knowledge platform integrating psychological effects, book recommendations, video learning, AI chat, celebrity chat, global search, and self-assessment tests.

## Tech Stack

### Frontend (Psy/)
- Vue 3 + TypeScript
- Vite 5
- TailwindCSS 3
- Element Plus
- Pinia (state management)
- Vue Router 4
- marked + DOMPurify (Markdown rendering)
- Google Fonts (Playfair Display)

### Backend (Psy_back/)
- Express.js + TypeScript
- MySQL + mysql2
- JWT authentication
- Multer file upload
- Tencent Hunyuan AI

## Features

| Module | Description |
|--------|-------------|
| Effects Library | Browse and search psychological effects with Markdown detail pages and background images |
| Daily Effect | A featured psychological effect displayed on the homepage, refreshed daily |
| Book Recommendations | Psychology book showcase and recommendations |
| Video Learning | Bilibili video series with episode playback |
| AI Chat | Psychology Q&A powered by Tencent Hunyuan |
| Celebrity Chat | Chat with famous psychologists and thinkers, with auto-playing photo carousel |
| Self-Assessment | Multiple psychological scales with auto scoring, interpretation, and AI-powered analysis |
| Global Search | Cross-module full-text search across effects, books, videos, and celebrities |
| Admin Dashboard | Content management for effects, books, videos, celebrities, and scales |

## Quick Start

### Prerequisites
- Node.js >= 18
- MySQL 8.x

### 1. Backend

```bash
cd Psy_back

# Install dependencies
npm install

# Create database
# Run in MySQL: CREATE DATABASE psychology_db;

# Configure environment variables (edit DB credentials in .env)
cp .env.example .env   # if .env doesn't exist

# Start dev server
npm run dev
```

Backend runs at `http://localhost:3001`

### 2. Frontend

```bash
cd Psy

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at `http://localhost:5173`

### 3. Access

- User site: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin`

## Project Structure

```
Psychology/
├── Psy/              # Vue frontend
│   └── src/
│       ├── pages/    # Page components (17 pages)
│       ├── components/ # Shared components (Layout, etc.)
│       ├── lib/      # Utilities (axios, Markdown, etc.)
│       ├── stores/   # Pinia stores
│       ├── router/   # Route config (16 routes)
│       └── assets/   # Static assets
├── Psy_back/         # Express backend
│   └── api/
│       ├── server.ts # Entry point
│       ├── routes/   # API routes (11 modules)
│       └── controllers/ # Controllers
└── Paga/             # Content source (effect descriptions, experiments, etc.)
```

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/effects` | GET | No | List psychological effects |
| `/api/effects/:id` | GET | No | Effect detail |
| `/api/daily-effect` | GET | No | Daily featured effect |
| `/api/books` | GET | No | Book list |
| `/api/books/:id` | GET | No | Book detail |
| `/api/videos/series` | GET | No | Video series list |
| `/api/famous` | GET | No | Celebrity list |
| `/api/famous/:id` | GET | No | Celebrity detail |
| `/api/scales` | GET | No | Assessment scales |
| `/api/scales/questions` | GET | No | Scale questions |
| `/api/scales/report` | GET | No | Scale report |
| `/api/scale-analyze` | POST | No | AI-powered scale analysis |
| `/api/search` | GET | No | Global full-text search |
| `/api/ai/chat` | POST | No | AI chat (Hunyuan) |
| `/api/auth/login` | POST | No | Admin login |
| `/api/upload/media` | POST | Admin | Image upload |

## Build & Deploy

```bash
# Build frontend
cd Psy && npm run build

# Output in Psy/dist/, deploy to any static server (Nginx, etc.)
```
