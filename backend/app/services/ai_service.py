import os
from typing import List, Optional

from pypdf import PdfReader

from app.config import settings

try:
    import anthropic
    _anthropic_available = True
except ImportError:
    _anthropic_available = False


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def _get_client():
    if not _anthropic_available:
        raise RuntimeError("anthropic SDK not installed. Run: pip install anthropic")
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. "
            "Add it to your .env file: ANTHROPIC_API_KEY=sk-ant-..."
        )
    return anthropic.Anthropic(api_key=api_key)


def _extract_text(file_path: str) -> str:
    """Extract plain text from PDF or read text files directly."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        reader = PdfReader(file_path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    elif ext in (".txt", ".md", ".csv", ".json", ".html"):
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    else:
        # Attempt plain-text read for other types
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except Exception:
            return ""


def _claude(system: str, prompt: str, max_tokens: int = 2048) -> str:
    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


# ─── SUMMARIZE ───────────────────────────────────────────────────────────────

def summarize_file(
    file_path: str,
    style: str = "concise",
    max_length: int = 500,
) -> dict:
    """
    Summarize a document file.
    style: 'concise' | 'detailed' | 'bullet_points'
    """
    text = _extract_text(file_path)
    if not text.strip():
        return {"summary": "No readable text found in this file.", "word_count": 0}

    # Truncate very long docs to avoid token limits
    truncated = text[:12000]
    word_count = len(text.split())

    style_instructions = {
        "concise": f"Provide a concise summary in no more than {max_length} words.",
        "detailed": f"Provide a detailed summary covering all main points. Max {max_length * 2} words.",
        "bullet_points": "Provide a bullet-point summary with the key points. Use markdown list format.",
    }
    instruction = style_instructions.get(style, style_instructions["concise"])

    system = (
        "You are an expert document analyst. "
        "When given document text, produce clear and accurate summaries."
    )
    prompt = f"{instruction}\n\nDocument content:\n\n{truncated}"

    summary = _claude(system, prompt)
    return {
        "summary": summary,
        "word_count": word_count,
        "style": style,
        "filename": os.path.basename(file_path),
    }


def summarize_batch(file_paths: List[str], style: str = "concise") -> List[dict]:
    return [summarize_file(fp, style) for fp in file_paths]


# ─── TRANSLATE ───────────────────────────────────────────────────────────────

def translate_file(
    file_path: str,
    target_language: str = "Spanish",
    source_language: str = "auto",
) -> dict:
    """Translate document text to the target language."""
    text = _extract_text(file_path)
    if not text.strip():
        return {"translated_text": "", "error": "No readable text found."}

    truncated = text[:10000]
    source_note = f"from {source_language}" if source_language != "auto" else "(detect language automatically)"

    system = (
        "You are a professional translator. "
        "Translate the provided text accurately, preserving formatting where possible."
    )
    prompt = (
        f"Translate the following text {source_note} to {target_language}. "
        "Return only the translated text without any preamble.\n\n"
        f"{truncated}"
    )

    translated = _claude(system, prompt, max_tokens=4096)
    return {
        "translated_text": translated,
        "target_language": target_language,
        "source_language": source_language,
        "filename": os.path.basename(file_path),
        "char_count": len(text),
    }


# ─── EXTRACT (DATA / KEY INFO) ────────────────────────────────────────────────

def extract_info(
    file_path: str,
    extraction_type: str = "key_info",
    custom_prompt: Optional[str] = None,
) -> dict:
    """
    Extract structured information from a document.
    extraction_type: 'key_info' | 'tables' | 'entities' | 'dates' | 'custom'
    """
    text = _extract_text(file_path)
    if not text.strip():
        return {"extracted": {}, "error": "No readable text found."}

    truncated = text[:12000]

    extraction_prompts = {
        "key_info": (
            "Extract and list the most important information from this document. "
            "Include: main topics, key facts, important names, dates, and conclusions. "
            "Format as structured JSON."
        ),
        "tables": (
            "Extract all tabular data from this document. "
            "Return each table as a JSON array of objects with column names as keys."
        ),
        "entities": (
            "Extract all named entities: people, organizations, locations, dates, "
            "monetary values, and percentages. Return as structured JSON."
        ),
        "dates": (
            "Extract all dates, deadlines, and time references from this document. "
            "Return as a JSON array of {date, context} objects."
        ),
        "custom": custom_prompt or "Extract the key information from this document.",
    }

    instruction = extraction_prompts.get(extraction_type, extraction_prompts["key_info"])

    system = (
        "You are a data extraction specialist. "
        "Extract information accurately and return valid JSON. "
        "If returning JSON, return ONLY the JSON with no markdown fences."
    )
    prompt = f"{instruction}\n\nDocument:\n\n{truncated}"

    result = _claude(system, prompt, max_tokens=3000)

    # Try to parse as JSON for structured response
    import json
    try:
        extracted = json.loads(result)
    except json.JSONDecodeError:
        extracted = {"raw": result}

    return {
        "extracted": extracted,
        "extraction_type": extraction_type,
        "filename": os.path.basename(file_path),
    }


def extract_batch(file_paths: List[str], extraction_type: str = "key_info") -> List[dict]:
    return [extract_info(fp, extraction_type) for fp in file_paths]
