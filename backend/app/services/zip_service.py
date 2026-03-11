import os
import uuid
import zipfile
import shutil
from typing import List

from app.config import settings


def _out_path(filename: str) -> str:
    return os.path.join(settings.OUTPUT_DIR, filename)


def _unique(prefix: str, ext: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}.{ext}"


# ─── CREATE ──────────────────────────────────────────────────────────────────

def create_zip(file_paths: List[str], archive_name: str = "archive") -> str:
    """Bundle a list of files into a single ZIP archive."""
    out_name = _unique(archive_name, "zip")
    out_path = _out_path(out_name)

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for fp in file_paths:
            if os.path.isfile(fp):
                zf.write(fp, arcname=os.path.basename(fp))
            elif os.path.isdir(fp):
                for root, _, files in os.walk(fp):
                    for file in files:
                        full = os.path.join(root, file)
                        rel = os.path.relpath(full, os.path.dirname(fp))
                        zf.write(full, arcname=rel)

    return out_path


# ─── EXTRACT ─────────────────────────────────────────────────────────────────

def extract_zip(file_path: str) -> str:
    """Extract ZIP contents; returns a new ZIP containing extracted files (flat)."""
    extract_dir = os.path.join(settings.TEMP_DIR, f"extract_{uuid.uuid4().hex}")
    os.makedirs(extract_dir, exist_ok=True)

    with zipfile.ZipFile(file_path, "r") as zf:
        zf.extractall(extract_dir)

    # Re-pack extracted files so the frontend gets one clean download
    out_name = _unique("extracted", "zip")
    out_path = _out_path(out_name)

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf_out:
        for root, _, files in os.walk(extract_dir):
            for file in files:
                full = os.path.join(root, file)
                rel = os.path.relpath(full, extract_dir)
                zf_out.write(full, arcname=rel)

    shutil.rmtree(extract_dir, ignore_errors=True)
    return out_path


# ─── MERGE ───────────────────────────────────────────────────────────────────

def merge_zips(file_paths: List[str]) -> str:
    """Combine multiple ZIP archives into one, de-duplicating filenames."""
    out_name = _unique("merged", "zip")
    out_path = _out_path(out_name)
    seen: set = set()

    with zipfile.ZipFile(out_path, "w", compression=zipfile.ZIP_DEFLATED) as zf_out:
        for zip_path in file_paths:
            with zipfile.ZipFile(zip_path, "r") as zf_in:
                for item in zf_in.infolist():
                    name = item.filename
                    if name in seen:
                        # Prefix with archive name to avoid collision
                        base = os.path.splitext(os.path.basename(zip_path))[0]
                        name = f"{base}/{item.filename}"
                    seen.add(name)
                    data = zf_in.read(item.filename)
                    zf_out.writestr(name, data)

    return out_path


# ─── ZIP INFO ─────────────────────────────────────────────────────────────────

def get_zip_info(file_path: str) -> dict:
    """Return metadata about ZIP contents."""
    with zipfile.ZipFile(file_path, "r") as zf:
        infos = []
        total_size = 0
        for info in zf.infolist():
            infos.append({
                "filename": info.filename,
                "file_size": info.file_size,
                "compress_size": info.compress_size,
                "is_dir": info.is_dir(),
            })
            total_size += info.file_size
        return {
            "num_files": len(infos),
            "total_uncompressed_size": total_size,
            "files": infos,
        }
