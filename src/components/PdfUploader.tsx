import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, Sparkles, Sliders, AlertCircle, File, Table, Sigma, ShieldCheck } from 'lucide-react';
import { ConversionOptions } from '../types';

interface PdfUploaderProps {
  onConvertPdf: (file: File, options: ConversionOptions) => void;
  isConverting: boolean;
  conversionProgress: string;
  error: string | null;
  options: ConversionOptions;
  setOptions: React.Dispatch<React.SetStateAction<ConversionOptions>>;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  onConvertPdf,
  isConverting,
  conversionProgress,
  error,
  options,
  setOptions,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setSelectedFile(file);
      } else {
        alert('Please select a valid PDF file (.pdf)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleStartConversion = () => {
    if (selectedFile) {
      onConvertPdf(selectedFile, options);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Hero Welcome Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-slate-900 text-slate-100 rounded-full px-3.5 py-1 text-xs font-medium mb-3 shadow-xs">
          <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>iOS Document Parser &amp; Markdown Reader</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Convert PDF Documents to Clean Markdown
        </h2>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          Extract structured headings, lists, tables, formulas, and code blocks. View and edit in an authentic iOS Document Reader interface.
        </p>
      </div>

      {/* Primary Upload Dropzone Card */}
      <div className="bg-white border border-black/5 rounded-3xl shadow-sm overflow-hidden p-6 sm:p-8 transition-all">
        
        {/* Dropzone Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isConverting && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-[#007AFF] bg-[#007AFF]/5 scale-[1.01]'
              : selectedFile
              ? 'border-[#007AFF] bg-[#007AFF]/5'
              : 'border-slate-200 hover:border-[#007AFF] bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            className="hidden"
          />

          {isConverting ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-[#007AFF]/20 border-t-[#007AFF] animate-spin flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#007AFF]" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-800">Converting PDF Document...</p>
                <p className="text-xs text-[#007AFF] mt-1 animate-pulse">{conversionProgress || 'Analyzing page layout & formatting structure...'}</p>
              </div>
            </div>
          ) : selectedFile ? (
            <div className="py-2 flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl flex items-center justify-center mb-3 shadow-xs">
                <File className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="mt-3 text-xs text-slate-500 hover:text-red-600 underline font-medium"
              >
                Choose a different file
              </button>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-white text-[#007AFF] border border-slate-200/80 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-700">
                <span className="text-[#007AFF] font-semibold">Tap to select PDF</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports academic papers, reports, invoices, manuals, and eBooks
              </p>
            </div>
          )}
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Conversion Error</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Conversion Settings Quick Toggles */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversion Formatting Rules</span>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              {showAdvanced ? 'Hide options' : 'More options'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.extractTables}
                onChange={(e) => setOptions({ ...options, extractTables: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-blue-600" />
                GFM Tables
              </span>
            </label>

            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.mathLatex}
                onChange={(e) => setOptions({ ...options, mathLatex: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                LaTeX / Math
              </span>
            </label>

            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.cleanHeadersFooters}
                onChange={(e) => setOptions({ ...options, cleanHeadersFooters: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Clean Footers
              </span>
            </label>

            <label className="flex items-center space-x-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.extractImagesDesc}
                onChange={(e) => setOptions({ ...options, extractImagesDesc: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Figure Captions
              </span>
            </label>
          </div>

          {showAdvanced && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                <span>Page Range Extraction:</span>
                <select
                  value={options.pageRange}
                  onChange={(e) => setOptions({ ...options, pageRange: e.target.value })}
                  className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="All">All Pages</option>
                  <option value="Pages 1-5">First 5 Pages</option>
                  <option value="Pages 1-10">First 10 Pages</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        {selectedFile && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleStartConversion}
              disabled={isConverting}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium text-sm rounded-md shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Convert to Markdown</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
