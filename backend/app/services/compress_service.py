import os
import uuid
import subprocess
import zipfile
import shutil
from typing import List

from PIL import Image

from app.config import settings


def _out_path(filename: str) -> str:
    return os.path.join(settings.OUTPUT_DIR, filename)


def _unique(prefix: str, ext: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}.{ext}"


# ─── QUALITY PRESETS ─────────────────────────────────────────────────────────

IMAGE_QUALITY = {"low": 40, "medium": 65, "high": 85}
PDF_DPI = {"low": 72, "medium": 120, "high": 150}
VIDEO_CRF = {"low": 32, "medium": 26, "high": 20}  # lower = better quality


# ─── PDF COMPRESSION ─────────────────────────────────────────────────────────

def compress_pdf(file_path: str, quality: str = "medium") -> str:
    """
    Compress PDF using Ghostscript if available, otherwise fall back
    to pypdf stream compression.
    """
    out_name = _unique("compressed_pdf", "pdf")
    out_path = _out_path(out_name)

    gs_settings = {
        "low": "/screen",
        "medium": "/ebook",
        "high": "/printer",
    }
    gs_setting = gs_settings.get(quality, "/ebook")

    # Try Ghostscript first
    gs_cmd = shutil.which("gs") or shutil.which("gswin64c") or shutil.which("gswin32c")
    if gs_cmd:
        cmd = [
            gs_cmd,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            f"-dPDFSETTINGS={gs_setting}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={out_path}",
            file_path,
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=120)
        if result.returncode == 0 and os.path.exists(out_path):
            return out_path

    # Fallback: pypdf content stream compression
    from pypdf import PdfReader, PdfWriter
    reader = PdfReader(file_path)
    writer = PdfWriter()
    for page in reader.pages:
        page.compress_content_streams()
        writer.add_page(page)
    with open(out_path, "wb") as f:
        writer.write(f)
    return out_path


# ─── IMAGE COMPRESSION ───────────────────────────────────────────────────────

def compress_image(file_path: str, quality: str = "medium", max_width: int = 0) -> str:
    """
    Compress an image file using Pillow.
    Supports JPEG, PNG, WEBP, BMP, TIFF, and more.
    """
    img = Image.open(file_path)
    fmt = img.format or "JPEG"

    # Resize if max_width is specified
    if max_width and img.width > max_width:
        ratio = max_width / img.width
        new_h = int(img.height * ratio)
        img = img.resize((max_width, new_h), Image.LANCZOS)

    # Determine output extension
    ext_map = {
        "JPEG": "jpg",
        "PNG": "png",
        "WEBP": "webp",
        "BMP": "jpg",
        "TIFF": "jpg",
    }
    out_ext = ext_map.get(fmt, "jpg")
    out_name = _unique("compressed_img", out_ext)
    out_path = _out_path(out_name)

    q = IMAGE_QUALITY.get(quality, 65)

    if fmt == "PNG":
        # PNG uses compression level 0-9
        img.save(out_path, format="PNG", optimize=True, compress_level=min(9, int((100 - q) / 11)))
    elif fmt == "WEBP":
        img.save(out_path, format="WEBP", quality=q, method=6)
    else:
        img = img.convert("RGB")
        img.save(out_path, format="JPEG", quality=q, optimize=True)

    return out_path


def compress_images_batch(file_paths: List[str], quality: str = "medium", max_width: int = 0) -> str:
    """Compress multiple images and return a ZIP."""
    out_files = [compress_image(fp, quality, max_width) for fp in file_paths]

    zip_name = _unique("compressed_images", "zip")
    zip_path = _out_path(zip_name)
    with zipfile.ZipFile(zip_path, "w") as zf:
        for f in out_files:
            zf.write(f, arcname=os.path.basename(f))
    return zip_path


# ─── VIDEO COMPRESSION ───────────────────────────────────────────────────────

def compress_video(file_path: str, quality: str = "medium", resolution: str = "") -> str:
    """
    Compress video using FFmpeg.
    resolution: e.g. "1280x720", "1920x1080". Empty = keep original.
    """
    ffmpeg_cmd = shutil.which("ffmpeg")
    if not ffmpeg_cmd:
        raise RuntimeError(
            "FFmpeg is not installed or not in PATH. "
            "Install it with: sudo apt install ffmpeg"
        )

    ext = os.path.splitext(file_path)[1].lower() or ".mp4"
    out_name = _unique("compressed_video", ext.lstrip("."))
    out_path = _out_path(out_name)

    crf = VIDEO_CRF.get(quality, 26)

    cmd = [
        ffmpeg_cmd,
        "-y",                   # overwrite
        "-i", file_path,
        "-c:v", "libx264",
        "-crf", str(crf),
        "-preset", "medium",
        "-c:a", "aac",
        "-b:a", "128k",
    ]

    if resolution:
        w, h = resolution.replace("x", ":").split(":")
        cmd += ["-vf", f"scale={w}:{h}"]

    cmd.append(out_path)

    result = subprocess.run(cmd, capture_output=True, timeout=600)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg error: {result.stderr.decode()}")

    return out_path
