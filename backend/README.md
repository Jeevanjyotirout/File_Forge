# FileForge – File Processing Super App Backend

A production-ready FastAPI backend for comprehensive file processing.

---

## 🚀 Quick Start

```bash
# 1. Clone & enter directory
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 5. Run the server
uvicorn app.main:app --reload --port 8000
```

Visit **http://localhost:8000/docs** for the interactive Swagger UI.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app, startup, /upload endpoint
│   ├── config.py         # Settings via pydantic-settings / .env
│   ├── database.py       # SQLAlchemy engine + session
│   ├── routes/
│   │   ├── pdf_routes.py      # /pdf/*
│   │   ├── zip_routes.py      # /zip/*
│   │   ├── convert_routes.py  # /convert/*
│   │   ├── compress_routes.py # /compress/*
│   │   └── ai_routes.py       # /ai/*
│   ├── services/
│   │   ├── pdf_service.py
│   │   ├── zip_service.py
│   │   ├── convert_service.py
│   │   ├── compress_service.py
│   │   └── ai_service.py
│   └── models/
│       └── user_model.py
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🛠 API Endpoints

### General
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload 1–20 files (returns metadata) |
| GET  | `/health` | Health check |

### PDF Tools `/pdf`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pdf/merge` | Merge multiple PDFs into one |
| POST | `/pdf/split` | Split PDF into chunks (returns ZIP) |
| POST | `/pdf/compress` | Compress PDF (low/medium/high) |
| POST | `/pdf/rotate` | Rotate all or specific pages |
| POST | `/pdf/watermark` | Add text watermark |

### ZIP Tools `/zip`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/zip/create` | Bundle files into a ZIP |
| POST | `/zip/extract` | Extract ZIP contents |
| POST | `/zip/merge` | Merge multiple ZIPs |
| POST | `/zip/info` | Get ZIP metadata (JSON) |

### Conversion Tools `/convert`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/convert/pdf-to-word` | PDF → .docx |
| POST | `/convert/pdf-to-excel` | PDF → .xlsx |
| POST | `/convert/pdf-to-ppt` | PDF → .pptx |
| POST | `/convert/jpg-to-pdf` | Images → PDF |

### Compression Tools `/compress`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/compress/pdf` | Compress PDF via Ghostscript/pypdf |
| POST | `/compress/image` | Compress images (batch supported) |
| POST | `/compress/video` | Compress video via FFmpeg |

### AI Tools `/ai`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/summarize` | Summarize documents (concise/detailed/bullets) |
| POST | `/ai/translate` | Translate to any language |
| POST | `/ai/extract` | Extract key_info/tables/entities/dates/custom |

---

## ⚙️ System Dependencies

For full functionality, install these system tools:

```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y ghostscript ffmpeg tesseract-ocr libreoffice

# macOS
brew install ghostscript ffmpeg tesseract
```

- **Ghostscript** – enhanced PDF compression
- **FFmpeg** – video compression
- **Tesseract** – OCR (optional, for image-based PDFs)
- **LibreOffice** – advanced document conversion (optional)

---

## 🔐 Authentication

JWT-based auth is scaffolded in `user_model.py`. To enable it:
1. Build register/login routes using `passlib` for password hashing
2. Issue JWT tokens with `python-jose`
3. Add `Depends(get_current_user)` to protected endpoints

---

## 📦 Batch Processing

All endpoints accept multiple files. When multiple files are provided:
- Conversion/compression endpoints return a **ZIP** containing all processed files
- AI endpoints return a **JSON array** of results, one per file

---

## 🌍 Production Deployment

```bash
# Gunicorn with Uvicorn workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Docker (build from project root)
docker build -t fileforge-backend .
docker run -p 8000:8000 --env-file .env fileforge-backend
```
