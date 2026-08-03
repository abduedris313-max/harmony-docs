import React, { useState, useEffect } from 'react';
import {
  FileText,
  History,
  Settings,
  Sparkles,
  RefreshCw,
  Cloud,
  Download,
  BookOpen,
  ChevronDown,
  Printer,
  Menu,
  X,
  Layers,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  Wifi,
  WifiOff,
  FolderSearch,
  HardDrive,
  Edit3,
  Plus,
  FileUp
} from 'lucide-react';
import { marked } from 'marked';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenVersionHistory: () => void;
  onOpenCloudStorage: () => void;
  onOpenBookLibrary?: () => void;
  onOpenScanner?: () => void;
  onOpenLocalFileManager?: () => void;
  onOpenSettings: () => void;
  onNewDocument: () => void;
  onLoadSample: () => void;
  onNewBlankDocument?: () => void;
  historyCount: number;
  versionCount: number;
  booksCount?: number;
  hasActiveDoc: boolean;
  isConverting: boolean;
  isOnline?: boolean;
  activeMarkdown?: string;
  activeFilename?: string;
  currentView?: 'library' | 'editor' | 'uploader' | 'pdf-editor';
  onNavigateView?: (view: 'library' | 'editor' | 'uploader' | 'pdf-editor') => void;
  onShowToast?: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenVersionHistory,
  onOpenCloudStorage,
  onOpenBookLibrary,
  onOpenScanner,
  onOpenLocalFileManager,
  onOpenSettings,
  onNewDocument,
  onLoadSample,
  onNewBlankDocument,
  historyCount,
  versionCount,
  booksCount = 0,
  hasActiveDoc,
  isConverting,
  isOnline = true,
  activeMarkdown = '',
  activeFilename = '',
  currentView = 'library',
  onNavigateView,
  onShowToast,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  // Track scroll position for header compaction
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      alert(
        'To install on Chrome / Mobile:\n\n1. Open browser menu (3 dots or Share icon).\n2. Select "Add to Home screen" or "Install App".'
      );
    }
  };

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalBadges = historyCount + versionCount + booksCount;

  return (
    <header
      className={`bg-white/90 backdrop-blur-xl border-b border-black/10 sticky top-0 z-40 text-slate-900 transition-all duration-300 ${
        isScrolled ? 'h-12 shadow-xs bg-white/95 border-black/15' : 'h-14'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2">
        {/* Brand Logo & iOS Back Navigation */}
        <div className="flex items-center space-x-2.5 min-w-0">
          {onNavigateView && (currentView === 'editor' || currentView === 'uploader' || currentView === 'pdf-editor') ? (
            <button
              onClick={() => onNavigateView('library')}
              className="px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#007AFF] font-bold text-xs flex items-center space-x-1 border border-blue-100 transition-all active:scale-95 shrink-0"
              title="Return to Document Library"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
              <span>Library</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#007AFF] text-white shadow-xs flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 min-w-0">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 truncate">
                {currentView === 'library' ? 'Library' : currentView === 'pdf-editor' ? 'PDF Editor' : 'PDF to MD'}
              </h1>
              {hasActiveDoc && activeFilename && currentView === 'editor' ? (
                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium truncate max-w-[140px] md:max-w-[200px] bg-slate-100 px-2 py-0.5 rounded-full">
                  {activeFilename}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">
                  {currentView === 'library' ? '/ iOS Reader' : currentView === 'pdf-editor' ? '/ Canvas Editor' : '/ Editor'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP TOP BAR CONTROLS (lg:flex) */}
        <div className="hidden lg:flex items-center space-x-2">
          {/* Offline / Online Status Badge */}
          <div
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 transition-all border ${
              isOnline !== false
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
            title={isOnline !== false ? 'Offline Ready: All documents saved locally' : 'Working Offline Mode'}
          >
            {isOnline !== false ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
            <span>{isOnline !== false ? 'Offline Ready' : 'Offline'}</span>
          </div>

          {currentView === 'library' ? (
            <>
              {/* Scan Local Directory Button */}
              {onOpenScanner && (
                <button
                  onClick={onOpenScanner}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-all flex items-center space-x-1.5 border border-slate-200 shadow-3xs"
                  title="Scan local computer directory for PDFs and notes"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Scan Folder</span>
                </button>
              )}

              {/* Local Storage & File Manager */}
              {onOpenLocalFileManager && (
                <button
                  onClick={onOpenLocalFileManager}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-all flex items-center space-x-1.5 border border-slate-200 shadow-3xs"
                  title="Manage offline local files, folders, & backup"
                >
                  <HardDrive className="w-3.5 h-3.5 text-slate-700" />
                  <span>Local Files</span>
                </button>
              )}

              {/* Create New Blank Note */}
              {onNewBlankDocument && (
                <button
                  onClick={onNewBlankDocument}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-all flex items-center space-x-1.5 shadow-3xs active:scale-95"
                  title="Create a new blank note"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>New Note</span>
                </button>
              )}

              {/* Upload PDF Button */}
              {onNavigateView && (
                <button
                  onClick={() => onNavigateView('uploader')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1.5 shadow-xs active:scale-95"
                  title="Upload local PDF for markdown conversion"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload PDF</span>
                </button>
              )}

              {/* Sample PDF Button */}
              <button
                onClick={onLoadSample}
                disabled={isConverting}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all flex items-center space-x-1.5 shadow-xs active:scale-95"
                title="Load pre-built sample document"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Sample PDF</span>
              </button>
            </>
          ) : (
            <>
              {/* Scan Local Directory Button in Non-Library view if needed */}
              {onOpenScanner && (
                <button
                  onClick={onOpenScanner}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-all flex items-center space-x-1.5 border border-slate-200 shadow-3xs"
                  title="Scan local computer directory"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-[#007AFF]" />
                  <span>Scan Folder</span>
                </button>
              )}

              {/* Local Storage in Non-Library view if needed */}
              {onOpenLocalFileManager && (
                <button
                  onClick={onOpenLocalFileManager}
                  className="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-all flex items-center space-x-1.5 border border-slate-200 shadow-3xs"
                  title="Manage offline local files"
                >
                  <HardDrive className="w-3.5 h-3.5 text-slate-700" />
                  <span>Local Files</span>
                </button>
              )}

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
            </>
          )}

          {/* PDF Editor Button (Always Visible) */}
          {onNavigateView && (
            <button
              onClick={() => onNavigateView('pdf-editor')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all flex items-center space-x-1.5 border shadow-3xs ${
                currentView === 'pdf-editor'
                  ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
              }`}
              title="Interactive Visual PDF Canvas Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>PDF Editor</span>
            </button>
          )}

          {/* Cloud Storage Button */}
          <button
            onClick={onOpenCloudStorage}
            className="px-3 py-1.5 text-xs font-semibold text-[#007AFF] hover:bg-[#007AFF]/10 rounded-full transition-all flex items-center space-x-1.5"
            title="Google Drive & Dropbox Integration"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud</span>
          </button>

          {currentView !== 'library' && (
            <>
              {/* Version Snapshots Button */}
              <button
                onClick={onOpenVersionHistory}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-full transition-all flex items-center space-x-1.5 relative"
                title="Document Version Snapshots"
              >
                <History className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Versions</span>
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
                <span>History</span>
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
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
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
                  <span>New Document</span>
                </button>
              )}

              {!hasActiveDoc && (
                <button
                  onClick={onLoadSample}
                  disabled={isConverting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sample PDF</span>
                </button>
              )}
            </>
          )}

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 rounded-full transition-all flex items-center space-x-1.5"
              title="Install Web App on Chrome / Mobile"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
            title="Conversion Rules & Settings"
            aria-label="Conversion Rules & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* MOBILE & TABLET QUICK ACTIONS + HAMBURGER MENU TOGGLE (< lg) */}
        <div className="flex lg:hidden items-center space-x-1.5">
          {/* Quick Upload PDF Button on mobile in library view */}
          {currentView === 'library' && onNavigateView && (
            <button
              onClick={() => onNavigateView('uploader')}
              className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1 shadow-xs active:scale-95 shrink-0"
              title="Upload local PDF"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          )}

          {/* Quick New Note Button on mobile in library view */}
          {currentView === 'library' && onNewBlankDocument && (
            <button
              onClick={onNewBlankDocument}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition-all flex items-center space-x-1 shadow-2xs active:scale-95 shrink-0"
              title="New blank note"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>Note</span>
            </button>
          )}

          {/* Quick Library Button on mobile in non-library views */}
          {currentView !== 'library' && onOpenBookLibrary && (
            <button
              onClick={onOpenBookLibrary}
              className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all flex items-center space-x-1 relative shadow-xs"
              title="Open Book Library"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Library</span>
              {booksCount > 0 && (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                  {booksCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Export Button on mobile if doc active */}
          {hasActiveDoc && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-2.5 py-1.5 text-xs font-bold text-white bg-[#007AFF] hover:bg-[#0062CC] rounded-full transition-all flex items-center space-x-1 shadow-xs"
                title="Export"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>

              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-black/10 py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      onClick={() => {
                        handleDownloadMd();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#007AFF] flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-[#007AFF]" />
                        <span>Markdown (.md)</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        handleDownloadPdf();
                        setShowExportMenu(false);
                      }}
                      className="w-full px-3.5 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <Printer className="w-4 h-4 text-amber-600" />
                        <span>PDF Document (.pdf)</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all relative flex items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-900" />
            ) : (
              <>
                <Menu className="w-5 h-5 text-slate-900" />
                {totalBadges > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#007AFF] rounded-full ring-2 ring-white" />
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE DRAWER SLIDE-DOWN MENU */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-2xl border-b border-black/10 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {/* Active Document Info Banner on Mobile */}
            {hasActiveDoc && activeFilename && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-blue-100 text-[#007AFF] flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Active File</p>
                    <p className="text-xs font-bold text-slate-800 truncate">{activeFilename}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onNewDocument();
                    setIsMobileMenuOpen(false);
                  }}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-[#007AFF] rounded-xl flex items-center space-x-1 shrink-0 shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>
            )}

            {/* Quick Actions Grid */}
            {onNavigateView && (
              <button
                onClick={() => {
                  onNavigateView('pdf-editor');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 mb-2 rounded-2xl bg-blue-600 text-white flex items-center justify-between hover:bg-blue-700 transition-all shadow-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <Edit3 className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span className="text-xs font-extrabold">PDF Visual Editor</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-white/80" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {onOpenBookLibrary && (
                <button
                  onClick={() => {
                    onOpenBookLibrary();
                    setIsMobileMenuOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-900 text-white flex items-center justify-between hover:bg-slate-800 transition-all shadow-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">Book Library</span>
                  </div>
                  {booksCount > 0 && (
                    <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {booksCount}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  onOpenCloudStorage();
                  setIsMobileMenuOpen(false);
                }}
                className="p-3 rounded-2xl bg-blue-50 text-[#007AFF] flex items-center justify-between hover:bg-blue-100 transition-all border border-blue-100"
              >
                <div className="flex items-center space-x-2.5">
                  <Cloud className="w-4 h-4" />
                  <span className="text-xs font-bold">Cloud Drive</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </div>

            {/* Version & History List Items */}
            <div className="space-y-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => {
                  onOpenVersionHistory();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-3">
                  <History className="w-4 h-4 text-[#007AFF]" />
                  <span>Version Snapshots</span>
                </div>
                <div className="flex items-center space-x-2">
                  {versionCount > 0 && (
                    <span className="bg-[#007AFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {versionCount} {versionCount === 1 ? 'snapshot' : 'snapshots'}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenHistory();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-slate-600" />
                  <span>Conversion History</span>
                </div>
                <div className="flex items-center space-x-2">
                  {historyCount > 0 && (
                    <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {historyCount} {historyCount === 1 ? 'file' : 'files'}
                    </span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full p-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>Conversion Rules &amp; Settings</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* Document Creation / Sample PDF Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
              {!hasActiveDoc ? (
                <button
                  onClick={() => {
                    onLoadSample();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isConverting}
                  className="w-full py-2.5 bg-[#007AFF] hover:bg-[#0062CC] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Load Sample PDF Document</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onNewDocument();
                    setIsMobileMenuOpen(false);
                  }}
                  disabled={isConverting}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-[#007AFF] text-xs font-bold rounded-xl flex items-center justify-center space-x-2 border border-blue-200"
                >
                  <RefreshCw className={`w-4 h-4 ${isConverting ? 'animate-spin' : ''}`} />
                  <span>Upload New PDF File</span>
                </button>
              )}

              {!isInstalled && (
                <button
                  onClick={() => {
                    handleInstallClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-2 border border-emerald-200"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Install Progressive Web App</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
