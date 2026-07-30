import React, { useState, useMemo } from 'react';
import { BookOpen, X, Search, ChevronRight, Hash, Layers, ListFilter } from 'lucide-react';

export interface HeadingItem {
  id: string;
  text: string;
  level: number;
  lineIndex: number;
}

interface TableOfContentsPanelProps {
  headings: HeadingItem[];
  activeHeadingId?: string | null;
  onSelectHeading: (heading: HeadingItem) => void;
  onClose: () => void;
  onInsertTocMarkdown?: () => void;
}

export const TableOfContentsPanel: React.FC<TableOfContentsPanelProps> = ({
  headings,
  activeHeadingId,
  onSelectHeading,
  onClose,
  onInsertTocMarkdown,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'h1' | 'h2' | 'h3'>('all');

  const filteredHeadings = useMemo(() => {
    return headings.filter((h) => {
      // Level filter
      if (levelFilter === 'h1' && h.level !== 1) return false;
      if (levelFilter === 'h2' && h.level !== 2) return false;
      if (levelFilter === 'h3' && h.level < 3) return false;

      // Search query filter
      if (searchQuery.trim()) {
        return h.text.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [headings, searchQuery, levelFilter]);

  const getBadgeStyle = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-[#007AFF]/10 text-[#007AFF] border-[#007AFF]/20 font-bold';
      case 2:
        return 'bg-purple-50 text-purple-700 border-purple-200 font-semibold';
      case 3:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 font-normal';
    }
  };

  return (
    <div className="absolute top-0 right-0 z-30 w-72 sm:w-80 h-full bg-white/95 backdrop-blur-2xl border-l border-black/10 p-4 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Table of Contents</span>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {headings.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Click to jump to section</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Close Table of Contents"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="py-3 space-y-2 border-b border-black/5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search headings..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* Level Filter Chips */}
        <div className="flex items-center space-x-1 text-[10px] font-semibold">
          <span className="text-slate-400 mr-1 flex items-center gap-0.5">
            <ListFilter className="w-3 h-3" />
          </span>
          <button
            onClick={() => setLevelFilter('all')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              levelFilter === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setLevelFilter('h1')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              levelFilter === 'h1'
                ? 'bg-[#007AFF] text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => setLevelFilter('h2')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              levelFilter === 'h2'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            H2
          </button>
          <button
            onClick={() => setLevelFilter('h3')}
            className={`px-2 py-0.5 rounded-full transition-all ${
              levelFilter === 'h3'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            H3+
          </button>
        </div>
      </div>

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 pr-1 custom-scrollbar">
        {filteredHeadings.length === 0 ? (
          <div className="text-center py-8 px-2 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Hash className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-600">No matching headings</p>
            <p className="text-[11px] text-slate-400">
              {headings.length === 0
                ? 'Add headings like # Heading 1 or ## Heading 2 in your document to automatically generate a Table of Contents.'
                : 'Try adjusting your search query or level filters.'}
            </p>
          </div>
        ) : (
          filteredHeadings.map((h, i) => {
            const isActive = activeHeadingId === h.id;
            const indentClass =
              h.level === 1
                ? 'pl-2'
                : h.level === 2
                ? 'pl-5'
                : h.level === 3
                ? 'pl-8'
                : 'pl-11';

            return (
              <button
                key={i}
                onClick={() => onSelectHeading(h)}
                className={`w-full text-left py-1.5 pr-2 rounded-xl text-xs transition-all flex items-start space-x-2 group ${indentClass} ${
                  isActive
                    ? 'bg-[#007AFF]/10 text-[#007AFF] font-bold border-l-2 border-[#007AFF]'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded border shrink-0 mt-0.5 ${getBadgeStyle(
                    h.level
                  )}`}
                >
                  H{h.level}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium group-hover:text-[#007AFF] transition-colors">
                    {h.text}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Line {h.lineIndex + 1}</div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#007AFF] shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            );
          })
        )}
      </div>

      {/* Footer Option: Insert Table of Contents in document */}
      {onInsertTocMarkdown && (
        <div className="pt-3 border-t border-black/5 shrink-0">
          <button
            onClick={onInsertTocMarkdown}
            className="w-full py-2 bg-slate-100 hover:bg-[#007AFF]/10 hover:text-[#007AFF] border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Insert TOC to Document</span>
          </button>
        </div>
      )}

    </div>
  );
};
