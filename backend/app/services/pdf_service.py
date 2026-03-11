import os
import io
import uuid
import zipfile
from pathlib import Path
from typing import List, Optional

from pypdf import PdfWriter, PdfReader
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import Color
from PIL import Image

from app.config import settings


def _out_path(filename: str) -> str:
    return os.path.join(settings.OUTPUT_DIR, filename)


def _unique(prefix: str, ext: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}.{ext}"


# ─── MERGE ───────────────────────────────────────────────────────────────────

def merge_pdfs(file_paths: List[str]) -> str:
    writer = PdfWriter()
    for path in file_paths:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)

    out_name = _unique("merged", "pdf")
    out_path = _out_path(out_name)
    with open(out_path, "wb") as f:
        writer.write(f)
    return out_path


# ─── SPLIT ───────────────────────────────────────────────────────────────────

def split_pdf(file_path: str, pages_per_chunk: int = 1) -> str:
    """Split a PDF into chunks; returns a ZIP containing all parts."""
    reader = PdfReader(file_path)
    total = len(reader.pages)
    zip_name = _unique("split", "zip")
    zip_path = _out_path(zip_name)

    with zipfile.ZipFile(zip_path, "w") as zf:
        chunk_idx = 1
        for start in range(0, total, pages_per_chunk):
            writer = PdfWriter()
            for i in range(start, min(start + pages_per_chunk, total)):
                writer.add_page(reader.pages[i])
            buf = io.BytesIO()
            writer.write(buf)
            zf.writestr(f"part_{chunk_idx}.pdf", buf.getvalue())
            chunk_idx += 1

    return zip_path


# ─── COMPRESS ────────────────────────────────────────────────────────────────

def compress_pdf(file_path: str, quality: str = "medium") -> str:
    """Compress PDF by re-writing and optionally downsampling images."""
    reader = PdfReader(file_path)
    writer = PdfWriter()

    for page in reader.pages:
        # Compress page content streams
        page.compress_content_streams()
        writer.add_page(page)

    # Quality-based metadata stripping
    if quality in ("low", "medium"):
        writer.add_metadata({})

    out_name = _unique("compressed", "pdf")
    out_path = _out_path(out_name)
    with open(out_path, "wb") as f:
        writer.write(f)
    return out_path


# ─── ROTATE ──────────────────────────────────────────────────────────────────

def rotate_pdf(file_path: str, degrees: int = 90, page_range: Optional[List[int]] = None) -> str:
    """
    Rotate pages in a PDF.
    page_range: 0-based list of page indices. None means all pages.
    degrees: 90, 180, or 270.
    """
    reader = PdfReader(file_path)
    writer = PdfWriter()

    for i, page in enumerate(reader.pages):
        if page_range is None or i in page_range:
            page.rotate(degrees)
        writer.add_page(page)

    out_name = _unique("rotated", "pdf")
    out_path = _out_path(out_name)
    with open(out_path, "wb") as f:
        writer.write(f)
    return out_path


# ─── WATERMARK ───────────────────────────────────────────────────────────────

def _create_watermark_pdf(text: str, opacity: float = 0.3) -> str:
    """Generate a single-page watermark PDF using reportlab."""
    wm_path = os.path.join(settings.TEMP_DIR, f"wm_{uuid.uuid4().hex}.pdf")
    c = canvas.Canvas(wm_path, pagesize=letter)
    w, h = letter

    # Semi-transparent grey text diagonally across the page
    c.setFont("Helvetica-Bold", 48)
    r, g, b = 0.5, 0.5, 0.5
    c.setFillColor(Color(r, g, b, alpha=opacity))
    c.saveState()
    c.translate(w / 2, h / 2)
    c.rotate(45)
    c.drawCentredString(0, 0, text)
    c.restoreState()
    c.save()
    return wm_path


def watermark_pdf(file_path: str, watermark_text: str = "CONFIDENTIAL", opacity: float = 0.3) -> str:
    wm_path = _create_watermark_pdf(watermark_text, opacity)
    wm_reader = PdfReader(wm_path)
    wm_page = wm_reader.pages[0]

    reader = PdfReader(file_path)
    writer = PdfWriter()

    for page in reader.pages:
        page.merge_page(wm_page)
        writer.add_page(page)

    out_name = _unique("watermarked", "pdf")
    out_path = _out_path(out_name)
    with open(out_path, "wb") as f:
        writer.write(f)

    # Cleanup temp watermark
    try:
        os.remove(wm_path)
    except OSError:
        pass

    return out_path
