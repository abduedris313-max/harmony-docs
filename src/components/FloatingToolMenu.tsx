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
} from 'lucide-react';

interface FloatingToolMenuProps {
  onOpenTableBuilder: () => void;
  onToggleSearch: () => void;
  onCleanFormat: () => void;
  onToggleAiDrawer: () => void;
  onOpenHelp: () => void;
  onCopyAll: () => void;
}

export const FloatingToolMenu: React.FC<FloatingToolMenuProps> = ({
  onOpenTableBuilder,
  onToggleSearch,
  onCleanFormat,
  onToggleAiDrawer,
  onOpenHelp,
  onCopyAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-auto">
      {/* Expanded Quick Tool Menu */}
      {isOpen && (
        <div className="mb-3 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 flex flex-col space-y-1 w-56 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="px-2 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Editor Quick Tools</span>
            <X
              className="w-3.5 h-3.5 cursor-pointer hover:text-slate-700 transition-colors"
              onClick={() => setIsOpen(false)}
            />
          </div>

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
        className={`px-3.5 py-3 rounded-full shadow-xl font-bold text-xs flex items-center space-x-2 transition-all transform active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-white ring-2 ring-slate-400'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
        }`}
        title="Toggle Editor Tools Floating Menu"
      >
        <Wrench className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        <span className="hidden sm:inline font-semibold">Table &amp; Tools</span>
        <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
