import React, { useState } from 'react';
import { 
  X, 
  History, 
  Save, 
  RotateCcw, 
  Eye, 
  Trash2, 
  Copy, 
  Clock, 
  FileText, 
  Check, 
  GitCompare, 
  Plus, 
  CheckCircle2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { VersionSnapshot } from '../types';
import { computeSimpleDiff, DiffLine } from '../utils/markdownParser';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: VersionSnapshot[];
  currentMarkdown: string;
  onTakeSnapshot: (customLabel?: string) => void;
  onRestoreSnapshot: (snapshot: VersionSnapshot) => void;
  onDeleteSnapshot: (id: string) => void;
  onClearAllSnapshots: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  snapshots,
  currentMarkdown,
  onTakeSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onClearAllSnapshots,
  onShowToast,
}) => {
  const [newLabel, setNewLabel] = useState('');
  const [selectedForDiff, setSelectedForDiff] = useState<VersionSnapshot | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    onTakeSnapshot(newLabel.trim() || undefined);
    setNewLabel('');
    onShowToast('Version Snapshot Saved', 'Created a new document checkpoint.', 'success');
  };

  const handleCopyContent = (snap: VersionSnapshot) => {
    navigator.clipboard.writeText(snap.markdown);
    setCopiedId(snap.id);
    setTimeout(() => setCopiedId(null), 2000);
    onShowToast('Copied to Clipboard', 'Version text copied.', 'info');
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  let diffLines: DiffLine[] = [];
  if (selectedForDiff) {
    diffLines = computeSimpleDiff(selectedForDiff.markdown, currentMarkdown);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full shadow-2xl flex flex-col text-slate-800">
        
        {/* Drawer Top Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Document Version History ({snapshots.length})
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Save snapshots &amp; revert edits anytime</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Snapshot Quick Bar */}
        <form onSubmit={handleCreateSnapshot} className="p-3 bg-blue-50/40 border-b border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label this snapshot (e.g., After AI Edit, Draft v2)..."
            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-2xs flex items-center space-x-1 shrink-0"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Snapshot</span>
          </button>
        </form>

        {/* Diff View Modal Overlay if Diff Selected */}
        {selectedForDiff && (
          <div className="bg-slate-900 text-slate-100 p-4 border-b border-slate-800 flex flex-col max-h-72 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4" />
                Comparing: "{selectedForDiff.label}" vs Current Document
              </span>
              <button
                onClick={() => setSelectedForDiff(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                &times; Close Diff
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-[11px] space-y-0.5 pr-2">
              {diffLines.map((line, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded flex items-start gap-2 ${
                    line.type === 'added'
                      ? 'bg-emerald-950/80 text-emerald-300 border-l-2 border-emerald-500'
                      : line.type === 'removed'
                      ? 'bg-red-950/80 text-red-300 border-l-2 border-red-500 line-through'
                      : 'text-slate-400 opacity-60'
                  }`}
                >
                  <span className="w-4 text-[9px] text-slate-500 shrink-0 font-sans">
                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                  </span>
                  <span className="break-all">{line.content || ' '}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Snapshots List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <History className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No version snapshots saved yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Take a snapshot above or run AI Refinements to save historical versions.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                className="bg-white hover:bg-blue-50/30 border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 transition-all shadow-2xs group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{snap.label}</span>
                        {snap.isAutoSave && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                            Auto
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDate(snap.timestamp)}
                        </span>
                        <span>•</span>
                        <span>{snap.wordCount} words</span>
                        <span>•</span>
                        <span>{snap.charCount} chars</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteSnapshot(snap.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-slate-100 transition-colors"
                    title="Delete snapshot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content Preview Snippet */}
                <div className="mt-2.5 p-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] text-slate-600 font-mono line-clamp-2 leading-relaxed">
                  {snap.markdown || 'Empty document'}
                </div>

                {/* Actions Footer */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedForDiff(snap)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      title="Compare diff against current document"
                    >
                      <GitCompare className="w-3 h-3 text-blue-600" />
                      <span>Compare Diff</span>
                    </button>

                    <button
                      onClick={() => handleCopyContent(snap)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      title="Copy raw markdown text"
                    >
                      {copiedId === snap.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onRestoreSnapshot(snap);
                      onClose();
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold flex items-center space-x-1 shadow-2xs transition-all"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Revert to Version</span>
                  </button>
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {snapshots.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Snapshots stored in local session</span>
            <button
              onClick={onClearAllSnapshots}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Snapshots</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
