import os
import shutil
import uuid
from typing import List

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse

from app.config import settings
from app.services import convert_service

router = APIRouter(prefix="/convert", tags=["Conversion Tools"])


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


# ─── PDF → WORD ──────────────────────────────────────────────────────────────

@router.post("/pdf-to-word", summary="Convert PDF to Word (.docx)")
async def pdf_to_word(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="One or more PDF files"),
):
    saved = [_save_upload(f) for f in files]
    try:
        if len(saved) == 1:
            out_path = convert_service.pdf_to_word(saved[0])
        else:
            out_path = convert_service.batch_convert(saved, "docx")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── PDF → EXCEL ─────────────────────────────────────────────────────────────

@router.post("/pdf-to-excel", summary="Convert PDF to Excel (.xlsx)")
async def pdf_to_excel(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="One or more PDF files"),
):
    saved = [_save_upload(f) for f in files]
    try:
        if len(saved) == 1:
            out_path = convert_service.pdf_to_excel(saved[0])
        else:
            out_path = convert_service.batch_convert(saved, "xlsx")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── PDF → PPT ───────────────────────────────────────────────────────────────

@router.post("/pdf-to-ppt", summary="Convert PDF to PowerPoint (.pptx)")
async def pdf_to_ppt(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="One or more PDF files"),
):
    saved = [_save_upload(f) for f in files]
    try:
        if len(saved) == 1:
            out_path = convert_service.pdf_to_ppt(saved[0])
        else:
            out_path = convert_service.batch_convert(saved, "pptx")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)


# ─── IMAGE → PDF ─────────────────────────────────────────────────────────────

@router.post("/jpg-to-pdf", summary="Convert images (JPG/PNG/BMP) to PDF")
async def images_to_pdf(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Image files to convert"),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required.")
    if len(files) > settings.MAX_BATCH_FILES:
        raise HTTPException(status_code=400, detail=f"Max {settings.MAX_BATCH_FILES} files.")

    saved = [_save_upload(f) for f in files]
    try:
        out_path = convert_service.images_to_pdf(saved)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return _file_response(out_path, background_tasks)
