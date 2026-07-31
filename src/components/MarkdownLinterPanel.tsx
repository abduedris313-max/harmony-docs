import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  CheckCircle2,
  Wand2,
  ArrowRight,
  Code2,
  ListOrdered,
  Heading,
  Link2,
  Sparkles,
  Info,
  Check,
  FileCheck2,
} from 'lucide-react';
import { MarkdownIssue } from '../utils/markdownLinter';

interface MarkdownLinterPanelProps {
  issues: MarkdownIssue[];
  onFixIssue: (issue: MarkdownIssue) => void;
  onFixAllIssues: () => void;
  onJumpToIssue: (issue: MarkdownIssue) => void;
  onClose: () => void;
}

export const MarkdownLinterPanel: React.FC<MarkdownLinterPanelProps> = ({
  issues,
  onFixIssue,
  onFixAllIssues,
  onJumpToIssue,
  onClose,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning' | 'fixable'>('all');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    issues.length > 0 ? issues[0].id : null
  );

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;
  const fixableCount = issues.filter((i) => i.autoFixable).length;

  const filteredIssues = issues.filter((i) => {
    if (filterSeverity === 'error') return i.severity === 'error';
    if (filterSeverity === 'warning') return i.severity === 'warning';
    if (filterSeverity === 'fixable') return i.autoFixable;
    return true;
  });

  const getRuleIcon = (ruleId: string) => {
    switch (ruleId) {
      case 'header-missing-space':
      case 'duplicate-heading':
        return <Heading className="w-3.5 h-3.5 text-amber-500" />;
      case 'list-missing-space':
      case 'list-sequence-jump':
        return <ListOrdered className="w-3.5 h-3.5 text-blue-500" />;
      case 'unclosed-code-block':
      case 'unclosed-inline-code':
        return <Code2 className="w-3.5 h-3.5 text-red-500" />;
      case 'empty-link-target':
      case 'unclosed-link-syntax':
        return <Link2 className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="absolute top-0 right-0 z-30 w-80 sm:w-92 h-full bg-white/95 backdrop-blur-2xl border-l border-black/10 p-4 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Syntax &amp; Formatting Inspector</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  issues.length === 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">Auto-detect Markdown structure errors</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Auto-Fix All Action Button */}
      {fixableCount > 0 && (
        <div className="pt-3 pb-1 shrink-0">
          <button
            onClick={onFixAllIssues}
            className="w-full py-2 bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm group"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Auto-Fix All {fixableCount} Fixable Issues</span>
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="py-2 border-b border-black/5 flex items-center space-x-1 shrink-0 text-[11px]">
        <button
          onClick={() => setFilterSeverity('all')}
          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            filterSeverity === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({issues.length})
        </button>

        {errorCount > 0 && (
          <button
            onClick={() => setFilterSeverity('error')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filterSeverity === 'error'
                ? 'bg-red-600 text-white'
                : 'text-red-600 hover:bg-red-50'
            }`}
          >
            Errors ({errorCount})
          </button>
        )}

        {warningCount > 0 && (
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filterSeverity === 'warning'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Warnings ({warningCount})
          </button>
        )}

        {fixableCount > 0 && (
          <button
            onClick={() => setFilterSeverity('fixable')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              filterSeverity === 'fixable'
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            Fixable ({fixableCount})
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1 custom-scrollbar">
        {filteredIssues.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">No Syntax Errors Found!</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your Markdown formatting is clean, properly closed, and adheres to standard structure rules.
              </p>
            </div>
          </div>
        ) : (
          filteredIssues.map((issue) => {
            const isSelected = selectedIssueId === issue.id;

            const badgeStyles = {
              error: 'bg-red-100 text-red-800 border-red-200',
              warning: 'bg-amber-100 text-amber-800 border-amber-200',
              info: 'bg-blue-100 text-blue-800 border-blue-200',
            };

            return (
              <div
                key={issue.id}
                onClick={() => {
                  setSelectedIssueId(issue.id);
                  onJumpToIssue(issue);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-50 border-[#007AFF] ring-2 ring-[#007AFF]/20 shadow-xs'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                }`}
              >
                {/* Title & Line Number Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 truncate">
                    {getRuleIcon(issue.ruleId)}
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {issue.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      Line {issue.lineIndex + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${
                        badgeStyles[issue.severity]
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                </div>

                {/* Message Detail */}
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {issue.message}
                </p>

                {/* Original Line Snippet Preview */}
                <div className="mt-2 p-2 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] truncate border border-slate-800">
                  <span className="text-slate-500 mr-2">{issue.lineIndex + 1}|</span>
                  <span>{issue.lineText || '<i>Empty line</i>'}</span>
                </div>

                {/* Auto-Fix Option */}
                {issue.autoFixable && issue.suggestedFix && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-emerald-700 font-semibold truncate mr-2">
                      <span className="opacity-70">Fix: </span>
                      <code className="bg-emerald-50 px-1.5 py-0.5 rounded font-mono border border-emerald-200">
                        {issue.suggestedFix}
                      </code>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFixIssue(issue);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center space-x-1 shadow-2xs shrink-0"
                    >
                      <span>Fix</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-black/5 shrink-0 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Real-time syntax validation</span>
        </span>
        <button
          onClick={onClose}
          className="text-xs font-semibold text-[#007AFF] hover:underline"
        >
          Done
        </button>
      </div>
    </div>
  );
};
