import React, { useState } from 'react';
import {
  Wrench,
  Table as TableIcon,
  Search,
  AlignLeft,
  Sparkles,
  HelpCircle,
  Copy,
  X,
  ChevronUp,
  BookOpen,
  FileText,
  Code,
  SpellCheck,
  FileCheck2,
  Maximize2,
} from 'lucide-react';

interface FloatingToolMenuProps {
  onOpenTableBuilder: () => void;
  onToggleSearch: () => void;
  onCleanFormat: () => void;
  onToggleAiDrawer: () => void;
  onOpenHelp: () => void;
  onCopyAll: () => void;
  onToggleOutline?: () => void;
  editorTheme?: 'document' | 'code';
  onChangeEditorTheme?: (theme: 'document' | 'code') => void;
  onToggleSpellcheck?: () => void;
  typosCount?: number;
  onToggleLinter?: () => void;
  syntaxIssuesCount?: number;
  onOpenBookLibrary?: () => void;
  onToggleZenMode?: () => void;
  isZenMode?: boolean;
}

export const FloatingToolMenu: React.FC<FloatingToolMenuProps> = ({
  onOpenTableBuilder,
  onToggleSearch,
  onCleanFormat,
  onToggleAiDrawer,
  onOpenHelp,
  onCopyAll,
  onToggleOutline,
  editorTheme,
  onChangeEditorTheme,
  onToggleSpellcheck,
  typosCount = 0,
  onToggleLinter,
  syntaxIssuesCount = 0,
  onOpenBookLibrary,
  onToggleZenMode,
  isZenMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Quick Tool Menu */}
      {isOpen && (
        <div className="mb-3 bg-white/95 backdrop-blur-2xl border border-black/10 rounded-2xl shadow-2xl p-2.5 flex flex-col space-y-1 w-60 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="px-2 py-1.5 border-b border-black/5 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Editor Quick Tools</span>
            <X
              className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700 transition-colors"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {onToggleZenMode && (
            <button
              onClick={() => {
                onToggleZenMode();
                setIsOpen(false);
              }}
              className={`flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all text-left ${
                isZenMode
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-700 hover:bg-purple-50'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isZenMode ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
              }`}>
                <Maximize2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div>{isZenMode ? 'Exit Zen Mode' : 'Zen Mode'}</div>
                <div className={`text-[10px] font-normal ${isZenMode ? 'text-purple-200' : 'text-slate-400'}`}>
                  Distraction-free writing
                </div>
              </div>
            </button>
          )}

          {onOpenBookLibrary && (
            <button
              onClick={() => {
                onOpenBookLibrary();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <div>Book Library</div>
                <div className="text-[10px] font-normal text-slate-400">Personal &amp; cloud collection</div>
              </div>
            </button>
          )}

          {onToggleOutline && (
            <button
              onClick={() => {
                onToggleOutline();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <div>Table of Contents</div>
                <div className="text-[10px] font-normal text-slate-400">Section outline &amp; jump</div>
              </div>
            </button>
          )}

          {onToggleSpellcheck && (
            <button
              onClick={() => {
                onToggleSpellcheck();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-all text-left relative"
            >
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <SpellCheck className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Spellcheck &amp; Typos</span>
                  {typosCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {typosCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-normal text-slate-400">Dictionary typo inspector</div>
              </div>
            </button>
          )}

          {onToggleLinter && (
            <button
              onClick={() => {
                onToggleLinter();
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all text-left relative"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Syntax Inspector</span>
                  {syntaxIssuesCount > 0 && (
                    <span className="bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                      {syntaxIssuesCount}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-normal text-slate-400">Formatting &amp; structure errors</div>
              </div>
            </button>
          )}

          {onChangeEditorTheme && (
            <button
              onClick={() => {
                onChangeEditorTheme(editorTheme === 'document' ? 'code' : 'document');
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#007AFF] hover:bg-[#007AFF]/10 rounded-xl transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                {editorTheme === 'document' ? (
                  <Code className="w-3.5 h-3.5" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div>Style: {editorTheme === 'document' ? 'Document (Paper)' : 'Code (Mono)'}</div>
                <div className="text-[10px] font-normal text-slate-400">
                  Switch to {editorTheme === 'document' ? 'Code' : 'Document'} mode
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => {
              onOpenTableBuilder();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TableIcon className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>Table Builder GUI</div>
              <div className="text-[10px] font-normal text-slate-400">Visual table generator</div>
            </div>
          </button>

          <button
            onClick={() => {
              onToggleSearch();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Search className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>Find &amp; Replace</div>
              <div className="text-[10px] font-normal text-slate-400">Ctrl+F search tool</div>
            </div>
          </button>

          <button
            onClick={() => {
              onToggleAiDrawer();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>AI Refine Assistant</div>
              <div className="text-[10px] font-normal text-slate-400">Summarize, translate, polish</div>
            </div>
          </button>

          <button
            onClick={() => {
              onCleanFormat();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <AlignLeft className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>Clean &amp; Format Text</div>
              <div className="text-[10px] font-normal text-slate-400">Strip duplicate spaces</div>
            </div>
          </button>

          <button
            onClick={() => {
              onOpenHelp();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>Markdown Syntax Help</div>
              <div className="text-[10px] font-normal text-slate-400">Cheat sheet reference</div>
            </div>
          </button>

          <button
            onClick={() => {
              onCopyAll();
              setIsOpen(false);
            }}
            className="flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Copy className="w-3.5 h-3.5" />
            </div>
            <div>
              <div>Copy Markdown</div>
              <div className="text-[10px] font-normal text-slate-400">Copy to clipboard</div>
            </div>
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-3 rounded-full shadow-xl font-bold text-xs flex items-center space-x-2 transition-all transform active:scale-95 border backdrop-blur-xl ${
          isOpen
            ? 'bg-slate-900 text-white border-black/10'
            : 'bg-[#007AFF] hover:bg-[#0062CC] text-white border-blue-400/30'
        }`}
        title="Toggle Editor Tools Floating Menu"
      >
        <Wrench className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        <span className="hidden sm:inline font-semibold">Tools</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
