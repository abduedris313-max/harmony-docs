import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  Search,
  Plus,
  Cloud,
  Globe,
  Bookmark as BookmarkIcon,
  Star,
  Trash2,
  Edit3,
  Check,
  FolderPlus,
  UploadCloud,
  Sparkles,
  Download,
  Filter,
  FileText,
  Heart,
  Share2,
  ArrowRight,
  RefreshCw,
  Library,
} from 'lucide-react';
import { Book, Bookmark, BookShelf, BookSource, CloudProvider } from '../types';

interface BookLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onSelectBookToRead: (book: Book) => void;
  onImportBook: (newBook: Partial<Book>) => void;
  onDeleteBook: (bookId: string) => void;
  onToggleFavorite: (bookId: string) => void;
  onUpdateBookShelf: (bookId: string, shelf: BookShelf) => void;
  onOpenInEditor: (book: Book) => void;
  onExportBookmarksToMarkdown: (markdown: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const BookLibraryModal: React.FC<BookLibraryModalProps> = ({
  isOpen,
  onClose,
  books,
  onSelectBookToRead,
  onImportBook,
  onDeleteBook,
  onToggleFavorite,
  onUpdateBookShelf,
  onOpenInEditor,
  onExportBookmarksToMarkdown,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'cloud' | 'online' | 'bookmarks'>('collection');
  const [selectedShelf, setSelectedShelf] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Import Form State
  const [importTitle, setImportTitle] = useState<string>('');
  const [importAuthor, setImportAuthor] = useState<string>('');
  const [importCategory, setImportCategory] = useState<string>('Personal');
  const [importContent, setImportContent] = useState<string>('');
  const [importShelf, setImportShelf] = useState<BookShelf>('To Read');

  // Cloud Drive Mock Connection state
  const [cloudConnected, setCloudConnected] = useState<boolean>(true);

  if (!isOpen) return null;

  // Filter books according to active tab, search query, and shelf
  const filteredCollectionBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (selectedShelf === 'All') return matchesSearch;
      if (selectedShelf === 'Favorites') return matchesSearch && Boolean(b.isFavorite);
      return matchesSearch && b.shelf === selectedShelf;
    });
  }, [books, searchQuery, selectedShelf]);

  // Aggregate all bookmarks across books
  const allBookmarks = useMemo(() => {
    const list: { book: Book; bookmark: Bookmark }[] = [];
    books.forEach((book) => {
      (book.bookmarks || []).forEach((bm) => {
        if (
          !searchQuery ||
          bm.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.title.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          list.push({ book, bookmark: bm });
        }
      });
    });
    return list;
  }, [books, searchQuery]);

  // Handle local file selection for book import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const titleWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      
      const newBook: Partial<Book> = {
        title: titleWithoutExt,
        author: importAuthor.trim() || 'Unknown Author',
        source: 'local',
        category: importCategory || 'Personal',
        shelf: importShelf || 'To Read',
        content: text || `# ${titleWithoutExt}\n\nImported book document.`,
        coverColor: 'from-[#007AFF] to-indigo-900',
        rating: 5,
        progressPercent: 0,
        lastReadTimestamp: Date.now(),
        tags: ['Local Import', importCategory],
        wordCount: text ? text.split(/\s+/).filter(Boolean).length : 500,
        description: `Imported local document ${file.name}`,
        fileFormat: file.name.endsWith('.pdf') ? 'pdf' : file.name.endsWith('.epub') ? 'epub' : 'md',
        bookmarks: [],
      };

      onImportBook(newBook);
      setShowImportModal(false);
      setImportTitle('');
      setImportAuthor('');
      setImportContent('');
      onShowToast('Book Added to Library', `"${titleWithoutExt}" added to your collection`);
    } catch (err) {
      onShowToast('Import Failed', 'Could not parse book file', 'error');
    }
  };

  // Submit custom book form
  const handleCreateBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importTitle.trim()) {
      onShowToast('Title Required', 'Please enter a book title', 'error');
      return;
    }

    const newBook: Partial<Book> = {
      title: importTitle.trim(),
      author: importAuthor.trim() || 'Unknown Author',
      source: 'local',
      category: importCategory,
      shelf: importShelf,
      content: importContent.trim() || `# ${importTitle}\n\nStart writing or reading content here...`,
      coverColor: 'from-amber-600 to-rose-900',
      rating: 5,
      progressPercent: 0,
      lastReadTimestamp: Date.now(),
      tags: [importCategory, 'Custom Notes'],
      wordCount: importContent.trim() ? importContent.trim().split(/\s+/).filter(Boolean).length : 100,
      description: 'Custom created book entry',
      fileFormat: 'md',
      bookmarks: [],
    };

    onImportBook(newBook);
    setShowImportModal(false);
    setImportTitle('');
    setImportAuthor('');
    setImportContent('');
    onShowToast('Book Created', `"${importTitle}" added to personal shelf`);
  };

  // Export all bookmarks as a compiled Markdown study guide
  const handleExportAllBookmarks = () => {
    if (allBookmarks.length === 0) {
      onShowToast('No Bookmarks', 'Add bookmarks to books first', 'info');
      return;
    }

    let md = `# Personal Reading Study Notes & Bookmarks\n\n*Generated on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    allBookmarks.forEach(({ book, bookmark }, idx) => {
      md += `### ${idx + 1}. ${book.title} (by ${book.author})\n`;
      md += `- **Section**: ${bookmark.chapterOrSection}\n`;
      md += `- **Note**: ${bookmark.note}\n`;
      if (bookmark.quote) {
        md += `> "${bookmark.quote}"\n`;
      }
      md += `\n---\n\n`;
    });

    onExportBookmarksToMarkdown(md);
    onClose();
    onShowToast('Bookmarks Exported', 'Loaded study sheet into Markdown Editor!');
  };

  const shelvesList = [
    'All',
    'Favorites',
    'Currently Reading',
    'To Read',
    'Completed',
    'Technical',
    'Classics',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-black/10">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-black/5 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-bold shadow-sm">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Book Library &amp; Collections</span>
                <span className="text-xs bg-[#007AFF]/10 text-[#007AFF] px-2 py-0.5 rounded-full font-semibold">
                  {books.length} Books
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Organize local, cloud drive, and online books with bookmarks and progress tracking
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search Input */}
            <div className="relative w-44 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author, tags..."
                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-full border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Add Book Button */}
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-1.5 bg-[#007AFF] text-white hover:bg-[#0062CC] text-xs font-bold rounded-full transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Book</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Library Navigation Tabs Bar */}
        <div className="px-6 border-b border-black/5 bg-white flex items-center justify-between overflow-x-auto custom-scrollbar shrink-0">
          <div className="flex space-x-1 sm:space-x-2 py-2">
            <button
              onClick={() => setActiveTab('collection')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'collection'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My Personal Shelves</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'cloud'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Drive Books</span>
            </button>

            <button
              onClick={() => setActiveTab('online')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === 'online'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Online Catalog</span>
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 relative ${
                activeTab === 'bookmarks'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookmarkIcon className="w-3.5 h-3.5" />
              <span>Bookmarks &amp; Highlights</span>
              {allBookmarks.length > 0 && (
                <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {allBookmarks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Personal Shelves & Collection */}
        {activeTab === 'collection' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Shelf Filter Chips */}
            <div className="px-6 py-2.5 bg-slate-50/50 border-b border-black/5 flex items-center space-x-2 overflow-x-auto custom-scrollbar shrink-0 text-xs">
              <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Shelf:</span>
              </span>
              {shelvesList.map((shelf) => (
                <button
                  key={shelf}
                  onClick={() => setSelectedShelf(shelf)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedShelf === shelf
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {shelf}
                </button>
              ))}
            </div>

            {/* Books Grid View */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {filteredCollectionBooks.length === 0 ? (
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No books found in this shelf</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Add new books, import from local files, or explore the online public domain catalog.
                  </p>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="px-4 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold hover:bg-[#0062CC] transition-colors"
                  >
                    Import First Book
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredCollectionBooks.map((book) => (
                    <div
                      key={book.id}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#007AFF]/50 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Book Cover Header */}
                        <div
                          onClick={() => onSelectBookToRead(book)}
                          className={`w-full h-32 rounded-xl bg-gradient-to-br ${book.coverColor} p-3 text-white flex flex-col justify-between cursor-pointer relative overflow-hidden group-hover:scale-[1.02] transition-transform`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-80">
                            <span>{book.category}</span>
                            <span className="bg-white/20 px-1.5 py-0.5 rounded font-mono">
                              {book.fileFormat?.toUpperCase() || 'MD'}
                            </span>
                          </div>

                          <div>
                            <h3 className="font-bold text-sm leading-tight line-clamp-2 drop-shadow-xs">
                              {book.title}
                            </h3>
                            <p className="text-[11px] opacity-90 truncate mt-0.5 font-medium">
                              {book.author}
                            </p>
                          </div>

                          {/* Read Overlay Button */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 bg-white text-slate-900 rounded-full font-bold text-xs shadow-md flex items-center gap-1">
                              <BookOpen className="w-3.5 h-3.5 text-[#007AFF]" />
                              <span>Read Now</span>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar & Rating */}
                        <div className="mt-3 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Reading Progress</span>
                            <span className="font-bold text-slate-800 font-mono">{book.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#007AFF] h-full rounded-full transition-all"
                              style={{ width: `${book.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Shelf Tag Selector */}
                        <div className="mt-3 flex items-center justify-between">
                          <select
                            value={book.shelf}
                            onChange={(e) => onUpdateBookShelf(book.id, e.target.value as BookShelf)}
                            className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg border-0 focus:ring-1 focus:ring-[#007AFF] cursor-pointer"
                          >
                            <option value="Currently Reading">Currently Reading</option>
                            <option value="To Read">To Read</option>
                            <option value="Completed">Completed</option>
                            <option value="Favorites">Favorites</option>
                            <option value="Technical">Technical</option>
                            <option value="Classics">Classics</option>
                          </select>

                          {/* Star Rating */}
                          <div className="flex items-center text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span className="text-[10px] font-bold text-slate-700 ml-1">
                              {book.rating || 5}.0
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => onToggleFavorite(book.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            book.isFavorite
                              ? 'text-rose-500 bg-rose-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title="Toggle Favorite"
                        >
                          <Heart className={`w-3.5 h-3.5 ${book.isFavorite ? 'fill-rose-500' : ''}`} />
                        </button>

                        <button
                          onClick={() => onOpenInEditor(book)}
                          className="text-[11px] font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Notes</span>
                        </button>

                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete book"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Cloud Drive Books */}
        {activeTab === 'cloud' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#007AFF] text-white flex items-center justify-center font-bold">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Google Drive &amp; Cloud Bookshelf</h3>
                  <p className="text-xs text-slate-500">Connected account: abdutuahir@gmail.com</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Synced</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Modern Web Architecture Guide</span>
                  <span className="text-[10px] bg-blue-100 text-[#007AFF] font-bold px-2 py-0.5 rounded-full">Google Drive</span>
                </div>
                <p className="text-xs text-slate-500">
                  Comprehensive guidelines on modular UI, state locality, and design token scales.
                </p>
                <button
                  onClick={() => {
                    const found = books.find((b) => b.id === 'book-2');
                    if (found) onSelectBookToRead(found);
                  }}
                  className="w-full py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold hover:bg-[#0062CC] transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Cloud Book</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Prompt Engineering Blueprint</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Dropbox Sync</span>
                </div>
                <p className="text-xs text-slate-500">
                  Research notes on system prompts, function calling, and agent workflow design.
                </p>
                <button
                  onClick={() => {
                    const found = books.find((b) => b.id === 'book-4');
                    if (found) onSelectBookToRead(found);
                  }}
                  className="w-full py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold hover:bg-[#0062CC] transition-colors flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Cloud Book</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Online Catalog */}
        {activeTab === 'online' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#007AFF]" />
                <span>Public Domain Classics &amp; Tech Catalog</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {books
                .filter((b) => b.source === 'online')
                .map((book) => (
                  <div
                    key={book.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#007AFF] transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{book.title}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Public Domain
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">By {book.author}</p>
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{book.description}</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={() => onSelectBookToRead(book)}
                        className="flex-1 py-2 bg-[#007AFF] text-white rounded-xl text-xs font-bold hover:bg-[#0062CC] transition-colors flex items-center justify-center gap-1"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read Now</span>
                      </button>
                      <button
                        onClick={() => onOpenInEditor(book)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Edit Notes
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tab 4: Bookmarks & Highlights */}
        {activeTab === 'bookmarks' && (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookmarkIcon className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Saved Bookmarks &amp; Quotes ({allBookmarks.length})</span>
                </h3>
                <p className="text-xs text-slate-500">Collected notes from your reading sessions</p>
              </div>

              {allBookmarks.length > 0 && (
                <button
                  onClick={handleExportAllBookmarks}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Export All as Markdown Notes</span>
                </button>
              )}
            </div>

            {allBookmarks.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <BookmarkIcon className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-bold">No bookmarks saved yet</p>
                <p className="text-[11px]">Highlight passages while reading books to save notes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allBookmarks.map(({ book, bookmark }) => (
                  <div
                    key={bookmark.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:bg-white transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#007AFF]">{book.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {bookmark.chapterOrSection}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800">{bookmark.note}</p>

                    {bookmark.quote && (
                      <blockquote className="p-2.5 rounded-xl bg-amber-50/70 border-l-2 border-amber-500 text-xs italic text-slate-700">
                        "{bookmark.quote}"
                      </blockquote>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Stats */}
        <div className="px-6 py-3 border-t border-black/5 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-4">
            <span>Library total: <b>{books.length}</b> books</span>
            <span>Total bookmarks: <b>{allBookmarks.length}</b></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      {/* Import / Create Book Submodal */}
      {showImportModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-black/10 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-black/5">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#007AFF]" />
                <span>Add Book to Personal Library</span>
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick File Import Dropzone */}
            <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#007AFF] bg-slate-50 text-center space-y-2 relative transition-colors">
              <UploadCloud className="w-8 h-8 text-[#007AFF] mx-auto" />
              <p className="text-xs font-bold text-slate-700">Import Local EPUB, Markdown or Text File</p>
              <p className="text-[11px] text-slate-400">Drag file here or click to choose from computer</p>
              <input
                type="file"
                accept=".epub,.md,.txt,.markdown"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-bold uppercase">Or create entry manually</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleCreateBookSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={importTitle}
                  onChange={(e) => setImportTitle(e.target.value)}
                  placeholder="e.g. Clean Code Principles"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Author</label>
                  <input
                    type="text"
                    value={importAuthor}
                    onChange={(e) => setImportAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Shelf</label>
                  <select
                    value={importShelf}
                    onChange={(e) => setImportShelf(e.target.value as BookShelf)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 text-slate-800"
                  >
                    <option value="To Read">To Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Favorites">Favorites</option>
                    <option value="Technical">Technical</option>
                    <option value="Classics">Classics</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#007AFF] text-white rounded-xl hover:bg-[#0062CC] shadow-xs"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
