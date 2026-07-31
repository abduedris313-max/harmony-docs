import React, { useState, useEffect, useRef } from 'react';
import {
  HardDrive,
  Folder,
  FolderPlus,
  FileText,
  Trash2,
  Download,
  Upload,
  Edit3,
  Tag,
  Star,
  CheckCircle2,
  X,
  Plus,
  Search,
  CheckSquare,
  Square,
  MoveRight,
  RefreshCw,
  Database,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Book, DocumentFolder, HistoryItem, LibraryBackup } from '../types';
import { getStorageUsage } from '../utils/indexedDBStorage';

interface LocalFileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  folders: DocumentFolder[];
  history: HistoryItem[];
  onCreateFolder: (folderName: string, color?: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onUpdateBook: (updatedBook: Book) => void;
  onDeleteBook: (bookId: string) => void;
  onMoveBooksToFolder: (bookIds: string[], folderId?: string) => void;
  onExportBackup: () => void;
  onImportBackup: (backup: LibraryBackup) => void;
}

export const LocalFileManagerModal: React.FC<LocalFileManagerModalProps> = ({
  isOpen,
  onClose,
  books,
  folders,
  history,
  onCreateFolder,
  onDeleteFolder,
  onUpdateBook,
  onDeleteBook,
  onMoveBooksToFolder,
  onExportBackup,
  onImportBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'files' | 'folders' | 'backup'>('files');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('all');
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderColor, setNewFolderColor] = useState<string>('#007AFF');
  
  // Storage Usage State
  const [storageInfo, setStorageInfo] = useState<{ usedMb: number; estimateMb?: number }>({ usedMb: 0 });
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [targetMoveFolder, setTargetMoveFolder] = useState<string>('');
  
  // Edit Modal State
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editAuthor, setEditAuthor] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      getStorageUsage().then(setStorageInfo);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
  };

  const handleToggleSelectBook = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllBooks = () => {
    if (selectedBookIds.length === filteredBooks.length) {
      setSelectedBookIds([]);
    } else {
      setSelectedBookIds(filteredBooks.map((b) => b.id));
    }
  };

  const handleExecuteBulkMove = () => {
    if (selectedBookIds.length === 0) return;
    onMoveBooksToFolder(selectedBookIds, targetMoveFolder || undefined);
    setSelectedBookIds([]);
  };

  const handleExecuteBulkDelete = () => {
    if (selectedBookIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedBookIds.length} document(s)?`)) {
      selectedBookIds.forEach((id) => onDeleteBook(id));
      setSelectedBookIds([]);
    }
  };

  const handleStartEditBook = (book: Book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditTags((book.tags || []).join(', '));
  };

  const handleSaveBookEdits = () => {
    if (!editingBook) return;
    const tagArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    onUpdateBook({
      ...editingBook,
      title: editTitle.trim() || editingBook.title,
      author: editAuthor.trim() || editingBook.author,
      tags: tagArray,
    });
    setEditingBook(null);
  };

  const handleBackupFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.books || json.folders) {
          onImportBackup(json);
        } else {
          alert('Invalid backup JSON file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (book.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFolderFilter === 'all') return true;
    if (selectedFolderFilter === 'unorganized') return !book.folderId;
    return book.folderId === selectedFolderFilter;
  });

  const folderColors = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF3B30', '#5856D6', '#FF2D55'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-md">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Local File Manager & Backup</h2>
              <p className="text-xs text-slate-400">Manage offline document storage, folders, tags, & JSON backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Storage Bar & Tabs */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Navigation Tabs */}
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'files' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Documents ({books.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('folders')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'folders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-500" />
              <span>Folders ({folders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Backup & Restore</span>
            </button>
          </div>

          {/* Storage Quota Indicator */}
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
            <HardDrive className="w-4 h-4 text-[#007AFF]" />
            <span className="font-semibold">Local IndexedDB: {storageInfo.usedMb} MB used</span>
            {storageInfo.estimateMb ? <span className="text-slate-400">/ {storageInfo.estimateMb} MB</span> : null}
          </div>
        </div>

        {/* TAB 1: FILES & BULK MANAGEMENT */}
        {activeTab === 'files' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter and Bulk Actions Bar */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search local documents, authors, tags..."
                    className="w-full bg-slate-100 border border-slate-200 rounded-2xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <select
                  value={selectedFolderFilter}
                  onChange={(e) => setSelectedFolderFilter(e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="all">All Folders</option>
                  <option value="unorganized">Root / Unorganized</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBookIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 p-1.5 rounded-2xl">
                  <span className="text-xs font-bold text-[#007AFF] px-2">{selectedBookIds.length} Selected</span>
                  
                  <select
                    value={targetMoveFolder}
                    onChange={(e) => setTargetMoveFolder(e.target.value)}
                    className="bg-white border border-blue-200 rounded-xl px-2 py-1 text-xs text-slate-800"
                  >
                    <option value="">(Root)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleExecuteBulkMove}
                    className="px-2.5 py-1 rounded-xl bg-[#007AFF] text-white text-xs font-bold hover:bg-blue-600 transition-all"
                  >
                    Move
                  </button>

                  <button
                    onClick={handleExecuteBulkDelete}
                    className="p-1 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                    title="Delete Selected"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Document Table List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-3 uppercase tracking-wider mb-1">
                <button onClick={handleSelectAllBooks} className="flex items-center space-x-1.5 hover:text-slate-700">
                  {selectedBookIds.length === filteredBooks.length && filteredBooks.length > 0 ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#007AFF]" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-300" />
                  )}
                  <span>Document Title</span>
                </button>
                <span>Folder / Format / Actions</span>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No documents found matching filter.</p>
                </div>
              ) : (
                filteredBooks.map((book) => {
                  const folder = folders.find((f) => f.id === book.folderId);
                  const isSelected = selectedBookIds.includes(book.id);

                  return (
                    <div
                      key={book.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-200 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <button onClick={() => handleToggleSelectBook(book.id)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#007AFF]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{book.title}</h4>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{book.author}</span>
                            <span>•</span>
                            <span>{book.wordCount} words</span>
                            {(book.tags || []).map((tag) => (
                              <span key={tag} className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-md font-medium">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4 shrink-0">
                        {folder && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: folder.color || '#007AFF' }}
                          >
                            📁 {folder.name}
                          </span>
                        )}

                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {book.fileFormat || 'md'}
                        </span>

                        <button
                          onClick={() => handleStartEditBook(book)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                          title="Edit Metadata"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FOLDER MANAGEMENT */}
        {activeTab === 'folders' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* Create Folder Form */}
            <form onSubmit={handleCreateFolderSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <FolderPlus className="w-4 h-4 text-[#007AFF]" />
                <span>Create New Folder</span>
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder Name (e.g. Research PDFs, Work Notes, Study Guides)"
                  className="flex-1 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />

                <div className="flex items-center space-x-1">
                  {folderColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewFolderColor(color)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        newFolderColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50 shrink-0"
                >
                  Create Folder
                </button>
              </div>
            </form>

            {/* Folder Grid */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Folders</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {folders.map((folder) => {
                  const count = books.filter((b) => b.folderId === folder.id).length;
                  return (
                    <div
                      key={folder.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold shadow-2xs"
                          style={{ backgroundColor: folder.color || '#007AFF' }}
                        >
                          <Folder className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{folder.name}</h4>
                          <span className="text-[11px] text-slate-400 font-medium">{count} document(s)</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteFolder(folder.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: BACKUP & RESTORE */}
        {activeTab === 'backup' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Export Backup Card */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Export Library Backup (.json)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download a full offline JSON backup of all your saved books, folders, document notes, and conversion history.
                  </p>
                </div>

                <button
                  onClick={onExportBackup}
                  className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup File</span>
                </button>
              </div>

              {/* Restore Backup Card */}
              <div className="p-5 rounded-3xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#007AFF] flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Restore Library from Backup</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Upload a previously exported `.json` library backup file to restore your documents and folder structure.
                  </p>
                </div>

                <label className="w-full py-2.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer active:scale-95 text-center">
                  <Upload className="w-4 h-4" />
                  <span>Select JSON Backup File</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleBackupFileInput}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          </div>
        )}

        {/* Modal: Edit Metadata */}
        {editingBook && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Document Metadata</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF] mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Author / Category</label>
                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(e) => setEditAuthor(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF] mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="e.g. Work, PDF, Research, Important"
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#007AFF] mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBookEdits}
                  className="px-4 py-2 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
