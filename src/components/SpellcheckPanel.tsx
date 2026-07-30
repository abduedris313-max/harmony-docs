import React, { useState } from 'react';
import { SpellCheck, X, Check, Plus, RefreshCw, Wand2, ArrowRight } from 'lucide-react';
import { TypoItem } from '../utils/spellchecker';

interface SpellcheckPanelProps {
  typos: TypoItem[];
  userDictionary: Set<string>;
  onReplaceTypo: (typo: TypoItem, replacement: string) => void;
  onAddToDictionary: (word: string) => void;
  onJumpToTypo: (typo: TypoItem) => void;
  onClose: () => void;
}

export const SpellcheckPanel: React.FC<SpellcheckPanelProps> = ({
  typos,
  userDictionary,
  onReplaceTypo,
  onAddToDictionary,
  onJumpToTypo,
  onClose,
}) => {
  const [selectedTypoId, setSelectedTypoId] = useState<string | null>(
    typos.length > 0 ? typos[0].id : null
  );

  return (
    <div className="absolute top-0 right-0 z-30 w-80 sm:w-88 h-full bg-white/95 backdrop-blur-2xl border-l border-black/10 p-4 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right-4">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
            <SpellCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Spellcheck &amp; Typos</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  typos.length === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {typos.length} {typos.length === 1 ? 'issue' : 'issues'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Dictionary lookup &amp; auto-suggestions</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Close Spellchecker"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Typos List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 custom-scrollbar">
        {typos.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No Typos Found!</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your document looks clean and well-spelled according to the dictionary engine.
              </p>
            </div>
          </div>
        ) : (
          typos.map((typo) => {
            const isSelected = selectedTypoId === typo.id;

            return (
              <div
                key={typo.id}
                onClick={() => {
                  setSelectedTypoId(typo.id);
                  onJumpToTypo(typo);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-50/50 border-red-300 ring-2 ring-red-400/20 shadow-xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'
                }`}
              >
                {/* Word & Line Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-red-600 bg-red-100/80 px-2 py-0.5 rounded-lg underline decoration-wavy decoration-red-500">
                      {typo.word}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Line {typo.lineIndex + 1}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToDictionary(typo.word);
                    }}
                    className="p-1 text-[10px] text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors flex items-center space-x-1"
                    title="Add word to dictionary"
                  >
                    <Plus className="w-3 h-3 text-slate-400" />
                    <span>Ignore</span>
                  </button>
                </div>

                {/* Suggestions List */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-[#007AFF]" />
                    <span>Suggested Corrections:</span>
                  </p>

                  {typo.suggestions.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No direct dictionary match</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {typo.suggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onReplaceTypo(typo, sug);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-[#007AFF] text-slate-800 hover:text-white border border-slate-200 hover:border-[#007AFF] text-xs font-medium rounded-xl transition-all flex items-center space-x-1 shadow-2xs group"
                        >
                          <span>{sug}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* User Dictionary Stats Footer */}
      <div className="pt-3 border-t border-black/5 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <SpellCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Custom dictionary: <b>{userDictionary.size}</b> words</span>
        </span>
        {userDictionary.size > 0 && (
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

    </div>
  );
};
