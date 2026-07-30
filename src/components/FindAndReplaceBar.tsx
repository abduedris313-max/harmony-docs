import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Replace,
  ChevronUp,
  ChevronDown,
  X,
  Type,
  WholeWord,
  Regex,
  Check,
} from 'lucide-react';

interface FindAndReplaceBarProps {
  markdown: string;
  onChangeMarkdown: (newMarkdown: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onClose: () => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const FindAndReplaceBar: React.FC<FindAndReplaceBarProps> = ({
  markdown,
  onChangeMarkdown,
  textareaRef,
  onClose,
  onShowToast,
}) => {
  const [findText, setFindText] = useState<string>('');
  const [replaceText, setReplaceText] = useState<string>('');
  const [isCaseSensitive, setIsCaseSensitive] = useState<boolean>(false);
  const [isWholeWord, setIsWholeWord] = useState<boolean>(false);
  const [isRegex, setIsRegex] = useState<boolean>(false);

  const [matches, setMatches] = useState<{ start: number; end: number }[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);

  // Helper to build RegExp based on options
  const getSearchRegex = useCallback(() => {
    if (!findText) return null;
    try {
      let pattern = isRegex ? findText : findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (isWholeWord && !isRegex) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = isCaseSensitive ? 'g' : 'gi';
      return new RegExp(pattern, flags);
    } catch {
      return null; // Invalid regex
    }
  }, [findText, isCaseSensitive, isWholeWord, isRegex]);

  // Compute all match positions
  useEffect(() => {
    if (!findText) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const regex = getSearchRegex();
    if (!regex) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const found: { start: number; end: number }[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(markdown)) !== null) {
      found.push({ start: match.index, end: match.index + match[0].length });
      if (match.index === regex.lastIndex) {
        regex.lastIndex++; // Prevent infinite loop for zero-width matches
      }
    }

    setMatches(found);
    if (found.length > 0) {
      setCurrentMatchIndex((prev) => (prev >= 0 && prev < found.length ? prev : 0));
    } else {
      setCurrentMatchIndex(-1);
    }
  }, [findText, markdown, getSearchRegex]);

  // Highlight active match in textarea
  const highlightMatch = useCallback((index: number, matchArray = matches) => {
    if (index < 0 || index >= matchArray.length) return;
    const match = matchArray[index];
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(match.start, match.end);

    // Scroll textarea to make selected match visible
    const lines = markdown.substring(0, match.start).split('\n');
    const lineNumber = lines.length;
    const lineHeight = 20; // approximate line height in px
    textarea.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
  }, [matches, markdown, textareaRef]);

  // Navigate to match when currentMatchIndex changes manually
  const goToNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    highlightMatch(nextIdx);
  };

  const goToPrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    highlightMatch(prevIdx);
  };

  // Replace current match
  const handleReplaceCurrent = () => {
    if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return;

    const match = matches[currentMatchIndex];
    const before = markdown.substring(0, match.start);
    const after = markdown.substring(match.end);
    const newMarkdown = before + replaceText + after;

    onChangeMarkdown(newMarkdown);

    if (onShowToast) {
      onShowToast('Replaced Occurrence', `Replaced "${findText}" with "${replaceText}"`);
    }
  };

  // Replace all occurrences
  const handleReplaceAll = () => {
    if (matches.length === 0) return;

    const regex = getSearchRegex();
    if (!regex) return;

    const count = matches.length;
    const newMarkdown = markdown.replace(regex, replaceText);
    onChangeMarkdown(newMarkdown);

    if (onShowToast) {
      onShowToast('Replace All Complete', `Replaced ${count} occurrence${count > 1 ? 's' : ''}`);
    }
  };

  // Keyboard shortcut listener for Enter, Shift+Enter, Esc
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="bg-slate-900 text-slate-100 p-2.5 sm:px-4 border-b border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2 text-xs font-sans transition-all animate-in fade-in duration-150"
    >
      {/* Search Input & Controls */}
      <div className="flex flex-wrap items-center gap-2 flex-1">
        
        {/* Find Input */}
        <div className="relative flex items-center min-w-[180px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find in document..."
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 pl-8 pr-16 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-xs"
            autoFocus
          />
          {findText && (
            <span className="absolute right-2 text-[10px] font-mono text-slate-400 select-none">
              {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0 results'}
            </span>
          )}
        </div>

        {/* Replace Input */}
        <div className="relative flex items-center min-w-[180px] max-w-xs flex-1">
          <Replace className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace with..."
            className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 pl-8 pr-2.5 py-1.5 rounded-md border border-slate-700 focus:outline-none focus:border-blue-500 font-mono text-xs"
          />
        </div>

        {/* Option Toggles */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-md border border-slate-700">
          <button
            onClick={() => setIsCaseSensitive(!isCaseSensitive)}
            className={`p-1.5 rounded text-[11px] font-mono transition-colors ${
              isCaseSensitive ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Match Case (Aa)"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsWholeWord(!isWholeWord)}
            className={`p-1.5 rounded text-[11px] font-mono transition-colors ${
              isWholeWord ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Match Whole Word (\b)"
          >
            <WholeWord className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsRegex(!isRegex)}
            className={`p-1.5 rounded text-[11px] font-mono transition-colors ${
              isRegex ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Use Regular Expression (.*)"
          >
            <Regex className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={goToPrevMatch}
            disabled={matches.length === 0}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={goToNextMatch}
            disabled={matches.length === 0}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40 transition-colors"
            title="Next match (Enter)"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1.5 ml-auto sm:ml-0">
          <button
            onClick={handleReplaceCurrent}
            disabled={currentMatchIndex < 0}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium disabled:opacity-40 transition-colors"
            title="Replace current match"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold disabled:opacity-40 transition-colors shadow-2xs"
            title="Replace all occurrences"
          >
            Replace All
          </button>
        </div>

      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
        title="Close find and replace (Esc)"
      >
        <X className="w-4 h-4" />
      </button>

    </div>
  );
};
