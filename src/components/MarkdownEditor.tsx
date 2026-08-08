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
import { TableOfContentsPanel, HeadingItem } from './TableOfContentsPanel';
import { SpellcheckPanel } from './SpellcheckPanel';
import { detectTyposInMarkdown, TypoItem } from '../utils/spellchecker';
import { MarkdownLinterPanel } from './MarkdownLinterPanel';
import { lintMarkdownSyntax, fixAllMarkdownIssues, MarkdownIssue } from '../utils/markdownLinter';
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
  onOpenBookLibrary?: () => void;
  onOpenPdfEditor?: () => void;
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
  onOpenBookLibrary,
  onOpenPdfEditor,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isMobile, setIsMobile] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    checkMobile();
    setShowExport(window.innerWidth >= 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === 'split') {
      setViewMode('editor');
    }
  }, [isMobile, viewMode]);

  const [showAiToolbar, setShowAiToolbar] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTableBuilder, setShowTableBuilder] = useState(false);
  const [showSpellcheck, setShowSpellcheck] = useState(false);
  const [showLinterPanel, setShowLinterPanel] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const handleToggleZenMode = () => {
    const next = !isZenMode;
    setIsZenMode(next);
    if (next) {
      setShowOutline(false);
      setShowSpellcheck(false);
      setShowLinterPanel(false);
      setShowAiToolbar(false);
      setShowSearch(false);
      onShowToast('Zen Mode Activated', 'Distraction-free full-screen writing mode. Press Esc to exit.', 'info');
    } else {
      onShowToast('Exited Zen Mode', undefined, 'info');
    }
  };

  // Keyboard shortcut for Esc key to exit Zen Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
        onShowToast('Exited Zen Mode', undefined, 'info');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isZenMode, onShowToast]);

  // Custom User Dictionary for Spellchecking
  const [userDictionary, setUserDictionary] = useState<Set<string>>(
    () => new Set(['ais', 'applet', 'workflow', 'dev'])
  );

  // Editor Theme Style State ('document' paper-like vs 'code' monospaced)
  const [editorTheme, setEditorTheme] = useState<'document' | 'code'>('document');

  // iOS Reader Preferences State
  const [readerTheme, setReaderTheme] = useState<'paper' | 'sepia' | 'dark'>('paper');
  const [readerFontSize, setReaderFontSize] = useState<number>(15);

  // Text Direction & Language Detection State
  const [textDirection, setTextDirection] = useState<'auto' | 'rtl' | 'ltr'>('auto');

  const autoDetectInfo = useMemo(() => {
    if (!markdown) {
      return { detectedLang: 'English / Standard', isRtl: false, autoIsRtl: false };
    }
    const arabicChars = (markdown.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
    const amharicChars = (markdown.match(/[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/g) || []).length;
    const totalLetters = (markdown.match(/[\p{L}]/gu) || []).length || 1;

    if (arabicChars > amharicChars && arabicChars > 5 && (arabicChars / totalLetters > 0.05 || arabicChars > 10)) {
      return { detectedLang: 'Arabic (العربية)', isRtl: true, autoIsRtl: true };
    }
    if (amharicChars > arabicChars && amharicChars > 5 && (amharicChars / totalLetters > 0.05 || amharicChars > 10)) {
      return { detectedLang: 'Amharic (አማርኛ)', isRtl: false, autoIsRtl: false };
    }
    return { detectedLang: 'English / Standard', isRtl: false, autoIsRtl: false };
  }, [markdown]);

  const computedDirection = useMemo(() => {
    if (textDirection === 'rtl') return 'rtl';
    if (textDirection === 'ltr') return 'ltr';
    return autoDetectInfo.isRtl ? 'rtl' : 'ltr';
  }, [textDirection, autoDetectInfo]);

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

  // Active selected heading ID for TOC navigation
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // Extract Heading Outline (H1 - H6)
  const headings = useMemo(() => {
    const lines = markdown.split('\n');
    const result: HeadingItem[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        result.push({ id, text, level, lineIndex: index });
      }
    });
    return result;
  }, [markdown]);

  // Jump to specific section from Table of Contents
  const handleSelectHeading = (heading: HeadingItem) => {
    setActiveHeadingId(heading.id);

    // 1. Scroll and select in Editor Textarea
    if (textareaRef.current) {
      const lines = markdown.split('\n');
      let pos = 0;
      for (let l = 0; l < heading.lineIndex; l++) {
        pos += lines[l].length + 1;
      }
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + lines[heading.lineIndex].length);

      const lineHeight = 18;
      textareaRef.current.scrollTop = Math.max(0, heading.lineIndex * lineHeight - 80);
    }

    // 2. Scroll into view in Live HTML Preview
    if (previewRef.current) {
      const targetElement =
        previewRef.current.querySelector(`#${CSS.escape(heading.id)}`) ||
        previewRef.current.querySelector(`[data-heading-id="${CSS.escape(heading.id)}"]`);

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Flash ring highlight
        targetElement.classList.add('ring-2', 'ring-[#007AFF]', 'ring-offset-2', 'rounded-lg', 'transition-all');
        setTimeout(() => {
          targetElement.classList.remove('ring-2', 'ring-[#007AFF]', 'ring-offset-2', 'rounded-lg');
        }, 2000);
      }
    }
  };

  // Insert a generated Markdown Table of Contents block into the document
  const handleInsertTocMarkdown = () => {
    if (headings.length === 0) {
      onShowToast('No Headings Found', 'Add headings like # Heading 1 to your document first', 'info');
      return;
    }

    const tocList = headings
      .map((h) => `${'  '.repeat(h.level - 1)}- [${h.text}](#${h.id})`)
      .join('\n');

    const tocMarkdown = `\n## Table of Contents\n${tocList}\n\n`;
    handleInsertText(tocMarkdown, '');
    onShowToast('TOC Inserted', 'Added Markdown Table of Contents block to document');
  };

  // Detect Typos with Dictionary Engine
  const typos = useMemo(() => {
    return detectTyposInMarkdown(markdown, userDictionary);
  }, [markdown, userDictionary]);

  // Jump to and select typo in editor
  const handleJumpToTypo = (typo: TypoItem) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(typo.startPos, typo.endPos);

      const lines = markdown.substring(0, typo.startPos).split('\n');
      const lineIdx = lines.length - 1;
      const lineHeight = 20;
      textareaRef.current.scrollTop = Math.max(0, lineIdx * lineHeight - 60);
    }
  };

  // Replace typo with suggested correction
  const handleReplaceTypo = (typo: TypoItem, replacement: string) => {
    const before = markdown.substring(0, typo.startPos);
    const after = markdown.substring(typo.endPos);
    const newMarkdown = before + replacement + after;
    onChangeMarkdown(newMarkdown);
    onShowToast('Typo Corrected', `Replaced "${typo.word}" with "${replacement}"`);
  };

  // Add word to custom dictionary
  const handleAddToDictionary = (word: string) => {
    setUserDictionary((prev) => {
      const next = new Set(prev);
      next.add(word.toLowerCase());
      return next;
    });
    onShowToast('Added to Dictionary', `Word "${word}" will no longer be flagged as a typo`);
  };

  // Auto-Detect Markdown Syntax & Formatting Issues
  const syntaxIssues = useMemo(() => {
    return lintMarkdownSyntax(markdown);
  }, [markdown]);

  // Jump to and select syntax issue line in editor
  const handleJumpToIssue = (issue: MarkdownIssue) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(issue.startPos, issue.endPos);

      const lineHeight = 20;
      textareaRef.current.scrollTop = Math.max(0, issue.lineIndex * lineHeight - 60);
    }
  };

  // Fix single syntax issue
  const handleFixIssue = (issue: MarkdownIssue) => {
    if (issue.autoFixable && issue.suggestedFix) {
      if (issue.ruleId === 'unclosed-code-block') {
        onChangeMarkdown(`${markdown.trimEnd()}\n\`\`\`\n`);
      } else {
        const lines = markdown.split('\n');
        lines[issue.lineIndex] = issue.suggestedFix;
        onChangeMarkdown(lines.join('\n'));
      }
      onShowToast('Formatting Issue Fixed', `Applied fix for line ${issue.lineIndex + 1}`);
    }
  };

  // Fix all auto-fixable syntax issues
  const handleFixAllIssues = () => {
    const { newMarkdown, fixedCount } = fixAllMarkdownIssues(markdown);
    if (fixedCount > 0) {
      onChangeMarkdown(newMarkdown);
      onShowToast('Auto-Fix Applied', `Fixed ${fixedCount} Markdown formatting issue${fixedCount === 1 ? '' : 's'}`);
    } else {
      onShowToast('No Fixable Issues', 'No auto-fixable syntax issues were detected', 'info');
    }
  };

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
    <div
      className={
        isZenMode
          ? `fixed inset-0 z-50 flex flex-col transition-colors duration-300 overflow-hidden ${
              readerTheme === 'dark'
                ? 'bg-[#121214] text-[#F2F2F7]'
                : readerTheme === 'sepia'
                ? 'bg-[#F4EFE6] text-[#433422]'
                : 'bg-[#F4F4F6] text-slate-900'
            }`
          : 'flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-3'
      }
    >
      {/* Top Header Bar */}
      {isZenMode ? (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 px-4 py-2.5 flex items-center justify-between shadow-xs z-10 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-purple-600/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Zen Mode</span>
            </div>
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate max-w-xs">
              {filename || 'Document.md'}
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-mono">
              {stats.wordCount} words • ~{stats.readingTimeMinutes} min read
            </span>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Theme Picker */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-full">
              <button
                onClick={() => setReaderTheme('paper')}
                className={`w-4 h-4 rounded-full border border-slate-300 bg-white ${
                  readerTheme === 'paper' ? 'ring-2 ring-purple-600 scale-110' : ''
                }`}
                title="Paper White Theme"
              />
              <button
                onClick={() => setReaderTheme('sepia')}
                className={`w-4 h-4 rounded-full border border-amber-300 bg-[#F8F1E5] ${
                  readerTheme === 'sepia' ? 'ring-2 ring-purple-600 scale-110' : ''
                }`}
                title="Warm Sepia Theme"
              />
              <button
                onClick={() => setReaderTheme('dark')}
                className={`w-4 h-4 rounded-full border border-slate-700 bg-slate-800 ${
                  readerTheme === 'dark' ? 'ring-2 ring-purple-600 scale-110' : ''
                }`}
                title="Dark Theme"
              />
            </div>

            {/* View Mode Segmented Controls */}
            <div className="flex items-center p-1 bg-slate-200/70 dark:bg-zinc-800 rounded-full text-xs font-semibold">
              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'editor'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Editor Only"
              >
                Editor
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Split View"
              >
                Split
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-full transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="iOS Reader View"
              >
                Reader
              </button>
            </div>

            {/* Exit Zen Mode Button */}
            <button
              onClick={handleToggleZenMode}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all active:scale-95"
              title="Exit Zen Mode (Press Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Zen Mode</span>
              <kbd className="hidden sm:inline-block text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono ml-0.5">
                Esc
              </kbd>
            </button>
          </div>
        </div>
      ) : (
        /* Top iOS Document Reader Header Bar */
        <div className="bg-white/90 backdrop-blur-md border border-black/5 rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-slate-800 shadow-xs">
          
          {/* Document Title & File Info */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 tracking-tight">
                <span>{filename || 'Converted Document.md'}</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {stats.wordCount} words
                </span>
              </h2>
              <div className="flex flex-wrap items-center space-x-2.5 text-[11px] text-slate-500">
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
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium text-[10px]">
                      <Check className="w-3 h-3" />
                      Auto-saved {new Date(lastAutoSaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Controls: iOS Segmented Control + Reader Appearance */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Zen Mode Button */}
            <button
              onClick={handleToggleZenMode}
              className="px-3 py-1 rounded-full flex items-center space-x-1.5 transition-all text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 shadow-2xs"
              title="Zen Mode (Distraction-Free Full-Screen Writing)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Zen Mode</span>
            </button>

            {/* iOS Reader Font Size & Theme Picker (Visible in Preview/Split mode) */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex items-center space-x-1.5 bg-[#E5E5EA]/70 p-1 rounded-full border border-slate-200/50">
                
                {/* Font Size decrease/increase */}
                <button
                  onClick={() => setReaderFontSize((prev) => Math.max(12, prev - 1))}
                  className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-full hover:bg-white/80 transition-colors"
                  title="Decrease font size"
                >
                  A-
                </button>
                <span className="text-[10px] text-slate-500 font-mono select-none">{readerFontSize}px</span>
                <button
                  onClick={() => setReaderFontSize((prev) => Math.min(24, prev + 1))}
                  className="px-2 py-0.5 text-xs font-bold text-slate-700 hover:text-slate-900 rounded-full hover:bg-white/80 transition-colors"
                  title="Increase font size"
                >
                  A+
                </button>

                <div className="w-px h-3.5 bg-slate-300/80 mx-0.5" />

                {/* iOS Themes */}
                <button
                  onClick={() => setReaderTheme('paper')}
                  className={`w-4 h-4 rounded-full border border-slate-300 bg-white transition-transform ${
                    readerTheme === 'paper' ? 'scale-125 ring-2 ring-[#007AFF]' : ''
                  }`}
                  title="Paper White Theme"
                />
                <button
                  onClick={() => setReaderTheme('sepia')}
                  className={`w-4 h-4 rounded-full border border-amber-300 bg-[#F8F1E5] transition-transform ${
                    readerTheme === 'sepia' ? 'scale-125 ring-2 ring-[#007AFF]' : ''
                  }`}
                  title="Warm Sepia Theme"
                />
                <button
                  onClick={() => setReaderTheme('dark')}
                  className={`w-4 h-4 rounded-full border border-slate-700 bg-slate-800 transition-transform ${
                    readerTheme === 'dark' ? 'scale-125 ring-2 ring-[#007AFF]' : ''
                  }`}
                  title="Dark Night Theme"
                />
              </div>
            )}

            {/* iOS Segmented Control */}
            <div className="flex items-center p-1 bg-[#E3E3E8] rounded-full text-xs font-semibold shadow-inner">
              {!isMobile && (
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 rounded-full flex items-center space-x-1 transition-all ${
                    viewMode === 'split'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Split Editor & Preview"
                >
                  <Columns className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span className="hidden sm:inline">Split</span>
                </button>
              )}

              <button
                onClick={() => setViewMode('editor')}
                className={`px-3 py-1 rounded-full flex items-center space-x-1 transition-all ${
                  viewMode === 'editor'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Editor Only"
              >
                <Code2 className="w-3.5 h-3.5 text-[#007AFF]" />
                <span className="hidden sm:inline">Editor</span>
              </button>

              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded-full flex items-center space-x-1 transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="iOS Reader View"
              >
                <Eye className="w-3.5 h-3.5 text-[#007AFF]" />
                <span className="hidden sm:inline">iOS Reader</span>
              </button>

              {pdfDataUrl && (
                <button
                  onClick={() => setViewMode('compare')}
                  className={`px-3 py-1 rounded-full flex items-center space-x-1 transition-all ${
                    viewMode === 'compare'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Compare with Original PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">PDF Compare</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowOutline(!showOutline)}
              className={`p-2 rounded-full transition-all ${
                showOutline ? 'bg-[#007AFF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/70'
              }`}
              title="Document Heading Outline"
            >
              <List className="w-4 h-4" />
            </button>

          </div>

        </div>
      )}

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
        editorTheme={editorTheme}
        onChangeEditorTheme={setEditorTheme}
        onToggleSpellcheck={() => setShowSpellcheck(!showSpellcheck)}
        typosCount={typos.length}
        onToggleLinter={() => setShowLinterPanel(!showLinterPanel)}
        syntaxIssuesCount={syntaxIssues.length}
        textDirection={textDirection}
        onChangeTextDirection={setTextDirection}
        detectedLangInfo={autoDetectInfo}
        onToggleZenMode={handleToggleZenMode}
        isZenMode={isZenMode}
      />

      {/* Main Content View (Editor + Preview) */}
      <div className="flex-1 bg-white border-x border-slate-200 grid grid-cols-1 md:grid-cols-2 overflow-hidden relative">
        
        {/* Dynamic Table of Contents Drawer Panel */}
        {showOutline && (
          <TableOfContentsPanel
            headings={headings}
            activeHeadingId={activeHeadingId}
            onSelectHeading={handleSelectHeading}
            onClose={() => setShowOutline(false)}
            onInsertTocMarkdown={handleInsertTocMarkdown}
          />
        )}

        {/* Spellcheck & Typos Drawer Panel */}
        {showSpellcheck && (
          <SpellcheckPanel
            typos={typos}
            userDictionary={userDictionary}
            onReplaceTypo={handleReplaceTypo}
            onAddToDictionary={handleAddToDictionary}
            onJumpToTypo={handleJumpToTypo}
            onClose={() => setShowSpellcheck(false)}
          />
        )}

        {/* Markdown Syntax & Formatting Inspector Drawer Panel */}
        {showLinterPanel && (
          <MarkdownLinterPanel
            issues={syntaxIssues}
            onFixIssue={handleFixIssue}
            onFixAllIssues={handleFixAllIssues}
            onJumpToIssue={handleJumpToIssue}
            onClose={() => setShowLinterPanel(false)}
          />
        )}

        {/* 1. Editor Textarea View (Document Paper-like vs Code Monospaced) */}
        {(viewMode === 'split' || viewMode === 'editor' || viewMode === 'compare') && (
          <div
            className={`h-full flex flex-col border-r border-slate-200/80 overflow-y-auto ${
              viewMode === 'editor' ? 'col-span-2' : ''
            } ${editorTheme === 'document' ? 'bg-[#F4F4F6] p-1.5 sm:p-6' : 'bg-white'}`}
          >
            {editorTheme === 'document' ? (
              <div className="max-w-2xl w-full mx-auto bg-white rounded-2xl shadow-sm border border-black/5 p-3.5 sm:p-10 flex-1 flex flex-col transition-all min-h-[calc(100%-1rem)]">
                <div className="text-[11px] font-semibold text-[#007AFF] uppercase tracking-wider mb-2 flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Document View Style (Paper)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Proportional typography</span>
                </div>
                <textarea
                  ref={textareaRef}
                  value={markdown}
                  onChange={(e) => onChangeMarkdown(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type or edit your document content..."
                  dir={computedDirection}
                  className="w-full flex-1 bg-transparent text-slate-900 font-sans text-sm sm:text-base leading-relaxed resize-none focus:outline-none selection:bg-[#007AFF]/20 selection:text-[#007AFF]"
                  spellCheck={true}
                />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => onChangeMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write or paste Markdown content here..."
                dir={computedDirection}
                className="w-full h-full bg-white text-slate-800 p-4 font-mono text-xs sm:text-sm leading-relaxed resize-none focus:outline-none selection:bg-blue-100 selection:text-blue-900"
                spellCheck={false}
              />
            )}
          </div>
        )}

        {/* 2. Live Rendered iOS Document Reader Preview View */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            ref={previewRef}
            className={`h-full overflow-y-auto p-4 sm:p-8 border-l border-slate-200/80 transition-colors ${
              readerTheme === 'sepia'
                ? 'bg-[#F4EFE6] text-[#433422]'
                : readerTheme === 'dark'
                ? 'bg-[#1C1C1E] text-[#F2F2F7]'
                : 'bg-[#F2F2F7] text-slate-800'
            } ${viewMode === 'preview' ? 'col-span-2' : ''}`}
          >
            <div
              className={`max-w-3xl mx-auto rounded-2xl p-6 sm:p-12 transition-all ios-page-shadow border ${
                readerTheme === 'sepia'
                  ? 'bg-[#F8F1E5] border-amber-900/10 text-[#433422]'
                  : readerTheme === 'dark'
                  ? 'bg-[#2C2C2E] border-white/10 text-[#F2F2F7]'
                  : 'bg-white border-black/5 text-slate-900'
              }`}
              style={{ fontSize: `${readerFontSize}px` }}
            >
              <div
                dir={computedDirection}
                className={`prose max-w-none leading-relaxed transition-colors
                  ${
                    readerTheme === 'dark'
                      ? 'prose-invert prose-headings:text-slate-100 prose-p:text-slate-300 prose-a:text-blue-400'
                      : readerTheme === 'sepia'
                      ? 'prose-headings:text-[#2E2214] prose-p:text-[#433422] prose-a:text-[#007AFF]'
                      : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-[#007AFF]'
                  }
                  ${computedDirection === 'rtl' ? 'text-right prose-headings:text-right prose-p:text-right' : ''}
                  prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h1:text-2xl prose-h1:border-b prose-h1:pb-3 prose-h1:mt-2
                  prose-h2:text-xl prose-h2:border-b prose-h2:pb-2
                  prose-h3:text-lg
                  prose-a:underline hover:opacity-80
                  prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                  prose-pre:rounded-xl prose-pre:p-4
                  prose-blockquote:border-l-4 prose-blockquote:border-[#007AFF] prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:italic
                  prose-table:w-full prose-table:border-collapse prose-table:my-4
                  prose-th:border prose-th:p-2.5 prose-th:font-semibold
                  prose-td:border prose-td:p-2
                  prose-img:rounded-2xl prose-img:border prose-img:border-black/5 prose-img:mx-auto`
                }
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>
        )}

        {/* 3. Original PDF Side-by-Side Compare Mode */}
        {viewMode === 'compare' && pdfDataUrl && (
          <div className="h-full bg-slate-50 border-l border-slate-200 flex flex-col">
            <div className="bg-white px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Original PDF View</span>
              <div className="flex items-center space-x-2">
                {onOpenPdfEditor && (
                  <button
                    onClick={onOpenPdfEditor}
                    className="px-2.5 py-1 rounded-full bg-[#007AFF] hover:bg-blue-600 text-white font-bold text-[10px] flex items-center space-x-1 shadow-2xs transition-all active:scale-95"
                    title="Open in Visual PDF Editor to markup, split, merge, or rotate pages"
                  >
                    <span>Edit PDF</span>
                  </button>
                )}
                <span>Compare against Markdown</span>
              </div>
            </div>
            <iframe
              src={pdfDataUrl}
              className="w-full h-full border-0 bg-slate-100"
              title="Original PDF Document"
            />
          </div>
        )}

      </div>

      {/* Bottom Export Bar (Hidden in Zen Mode to minimize distraction) */}
      {!isZenMode && (
        <div className="mt-2 shrink-0">
          <button
            onClick={() => setShowExport(!showExport)}
            className="w-full px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/50 rounded-lg flex items-center justify-between text-[11px] font-bold text-slate-600 transition-colors border border-slate-200/60"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Export & Local Save Options</span>
            </span>
            <span className="text-[10px] bg-slate-200/80 px-2 py-0.5 rounded-full font-semibold">
              {showExport ? 'Hide ▴' : 'Show ▾'}
            </span>
          </button>
          
          {showExport && (
            <div className="mt-1.5">
              <ExportPanel
                markdown={markdown}
                filename={filename}
                onShowToast={onShowToast}
              />
            </div>
          )}
        </div>
      )}

      {/* Floating Action Menu for Quick Tools */}
      <FloatingToolMenu
        onOpenTableBuilder={() => setShowTableBuilder(true)}
        onToggleSearch={() => setShowSearch(!showSearch)}
        onCleanFormat={handleCleanFormat}
        onToggleAiDrawer={() => setShowAiToolbar(!showAiToolbar)}
        onOpenHelp={() => setShowHelpModal(true)}
        onCopyAll={handleCopyAll}
        onToggleOutline={() => setShowOutline(!showOutline)}
        editorTheme={editorTheme}
        onChangeEditorTheme={setEditorTheme}
        onToggleSpellcheck={() => setShowSpellcheck(!showSpellcheck)}
        typosCount={typos.length}
        onToggleLinter={() => setShowLinterPanel(!showLinterPanel)}
        syntaxIssuesCount={syntaxIssues.length}
        onOpenBookLibrary={onOpenBookLibrary}
        onToggleZenMode={handleToggleZenMode}
        isZenMode={isZenMode}
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
