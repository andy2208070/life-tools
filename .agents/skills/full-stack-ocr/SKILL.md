---
name: full-stack-ocr
description: Build and integrate a full-stack OCR platform using React, FastAPI, PaddleOCR, PDF processing, and document export services.
---

# Full-Stack OCR Platform Implementation Task

You are a senior full-stack software engineer responsible for implementing a production-ready OCR platform.

The repository contains two projects:

```text
LIFE-TOOLS/
├── be-life-tools/
└── fe-life-tools/
```

The frontend project already contains a React application and has already been partially implemented according to a previous OCR development prompt.

The backend project is currently a completely new and empty directory.

The updated objective is to:

1. Build a Python backend project.
2. Use open-source packages to provide high-quality OCR functionality.
3. Keep the Python backend flexible enough to support future non-OCR features.
4. Adjust the existing React frontend.
5. Integrate the frontend and backend into a working full-stack application.
6. Avoid breaking unrelated existing functionality.

---

# 1. Important Repository Rules

Before making any changes:

1. Inspect the complete repository structure.
2. Identify which directory is the frontend project and which directory is the backend project.
3. Confirm the frontend package manager.
4. Inspect the frontend `package.json`.
5. Inspect the existing frontend routing configuration.
6. Inspect the existing layout, sidebar, UI components, styling system, and design tokens.
7. Inspect the existing OCR-related implementation.
8. Inspect the current contents of `be-life-tools`.
9. Do not assume that the directory names are the only relevant project boundaries.
10. Do not rewrite the entire frontend application.
11. Do not replace existing architecture unless it is strictly necessary.
12. Modify only the files required for this feature and integration.
13. Preserve unrelated pages and functionality.

The existing React OCR page is expected to be located at:

```text
fe-life-tools/src/pages/OCRPage.tsx
```

If the actual path is different, locate the existing OCR page and follow the actual project structure.

---

# 2. Overall Architecture

Implement the following architecture:

```text
React Frontend
    ↓
REST API
    ↓
Python FastAPI Backend
    ↓
Application Services
    ↓
OCR Engine Adapter
    ↓
PaddleOCR / PP-Structure
    ↓
Structured OCR Result
    ↓
Preview and Export Services
    ↓
PDF / DOCX / TXT / Markdown / HTML Output
```

The backend must not be implemented as a single large OCR script.

Use a modular architecture that separates:

- API routing
- Request and response schemas
- Application services
- OCR engine integration
- File storage
- PDF processing
- Image preprocessing
- Document layout analysis
- Export generation
- Configuration
- Error handling
- Logging
- Health checks

The backend should be flexible enough to add future features such as:

- Authentication
- User management
- File history
- Document management
- Background task processing
- AI document classification
- Summarization
- Translation
- Search
- Audit logs
- Usage tracking
- Additional document processing tools

---

# 3. Backend Technology Requirements

Create a Python backend application in:

```text
be-life-tools/
```

Use the following technologies where compatible with the existing environment:

- Python 3.11 or a compatible modern Python version
- FastAPI
- Uvicorn
- Pydantic
- Pydantic Settings
- PaddleOCR
- PP-Structure or the appropriate PaddleOCR document structure analysis module
- PyMuPDF for PDF rendering and PDF inspection
- OpenCV for image preprocessing
- Pillow for image manipulation
- OCRmyPDF for searchable PDF generation where compatible
- `python-docx` for DOCX generation
- ReportLab or another suitable open-source PDF library for generated PDFs
- `python-multipart` for multipart file uploads
- `aiofiles` where asynchronous file operations are useful

Use only open-source packages.

Do not use:

- Paid OCR APIs
- Proprietary OCR services
- Closed-source cloud OCR services
- Hardcoded API keys
- External services that require a paid subscription
- Fake OCR results
- Placeholder endpoints that appear complete but do not work

Before installing dependencies:

1. Inspect whether any backend dependencies already exist.
2. Check the supported Python version.
3. Use a virtual environment or document the expected environment.
4. Use a dependency file such as `requirements.txt` or `pyproject.toml`.
5. Pin versions only when necessary for compatibility.
6. Prefer stable and mutually compatible versions.

If a package such as OCRmyPDF is difficult to install on the current operating system, implement it behind an adapter and provide a graceful fallback or clearly documented optional dependency.

---

# 4. Backend Project Structure

Create a maintainable project structure similar to the following:

```text
be-life-tools/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── errors.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py
│   │       └── ocr.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py
│   │   └── ocr.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── ocr_service.py
│   │   ├── document_service.py
│   │   ├── preprocessing_service.py
│   │   ├── pdf_service.py
│   │   └── export_service.py
│   ├── engines/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── paddleocr_engine.py
│   │   └── engine_factory.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── file_repository.py
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── file_utils.py
│   │   └── image_utils.py
│   └── models/
│       ├── __init__.py
│       └── ocr_models.py
├── tests/
│   ├── __init__.py
│   ├── test_health.py
│   ├── test_file_validation.py
│   ├── test_ocr_schemas.py
│   └── test_ocr_service.py
├── storage/
│   ├── uploads/
│   ├── processed/
│   └── exports/
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
└── run.py
```

You may adjust this structure if the repository has established conventions, but preserve the same architectural separation.

The backend must not depend on global mutable state for individual requests.

---

# 5. Backend Configuration

Implement environment-based configuration.

Create an example environment file:

```env
APP_NAME=life-tools-backend
APP_ENV=development
HOST=0.0.0.0
PORT=8000
FRONTEND_ORIGIN=http://localhost:5173
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIRECTORY=storage/uploads
PROCESSED_DIRECTORY=storage/processed
EXPORT_DIRECTORY=storage/exports
OCR_DEFAULT_LANGUAGE=en
OCR_ENABLE_PREPROCESSING=true
OCR_ENABLE_LAYOUT_ANALYSIS=true
OCR_USE_GPU=false
```

The actual variable names may follow the project's conventions.

Requirements:

- Never commit secrets.
- Add `.env` to `.gitignore`.
- Provide `.env.example`.
- Do not hardcode environment-specific URLs.
- Make CORS origins configurable.
- Make upload size configurable.
- Make OCR language configurable.
- Make storage paths configurable.

---

# 6. OCR Engine Requirements

Use PaddleOCR as the primary OCR engine.

The OCR implementation must be abstracted behind an interface or base class so that another OCR engine can be added later.

Create a design similar to:

```python
class OcrEngine:
    def process_image(
        self,
        image_path: str,
        language: str,
        enable_layout_analysis: bool = True,
    ) -> OcrPageResult:
        raise NotImplementedError
```

The implementation must support:

- English
- Traditional Chinese where supported
- Simplified Chinese where supported
- Japanese where supported if practical
- Korean where supported if practical

Do not assume that every language is installed or supported. The backend must validate the requested language and return a useful error message.

The OCR engine should return structured information rather than plain text only.

Each OCR text block should contain, where available:

- Recognized text
- Confidence score
- Bounding box or polygon
- Page number
- Block type
- Reading order
- Optional font or layout metadata

Example response model:

```json
{
  "text": "Recognized text",
  "confidence": 0.96,
  "block_type": "text",
  "page_number": 1,
  "order": 0,
  "polygon": [
    [100, 120],
    [600, 120],
    [600, 170],
    [100, 170]
  ]
}
```

---

# 7. Image Preprocessing

Implement an optional image preprocessing pipeline using OpenCV and Pillow.

The preprocessing pipeline may include:

- Grayscale conversion
- Noise reduction
- Contrast enhancement
- Thresholding
- Deskewing
- Rotation correction
- Resolution normalization
- Border removal
- Image sharpening
- Automatic orientation detection where supported

The pipeline must be configurable and must not destroy the original uploaded file.

Keep both:

```text
Original file
Processed OCR image
```

The preprocessing service should be independently testable.

If preprocessing fails, the system should be able to fall back to the original image when reasonable.

---

# 8. Supported Input Files

At minimum, support:

```text
.pdf
.png
.jpg
.jpeg
.webp
.bmp
.tif
.tiff
```

The backend must validate:

- File extension
- MIME type where available
- File size
- Empty files
- Corrupt files
- Unsupported files
- Malicious or suspicious filenames

Normalize filenames before saving.

Do not trust the original filename as a storage path.

Generate a safe internal file identifier.

---

# 9. PDF Processing

For PDF files:

1. Validate that the PDF is readable.
2. Detect the page count.
3. Render each page to an image using PyMuPDF.
4. Use an appropriate resolution for OCR.
5. Process each page independently.
6. Preserve page order.
7. Store page-level results.
8. Handle encrypted or corrupted PDFs gracefully.
9. Avoid loading unnecessarily large documents fully into memory.
10. Clean up temporary files after processing.

If the PDF already contains selectable text, it may optionally use direct text extraction as an optimization, but image-based OCR must still be supported.

---

# 10. OCR Processing Modes

The API must support two modes.

## Basic Mode

Basic mode should:

- Extract text from images and PDFs.
- Return text grouped by page.
- Return combined plain text.
- Return confidence information where available.
- Return page boundaries.
- Support TXT, Markdown, and HTML export.
- Not attempt to recreate the entire original visual layout.

## Advanced Mode

Advanced mode should:

- Preserve original page images.
- Perform layout-aware OCR.
- Preserve text block positions.
- Preserve page order.
- Detect tables where supported.
- Detect headings, paragraphs, images, and other document regions where supported.
- Return structured layout information.
- Support document preview.
- Support editable recognized text.
- Support searchable PDF generation where possible.
- Support DOCX export where practical.
- Support HTML or Markdown export.
- Clearly communicate that pixel-perfect reconstruction is not guaranteed.

Do not claim perfect layout preservation.

---

# 11. Backend API Design

Create a versioned API prefix, such as:

```text
/api/v1
```

Implement at least the following endpoints.

## Health Check

```http
GET /api/v1/health
```

Response:

```json
{
  "status": "ok",
  "service": "life-tools-backend"
}
```

## OCR Capability Information

```http
GET /api/v1/ocr/capabilities
```

Return:

- Supported input formats
- Supported OCR languages
- Supported output formats
- Whether layout analysis is available
- Whether searchable PDF output is available
- Maximum configured upload size

## Process OCR

```http
POST /api/v1/ocr/process
```

Use `multipart/form-data`.

Parameters:

```text
file: uploaded file
mode: basic | advanced
language: OCR language code
preprocess: true | false
layout_analysis: true | false
```

Return a job result or a completed result.

For the initial implementation, synchronous processing is acceptable for small files. Design the service so it can later support asynchronous jobs.

Example response:

```json
{
  "document_id": "uuid",
  "file_name": "example.pdf",
  "mode": "advanced",
  "language": "eng",
  "status": "completed",
  "page_count": 2,
  "pages": [
    {
      "page_number": 1,
      "width": 1600,
      "height": 2200,
      "text": "Page text",
      "blocks": [
        {
          "text": "Page text",
          "confidence": 0.95,
          "block_type": "text",
          "order": 0,
          "polygon": [
            [100, 120],
            [700, 120],
            [700, 180],
            [100, 180]
          ]
        }
      ],
      "original_image_url": "/api/v1/ocr/documents/uuid/pages/1/image"
    }
  ],
  "plain_text": "Page text",
  "markdown": "# Optional markdown output"
}
```

## Get Document Result

```http
GET /api/v1/ocr/documents/{document_id}
```

Return the stored OCR result.

## Get Page Image

```http
GET /api/v1/ocr/documents/{document_id}/pages/{page_number}/image
```

Return the original or processed page image for preview.

## Export Document

```http
POST /api/v1/ocr/documents/{document_id}/export
```

Request body:

```json
{
  "format": "txt"
}
```

Supported formats should include where implemented:

```text
txt
md
html
pdf
docx
```

Return the generated file as a downloadable response or return a download URL.

## Delete Document

```http
DELETE /api/v1/ocr/documents/{document_id}
```

Delete temporary files and processed results.

---

# 12. Progress and Long-Running Processing

OCR can take time, especially for multi-page PDFs.

Implement a practical initial solution:

- Return clear processing errors.
- Process pages sequentially or with controlled concurrency.
- Avoid excessive memory usage.
- Provide a structure that can later support asynchronous jobs.

If the existing project or environment supports it cleanly, implement asynchronous jobs with:

- Job identifier
- Job status endpoint
- Progress percentage
- Current page
- Total pages
- Cancellation support

If asynchronous processing introduces unnecessary complexity for the initial environment, implement synchronous processing first but keep the service layer separated so it can be upgraded later.

Do not create fake progress values that are unrelated to actual progress.

---

# 13. Export Requirements

Implement export generation in a separate service.

## TXT

- Include all pages in correct order.
- Include page separators.
- Preserve paragraphs and line breaks as reasonably as possible.

## Markdown

- Preserve headings and paragraphs where available.
- Preserve tables as Markdown tables where possible.
- Include page separators.

## HTML

- Generate a valid HTML document.
- Escape user-editable text safely.
- Preserve page sections.
- Include images where appropriate.
- Do not introduce unsafe HTML injection.

## PDF

For Basic mode:

- Generate a readable text-based PDF.

For Advanced mode:

- Preserve original page images where possible.
- Add selectable or searchable OCR text where possible.
- Preserve page order.
- Use a practical standard page size.
- Do not destroy the original source file.

Prefer OCRmyPDF for generating searchable PDFs from scanned PDFs when available and compatible.

If OCRmyPDF cannot be used in the current environment, provide a fallback PDF generation strategy and document the limitation.

## DOCX

- Generate a valid DOCX document.
- Include OCR text in page order.
- Preserve basic paragraphs and headings.
- Include images in Advanced mode where practical.
- Do not promise exact visual reproduction.

---

# 14. Frontend Integration

The frontend project is located in:

```text
fe-life-tools/
```

The existing OCR page is expected at:

```text
fe-life-tools/src/pages/OCRPage.tsx
```

Inspect the current implementation before modifying it.

The frontend must be updated to use the backend OCR APIs instead of relying exclusively on browser-only OCR.

The frontend should remain compatible with the existing React architecture.

Do not remove the existing page layout or sidebar unless required.

---

# 15. Frontend UI Requirements

Preserve the existing application design language.

The OCR page should contain:

## Left Sidebar

- OCR mode selector:
  - Basic OCR
  - Advanced OCR
- OCR language selector
- Preprocessing toggle
- Layout analysis toggle
- Supported file formats
- File information
- Processing status
- Reset button

## Main Content Area

- Page title
- Description
- Drag-and-drop upload area
- File picker fallback
- Selected file information
- Start OCR button
- Cancel or reset button
- Processing progress
- Page progress
- OCR result preview
- Original image preview
- Combined layout preview for Advanced mode
- Editable text area
- Output format selector
- Download button
- Error and warning messages

The main workflow should be:

```text
Select mode
→ Select language
→ Upload file
→ Configure options
→ Start OCR
→ Monitor processing
→ Review result
→ Edit text if needed
→ Select output format
→ Download
```

---

# 16. Frontend API Service

Create or update a dedicated API service, for example:

```text
fe-life-tools/src/services/ocrService.ts
```

The API service should:

- Use the project's existing HTTP client if available.
- Otherwise use the native `fetch` API.
- Read the backend base URL from environment configuration.
- Avoid hardcoded production URLs.
- Upload files using `FormData`.
- Handle non-2xx responses.
- Parse backend error messages.
- Support fetching document results.
- Support fetching page images.
- Support exporting files.
- Support deleting temporary documents.

Example configuration:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Use the project's actual environment variable convention if it differs.

---

# 17. Frontend TypeScript Models

Create strongly typed models for backend responses.

Example:

```ts
export type OcrMode = "basic" | "advanced";

export type OcrOutputFormat =
  | "txt"
  | "md"
  | "html"
  | "pdf"
  | "docx";

export interface OcrBlock {
  text: string;
  confidence?: number;
  blockType?: string;
  order?: number;
  polygon?: Array<[number, number]>;
  pageNumber?: number;
}

export interface OcrPageResult {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  blocks: OcrBlock[];
  originalImageUrl?: string;
}

export interface OcrResult {
  documentId: string;
  fileName: string;
  mode: OcrMode;
  language: string;
  status: "processing" | "completed" | "failed" | "cancelled";
  pageCount: number;
  pages: OcrPageResult[];
  plainText: string;
  markdown?: string;
}
```

Adapt these types to the actual backend response.

Avoid using `any`.

---

# 18. Frontend Preview Requirements

## Basic Mode

Display:

- Combined recognized text
- Page separators
- Editable text
- Character count if practical
- Copy button
- Download controls

## Advanced Mode

Display:

- Original page image
- OCR text blocks
- Optional text bounding boxes
- Page navigation
- Combined view
- Original-only view
- Text-only view
- Editable OCR text

If bounding boxes are displayed, scale coordinates correctly according to the displayed image dimensions.

If precise overlay rendering is not reliable, provide a stable side-by-side view instead of a misleading overlay.

---

# 19. Frontend Download Behavior

The frontend should call the backend export endpoint.

The download process must:

1. Validate that OCR processing is complete.
2. Validate that a supported output format is selected.
3. Request the export file from the backend.
4. Convert the response to a Blob.
5. Trigger a browser download.
6. Use a safe filename based on the original filename.
7. Display an error if export fails.

Do not generate a fake download containing incomplete or placeholder content.

---

# 20. Error Handling

Handle errors on both frontend and backend.

Backend errors should include:

- Invalid request
- Unsupported file type
- File too large
- Corrupted file
- OCR engine failure
- Unsupported language
- Export failure
- Missing document
- Processing cancellation
- Internal server error

Frontend errors should be user-friendly and should not expose raw stack traces.

Example user-facing messages:

```text
The selected file type is not supported.
The file is too large. Please choose a smaller file.
The PDF could not be read. It may be corrupted or password-protected.
OCR processing failed for this document.
The requested export format is not available.
```

---

# 21. CORS and Local Development

Configure the backend to allow the frontend development origin.

At minimum, support:

```text
http://localhost:5173
http://127.0.0.1:5173
```

Use environment configuration for allowed origins.

Do not allow unrestricted CORS in production configuration.

Document the local development setup:

```text
Backend:
cd be-life-tools
python -m venv .venv
activate the virtual environment
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

Frontend:
cd fe-life-tools
install dependencies
start the existing React development server
```

Use the actual package manager and commands discovered from the repository.

---

# 22. Optional Docker Support

If the repository does not already have a container strategy, Docker support is optional.

If Docker is added, provide:

```text
be-life-tools/Dockerfile
docker-compose.yml
```

The Docker configuration should:

- Use a Python base image.
- Install required system packages.
- Configure storage directories.
- Expose the backend port.
- Avoid embedding secrets.
- Document CPU-only operation.
- Clearly document optional GPU support separately.

Do not add Docker if it introduces unnecessary complexity or conflicts with the existing project.

---

# 23. Logging and Observability

Implement basic structured logging.

Log:

- Application startup
- OCR request start
- Document identifier
- File type and size
- Processing duration
- Page count
- Export status
- Errors

Do not log:

- Full document content
- Sensitive user data
- OCR text unnecessarily
- Secrets
- File contents

Include request identifiers or document identifiers where useful.

---

# 24. Resource and Privacy Management

The application should:

- Store files outside source code directories.
- Use generated document identifiers.
- Prevent path traversal.
- Clean up temporary files.
- Avoid permanently storing files unless explicitly required.
- Document the storage lifecycle.
- Provide a delete endpoint.
- Release temporary images after processing.
- Avoid loading huge documents into memory unnecessarily.

For the initial version, temporary local storage is acceptable.

Design the repository layer so it can later be replaced by:

- S3-compatible object storage
- Database-backed metadata
- Cloud storage
- Network storage

---

# 25. Testing Requirements

Add backend tests using the testing framework already present in the project, or use:

- Pytest
- FastAPI TestClient

Test at least:

- Health endpoint
- Supported file validation
- Unsupported file validation
- File size validation
- OCR request schema validation
- OCR mode validation
- Language validation
- Empty upload validation
- Missing document handling
- Export format validation
- OCR service behavior with mocked OCR engine
- Multi-page result ordering
- Error response format

Do not require a real OCR model for every unit test.

Mock the OCR engine in unit tests where appropriate.

If the frontend already has a testing setup, add or update tests for:

- Upload behavior
- OCR mode switching
- API error handling
- Processing states
- Result rendering
- Text editing
- Export format selection
- Download behavior
- Reset behavior

---

# 26. Documentation Requirements

Create or update backend documentation.

The backend `README.md` should include:

- Project purpose
- Python version
- Installation steps
- Virtual environment setup
- Dependency installation
- OCR model installation or first-run behavior
- Environment variables
- Development server command
- API endpoint summary
- Supported file formats
- Supported languages
- Supported export formats
- Storage behavior
- Known limitations
- Troubleshooting guide

Also update the frontend documentation if the API integration requires new setup steps.

Document the limitations of:

- OCR accuracy
- Low-resolution documents
- Handwriting
- Complex tables
- Multi-column reading order
- Exact DOCX layout preservation
- Pixel-perfect PDF reconstruction
- CPU-only processing speed

---

# 27. Implementation Sequence

Follow this implementation sequence.

## Step 1: Inspect the Repository

Inspect:

```text
be-life-tools/
fe-life-tools/
fe-life-tools/src/pages/OCRPage.tsx
fe-life-tools/package.json
```

Also inspect:

- Routing
- Existing layout
- Sidebar
- Existing API services
- Existing environment configuration
- Styling system
- Test setup

## Step 2: Create the Backend Foundation

Create:

- Python project files
- FastAPI application
- Configuration
- Health endpoint
- API router
- Error handling
- CORS configuration
- Storage directories
- Dependency file
- Environment example
- Backend README

Verify that the backend starts successfully before implementing OCR.

## Step 3: Implement File Handling

Implement:

- File validation
- Safe filenames
- Temporary storage
- File identification
- PDF detection
- Image detection
- Cleanup behavior

## Step 4: Implement OCR Services

Implement:

- OCR engine abstraction
- PaddleOCR integration
- Language validation
- Image preprocessing
- PDF page rendering
- Basic mode
- Advanced layout-aware mode
- Structured result models

## Step 5: Implement Export Services

Implement:

- TXT export
- Markdown export
- HTML export
- PDF export
- DOCX export
- Searchable PDF support where available

## Step 6: Implement Frontend API Integration

Implement:

- API service
- TypeScript interfaces
- Upload request
- OCR processing states
- Error handling
- Result retrieval
- Page image retrieval
- Export download

## Step 7: Update OCRPage.tsx

Integrate the new backend workflow into:

```text
fe-life-tools/src/pages/OCRPage.tsx
```

Reuse existing components and styles.

## Step 8: Validate

Run:

- Backend type or syntax checks
- Backend tests
- Frontend type checking
- Frontend linting
- Frontend tests
- Frontend production build
- Backend startup check

Fix all errors caused by the implementation.

## Step 9: Provide a Summary

After implementation, summarize:

- Files created
- Files modified
- Backend framework
- OCR libraries
- API endpoints
- Supported input formats
- Supported languages
- Supported output formats
- Local development commands
- Environment variables
- Known limitations
- Validation commands and results
- Recommended future improvements

---

# 28. Acceptance Criteria

The implementation is complete only when all of the following are satisfied:

## Backend

- A working Python project exists in `be-life-tools`.
- FastAPI starts successfully.
- A health endpoint is available.
- CORS is configurable.
- File uploads are validated securely.
- PDF and image files are supported.
- PaddleOCR is integrated through an abstraction layer.
- Traditional Chinese support is implemented where supported by the installed OCR models.
- Basic OCR mode works.
- Advanced layout-aware OCR mode works as far as the selected open-source tools support.
- OCR results include page-level text.
- OCR results include bounding boxes or polygons where available.
- OCR results include confidence values where available.
- Export endpoints are implemented.
- Temporary files can be deleted.
- Errors use clear structured responses.
- Backend tests are included.
- Backend documentation is included.

## Frontend

- The existing React application still builds.
- `OCRPage.tsx` integrates with the backend.
- Users can select Basic or Advanced mode.
- Users can select the OCR language.
- Users can upload supported images and PDFs.
- Users can see processing status and progress.
- Users can cancel or reset the current OCR session where supported.
- OCR results can be viewed.
- OCR text can be edited.
- Advanced mode displays original pages and layout-aware OCR results.
- Users can select an output format.
- Users can download generated output files.
- API errors are shown in a user-friendly manner.
- Existing sidebar and layout conventions are preserved.
- No unrelated pages are broken.

## Integration

- Frontend and backend run locally at the same time.
- Frontend API base URL is configurable.
- Backend CORS supports the frontend development origin.
- The full workflow works from upload to download.
- No paid or proprietary OCR service is required.
- No secrets are committed.
- The implementation is modular enough to support future backend features.

---

# 29. Important Quality Constraints

- Do not implement everything inside `OCRPage.tsx`.
- Do not create a monolithic backend file.
- Do not use `any` unnecessarily in TypeScript.
- Do not use fake OCR output.
- Do not hide OCR failures.
- Do not silently fall back to a lower-quality implementation.
- Do not claim exact layout preservation when it is not technically guaranteed.
- Do not upload files to third-party OCR services.
- Do not modify unrelated application behavior.
- Do not leave broken imports, unfinished TODOs, or fake endpoints.
- Do not commit generated OCR files or user-uploaded files.
- Do not store sensitive document content in logs.
- Prefer a stable working implementation over excessive complexity.
- Keep OCR engine integration replaceable.
- Keep storage implementation replaceable.
- Keep export generation modular.
- Keep future authentication and background processing possible.

Begin by inspecting the repository. Do not start coding until you understand the existing frontend structure and the empty backend directory.