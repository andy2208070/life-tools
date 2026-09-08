export type OCRMode = 'basic' | 'advanced';

export type OCRLanguage =
  | 'chi_tra+eng'
  | 'chi_sim+eng'
  | 'eng'
  | 'chi_tra'
  | 'chi_sim'
  | 'jpn'
  | 'kor';

export type PageSegMode = 3 | 6 | 5; // 3: Auto, 6: Single uniform block (horizontal), 5: Vertical

export type OutputFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'html';

export type ProcessingStatus =
  | 'idle'
  | 'file_selected'
  | 'preparing'
  | 'loading_engine'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'failed';

export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words?: OCRWord[];
}

export interface PageOCRResult {
  text: string;
  confidence: number;
  lines: OCRLine[];
  words: OCRWord[];
  pdfBytes?: number[];
}

export interface DocumentPage {
  pageNumber: number;
  imageUrl: string;
  width: number;
  height: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  ocrResult?: PageOCRResult;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  totalPages: number;
}

export interface OCRProgressState {
  status: ProcessingStatus;
  statusMessage: string;
  currentPage: number;
  totalPages: number;
  percent: number;
}
