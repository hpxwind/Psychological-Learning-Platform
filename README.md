# Psychology Knowledge Base

A knowledge platform integrating psychological effects, book recommendations, video learning, AI chat, and self-assessment tests.

## Tech Stack

### Frontend (Psy/)
- Vue 3 + TypeScript
- Vite 5
- TailwindCSS 3
- Element Plus
- Pinia (state management)
- Vue Router 4
- marked + DOMPurify (Markdown rendering)

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
| Book Recommendations | Psychology book showcase and recommendations |
| Video Learning | Bilibili video series with episode playback |
| AI Chat | Psychology Q&A powered by Tencent Hunyuan |
| Self-Assessment | Multiple psychological scales with auto scoring and interpretation |
| Admin Dashboard | Content management for effects, books, and videos |

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
│       ├── pages/    # Page components
│       ├── lib/      # Utilities (API, Markdown, etc.)
│       ├── stores/   # Pinia stores
│       ├── router/   # Route config
│       └── assets/   # Static assets
├── Psy_back/         # Express backend
│   └── api/
│       ├── server.ts # Entry point
│       ├── routes/   # API routes
│       └── controllers/ # Controllers
└── Paga/             # Content source (effect descriptions, experiments, etc.)
```

## Build & Deploy

```bash
# Build frontend
cd Psy && npm run build

# Output in Psy/dist/, deploy to any static server (Nginx, etc.)
```
