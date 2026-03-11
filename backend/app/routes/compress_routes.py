import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.config import settings
from app.services import compress_service

router = APIRouter(prefix="/compress", tags=["Compression Tools"])

ALLOWED_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".gif"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"}


def _save_upload(upload: UploadFile) -> str:
    ext = os.path.splitext(upload.filename)[1].lower()
    dest = os.path.join(settings.UPLOAD_DIR, f"{uuid.uuid4().hex}{ext}")
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return dest


def _cleanup(*paths: str):
    for p in paths:
        try:
            os.remove(p)
        except OSError:
            pass


def _file_response(path: str, background_tasks: BackgroundTasks, *cleanup_paths: str) -> FileResponse:
    if not os.path.exists(path):
        raise HTTPException(status_code=500, detail="Output file was not generated.")
    background_tasks.add_task(_cleanup, path, *cleanup_paths)
    return FileResponse(
        path=path,
        filename=os.path.basename(path),
        media_type="application/octet-stream",
        background=background_tasks,
    )


# ─── COMPRESS PDF ────────────────────────────────────────────────────────────

@router.post("/pdf", summary="Compress a PDF file")
async def compress_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: str = Form(default="medium", description="low | medium | high"),
):
    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="quality must be low, medium, or high.")

    saved = _save_upload(file)
    try:
        out_path = compress_service.compress_pdf(saved, quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)


# ─── COMPRESS IMAGE ──────────────────────────────────────────────────────────

@router.post("/image", summary="Compress one or more images")
async def compress_image(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Image file(s) to compress"),
    quality: str = Form(default="medium", description="low | medium | high"),
    max_width: int = Form(default=0, ge=0, description="Resize to max width in pixels. 0 = no resize."),
):
    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="quality must be low, medium, or high.")

    for f in files:
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ALLOWED_IMAGE_EXTS:
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")

    saved = [_save_upload(f) for f in files]
    try:
        if len(saved) == 1:
            out_path = compress_service.compress_image(saved[0], quality, max_width)
        else:
            out_path = compress_service.compress_images_batch(saved, quality, max_width)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── COMPRESS VIDEO ──────────────────────────────────────────────────────────

@router.post("/video", summary="Compress a video file using FFmpeg")
async def compress_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: str = Form(default="medium", description="low | medium | high"),
    resolution: str = Form(
        default="",
        description="Target resolution e.g. 1280x720. Leave empty to keep original.",
    ),
):
    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="quality must be low, medium, or high.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(status_code=400, detail=f"Unsupported video format: {ext}")

    saved = _save_upload(file)
    try:
        out_path = compress_service.compress_video(saved, quality, resolution)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)
