import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  BookOpen,
  Bookmark as BookmarkIcon,
  Plus,
  Maximize2,
  Minimize2,
  Sliders,
  FileText,
  Edit3,
  Trash2,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Eye,
  Globe,
  Layers,
  Sparkles,
  RefreshCw,
  Search,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Book, Bookmark } from '../types';

if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
}

interface BookReaderModalProps {
  book: Book;
  onClose: () => void;
  onUpdateBookProgress: (bookId: string, progress: number, bookmarks: Bookmark[], rating?: number) => void;
  onOpenInEditor: (book: Book) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book,
  onClose,
  onUpdateBookProgress,
  onOpenInEditor,
  onShowToast,
}) => {
  // Reader View Mode: 'text' (formatted Markdown text) or 'pdf' (Visual PDF Page Canvas)
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>(
    book.pdfDataUrl || book.fileFormat === 'pdf' ? 'pdf' : 'text'
  );

  // Typography & Styling State
  const [fontSize, setFontSize] = useState<number>(17);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark' | 'mint'>('paper');
  const [lineHeight, setLineHeight] = useState<number>(1.7);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);

  // RTL & Text Direction State
  const [textDirection, setTextDirection] = useState<'auto' | 'ltr' | 'rtl'>('auto');

  // PDF Page Canvas Reader State
  const [numPdfPages, setNumPdfPages] = useState<number>(0);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [pdfZoomScale, setPdfZoomScale] = useState<number>(1.2);
  const [pdfRotation, setPdfRotation] = useState<number>(0);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);

  // Bookmarking Form State
  const [newBookmarkNote, setNewBookmarkNote] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [isAddingBookmark, setIsAddingBookmark] = useState<boolean>(false);

  // Local Bookmarks & Progress copy
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(book.bookmarks || []);
  const [progress, setProgress] = useState<number>(book.progressPercent || 0);
  const [rating, setRating] = useState<number>(book.rating || 5);

  const contentRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);

  // Auto-detect RTL languages (Arabic, Hebrew, Persian, Urdu, etc.)
  const isRtlDetected = useMemo(() => {
    const sample = (book.content || '') + ' ' + (book.title || '');
    if (!sample.trim()) return false;
    const rtlCount = (sample.match(/[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const letterCount = (sample.match(/[\p{L}]/gu) || []).length || 1;
    return rtlCount > 5 || rtlCount / letterCount > 0.05;
  }, [book.content, book.title]);

  const activeDirection = useMemo(() => {
    if (textDirection === 'rtl') return 'rtl';
    if (textDirection === 'ltr') return 'ltr';
    return isRtlDetected ? 'rtl' : 'ltr';
  }, [textDirection, isRtlDetected]);

  // Load PDF Document when switching to PDF mode or when pdfDataUrl changes
  useEffect(() => {
    if (viewMode !== 'pdf') return;

    let isMounted = true;
    const loadPdfDoc = async () => {
      if (!book.pdfDataUrl) {
        if (isMounted) {
          setPdfRenderError('No raw PDF data available for visual page rendering. Viewing extracted text instead.');
          setViewMode('text');
        }
        return;
      }

      setIsLoadingPdf(true);
      setPdfRenderError(null);

      try {
        let pdfSource: any;
        if (book.pdfDataUrl.startsWith('data:application/pdf;base64,')) {
          const base64Str = book.pdfDataUrl.split(',')[1];
          const binaryStr = atob(base64Str);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          pdfSource = { data: bytes };
        } else {
          pdfSource = { url: book.pdfDataUrl };
        }

        const pdfjsVersion = pdfjsLib.version || '4.0.379';
        const loadingTask = pdfjsLib.getDocument({
          ...pdfSource,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`,
          useSystemFonts: true,
          disableFontFace: false,
        });

        const loadedDoc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = loadedDoc;
        setNumPdfPages(loadedDoc.numPages);
        
        // Calculate initial page based on progress % if available
        if (progress > 0 && loadedDoc.numPages > 1) {
          const calculatedPage = Math.max(1, Math.min(loadedDoc.numPages, Math.round((progress / 100) * loadedDoc.numPages)));
          setCurrentPdfPage(calculatedPage);
        } else {
          setCurrentPdfPage(1);
        }
        setIsLoadingPdf(false);
      } catch (err: any) {
        console.error('PDF loading error in BookReaderModal:', err);
        if (isMounted) {
          setPdfRenderError('Could not load original PDF visual layout. Defaulting to extracted text mode.');
          setIsLoadingPdf(false);
          setViewMode('text');
        }
      }
    };

    loadPdfDoc();

    return () => {
      isMounted = false;
    };
  }, [viewMode, book.pdfDataUrl]);

  // Render current PDF page on canvas
  useEffect(() => {
    if (viewMode !== 'pdf' || !pdfDocRef.current || currentPdfPage < 1) return;

    let isMounted = true;
    const renderPage = async () => {
      try {
        const page = await pdfDocRef.current.getPage(currentPdfPage);
        if (!isMounted) return;

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: pdfZoomScale, rotation: pdfRotation });
        
        // Adjust devicePixelRatio for crisp high-DPI rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext as any).promise;

        if (isMounted && numPdfPages > 0) {
          const calculatedProgress = Math.round((currentPdfPage / numPdfPages) * 100);
          setProgress(calculatedProgress);
        }
      } catch (err) {
        console.warn('PDF page rendering warning:', err);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [viewMode, currentPdfPage, pdfZoomScale, pdfRotation, numPdfPages]);

  // Sync scroll position in Text Mode to calculate reading progress %
  const handleScroll = () => {
    if (viewMode !== 'text' || !contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;
    const currentProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setProgress(currentProgress);
  };

  // Keyboard Navigation (Arrow Keys for Pages, Esc for Close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (viewMode === 'pdf' && numPdfPages > 1) {
        if (e.key === 'ArrowRight') {
          if (activeDirection === 'rtl') {
            setCurrentPdfPage((prev) => Math.max(1, prev - 1));
          } else {
            setCurrentPdfPage((prev) => Math.min(numPdfPages, prev + 1));
          }
        } else if (e.key === 'ArrowLeft') {
          if (activeDirection === 'rtl') {
            setCurrentPdfPage((prev) => Math.min(numPdfPages, prev + 1));
          } else {
            setCurrentPdfPage((prev) => Math.max(1, prev - 1));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, numPdfPages, activeDirection, onClose]);

  // Auto update progress back to parent state
  useEffect(() => {
    onUpdateBookProgress(book.id, progress, bookmarks, rating);
  }, [progress, bookmarks, rating, book.id]);

  // Text selection handler
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  // Add Bookmark
  const handleAddBookmark = () => {
    const sectionName = viewMode === 'pdf' ? `Page ${currentPdfPage} of ${numPdfPages}` : `Progress at ${progress}%`;
    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      bookId: book.id,
      chapterOrSection: sectionName,
      note: newBookmarkNote.trim() || `Bookmark at ${sectionName}`,
      timestamp: Date.now(),
      progressPercent: progress,
      quote: selectedText || undefined,
    };

    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    setNewBookmarkNote('');
    setSelectedText('');
    setIsAddingBookmark(false);
    onShowToast('Bookmark Saved', `Added bookmark at ${sectionName}`);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    onShowToast('Bookmark Removed');
  };

  const handleJumpToBookmark = (bm: Bookmark) => {
    if (bm.progressPercent !== undefined) {
      setProgress(bm.progressPercent);
      if (viewMode === 'pdf' && numPdfPages > 0) {
        const targetPage = Math.max(1, Math.min(numPdfPages, Math.round((bm.progressPercent / 100) * numPdfPages)));
        setCurrentPdfPage(targetPage);
      }
      onShowToast('Jumped to Bookmark', `Moved to ${bm.chapterOrSection}`);
    }
  };

  const themeClasses = {
    paper: 'bg-[#FAF8F5] text-[#2C2C2A] border-slate-200',
    sepia: 'bg-[#F4ECD8] text-[#5B4636] border-amber-200/60',
    dark: 'bg-[#18181B] text-[#E4E4E7] border-zinc-800',
    mint: 'bg-[#F0F7F4] text-[#224235] border-emerald-200/60',
  };

  const fontClasses = {
    serif: activeDirection === 'rtl' ? 'font-serif' : 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 ${
          themeClasses[readerTheme]
        } ${isFullscreen ? 'max-w-none h-screen rounded-none p-0' : ''}`}
        dir={activeDirection}
      >
        {/* Top Header Controls Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-black/5 flex items-center justify-between shrink-0 bg-black/5">
          <div className="flex items-center space-x-3 truncate mr-2 ltr:mr-2 rtl:ml-2">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${book.coverColor} text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                  {book.title}
                </h2>
                {activeDirection === 'rtl' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold shrink-0">
                    RTL
                  </span>
                )}
              </div>
              <p className="text-xs opacity-70 truncate font-medium">
                By {book.author} • {book.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* View Mode Toggle: Visual PDF Canvas vs Extracted Text */}
            <div className="flex items-center p-0.5 bg-black/10 rounded-full border border-black/10 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  if (book.pdfDataUrl) {
                    setViewMode('pdf');
                  } else {
                    onShowToast('Text Only Mode', 'This document was imported as Markdown text.', 'info');
                  }
                }}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                  viewMode === 'pdf'
                    ? 'bg-white shadow-xs font-bold text-slate-900'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="Visual PDF Page Layout View"
              >
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">PDF Page</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('text')}
                className={`px-2.5 py-1 rounded-full flex items-center gap-1 transition-all ${
                  viewMode === 'text'
                    ? 'bg-white shadow-xs font-bold text-slate-900'
                    : 'opacity-70 hover:opacity-100'
                }`}
                title="Refined Reader & Markdown Text View"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Reader Text</span>
              </button>
            </div>

            {/* Star Rating */}
            <div className="hidden lg:flex items-center space-x-1 px-2 py-1 rounded-full bg-black/5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-0.5 hover:scale-110 transition-transform"
                  title={`Rate ${s} stars`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Load in Workspace Editor button */}
            <button
              type="button"
              onClick={() => {
                onOpenInEditor(book);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#007AFF] text-white hover:bg-[#0062CC] transition-all flex items-center space-x-1.5 shadow-sm"
              title="Open content in Markdown Workspace Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workspace</span>
            </button>

            {/* Bookmarks Toggle Button */}
            <button
              type="button"
              onClick={() => setShowBookmarksDrawer(!showBookmarksDrawer)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center space-x-1.5 ${
                showBookmarksDrawer ? 'bg-amber-500 text-white' : 'bg-black/5 hover:bg-black/10'
              }`}
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bookmarks</span>
              {bookmarks.length > 0 && (
                <span className="text-[10px] bg-white/30 px-1.5 py-0.2 rounded-full font-bold">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${
                showSettings ? 'bg-black/10' : 'bg-black/5 hover:bg-black/10'
              }`}
              title="Typography, RTL & Appearance Options"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
              title="Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Settings Popover Panel */}
        {showSettings && (
          <div className="px-6 py-3.5 bg-black/5 border-b border-black/10 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2 text-xs">
            {/* Text Direction Controls (LTR / RTL / Auto) */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold opacity-70 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Direction:
              </span>
              <div className="flex bg-black/5 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setTextDirection('auto')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    textDirection === 'auto' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                  title="Auto-detect text direction"
                >
                  Auto ({isRtlDetected ? 'RTL' : 'LTR'})
                </button>
                <button
                  type="button"
                  onClick={() => setTextDirection('ltr')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    textDirection === 'ltr' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                  title="Left-to-Right layout"
                >
                  LTR
                </button>
                <button
                  type="button"
                  onClick={() => setTextDirection('rtl')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    textDirection === 'rtl' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                  title="Right-to-Left layout (Arabic, Hebrew, etc.)"
                >
                  RTL
                </button>
              </div>
            </div>

            {/* Font Family */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold opacity-70">Font:</span>
              <div className="flex bg-black/5 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setFontFamily('serif')}
                  className={`px-3 py-1 rounded-lg font-serif font-bold ${
                    fontFamily === 'serif' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                >
                  Serif
                </button>
                <button
                  type="button"
                  onClick={() => setFontFamily('sans')}
                  className={`px-3 py-1 rounded-lg font-sans font-bold ${
                    fontFamily === 'sans' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                >
                  Sans
                </button>
                <button
                  type="button"
                  onClick={() => setFontFamily('mono')}
                  className={`px-3 py-1 rounded-lg font-mono font-bold ${
                    fontFamily === 'mono' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                >
                  Mono
                </button>
              </div>
            </div>

            {/* Font Size */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold opacity-70">Size:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                  className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 font-bold flex items-center justify-center"
                >
                  A-
                </button>
                <span className="font-mono font-bold w-6 text-center">{fontSize}</span>
                <button
                  type="button"
                  onClick={() => setFontSize(Math.min(28, fontSize + 1))}
                  className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 font-bold flex items-center justify-center"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Theme Picker */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold opacity-70">Theme:</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setReaderTheme('paper')}
                  className={`w-7 h-7 rounded-full bg-[#FAF8F5] border-2 ${
                    readerTheme === 'paper' ? 'border-[#007AFF] scale-110' : 'border-slate-300'
                  }`}
                  title="Paper Theme"
                />
                <button
                  type="button"
                  onClick={() => setReaderTheme('sepia')}
                  className={`w-7 h-7 rounded-full bg-[#F4ECD8] border-2 ${
                    readerTheme === 'sepia' ? 'border-[#007AFF] scale-110' : 'border-amber-300'
                  }`}
                  title="Sepia Theme"
                />
                <button
                  type="button"
                  onClick={() => setReaderTheme('mint')}
                  className={`w-7 h-7 rounded-full bg-[#F0F7F4] border-2 ${
                    readerTheme === 'mint' ? 'border-[#007AFF] scale-110' : 'border-emerald-300'
                  }`}
                  title="Mint Calm Theme"
                />
                <button
                  type="button"
                  onClick={() => setReaderTheme('dark')}
                  className={`w-7 h-7 rounded-full bg-[#18181B] border-2 ${
                    readerTheme === 'dark' ? 'border-[#007AFF] scale-110' : 'border-zinc-600'
                  }`}
                  title="Dark Night Theme"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* VISUAL PDF PAGE CANVAS VIEW */}
          {viewMode === 'pdf' ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/10">
              {/* PDF Toolbar Controls */}
              <div className="px-4 py-2 border-b border-black/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
                {/* Page Navigation */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPdfPage((p) => Math.max(1, p - 1))}
                    disabled={currentPdfPage <= 1}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 disabled:opacity-30 transition-colors"
                    title="Previous Page (Left Arrow)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 font-bold">
                    <span>Page</span>
                    <input
                      type="number"
                      min={1}
                      max={numPdfPages || 1}
                      value={currentPdfPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setCurrentPdfPage(Math.max(1, Math.min(numPdfPages || 1, val)));
                        }
                      }}
                      className="w-12 text-center py-0.5 border border-black/20 rounded-md font-mono bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span>of {numPdfPages || 1}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPdfPage((p) => Math.min(numPdfPages || 1, p + 1))}
                    disabled={currentPdfPage >= numPdfPages}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 disabled:opacity-30 transition-colors"
                    title="Next Page (Right Arrow)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* PDF Zoom & Rotation Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPdfZoomScale((z) => Math.max(0.5, z - 0.2))}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold w-12 text-center">{Math.round(pdfZoomScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setPdfZoomScale((z) => Math.min(3.0, z + 0.2))}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <div className="w-px h-4 bg-black/10 mx-1" />

                  <button
                    type="button"
                    onClick={() => setPdfRotation((r) => (r + 90) % 360)}
                    className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                    title="Rotate 90 degrees"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingBookmark(true)}
                  className="px-3 py-1 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-full font-semibold transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bookmark Page</span>
                </button>
              </div>

              {/* PDF Canvas Viewport Container */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center custom-scrollbar relative">
                {isLoadingPdf ? (
                  <div className="flex flex-col items-center justify-center space-y-3 p-8">
                    <RefreshCw className="w-8 h-8 text-[#007AFF] animate-spin" />
                    <p className="text-xs font-bold opacity-70">Rendering PDF Page Layout...</p>
                  </div>
                ) : (
                  <div className="relative shadow-2xl rounded-lg overflow-hidden border border-black/10 bg-white">
                    <canvas ref={pdfCanvasRef} className="block max-w-none" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* FORMATTED TEXT / MARKDOWN READER CANVAS */
            <div
              ref={contentRef}
              onScroll={handleScroll}
              onMouseUp={handleTextSelection}
              className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 custom-scrollbar selection:bg-[#007AFF]/20"
            >
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Header Progress Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-black/10 text-xs">
                  <div className="flex items-center space-x-2 opacity-70">
                    <BookOpen className="w-4 h-4" />
                    <span>Reading Progress: <b>{progress}%</b></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingBookmark(true)}
                    className="px-3 py-1 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-full font-semibold transition-colors flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bookmark Here</span>
                  </button>
                </div>

                {/* Add Bookmark Form */}
                {isAddingBookmark && (
                  <div className="p-4 rounded-2xl bg-black/5 border border-black/10 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-[#007AFF]">
                        <BookmarkIcon className="w-4 h-4" />
                        <span>Add Bookmark at {progress}%</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingBookmark(false)}
                        className="p-1 hover:bg-black/10 rounded-full"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {selectedText && (
                      <blockquote className="p-2.5 rounded-xl bg-white/60 border-l-2 border-[#007AFF] text-xs italic opacity-90 line-clamp-3">
                        "{selectedText}"
                      </blockquote>
                    )}

                    <input
                      type="text"
                      value={newBookmarkNote}
                      onChange={(e) => setNewBookmarkNote(e.target.value)}
                      placeholder="Enter note for this section..."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800 font-medium"
                    />

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingBookmark(false)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-black/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddBookmark}
                        className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#007AFF] text-white hover:bg-[#0062CC] shadow-xs"
                      >
                        Save Bookmark
                      </button>
                    </div>
                  </div>
                )}

                {/* Formatted Book Content Text with RTL Support */}
                <div
                  className={`space-y-4 ${fontClasses[fontFamily]} ${
                    activeDirection === 'rtl' ? 'text-right leading-loose' : 'text-justify leading-relaxed'
                  }`}
                  style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
                  dir={activeDirection}
                >
                  {book.content ? (
                    book.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('# ')) {
                        return (
                          <h1 key={idx} className="text-2xl sm:text-3xl font-bold mt-6 mb-3 border-b border-black/10 pb-2">
                            {paragraph.replace('# ', '')}
                          </h1>
                        );
                      }
                      if (paragraph.startsWith('## ')) {
                        return (
                          <h2 key={idx} className="text-xl font-bold mt-6 mb-2">
                            {paragraph.replace('## ', '')}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith('> ')) {
                        return (
                          <blockquote key={idx} className="p-4 rounded-2xl bg-black/5 border-l-4 border-[#007AFF] italic my-4">
                            {paragraph.replace('> ', '')}
                          </blockquote>
                        );
                      }
                      return (
                        <p key={idx} className="leading-relaxed">
                          {paragraph}
                        </p>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold opacity-70">No text content available.</p>
                      {book.pdfDataUrl && (
                        <button
                          type="button"
                          onClick={() => setViewMode('pdf')}
                          className="px-4 py-2 bg-[#007AFF] text-white text-xs font-bold rounded-full shadow-md"
                        >
                          Switch to Visual PDF Page Mode
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bookmarks Drawer */}
          {showBookmarksDrawer && (
            <div className="w-80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border-l border-black/10 p-4 flex flex-col shrink-0 animate-in slide-in-from-right-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-black/10">
                <div className="flex items-center space-x-2">
                  <BookmarkIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    Bookmarks ({bookmarks.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBookmarksDrawer(false)}
                  className="p-1 hover:bg-black/5 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-10 px-2 space-y-2">
                    <BookmarkIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-500">No bookmarks saved yet</p>
                    <p className="text-[11px] text-slate-400">
                      Click "Bookmark Page" or select text to drop bookmarks.
                    </p>
                  </div>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      onClick={() => handleJumpToBookmark(bm)}
                      className="p-3 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors border border-black/5 space-y-2 text-xs cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 font-mono">
                        <span className="font-bold text-[#007AFF]">{bm.chapterOrSection}</span>
                        <span>{new Date(bm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <p className="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors">
                        {bm.note}
                      </p>

                      {bm.quote && (
                        <p className="text-[11px] italic opacity-80 border-l-2 border-amber-500 pl-2">
                          "{bm.quote}"
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBookmark(bm.id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete bookmark"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reader Bottom Progress Footer */}
        <div className="px-6 py-2.5 border-t border-black/10 bg-black/5 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold opacity-70">Progress:</span>
            <div className="w-32 sm:w-48 bg-black/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">{progress}%</span>
          </div>

          <div className="text-[11px] opacity-60 font-mono hidden sm:block">
            {viewMode === 'pdf' ? `Page ${currentPdfPage} of ${numPdfPages || 1}` : `${book.wordCount.toLocaleString()} words`} • Format: {book.fileFormat?.toUpperCase() || 'PDF/MD'}
          </div>
        </div>
      </div>
    </div>
  );
};
