import React, { useState, useEffect } from 'react';
import { FileText, History, Settings, Sparkles, RefreshCw, Cloud, Download, BookOpen, ChevronDown, Printer } from 'lucide-react';
import { marked } from 'marked';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenVersionHistory: () => void;
  onOpenCloudStorage: () => void;
  onOpenBookLibrary?: () => void;
  onOpenSettings: () => void;
  onNewDocument: () => void;
  onLoadSample: () => void;
  historyCount: number;
  versionCount: number;
  booksCount?: number;
  hasActiveDoc: boolean;
  isConverting: boolean;
  activeMarkdown?: string;
  activeFilename?: string;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenVersionHistory,
  onOpenCloudStorage,
  onOpenBookLibrary,
  onOpenSettings,
  onNewDocument,
  onLoadSample,
  historyCount,
  versionCount,
  booksCount = 0,
  hasActiveDoc,
  isConverting,
  activeMarkdown = '',
  activeFilename = '',
  onShowToast,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // 1. Download Markdown (.md)
  const handleDownloadMd = () => {
    if (!activeMarkdown) return;
    const baseName = activeFilename.replace(/\.[^/.]+$/, "") || "document";
    const blob = new Blob([activeMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast("Exported to Local Drive", `${baseName}.md saved successfully`, "success");
    }
  };

  // 2. Download/Print PDF Document (.pdf)
  const handleDownloadPdf = async () => {
    if (!activeMarkdown) return;
    const baseName = activeFilename.replace(/\.[^/.]+$/, "") || "document";
    const rawHtml = await marked.parse(activeMarkdown);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onShowToast) {
        onShowToast("Popup Blocked", "Please allow popups to open the PDF print dialog", "error");
      }
      return;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${baseName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 { color: #000; font-weight: 700; page-break-after: avoid; }
    h1 { font-size: 24pt; border-bottom: 1.5pt solid #e5e7eb; padding-bottom: 8pt; margin-top: 0; }
    h2 { font-size: 16pt; margin-top: 18pt; border-bottom: 0.5pt solid #f3f4f6; }
    p, li { font-size: 10.5pt; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; page-break-inside: avoid; }
    th, td { border: 1pt solid #d1d5db; padding: 6pt 8pt; font-size: 9.5pt; text-align: left; }
    th { background-color: #f3f4f6; font-weight: 600; }
    pre { background-color: #f8fafc; border: 1pt solid #e2e8f0; padding: 10pt; border-radius: 4pt; font-size: 9pt; white-space: pre-wrap; }
    blockquote { border-left: 3pt solid #007AFF; margin: 10pt 0; padding-left: 10pt; color: #4b5563; }
  </style>
</head>
<body>
  ${rawHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
    if (onShowToast) {
      onShowToast("Print / Save as PDF Opened", "Use 'Save as PDF' in the print dialog", "info");
    }
  };

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on Chrome:\n\n1. Click the 3 dots (⋮) or Install icon in Chrome\'s address bar.\n2. Select "Install PDF to Markdown AI Pro...".');
    }
  };
  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-30 text-slate-900 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#007AFF] text-white shadow-sm flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-semibold text-sm sm:text-base tracking-tight text-slate-900">
                Documents
              </h1>
              <span className="text-[11px] text-slate-400 font-medium">/ PDF Reader</span>
            </div>
          </div>
        </div>

        {/* iOS Styled Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Book Library Button */}
          {onOpenBookLibrary && (
            <button
              onClick={onOpenBookLibrary}
              className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all flex items-center space-x-1.5 shadow-xs relative"
              title="Open Book Library & Personal Collection"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Library</span>
              {booksCount > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                  {booksCount}
                </span>
              )}
            </button>
          )}

          {/* Cloud Storage Button */}
          <button
            onClick={onOpenCloudStorage}
            className="px-3 py-1.5 text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-all flex items-center space-x-1.5"
            title="Google Drive & Dropbox Integration"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Cloud</span>
          </button>

          {/* Version Snapshots Button */}
          <button
            onClick={onOpenVersionHistory}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-full transition-all flex items-center space-x-1.5 relative"
            title="Document Version Snapshots"
          >
            <History className="w-3.5 h-3.5 text-[#007AFF]" />
            <span className="hidden sm:inline">Versions</span>
            {versionCount > 0 && (
              <span className="bg-[#007AFF] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {versionCount}
              </span>
            )}
          </button>

          {/* Conversion History Button */}
          <button
            onClick={onOpenHistory}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-full transition-all flex items-center space-x-1.5 relative"
            title="View Conversion History"
          >
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="bg-slate-800 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {historyCount}
              </span>
            )}
          </button>

          {/* File Export Dropdown Button */}
          {hasActiveDoc && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1.5 shadow-xs"
                title="Export current document as .md or .pdf"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3.5 py-1.5 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      Export Document
                    </div>
                    <button
                      onClick={() => {
                        handleDownloadMd();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#007AFF] flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#007AFF]" />
                        <span>Markdown (.md)</span>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-[#007AFF] font-bold px-1.5 py-0.5 rounded font-mono">
                        .md
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        handleDownloadPdf();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Printer className="w-4 h-4 text-amber-600" />
                        <span>PDF Document (.pdf)</span>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded font-mono">
                        .pdf
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {hasActiveDoc && (
            <button
              onClick={onNewDocument}
              disabled={isConverting}
              className="px-3 py-1.5 text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-all flex items-center space-x-1"
              title="Upload new PDF file"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">New Document</span>
            </button>
          )}

          {!hasActiveDoc && (
            <button
              onClick={onLoadSample}
              disabled={isConverting}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sample PDF</span>
            </button>
          )}

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-full transition-all flex items-center space-x-1.5"
              title="Install Web App on Chrome / Desktop"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Install</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="Conversion Rules & Settings"
            aria-label="Conversion Rules & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};
