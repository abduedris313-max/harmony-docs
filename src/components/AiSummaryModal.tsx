import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  List,
  Check,
  Copy,
  ArrowUpToLine,
  RefreshCw,
  X,
  Sliders,
  FileText,
  Briefcase,
  Zap,
  Cpu,
  Layers,
  HelpCircle,
  Eye,
  Code2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { renderMarkdownToHtml } from '../utils/markdownParser';

export interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  markdown: string;
  onInsertTakeaways: (takeawaysMarkdown: string, placement: 'top' | 'cursor' | 'replace') => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export type SummaryStyle = 'bulleted' | 'executive' | 'actionable' | 'technical' | 'concise';

export const AiSummaryModal: React.FC<AiSummaryModalProps> = ({
  isOpen,
  onClose,
  markdown,
  onInsertTakeaways,
  onShowToast,
}) => {
  const [style, setStyle] = useState<SummaryStyle>('bulleted');
  const [bulletCount, setBulletCount] = useState<number>(4);
  const [customFocus, setCustomFocus] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedTakeaways, setGeneratedTakeaways] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'rendered' | 'raw'>('rendered');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate on modal open if no takeaways yet
  useEffect(() => {
    if (isOpen && !generatedTakeaways && markdown.trim()) {
      handleGenerate();
    }
  }, [isOpen]);

  const handleGenerate = async (overrideStyle?: SummaryStyle) => {
    if (!markdown.trim()) {
      setErrorMsg('The document is empty. Add some text first to generate key takeaways.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          bulletCount,
          style: overrideStyle || style,
          focusArea: customFocus.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate key takeaways summary.');
      }

      setGeneratedTakeaways(data.takeawaysMarkdown);
      onShowToast('Key Takeaways Generated', 'Synthesized key bullet points using AI', 'success');
    } catch (err: any) {
      console.error('Error generating summary:', err);
      // Fallback local synthesis if offline or server API key not configured
      const fallback = generateLocalTakeawaysFallback(markdown, bulletCount);
      setGeneratedTakeaways(fallback);
      setErrorMsg(
        err.message?.includes('GEMINI_API_KEY')
          ? 'Notice: Generated using local document parser (configure GEMINI_API_KEY in Secrets for full AI reasoning).'
          : `AI service message: ${err.message}. Showing parsed takeaways.`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Local fallback heuristics in case of network or API key issues
  const generateLocalTakeawaysFallback = (doc: string, count: number): string => {
    const lines = doc.split('\n').filter((l) => l.trim().length > 20 && !l.startsWith('#'));
    const headings = doc.match(/^#{1,4}\s+(.+)$/gm) || [];
    
    const bullets: string[] = [];
    
    if (headings.length > 0) {
      const selectedHeadings = headings.slice(0, count);
      selectedHeadings.forEach((h) => {
        const cleanTitle = h.replace(/^#{1,4}\s+/, '').trim();
        bullets.push(`- **${cleanTitle}**: Key insights, structural guidelines, and findings for this section.`);
      });
    }

    while (bullets.length < count && lines.length > bullets.length) {
      const line = lines[bullets.length].replace(/^[-*>\d.]+\s*/, '').trim();
      const snippet = line.length > 120 ? line.substring(0, 117) + '...' : line;
      bullets.push(`- **Key Point ${bullets.length + 1}**: ${snippet}`);
    }

    if (bullets.length === 0) {
      bullets.push('- **Document Overview**: Key synthesized takeaway summarizing the core context.');
      bullets.push('- **Primary Objective**: Outlines the main deliverables and structural goals.');
      bullets.push('- **Conclusion**: Synthesizes final recommendations and action items.');
    }

    return `## Key Takeaways\n\n${bullets.join('\n\n')}`;
  };

  const handleCopy = async () => {
    if (!generatedTakeaways) return;
    try {
      await navigator.clipboard.writeText(generatedTakeaways);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShowToast('Copied to Clipboard', 'Key Takeaways markdown copied');
    } catch {
      onShowToast('Copy Failed', 'Unable to copy text', 'error');
    }
  };

  const handleApply = (placement: 'top' | 'cursor' | 'replace') => {
    if (!generatedTakeaways.trim()) return;
    onInsertTakeaways(generatedTakeaways, placement);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/80 dark:bg-zinc-900/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Key Takeaways Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                  Gemini 3.7
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate an executive bulleted summary and insert it at the top of your document
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Style Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
              Summary Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStyle('bulleted');
                  handleGenerate('bulleted');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  style === 'bulleted'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <List className="w-3.5 h-3.5 text-blue-600" />
                  <span>Standard</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Balanced highlights &amp; core concepts
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStyle('executive');
                  handleGenerate('executive');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  style === 'executive'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-100 ring-2 ring-purple-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  <span>Executive</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Strategic findings &amp; business impact
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStyle('actionable');
                  handleGenerate('actionable');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  style === 'actionable'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Actionable</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Next steps &amp; recommendations
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStyle('technical');
                  handleGenerate('technical');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                  style === 'technical'
                    ? 'border-cyan-500 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-100 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Cpu className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Technical</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Architecture &amp; quantitative specs
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStyle('concise');
                  handleGenerate('concise');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 col-span-2 sm:col-span-1 ${
                  style === 'concise'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ultra-Concise</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Punchy, high-speed takeaways
                </span>
              </button>
            </div>
          </div>

          {/* Quick Customization Options */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Bullet Count:</span>
              <div className="flex items-center bg-slate-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-slate-200 dark:border-zinc-700">
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setBulletCount(num);
                    }}
                    className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${
                      bulletCount === num
                        ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-2xs font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Custom Focus' : 'Custom Focus...'}</span>
            </button>
          </div>

          {/* Optional Custom Focus Input */}
          {showAdvanced && (
            <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2 animate-in fade-in">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                Custom Focus Area or Prompt
              </label>
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="e.g., Focus on security vulnerabilities, budget figures, or timeline..."
                className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Apply Focus &amp; Regenerate</span>
              </button>
            </div>
          )}

          {/* Error / Notice Display */}
          {errorMsg && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Generated Result Preview Area */}
          <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-zinc-900/50">
            <div className="px-3 py-2 bg-slate-100/80 dark:bg-zinc-800/80 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewTab('rendered')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                    previewTab === 'rendered'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('raw')}
                  className={`px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 transition-all ${
                    previewTab === 'raw'
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Markdown Edit</span>
                </button>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-1"
                  title="Regenerate Key Takeaways"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-blue-600' : ''}`} />
                  <span className="hidden sm:inline text-[11px] font-semibold">Regenerate</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!generatedTakeaways}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-1"
                  title="Copy to Clipboard"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline text-[11px] font-semibold">
                    {copied ? 'Copied' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 min-h-[160px] max-h-[260px] overflow-y-auto">
              {isGenerating ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Synthesizing Key Takeaways...
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gemini is extracting high-impact findings &amp; formatting bullets
                    </p>
                  </div>
                </div>
              ) : generatedTakeaways ? (
                previewTab === 'rendered' ? (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-xs [&>h2]:text-sm [&>h2]:font-bold [&>h2]:text-slate-900 dark:[&>h2]:text-slate-100 [&>h2]:mb-2 [&>ul]:space-y-1.5 [&>ul]:pl-4"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(generatedTakeaways),
                    }}
                  />
                ) : (
                  <textarea
                    value={generatedTakeaways}
                    onChange={(e) => setGeneratedTakeaways(e.target.value)}
                    rows={7}
                    className="w-full bg-white dark:bg-zinc-950 font-mono text-xs p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                    placeholder="Key takeaways markdown..."
                  />
                )
              ) : (
                <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                  Click Generate to synthesize key takeaways from your document.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Insert Placement:
            </span>
            <button
              type="button"
              onClick={() => handleApply('top')}
              disabled={!generatedTakeaways || isGenerating}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all"
            >
              <ArrowUpToLine className="w-4 h-4" />
              <span>Insert at Top of Document</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleApply('cursor')}
              disabled={!generatedTakeaways || isGenerating}
              className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold rounded-xl transition-colors"
              title="Insert at current cursor position"
            >
              Insert at Cursor
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
