import React from 'react';
import { X, Settings, Sliders, Check, ShieldCheck, Table, Sigma, FileText } from 'lucide-react';
import { ConversionOptions } from '../types';

interface ConversionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
}

export const ConversionSettingsModal: React.FC<ConversionSettingsModalProps> = ({
  isOpen,
  onClose,
  options,
  setOptions,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-800">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              PDF Conversion Rules &amp; Preferences
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5">
          
          {/* Option 1: Tables */}
          <div className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="extractTables"
              checked={options.extractTables}
              onChange={(e) => setOptions({ ...options, extractTables: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <label htmlFor="extractTables" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-600" />
                Format Tables into GitHub Markdown (GFM)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                Extract table cells and headers using standard Markdown pipes (| col |) and alignment dividers.
              </span>
            </label>
          </div>

          {/* Option 2: Layout structure */}
          <div className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="preserveLayout"
              checked={options.preserveLayout}
              onChange={(e) => setOptions({ ...options, preserveLayout: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <label htmlFor="preserveLayout" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Preserve Heading Hierarchy &amp; Lists
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                Map document titles, section headings, nested bullet lists, and numbered steps accurately.
              </span>
            </label>
          </div>

          {/* Option 3: LaTeX Math */}
          <div className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="mathLatex"
              checked={options.mathLatex}
              onChange={(e) => setOptions({ ...options, mathLatex: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <label htmlFor="mathLatex" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5 text-blue-600" />
                Extract Mathematical Formulas ($ and $$ LaTeX)
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                Convert mathematical equations, symbols, and formulas into inline and block LaTeX syntax.
              </span>
            </label>
          </div>

          {/* Option 4: Clean headers and footers */}
          <div className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="cleanHeadersFooters"
              checked={options.cleanHeadersFooters}
              onChange={(e) => setOptions({ ...options, cleanHeadersFooters: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <label htmlFor="cleanHeadersFooters" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Remove Repetitive Running Footers &amp; Page Numbers
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                Omit page margins, headers, and footer repeats across page breaks for continuous document flow.
              </span>
            </label>
          </div>

          {/* Option 5: Image Alt Captions */}
          <div className="flex items-start space-x-3 p-3 bg-slate-50 hover:bg-blue-50/30 rounded-xl border border-slate-200 transition-colors">
            <input
              type="checkbox"
              id="extractImagesDesc"
              checked={options.extractImagesDesc}
              onChange={(e) => setOptions({ ...options, extractImagesDesc: e.target.checked })}
              className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-white border-slate-300"
            />
            <label htmlFor="extractImagesDesc" className="cursor-pointer">
              <span className="text-xs font-bold text-slate-800 block flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Extract Image &amp; Diagram Figure Captions
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 font-medium">
                Include alt tags describing charts, diagrams, and visual figures found in the PDF.
              </span>
            </label>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Apply Rules</span>
          </button>
        </div>

      </div>
    </div>
  );
};
