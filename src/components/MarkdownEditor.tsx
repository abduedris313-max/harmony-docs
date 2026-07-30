import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Columns,
  Code2,
  Eye,
  FileCheck,
  List,
  Sparkles,
  BookOpen,
  Clock,
  FileText,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Search,
} from 'lucide-react';
import { MarkdownToolbar } from './MarkdownToolbar';
import { ExportPanel } from './ExportPanel';
import { AiRefineToolbar } from './AiRefineToolbar';
import { MarkdownHelpModal } from './MarkdownHelpModal';
import { FindAndReplaceBar } from './FindAndReplaceBar';
import { TableBuilderModal } from './TableBuilderModal';
import { FloatingToolMenu } from './FloatingToolMenu';
import { ViewMode, AiAction, DocumentStats } from '../types';
import { renderMarkdownToHtml } from '../utils/markdownParser';

interface MarkdownEditorProps {
  markdown: string;
  onChangeMarkdown: (newMarkdown: string) => void;
  filename: string;
  pdfDataUrl?: string;
  onRefineMarkdown: (action: AiAction, customPrompt?: string, targetLanguage?: string) => Promise<void>;
  isRefining: boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  lastAutoSaveTime?: number | null;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  markdown,
  onChangeMarkdown,
  filename,
  pdfDataUrl,
  onRefineMarkdown,
  isRefining,
  onShowToast,
  lastAutoSaveTime,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAiToolbar, setShowAiToolbar] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut for Ctrl+F / Cmd+F Find & Replace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate stats
  const stats: DocumentStats = useMemo(() => {
    const trimmed = markdown.trim();
    const wordCount = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    const charCount = markdown.length;
    const lineCount = markdown.split('\n').length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);
    return { wordCount, charCount, lineCount, readingTimeMinutes };
  }, [markdown]);

  // Extract Heading Outline
  const headings = useMemo(() => {
    const lines = markdown.split('\n');
    const result: { id: string; text: string; level: number; lineIndex: number }[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        result.push({ id, text, level, lineIndex: index });
      }
    });
    return result;
  }, [markdown]);

  // Handle Tab key in textarea for clean editing
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = markdown.substring(0, start) + '  ' + markdown.substring(end);
      onChangeMarkdown(newValue);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Helper to insert formatting snippets at cursor position
  const handleInsertText = (before: string, after: string = '', defaultText: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdown.substring(start, end) || defaultText;

    const replacement = before + selectedText + after;
    const newMarkdown = markdown.substring(0, start) + replacement + markdown.substring(end);

    onChangeMarkdown(newMarkdown);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  // Clean extra blank lines and trailing whitespace
  const handleCleanFormat = () => {
    const cleaned = markdown
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
    onChangeMarkdown(cleaned);
    onShowToast('Formatting Cleaned', 'Trimmed excess whitespace and duplicate empty lines');
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      onShowToast('Copied to Clipboard', 'Entire Markdown content copied');
    } catch {
      onShowToast('Copy Failed', 'Failed to copy', 'error');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all Markdown text?')) {
      onChangeMarkdown('');
      onShowToast('Cleared', 'Document text cleared');
    }
  };

  // Render HTML preview string using enhanced GFM & syntax highlighter
  const renderedHtml = useMemo(() => {
    return renderMarkdownToHtml(markdown);
  }, [markdown]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3">
      
      {/* Top Document Header Bar */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-3 flex flex-wrap items-center justify-between gap-3 text-slate-800 shadow-sm">
        
        {/* Document Title & File Info */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs">
            PDF
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <span>{filename || 'Converted Document.md'}</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-mono font-medium">
                {stats.wordCount} words
              </span>
            </h2>
            <div className="flex flex-wrap items-center space-x-3 text-[11px] text-slate-500">
              <span>{stats.charCount} chars</span>
              <span>•</span>
              <span>{stats.lineCount} lines</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                ~{stats.readingTimeMinutes} min read
              </span>
              {lastAutoSaveTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium text-[10px]">
                    <Check className="w-3 h-3" />
                    Auto-saved {new Date(lastAutoSaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'split'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Split Editor & Preview"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>

          <button
            onClick={() => setViewMode('editor')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'editor'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Editor Only"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Editor</span>
          </button>

          <button
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
              viewMode === 'preview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Preview Only"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {pdfDataUrl && (
            <button
              onClick={() => setViewMode('compare')}
              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 transition-colors ${
                viewMode === 'compare'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Compare with Original PDF"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">PDF Side-by-Side</span>
            </button>
          )}

          <div className="w-px h-4 bg-slate-300 mx-1" />

          <button
            onClick={() => setShowOutline(!showOutline)}
            className={`p-1.5 rounded transition-colors ${
              showOutline ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Document Heading Outline"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* AI Refinement Toolbar (collapsible) */}
      {showAiToolbar && (
        <AiRefineToolbar
          onRefineMarkdown={onRefineMarkdown}
          isRefining={isRefining}
          onClose={() => setShowAiToolbar(false)}
        />
      )}

      {/* Find and Replace Bar (collapsible) */}
      {showSearch && (
        <FindAndReplaceBar
          markdown={markdown}
          onChangeMarkdown={onChangeMarkdown}
          textareaRef={textareaRef}
          onClose={() => setShowSearch(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* Formatting Toolbar */}
      <MarkdownToolbar
        onInsertText={handleInsertText}
        onCleanFormat={handleCleanFormat}
        onCopyAll={handleCopyAll}
        onClear={handleClear}
        onToggleAiDrawer={() => setShowAiToolbar(!showAiToolbar)}
        onOpenHelp={() => setShowHelpModal(true)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onOpenTableBuilder={() => setShowTableBuilder(true)}
      />

      {/* Main Content View (Editor + Preview) */}
      <div className="flex-1 bg-white border-x border-slate-200 grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
        
        {/* Document Headings Outline Panel */}
        {showOutline && (
          <div className="absolute top-0 right-0 z-20 w-64 h-full bg-white/95 border-l border-slate-200 p-3 shadow-xl overflow-y-auto backdrop-blur-md">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                Table of Contents
              </span>
              <button
                onClick={() => setShowOutline(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                &times;
              </button>
            </div>

            {headings.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">No headings found in document</p>
            ) : (
              <div className="space-y-1">
                {headings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (textareaRef.current) {
                        const lines = markdown.split('\n');
                        let pos = 0;
                        for (let l = 0; l < h.lineIndex; l++) {
                          pos += lines[l].length + 1;
                        }
                        textareaRef.current.focus();
                        textareaRef.current.setSelectionRange(pos, pos + lines[h.lineIndex].length);
                      }
                    }}
                    className={`block w-full text-left text-xs hover:text-blue-600 hover:bg-slate-50 rounded px-2 py-1 transition-colors truncate ${
                      h.level === 1 ? 'font-semibold text-slate-800' : 'text-slate-600'
                    }`}
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  >
                    {h.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 1. Editor Textarea View */}
        {(viewMode === 'split' || viewMode === 'editor' || viewMode === 'compare') && (
          <div className={`h-full flex flex-col border-r border-slate-200 ${viewMode === 'editor' ? 'col-span-2' : ''}`}>
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => onChangeMarkdown(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write or paste Markdown content here..."
              className="w-full h-full bg-white text-slate-800 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none selection:bg-blue-100 selection:text-blue-900"
              spellCheck={false}
            />
          </div>
        )}

        {/* 2. Live Rendered Preview View */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            ref={previewRef}
            className={`h-full overflow-y-auto p-6 bg-slate-50/70 text-slate-800 border-l border-slate-200 ${
              viewMode === 'preview' ? 'col-span-2' : ''
            }`}
          >
            <div
              className="prose prose-slate max-w-none text-xs leading-relaxed
                prose-headings:text-slate-900 prose-headings:font-bold
                prose-h1:text-xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h1:mt-2
                prose-h2:text-lg prose-h2:border-b prose-h2:border-slate-200 prose-h2:pb-1.5
                prose-h3:text-base prose-h3:text-blue-700
                prose-p:text-slate-700 prose-p:my-2
                prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800
                prose-code:text-blue-800 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/50 prose-blockquote:py-1 prose-blockquote:px-3 prose-blockquote:text-slate-600 prose-blockquote:italic
                prose-table:w-full prose-table:border-collapse prose-table:my-4
                prose-th:bg-slate-100 prose-th:border prose-th:border-slate-200 prose-th:p-2.5 prose-th:text-slate-900 prose-th:font-semibold
                prose-td:border prose-td:border-slate-200 prose-td:p-2 prose-td:text-slate-700
                prose-img:rounded-xl prose-img:border prose-img:border-slate-200 prose-img:mx-auto"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        )}

        {/* 3. Original PDF Side-by-Side Compare Mode */}
        {viewMode === 'compare' && pdfDataUrl && (
          <div className="h-full bg-slate-50 border-l border-slate-200 flex flex-col">
            <div className="bg-white px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Original PDF View</span>
              <span>Compare against Markdown</span>
            </div>
            <iframe
              src={pdfDataUrl}
              className="w-full h-full border-0 bg-slate-100"
              title="Original PDF Document"
            />
          </div>
        )}

      </div>

      {/* Bottom Export Bar */}
      <div className="rounded-b-xl overflow-hidden shadow-lg border-t-0">
        <ExportPanel
          markdown={markdown}
          filename={filename}
          onShowToast={onShowToast}
        />
      </div>

      {/* Floating Action Menu for Quick Tools */}
      <FloatingToolMenu
        onOpenTableBuilder={() => setShowTableBuilder(true)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onCleanFormat={handleCleanFormat}
        onToggleAiDrawer={() => setShowAiToolbar(!showAiToolbar)}
        onOpenHelp={() => setShowHelpModal(true)}
        onCopyAll={handleCopyAll}
      />

      {/* Markdown Quick Reference Help Modal */}
      <MarkdownHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        onInsertSnippet={(snippet) => handleInsertText(snippet)}
      />

      {/* Interactive Table Builder GUI Modal */}
      <TableBuilderModal
        isOpen={showTableBuilder}
        onClose={() => setShowTableBuilder(false)}
        onInsertTable={(tableMd) => handleInsertText(tableMd)}
      />

    </div>
  );
};
