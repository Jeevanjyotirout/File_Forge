import os
import shutil
import uuid
from contextlib import asynccontextmanager
from typing import List

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routes import pdf_routes, zip_routes, convert_routes, compress_routes, ai_routes


# ─── LIFECYCLE ───────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    for d in [settings.UPLOAD_DIR, settings.OUTPUT_DIR, settings.TEMP_DIR]:
        os.makedirs(d, exist_ok=True)
    print(f"✅  {settings.APP_NAME} v{settings.APP_VERSION} started")
    yield
    # Shutdown – optionally clean temp directory
    try:
        shutil.rmtree(settings.TEMP_DIR, ignore_errors=True)
        os.makedirs(settings.TEMP_DIR, exist_ok=True)
    except Exception:
        pass


# ─── APP ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "FileForge – File Processing Super App\n\n"
        "A unified API for PDF manipulation, ZIP handling, file conversion, "
        "compression, and AI-powered document analysis."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── UPLOAD ENDPOINT ─────────────────────────────────────────────────────────

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".doc", ".xlsx", ".xls",
    ".pptx", ".ppt", ".txt", ".md", ".csv",
    ".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".gif",
    ".mp4", ".mov", ".avi", ".mkv", ".webm",
    ".zip", ".tar", ".gz",
}


def _cleanup(*paths: str):
    for p in paths:
        try:
            os.remove(p)
        except OSError:
            pass


@app.post(
    "/upload",
    tags=["Upload"],
    summary="Upload one or more files",
    response_description="List of uploaded file metadata",
)
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to upload"),
):
    """
    General-purpose file upload endpoint.
    Returns metadata (stored filename, size, type) for each uploaded file.
    The returned `stored_filename` can be used as a reference with other endpoints
    if you build a server-side workflow.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided.")
    if len(files) > settings.MAX_BATCH_FILES:
        raise HTTPException(
            status_code=400,
            detail=f"Max {settings.MAX_BATCH_FILES} files per request.",
        )

    results = []
    for upload in files:
        ext = os.path.splitext(upload.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=415,
                detail=f"Unsupported file type '{ext}' for file '{upload.filename}'.",
            )

        # Size guard
        content = await upload.read()
        size_mb = len(content) / (1024 * 1024)
        if size_mb > settings.MAX_FILE_SIZE_MB:
            raise HTTPException(
                status_code=413,
                detail=(
                    f"File '{upload.filename}' exceeds maximum allowed size "
                    f"of {settings.MAX_FILE_SIZE_MB} MB."
                ),
            )

        stored_name = f"{uuid.uuid4().hex}{ext}"
        dest = os.path.join(settings.UPLOAD_DIR, stored_name)
        with open(dest, "wb") as f:
            f.write(content)

        results.append(
            {
                "original_filename": upload.filename,
                "stored_filename": stored_name,
                "size_bytes": len(content),
                "size_mb": round(size_mb, 3),
                "content_type": upload.content_type or "application/octet-stream",
                "extension": ext,
            }
        )

    return JSONResponse(
        content={
            "message": f"{len(results)} file(s) uploaded successfully.",
            "files": results,
        }
    )


# ─── HEALTH CHECK ────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"], summary="Health check")
async def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["System"], summary="API root")
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }


# ─── REGISTER ROUTERS ────────────────────────────────────────────────────────

app.include_router(pdf_routes.router)
app.include_router(zip_routes.router)
app.include_router(convert_routes.router)
app.include_router(compress_routes.router)
app.include_router(ai_routes.router)


# ─── ENTRYPOINT ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info",
    )
