import { useState, useRef, useEffect } from 'react';
import { Card, Radio, Button, Tooltip, Alert } from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  FileImageOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { DocumentPage, OCRWord } from '../../types/ocr';

interface OCRAdvancedPreviewProps {
  pages: DocumentPage[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  onPageTextChange: (pageIndex: number, newText: string) => void;
}

type AdvancedViewMode = 'overlay' | 'image' | 'text';

export default function OCRAdvancedPreview({
  pages,
  currentPageIndex,
  onPageChange,
  onPageTextChange,
}: OCRAdvancedPreviewProps) {
  const [viewMode, setViewMode] = useState<AdvancedViewMode>('overlay');
  const [hoveredWord, setHoveredWord] = useState<OCRWord | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [renderScale, setRenderScale] = useState({ scaleX: 1, scaleY: 1 });

  const currentPage = pages[currentPageIndex] || null;
  const ocrResult = currentPage?.ocrResult;
  const totalPages = pages.length;

  // Compute image scaling factor for bounding box overlay
  useEffect(() => {
    const updateScale = () => {
      if (imgRef.current && currentPage) {
        const displayedWidth = imgRef.current.clientWidth;
        const displayedHeight = imgRef.current.clientHeight;
        const naturalWidth = currentPage.width || imgRef.current.naturalWidth || displayedWidth;
        const naturalHeight = currentPage.height || imgRef.current.naturalHeight || displayedHeight;

        if (naturalWidth > 0 && naturalHeight > 0) {
          setRenderScale({
            scaleX: displayedWidth / naturalWidth,
            scaleY: displayedHeight / naturalHeight,
          });
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [currentPage, viewMode]);

  if (!currentPage) {
    return (
      <Card className="h-full flex items-center justify-center border-gray-800 bg-[#141414]">
        <div className="text-gray-500 text-center py-12">
          Upload an image or document to preview advanced OCR results.
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="h-full flex flex-col shadow-xl border-gray-800 bg-[#141414] overflow-hidden"
      title={
        <div className="flex flex-wrap items-center justify-between gap-3 w-full py-1">
          {/* View Mode Toggle */}
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="overlay" className="text-xs">
              <span className="flex items-center gap-1.5">
                <EyeOutlined />
                <span>Combined Overlay</span>
              </span>
            </Radio.Button>
            <Radio.Button value="image" className="text-xs">
              <span className="flex items-center gap-1.5">
                <FileImageOutlined />
                <span>Original Image</span>
              </span>
            </Radio.Button>
            <Radio.Button value="text" className="text-xs">
              <span className="flex items-center gap-1.5">
                <EditOutlined />
                <span>Page Text Editor</span>
              </span>
            </Radio.Button>
          </Radio.Group>

          {/* Page Navigation Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                size="small"
                icon={<LeftOutlined />}
                disabled={currentPageIndex <= 0}
                onClick={() => onPageChange(currentPageIndex - 1)}
              />
              <span className="text-xs text-gray-300 font-medium px-1">
                Page {currentPageIndex + 1} / {totalPages}
              </span>
              <Button
                size="small"
                icon={<RightOutlined />}
                disabled={currentPageIndex >= totalPages - 1}
                onClick={() => onPageChange(currentPageIndex + 1)}
              />
            </div>
          )}
        </div>
      }
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 0,
          height: 'calc(100% - 57px)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Notice Banner */}
      <Alert
        message={
          <span className="text-xs text-indigo-300">
            <strong>Advanced Document Reconstruction:</strong> Visual bounding boxes detect and overlay
            recognized text on the original page. While client-side layout preservation aims to match
            document flow, complex non-standard layouts may approximate positioning.
          </span>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined className="text-indigo-400 text-xs" />}
        className="!bg-indigo-950/30 !border-b !border-gray-800 !border-t-0 !border-x-0 !rounded-none !py-1.5 !px-4"
      />

      <div className="flex-1 overflow-auto p-4 bg-[#0d0d0d] flex justify-center items-start">
        {/* VIEW 1: COMBINED OVERLAY */}
        {viewMode === 'overlay' && (
          <div
            ref={containerRef}
            className="relative border border-gray-800 rounded-lg overflow-hidden shadow-2xl bg-black max-w-full"
            style={{ display: 'inline-block' }}
          >
            <img
              ref={imgRef}
              src={currentPage.imageUrl}
              alt={`Page ${currentPage.pageNumber}`}
              onLoad={() => {
                if (imgRef.current && currentPage) {
                  const naturalWidth = currentPage.width || imgRef.current.naturalWidth;
                  const naturalHeight = currentPage.height || imgRef.current.naturalHeight;
                  setRenderScale({
                    scaleX: imgRef.current.clientWidth / naturalWidth,
                    scaleY: imgRef.current.clientHeight / naturalHeight,
                  });
                }
              }}
              className="max-h-[70vh] w-auto object-contain block select-none"
            />

            {/* Bounding box overlays */}
            {ocrResult?.words && ocrResult.words.length > 0 && (
              <div className="absolute inset-0 pointer-events-auto">
                {ocrResult.words.map((word, idx) => {
                  const left = word.bbox.x0 * renderScale.scaleX;
                  const top = word.bbox.y0 * renderScale.scaleY;
                  const width = (word.bbox.x1 - word.bbox.x0) * renderScale.scaleX;
                  const height = (word.bbox.y1 - word.bbox.y0) * renderScale.scaleY;

                  return (
                    <Tooltip
                      key={idx}
                      title={`"${word.text}" (${word.confidence}% conf)`}
                      placement="top"
                    >
                      <div
                        onMouseEnter={() => setHoveredWord(word)}
                        onMouseLeave={() => setHoveredWord(null)}
                        style={{
                          position: 'absolute',
                          left: `${left}px`,
                          top: `${top}px`,
                          width: `${width}px`,
                          height: `${height}px`,
                        }}
                        className={`border rounded-[2px] transition-all cursor-pointer ${
                          hoveredWord === word
                            ? 'bg-indigo-500/40 border-indigo-300 ring-2 ring-indigo-400 z-20'
                            : 'bg-indigo-500/15 border-indigo-400/50 hover:bg-indigo-500/30 z-10'
                        }`}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORIGINAL IMAGE */}
        {viewMode === 'image' && (
          <div className="border border-gray-800 rounded-lg overflow-hidden shadow-2xl bg-black max-w-full">
            <img
              src={currentPage.imageUrl}
              alt={`Page ${currentPage.pageNumber}`}
              className="max-h-[70vh] w-auto object-contain block"
            />
          </div>
        )}

        {/* VIEW 3: STRUCTURED / EDITABLE TEXT */}
        {viewMode === 'text' && (
          <div className="w-full h-full flex flex-col bg-[#141414] rounded-lg border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Editing Page {currentPage.pageNumber} of {totalPages}
              </span>
              {ocrResult?.confidence !== undefined && (
                <span className="text-xs text-gray-400">
                  Page OCR Confidence: <strong className="text-emerald-400">{ocrResult.confidence}%</strong>
                </span>
              )}
            </div>

            <textarea
              className="w-full flex-1 bg-[#181818] text-gray-100 p-4 rounded-lg resize-none outline-none border border-gray-700 font-mono text-sm leading-relaxed focus:border-indigo-500 transition-colors"
              value={ocrResult?.text || ''}
              onChange={(e) => onPageTextChange(currentPageIndex, e.target.value)}
              placeholder="No text recognized on this page. You can manually type or paste notes here."
              aria-label={`OCR text content for page ${currentPage.pageNumber}`}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
