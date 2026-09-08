import { Radio, Select, Button, Typography, Card, Tag, Divider } from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  DownloadOutlined,
  ClearOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type {
  OCRMode,
  OCRLanguage,
  PageSegMode,
  OutputFormat,
  FileMetadata,
  ProcessingStatus,
} from '../../types/ocr';

const { Text, Paragraph } = Typography;
const { Option } = Select;

interface OCRConfigSidebarProps {
  mode: OCRMode;
  onModeChange: (mode: OCRMode) => void;
  language: OCRLanguage;
  onLanguageChange: (lang: OCRLanguage) => void;
  orientationMode: PageSegMode;
  onOrientationModeChange: (mode: PageSegMode) => void;
  outputFormat: OutputFormat;
  onOutputFormatChange: (fmt: OutputFormat) => void;
  fileMetadata: FileMetadata | null;
  status: ProcessingStatus;
  hasResults: boolean;
  onStartOCR: () => void;
  onCancelOCR: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function OCRConfigSidebar({
  mode,
  onModeChange,
  language,
  onLanguageChange,
  orientationMode,
  onOrientationModeChange,
  outputFormat,
  onOutputFormatChange,
  fileMetadata,
  status,
  hasResults,
  onStartOCR,
  onCancelOCR,
  onDownload,
  onReset,
}: OCRConfigSidebarProps) {
  const isProcessing = status === 'processing' || status === 'loading_engine' || status === 'preparing';

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
      {/* Settings Card */}
      <Card
        className="shadow-xl border-gray-800 bg-[#141414]"
        title={
          <span className="flex items-center gap-2 text-gray-200">
            <SettingOutlined className="text-indigo-400" />
            <span>OCR Settings</span>
          </span>
        }
        styles={{ body: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' } }}
      >
        {/* Mode Selector */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            OCR Processing Mode
          </div>
          <Radio.Group
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            disabled={isProcessing}
            className="w-full flex"
            buttonStyle="solid"
          >
            <Radio.Button value="basic" className="flex-1 text-center font-medium">
              Basic OCR
            </Radio.Button>
            <Radio.Button value="advanced" className="flex-1 text-center font-medium">
              Advanced OCR
            </Radio.Button>
          </Radio.Group>
          <div className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            {mode === 'basic'
              ? 'Fast plain text extraction with copy & text download.'
              : 'Layout bounding boxes, document overlay preview & rich exports (PDF, Word, HTML).'}
          </div>
        </div>

        <Divider className="my-0 border-gray-800" />

        {/* Language Selector */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Recognition Language
          </div>
          <Select
            value={language}
            onChange={onLanguageChange}
            disabled={isProcessing}
            className="w-full"
            aria-label="Recognition Language"
          >
            <Option value="chi_tra+eng">Traditional Chinese + English (繁體中文 + EN)</Option>
            <Option value="chi_sim+eng">Simplified Chinese + English (簡體中文 + EN)</Option>
            <Option value="eng">English Only</Option>
            <Option value="chi_tra">Traditional Chinese Only (繁體中文)</Option>
            <Option value="chi_sim">Simplified Chinese Only (簡體中文)</Option>
            <Option value="jpn">Japanese (日本語)</Option>
            <Option value="kor">Korean (한국어)</Option>
          </Select>
        </div>

        {/* Text Orientation / PSM */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Page Layout Detection
          </div>
          <Radio.Group
            value={orientationMode}
            onChange={(e) => onOrientationModeChange(e.target.value)}
            disabled={isProcessing}
            className="w-full flex"
          >
            <Radio.Button value={3} className="flex-1 text-center text-xs">
              Auto
            </Radio.Button>
            <Radio.Button value={6} className="flex-1 text-center text-xs">
              Horizontal
            </Radio.Button>
            <Radio.Button value={5} className="flex-1 text-center text-xs">
              Vertical
            </Radio.Button>
          </Radio.Group>
        </div>

        <Divider className="my-0 border-gray-800" />

        {/* Output Format Selector */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Output Format
          </div>
          <Select
            value={outputFormat}
            onChange={onOutputFormatChange}
            disabled={isProcessing}
            className="w-full"
            aria-label="Output Format"
          >
            <Option value="txt">Plain Text (.txt)</Option>
            <Option value="md">Markdown (.md)</Option>
            <Option value="pdf">PDF Document (.pdf)</Option>
            <Option value="docx">Word Document (.docx)</Option>
            <Option value="html">Web Page (.html)</Option>
          </Select>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          {!isProcessing ? (
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={onStartOCR}
              disabled={!fileMetadata}
              className="w-full bg-indigo-600 hover:bg-indigo-500 border-none font-medium"
            >
              Start OCR Recognition
            </Button>
          ) : (
            <Button
              danger
              size="large"
              icon={<StopOutlined />}
              onClick={onCancelOCR}
              className="w-full font-medium"
            >
              Cancel Recognition
            </Button>
          )}

          <Button
            type="default"
            size="large"
            icon={<DownloadOutlined />}
            onClick={onDownload}
            disabled={!hasResults || isProcessing}
            className="w-full border-gray-700 hover:border-indigo-400 font-medium"
          >
            Download {outputFormat.toUpperCase()}
          </Button>

          <Button
            type="text"
            icon={<ClearOutlined />}
            onClick={onReset}
            disabled={isProcessing || (!fileMetadata && !hasResults)}
            className="w-full text-gray-400 hover:text-gray-200"
          >
            Reset Session
          </Button>
        </div>
      </Card>

      {/* Document Metadata Card */}
      {fileMetadata && (
        <Card
          className="shadow-xl border-gray-800 bg-[#141414]"
          title={
            <span className="flex items-center gap-2 text-gray-200 text-sm">
              <FileTextOutlined className="text-indigo-400" />
              <span>Document Info</span>
            </span>
          }
          styles={{ body: { padding: '16px' } }}
        >
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">File Name:</span>
              <span className="text-gray-200 font-medium truncate max-w-[160px]" title={fileMetadata.name}>
                {fileMetadata.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">File Size:</span>
              <span className="text-gray-200">{formatFileSize(fileMetadata.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Format:</span>
              <span className="text-gray-200 uppercase">{fileMetadata.type || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pages:</span>
              <span className="text-gray-200 font-semibold">{fileMetadata.totalPages}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-gray-800">
              <span className="text-gray-400">Status:</span>
              <Tag
                color={
                  status === 'completed'
                    ? 'success'
                    : status === 'processing' || status === 'loading_engine'
                    ? 'processing'
                    : status === 'failed'
                    ? 'error'
                    : 'default'
                }
                className="capitalize"
              >
                {status.replace('_', ' ')}
              </Tag>
            </div>
          </div>
        </Card>
      )}

      {/* Privacy Guarantee & Formats Card */}
      <Card className="shadow-lg border-gray-800 bg-[#141414]" styles={{ body: { padding: '14px' } }}>
        <div className="flex items-start gap-2.5">
          <SafetyCertificateOutlined className="text-emerald-400 text-base mt-0.5 flex-shrink-0" />
          <div>
            <Text className="text-xs font-semibold text-gray-200 block mb-1">
              100% Local & Private Processing
            </Text>
            <Paragraph className="text-xs !mb-0 text-gray-400 leading-relaxed">
              Files and recognized text are processed strictly inside your browser using Tesseract.js.
              No document data is ever uploaded to external servers.
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );
}
