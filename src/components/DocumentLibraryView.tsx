import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Cloud,
  FileText,
  Star,
  Trash2,
  Download,
  Filter,
  Heart,
  Sparkles,
  ChevronRight,
  Clock,
  History,
  Grid,
  List as ListIcon,
  BookMarked,
  Layers,
  FileUp,
  FolderOpen,
  Tag,
  ArrowUpRight,
  Printer,
  FolderSearch,
  HardDrive,
  Edit,
  Edit3
} from 'lucide-react';
import { Book, BookShelf, DocumentFolder, HistoryItem, VersionSnapshot } from '../types';

interface DocumentLibraryViewProps {
  books: Book[];
  folders?: DocumentFolder[];
  history: HistoryItem[];
  snapshots: VersionSnapshot[];
  onOpenBookInEditor: (book: Book) => void;
  onOpenBookInReader: (book: Book) => void;
  onOpenHistoryItemInEditor: (item: HistoryItem) => void;
  onOpenSnapshotInEditor: (snapshot: VersionSnapshot) => void;
  onDeleteBook: (bookId: string) => void;
  onToggleFavorite: (bookId: string) => void;
  onUpdateBookShelf: (bookId: string, shelf: BookShelf) => void;
  onEditBookDetails: (book: Book) => void;
  onCreateBookDetails: () => void;
  onNewBlankDocument: () => void;
  onOpenUploadView: () => void;
  onLoadSample: () => void;
  onOpenCloudStorage: () => void;
  onOpenScanner?: () => void;
  onOpenLocalFileManager?: () => void;
  onOpenSettings: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onDeleteSnapshot: (id: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

type LibraryTab = 'all' | 'books' | 'conversions' | 'snapshots' | 'favorites';
type ShelfFilter = 'All' | 'Currently Reading' | 'To Read' | 'Completed' | 'Reference';

export const DocumentLibraryView: React.FC<DocumentLibraryViewProps> = ({
  books,
  folders = [],
  history,
  snapshots,
  onOpenBookInEditor,
  onOpenBookInReader,
  onOpenHistoryItemInEditor,
  onOpenSnapshotInEditor,
  onDeleteBook,
  onToggleFavorite,
  onUpdateBookShelf,
  onEditBookDetails,
  onCreateBookDetails,
  onNewBlankDocument,
  onOpenUploadView,
  onLoadSample,
  onOpenCloudStorage,
  onOpenScanner,
  onOpenLocalFileManager,
  onOpenSettings,
  onDeleteHistoryItem,
  onDeleteSnapshot,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedShelf, setSelectedShelf] = useState<ShelfFilter>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Track scroll position to trigger smooth iOS header collapse
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtered Books
  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q));

      if (activeTab === 'favorites') {
        return matchesSearch && Boolean(b.isFavorite);
      }
      if (selectedShelf !== 'All') {
        return matchesSearch && b.shelf === selectedShelf;
      }
      return matchesSearch;
    });
  }, [books, searchQuery, activeTab, selectedShelf]);

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((h) => {
      const q = searchQuery.toLowerCase();
      return !q || h.originalFilename.toLowerCase().includes(q) || h.markdown.toLowerCase().includes(q);
    });
  }, [history, searchQuery]);

  // Filtered Snapshots
  const filteredSnapshots = useMemo(() => {
    return snapshots.filter((s) => {
      const q = searchQuery.toLowerCase();
      return !q || s.label.toLowerCase().includes(q) || s.filename.toLowerCase().includes(q);
    });
  }, [snapshots, searchQuery]);

  const totalItemCount = books.length + history.length + snapshots.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F2F2F7] text-slate-900 pb-28 font-sans">
      
      {/* iOS HEADER BANNER & LARGE TITLE */}
      <div className={`bg-white/85 backdrop-blur-xl border-b border-black/10 sticky top-14 z-20 transition-all duration-300 ${
        isScrolled ? 'py-2 shadow-sm bg-white/95' : 'py-3.5 shadow-2xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2.5">

          {/* Search Input & View Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents, books, tags, notes..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/20 rounded-2xl text-xs font-medium text-slate-800 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-300 hover:bg-slate-400 text-white flex items-center justify-center text-[10px] font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Grid vs List View Toggle */}
            <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center space-x-1 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'grid' ? 'bg-white text-[#007AFF] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all ${
                  viewMode === 'list' ? 'bg-white text-[#007AFF] shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Premium Create Document Button */}
            <button
              type="button"
              onClick={onCreateBookDetails}
              className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white py-1.5 px-3.5 rounded-2xl flex items-center gap-1.5 shrink-0 transition-all font-bold text-xs shadow-xs"
              title="Create Document from scratch or import (PDF, Word, Markdown, Text)"
            >
              <Plus className="w-4 h-4" />
              <span>New Document</span>
            </button>
          </div>

          {/* Secondary Shelf Filter Pills (Top Header Row for Books) */}
          {(activeTab === 'all' || activeTab === 'books') && (
            <div className="flex items-center space-x-1.5 text-xs overflow-x-auto scrollbar-none pt-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">Shelf:</span>
              {(['All', 'Currently Reading', 'To Read', 'Completed'] as ShelfFilter[]).map((shelf) => (
                <button
                  key={shelf}
                  onClick={() => setSelectedShelf(shelf)}
                  className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 ${
                    selectedShelf === shelf
                      ? 'bg-slate-900 text-white font-bold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {shelf}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MAIN LIBRARY CONTENT BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* TOP QUICK ACTION PROMO BANNER (If empty or new) */}
        {books.length === 0 && history.length === 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <span className="bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full">
                Welcome to iOS Reader &amp; Editor
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Import PDF Documents or Explore Sample Classics
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                Convert PDFs to markdown, organize your digital bookshelf, take snapshots, and edit seamlessly.
              </p>
            </div>
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={onOpenUploadView}
                className="px-5 py-3 bg-white text-blue-600 hover:bg-blue-50 font-extrabold text-xs rounded-2xl shadow-lg transition-all"
              >
                Upload PDF Document
              </button>
              <button
                onClick={onLoadSample}
                className="px-5 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-2xl transition-all"
              >
                Try Sample PDF
              </button>
            </div>
          </div>
        )}

        {/* SECTION 1: BOOKS & E-PUB COLLECTION */}
        {(activeTab === 'all' || activeTab === 'books' || activeTab === 'favorites') && filteredBooks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#007AFF]" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {activeTab === 'favorites' ? 'Starred Favorite Books' : 'Digital Books & E-Pubs'}
                </h2>
                <span className="text-xs font-semibold text-slate-400">({filteredBooks.length})</span>
              </div>
            </div>

            {/* Grid View for Books */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-3xl border border-black/5 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative"
                  >
                    {/* Top Shelf & Favorite Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200/60">
                        {book.shelf || 'Collection'}
                      </span>
                      <button
                        onClick={() => onToggleFavorite(book.id)}
                        className={`p-1.5 rounded-full transition-colors ${
                          book.isFavorite
                            ? 'bg-rose-50 text-rose-500'
                            : 'text-slate-300 hover:text-rose-400 hover:bg-slate-50'
                        }`}
                        title={book.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                      >
                        <Heart className={`w-4 h-4 ${book.isFavorite ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Book Cover Design (iOS Apple Books Aesthetic) */}
                    <div
                      onClick={() => onOpenBookInReader(book)}
                      className={`h-36 rounded-2xl bg-gradient-to-br ${book.coverColor || 'from-blue-600 to-indigo-800'} p-3 text-white flex flex-col justify-between shadow-xs cursor-pointer group-hover:scale-[1.02] transition-transform relative overflow-hidden`}
                    >
                      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                          {book.category || 'Book'}
                        </span>
                        <span className="text-[10px] font-semibold opacity-80">
                          {book.wordCount ? `${Math.round(book.wordCount / 250)} min` : ''}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-snug line-clamp-2 drop-shadow-xs">{book.title}</h3>
                        <p className="text-[11px] opacity-80 font-medium mt-0.5">{book.author}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {book.progressPercent !== undefined && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500">
                          <span>Progress</span>
                          <span>{book.progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#007AFF] rounded-full transition-all"
                            style={{ width: `${book.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Quick Card Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <button
                        onClick={() => onOpenBookInReader(book)}
                        className="flex-grow py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                      <button
                        onClick={() => onEditBookDetails(book)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center"
                        title="Edit Document Details & Format"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenBookInEditor(book)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center"
                        title="Edit in Markdown Workspace"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteBook(book.id)}
                        className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs transition-all flex items-center justify-center"
                        title="Delete Book"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View for Books */
              <div className="bg-white rounded-3xl border border-black/5 divide-y divide-slate-100 shadow-2xs overflow-hidden">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="p-3.5 sm:p-4 hover:bg-slate-50/80 transition-all flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div
                        onClick={() => onOpenBookInReader(book)}
                        className={`w-10 h-12 rounded-xl bg-gradient-to-br ${book.coverColor || 'from-blue-600 to-indigo-800'} text-white flex items-center justify-center font-bold text-xs shrink-0 cursor-pointer shadow-2xs`}
                      >
                        <BookOpen className="w-5 h-5 opacity-90" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{book.title}</h3>
                          {book.isFavorite && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate">{book.author} • <span className="text-slate-400">{book.category}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onOpenBookInReader(book)}
                        className="px-3 py-1.5 bg-[#007AFF] text-white text-xs font-bold rounded-xl hover:bg-[#0062CC] transition-all flex items-center space-x-1"
                      >
                        <span>Reader</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditBookDetails(book)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"
                        title="Edit Details & Format"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenBookInEditor(book)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"
                        title="Edit in Markdown Workspace"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBook(book.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-900 hover:bg-rose-100 rounded-xl transition-all"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: CONVERTED PDF HISTORY */}
        {(activeTab === 'all' || activeTab === 'conversions') && filteredHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Converted PDF Documents</h2>
                <span className="text-xs font-semibold text-slate-400">({filteredHistory.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-black/5 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <FileText className="w-3 h-3" />
                        <span>PDF Conversion</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{item.originalFilename}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 font-mono bg-slate-50 p-2 rounded-xl text-[11px] leading-relaxed">
                      {item.markdown.slice(0, 140)}...
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenHistoryItemInEditor(item)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center space-x-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Open in Editor</span>
                    </button>
                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: SAVED VERSION SNAPSHOTS */}
        {(activeTab === 'all' || activeTab === 'snapshots') && filteredSnapshots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Saved Version Snapshots</h2>
                <span className="text-xs font-semibold text-slate-400">({filteredSnapshots.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSnapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="bg-white rounded-3xl border border-black/5 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Version Snapshot</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(snapshot.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{snapshot.label || snapshot.filename}</h3>
                    <p className="text-[11px] text-slate-500 font-mono line-clamp-2 bg-purple-50/50 p-2 rounded-xl">
                      {snapshot.markdown.slice(0, 120)}...
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => onOpenSnapshotInEditor(snapshot)}
                      className="px-3 py-1.5 bg-[#007AFF] text-white rounded-xl text-xs font-bold hover:bg-[#0062CC] transition-all flex items-center space-x-1"
                    >
                      <span>Restore Snapshot</span>
                    </button>
                    <button
                      onClick={() => onDeleteSnapshot(snapshot.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Snapshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EMPTY SEARCH STATE */}
        {totalItemCount > 0 &&
          filteredBooks.length === 0 &&
          filteredHistory.length === 0 &&
          filteredSnapshots.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-black/5 space-y-3">
              <Search className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No documents match "{searchQuery}"</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Try searching for a different keyword or clear your active search query.
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-full hover:bg-slate-800 transition-all"
              >
                Clear Search Filter
              </button>
            </div>
          )}
      </div>

      {/* iOS NATIVE TAB BAR (Fixed Bottom Position) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 sm:px-6 py-2.5 shadow-lg transition-all">
        <div className="max-w-md mx-auto flex items-center justify-around">
          
          {/* Tab 1: All Items */}
          <button
            onClick={() => setActiveTab('all')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'all' ? 'text-[#007AFF] font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Layers className="w-5 h-5" />
              {totalItemCount > 0 && (
                <span className={`absolute -top-1 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'all' ? 'bg-[#007AFF] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {totalItemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Library</span>
          </button>

          {/* Tab 2: Books */}
          <button
            onClick={() => setActiveTab('books')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'books' ? 'text-[#007AFF] font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <BookOpen className="w-5 h-5" />
              {books.length > 0 && (
                <span className={`absolute -top-1 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'books' ? 'bg-[#007AFF] text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {books.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Books</span>
          </button>

          {/* Tab 3: PDF Conversions */}
          <button
            onClick={() => setActiveTab('conversions')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'conversions' ? 'text-emerald-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {history.length > 0 && (
                <span className={`absolute -top-1 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'conversions' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {history.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">PDF Imports</span>
          </button>

          {/* Tab 4: Version Snapshots */}
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'snapshots' ? 'text-purple-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <History className="w-5 h-5" />
              {snapshots.length > 0 && (
                <span className={`absolute -top-1 -right-2 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'snapshots' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {snapshots.length}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Snapshots</span>
          </button>

          {/* Tab 5: Favorites */}
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              activeTab === 'favorites' ? 'text-rose-500 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-rose-500' : ''}`} />
            <span className="text-[10px] tracking-tight mt-0.5">Favorites</span>
          </button>

        </div>
      </div>
    </div>
  );
};
