import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.services import zip_service

router = APIRouter(prefix="/zip", tags=["ZIP Tools"])


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
    background_tasks.add_task(_cleanup, path, *cleanup_paths)
    return FileResponse(
        path=path,
        filename=os.path.basename(path),
        media_type="application/octet-stream",
        background=background_tasks,
    )


# ─── CREATE ──────────────────────────────────────────────────────────────────

@router.post("/create", summary="Bundle files into a ZIP archive")
async def create_zip(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to compress"),
    archive_name: str = Form(default="archive", description="Base name for the output ZIP"),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required.")
    if len(files) > settings.MAX_BATCH_FILES:
        raise HTTPException(status_code=400, detail=f"Max {settings.MAX_BATCH_FILES} files.")

    saved = [_save_upload(f) for f in files]
    try:
        out_path = zip_service.create_zip(saved, archive_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── EXTRACT ─────────────────────────────────────────────────────────────────

@router.post("/extract", summary="Extract a ZIP archive")
async def extract_zip(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="ZIP file to extract"),
):
    saved = _save_upload(file)
    try:
        out_path = zip_service.extract_zip(saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return _file_response(out_path, background_tasks)


# ─── MERGE ───────────────────────────────────────────────────────────────────

@router.post("/merge", summary="Merge multiple ZIP archives into one")
async def merge_zips(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="ZIP files to merge"),
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least 2 ZIP files are required.")

    saved = [_save_upload(f) for f in files]
    try:
        out_path = zip_service.merge_zips(saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── INFO ────────────────────────────────────────────────────────────────────

@router.post("/info", summary="Get metadata about a ZIP file")
async def zip_info(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    saved = _save_upload(file)
    try:
        info = zip_service.get_zip_info(saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        background_tasks.add_task(_cleanup, saved)

    return JSONResponse(content=info)
