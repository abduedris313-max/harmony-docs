import React, { useState, useEffect } from 'react';
import { FileText, History, Settings, Sparkles, RefreshCw, Cloud, Download, BookOpen } from 'lucide-react';

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
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

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
