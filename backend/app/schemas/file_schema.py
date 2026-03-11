from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    original_filename: str
    stored_filename: str
    size_bytes: int
    extension: str