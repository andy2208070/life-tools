import { Progress, Button } from 'antd';
import { StopOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { OCRProgressState } from '../../types/ocr';
interface OCRProgressBarProps {
  progress: OCRProgressState;
  onCancel: () => void;
}

export default function OCRProgressBar({ progress, onCancel }: OCRProgressBarProps) {
  const isRunning =
    progress.status === 'processing' ||
    progress.status === 'loading_engine' ||
    progress.status === 'preparing';

  if (progress.status === 'idle' || progress.status === 'file_selected') {
    return null;
  }

  const getStatusIcon = () => {
    if (isRunning) return <LoadingOutlined className="text-indigo-400 animate-spin mr-2" />;
    if (progress.status === 'completed') return <CheckCircleOutlined className="text-emerald-400 mr-2" />;
    if (progress.status === 'failed' || progress.status === 'cancelled') {
      return <CloseCircleOutlined className="text-red-400 mr-2" />;
    }
    return null;
  };

  return (
    <div className="bg-[#191919] border border-gray-800 rounded-xl p-4 shadow-lg flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm font-medium text-gray-200">
          {getStatusIcon()}
          <span>{progress.statusMessage}</span>
        </div>

        {isRunning && (
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={onCancel}
            className="text-xs"
          >
            Cancel
          </Button>
        )}
      </div>

      <Progress
        percent={progress.percent}
        status={
          progress.status === 'failed'
            ? 'exception'
            : progress.status === 'completed'
            ? 'success'
            : 'active'
        }
        strokeColor={
          progress.status === 'completed'
            ? '#10b981'
            : progress.status === 'failed'
            ? '#ef4444'
            : '#6366f1'
        }
        trailColor="#262626"
      />

      {progress.totalPages > 1 && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>
            Page {progress.currentPage} of {progress.totalPages}
          </span>
          <span>{progress.percent}% overall</span>
        </div>
      )}
    </div>
  );
}
