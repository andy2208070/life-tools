import Tesseract from 'tesseract.js';
import type {
  DocumentPage,
  OCRLanguage,
  PageSegMode,
  OCRProgressState,
  PageOCRResult,
  OCRWord,
  OCRLine,
} from '../types/ocr';

export interface RunOCROptions {
  language: OCRLanguage;
  orientationMode: PageSegMode;
  onProgress: (progress: OCRProgressState) => void;
  signal?: AbortSignal;
}

interface RawBoundingBox {
  x0?: number;
  y0?: number;
  x1?: number;
  y1?: number;
}

interface RawWord {
  text?: string;
  confidence?: number;
  bbox?: RawBoundingBox;
}

interface RawLine {
  text?: string;
  confidence?: number;
  bbox?: RawBoundingBox;
}

// Matches whitespace between CJK characters (Han, Hiragana, Katakana, CJK Unified Ideographs)
const CJK_BETWEEN_REGEX = /([\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf])\s+([\u4e00-\u9fa5\u3040-\u30ff\u3400-\u4dbf])/g;

/**
 * Strips unnatural whitespace inserted between CJK characters by Tesseract
 */
export function cleanCJKSpacing(text: string): string {
  let cleaned = text.replace(CJK_BETWEEN_REGEX, '$1$2');
  cleaned = cleaned.replace(CJK_BETWEEN_REGEX, '$1$2');
  return cleaned;
}

/**
 * Processes an array of DocumentPages sequentially with Tesseract.js
 */
export async function runDocumentOCR(
  pages: DocumentPage[],
  options: RunOCROptions
): Promise<DocumentPage[]> {
  const { language, orientationMode, onProgress, signal } = options;
  const totalPages = pages.length;

  if (totalPages === 0) return [];

  // Determine actual language parameter, supporting vertical mode for CJK
  let actualLang: string = language;
  if (orientationMode === 5) {
    actualLang = actualLang.replace('chi_tra', 'chi_tra_vert').replace('chi_sim', 'chi_sim_vert');
  }

  onProgress({
    status: 'loading_engine',
    statusMessage: 'Initializing OCR Engine and language models...',
    currentPage: 1,
    totalPages,
    percent: 5,
  });

  let worker: Tesseract.Worker | null = null;

  try {
    worker = await Tesseract.createWorker(actualLang, 1, {
      logger: (m) => {
        if (signal?.aborted) return;
        if (m.status === 'recognizing text') {
          const pageRatio = 1 / totalPages;
          // Progress within current page
          const subProgress = Math.round(m.progress * 100);
          onProgress({
            status: 'processing',
            statusMessage: `Recognizing text (${subProgress}%)...`,
            currentPage: 1,
            totalPages,
            percent: Math.min(99, Math.round(subProgress * pageRatio)),
          });
        } else if (m.status) {
          onProgress({
            status: 'preparing',
            statusMessage: m.status,
            currentPage: 1,
            totalPages,
            percent: 10,
          });
        }
      },
    });

    if (signal?.aborted) {
      throw new DOMException('OCR process cancelled by user.', 'AbortError');
    }

    await worker.setParameters({
      tessedit_pageseg_mode: String(orientationMode) as unknown as Tesseract.PSM,
    });

    const updatedPages: DocumentPage[] = [];

    for (let i = 0; i < totalPages; i++) {
      if (signal?.aborted) {
        throw new DOMException('OCR process cancelled by user.', 'AbortError');
      }

      const currentPageNum = i + 1;
      const targetPage = { ...pages[i] };

      onProgress({
        status: 'processing',
        statusMessage: `Processing Page ${currentPageNum} of ${totalPages}...`,
        currentPage: currentPageNum,
        totalPages,
        percent: Math.round((i / totalPages) * 100),
      });

      targetPage.status = 'processing';

      try {
        const { data } = await worker.recognize(
          targetPage.imageUrl,
          {},
          {
            text: true,
            blocks: true,
            pdf: true,
          }
        );

        const cleanedText = cleanCJKSpacing(data.text || '');
        const rawData = data as unknown as { words?: RawWord[]; lines?: RawLine[] };

        // Extract word bounding boxes
        const words: OCRWord[] = [];
        if (Array.isArray(rawData.words)) {
          for (const w of rawData.words) {
            if (w.text && w.text.trim()) {
              words.push({
                text: cleanCJKSpacing(w.text),
                confidence: Math.round(w.confidence || 0),
                bbox: {
                  x0: w.bbox?.x0 ?? 0,
                  y0: w.bbox?.y0 ?? 0,
                  x1: w.bbox?.x1 ?? 0,
                  y1: w.bbox?.y1 ?? 0,
                },
              });
            }
          }
        }

        // Extract line bounding boxes
        const lines: OCRLine[] = [];
        if (Array.isArray(rawData.lines)) {
          for (const l of rawData.lines) {
            if (l.text && l.text.trim()) {
              lines.push({
                text: cleanCJKSpacing(l.text),
                confidence: Math.round(l.confidence || 0),
                bbox: {
                  x0: l.bbox?.x0 ?? 0,
                  y0: l.bbox?.y0 ?? 0,
                  x1: l.bbox?.x1 ?? 0,
                  y1: l.bbox?.y1 ?? 0,
                },
              });
            }
          }
        }

        const ocrResult: PageOCRResult = {
          text: cleanedText,
          confidence: Math.round(data.confidence || 0),
          lines,
          words,
          pdfBytes: Array.isArray(data.pdf) ? data.pdf : undefined,
        };

        targetPage.status = 'completed';
        targetPage.ocrResult = ocrResult;
      } catch (pageError: unknown) {
        console.error(`Error processing page ${currentPageNum}:`, pageError);
        targetPage.status = 'error';
        targetPage.error = pageError instanceof Error ? pageError.message : 'Page OCR failed';
      }

      updatedPages.push(targetPage);

      onProgress({
        status: 'processing',
        statusMessage: `Completed Page ${currentPageNum} of ${totalPages}`,
        currentPage: currentPageNum,
        totalPages,
        percent: Math.round(((i + 1) / totalPages) * 100),
      });
    }

    onProgress({
      status: 'completed',
      statusMessage: 'OCR recognition completed successfully!',
      currentPage: totalPages,
      totalPages,
      percent: 100,
    });

    return updatedPages;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (err) {
        console.warn('Worker termination error:', err);
      }
    }
  }
}
