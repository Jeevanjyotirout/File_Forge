"""
FileForge – Celery Task Definitions
=====================================
All heavy file-processing tasks run here asynchronously.

Every task follows the same lifecycle:
  1. Validate inputs & resolve paths
  2. Process the file(s)
  3. Store result in OUTPUT_DIR
  4. Schedule cleanup of temp inputs
  5. Return a job-result dict

File cleanup policy:
  - Input temp files  → deleted immediately after processing
  - Output files      → deleted by cleanup_expired_files (TTL = FILE_TTL_SECONDS)
"""

from __future__ import annotations

import io
import logging
import mimetypes
import os
import shutil
import time
import traceback
import zipfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from celery import Task
from celery.exceptions import SoftTimeLimitExceeded

from worker.celery_worker import celery_app

# ── Optional heavy dependencies ───────────────────────────────────────────────
try:
    import fitz  # PyMuPDF – PDF processing
    _HAS_PYMUPDF = True
except ImportError:
    _HAS_PYMUPDF = False

try:
    from PIL import Image as PILImage
    _HAS_PIL = True
except ImportError:
    _HAS_PIL = False

try:
    import pytesseract
    _HAS_TESSERACT = True
except ImportError:
    _HAS_TESSERACT = False

try:
    from docx import Document as DocxDocument
    _HAS_DOCX = True
except ImportError:
    _HAS_DOCX = False

log = logging.getLogger("fileforge.tasks")

# ── Paths & Settings ──────────────────────────────────────────────────────────
BASE_DIR        = Path(os.getenv("BASE_DIR", "/app"))
TEMP_DIR        = Path(os.getenv("TEMP_DIR", "/app/storage/temp"))
OUTPUT_DIR      = Path(os.getenv("OUTPUT_DIR", "/app/storage/output"))
FILE_TTL_SECONDS = int(os.getenv("FILE_TTL_SECONDS", 3600))   # 1 hour

TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
# BASE TASK CLASS
# ═══════════════════════════════════════════════════════════════════════════════

class FileForgeTask(Task):
    """
    Base task that provides:
      - Structured job-result dict
      - Safe file removal helper
      - Soft time-limit handling
    """
    abstract = True

    # ------------------------------------------------------------------
    def _result(
        self,
        *,
        job_id: str,
        status: str,
        output_path: str | None = None,
        output_filename: str | None = None,
        file_size: int | None = None,
        metadata: dict | None = None,
        error: str | None = None,
    ) -> dict:
        return {
            "job_id":          job_id,
            "status":          status,       # "success" | "error"
            "output_path":     output_path,
            "output_filename": output_filename,
            "file_size":       file_size,
            "metadata":        metadata or {},
            "error":           error,
            "completed_at":    datetime.utcnow().isoformat(),
        }

    # ------------------------------------------------------------------
    @staticmethod
    def _safe_remove(*paths: str | Path) -> None:
        """Delete files without raising on missing."""
        for p in paths:
            try:
                Path(p).unlink(missing_ok=True)
            except Exception as exc:
                log.warning(f"Could not remove {p}: {exc}")

    # ------------------------------------------------------------------
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        log.error(f"Task {self.name}[{task_id}] failed: {exc}\n{einfo}")

    # ------------------------------------------------------------------
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        log.warning(f"Task {self.name}[{task_id}] retrying: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def _resolve(path_str: str) -> Path:
    """Resolve a file path and confirm it exists inside allowed dirs."""
    p = Path(path_str).resolve()
    allowed = [TEMP_DIR.resolve(), OUTPUT_DIR.resolve()]
    if not any(str(p).startswith(str(a)) for a in allowed):
        raise ValueError(f"Path escape attempt: {p}")
    if not p.exists():
        raise FileNotFoundError(f"File not found: {p}")
    return p


def _out(filename: str) -> Path:
    """Create a unique output path."""
    ts = int(time.time() * 1000)
    stem = Path(filename).stem[:40]
    suffix = Path(filename).suffix
    return OUTPUT_DIR / f"{stem}_{ts}{suffix}"


def _file_size(path: Path) -> int:
    return path.stat().st_size


# ═══════════════════════════════════════════════════════════════════════════════
# PDF TASKS
# ═══════════════════════════════════════════════════════════════════════════════

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.merge_pdfs",
    max_retries=2,
    soft_time_limit=240,
    time_limit=300,
)
def merge_pdfs(self, job_id: str, file_paths: list[str], output_name: str = "merged.pdf") -> dict:
    """
    Merge multiple PDF files into one document.

    Args:
        job_id:       Unique job identifier
        file_paths:   List of absolute temp file paths
        output_name:  Desired output filename
    """
    inputs: list[Path] = []
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        inputs = [_resolve(p) for p in file_paths]
        if len(inputs) < 2:
            raise ValueError("Merge requires at least 2 PDF files")

        output = _out(output_name if output_name.endswith(".pdf") else output_name + ".pdf")

        merger = fitz.open()
        total_pages = 0
        for src_path in inputs:
            doc = fitz.open(str(src_path))
            merger.insert_pdf(doc)
            total_pages += len(doc)
            doc.close()

        merger.save(str(output), garbage=4, deflate=True)
        merger.close()

        log.info(f"[{job_id}] Merged {len(inputs)} PDFs → {total_pages} pages → {output.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"source_files": len(inputs), "total_pages": total_pages},
        )

    except SoftTimeLimitExceeded:
        log.warning(f"[{job_id}] merge_pdfs soft time limit exceeded")
        raise self.retry(countdown=60, max_retries=1)

    except Exception as exc:
        log.exception(f"[{job_id}] merge_pdfs failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        self._safe_remove(*inputs)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.split_pdf",
    max_retries=2,
)
def split_pdf(self, job_id: str, file_path: str, split_config: dict) -> dict:
    """
    Split a PDF by page ranges or into individual pages.

    split_config examples:
        {"mode": "every_page"}
        {"mode": "ranges", "ranges": [[1, 3], [4, 6]]}
        {"mode": "at_page", "page": 5}
    """
    src: Path | None = None
    output_zip: Path | None = None
    parts: list[Path] = []
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        src = _resolve(file_path)
        doc = fitz.open(str(src))
        n_pages = len(doc)
        mode = split_config.get("mode", "every_page")

        # Build page-range list
        ranges: list[tuple[int, int]] = []
        if mode == "every_page":
            ranges = [(i, i) for i in range(n_pages)]
        elif mode == "at_page":
            page = int(split_config["page"]) - 1
            ranges = [(0, page), (page + 1, n_pages - 1)]
        elif mode == "ranges":
            for r in split_config["ranges"]:
                ranges.append((int(r[0]) - 1, int(r[1]) - 1))
        else:
            raise ValueError(f"Unknown split mode: {mode}")

        # Create each part
        for i, (start, end) in enumerate(ranges):
            part_path = OUTPUT_DIR / f"part_{i + 1:03d}_{int(time.time() * 1000)}.pdf"
            part_doc = fitz.open()
            part_doc.insert_pdf(doc, from_page=start, to_page=end)
            part_doc.save(str(part_path))
            part_doc.close()
            parts.append(part_path)

        doc.close()

        # Bundle into ZIP if multiple parts
        output_zip = _out("split_output.zip")
        with zipfile.ZipFile(str(output_zip), "w", zipfile.ZIP_DEFLATED) as zf:
            for part in parts:
                zf.write(str(part), part.name)

        log.info(f"[{job_id}] Split PDF into {len(parts)} parts → {output_zip.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output_zip),
            output_filename=output_zip.name,
            file_size=_file_size(output_zip),
            metadata={"parts": len(parts), "source_pages": n_pages, "mode": mode},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] split_pdf failed: {exc}")
        if output_zip:
            self._safe_remove(output_zip)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)
        self._safe_remove(*parts)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.compress_pdf",
    max_retries=2,
)
def compress_pdf(self, job_id: str, file_path: str, quality: str = "medium") -> dict:
    """
    Compress a PDF by re-rendering it with image downsampling.

    quality: "low" | "medium" | "high"
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        src = _resolve(file_path)
        original_size = _file_size(src)
        output = _out("compressed.pdf")

        dpi_map = {"low": 72, "medium": 96, "high": 150}
        dpi = dpi_map.get(quality, 96)

        doc = fitz.open(str(src))
        new_doc = fitz.open()

        for page_num in range(len(doc)):
            page = doc[page_num]
            mat = fitz.Matrix(dpi / 72, dpi / 72)
            pix = page.get_pixmap(matrix=mat, alpha=False)

            img_page = new_doc.new_page(width=page.rect.width, height=page.rect.height)
            img_rect = fitz.Rect(0, 0, page.rect.width, page.rect.height)
            img_page.insert_image(img_rect, pixmap=pix)

        new_doc.save(
            str(output),
            garbage=4,
            deflate=True,
            clean=True,
            linear=True,
        )
        new_doc.close()
        doc.close()

        compressed_size = _file_size(output)
        reduction_pct = round((1 - compressed_size / original_size) * 100, 1)

        log.info(
            f"[{job_id}] Compressed PDF: {original_size} → {compressed_size} bytes "
            f"({reduction_pct}% reduction) quality={quality}"
        )
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=compressed_size,
            metadata={
                "original_size": original_size,
                "compressed_size": compressed_size,
                "reduction_percent": reduction_pct,
                "quality": quality,
            },
        )

    except Exception as exc:
        log.exception(f"[{job_id}] compress_pdf failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.convert_pdf_to_word",
    max_retries=2,
    soft_time_limit=180,
    time_limit=240,
)
def convert_pdf_to_word(self, job_id: str, file_path: str) -> dict:
    """
    Extract text from PDF pages and write to a DOCX file.
    Preserves paragraph breaks; images are not extracted (would require OCR pipeline).
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")
        if not _HAS_DOCX:
            raise RuntimeError("python-docx is not installed")

        src = _resolve(file_path)
        output = _out("converted.docx")
        doc_out = DocxDocument()

        pdf = fitz.open(str(src))
        for page_num in range(len(pdf)):
            page = pdf[page_num]
            text = page.get_text("text")  # plain text extraction
            if page_num > 0:
                doc_out.add_page_break()
            for block in text.split("\n\n"):
                para = block.strip()
                if para:
                    doc_out.add_paragraph(para)

        pdf.close()
        doc_out.save(str(output))

        log.info(f"[{job_id}] PDF → Word: {len(pdf)} pages → {output.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"pages": len(pdf)},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] convert_pdf_to_word failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.convert_word_to_pdf",
    max_retries=2,
)
def convert_word_to_pdf(self, job_id: str, file_path: str) -> dict:
    """
    Convert a DOCX file to PDF using LibreOffice (headless).
    LibreOffice must be installed in the worker container.
    """
    import subprocess
    src: Path | None = None
    output: Path | None = None
    try:
        src = _resolve(file_path)
        result = subprocess.run(
            [
                "libreoffice",
                "--headless",
                "--convert-to", "pdf",
                "--outdir", str(OUTPUT_DIR),
                str(src),
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"LibreOffice error: {result.stderr}")

        # LibreOffice names output after input stem
        expected = OUTPUT_DIR / (src.stem + ".pdf")
        if not expected.exists():
            raise FileNotFoundError(f"LibreOffice did not produce {expected}")

        output = _out("converted.pdf")
        shutil.move(str(expected), str(output))

        log.info(f"[{job_id}] Word → PDF → {output.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
        )

    except Exception as exc:
        log.exception(f"[{job_id}] convert_word_to_pdf failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.rotate_pdf",
    max_retries=2,
)
def rotate_pdf(self, job_id: str, file_path: str, degrees: int = 90, pages: list[int] | None = None) -> dict:
    """
    Rotate all or selected pages in a PDF.

    degrees: 90, 180, or 270
    pages:   1-indexed list of page numbers to rotate (None = all)
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        if degrees not in (90, 180, 270):
            raise ValueError("degrees must be 90, 180, or 270")

        src = _resolve(file_path)
        output = _out("rotated.pdf")
        doc = fitz.open(str(src))

        target_pages = set(p - 1 for p in pages) if pages else set(range(len(doc)))

        for i in range(len(doc)):
            if i in target_pages:
                page = doc[i]
                page.set_rotation((page.rotation + degrees) % 360)

        doc.save(str(output), garbage=4, deflate=True)
        doc.close()

        log.info(f"[{job_id}] Rotated {len(target_pages)} pages by {degrees}°")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"degrees": degrees, "pages_rotated": len(target_pages)},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] rotate_pdf failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.add_watermark",
    max_retries=2,
)
def add_watermark(
    self,
    job_id: str,
    file_path: str,
    text: str = "CONFIDENTIAL",
    opacity: float = 0.3,
    color: str = "red",
    font_size: int = 48,
    angle: int = 45,
) -> dict:
    """Add a diagonal text watermark to every page of a PDF."""
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        src = _resolve(file_path)
        output = _out("watermarked.pdf")
        doc = fitz.open(str(src))

        color_map = {
            "red":   (1, 0, 0),
            "blue":  (0, 0, 1),
            "gray":  (0.5, 0.5, 0.5),
            "black": (0, 0, 0),
        }
        rgb = color_map.get(color.lower(), (1, 0, 0))

        for page in doc:
            w, h = page.rect.width, page.rect.height
            page.insert_text(
                fitz.Point(w * 0.2, h * 0.5),
                text,
                fontsize=font_size,
                color=rgb,
                rotate=angle,
                overlay=True,
                render_mode=3,
            )

        doc.save(str(output), garbage=4, deflate=True)
        doc.close()

        log.info(f"[{job_id}] Watermark '{text}' applied to all pages")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"watermark_text": text, "color": color},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] add_watermark failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.protect_pdf",
    max_retries=2,
)
def protect_pdf(self, job_id: str, file_path: str, user_password: str, owner_password: str = "") -> dict:
    """Encrypt a PDF with user and owner passwords."""
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        src = _resolve(file_path)
        output = _out("protected.pdf")
        doc = fitz.open(str(src))
        owner_pw = owner_password or user_password + "_owner"

        encrypt_meth = fitz.PDF_ENCRYPT_AES_256
        doc.save(
            str(output),
            encryption=encrypt_meth,
            user_pw=user_password,
            owner_pw=owner_pw,
            permissions=fitz.PDF_PERM_PRINT | fitz.PDF_PERM_ACCESSIBILITY,
        )
        doc.close()

        log.info(f"[{job_id}] PDF protected with password encryption")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"encrypted": True, "algorithm": "AES-256"},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] protect_pdf failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.extract_pdf_pages",
    max_retries=2,
)
def extract_pdf_pages(self, job_id: str, file_path: str, page_range: str) -> dict:
    """
    Extract a range of pages from a PDF.
    page_range: "1-5" or "1,3,5-8"
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")

        src = _resolve(file_path)
        doc = fitz.open(str(src))
        n = len(doc)

        # Parse page range string
        pages: set[int] = set()
        for part in page_range.split(","):
            part = part.strip()
            if "-" in part:
                a, b = part.split("-")
                pages.update(range(int(a) - 1, min(int(b), n)))
            else:
                p = int(part) - 1
                if 0 <= p < n:
                    pages.add(p)

        if not pages:
            raise ValueError(f"No valid pages in range '{page_range}' (document has {n} pages)")

        output = _out("extracted_pages.pdf")
        new_doc = fitz.open()
        for p in sorted(pages):
            new_doc.insert_pdf(doc, from_page=p, to_page=p)

        new_doc.save(str(output), garbage=4)
        new_doc.close()
        doc.close()

        log.info(f"[{job_id}] Extracted {len(pages)} pages from {n}-page PDF")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"extracted_pages": len(pages), "source_pages": n, "page_range": page_range},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] extract_pdf_pages failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ═══════════════════════════════════════════════════════════════════════════════
# IMAGE TASKS
# ═══════════════════════════════════════════════════════════════════════════════

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.compress_image",
    max_retries=2,
)
def compress_image(self, job_id: str, file_path: str, quality: int = 75, max_width: int | None = None) -> dict:
    """
    Compress an image using Pillow.

    quality:   1–95 (JPEG quality or PNG compression level)
    max_width: Optionally downscale to this max width (preserving aspect ratio)
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PIL:
            raise RuntimeError("Pillow is not installed")

        src = _resolve(file_path)
        original_size = _file_size(src)
        suffix = src.suffix.lower()
        output = _out(f"compressed{suffix}")

        with PILImage.open(str(src)) as img:
            # Convert RGBA to RGB for JPEG
            if suffix in (".jpg", ".jpeg") and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            original_w, original_h = img.size

            if max_width and original_w > max_width:
                ratio = max_width / original_w
                new_h = int(original_h * ratio)
                img = img.resize((max_width, new_h), PILImage.LANCZOS)

            save_kwargs: dict[str, Any] = {}
            if suffix in (".jpg", ".jpeg"):
                save_kwargs = {"quality": quality, "optimize": True, "progressive": True}
            elif suffix == ".png":
                save_kwargs = {"optimize": True, "compress_level": min(9, (100 - quality) // 11)}
            elif suffix == ".webp":
                save_kwargs = {"quality": quality, "method": 6}

            img.save(str(output), **save_kwargs)

        compressed_size = _file_size(output)
        reduction = round((1 - compressed_size / original_size) * 100, 1)

        log.info(f"[{job_id}] Image compressed: {original_size} → {compressed_size} ({reduction}% reduction)")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=compressed_size,
            metadata={
                "original_size": original_size,
                "compressed_size": compressed_size,
                "reduction_percent": reduction,
                "quality": quality,
                "dimensions": list(img.size) if not max_width else [max_width, int(original_h * max_width / original_w)],
            },
        )

    except Exception as exc:
        log.exception(f"[{job_id}] compress_image failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.resize_image",
    max_retries=2,
)
def resize_image(
    self,
    job_id: str,
    file_path: str,
    width: int,
    height: int,
    maintain_aspect: bool = True,
) -> dict:
    """Resize an image to specific dimensions."""
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PIL:
            raise RuntimeError("Pillow is not installed")

        src = _resolve(file_path)
        suffix = src.suffix.lower()
        output = _out(f"resized{suffix}")

        with PILImage.open(str(src)) as img:
            orig_w, orig_h = img.size

            if maintain_aspect:
                img.thumbnail((width, height), PILImage.LANCZOS)
                new_size = img.size
            else:
                img = img.resize((width, height), PILImage.LANCZOS)
                new_size = (width, height)

            if suffix in (".jpg", ".jpeg") and img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.save(str(output))

        log.info(f"[{job_id}] Image resized: {orig_w}×{orig_h} → {new_size[0]}×{new_size[1]}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={
                "original_dimensions": [orig_w, orig_h],
                "new_dimensions": list(new_size),
                "maintain_aspect": maintain_aspect,
            },
        )

    except Exception as exc:
        log.exception(f"[{job_id}] resize_image failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.convert_image",
    max_retries=2,
)
def convert_image(self, job_id: str, file_path: str, target_format: str) -> dict:
    """
    Convert an image to a different format.

    target_format: "jpeg" | "png" | "webp" | "gif" | "bmp" | "tiff"
    """
    src: Path | None = None
    output: Path | None = None
    try:
        if not _HAS_PIL:
            raise RuntimeError("Pillow is not installed")

        fmt = target_format.lower().lstrip(".")
        fmt_map = {"jpg": "jpeg", "tif": "tiff"}
        fmt = fmt_map.get(fmt, fmt)

        ext_map = {"jpeg": ".jpg", "tiff": ".tif"}
        ext = ext_map.get(fmt, f".{fmt}")

        src = _resolve(file_path)
        output = _out(f"converted{ext}")

        with PILImage.open(str(src)) as img:
            if fmt == "jpeg" and img.mode in ("RGBA", "P", "LA"):
                background = PILImage.new("RGB", img.size, (255, 255, 255))
                if img.mode in ("RGBA", "LA"):
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)
                img = background

            img.save(str(output), format=fmt.upper())

        log.info(f"[{job_id}] Image converted to {fmt.upper()} → {output.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"source_format": src.suffix.lstrip("."), "target_format": fmt},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] convert_image failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.images_to_pdf",
    max_retries=2,
    soft_time_limit=180,
    time_limit=240,
)
def images_to_pdf(self, job_id: str, file_paths: list[str], output_name: str = "images.pdf") -> dict:
    """Combine multiple images into a single PDF document."""
    inputs: list[Path] = []
    output: Path | None = None
    try:
        if not _HAS_PYMUPDF:
            raise RuntimeError("PyMuPDF (fitz) is not installed")
        if not _HAS_PIL:
            raise RuntimeError("Pillow is not installed")

        inputs = [_resolve(p) for p in file_paths]
        output = _out(output_name if output_name.endswith(".pdf") else output_name + ".pdf")

        pdf = fitz.open()
        for img_path in inputs:
            with PILImage.open(str(img_path)) as img:
                if img.mode not in ("RGB", "L"):
                    img = img.convert("RGB")
                w, h = img.size

            page = pdf.new_page(width=w, height=h)
            page.insert_image(fitz.Rect(0, 0, w, h), filename=str(img_path))

        pdf.save(str(output), garbage=4, deflate=True)
        pdf.close()

        log.info(f"[{job_id}] {len(inputs)} images → PDF: {output.name}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={"source_images": len(inputs)},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] images_to_pdf failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        self._safe_remove(*inputs)


# ═══════════════════════════════════════════════════════════════════════════════
# UTILITY TASKS
# ═══════════════════════════════════════════════════════════════════════════════

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.create_zip_archive",
    max_retries=2,
)
def create_zip_archive(
    self,
    job_id: str,
    file_paths: list[str],
    archive_name: str = "archive.zip",
    compression_level: int = 6,
) -> dict:
    """
    Bundle multiple files into a single ZIP archive.

    compression_level: 0–9 (0 = no compression, 9 = max compression)
    """
    inputs: list[Path] = []
    output: Path | None = None
    try:
        inputs = [_resolve(p) for p in file_paths]
        output = _out(archive_name if archive_name.endswith(".zip") else archive_name + ".zip")

        total_uncompressed = 0
        with zipfile.ZipFile(
            str(output),
            "w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=compression_level,
        ) as zf:
            for f in inputs:
                zf.write(str(f), f.name)
                total_uncompressed += _file_size(f)

        compressed_size = _file_size(output)
        reduction = round((1 - compressed_size / total_uncompressed) * 100, 1) if total_uncompressed > 0 else 0

        log.info(f"[{job_id}] ZIP: {len(inputs)} files → {compressed_size} bytes ({reduction}% compression)")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=compressed_size,
            metadata={
                "file_count": len(inputs),
                "uncompressed_size": total_uncompressed,
                "compressed_size": compressed_size,
                "compression_ratio": reduction,
            },
        )

    except Exception as exc:
        log.exception(f"[{job_id}] create_zip_archive failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        self._safe_remove(*inputs)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.run_ocr",
    max_retries=1,
    soft_time_limit=240,
    time_limit=300,
)
def run_ocr(self, job_id: str, file_path: str, lang: str = "eng", output_format: str = "txt") -> dict:
    """
    Run OCR on a PDF or image and return extracted text.

    lang:          Tesseract language code (e.g. "eng", "fra", "deu")
    output_format: "txt" | "pdf" (searchable PDF)
    """
    src: Path | None = None
    output: Path | None = None
    tmp_images: list[Path] = []
    try:
        if not _HAS_TESSERACT:
            raise RuntimeError("pytesseract is not installed or Tesseract not in PATH")
        if not _HAS_PIL:
            raise RuntimeError("Pillow is not installed")

        src = _resolve(file_path)
        is_pdf = src.suffix.lower() == ".pdf"
        extracted_text: list[str] = []

        if is_pdf:
            if not _HAS_PYMUPDF:
                raise RuntimeError("PyMuPDF required for PDF OCR")
            doc = fitz.open(str(src))
            for page_num in range(len(doc)):
                page = doc[page_num]
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2× scale for better OCR
                tmp_img = TEMP_DIR / f"ocr_page_{page_num}_{int(time.time()*1000)}.png"
                pix.save(str(tmp_img))
                tmp_images.append(tmp_img)
                with PILImage.open(str(tmp_img)) as img:
                    text = pytesseract.image_to_string(img, lang=lang)
                    extracted_text.append(f"--- Page {page_num + 1} ---\n{text}")
            doc.close()
        else:
            with PILImage.open(str(src)) as img:
                text = pytesseract.image_to_string(img, lang=lang)
                extracted_text.append(text)

        full_text = "\n\n".join(extracted_text)

        if output_format == "txt":
            output = _out("ocr_output.txt")
            output.write_text(full_text, encoding="utf-8")
        else:
            # Searchable PDF via pytesseract
            output = _out("ocr_searchable.pdf")
            if is_pdf and tmp_images:
                imgs = [PILImage.open(str(t)) for t in tmp_images]
                pdf_bytes = pytesseract.image_to_pdf_or_hocr(imgs[0], extension="pdf", lang=lang)
                output.write_bytes(pdf_bytes)
                for im in imgs:
                    im.close()
            else:
                with PILImage.open(str(src)) as img:
                    pdf_bytes = pytesseract.image_to_pdf_or_hocr(img, extension="pdf", lang=lang)
                    output.write_bytes(pdf_bytes)

        word_count = len(full_text.split())
        log.info(f"[{job_id}] OCR complete: {word_count} words extracted | lang={lang}")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(output),
            output_filename=output.name,
            file_size=_file_size(output),
            metadata={
                "word_count": word_count,
                "language": lang,
                "output_format": output_format,
                "pages": len(tmp_images) if is_pdf else 1,
            },
        )

    except Exception as exc:
        log.exception(f"[{job_id}] run_ocr failed: {exc}")
        if output:
            self._safe_remove(output)
        return self._result(job_id=job_id, status="error", error=str(exc))

    finally:
        if src:
            self._safe_remove(src)
        self._safe_remove(*tmp_images)


# ─────────────────────────────────────────────────────────────────────────────

@celery_app.task(
    bind=True,
    base=FileForgeTask,
    name="worker.tasks.run_workflow",
    max_retries=1,
    soft_time_limit=250,
    time_limit=300,
)
def run_workflow(self, job_id: str, workflow: dict, file_paths: list[str]) -> dict:
    """
    Execute a user-defined multi-step workflow.

    workflow = {
        "name": "My Workflow",
        "steps": [
            {"id": "compress", "config": {"quality": "medium"}},
            {"id": "watermark", "config": {"text": "DRAFT"}},
        ]
    }
    """
    current_files = list(file_paths)
    intermediate_files: list[Path] = []
    step_results: list[dict] = []

    try:
        steps = workflow.get("steps", [])
        for step_index, step in enumerate(steps):
            step_id = step.get("id")
            config = step.get("config", {})
            sub_job = f"{job_id}_step{step_index + 1}"

            log.info(f"[{job_id}] Running step {step_index + 1}/{len(steps)}: {step_id}")

            # Map step IDs to task functions
            STEP_MAP = {
                "compress":    lambda fids, cfg, jid: compress_pdf(jid, fids[0], cfg.get("quality", "medium")),
                "merge":       lambda fids, cfg, jid: merge_pdfs(jid, fids, cfg.get("output_name", "merged.pdf")),
                "split":       lambda fids, cfg, jid: split_pdf(jid, fids[0], cfg),
                "watermark":   lambda fids, cfg, jid: add_watermark(jid, fids[0], cfg.get("text", "WATERMARK")),
                "compress-image": lambda fids, cfg, jid: compress_image(jid, fids[0], cfg.get("quality", 75)),
                "resize-image":   lambda fids, cfg, jid: resize_image(jid, fids[0], cfg.get("width", 1920), cfg.get("height", 1080)),
                "zip":         lambda fids, cfg, jid: create_zip_archive(jid, fids, cfg.get("name", "output.zip")),
            }

            task_fn = STEP_MAP.get(step_id)
            if not task_fn:
                step_results.append({"step": step_id, "status": "skipped", "reason": "unknown step"})
                continue

            result = task_fn(current_files, config, sub_job)
            step_results.append({"step": step_id, "status": result["status"], "output": result.get("output_filename")})

            if result["status"] != "success":
                raise RuntimeError(f"Step '{step_id}' failed: {result.get('error')}")

            # Track intermediates to clean up later
            if result.get("output_path"):
                intermediate_files.append(Path(result["output_path"]))
                current_files = [result["output_path"]]

        # Final output is the last step's file
        if not current_files:
            raise RuntimeError("Workflow produced no output")

        final_path = Path(current_files[0])
        if not final_path.exists():
            raise FileNotFoundError(f"Final output missing: {final_path}")

        # Clean up all intermediates except the final
        for f in intermediate_files[:-1]:
            self._safe_remove(f)

        log.info(f"[{job_id}] Workflow '{workflow.get('name')}' complete: {len(steps)} steps")
        return self._result(
            job_id=job_id,
            status="success",
            output_path=str(final_path),
            output_filename=final_path.name,
            file_size=_file_size(final_path),
            metadata={"workflow_name": workflow.get("name"), "steps": step_results},
        )

    except Exception as exc:
        log.exception(f"[{job_id}] run_workflow failed: {exc}")
        for f in intermediate_files:
            self._safe_remove(f)
        return self._result(job_id=job_id, status="error", error=str(exc))


# ═══════════════════════════════════════════════════════════════════════════════
# HOUSEKEEPING TASK
# ═══════════════════════════════════════════════════════════════════════════════

@celery_app.task(
    name="worker.tasks.cleanup_expired_files",
    ignore_result=True,
)
def cleanup_expired_files() -> None:
    """
    Celery Beat task: delete all output files older than FILE_TTL_SECONDS.
    Runs every 5 minutes via the Beat scheduler.
    """
    now = time.time()
    cutoff = now - FILE_TTL_SECONDS
    removed = 0
    freed_bytes = 0

    for directory in (OUTPUT_DIR, TEMP_DIR):
        for filepath in directory.iterdir():
            if filepath.is_file():
                try:
                    mtime = filepath.stat().st_mtime
                    if mtime < cutoff:
                        size = filepath.stat().st_size
                        filepath.unlink()
                        removed += 1
                        freed_bytes += size
                except Exception as exc:
                    log.warning(f"cleanup: could not remove {filepath}: {exc}")

    if removed:
        log.info(
            f"🧹 Cleanup: removed {removed} expired files, "
            f"freed {freed_bytes / 1024 / 1024:.1f} MB"
        )
    else:
        log.debug("🧹 Cleanup: nothing to remove")
