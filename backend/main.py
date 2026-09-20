from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse


app = FastAPI(
    title="File Host Server",
    description="A web-based file management API",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "https://file-host-server-black.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Storage
# --------------------------------------------------

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# Maximum size: 1 GB per file
MAX_FILE_SIZE = 1 * 1024 * 1024 * 1024


# --------------------------------------------------
# Helper: Prevent duplicate filenames
# --------------------------------------------------

def get_unique_filename(filename: str) -> str:
    original_path = Path(filename)

    stem = original_path.stem
    suffix = original_path.suffix

    candidate = original_path.name
    counter = 1

    while (UPLOAD_DIR / candidate).exists():
        candidate = f"{stem} ({counter}){suffix}"
        counter += 1

    return candidate


# --------------------------------------------------
# Home
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "File Host Server Backend is running!"
    }


# --------------------------------------------------
# Upload
# --------------------------------------------------

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No filename provided."
        )

    # Prevent unsafe paths
    safe_filename = Path(file.filename).name

    if not safe_filename:
        raise HTTPException(
            status_code=400,
            detail="Invalid filename."
        )

    # Prevent duplicate filenames
    final_filename = get_unique_filename(safe_filename)

    file_path = UPLOAD_DIR / final_filename

    total_size = 0

    try:

        with open(file_path, "wb") as buffer:

            while True:

                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                # 1 GB limit
                if total_size > MAX_FILE_SIZE:

                    buffer.close()

                    if file_path.exists():
                        file_path.unlink()

                    raise HTTPException(
                        status_code=413,
                        detail="File is too large. Maximum allowed size is 1 GB."
                    )

                buffer.write(chunk)

    except HTTPException:
        raise

    except Exception as error:

        if file_path.exists():
            file_path.unlink()

        print(f"Upload error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Could not upload the file."
        )

    # Reject empty files
    if total_size == 0:

        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail="Empty files are not allowed."
        )

    uploaded_at = datetime.now().isoformat()

    return {
        "message": "File uploaded successfully!",
        "filename": final_filename,
        "size": total_size,
        "uploaded_at": uploaded_at
    }


# --------------------------------------------------
# List Files
# --------------------------------------------------

@app.get("/api/files")
def get_files():

    files = []

    for file_path in UPLOAD_DIR.iterdir():

        if file_path.is_file():

            stats = file_path.stat()

            uploaded_at = datetime.fromtimestamp(
                stats.st_mtime
            ).isoformat()

            files.append({
                "filename": file_path.name,
                "size": stats.st_size,
                "uploaded_at": uploaded_at
            })

    # Alphabetical order
    files.sort(
        key=lambda file: file["filename"].lower()
    )

    return {
        "files": files
    }


# --------------------------------------------------
# Download
# --------------------------------------------------

@app.get("/api/download/{filename}")
def download_file(filename: str):

    safe_filename = Path(filename).name

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists() or not file_path.is_file():

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    return FileResponse(
        path=file_path,
        filename=safe_filename,
        media_type="application/octet-stream"
    )


# --------------------------------------------------
# Preview
# --------------------------------------------------

@app.get("/api/preview/{filename}")
def preview_file(filename: str):

    safe_filename = Path(filename).name

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists() or not file_path.is_file():

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    extension = file_path.suffix.lower()

    preview_types = {

        # Images
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",

        # PDF
        ".pdf": "application/pdf",

        # Text
        ".txt": "text/plain",
        ".html": "text/html",
        ".css": "text/css",
        ".json": "application/json",
        ".csv": "text/csv",

    }

    media_type = preview_types.get(
        extension,
        "application/octet-stream"
    )

    return FileResponse(
        path=file_path,
        media_type=media_type,
        content_disposition_type="inline"
    )


# --------------------------------------------------
# Delete
# --------------------------------------------------

@app.delete("/api/delete/{filename}")
def delete_file(filename: str):

    safe_filename = Path(filename).name

    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists() or not file_path.is_file():

        raise HTTPException(
            status_code=404,
            detail="File not found."
        )

    file_path.unlink()

    return {
        "message": "File deleted successfully!",
        "filename": safe_filename
    }