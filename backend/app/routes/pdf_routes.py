import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.config import settings
from app.services import pdf_service

router = APIRouter(prefix="/pdf", tags=["PDF Tools"])


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _save_upload(upload: UploadFile) -> str:
    ext = os.path.splitext(upload.filename)[1]
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
    filename = os.path.basename(path)
    background_tasks.add_task(_cleanup, path, *cleanup_paths)
    return FileResponse(
        path=path,
        filename=filename,
        media_type="application/octet-stream",
        background=background_tasks,
    )


# ─── MERGE ───────────────────────────────────────────────────────────────────

@router.post(
    "/merge",
    summary="Merge multiple PDFs into one",
    response_description="Merged PDF file",
)
async def merge_pdfs(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="PDF files to merge (ordered)"),
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 PDF files are required.")
    if len(files) > settings.MAX_BATCH_FILES:
        raise HTTPException(status_code=400, detail=f"Max {settings.MAX_BATCH_FILES} files allowed.")

    saved = [_save_upload(f) for f in files]
    try:
        out_path = pdf_service.merge_pdfs(saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── SPLIT ───────────────────────────────────────────────────────────────────

@router.post(
    "/split",
    summary="Split a PDF into smaller chunks",
    response_description="ZIP containing split PDF parts",
)
async def split_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pages_per_chunk: int = Form(default=1, ge=1, description="Pages per output file"),
):
    saved = _save_upload(file)
    try:
        out_path = pdf_service.split_pdf(saved, pages_per_chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)


# ─── COMPRESS ────────────────────────────────────────────────────────────────

@router.post(
    "/compress",
    summary="Compress a PDF file",
    response_description="Compressed PDF",
)
async def compress_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    quality: str = Form(default="medium", description="Compression quality: low | medium | high"),
):
    if quality not in ("low", "medium", "high"):
        raise HTTPException(status_code=400, detail="quality must be 'low', 'medium', or 'high'.")
    saved = _save_upload(file)
    try:
        out_path = pdf_service.compress_pdf(saved, quality)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)


# ─── ROTATE ──────────────────────────────────────────────────────────────────

@router.post(
    "/rotate",
    summary="Rotate pages in a PDF",
    response_description="Rotated PDF",
)
async def rotate_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    degrees: int = Form(default=90, description="Rotation degrees: 90, 180, or 270"),
    pages: Optional[str] = Form(
        default=None,
        description="Comma-separated 0-based page indices to rotate. Empty = all pages.",
    ),
):
    if degrees not in (90, 180, 270):
        raise HTTPException(status_code=400, detail="degrees must be 90, 180, or 270.")

    page_list: Optional[List[int]] = None
    if pages:
        try:
            page_list = [int(p.strip()) for p in pages.split(",")]
        except ValueError:
            raise HTTPException(status_code=400, detail="pages must be comma-separated integers.")

    saved = _save_upload(file)
    try:
        out_path = pdf_service.rotate_pdf(saved, degrees, page_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)


# ─── WATERMARK ───────────────────────────────────────────────────────────────

@router.post(
    "/watermark",
    summary="Add a text watermark to a PDF",
    response_description="Watermarked PDF",
)
async def watermark_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    text: str = Form(default="CONFIDENTIAL", description="Watermark text"),
    opacity: float = Form(default=0.3, ge=0.05, le=1.0, description="Watermark opacity (0.05–1.0)"),
):
    saved = _save_upload(file)
    try:
        out_path = pdf_service.watermark_pdf(saved, text, opacity)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)
