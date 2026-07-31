import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PdfUploader } from './components/PdfUploader';
import { MarkdownEditor } from './components/MarkdownEditor';
import { HistoryDrawer } from './components/HistoryDrawer';
import { VersionHistoryDrawer } from './components/VersionHistoryDrawer';
import { CloudStorageModal } from './components/CloudStorageModal';
import { ConversionSettingsModal } from './components/ConversionSettingsModal';
import { BookLibraryModal } from './components/BookLibraryModal';
import { BookReaderModal } from './components/BookReaderModal';
import { ToastContainer } from './components/Toast';
import { ConversionOptions, HistoryItem, ToastMessage, AiAction, VersionSnapshot, Book, Bookmark, BookShelf } from './types';
import { SAMPLE_PDFS, SamplePdf } from './data/samplePdfs';
import { INITIAL_BOOKS } from './data/sampleBooks';

const STORAGE_KEY = 'pdf_to_md_history_v1';
const SNAPSHOTS_KEY = 'pdf_to_md_snapshots_v1';
const AUTOSAVE_KEY = 'pdf_to_md_autosave_v1';
const BOOKS_KEY = 'pdf_to_md_books_v1';

export default function App() {
  const [activeMarkdown, setActiveMarkdown] = useState<string>('');
  const [activeFilename, setActiveFilename] = useState<string>('');
  const [activePdfDataUrl, setActivePdfDataUrl] = useState<string | undefined>(undefined);

  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number | null>(null);

  // Book Library State
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKS_KEY);
      return saved ? JSON.parse(saved) : INITIAL_BOOKS;
    } catch {
      return INITIAL_BOOKS;
    }
  });

  const [isBookLibraryOpen, setIsBookLibraryOpen] = useState<boolean>(false);
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);

  // Persist Books to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    } catch (e) {
      console.warn('Failed to save books to localStorage:', e);
    }
  }, [books]);

  // Restore auto-saved draft on initial mount if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.markdown && parsed.markdown.trim()) {
          setActiveMarkdown(parsed.markdown);
          setActiveFilename(parsed.filename || 'Auto-saved Draft.md');
          setLastAutoSaveTime(parsed.timestamp || Date.now());
        }
      }
    } catch (e) {
      console.warn('Failed to restore auto-saved draft:', e);
    }
  }, []);

  // 30-second Auto-Save mechanism
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeMarkdown && activeMarkdown.trim()) {
        try {
          const now = Date.now();
          const autoSaveData = {
            markdown: activeMarkdown,
            filename: activeFilename,
            timestamp: now,
          };
          localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSaveData));
          setLastAutoSaveTime(now);
        } catch (e) {
          console.warn('Auto-save failed:', e);
        }
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [activeMarkdown, activeFilename]);

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [conversionProgress, setConversionProgress] = useState<string>('');
  const [conversionError, setConversionError] = useState<string | null>(null);

  const [isRefining, setIsRefining] = useState<boolean>(false);

  const [options, setOptions] = useState<ConversionOptions>({
    preserveLayout: true,
    extractTables: true,
    extractImagesDesc: true,
    mathLatex: true,
    cleanHeadersFooters: true,
    pageRange: 'All',
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [snapshots, setSnapshots] = useState<VersionSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Save history & snapshots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history to localStorage:', e);
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Failed to save snapshots to localStorage:', e);
    }
  }, [snapshots]);

  // Toast Notification helper
  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Take Snapshot function
  const handleTakeSnapshot = (customLabel?: string, isAutoSave: boolean = false) => {
    if (!activeMarkdown.trim()) return;

    const trimmed = activeMarkdown.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const charCount = activeMarkdown.length;

    const newSnapshot: VersionSnapshot = {
      id: `snap-${Date.now()}`,
      label: customLabel || `Version ${snapshots.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      timestamp: Date.now(),
      markdown: activeMarkdown,
      wordCount,
      charCount,
      isAutoSave,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);
  };

  // Convert uploaded PDF file
  const handleConvertPdf = async (file: File, opts: ConversionOptions) => {
    setIsConverting(true);
    setConversionError(null);
    setConversionProgress('Reading PDF file...');

    try {
      // 1. Convert File to Base64 & create Object URL for side-by-side preview
      const pdfDataUrl = URL.createObjectURL(file);
      setActivePdfDataUrl(pdfDataUrl);

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const pdfBase64 = btoa(binary);

      setConversionProgress('Parsing document layout & extracting text streams...');

      // 2. Call backend conversion endpoint
      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64,
          options: opts,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to convert PDF document.');
      }

      const markdown = data.markdown || '';
      setActiveMarkdown(markdown);
      setActiveFilename(file.name);

      // Save to History
      const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        filename: file.name,
        timestamp: Date.now(),
        markdown,
        fileSizeBytes: file.size,
        wordCount,
        pdfDataUrl,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      showToast('Conversion Successful!', `${file.name} converted to Markdown`);

      // Auto Snapshot
      const newSnap: VersionSnapshot = {
        id: `snap-${Date.now()}`,
        label: `Initial PDF Import: ${file.name}`,
        timestamp: Date.now(),
        markdown,
        wordCount,
        charCount: markdown.length,
        isAutoSave: true,
      };
      setSnapshots((prev) => [newSnap, ...prev]);

    } catch (err: any) {
      console.error('Conversion failed:', err);
      setConversionError(err.message || 'An unexpected error occurred during conversion.');
      showToast('Conversion Failed', err.message || 'Error processing PDF', 'error');
    } finally {
      setIsConverting(false);
      setConversionProgress('');
    }
  };

  // Convert Sample PDF
  const handleConvertSample = async (sample: SamplePdf, opts: ConversionOptions) => {
    setIsConverting(true);
    setConversionError(null);
    setConversionProgress(`Converting ${sample.title}...`);

    try {
      const response = await fetch('/api/convert-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: sample.base64,
          options: opts,
        }),
      });

      const data = await response.json();

      let markdown = '';
      if (response.ok && data.success && data.markdown) {
        markdown = data.markdown;
      } else {
        markdown = sample.sampleMarkdown;
      }

      setActiveMarkdown(markdown);
      setActiveFilename(`${sample.id}.pdf`);
      setActivePdfDataUrl(undefined);

      const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length;
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        filename: `${sample.id}.pdf`,
        timestamp: Date.now(),
        markdown,
        fileSizeBytes: 245000,
        wordCount,
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      showToast('Sample Loaded', `${sample.title} ready for editing`);

      // Auto Snapshot
      const newSnap: VersionSnapshot = {
        id: `snap-${Date.now()}`,
        label: `Sample PDF: ${sample.title}`,
        timestamp: Date.now(),
        markdown,
        wordCount,
        charCount: markdown.length,
        isAutoSave: true,
      };
      setSnapshots((prev) => [newSnap, ...prev]);
    } catch (err: any) {
      setActiveMarkdown(sample.sampleMarkdown);
      setActiveFilename(`${sample.id}.pdf`);
      showToast('Sample Loaded', `${sample.title} ready for editing`);
    } finally {
      setIsConverting(false);
      setConversionProgress('');
    }
  };

  // Refine Markdown using AI
  const handleRefineMarkdown = async (action: AiAction, customPrompt?: string, targetLanguage?: string) => {
    if (!activeMarkdown.trim()) return;

    // Save pre-refinement snapshot
    handleTakeSnapshot(`Before AI Action: ${action}`, true);

    setIsRefining(true);
    try {
      const response = await fetch('/api/refine-markdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markdown: activeMarkdown,
          action,
          customPrompt,
          targetLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to refine Markdown.');
      }

      const refined = data.refinedMarkdown;
      setActiveMarkdown(refined);
      showToast('AI Refinement Applied!', 'Markdown content updated');

      // Save post-refinement snapshot
      const wordCount = refined.trim().split(/\s+/).filter(Boolean).length;
      const postSnap: VersionSnapshot = {
        id: `snap-${Date.now()}`,
        label: `After AI Action: ${action}`,
        timestamp: Date.now(),
        markdown: refined,
        wordCount,
        charCount: refined.length,
        isAutoSave: true,
      };
      setSnapshots((prev) => [postSnap, ...prev]);

    } catch (err: any) {
      showToast('Refinement Error', err.message || 'Failed to refine document', 'error');
    } finally {
      setIsRefining(false);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setActiveMarkdown(item.markdown);
    setActiveFilename(item.filename);
    setActivePdfDataUrl(item.pdfDataUrl);
    showToast('Loaded Document', item.filename);
  };

  const handleRestoreSnapshot = (snap: VersionSnapshot) => {
    setActiveMarkdown(snap.markdown);
    showToast('Document Restored', `Reverted to snapshot: "${snap.label}"`);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    showToast('Snapshot Removed', 'Version entry deleted');
  };

  const handleClearAllSnapshots = () => {
    if (window.confirm('Clear all historical document snapshots?')) {
      setSnapshots([]);
      showToast('Snapshots Cleared');
    }
  };

  const handleLoadPdfFromCloud = async (pdfDataUrl: string, filename: string) => {
    setActiveFilename(filename);
    setActivePdfDataUrl(pdfDataUrl || undefined);
    // Trigger conversion
    if (pdfDataUrl && pdfDataUrl.startsWith('data:')) {
      // Extract base64
      const base64 = pdfDataUrl.split(',')[1];
      setIsConverting(true);
      setConversionProgress(`Converting ${filename} from Cloud...`);
      try {
        const response = await fetch('/api/convert-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64: base64, options }),
        });
        const data = await response.json();
        if (data.success && data.markdown) {
          setActiveMarkdown(data.markdown);
          showToast('Cloud PDF Converted', filename);
        }
      } catch (err) {
        showToast('Error Converting Cloud PDF', 'Using sample text fallback', 'error');
      } finally {
        setIsConverting(false);
        setConversionProgress('');
      }
    } else {
      // Sample conversion fallback
      handleConvertSample(SAMPLE_PDFS[0], options);
    }
  };

  const handleLoadMarkdownFromCloud = (markdownContent: string, filename: string) => {
    setActiveMarkdown(markdownContent);
    setActiveFilename(filename);
    setActivePdfDataUrl(undefined);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all saved conversion history?')) {
      setHistory([]);
      showToast('History Cleared');
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleNewDocument = () => {
    if (activeMarkdown && window.confirm('Start a new document? Unsaved changes in current document will be cleared.')) {
      setActiveMarkdown('');
      setActiveFilename('');
      setActivePdfDataUrl(undefined);
    } else if (!activeMarkdown) {
      setActiveMarkdown('');
      setActiveFilename('');
      setActivePdfDataUrl(undefined);
    }
  };

  // Book Library Handlers
  const handleImportBook = (newBookPartial: Partial<Book>) => {
    const fullBook: Book = {
      id: `book-${Date.now()}`,
      title: newBookPartial.title || 'Untitled Book',
      author: newBookPartial.author || 'Unknown Author',
      source: newBookPartial.source || 'local',
      category: newBookPartial.category || 'General',
      shelf: newBookPartial.shelf || 'To Read',
      content: newBookPartial.content || '',
      coverColor: newBookPartial.coverColor || 'from-[#007AFF] to-indigo-900',
      coverImageUrl: newBookPartial.coverImageUrl,
      rating: newBookPartial.rating || 5,
      progressPercent: newBookPartial.progressPercent || 0,
      lastReadTimestamp: Date.now(),
      tags: newBookPartial.tags || ['Personal'],
      wordCount: newBookPartial.wordCount || 100,
      description: newBookPartial.description,
      fileFormat: newBookPartial.fileFormat || 'md',
      isFavorite: newBookPartial.isFavorite || false,
      bookmarks: newBookPartial.bookmarks || [],
    };

    setBooks((prev) => [fullBook, ...prev]);
  };

  const handleDeleteBook = (bookId: string) => {
    if (window.confirm('Remove this book from your library collection?')) {
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
      showToast('Book Deleted', 'Removed book from collection');
    }
  };

  const handleToggleFavoriteBook = (bookId: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isFavorite: !b.isFavorite } : b))
    );
  };

  const handleUpdateBookShelf = (bookId: string, shelf: BookShelf) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, shelf } : b))
    );
    showToast('Shelf Updated', `Book moved to "${shelf}"`);
  };

  const handleUpdateBookProgress = (
    bookId: string,
    progressPercent: number,
    bookmarks: Bookmark[],
    rating?: number
  ) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              progressPercent,
              bookmarks,
              rating: rating !== undefined ? rating : b.rating,
              lastReadTimestamp: Date.now(),
            }
          : b
      )
    );
  };

  const handleOpenBookInEditor = (book: Book) => {
    setActiveMarkdown(book.content);
    setActiveFilename(`${book.title}.md`);
    setActivePdfDataUrl(undefined);
    showToast('Loaded in Editor', `Opened "${book.title}" in workspace editor`);
  };

  const handleExportBookmarksToMarkdown = (markdownNotes: string) => {
    setActiveMarkdown(markdownNotes);
    setActiveFilename('Reading_Notes_Study_Guide.md');
    setActivePdfDataUrl(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenVersionHistory={() => setIsVersionHistoryOpen(true)}
        onOpenCloudStorage={() => setIsCloudModalOpen(true)}
        onOpenBookLibrary={() => setIsBookLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewDocument={handleNewDocument}
        onLoadSample={() => handleConvertSample(SAMPLE_PDFS[0], options)}
        historyCount={history.length}
        versionCount={snapshots.length}
        booksCount={books.length}
        hasActiveDoc={Boolean(activeMarkdown)}
        isConverting={isConverting}
        activeMarkdown={activeMarkdown}
        activeFilename={activeFilename}
        onShowToast={showToast}
      />

      {/* Main Body View */}
      <main className="flex-1">
        {activeMarkdown ? (
          <MarkdownEditor
            markdown={activeMarkdown}
            onChangeMarkdown={setActiveMarkdown}
            filename={activeFilename}
            pdfDataUrl={activePdfDataUrl}
            onRefineMarkdown={handleRefineMarkdown}
            isRefining={isRefining}
            onShowToast={showToast}
            lastAutoSaveTime={lastAutoSaveTime}
            onOpenBookLibrary={() => setIsBookLibraryOpen(true)}
          />
        ) : (
          <PdfUploader
            onConvertPdf={handleConvertPdf}
            onConvertSample={handleConvertSample}
            isConverting={isConverting}
            conversionProgress={conversionProgress}
            error={conversionError}
            options={options}
            setOptions={setOptions}
          />
        )}
      </main>

      {/* Book Library Hub Modal */}
      <BookLibraryModal
        isOpen={isBookLibraryOpen}
        onClose={() => setIsBookLibraryOpen(false)}
        books={books}
        onSelectBookToRead={(book) => {
          setActiveReadingBook(book);
          setIsBookLibraryOpen(false);
        }}
        onImportBook={handleImportBook}
        onDeleteBook={handleDeleteBook}
        onToggleFavorite={handleToggleFavoriteBook}
        onUpdateBookShelf={handleUpdateBookShelf}
        onOpenInEditor={(book) => {
          handleOpenBookInEditor(book);
          setIsBookLibraryOpen(false);
        }}
        onExportBookmarksToMarkdown={handleExportBookmarksToMarkdown}
        onShowToast={showToast}
      />

      {/* Fullscreen / Paper Book Reader Modal */}
      {activeReadingBook && (
        <BookReaderModal
          book={activeReadingBook}
          onClose={() => setActiveReadingBook(null)}
          onUpdateBookProgress={handleUpdateBookProgress}
          onOpenInEditor={(book) => {
            handleOpenBookInEditor(book);
            setActiveReadingBook(null);
          }}
          onShowToast={showToast}
        />
      )}

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onClearHistory={handleClearHistory}
        onDeleteHistoryItem={handleDeleteHistoryItem}
      />

      {/* Version History Drawer */}
      <VersionHistoryDrawer
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
        snapshots={snapshots}
        currentMarkdown={activeMarkdown}
        onTakeSnapshot={handleTakeSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        onClearAllSnapshots={handleClearAllSnapshots}
        onShowToast={showToast}
      />

      {/* Cloud Storage Modal */}
      <CloudStorageModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentMarkdown={activeMarkdown}
        currentFilename={activeFilename}
        onLoadPdfFromCloud={handleLoadPdfFromCloud}
        onLoadMarkdownFromCloud={handleLoadMarkdownFromCloud}
        onShowToast={showToast}
      />

      {/* Settings Modal */}
      <ConversionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        options={options}
        setOptions={setOptions}
      />

      {/* Toast System */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
