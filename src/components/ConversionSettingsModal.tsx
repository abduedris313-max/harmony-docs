import React, { useState } from 'react';
import {
  X,
  Settings,
  Sliders,
  Check,
  ShieldCheck,
  Table,
  Sigma,
  FileText,
  Save,
  Wand2,
  ListOrdered,
  Heading,
  Sparkles,
  AlignLeft,
  Cloud,
} from 'lucide-react';
import { ConversionOptions, EditorPreferences } from '../types';
import { getStoredGoogleDriveToken } from '../utils/googleDriveService';

interface ConversionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
  onFormatDocumentNow?: () => void;
}

export const ConversionSettingsModal: React.FC<ConversionSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  setOptions,
  onFormatDocumentNow,
}) => {
  const [activeTab, setActiveTab] = useState<'conversion' | 'autosave'>('autosave');

  if (!isOpen) return null;

  const isGoogleAuthed = !!getStoredGoogleDriveToken();

  const editorPrefs: EditorPreferences = options.editorPreferences || {
    formatOnAutoSave: options.formatOnAutoSave ?? true,
    autoSaveIntervalSeconds: 30,
    normalizeLists: true,
    normalizeHeaders: true,
    normalizeSpacing: true,
    normalizeTables: true,
    normalizeBlockquotes: true,
    cloudAutoSync: options.cloudAutoSync ?? true,
  };

  const updateEditorPrefs = (patch: Partial<EditorPreferences>) => {
    const updated: EditorPreferences = {
      ...editorPrefs,
      ...patch,
    };
    setOptions({
      ...options,
      formatOnAutoSave: updated.formatOnAutoSave,
      cloudAutoSync: updated.cloudAutoSync,
      editorPreferences: updated,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Preferences &amp; Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure auto-save formatting &amp; PDF conversion engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-zinc-800 flex space-x-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setActiveTab('autosave')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'autosave'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Auto-Save &amp; Formatter</span>
            {editorPrefs.formatOnAutoSave && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conversion')}
            className={`pb-2.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'conversion'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>PDF Conversion Rules</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 max-h-[60vh] overflow-y-auto">
          
          {activeTab === 'autosave' && (
            <div className="space-y-3.5">
              {/* Master Auto-Format Toggle */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Auto-Format on Auto-Save
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
                        Automatically cleans &amp; standardizes Markdown whenever auto-save triggers
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                    <input
                      type="checkbox"
                      checked={editorPrefs.formatOnAutoSave}
                      onChange={(e) => updateEditorPrefs({ formatOnAutoSave: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {editorPrefs.formatOnAutoSave && (
                  <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    <span>Active: Normalizes lists, headers &amp; blank lines on every save.</span>
                    {onFormatDocumentNow && (
                      <button
                        type="button"
                        onClick={() => {
                          onFormatDocumentNow();
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold shadow-2xs transition-all"
                      >
                        Format Document Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sub-Rules for Formatting */}
              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Formatting Rules Included in Auto-Save
                </span>

                {/* Rule 1: Normalizing Lists */}
                <div className="flex items-start space-x-3 p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                  <input
                    type="checkbox"
                    id="normalizeLists"
                    checked={editorPrefs.normalizeLists}
                    onChange={(e) => updateEditorPrefs({ normalizeLists: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                  />
                  <label htmlFor="normalizeLists" className="cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Normalize Lists &amp; Numbered Sequences
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Standardizes bullet spacing (<code className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">- item</code>), sequential numbered lists (<code className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">1., 2., 3.</code>), and checkbox markers (<code className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">- [ ]</code>).
                    </span>
                  </label>
                </div>

                {/* Rule 2: Normalizing Headers */}
                <div className="flex items-start space-x-3 p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                  <input
                    type="checkbox"
                    id="normalizeHeaders"
                    checked={editorPrefs.normalizeHeaders}
                    onChange={(e) => updateEditorPrefs({ normalizeHeaders: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                  />
                  <label htmlFor="normalizeHeaders" className="cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                      <Heading className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Normalize Header Spacing &amp; Hashes
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Inserts required space after hashes (<code className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded"># Heading</code>) and ensures clean vertical separation before headings.
                    </span>
                  </label>
                </div>

                {/* Rule 3: Normalizing Whitespace */}
                <div className="flex items-start space-x-3 p-2.5 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                  <input
                    type="checkbox"
                    id="normalizeSpacing"
                    checked={editorPrefs.normalizeSpacing}
                    onChange={(e) => updateEditorPrefs({ normalizeSpacing: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                  />
                  <label htmlFor="normalizeSpacing" className="cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                      <AlignLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Trim Trailing Whitespace &amp; Redundant Blank Lines
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Removes trailing line spaces and condenses 3+ blank lines down to a clean paragraph divider (<code className="text-[10px] bg-slate-200 dark:bg-zinc-700 px-1 py-0.5 rounded">\n\n</code>).
                    </span>
                  </label>
                </div>

                {/* Auto-Save Interval Frequency */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 rounded-xl border border-slate-200 dark:border-zinc-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Auto-Save Frequency
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      How frequently drafts and formatting are persisted
                    </span>
                  </div>
                  <select
                    value={editorPrefs.autoSaveIntervalSeconds}
                    onChange={(e) => updateEditorPrefs({ autoSaveIntervalSeconds: Number(e.target.value) })}
                    className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-xs font-bold px-2.5 py-1.5 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value={15}>Every 15s</option>
                    <option value={30}>Every 30s (Default)</option>
                    <option value={60}>Every 60s</option>
                    <option value={120}>Every 2 min</option>
                  </select>
                </div>

                {/* Google Drive Cloud Auto-Sync */}
                <div className="p-3.5 bg-gradient-to-r from-blue-50/90 to-sky-50/90 dark:from-blue-950/40 dark:to-sky-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                          Google Drive Auto-Sync
                          {isGoogleAuthed ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                              Connected
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.2 rounded-full">
                              Sign-in required
                            </span>
                          )}
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
                          Syncs active document state to Google Drive on auto-save
                        </span>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                      <input
                        type="checkbox"
                        checked={editorPrefs.cloudAutoSync ?? true}
                        onChange={(e) => updateEditorPrefs({ cloudAutoSync: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <p className="text-[11px] text-blue-800 dark:text-blue-300 font-medium pt-1 border-t border-blue-200/60 dark:border-blue-800/40">
                    When enabled and authenticated, auto-save saves locally and automatically updates your linked file in Google Drive (/My Drive/PDF Conversions/).
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'conversion' && (
            <div className="space-y-3.5">
              {/* Language OCR & Script Hint */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors space-y-1.5">
                <label htmlFor="languageHint" className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Language OCR &amp; Script Hint
                  </span>
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full font-semibold border border-purple-200 dark:border-purple-800">
                    Arabic &amp; Amharic Precision
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Hinting document language enhances OCR character recognition and script directionality (RTL/LTR) for Gemini AI and native parsers.
                </p>
                <select
                  id="languageHint"
                  value={options.languageHint || 'Auto'}
                  onChange={(e) => setOptions({ ...options, languageHint: e.target.value })}
                  className="w-full mt-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
                >
                  <option value="Auto">Auto-Detect (Arabic, Amharic, Multilingual)</option>
                  <option value="Arabic">Arabic (العربية - Right to Left RTL)</option>
                  <option value="Amharic">Amharic (አማርኛ - Ethiopic Script)</option>
                  <option value="English">English</option>
                  <option value="French">French</option>
                  <option value="Spanish">Spanish</option>
                  <option value="German">German</option>
                </select>
              </div>

              {/* Option 1: Tables */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                <input
                  type="checkbox"
                  id="extractTables"
                  checked={options.extractTables}
                  onChange={(e) => setOptions({ ...options, extractTables: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                />
                <label htmlFor="extractTables" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Format Tables into GitHub Markdown (GFM)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Extract table cells and headers using standard Markdown pipes (| col |) and alignment dividers.
                  </span>
                </label>
              </div>

              {/* Option 2: Layout structure */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                <input
                  type="checkbox"
                  id="preserveLayout"
                  checked={options.preserveLayout}
                  onChange={(e) => setOptions({ ...options, preserveLayout: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                />
                <label htmlFor="preserveLayout" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Preserve Heading Hierarchy &amp; Lists
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Map document titles, section headings, nested bullet lists, and numbered steps accurately.
                  </span>
                </label>
              </div>

              {/* Option 3: LaTeX Math */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                <input
                  type="checkbox"
                  id="mathLatex"
                  checked={options.mathLatex}
                  onChange={(e) => setOptions({ ...options, mathLatex: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                />
                <label htmlFor="mathLatex" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    <Sigma className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Extract Mathematical Formulas ($ and $$ LaTeX)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Convert mathematical equations, symbols, and formulas into inline and block LaTeX syntax.
                  </span>
                </label>
              </div>

              {/* Option 4: Clean headers and footers */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                <input
                  type="checkbox"
                  id="cleanHeadersFooters"
                  checked={options.cleanHeadersFooters}
                  onChange={(e) => setOptions({ ...options, cleanHeadersFooters: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                />
                <label htmlFor="cleanHeadersFooters" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Remove Repetitive Running Footers &amp; Page Numbers
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Omit page margins, headers, and footer repeats across page breaks for continuous document flow.
                  </span>
                </label>
              </div>

              {/* Option 5: Image Alt Captions */}
              <div className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-zinc-800/60 hover:bg-blue-50/30 rounded-xl border border-slate-200 dark:border-zinc-700/60 transition-colors">
                <input
                  type="checkbox"
                  id="extractImagesDesc"
                  checked={options.extractImagesDesc}
                  onChange={(e) => setOptions({ ...options, extractImagesDesc: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600"
                />
                <label htmlFor="extractImagesDesc" className="cursor-pointer">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Extract Image &amp; Diagram Figure Captions
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    Include alt tags describing charts, diagrams, and visual figures found in the PDF.
                  </span>
                </label>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply &amp; Save Preferences</span>
          </button>
        </div>

      </div>
    </div>
  );
};

