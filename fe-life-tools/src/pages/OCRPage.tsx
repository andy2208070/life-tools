import { useState, useRef, useCallback, useEffect } from 'react';
import { Typography, message } from 'antd';
import type {
  OCRMode,
  OCRLanguage,
  PageSegMode,
  OutputFormat,
  FileMetadata,
  DocumentPage,
  OCRProgressState,
} from '../types/ocr';
import OCRConfigSidebar from '../components/ocr/OCRConfigSidebar';
import OCRUploadArea from '../components/ocr/OCRUploadArea';
import OCRProgressBar from '../components/ocr/OCRProgressBar';
import OCRBasicPreview from '../components/ocr/OCRBasicPreview';
import OCRAdvancedPreview from '../components/ocr/OCRAdvancedPreview';
import { processPdfFile, processImageFile } from '../services/pdfService';
import { runDocumentOCR } from '../services/ocrService';
import { exportDocument } from '../services/exportService';

const { Title, Paragraph } = Typography;

export default function OCRPage() {
  const [mode, setMode] = useState<OCRMode>('basic');
  const [language, setLanguage] = useState<OCRLanguage>('chi_tra+eng');
  const [orientationMode, setOrientationMode] = useState<PageSegMode>(3);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('txt');

  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [pages, setPages] = useState<DocumentPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [combinedText, setCombinedText] = useState<string>('');

  const [progress, setProgress] = useState<OCRProgressState>({
    status: 'idle',
    statusMessage: 'Ready to process',
    currentPage: 0,
    totalPages: 0,
    percent: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Synchronize combinedText whenever pages update
  const syncCombinedText = useCallback((docPages: DocumentPage[]) => {
    if (docPages.length === 0) {
      setCombinedText('');
      return;
    }
    if (docPages.length === 1) {
      setCombinedText(docPages[0]?.ocrResult?.text || '');
      return;
    }
    const combined = docPages
      .map(
        (p) =>
          `=== Page ${p.pageNumber} ===\n\n${p.ocrResult?.text || '(No text recognized on this page)'}`
      )
      .join('\n\n\n');
    setCombinedText(combined);
  }, []);

  // Handle mode switch: update default output format
  const handleModeChange = (newMode: OCRMode) => {
    setMode(newMode);
    if (newMode === 'basic' && (outputFormat === 'pdf' || outputFormat === 'docx')) {
      setOutputFormat('txt');
    } else if (newMode === 'advanced' && outputFormat === 'txt') {
      setOutputFormat('pdf');
    }
  };

  // Revoke object URLs on unmount or reset
  const cleanupPages = useCallback((targetPages: DocumentPage[]) => {
    for (const page of targetPages) {
      if (page.imageUrl && page.imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(page.imageUrl);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupPages(pages);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupPages, pages]);

  // Handle file selection (Image or PDF)
  const handleFileSelect = async (file: File) => {
    cleanupPages(pages);
    setPages([]);
    setCombinedText('');
    setCurrentPageIndex(0);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const ext = file.name.split('.').pop()?.toUpperCase() || (isPdf ? 'PDF' : 'IMAGE');

    setProgress({
      status: 'preparing',
      statusMessage: isPdf ? 'Analyzing PDF pages...' : 'Loading image...',
      currentPage: 0,
      totalPages: 1,
      percent: 15,
    });

    try {
      let loadedPages: DocumentPage[] = [];

      if (isPdf) {
        loadedPages = await processPdfFile(file, (current, total) => {
          setProgress({
            status: 'preparing',
            statusMessage: `Rendering PDF page ${current} of ${total}...`,
            currentPage: current,
            totalPages: total,
            percent: Math.round((current / total) * 40),
          });
        });
      } else {
        loadedPages = await processImageFile(file);
      }

      setFileMetadata({
        name: file.name,
        size: file.size,
        type: ext,
        totalPages: loadedPages.length,
      });

      setPages(loadedPages);
      setProgress({
        status: 'file_selected',
        statusMessage: `File loaded (${loadedPages.length} page${loadedPages.length > 1 ? 's' : ''}). Click Start OCR.`,
        currentPage: 0,
        totalPages: loadedPages.length,
        percent: 0,
      });
      message.success(`Loaded ${file.name} successfully!`);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Failed to load document.';
      setProgress({
        status: 'failed',
        statusMessage: errMsg,
        currentPage: 0,
        totalPages: 0,
        percent: 0,
      });
      message.error(errMsg);
    }
  };

  // Remove file
  const handleFileRemove = () => {
    cleanupPages(pages);
    setPages([]);
    setFileMetadata(null);
    setCombinedText('');
    setCurrentPageIndex(0);
    setProgress({
      status: 'idle',
      statusMessage: 'Ready to process',
      currentPage: 0,
      totalPages: 0,
      percent: 0,
    });
  };

  // Run OCR
  const handleStartOCR = async () => {
    if (pages.length === 0) return;

    abortControllerRef.current = new AbortController();

    try {
      const updatedPages = await runDocumentOCR(pages, {
        language,
        orientationMode,
        signal: abortControllerRef.current.signal,
        onProgress: (progressState) => {
          setProgress(progressState);
        },
      });

      setPages(updatedPages);
      syncCombinedText(updatedPages);
      message.success('OCR recognition completed successfully!');
    } catch (err: unknown) {
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      if (isAbort) {
        setProgress({
          status: 'cancelled',
          statusMessage: 'OCR recognition cancelled.',
          currentPage: 0,
          totalPages: pages.length,
          percent: 0,
        });
        message.info('OCR process cancelled.');
      } else {
        console.error('OCR Error:', err);
        const errMsg = err instanceof Error ? err.message : 'OCR recognition failed.';
        setProgress({
          status: 'failed',
          statusMessage: errMsg,
          currentPage: 0,
          totalPages: pages.length,
          percent: 0,
        });
        message.error('OCR recognition failed. Please try again.');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Cancel OCR
  const handleCancelOCR = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Download exported document
  const handleDownload = () => {
    if (!fileMetadata || pages.length === 0) return;
    try {
      exportDocument(outputFormat, pages, fileMetadata.name);
      message.success(`Downloaded as ${outputFormat.toUpperCase()} successfully!`);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Export failed.';
      message.error(errMsg);
    }
  };

  // Reset session
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    handleFileRemove();
  };

  // Update text from basic text editor
  const handleBasicTextChange = (newText: string) => {
    setCombinedText(newText);
    if (pages.length === 1) {
      const updated = [...pages];
      if (updated[0]) {
        updated[0] = {
          ...updated[0],
          ocrResult: {
            text: newText,
            confidence: updated[0].ocrResult?.confidence ?? 100,
            lines: updated[0].ocrResult?.lines ?? [],
            words: updated[0].ocrResult?.words ?? [],
            pdfBytes: updated[0].ocrResult?.pdfBytes,
          },
        };
        setPages(updated);
      }
    }
  };

  // Update text from per-page advanced text editor
  const handlePageTextChange = (pageIndex: number, newPageText: string) => {
    const updated = [...pages];
    if (updated[pageIndex]) {
      updated[pageIndex] = {
        ...updated[pageIndex],
        ocrResult: {
          text: newPageText,
          confidence: updated[pageIndex].ocrResult?.confidence ?? 100,
          lines: updated[pageIndex].ocrResult?.lines ?? [],
          words: updated[pageIndex].ocrResult?.words ?? [],
          pdfBytes: updated[pageIndex].ocrResult?.pdfBytes,
        },
      };
      setPages(updated);
      syncCombinedText(updated);
    }
  };

  const hasResults = pages.some((p) => p.ocrResult && p.ocrResult.text.length > 0);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} className="!mb-1 !text-gray-100">
            OCR Document & Text Extraction
          </Title>
          <Paragraph className="!mb-0 text-gray-400">
            Upload images or PDF documents to extract multilingual text locally using high-accuracy open-source OCR.
          </Paragraph>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Left Sidebar + Right Content) */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[640px]">
        {/* Left Sidebar */}
        <OCRConfigSidebar
          mode={mode}
          onModeChange={handleModeChange}
          language={language}
          onLanguageChange={setLanguage}
          orientationMode={orientationMode}
          onOrientationModeChange={setOrientationMode}
          outputFormat={outputFormat}
          onOutputFormatChange={setOutputFormat}
          fileMetadata={fileMetadata}
          status={progress.status}
          hasResults={hasResults}
          onStartOCR={handleStartOCR}
          onCancelOCR={handleCancelOCR}
          onDownload={handleDownload}
          onReset={handleReset}
        />

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* File Upload Zone */}
          <OCRUploadArea
            fileMetadata={fileMetadata}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={
              progress.status === 'processing' ||
              progress.status === 'loading_engine' ||
              progress.status === 'preparing'
            }
          />

          {/* Progress Indicator */}
          <OCRProgressBar progress={progress} onCancel={handleCancelOCR} />

          {/* OCR Result Preview Area */}
          <div className="flex-1 min-h-[440px]">
            {mode === 'basic' ? (
              <OCRBasicPreview
                pages={pages}
                combinedText={combinedText}
                onTextChange={handleBasicTextChange}
              />
            ) : (
              <OCRAdvancedPreview
                pages={pages}
                currentPageIndex={currentPageIndex}
                onPageChange={setCurrentPageIndex}
                onPageTextChange={handlePageTextChange}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
