import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Star,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { Book, Bookmark } from '../types';

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
  const [fontSize, setFontSize] = useState<number>(17);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark' | 'mint'>('paper');
  const [lineHeight, setLineHeight] = useState<number>(1.7);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);

  // Bookmarking Form State
  const [newBookmarkNote, setNewBookmarkNote] = useState<string>('');
  const [selectedText, setSelectedText] = useState<string>('');
  const [isAddingBookmark, setIsAddingBookmark] = useState<boolean>(false);

  // Local Bookmarks copy
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(book.bookmarks || []);
  const [progress, setProgress] = useState<number>(book.progressPercent || 0);
  const [rating, setRating] = useState<number>(book.rating || 5);

  const contentRef = useRef<HTMLDivElement>(null);

  // Sync scroll position to calculate reading progress percentage
  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    if (scrollHeight <= clientHeight) return;
    const currentProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    setProgress(currentProgress);
  };

  // Auto update progress back to parent state on scroll / close
  useEffect(() => {
    onUpdateBookProgress(book.id, progress, bookmarks, rating);
  }, [progress, bookmarks, rating]);

  // Capture text selection in reader
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  // Add new Bookmark
  const handleAddBookmark = () => {
    const newBm: Bookmark = {
      id: `bm-${Date.now()}`,
      bookId: book.id,
      chapterOrSection: `Page/Section at ${progress}%`,
      note: newBookmarkNote.trim() || 'Bookmarked page',
      timestamp: Date.now(),
      progressPercent: progress,
      quote: selectedText || undefined,
    };

    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    setNewBookmarkNote('');
    setSelectedText('');
    setIsAddingBookmark(false);
    onShowToast('Bookmark Saved', `Added bookmark at ${progress}% reading progress`);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    onShowToast('Bookmark Removed');
  };

  const themeClasses = {
    paper: 'bg-[#FAF8F5] text-[#2C2C2A] border-slate-200',
    sepia: 'bg-[#F4ECD8] text-[#5B4636] border-amber-200/60',
    dark: 'bg-[#18181B] text-[#E4E4E7] border-zinc-800',
    mint: 'bg-[#F0F7F4] text-[#224235] border-emerald-200/60',
  };

  const fontClasses = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-5xl h-[94vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border transition-all duration-300 ${
          themeClasses[readerTheme]
        } ${isFullscreen ? 'max-w-none h-screen rounded-none p-0' : ''}`}
      >
        {/* Top Header Controls Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-black/5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 truncate mr-2">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${book.coverColor} text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0`}
            >
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                {book.title}
              </h2>
              <p className="text-xs opacity-70 truncate font-medium">
                By {book.author} • {book.category}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Star Rating */}
            <div className="hidden md:flex items-center space-x-1 mr-2 px-2 py-1 rounded-full bg-black/5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-0.5 hover:scale-110 transition-transform"
                  title={`Rate ${s} stars`}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      s <= rating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Load in Editor button */}
            <button
              onClick={() => {
                onOpenInEditor(book);
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#007AFF] text-white hover:bg-[#0062CC] transition-all flex items-center space-x-1.5 shadow-sm"
              title="Open content in Markdown Editor for annotations"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit in Workspace</span>
            </button>

            {/* Bookmarks Toggle Button */}
            <button
              onClick={() => setShowBookmarksDrawer(!showBookmarksDrawer)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center space-x-1.5 ${
                showBookmarksDrawer
                  ? 'bg-amber-500 text-white'
                  : 'bg-black/5 hover:bg-black/10'
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

            {/* Typography & Appearance Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-full transition-colors ${
                showSettings ? 'bg-black/10' : 'bg-black/5 hover:bg-black/10'
              }`}
              title="Typography & Appearance"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Reader'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors ml-1"
              title="Close Reader"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reader Settings Popover Panel */}
        {showSettings && (
          <div className="px-6 py-4 bg-black/5 border-b border-black/10 flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2 text-xs">
            {/* Font Family */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold opacity-70">Font:</span>
              <div className="flex bg-black/5 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setFontFamily('serif')}
                  className={`px-3 py-1 rounded-lg font-serif font-bold ${
                    fontFamily === 'serif' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                >
                  Serif
                </button>
                <button
                  onClick={() => setFontFamily('sans')}
                  className={`px-3 py-1 rounded-lg font-sans font-bold ${
                    fontFamily === 'sans' ? 'bg-white shadow-xs text-slate-900' : 'opacity-70'
                  }`}
                >
                  Sans
                </button>
                <button
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
                  onClick={() => setFontSize(Math.max(13, fontSize - 1))}
                  className="w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 font-bold flex items-center justify-center"
                >
                  A-
                </button>
                <span className="font-mono font-bold w-6 text-center">{fontSize}</span>
                <button
                  onClick={() => setFontSize(Math.min(26, fontSize + 1))}
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
                  onClick={() => setReaderTheme('paper')}
                  className={`w-7 h-7 rounded-full bg-[#FAF8F5] border-2 ${
                    readerTheme === 'paper' ? 'border-[#007AFF] scale-110' : 'border-slate-300'
                  }`}
                  title="Paper Theme"
                />
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`w-7 h-7 rounded-full bg-[#F4ECD8] border-2 ${
                    readerTheme === 'sepia' ? 'border-[#007AFF] scale-110' : 'border-amber-300'
                  }`}
                  title="Sepia Theme"
                />
                <button
                  onClick={() => setReaderTheme('mint')}
                  className={`w-7 h-7 rounded-full bg-[#F0F7F4] border-2 ${
                    readerTheme === 'mint' ? 'border-[#007AFF] scale-110' : 'border-emerald-300'
                  }`}
                  title="Mint Calm Theme"
                />
                <button
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

        {/* Main Body with Sidebar Drawer or Pure Reading Canvas */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Main Book Reader Canvas */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            onMouseUp={handleTextSelection}
            className="flex-1 overflow-y-auto px-6 sm:px-16 py-8 custom-scrollbar selection:bg-[#007AFF]/20"
          >
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Quick Add Bookmark Header Button */}
              <div className="flex items-center justify-between pb-4 border-b border-black/10 text-xs">
                <div className="flex items-center space-x-2 opacity-70">
                  <BookOpen className="w-4 h-4" />
                  <span>Reading Progress: <b>{progress}%</b></span>
                </div>
                <button
                  onClick={() => setIsAddingBookmark(true)}
                  className="px-3 py-1 bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] rounded-full font-semibold transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Bookmark Here</span>
                </button>
              </div>

              {/* Add Bookmark Floating Dialog Form */}
              {isAddingBookmark && (
                <div className="p-4 rounded-2xl bg-black/5 border border-black/10 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[#007AFF]">
                      <BookmarkIcon className="w-4 h-4" />
                      <span>Add Bookmark at {progress}%</span>
                    </span>
                    <button
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
                    placeholder="Enter optional note for this section..."
                    className="w-full px-3 py-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800"
                  />

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsAddingBookmark(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl hover:bg-black/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddBookmark}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#007AFF] text-white hover:bg-[#0062CC] shadow-xs"
                    >
                      Save Bookmark
                    </button>
                  </div>
                </div>
              )}

              {/* Formatted Book Content Text */}
              <div
                className={`leading-relaxed space-y-4 ${fontClasses[fontFamily]}`}
                style={{ fontSize: `${fontSize}px`, lineHeight: lineHeight }}
              >
                {book.content.split('\n\n').map((paragraph, idx) => {
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
                    <p key={idx} className="text-justify leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bookmarks & Notes Right Sidebar Drawer */}
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
                    <p className="text-xs font-semibold text-slate-500">No bookmarks yet</p>
                    <p className="text-[11px] text-slate-400">
                      Highlight text or click "Bookmark Here" while reading.
                    </p>
                  </div>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      className="p-3 rounded-2xl bg-black/5 hover:bg-black/10 transition-colors border border-black/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between text-[10px] opacity-70 font-mono">
                        <span>{bm.chapterOrSection}</span>
                        <span>{new Date(bm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <p className="font-bold text-slate-900 dark:text-zinc-100">{bm.note}</p>

                      {bm.quote && (
                        <p className="text-[11px] italic opacity-80 border-l-2 border-amber-500 pl-2">
                          "{bm.quote}"
                        </p>
                      )}

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => handleDeleteBookmark(bm.id)}
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
            {book.wordCount.toLocaleString()} words • Format: {book.fileFormat?.toUpperCase() || 'MD'}
          </div>
        </div>
      </div>
    </div>
  );
};
