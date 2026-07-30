import React from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
  Sparkles,
  Copy,
  Trash2,
  AlignLeft,
  HelpCircle,
  Search,
} from 'lucide-react';

interface MarkdownToolbarProps {
  onInsertText: (before: string, after?: string, defaultText?: string) => void;
  onCleanFormat: () => void;
  onCopyAll: () => void;
  onClear: () => void;
  onToggleAiDrawer: () => void;
  onOpenHelp?: () => void;
  onToggleSearch?: () => void;
  onOpenTableBuilder?: () => void;
}

export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({
  onInsertText,
  onCleanFormat,
  onCopyAll,
  onClear,
  onToggleAiDrawer,
  onOpenHelp,
  onToggleSearch,
  onOpenTableBuilder,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex flex-wrap items-center justify-between gap-1 text-slate-600">
      
      {/* Basic Formatting Group */}
      <div className="flex flex-wrap items-center gap-1">
        
        {/* Headings */}
        <button
          onClick={() => onInsertText('# ', '', 'Heading 1')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded font-bold transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('## ', '', 'Heading 2')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded font-bold transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('### ', '', 'Heading 3')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded font-bold transition-colors"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Text styling */}
        <button
          onClick={() => onInsertText('**', '**', 'bold text')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('*', '*', 'italic text')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Lists */}
        <button
          onClick={() => onInsertText('- ', '', 'List item')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('1. ', '', 'First item')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('- [ ] ', '', 'Action task')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 mx-1" />

        {/* Structural Blocks */}
        <button
          onClick={() => onInsertText('> ', '', 'Blockquote text')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('```ts\n', '\n```', 'console.log("hello world");')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors font-mono"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (onOpenTableBuilder) {
              onOpenTableBuilder();
            } else {
              onInsertText(
                '\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n',
                ''
              );
            }
          }}
          className="p-1.5 hover:bg-slate-100 hover:text-blue-600 rounded transition-colors"
          title="Insert Table (Table Builder GUI)"
        >
          <TableIcon className="w-4 h-4 text-blue-600 sm:text-slate-600 hover:text-blue-600" />
        </button>
        <button
          onClick={() => onInsertText('[', '](https://example.com)', 'link text')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onInsertText('\n---\n', '')}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Utilities Group */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onCleanFormat}
          className="p-1.5 hover:bg-slate-100 hover:text-blue-600 rounded transition-colors text-xs flex items-center space-x-1 font-medium"
          title="Clean Extra Spaces & Newlines"
        >
          <AlignLeft className="w-4 h-4" />
          <span className="hidden lg:inline text-[11px]">Format</span>
        </button>

        {onToggleSearch && (
          <button
            onClick={onToggleSearch}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition-colors flex items-center space-x-1"
            title="Find & Replace (Ctrl+F / Cmd+F)"
          >
            <Search className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">Find</span>
          </button>
        )}

        <button
          onClick={onToggleAiDrawer}
          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 hover:text-blue-800 rounded text-xs flex items-center space-x-1 transition-colors"
          title="AI Refinement Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-[11px]">AI Assistant</span>
        </button>

        {/* Help Button */}
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition-colors flex items-center space-x-1"
            title="Markdown Syntax Reference Guide"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">Help</span>
          </button>
        )}

        <div className="w-px h-4 bg-slate-200 mx-1" />

        <button
          onClick={onCopyAll}
          className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          title="Copy Markdown Text"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onClear}
          className="p-1.5 hover:bg-slate-100 hover:text-red-600 rounded transition-colors"
          title="Clear Document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
