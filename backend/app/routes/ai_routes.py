import os
import shutil
import uuid
from typing import List, Optional

from fastapi import APIRouter, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from app.config import settings
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["AI Tools"])


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


# ─── SUMMARIZE ───────────────────────────────────────────────────────────────

@router.post("/summarize", summary="AI-powered document summarization")
async def summarize(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to summarize (PDF or text)"),
    style: str = Form(
        default="concise",
        description="Summary style: concise | detailed | bullet_points",
    ),
    max_length: int = Form(default=500, ge=50, le=5000, description="Max words in summary"),
):
    if style not in ("concise", "detailed", "bullet_points"):
        raise HTTPException(
            status_code=400,
            detail="style must be 'concise', 'detailed', or 'bullet_points'.",
        )

    saved = [_save_upload(f) for f in files]
    try:
        if len(saved) == 1:
            result = ai_service.summarize_file(saved[0], style, max_length)
        else:
            result = ai_service.summarize_batch(saved, style)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return JSONResponse(content=result if isinstance(result, list) else result)


# ─── TRANSLATE ───────────────────────────────────────────────────────────────

@router.post("/translate", summary="AI-powered document translation")
async def translate(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to translate"),
    target_language: str = Form(
        default="Spanish",
        description="Target language (e.g., Spanish, French, German, Japanese)",
    ),
    source_language: str = Form(
        default="auto",
        description="Source language. 'auto' for automatic detection.",
    ),
):
    saved = [_save_upload(f) for f in files]
    try:
        results = [
            ai_service.translate_file(p, target_language, source_language)
            for p in saved
        ]
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return JSONResponse(content=results if len(results) > 1 else results[0])


# ─── EXTRACT ─────────────────────────────────────────────────────────────────

@router.post("/extract", summary="AI-powered information extraction")
async def extract(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(..., description="Files to extract data from"),
    extraction_type: str = Form(
        default="key_info",
        description="Type: key_info | tables | entities | dates | custom",
    ),
    custom_prompt: Optional[str] = Form(
        default=None,
        description="Custom extraction instruction (only used when extraction_type='custom')",
    ),
):
    valid_types = ("key_info", "tables", "entities", "dates", "custom")
    if extraction_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"extraction_type must be one of: {', '.join(valid_types)}",
        )
    if extraction_type == "custom" and not custom_prompt:
        raise HTTPException(
            status_code=400,
            detail="custom_prompt is required when extraction_type='custom'.",
        )

    saved = [_save_upload(f) for f in files]
    try:
        results = [
            ai_service.extract_info(p, extraction_type, custom_prompt)
            for p in saved
        ]
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in saved:
            background_tasks.add_task(_cleanup, p)

    return JSONResponse(content=results if len(results) > 1 else results[0])
