import { useState } from 'react';
import { Card, Button, Typography, message, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined, EditOutlined } from '@ant-design/icons';
import type { DocumentPage } from '../../types/ocr';

const { Text } = Typography;

interface OCRBasicPreviewProps {
  pages: DocumentPage[];
  combinedText: string;
  onTextChange: (newText: string) => void;
}

export default function OCRBasicPreview({
  pages,
  combinedText,
  onTextChange,
}: OCRBasicPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!combinedText) return;
    try {
      await navigator.clipboard.writeText(combinedText);
      setCopied(true);
      message.success('Recognized text copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      message.error('Failed to copy to clipboard.');
    }
  };

  const charCount = combinedText.length;
  const wordCount = combinedText.trim() ? combinedText.trim().split(/\s+/).length : 0;

  return (
    <Card
      className="h-full flex flex-col shadow-xl border-gray-800 bg-[#141414] overflow-hidden"
      title={
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2 text-gray-200 text-sm font-medium">
            <EditOutlined className="text-indigo-400" />
            <span>Extracted Text Editor</span>
          </span>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span>Chars: <strong className="text-gray-200">{charCount}</strong></span>
              <span>&bull;</span>
              <span>Words: <strong className="text-gray-200">{wordCount}</strong></span>
              {pages.length > 1 && (
                <>
                  <span>&bull;</span>
                  <span>Pages: <strong className="text-gray-200">{pages.length}</strong></span>
                </>
              )}
            </div>

            <Tooltip title="Copy extracted text to clipboard">
              <Button
                size="small"
                icon={copied ? <CheckOutlined className="text-emerald-400" /> : <CopyOutlined />}
                onClick={handleCopy}
                disabled={!combinedText}
                className="border-gray-700 hover:border-indigo-400 text-xs"
              >
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </Tooltip>
          </div>
        </div>
      }
      styles={{
        body: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 0,
          height: 'calc(100% - 57px)',
        },
      }}
    >
      {combinedText ? (
        <textarea
          className="w-full h-full bg-[#141414] text-gray-100 p-6 resize-none outline-none border-none font-mono text-sm leading-relaxed focus:bg-[#161616] transition-colors"
          value={combinedText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Recognized text will appear here. You can freely edit the text before downloading."
          aria-label="Recognized OCR text content"
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center mb-3">
            <EditOutlined className="text-gray-600 text-xl" />
          </div>
          <Text className="text-gray-400 font-medium mb-1">No OCR Result Yet</Text>
          <Text className="text-gray-600 text-xs max-w-sm">
            Upload an image or PDF document and click "Start OCR Recognition" to extract editable text.
          </Text>
        </div>
      )}
    </Card>
  );
}
