import { useEffect, useCallback } from 'react';
import { Upload, Button, Typography, message } from 'antd';
import { InboxOutlined, DeleteOutlined, FilePdfOutlined, FileImageOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { FileMetadata } from '../../types/ocr';

const { Dragger } = Upload;
const { Text } = Typography;

interface OCRUploadAreaProps {
  fileMetadata: FileMetadata | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  disabled?: boolean;
}

const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.bmp'];
const MAX_FILE_SIZE_MB = 50;

export default function OCRUploadArea({
  fileMetadata,
  onFileSelect,
  onFileRemove,
  disabled = false,
}: OCRUploadAreaProps) {
  const validateAndSelectFile = useCallback((file: File) => {
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!SUPPORTED_EXTENSIONS.includes(ext) && !file.type.startsWith('image/') && file.type !== 'application/pdf') {
      message.error(`Unsupported file type (${ext}). Please upload a PDF or image file (PNG, JPG, WEBP, BMP).`);
      return false;
    }

    const fileSizeMb = file.size / (1024 * 1024);
    if (fileSizeMb > MAX_FILE_SIZE_MB) {
      message.error(`File size exceeds limit (${fileSizeMb.toFixed(1)}MB > ${MAX_FILE_SIZE_MB}MB).`);
      return false;
    }

    onFileSelect(file);
    return false; // Prevent automatic antd network upload
  }, [onFileSelect]);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    accept: '.pdf,image/png,image/jpeg,image/webp,image/bmp',
    disabled,
    beforeUpload: (file) => validateAndSelectFile(file as File),
  };

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const pastedFile = new File([blob], `pasted-image-${Date.now()}.png`, {
              type: blob.type || 'image/png',
            });
            validateAndSelectFile(pastedFile);
            message.success('Image pasted from clipboard successfully!');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
  }, [disabled, validateAndSelectFile]);

  if (fileMetadata) {
    const isPdf = fileMetadata.name.toLowerCase().endsWith('.pdf');
    return (
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 text-xl flex-shrink-0">
            {isPdf ? <FilePdfOutlined /> : <FileImageOutlined />}
          </div>
          <div className="min-w-0">
            <div className="text-gray-200 font-medium text-sm truncate max-w-sm" title={fileMetadata.name}>
              {fileMetadata.name}
            </div>
            <div className="text-xs text-gray-400">
              {fileMetadata.totalPages} page{fileMetadata.totalPages > 1 ? 's' : ''} &bull;{' '}
              {(fileMetadata.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>
        </div>

        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={onFileRemove}
          disabled={disabled}
          title="Remove file"
          className="hover:bg-red-500/10"
        >
          Remove
        </Button>
      </div>
    );
  }

  return (
    <Dragger
      {...uploadProps}
      className="bg-[#141414] border-gray-700 hover:border-indigo-500 transition-colors p-6 rounded-xl block"
    >
      <p className="ant-upload-drag-icon !mb-3">
        <InboxOutlined className="text-indigo-400 text-4xl" />
      </p>
      <p className="ant-upload-text text-gray-200 font-medium text-base !mb-1">
        Click or drag file to this area to upload
      </p>
      <p className="ant-upload-hint text-gray-400 text-xs !mb-2">
        Supports multi-page PDF documents & image formats (PNG, JPG, JPEG, WEBP, BMP).
      </p>
      <Text className="text-xs text-indigo-400 bg-indigo-950/40 border border-indigo-800/40 px-2.5 py-1 rounded-full inline-block">
        💡 Tip: You can also paste an image directly from your clipboard with Ctrl + V
      </Text>
    </Dragger>
  );
}
