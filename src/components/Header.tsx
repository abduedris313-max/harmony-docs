import React, { useState, useEffect } from 'react';
import { FileText, History, Settings, Sparkles, RefreshCw, Cloud, Download } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenVersionHistory: () => void;
  onOpenCloudStorage: () => void;
  onOpenSettings: () => void;
  onNewDocument: () => void;
  onLoadSample: () => void;
  historyCount: number;
  versionCount: number;
  hasActiveDoc: boolean;
  isConverting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenVersionHistory,
  onOpenCloudStorage,
  onOpenSettings,
  onNewDocument,
  onLoadSample,
  historyCount,
  versionCount,
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 text-slate-800 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                PDF <span className="text-blue-600">to</span> Markdown
              </h1>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                AI Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
              Convert PDFs to GFM Markdown • Real-time Editor • Cloud Sync • Version History
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          
          {/* Cloud Storage Button */}
          <button
            onClick={onOpenCloudStorage}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-lg transition-all flex items-center space-x-1.5 shadow-2xs"
            title="Google Drive & Dropbox Integration"
          >
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Cloud Storage</span>
          </button>

          {/* Version Snapshots Button */}
          <button
            onClick={onOpenVersionHistory}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 rounded-lg transition-all flex items-center space-x-1.5 relative shadow-2xs"
            title="Document Version Snapshots"
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Versions</span>
            {versionCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {versionCount}
              </span>
            )}
          </button>

          {/* Conversion History Button */}
          <button
            onClick={onOpenHistory}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1.5 relative shadow-2xs"
            title="View Conversion History"
          >
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="bg-slate-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[18px] text-center">
                {historyCount}
              </span>
            )}
          </button>

          {hasActiveDoc && (
            <button
              onClick={onNewDocument}
              disabled={isConverting}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1 shadow-2xs"
              title="Upload new PDF file"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConverting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">New PDF</span>
            </button>
          )}

          {!hasActiveDoc && (
            <button
              onClick={onLoadSample}
              disabled={isConverting}
              className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all flex items-center space-x-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Sample PDF</span>
            </button>
          )}

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all flex items-center space-x-1.5 shadow-2xs"
              title="Install Web App on Chrome / Desktop"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Install App</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
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
