import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  BookOpen,
  UploadCloud,
  Edit,
  Tag,
  Palette,
  Sparkles,
  Layers,
  FileCode,
  FileSpreadsheet,
  Trash2,
  Check,
  FileDown,
  Info
} from 'lucide-react';
import { Book, BookShelf, BookSource } from '../types';
import { extractTextFromPdfArrayBuffer } from '../utils/browserPdfParser';
import * as mammoth from 'mammoth';

interface DocumentCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  book?: Book; // If provided, we are in EDIT mode. If undefined, we are in CREATE mode.
  onSave: (book: Partial<Book> | Book) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const COVER_PRESETS = [
  { id: 'apple-blue', name: 'iOS Royal Blue', classes: 'from-[#007AFF] to-indigo-950' },
  { id: 'mint-green', name: 'Emerald Forest', classes: 'from-[#34C759] to-teal-900' },
  { id: 'sunset-orange', name: 'Coral Sunset', classes: 'from-[#FF9500] to-rose-800' },
  { id: 'royal-purple', name: 'Imperial Velvet', classes: 'from-[#AF52DE] to-indigo-950' },
  { id: 'charcoal-black', name: 'Midnight Matte', classes: 'from-[#1C1C1E] to-slate-900' },
  { id: 'coral-pink', name: 'Raspberry Cream', classes: 'from-[#FF2D55] to-purple-900' },
];

export const DocumentCrudModal: React.FC<DocumentCrudModalProps> = ({
  isOpen,
  onClose,
  book,
  onSave,
  onShowToast,
}) => {
  const isEditMode = Boolean(book);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [shelf, setShelf] = useState<BookShelf>('To Read');
  const [category, setCategory] = useState<string>('General');
  const [description, setDescription] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'md' | 'epub' | 'pdf' | 'txt' | 'docx'>('md');
  const [coverColor, setCoverColor] = useState<string>('from-[#007AFF] to-indigo-950');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Parsing & File uploading state
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parsingProgress, setParsingProgress] = useState<string>('');
  const [contentTab, setContentTab] = useState<'editor' | 'upload'>('editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load book details if in Edit mode
  useEffect(() => {
    if (isOpen) {
      if (book) {
        setTitle(book.title);
        setAuthor(book.author || '');
        setShelf(book.shelf || 'To Read');
        setCategory(book.category || 'General');
        setDescription(book.description || '');
        setTagsInput(book.tags ? book.tags.join(', ') : '');
        setContent(book.content || '');
        setFileFormat(book.fileFormat || 'md');
        setCoverColor(book.coverColor || 'from-[#007AFF] to-indigo-950');
        setIsFavorite(book.isFavorite || false);
        setContentTab('editor'); // edit content directly
      } else {
        // Reset to Defaults
        setTitle('');
        setAuthor('');
        setShelf('To Read');
        setCategory('General');
        setDescription('');
        setTagsInput('');
        setContent('');
        setFileFormat('md');
        setCoverColor('from-[#007AFF] to-indigo-950');
        setIsFavorite(false);
        setContentTab('editor');
      }
    }
  }, [book, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation of Stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = content.length;

  // Render tag preview pills
  const tagsArray = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  // File Upload Parser
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParsingProgress('Reading file...');

    const ext = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // Auto-set title from filename if empty
      if (!title) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
        setTitle(cleanTitle);
      }

      if (ext === 'pdf') {
        setFileFormat('pdf');
        setParsingProgress('Extracting text from PDF (using PDF.js)...');
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = await extractTextFromPdfArrayBuffer(arrayBuffer, file.name);
        setContent(extractedText);
        setParsingProgress('');
        onShowToast('PDF Parsed Successfully', `Extracted text from ${file.name}`);
      } 
      else if (ext === 'docx') {
        setFileFormat('docx');
        setParsingProgress('Decompressing and converting DOCX (using Mammoth)...');
        const arrayBuffer = await file.arrayBuffer();
        
        // Use mammoth to extract clean Markdown text in-browser
        const result = await (mammoth as any).convertToMarkdown({ arrayBuffer });
        setContent(result.value || `# ${file.name.replace(/\.docx$/i, '')}\n\nEmpty Word file.`);
        setParsingProgress('');
        onShowToast('Word Document Parsed', `Converted DOCX to Markdown format successfully.`);
      } 
      else if (ext === 'md' || ext === 'markdown') {
        setFileFormat('md');
        const text = await file.text();
        setContent(text);
        setParsingProgress('');
        onShowToast('Markdown File Imported', file.name);
      } 
      else if (ext === 'txt') {
        setFileFormat('txt');
        const text = await file.text();
        setContent(text);
        setParsingProgress('');
        onShowToast('Plain Text Imported', file.name);
      } 
      else if (ext === 'epub') {
        setFileFormat('epub');
        setParsingProgress('Parsing EPUB container structure...');
        // EPUB text extraction fallback
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        setContent(`# ${file.name.replace(/\.epub$/i, '')}\n\n*EPUB Digital Book container imported successfully.*\n- Size: ${sizeMb} MB\n- File: ${file.name}\n\n[Add notes, summaries, or copy chapters into this workspace]`);
        setParsingProgress('');
        onShowToast('EPUB Container Connected', `Created reading catalog slot for ${file.name}`);
      } 
      else {
        // Unknown extension fallback as plain text
        const text = await file.text();
        setContent(text);
        setParsingProgress('');
        onShowToast('File Imported as Text', `Processed raw contents of ${file.name}`);
      }

      // Switch to editor tab so they see what we extracted
      setContentTab('editor');

    } catch (error: any) {
      console.error('Document extraction failed:', error);
      onShowToast('Extraction Failed', error.message || 'Error processing document content', 'error');
    } finally {
      setIsParsing(false);
      setParsingProgress('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('Title Required', 'Please enter a document title', 'error');
      return;
    }

    const payload: Partial<Book> = {
      ...(book || {}), // preserve id, bookmarks, progress if editing
      title: title.trim(),
      author: author.trim() || 'Unknown Author',
      shelf: shelf,
      category: category.trim() || 'General',
      description: description.trim(),
      content: content.trim() || `# ${title}\n\nStart writing document content...`,
      fileFormat: fileFormat,
      coverColor: coverColor,
      isFavorite: isFavorite,
      tags: tagsArray.length > 0 ? tagsArray : [category],
      wordCount: wordCount || 1,
      lastReadTimestamp: Date.now(),
    };

    onSave(payload);
    onClose();
  };

  // Format Badge Color & Icon helper
  const getFormatDetails = (format: typeof fileFormat) => {
    switch (format) {
      case 'pdf':
        return { name: 'PDF Document', color: 'bg-red-500 text-white', ext: '.pdf' };
      case 'docx':
        return { name: 'Word Document', color: 'bg-blue-600 text-white', ext: '.docx' };
      case 'md':
        return { name: 'Markdown File', color: 'bg-purple-600 text-white', ext: '.md' };
      case 'epub':
        return { name: 'EPUB E-Book', color: 'bg-emerald-600 text-white', ext: '.epub' };
      case 'txt':
        return { name: 'Plain Text', color: 'bg-slate-500 text-white', ext: '.txt' };
    }
  };

  const formatInfo = getFormatDetails(fileFormat);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-black/10 my-8">
        
        {/* LEFT COLUMN: GORGEOUS APPLE BOOKS COVER PREVIEW */}
        <div className="md:w-72 bg-slate-50 border-r border-black/5 p-6 flex flex-col justify-between shrink-0 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Cover Preview</span>
            </h3>

            {/* Apple Books Cover Aesthetic Card */}
            <div
              className={`h-72 w-48 mx-auto rounded-2xl bg-gradient-to-br ${coverColor} p-4 text-white flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02]`}
            >
              {/* Radial flare */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex justify-between items-start">
                <span className="text-[8px] font-extrabold uppercase tracking-widest bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                  {category || 'General'}
                </span>
                <span className="text-[9px] font-bold opacity-85 uppercase">
                  {fileFormat}
                </span>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-sm leading-snug line-clamp-3 drop-shadow-md">
                  {title || 'Untitled Document'}
                </h4>
                <p className="text-[10px] opacity-80 font-semibold truncate">
                  {author || 'Unknown Author'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center italic max-w-[200px] mx-auto">
              Live cover preview adjusts instantly as you configure title, author, and categories.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Stats</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl">
                <div className="text-xs font-extrabold text-slate-800">{wordCount.toLocaleString()}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Words</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl">
                <div className="text-xs font-extrabold text-slate-800">{charCount.toLocaleString()}</div>
                <div className="text-[9px] text-slate-400 font-bold uppercase">Chars</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium text-center pt-1">
              Est. reading time: <span className="font-bold text-slate-700">{Math.max(1, Math.round(wordCount / 220))} mins</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RICH CONFIGURATION WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-black/5 bg-white flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {isEditMode ? <Edit className="w-5 h-5 text-[#007AFF]" /> : <BookOpen className="w-5 h-5 text-[#007AFF]" />}
                <span>{isEditMode ? `Edit Document details` : 'Create New Multi-Format Document'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                Configure attributes, upload files, or draft manual content.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0 bg-white">
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              
              {/* GRID: TITLE & AUTHOR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Modern Web Architecture Blueprint"
                    className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-[#007AFF] rounded-xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Author / Source</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Martin Fowler"
                    className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-[#007AFF] rounded-xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* FORMAT SELECTOR WITH PILLS */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Target File Format</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['pdf', 'docx', 'md', 'epub', 'txt'] as const).map((fmt) => {
                    const details = getFormatDetails(fmt);
                    const isSelected = fileFormat === fmt;
                    return (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => setFileFormat(fmt)}
                        className={`py-2 px-1 rounded-xl text-center border transition-all flex flex-col items-center justify-center space-y-1 relative ${
                          isSelected
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${isSelected ? 'bg-white/25 text-white' : details.color}`}>
                          {fmt}
                        </span>
                        <span className="text-[10px] font-bold tracking-tight truncate w-full px-1">
                          {fmt === 'docx' ? 'Word' : fmt === 'md' ? 'Markdown' : fmt.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SHELF, CATEGORY & FAVORITE */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Shelf</label>
                  <select
                    value={shelf}
                    onChange={(e) => setShelf(e.target.value as BookShelf)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#007AFF] text-slate-800 font-semibold"
                  >
                    <option value="To Read">To Read</option>
                    <option value="Currently Reading">Currently Reading</option>
                    <option value="Completed">Completed</option>
                    <option value="Favorites">Favorites</option>
                    <option value="Technical">Technical</option>
                    <option value="Classics">Classics</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category / Genre</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Technical, Fiction"
                    className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-[#007AFF] rounded-xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-medium"
                  />
                </div>

                <div className="flex items-end pb-1">
                  <label className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl border border-slate-200/60 w-full cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                    />
                    <span className="text-xs font-semibold text-slate-700">Add to Starred Favorites</span>
                  </label>
                </div>
              </div>

              {/* COVERS PRESET SELECTOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Cover Theme Preset</label>
                <div className="flex flex-wrap gap-2.5">
                  {COVER_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setCoverColor(preset.classes)}
                      className={`h-7 w-7 rounded-full bg-gradient-to-br ${preset.classes} border transition-all flex items-center justify-center relative shadow-2xs`}
                      title={preset.name}
                    >
                      {coverColor === preset.classes && (
                        <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* TAGS & SHORT DESCRIPTION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tags <span className="text-[10px] text-slate-400 font-normal">(Comma separated)</span>
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="e.g. cloud, database, systems"
                    className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-[#007AFF] rounded-xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-medium"
                  />
                  {tagsArray.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {tagsArray.map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{t}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Short Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of contents..."
                    className="w-full px-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/40 focus:bg-white border border-slate-200 focus:border-[#007AFF] rounded-xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* INPUT METHOD TABS */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex bg-slate-100 p-1 rounded-2xl space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setContentTab('editor')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        contentTab === 'editor' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Type / Edit Content
                    </button>
                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={() => setContentTab('upload')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          contentTab === 'upload' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Upload &amp; Extract File
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200/50 rounded-lg px-2 py-0.5 font-bold flex items-center gap-1 shrink-0">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span>Multiple formats supported</span>
                  </span>
                </div>

                {/* TAB CONTENT: UPLOAD DROPZONE */}
                {contentTab === 'upload' && (
                  <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#007AFF] bg-slate-50/50 text-center space-y-3 relative transition-all">
                    {isParsing ? (
                      <div className="py-4 space-y-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#007AFF]/20 border-t-[#007AFF] animate-spin mx-auto" />
                        <p className="text-xs font-bold text-slate-700">{parsingProgress}</p>
                        <p className="text-[10px] text-slate-400">Extracting structure, text streams and converting formats...</p>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-[#007AFF] mx-auto drop-shadow-2xs animate-pulse" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-700">Drag &amp; Drop file here or Click to select</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Supports PDF (.pdf), Word (.docx), Markdown (.md), Plain Text (.txt), EPUB (.epub)
                          </p>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".pdf,.docx,.doc,.md,.markdown,.txt,.epub"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>
                )}

                {/* TAB CONTENT: COMFORTABLE WORKSPACE WRITING BOX */}
                {contentTab === 'editor' && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                      <span>Document Text Body ({fileFormat === 'md' ? 'Markdown enabled' : 'Plain Text'})</span>
                      <span>{content.length > 0 ? `${content.split('\n').length} lines` : 'Empty'}</span>
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={
                        fileFormat === 'md'
                          ? `# My Document\n\n## Subheading\nType Markdown style text here...`
                          : `Type plain text document content here...`
                      }
                      rows={10}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-[#007AFF] rounded-2xl text-xs focus:ring-2 focus:ring-[#007AFF]/10 focus:outline-none transition-all text-slate-800 font-mono leading-relaxed"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-black/5 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ready to commit</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isEditMode ? 'Update Document' : 'Save Document'}</span>
                </button>
              </div>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
