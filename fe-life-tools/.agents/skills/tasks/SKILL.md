# OCR Tool Development Task

You are a senior full-stack software engineer. Implement an OCR tool inside the existing React project.

The existing React project already exists. The primary page file for this task is:

```text
src/pages/OCRPage.tsx
```

The application must provide a web-based interface that allows users to upload PDF files or images, process them with OCR, preview the results, and download the processed output.

---

## 1. Main Objectives

Build an OCR page with two processing modes:

### Basic OCR Mode

The Basic OCR mode should:

- Extract text from uploaded images or PDF files.
- Display the recognized text in a readable preview area.
- Allow users to copy the extracted text.
- Allow users to download the extracted text.
- Support multiple common image formats.
- Support PDF files.
- Display processing progress and error messages.
- Use open-source OCR libraries only.

### Advanced OCR Mode

The Advanced OCR mode should:

- Preserve the original document images.
- Detect text inside the images.
- Overlay or associate recognized text with the original document layout as much as reasonably possible.
- Preserve the original page structure, images, and basic formatting.
- Provide a document preview.
- Allow users to edit recognized text before downloading.
- Allow users to select an output format, such as:
  - PDF
  - Microsoft Word-compatible DOCX
  - Plain text
  - HTML, if practical
- Provide download functionality for the selected output format.
- Clearly communicate any limitations related to layout preservation.

---

## 2. Technology Requirements

Use only open-source packages and libraries.

The frontend must be implemented using React and TypeScript.

Before changing the code:

1. Inspect the existing project structure.
2. Inspect the existing routing configuration.
3. Inspect the existing UI component library and styling approach.
4. Inspect the existing package manager and available dependencies.
5. Reuse existing components, design tokens, icons, utility functions, and layout patterns whenever possible.
6. Do not introduce a new UI framework if an existing one is already used.
7. Do not rewrite or replace the existing application architecture.

The primary implementation file is:

```text
src/pages/OCRPage.tsx
```

You may create supporting components, hooks, utilities, types, and services when necessary, but keep all changes focused on the OCR feature.

Avoid modifying unrelated pages or components.

---

## 3. OCR and File Processing Libraries

Prefer well-maintained open-source libraries that are compatible with the existing project.

Possible libraries include, but are not limited to:

- `tesseract.js` for OCR processing.
- `pdfjs-dist` for reading and rendering PDF pages.
- `file-saver` for client-side downloads.
- `jspdf` for PDF generation.
- `docx` for generating DOCX files.
- `html2canvas` if needed for rendering document previews.
- `jszip` only if needed for packaging multiple output files.
- Native browser APIs whenever possible.

Before installing a dependency:

- Check whether it is already installed.
- Check whether the project already provides an equivalent utility.
- Use the smallest reasonable dependency set.
- Do not use paid, proprietary, or closed-source OCR APIs.
- Do not require an external OCR service unless the existing project already has a backend integration.
- Do not expose API keys or secrets in frontend code.

If an actual backend OCR service is required but does not exist, implement a clean service abstraction and a local/browser-based fallback where practical. Do not invent nonexistent API endpoints.

---

## 4. User Interface Layout

The page must follow this layout:

- Left sidebar for navigation or OCR-related settings.
- Main content area on the right for file upload, processing, preview, and download functions.

The interface should be responsive and work on desktop and tablet screen sizes.

Use the existing application layout if one already exists.

### Suggested Page Structure

#### Left Sidebar

Include:

- OCR mode selector:
  - Basic OCR
  - Advanced OCR
- Language selector.
- Supported file format information.
- Processing options.
- Reset or clear action.
- Optional document information:
  - File name
  - File size
  - Number of pages
  - Processing status

#### Main Content Area

Include:

1. Page title and description.
2. File upload area.
3. File list or selected file information.
4. Processing controls.
5. Processing progress indicator.
6. OCR result preview.
7. Editing area for recognized text.
8. Output format selector.
9. Download button.
10. Error and warning messages.

---

## 5. File Upload Requirements

Support at least:

- `.pdf`
- `.png`
- `.jpg`
- `.jpeg`
- `.webp`
- `.bmp`
- `.tiff`, if supported by the selected OCR pipeline

The upload interface should support:

- File picker selection.
- Drag-and-drop upload.
- Clear validation errors.
- File type validation.
- File size validation.
- A reasonable maximum file size.
- Clear feedback when a file is rejected.
- File removal before processing.
- Resetting the current OCR session.

Do not upload files to an external service unless an existing backend explicitly supports it.

All local files should be processed safely in the browser when feasible.

---

## 6. PDF Processing Requirements

For uploaded PDFs:

- Detect the number of pages.
- Render each PDF page as an image for OCR.
- Process pages sequentially or with a controlled concurrency level.
- Display page-level progress.
- Avoid freezing the UI during processing.
- Release object URLs and other temporary resources after use.
- Handle encrypted, invalid, or unsupported PDFs gracefully.
- Show a useful error message when a PDF cannot be processed.

If the PDF contains selectable text, you may optionally provide a text extraction optimization, but image-based OCR must remain supported.

---

## 7. OCR Processing Requirements

The OCR implementation should:

- Use an open-source OCR engine.
- Allow the user to select the OCR language.
- Include at least English support.
- Include Traditional Chinese and Simplified Chinese support if the selected OCR package and language data support them.
- Show initialization status.
- Show current page and total page progress.
- Show processing percentage when available.
- Avoid blocking the entire user interface.
- Handle OCR failures per page without crashing the entire process.
- Provide a retry option when practical.
- Allow the user to cancel processing.
- Clean up workers when processing is complete or cancelled.

The implementation must not silently fail.

Display clear states such as:

- Idle
- File selected
- Preparing
- Loading OCR engine
- Processing
- Completed
- Cancelled
- Failed

---

## 8. Basic OCR Mode

The Basic OCR result should include:

- Recognized text grouped by page.
- A readable text editor or text area.
- Page separators for multi-page documents.
- Copy-to-clipboard functionality.
- Download as `.txt`.
- Optional download as `.md`.
- Word and line breaks preserved as reasonably as possible.
- A character count or word count if practical.

The user must be able to edit the recognized text before downloading it.

---

## 9. Advanced OCR Mode

The Advanced OCR mode should provide a richer document reconstruction experience.

At minimum:

- Preserve the original page image.
- Display the OCR result over or alongside the original image.
- Preserve page order.
- Preserve basic text positions or bounding boxes when available.
- Preserve basic visual structure.
- Keep images visible in the preview.
- Allow recognized text to be edited.
- Allow the user to switch between:
  - Original image view
  - OCR text view
  - Combined view

If precise layout reconstruction is not technically reliable in the browser, implement the most stable practical solution and document the limitation in the UI or code comments.

Do not claim pixel-perfect layout preservation unless it is actually implemented.

---

## 10. Output and Download Requirements

The user must be able to choose an output type.

Support the following where technically feasible:

### Plain Text

- Download as `.txt`.
- Include all pages in the correct order.

### PDF

- Generate a PDF locally.
- Preserve page order.
- In Advanced OCR mode, include the original page image.
- Include recognized text as visible text, selectable text, or an overlay when technically feasible.
- Use a standard readable page size.

### DOCX

- Generate a Microsoft Word-compatible `.docx` file.
- Include recognized text in page order.
- Preserve basic paragraphs and headings where possible.
- Include images in Advanced OCR mode where practical.

### HTML

- Generate an HTML document if practical.
- Preserve paragraphs, page separators, and images where possible.

The download filenames should be generated from the original filename, for example:

```text
original-filename-ocr.txt
original-filename-ocr.pdf
original-filename-ocr.docx
```

The download action must be disabled when no OCR result exists.

---

## 11. State Management

Use React state management that matches the existing project.

The OCR page should manage at least:

- Selected file.
- File metadata.
- Selected OCR mode.
- Selected language.
- Selected output format.
- OCR processing status.
- Current page.
- Total pages.
- Progress percentage.
- Per-page OCR results.
- Combined OCR text.
- Advanced document data.
- Error messages.
- Warning messages.
- Cancellation state.
- Download state.

Use strongly typed TypeScript interfaces and avoid `any` unless absolutely unavoidable.

---

## 12. Error Handling

Handle the following cases:

- No file selected.
- Unsupported file type.
- File too large.
- Corrupted image.
- Corrupted PDF.
- Password-protected PDF.
- OCR engine initialization failure.
- Missing language data.
- OCR failure on an individual page.
- User cancellation.
- PDF generation failure.
- DOCX generation failure.
- Browser APIs not available.
- Insufficient browser memory.
- Empty OCR result.

Error messages should be understandable to non-technical users.

Do not expose raw stack traces in the user interface.

Use console logging only for development diagnostics and avoid logging sensitive file content.

---

## 13. Accessibility Requirements

The interface must:

- Use semantic HTML.
- Include accessible labels for all controls.
- Support keyboard navigation.
- Provide visible focus states.
- Use sufficient color contrast.
- Announce important processing status changes when practical.
- Provide meaningful button labels.
- Avoid relying on color alone to communicate status.
- Include accessible drag-and-drop behavior with a normal file picker fallback.

---

## 14. Security and Privacy Requirements

- Process files locally whenever feasible.
- Do not send uploaded files to third-party services.
- Do not store uploaded files permanently.
- Revoke temporary object URLs.
- Avoid putting document content into URL query parameters.
- Do not expose secrets or API keys.
- Sanitize generated HTML if user-entered text is inserted into it.
- Clearly indicate that files are processed locally if that is the actual implementation.

---

## 15. Visual Design Requirements

Use the existing project design system.

The UI should feel polished and production-ready.

Include:

- Clear visual hierarchy.
- Consistent spacing.
- Responsive layout.
- Empty states.
- Loading states.
- Skeletons or progress indicators where appropriate.
- Disabled states.
- Success states.
- Error states.
- Helpful tooltips or descriptions for advanced settings.

Do not add excessive visual complexity.

The primary workflow should be easy to understand:

1. Choose OCR mode.
2. Upload a file.
3. Select language.
4. Start OCR.
5. Review or edit results.
6. Select output format.
7. Download the result.

---

## 16. Code Quality Requirements

- Use TypeScript throughout.
- Create reusable components where useful.
- Keep the main page maintainable.
- Avoid deeply nested conditional rendering.
- Separate file processing, OCR processing, preview rendering, and download generation into focused utilities or hooks where appropriate.
- Add comments only where they explain non-obvious technical decisions.
- Avoid placeholder implementations that appear complete but do not work.
- Do not use fake progress unrelated to actual processing unless clearly labeled.
- Keep the implementation compatible with the project's current build system.
- Run formatting, linting, type checking, and tests if available.

---

## 17. Existing Project Integration

Before implementation:

- Identify how pages are registered.
- Confirm whether `OCRPage.tsx` is already connected to routing.
- Preserve the existing route if one exists.
- If the page is not registered, add the minimum required route using the project's existing routing pattern.
- Reuse the existing sidebar and page layout components.
- Follow existing import conventions.
- Follow existing naming conventions.
- Follow the existing styling methodology, such as CSS modules, Tailwind CSS, styled-components, or another established method.

Do not replace the existing router, state management system, or styling system.

---

## 18. Dependency and Environment Handling

If additional open-source dependencies are required:

1. Check the existing `package.json`.
2. Explain why each dependency is needed.
3. Install only necessary dependencies.
4. Ensure the versions are compatible with the existing project.
5. Update lock files if the package manager requires it.
6. Verify the project still builds successfully.

If a dependency cannot be installed or does not work with the existing environment:

- Use an alternative open-source solution.
- Keep the feature modular.
- Clearly document the limitation.
- Do not leave broken imports or incomplete code.

---

## 19. Testing Requirements

Add or update tests if the project already has a testing setup.

At minimum, verify:

- File type validation.
- File size validation.
- OCR mode switching.
- Language selection.
- Reset functionality.
- Processing state transitions.
- Error handling.
- Text editing.
- Download button state.
- Output format selection.
- Multi-page result ordering.

If browser-based OCR is difficult to test in unit tests, mock the OCR worker and test the surrounding state and UI behavior.

---

## 20. Acceptance Criteria

The implementation is complete only when:

- `src/pages/OCRPage.tsx` contains a functional OCR interface.
- Users can upload supported images and PDFs.
- Users can choose Basic or Advanced OCR mode.
- Users can select an OCR language.
- Users can start and cancel processing.
- Processing progress is visible.
- OCR results are displayed.
- OCR results can be edited.
- Basic mode supports text download.
- Advanced mode provides an original document preview.
- The user can select an output format.
- The application can generate and download supported output formats.
- Errors are handled clearly.
- The interface is responsive.
- The feature uses only open-source libraries.
- No external paid OCR API is required.
- The existing project still builds successfully.
- No unrelated functionality is broken.
- TypeScript errors are resolved.
- Lint and formatting checks pass when available.

---

## 21. Implementation Process

Follow this process:

### Step 1: Inspect

Inspect the existing codebase, especially:

- `src/pages/OCRPage.tsx`
- Routing files
- Layout files
- Sidebar components
- UI components
- Styling files
- `package.json`
- Existing utility and service directories

### Step 2: Plan

Create a concise implementation plan based on the existing architecture.

Identify:

- Components to reuse.
- New files required.
- Dependencies required.
- Browser compatibility considerations.
- Any unavoidable limitations.

### Step 3: Implement

Implement the OCR feature with clean, typed, modular code.

Prioritize a stable end-to-end workflow over unnecessary visual complexity.

### Step 4: Validate

Run:

- Type checking.
- Linting.
- Formatting.
- Existing tests.
- Production build.

Fix all errors caused by the implementation.

### Step 5: Summarize

After implementation, provide a summary containing:

- Files created or modified.
- Dependencies added.
- OCR libraries used.
- Supported file types.
- Supported output formats.
- Known limitations.
- Commands used for validation.
- Any follow-up work recommended.

---

## 22. Important Constraints

- Do not use proprietary OCR services.
- Do not use paid APIs.
- Do not hardcode fake OCR output.
- Do not silently ignore processing failures.
- Do not replace the existing application structure.
- Do not modify unrelated features.
- Do not use `any` unnecessarily.
- Do not claim advanced layout preservation is perfect if it is not.
- Prefer local browser processing for privacy.
- Keep the implementation maintainable and extensible.

Begin by inspecting the existing repository and then implement the OCR page according to the requirements above.