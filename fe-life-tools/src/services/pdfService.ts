import type { DocumentPage } from '../types/ocr';

interface PdfJsViewport {
  width: number;
  height: number;
}

interface PdfJsPage {
  getViewport: (options: { scale: number }) => PdfJsViewport;
  render: (params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfJsViewport;
  }) => { promise: Promise<void> };
}

interface PdfJsDocument {
  numPages: number;
  getPage: (pageNum: number) => Promise<PdfJsPage>;
}

interface PdfJsLib {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (src: { data: Uint8Array }) => {
    promise: Promise<PdfJsDocument>;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

let pdfJsLoadingPromise: Promise<PdfJsLib> | null = null;

export async function loadPdfJsLibrary(): Promise<PdfJsLib> {
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only supported in browser environments.');
  }

  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  if (pdfJsLoadingPromise) {
    return pdfJsLoadingPromise;
  }

  pdfJsLoadingPromise = new Promise<PdfJsLib>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib object is not found.'));
      }
    };

    script.onerror = () => {
      pdfJsLoadingPromise = null;
      reject(
        new Error(
          'Failed to load PDF engine. Please ensure your network can reach cdnjs, or convert the PDF to image files (PNG/JPG) for offline OCR.'
        )
      );
    };

    document.head.appendChild(script);
  });

  return pdfJsLoadingPromise;
}

/**
 * Loads an image file and returns a single DocumentPage
 */
export async function processImageFile(file: File): Promise<DocumentPage[]> {
  const imageUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve([
        {
          pageNumber: 1,
          imageUrl,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 1000,
          status: 'pending',
        },
      ]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('The uploaded image file is corrupted or cannot be decoded.'));
    };
    img.src = imageUrl;
  });
}

/**
 * Loads a PDF file and renders all pages to canvas images for OCR
 */
export async function processPdfFile(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<DocumentPage[]> {
  const pdfjs = await loadPdfJsLibrary();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
  });

  let pdfDoc: PdfJsDocument;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: unknown) {
    const errorObj = err as { name?: string; message?: string } | undefined;
    if (errorObj?.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please remove the password and try again.');
    }
    if (errorObj?.name === 'InvalidPDFException') {
      throw new Error('The PDF file is corrupted or not a valid PDF document.');
    }
    throw new Error(`Failed to read PDF: ${errorObj?.message || 'Unknown error'}`);
  }

  const numPages = pdfDoc.numPages;
  const pages: DocumentPage[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onProgress?.(pageNum, numPages);
    const page = await pdfDoc.getPage(pageNum);

    // Render at 1.5x scale for clean OCR text detection without excessive memory consumption
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context unavailable for PDF rendering.');
    }

    // Fill white background in case PDF page is transparent
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
    }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      pageNumber: pageNum,
      imageUrl: dataUrl,
      width: viewport.width,
      height: viewport.height,
      status: 'pending',
    });
  }

  return pages;
}
