# 🖥️ Real-Time Collaborative Code Editor

A production-grade, multi-user collaborative code editor built with Next.js,
Node.js, Socket.io, and Monaco Editor. Write and run code together in real time —
like Google Docs, but for code.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://collabcode-delta.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

🔴 **Live Demo:** [https://collabcode-delta.vercel.app](https://collabcode-delta.vercel.app)

---

## ✨ Features

- 🔗 **Shareable room links** — instant collaboration, no account needed
- 👥 **Multi-user coloured cursors** — see exactly where teammates are editing
- ⚡ **Real-time sync** — powered by Operational Transforms (conflict-free)
- 🌐 **Syntax highlighting** — Python, JavaScript, TypeScript
- ▶️ **Run Code** — execute code directly in the browser, no server needed
- 🌙 **Dark / Light mode** — persisted per user

---

## 🏗️ Architecture

The frontend (Next.js on Vercel) connects to the backend (Node.js + Express on Render) via REST API for room management and WebSockets (Socket.io) for real-time collaboration. Code changes are synced using Operational Transforms to resolve concurrent edit conflicts. Room state is persisted in PostgreSQL (Neon). Code execution runs entirely in the browser — Python via Pyodide (WebAssembly), JavaScript and TypeScript via a sandboxed Web Worker — meaning no API keys, no rate limits, and no latency.

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- PostgreSQL 15+

### 1. Clone the repo
```bash
git clone https://github.com/amirm4hz/collaborative-code-editor.git
cd collaborative-code-editor
```

### 2. Install dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure environment variables
```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Fill in your values (see Environment Variables section below)
```

### 4. Set up the database
```bash
cd backend
npm run db:setup
```

### 5. Run the development servers
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔧 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 4000) |
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `CLIENT_URL` | Frontend URL for CORS |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend WebSocket + REST URL |

---

## 🗂️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, React, Tailwind CSS |
| Editor | Monaco Editor (same as VS Code) |
| Real-time | Socket.io (WebSockets) |
| Conflict resolution | Operational Transforms |
| Backend | Node.js, Express |
| Database | PostgreSQL (Neon) |
| Code execution | Pyodide WebAssembly (Python), Web Worker sandbox (JS/TS) |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📄 License

MIT © Amir Mahdian