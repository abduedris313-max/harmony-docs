export interface ConversionOptions {
  preserveLayout: boolean;
  extractTables: boolean;
  extractImagesDesc: boolean;
  mathLatex: boolean;
  cleanHeadersFooters: boolean;
  pageRange: string;
  languageHint?: string;
}

export interface DocumentStats {
  wordCount: number;
  charCount: number;
  lineCount: number;
  readingTimeMinutes: number;
}

export interface HistoryItem {
  id: string;
  filename: string;
  timestamp: number;
  markdown: string;
  fileSizeBytes: number;
  wordCount: number;
  pdfDataUrl?: string;
}

export type ViewMode = 'split' | 'editor' | 'preview' | 'compare';

export type ExportFormat = 'md' | 'txt' | 'html' | 'pdf';

export type AiAction = 'summarize' | 'grammar' | 'format_tables' | 'extract_action_items' | 'translate' | 'custom';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

// Version History Snapshots
export interface VersionSnapshot {
  id: string;
  label: string;
  timestamp: number;
  markdown: string;
  wordCount: number;
  charCount: number;
  isAutoSave?: boolean;
}

// Cloud Storage Services (Google Drive & Dropbox)
export type CloudProvider = 'google-drive' | 'dropbox';

export interface CloudAccount {
  provider: CloudProvider;
  connected: boolean;
  accountName?: string;
  accountEmail?: string;
  avatarUrl?: string;
  usedStorageMb?: number;
  totalStorageMb?: number;
}

export interface CloudFile {
  id: string;
  name: string;
  provider: CloudProvider;
  type: 'pdf' | 'md' | 'folder' | 'txt';
  sizeBytes: number;
  updatedAt: number;
  path: string;
  content?: string;
  pdfDataUrl?: string;
}

// Book Library & Personal Collection Types
export type BookSource = 'local' | 'cloud' | 'online';

export type BookShelf = 'Currently Reading' | 'To Read' | 'Completed' | 'Favorites' | 'Technical' | 'Classics';

export interface Bookmark {
  id: string;
  bookId: string;
  chapterOrSection: string;
  note: string;
  timestamp: number;
  progressPercent: number;
  quote?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  source: BookSource;
  category: string;
  shelf: BookShelf;
  content: string;
  coverColor: string;
  coverImageUrl?: string;
  rating?: number; // 1 to 5 stars
  progressPercent: number; // 0 to 100
  lastReadTimestamp: number;
  tags: string[];
  wordCount: number;
  description?: string;
  fileFormat?: 'md' | 'epub' | 'pdf' | 'txt' | 'docx';
  cloudProvider?: CloudProvider;
  isFavorite?: boolean;
  bookmarks: Bookmark[];
  folderId?: string; // Local folder organization
  fileSizeBytes?: number;
  localPath?: string;
  pdfDataUrl?: string;
}

// Local Document Folder Organization
export interface DocumentFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  createdAt: number;
  parentId?: string;
}

// Directory Scanner Item
export interface DirectoryScanItem {
  id: string;
  name: string;
  relativePath: string;
  sizeBytes: number;
  fileFormat: 'pdf' | 'md' | 'txt' | 'epub';
  lastModified: number;
  file?: File;
  selected: boolean;
  status: 'pending' | 'imported' | 'failed';
}

// Full Library Offline Backup & Restore Schema
export interface LibraryBackup {
  version: string;
  exportedAt: number;
  books: Book[];
  folders: DocumentFolder[];
  history: HistoryItem[];
  snapshots: VersionSnapshot[];
}


