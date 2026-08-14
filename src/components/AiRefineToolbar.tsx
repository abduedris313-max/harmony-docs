import React, { useState } from 'react';
import { Sparkles, FileText, CheckCircle2, Table, ListTodo, Languages, Send, X, Loader2 } from 'lucide-react';
import { AiAction } from '../types';

interface AiRefineToolbarProps {
  onRefineMarkdown: (action: AiAction, customPrompt?: string, targetLanguage?: string) => Promise<void>;
  onOpenAiSummary?: () => void;
  isRefining: boolean;
  onClose: () => void;
}

export const AiRefineToolbar: React.FC<AiRefineToolbarProps> = ({
  onRefineMarkdown,
  onOpenAiSummary,
  isRefining,
  onClose,
}) => {
  const [selectedAction, setSelectedAction] = useState<AiAction | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');

  const handleActionClick = async (action: AiAction) => {
    setSelectedAction(action);
    if (action !== 'custom' && action !== 'translate') {
      await onRefineMarkdown(action);
      setSelectedAction(null);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    await onRefineMarkdown('custom', customPrompt);
    setCustomPrompt('');
    setSelectedAction(null);
  };

  const handleTranslateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRefineMarkdown('translate', undefined, targetLanguage);
    setSelectedAction(null);
  };

  return (
    <div className="bg-slate-50/95 border-b border-slate-200 p-4 text-slate-800 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            AI Document Refinement Assistant
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
        
        {/* Key Takeaways to Top */}
        <button
          disabled={isRefining}
          onClick={() => {
            if (onOpenAiSummary) {
              onOpenAiSummary();
            } else {
              handleActionClick('summarize');
            }
          }}
          className="p-2.5 bg-gradient-to-br from-purple-50/90 to-blue-50/90 hover:from-purple-100 hover:to-blue-100 border border-purple-200 hover:border-purple-300 rounded-xl text-left transition-all group shadow-xs col-span-2 sm:col-span-1 ring-1 ring-purple-500/10"
        >
          <div className="flex items-center space-x-1.5 text-purple-700 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span className="text-xs font-bold text-purple-900 group-hover:text-purple-700">Key Takeaways</span>
          </div>
          <p className="text-[10px] text-purple-700/80 line-clamp-1 font-medium">Add bulleted section at top</p>
        </button>

        {/* Summarize Document */}
        <button
          disabled={isRefining}
          onClick={() => handleActionClick('summarize')}
          className="p-2.5 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group shadow-xs"
        >
          <div className="flex items-center space-x-2 text-blue-600 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">Executive Summary</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Synthesize entire document</p>
        </button>

        {/* Grammar & Polish */}
        <button
          disabled={isRefining}
          onClick={() => handleActionClick('grammar')}
          className="p-2.5 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-2 text-emerald-600 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">Fix Grammar</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Proofread &amp; polish style</p>
        </button>

        {/* Format Tables */}
        <button
          disabled={isRefining}
          onClick={() => handleActionClick('format_tables')}
          className="p-2.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-2 text-amber-600 mb-1">
            <Table className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-600">Align Tables</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Fix table GFM columns</p>
        </button>

        {/* Action Items */}
        <button
          disabled={isRefining}
          onClick={() => handleActionClick('extract_action_items')}
          className="p-2.5 bg-white hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 rounded-xl text-left transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-2 text-cyan-600 mb-1">
            <ListTodo className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-cyan-600">Action Tasks</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Extract checklist items</p>
        </button>

        {/* Translate */}
        <button
          disabled={isRefining}
          onClick={() => setSelectedAction('translate')}
          className={`p-2.5 bg-white hover:bg-purple-50/50 border rounded-xl text-left transition-all group shadow-sm ${
            selectedAction === 'translate' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2 text-purple-600 mb-1">
            <Languages className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">Translate</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Translate to language</p>
        </button>

        {/* Custom Prompt */}
        <button
          disabled={isRefining}
          onClick={() => setSelectedAction('custom')}
          className={`p-2.5 bg-white hover:bg-pink-50/50 border rounded-xl text-left transition-all group shadow-sm ${
            selectedAction === 'custom' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center space-x-2 text-pink-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold text-slate-800 group-hover:text-pink-600">Custom Prompt</span>
          </div>
          <p className="text-[10px] text-slate-500 line-clamp-1">Ask AI to rewrite</p>
        </button>

      </div>

      {/* Sub-inputs for Translate or Custom */}
      {selectedAction === 'translate' && (
        <form onSubmit={handleTranslateSubmit} className="mt-3 pt-3 border-t border-slate-200 flex items-center space-x-2">
          <span className="text-xs text-slate-600 font-medium">Target Language:</span>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm font-sans"
          >
            <option value="Arabic">Arabic (العربية)</option>
            <option value="Amharic">Amharic (አማርኛ)</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese (Mandarin)">Chinese</option>
            <option value="Japanese">Japanese</option>
            <option value="Portuguese">Portuguese</option>
            <option value="Italian">Italian</option>
          </select>
          <button
            type="submit"
            disabled={isRefining}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center space-x-1 shadow-sm"
          >
            {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Translate Now</span>}
          </button>
        </form>
      )}

      {selectedAction === 'custom' && (
        <form onSubmit={handleCustomSubmit} className="mt-3 pt-3 border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Change tone to professional corporate style, or reformat dates..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={isRefining || !customPrompt.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center space-x-1 shadow-sm"
          >
            {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      )}

      {isRefining && (
        <div className="mt-3 pt-2 text-center text-xs text-blue-600 font-semibold animate-pulse flex items-center justify-center space-x-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>AI Refining document content...</span>
        </div>
      )}

    </div>
  );
};
