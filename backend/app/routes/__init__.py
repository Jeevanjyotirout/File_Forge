from .pdf_routes import router as pdf_router
from .zip_routes import router as zip_router
from .convert_routes import router as convert_router
from .compress_routes import router as compress_router
from .ai_routes import router as ai_router

__all__ = [
    "pdf_router",
    "zip_router",
    "convert_router",
    "compress_router",
    "ai_router",
]