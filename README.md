# ⚡ FileForge — File Processing Super App

<div align="center">

![FileForge Banner](https://img.shields.io/badge/FileForge-File%20Processing%20Super%20App-f97316?style=for-the-badge&logo=zap&logoColor=white)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Celery](https://img.shields.io/badge/Celery-5.4-37B24D?style=flat-square&logo=celery)](https://docs.celeryq.dev)
[![Redis](https://img.shields.io/badge/Redis-7.2-DC382D?style=flat-square&logo=redis)](https://redis.io)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docker.com)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**The all-in-one async file processing platform — merge, compress, convert, and transform PDFs, images, and documents at scale.**

[Overview](#-overview) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Local Dev](#-local-development) · [Docker Deploy](#-docker-deployment) · [API Reference](#-api-reference) · [Configuration](#-configuration)

</div>

---

## 📖 Overview

FileForge is a full-stack file processing platform built for performance and security. It uses an **async job queue** so large file operations never block the API — users upload a file, get a job ID immediately, and poll for results.

### What it can do

| Category | Operations |
|---|---|
| **PDF** | Merge, Split, Compress, Rotate, Watermark, Protect, PDF↔Word, Extract Pages |
| **Image** | Compress, Resize, Convert (JPG/PNG/WEBP/GIF), Images→PDF |
| **Utilities** | ZIP archive creation, OCR text extraction |
| **Workflows** | Chain multiple tools into automated multi-step pipelines |

### Key design principles

- **Non-blocking** — file uploads are tiny HTTP requests; heavy work runs in Celery workers
- **Privacy-first** — all uploaded and processed files are auto-deleted after 1 hour (configurable)
- **Horizontally scalable** — add more workers with `docker-compose scale worker=N`
- **Multi-queue** — PDF, image, and AI tasks run on dedicated queues with independent concurrency

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          User Browser                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Nginx  :80                               │
│  ┌──────────────┐    ┌──────────────────────────────────────┐   │
│  │  React SPA   │    │  Proxy: /api/* → FastAPI :8000       │   │
│  │  (static)    │    └──────────────────────────────────────┘   │
└──┴──────────────┴────────────────────────┬──────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend :8000                        │
│  POST /files/upload  →  save to /storage/temp                   │
│  POST /pdf/merge     →  dispatch Celery task → return job_id    │
│  GET  /jobs/:id/status  →  poll AsyncResult from Redis          │
│  GET  /files/download/:name  →  stream from /storage/output     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Celery tasks (AMQP over Redis)
                    ┌───────────┼──────────────┐
                    ▼           ▼              ▼
          ┌──────────────┐ ┌────────┐ ┌────────────┐
          │  PDF Worker  │ │ Image  │ │ AI / OCR   │
          │  (queue:pdf) │ │ Worker │ │ Worker     │
          └──────┬───────┘ └───┬────┘ └─────┬──────┘
                 │             │             │
                 └─────────────┼─────────────┘
                               │ Results stored in
                               ▼
                    ┌─────────────────────┐
                    │     Redis :6379     │
                    │  DB0: Task Queue    │
                    │  DB1: Result Cache  │
                    └─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Celery Beat        │
                    │  (cleanup cron)      │
                    │  Every 5min:         │
                    │  delete expired files│
                    └─────────────────────┘

Shared Volumes:
  storage/temp/   ← uploaded inputs (deleted after each task)
  storage/output/ ← processed outputs (deleted after TTL)
```

### File lifecycle

```
User uploads file
       │
       ▼
  /storage/temp/uuid.pdf   ← saved by FastAPI
       │
       │  Celery task picks it up
       ▼
  Processing runs (PyMuPDF, Pillow, Tesseract…)
       │
       ├─→ /storage/output/result_timestamp.pdf  ← output
       │
       └─→ temp file DELETED immediately

  After FILE_TTL_SECONDS (default 1h):
       │
       └─→ output file DELETED by Beat scheduler
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Minimum Version | Install |
|---|---|---|
| Docker | 24.x | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Docker Compose | 2.x | bundled with Docker Desktop |
| Git | any | [git-scm.com](https://git-scm.com) |

### 1 — Clone the repository

```bash
git clone https://github.com/yourorg/fileforge.git
cd fileforge
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and at minimum change:
```dotenv
SECRET_KEY=your-super-secret-random-key-here
```

> **Security note**: Never commit `.env` to version control.

### 3 — Start everything

```bash
docker-compose up --build
```

First build takes ~3–5 minutes (downloading system deps like LibreOffice, Tesseract).

### 4 — Open the app

| Service | URL |
|---|---|
| **Frontend** | http://localhost |
| **API docs** | http://localhost:8000/docs |
| **API health** | http://localhost:8000/health |
| **Redis** | localhost:6379 |

---

## 💻 Local Development

For a faster dev loop without Docker (or alongside it for just Redis):

### Requirements

```bash
# Python 3.12+
python --version

# Node 20+
node --version

# System packages (Ubuntu/Debian)
sudo apt-get install -y \
  tesseract-ocr tesseract-ocr-eng \
  libreoffice \
  redis-server

# macOS
brew install tesseract redis
brew install --cask libreoffice
```

### Backend setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r backend/requirements.txt

# Copy and configure environment
cp .env.example .env

# Start Redis (if not using Docker)
redis-server --daemonize yes

# Start FastAPI dev server (hot-reload)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Worker setup (separate terminal)

```bash
source .venv/bin/activate

# Start Celery worker — all queues
celery -A worker.celery_worker worker \
  --loglevel=info \
  --concurrency=2 \
  --queues=pdf,image,ai,default
```

### Beat scheduler (separate terminal, optional)

```bash
source .venv/bin/activate

# Runs cleanup task every 5 minutes
celery -A worker.celery_worker beat --loglevel=info
```

### Frontend setup (separate terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server (proxies /api → localhost:8000)
npm run dev
```

Frontend will be available at **http://localhost:3000**.

### Development with Flower (Celery monitoring)

```bash
# Flower runs at http://localhost:5555
celery -A worker.celery_worker flower \
  --port=5555 \
  --basic_auth=admin:password
```

### Run only Redis + worker in Docker (hybrid mode)

```bash
# Start just Redis and Celery worker in Docker
docker-compose up redis worker -d

# Run FastAPI locally against those services
REDIS_URL=redis://localhost:6379/0 uvicorn backend.main:app --reload
```

---

## 🐳 Docker Deployment

### Standard deployment

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f worker
docker-compose logs -f backend
```

### Development mode (with hot-reload + Flower)

```bash
docker-compose \
  -f docker-compose.yml \
  -f docker-compose.dev.yml \
  up --build
```

Adds:
- Source-code hot-reload for backend and worker
- **Flower UI** at http://localhost:5555 (Celery task monitor)
- Debug-level logging

### Scaling workers

```bash
# Scale to 3 worker processes (each with 4 concurrent tasks = 12 total)
docker-compose up --scale worker=3 -d

# Or specify per-queue workers via separate service definitions (recommended for production)
```

### Service management

```bash
# Stop all services (keep volumes)
docker-compose down

# Stop and remove volumes (destructive — deletes Redis data)
docker-compose down -v

# Rebuild a single service
docker-compose build backend
docker-compose up -d --no-deps backend

# Execute command in running container
docker-compose exec backend bash
docker-compose exec worker celery -A worker.celery_worker inspect active

# Check Celery worker status
docker-compose exec worker celery -A worker.celery_worker inspect ping
docker-compose exec worker celery -A worker.celery_worker inspect stats
```

### Production checklist

Before deploying to production:

```bash
# 1. Generate a strong secret key
python -c "import secrets; print(secrets.token_hex(32))"

# 2. Update .env
SECRET_KEY=<generated-above>
DEBUG=0
APP_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
FLOWER_PASSWORD=<strong-password>

# 3. Remove exposed ports from docker-compose.yml
#    (redis :6379 and backend :8000 should NOT be public)

# 4. Add SSL termination (e.g. Traefik or Certbot + Nginx)

# 5. Set up log aggregation (e.g. Loki, CloudWatch)
```

---

## 📡 API Reference

The full interactive API docs are available at **http://localhost:8000/docs** (Swagger UI).

### Typical workflow

```
1. POST /files/upload          → { temp_path }
2. POST /pdf/compress          → { job_id, poll_url }
3. GET  /jobs/{job_id}/status  → { status, download_url } (poll until "success")
4. GET  /files/download/{name} → binary file stream
```

### Core endpoints

#### Upload

```http
POST /files/upload
Content-Type: multipart/form-data

file: <binary>

→ 200 { "filename": "doc.pdf", "temp_path": "/app/storage/temp/abc123.pdf", "size": 102400 }
```

#### Job status

```http
GET /jobs/{task_id}/status

→ 200 {
    "task_id": "abc123",
    "status": "success",           # queued | processing | success | error
    "progress": 100,
    "output_filename": "merged_1710000000.pdf",
    "file_size": 204800,
    "download_url": "/files/download/merged_1710000000.pdf",
    "metadata": { "source_files": 3, "total_pages": 24 }
}
```

#### PDF operations

```http
# Merge
POST /pdf/merge
{ "file_paths": ["/tmp/a.pdf", "/tmp/b.pdf"], "output_name": "merged.pdf" }

# Compress
POST /pdf/compress
{ "file_path": "/tmp/doc.pdf", "quality": "medium" }  # low | medium | high

# Split
POST /pdf/split
{ "file_path": "/tmp/doc.pdf", "split_config": { "mode": "ranges", "ranges": [[1,3],[4,6]] } }

# Rotate
POST /pdf/rotate
{ "file_path": "/tmp/doc.pdf", "degrees": 90, "pages": [1, 3, 5] }

# Watermark
POST /pdf/watermark
{ "file_path": "/tmp/doc.pdf", "text": "DRAFT", "color": "red", "opacity": 0.3 }

# Protect
POST /pdf/protect
{ "file_path": "/tmp/doc.pdf", "user_password": "secret123" }

# PDF → Word
POST /pdf/to-word
{ "file_path": "/tmp/doc.pdf" }

# Word → PDF
POST /pdf/from-word
{ "file_path": "/tmp/doc.docx" }
```

#### Image operations

```http
# Compress
POST /images/compress
{ "file_path": "/tmp/photo.jpg", "quality": 75, "max_width": 1920 }

# Resize
POST /images/resize
{ "file_path": "/tmp/photo.png", "width": 800, "height": 600, "maintain_aspect": true }

# Convert
POST /images/convert
{ "file_path": "/tmp/photo.jpg", "target_format": "webp" }

# Images → PDF
POST /images/to-pdf
{ "file_paths": ["/tmp/img1.jpg", "/tmp/img2.png"], "output_name": "photos.pdf" }
```

#### Utilities

```http
# Create ZIP
POST /utils/zip
{ "file_paths": ["/tmp/a.pdf", "/tmp/b.jpg"], "archive_name": "bundle.zip" }

# OCR
POST /utils/ocr
{ "file_path": "/tmp/scan.pdf", "lang": "eng", "output_format": "txt" }
```

#### Workflow

```http
POST /workflows/run
{
  "file_paths": ["/tmp/report.pdf"],
  "workflow": {
    "name": "Compress and Watermark",
    "steps": [
      { "id": "compress", "config": { "quality": "medium" } },
      { "id": "watermark", "config": { "text": "CONFIDENTIAL" } }
    ]
  }
}
```

---

## ⚙️ Configuration

All configuration is via environment variables. See `.env.example` for the complete reference.

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | `development` or `production` |
| `SECRET_KEY` | *(required)* | Random secret for security signing |
| `REDIS_URL` | `redis://redis:6379/0` | Celery broker |
| `REDIS_RESULT_URL` | `redis://redis:6379/1` | Celery result backend |
| `TEMP_DIR` | `/app/storage/temp` | Temporary upload directory |
| `OUTPUT_DIR` | `/app/storage/output` | Processed output directory |
| `FILE_TTL_SECONDS` | `3600` | Seconds before output files are deleted |
| `MAX_UPLOAD_MB` | `500` | Maximum upload size in MB |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `FLOWER_USER` | `admin` | Flower UI username |
| `FLOWER_PASSWORD` | *(required in prod)* | Flower UI password |
| `OPENAI_API_KEY` | *(optional)* | For AI-enhanced features |
| `SENTRY_DSN` | *(optional)* | Error tracking |

---

## 📁 Project Structure

```
fileforge/
├── Dockerfile.backend          # Backend + Worker image
├── Dockerfile.frontend         # Frontend Nginx image
├── docker-compose.yml          # Production compose
├── docker-compose.dev.yml      # Dev overrides (hot-reload, Flower)
├── .env.example                # Environment template
├── .gitignore
│
├── backend/
│   ├── main.py                 # FastAPI app, all REST endpoints
│   └── requirements.txt
│
├── worker/
│   ├── __init__.py
│   ├── celery_worker.py        # Celery app config, queue routing, signals
│   └── tasks.py                # All async task implementations
│
├── frontend/                   # React + Vite + TailwindCSS SPA
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── utils/
│   │   │   ├── api.js          # Axios client + all API calls
│   │   │   └── fileUtils.js    # File helpers, validation, formatting
│   │   └── styles/
│   │       ├── globals.css
│   │       └── themes.css      # 5 themes: dark, light, glass, gradient, cyberpunk
│   ├── vite.config.js
│   └── package.json
│
├── nginx/
│   └── nginx.conf              # Reverse proxy + static serving config
│
└── storage/
    ├── temp/                   # Upload staging (auto-cleared)
    └── output/                 # Processing results (TTL-cleared)
```

---

## 🔧 Task Queue Details

### Queues and routing

| Queue | Tasks | Recommended concurrency |
|---|---|---|
| `pdf` | merge, split, compress, rotate, watermark, protect, convert | 4 |
| `image` | compress, resize, convert, images-to-pdf | 4 |
| `ai` | OCR (Tesseract) | 2 (CPU-bound) |
| `default` | ZIP, workflow orchestration, cleanup | 4 |

### Running dedicated workers per queue

```bash
# PDF-only worker
celery -A worker.celery_worker worker -Q pdf --concurrency=4 --hostname=pdf@%h

# Image-only worker
celery -A worker.celery_worker worker -Q image --concurrency=4 --hostname=img@%h

# AI/OCR worker (fewer concurrent due to CPU intensity)
celery -A worker.celery_worker worker -Q ai --concurrency=2 --hostname=ai@%h
```

### Monitoring with Flower

```bash
# Start Flower (dev compose includes this automatically)
celery -A worker.celery_worker flower --port=5555

# Or via Docker
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up flower
```

Access Flower at http://localhost:5555 — shows:
- Active / reserved / scheduled tasks
- Task history and results
- Worker CPU/memory stats
- Queue lengths

---

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=backend --cov=worker --cov-report=html

# Test a specific task manually
python -c "
from worker.tasks import compress_pdf
result = compress_pdf('test-job', '/path/to/test.pdf', 'medium')
print(result)
"

# Trigger a task via Celery (async)
python -c "
from worker.tasks import merge_pdfs
task = merge_pdfs.delay('job-1', ['/tmp/a.pdf', '/tmp/b.pdf'])
print('Task ID:', task.id)
print('Result:', task.get(timeout=30))
"
```

---

## 🔒 Security

- **File path validation**: all file paths are resolved and verified to be inside `TEMP_DIR` or `OUTPUT_DIR` — path traversal is prevented
- **Immediate temp cleanup**: input files are deleted in the `finally` block of every task, regardless of success or failure
- **TTL cleanup**: output files are deleted by the Beat scheduler after `FILE_TTL_SECONDS`
- **No root in containers**: backend runs as `fileforge` user, nginx runs as `nginx` user
- **Upload size limit**: enforced both in Nginx (`client_max_body_size`) and FastAPI
- **CORS**: configurable via `ALLOWED_ORIGINS` — default `*` is for dev only

---

## 🚢 Deployment to Cloud

### AWS ECS / Fargate

```bash
# Push images to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
docker build -f Dockerfile.backend -t fileforge-backend .
docker tag fileforge-backend:latest <ecr-url>/fileforge-backend:latest
docker push <ecr-url>/fileforge-backend:latest
```

### Kubernetes (Helm values example)

```yaml
replicaCount:
  backend: 2
  worker: 4
  beat: 1

redis:
  enabled: true
  architecture: standalone
  auth:
    enabled: false

storage:
  persistentVolume:
    enabled: true
    size: 20Gi
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-tool`
3. Add your task in `worker/tasks.py` following the existing pattern
4. Add the endpoint in `backend/main.py`
5. Add the tool to `TOOLS_REGISTRY` in `backend/main.py`
6. Write tests
7. Open a pull request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ⚡ by the FileForge team

[Report a bug](https://github.com/yourorg/fileforge/issues) · [Request a feature](https://github.com/yourorg/fileforge/issues)

</div>
