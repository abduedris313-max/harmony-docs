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
  FileText,
  SpellCheck,
  FileCheck2,
  Languages,
  Maximize2,
  LayoutTemplate,
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
  editorTheme?: 'document' | 'code';
  onChangeEditorTheme?: (theme: 'document' | 'code') => void;
  onToggleSpellcheck?: () => void;
  typosCount?: number;
  onToggleLinter?: () => void;
  syntaxIssuesCount?: number;
  textDirection?: 'auto' | 'rtl' | 'ltr';
  onChangeTextDirection?: (dir: 'auto' | 'rtl' | 'ltr') => void;
  detectedLangInfo?: { isRtl: boolean; detectedLang: string; autoIsRtl: boolean };
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
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
  editorTheme = 'code',
  onChangeEditorTheme,
  onToggleSpellcheck,
  typosCount = 0,
  onToggleLinter,
  syntaxIssuesCount = 0,
  textDirection = 'auto',
  onChangeTextDirection,
  detectedLangInfo,
  onToggleZenMode,
  isZenMode = false,
}) => {
  const [showTemplates, setShowTemplates] = React.useState(false);

  const templates = [
    {
      name: 'Academic Paper',
      desc: 'Title, Abstract, Introduction, Methodology, Results, and References',
      content: `# Academic Paper Title\n\n## Abstract\nProvide a concise summary of the research background, methodology, key findings, and conclusions.\n\n## 1. Introduction\nIntroduce the research topic, context, literature review, and the scope of the study.\n\n## 2. Methodology\nDetail the data collection, experimental design, and analytical tools used in this study.\n\n## 3. Results & Discussion\nPresent key findings, data analysis, and graphs.\n\n| Variable | Value | Status |\n| --- | --- | --- |\n| Control Group | 1.02 | Stable |\n| Treatment A | 2.45 | Active |\n\n## 4. Conclusion\nSummarize results and present future work.\n\n## References\n- [1] Author, A. (2026). *Journal of Modern Science*, 12(3), 45-56.`
    },
    {
      name: 'Meeting Notes',
      desc: 'Agenda, discussion notes, and actionable task checkboxes',
      content: `# Meeting Notes: [Project Name]\n\n**Date:** August 8, 2026  \n**Time:** 10:00 AM - 11:00 AM  \n**Facilitator:** [Name]  \n**Attendees:** [Name 1], [Name 2]\n\n## Agenda\n- [x] Status Updates & Milestones\n- [ ] Upcoming Release Plan\n- [ ] Technical Debriefing\n\n## Discussion Notes\n- Outline the main points of discussion here.\n- Highlight any key challenges or milestones.\n\n## Action Items\n- [ ] **@John** - Implement the templates menu\n- [ ] **@Sarah** - Perform QA on responsive views\n- [ ] **@Alex** - Deploy the final optimized bundle`
    },
    {
      name: 'Blog Post',
      desc: 'Metadata frontmatter, styled intro, blockquote, and call-to-action',
      content: `---\ntitle: "Unlocking Productivity with Modern Writing Engines"\ndate: "2026-08-08"\ncategory: "Technology"\ntags: ["writing", "markdown", "productivity"]\n---\n\n# Unlocking Productivity with Modern Writing Engines\n\nWriting should be distraction-free, fluid, and structured. In this post, we explore why Markdown has become the standard for modern authors and technical writers alike.\n\n## The Power of Focus\nWith distraction-free **Zen Mode** and automatic rendering, focus flows naturally.\n\n> "The simpler your tools, the clearer your thoughts."\n\n## Key Takeaways\n1. **Separation of Concerns:** Write content first, format later.\n2. **Portability:** Plaintext Markdown works everywhere.\n3. **Speed:** Keep your hands on the keyboard.\n\n---\n*Subscribe to our newsletter for more productivity insights!*`
    }
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex overflow-x-auto md:flex-wrap items-center justify-between gap-2 text-slate-600 scrollbar-none whitespace-nowrap">
      
      {/* Basic Formatting Group */}
      <div className="flex items-center gap-1 shrink-0">
        
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

        <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" />

        {/* Templates Dropdown Menu */}
        <div className="relative inline-block text-left shrink-0">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="p-1.5 hover:bg-slate-100 hover:text-purple-600 rounded flex items-center space-x-1 transition-colors text-xs font-semibold text-slate-700 bg-purple-50/50 hover:bg-purple-100/50 border border-purple-200/50 px-2 py-1"
            title="Predefined Markdown Boilerplates"
          >
            <LayoutTemplate className="w-4 h-4 text-purple-600" />
            <span className="text-purple-700 font-bold">Templates</span>
          </button>

          {showTemplates && (
            <>
              {/* Overlay backdrop to close */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowTemplates(false)} 
              />
              <div className="absolute left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-40 p-1.5 space-y-1">
                <div className="px-2.5 py-1.5 border-b border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Markdown Template</p>
                </div>
                {templates.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      onInsertText(t.content, '');
                      setShowTemplates(false);
                    }}
                    className="w-full text-left px-2.5 py-2 hover:bg-slate-50 rounded-lg transition-colors flex flex-col gap-0.5 whitespace-normal"
                  >
                    <span className="text-xs font-bold text-slate-800">{t.name}</span>
                    <span className="text-[10px] text-slate-500 leading-normal">{t.desc}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Utilities Group */}
      <div className="flex items-center space-x-1.5 shrink-0">
        
        {/* Editor View Style Segmented Control */}
        {onChangeEditorTheme && (
          <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200/80 text-xs font-medium">
            <button
              onClick={() => onChangeEditorTheme('document')}
              className={`px-2 py-0.5 rounded-full flex items-center space-x-1 transition-all ${
                editorTheme === 'document'
                  ? 'bg-white text-[#007AFF] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Document Mode: Paper-like proportional typography writing view"
            >
              <FileText className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">Document</span>
            </button>
            <button
              onClick={() => onChangeEditorTheme('code')}
              className={`px-2 py-0.5 rounded-full flex items-center space-x-1 transition-all ${
                editorTheme === 'code'
                  ? 'bg-white text-[#007AFF] shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Code Mode: Raw monospaced Markdown code editor"
            >
              <Code className="w-3 h-3" />
              <span className="hidden sm:inline text-[11px]">Code</span>
            </button>
          </div>
        )}

        {onChangeTextDirection && (
          <>
            <div className="w-px h-4 bg-slate-200/80 mx-0.5" />
            <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200/80 text-xs font-medium">
              <button
                onClick={() => onChangeTextDirection('auto')}
                className={`px-1.5 py-0.5 rounded-full flex items-center transition-all ${
                  textDirection === 'auto'
                    ? 'bg-white text-[#007AFF] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Auto-detect text direction based on content"
              >
                <span className="text-[10px]">Auto</span>
              </button>
              <button
                onClick={() => onChangeTextDirection('ltr')}
                className={`px-1.5 py-0.5 rounded-full flex items-center transition-all ${
                  textDirection === 'ltr'
                    ? 'bg-white text-[#007AFF] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Force Left-to-Right layout"
              >
                <span className="text-[10px]">LTR</span>
              </button>
              <button
                onClick={() => onChangeTextDirection('rtl')}
                className={`px-1.5 py-0.5 rounded-full flex items-center transition-all ${
                  textDirection === 'rtl'
                    ? 'bg-white text-[#007AFF] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Force Right-to-Left layout"
              >
                <span className="text-[10px]">RTL</span>
              </button>
            </div>
          </>
        )}

        {detectedLangInfo && (
          <>
            <div className="w-px h-4 bg-slate-200/80 mx-0.5" />
            <div className="hidden md:flex items-center space-x-1 px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-[10px] font-bold" title={`Detected language: ${detectedLangInfo.detectedLang}`}>
              <Languages className="w-3 h-3 text-purple-600" />
              <span className="whitespace-nowrap">
                {detectedLangInfo.detectedLang || "English"} 
                ({detectedLangInfo.isRtl ? "RTL" : "LTR"})
              </span>
            </div>
          </>
        )}

        <div className="w-px h-4 bg-slate-200/80 mx-0.5" />

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

        {onToggleSpellcheck && (
          <button
            onClick={onToggleSpellcheck}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition-colors flex items-center space-x-1 relative"
            title="Spellcheck & Typos Inspector"
          >
            <SpellCheck className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">Spellcheck</span>
            {typosCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-2xs">
                {typosCount}
              </span>
            )}
          </button>
        )}

        {onToggleLinter && (
          <button
            onClick={onToggleLinter}
            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-amber-600 rounded transition-colors flex items-center space-x-1 relative"
            title="Markdown Syntax & Formatting Inspector"
          >
            <FileCheck2 className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline text-xs font-semibold text-slate-700">Syntax</span>
            {syntaxIssuesCount > 0 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-2xs">
                {syntaxIssuesCount}
              </span>
            )}
          </button>
        )}

        {onToggleZenMode && (
          <button
            onClick={onToggleZenMode}
            className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-all ${
              isZenMode
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-semibold'
            }`}
            title="Zen Mode - Distraction-Free Full-Screen Writing"
          >
            <Maximize2 className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[11px]">Zen Mode</span>
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
