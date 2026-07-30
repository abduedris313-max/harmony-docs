import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  Cloud, 
  Folder, 
  FileText, 
  Upload, 
  Download, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  UserCheck,
  FolderPlus
} from 'lucide-react';
import { CloudProvider, CloudFile, CloudAccount } from '../types';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarkdown: string;
  currentFilename: string;
  onLoadPdfFromCloud: (pdfDataUrl: string, filename: string) => void;
  onLoadMarkdownFromCloud: (markdownContent: string, filename: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

const INITIAL_CLOUD_ACCOUNTS: Record<CloudProvider, CloudAccount> = {
  'google-drive': {
    provider: 'google-drive',
    connected: true,
    accountName: 'Abdutuahir (Google Workspace)',
    accountEmail: 'abdutuahir@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    usedStorageMb: 4320,
    totalStorageMb: 15360,
  },
  'dropbox': {
    provider: 'dropbox',
    connected: true,
    accountName: 'Abdutuahir Personal',
    accountEmail: 'abdutuahir@gmail.com',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    usedStorageMb: 1120,
    totalStorageMb: 2048,
  },
};

const SAMPLE_CLOUD_FILES: CloudFile[] = [
  {
    id: 'gdrive-1',
    name: 'Q3_Financial_Quarterly_Report.pdf',
    provider: 'google-drive',
    type: 'pdf',
    sizeBytes: 1240000,
    updatedAt: Date.now() - 3600000 * 5,
    path: '/My Drive/Finance Reports/Q3_Financial_Quarterly_Report.pdf',
    pdfDataUrl: '',
  },
  {
    id: 'gdrive-2',
    name: 'Project_Architecture_Overview.md',
    provider: 'google-drive',
    type: 'md',
    sizeBytes: 18400,
    updatedAt: Date.now() - 3600000 * 24,
    path: '/My Drive/Technical Docs/Project_Architecture_Overview.md',
    content: `# System Architecture & System Specs 2026\n\n## 1. Overview\nThis document describes the high-level cloud architecture.\n\n### Key Components\n- **API Ingress**: Express microservice proxying AI requests.\n- **Storage Engine**: Google Drive & Dropbox sync with local fallback.\n- **Parser**: Marked JS with Highlight.js code highlighting.\n\n\`\`\`typescript\ninterface CloudSyncConfig {\n  autoSyncIntervalMs: number;\n  maxRetries: number;\n}\n\`\`\`\n\n- [x] Integrate OAuth authentication\n- [x] Configure GFM markdown support\n- [ ] Deploy multi-region backup`,
  },
  {
    id: 'gdrive-3',
    name: 'Technical_Specification_2026.pdf',
    provider: 'google-drive',
    type: 'pdf',
    sizeBytes: 2450000,
    updatedAt: Date.now() - 3600000 * 48,
    path: '/My Drive/PDF Conversions/Technical_Specification_2026.pdf',
  },
  {
    id: 'dropbox-1',
    name: 'Executive_Summary_Deck.pdf',
    provider: 'dropbox',
    type: 'pdf',
    sizeBytes: 3100000,
    updatedAt: Date.now() - 3600000 * 2,
    path: '/Dropbox/Documents/Executive_Summary_Deck.pdf',
  },
  {
    id: 'dropbox-2',
    name: 'Meeting_Action_Items.md',
    provider: 'dropbox',
    type: 'md',
    sizeBytes: 8500,
    updatedAt: Date.now() - 3600000 * 12,
    path: '/Dropbox/Work/Meeting_Action_Items.md',
    content: `# Weekly Sync & Key Action Items\n\n## Attendees\n- Alex Miller (Lead Architect)\n- Sarah Chen (UI Designer)\n- Abdutuahir (Core Developer)\n\n## Action Items\n- [x] Update Markdown editor with syntax highlighting\n- [x] Connect Google Drive and Dropbox OAuth handlers\n- [ ] Review PDF parsing rules for scanned math equations\n\n> Note: All documents must be synced to cloud backup before end of week.`,
  }
];

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  currentMarkdown,
  currentFilename,
  onLoadPdfFromCloud,
  onLoadMarkdownFromCloud,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<CloudProvider>('google-drive');
  const [accounts, setAccounts] = useState<Record<CloudProvider, CloudAccount>>(() => {
    const saved = localStorage.getItem('cloud_accounts_state');
    return saved ? JSON.parse(saved) : INITIAL_CLOUD_ACCOUNTS;
  });

  const [cloudFiles, setCloudFiles] = useState<CloudFile[]>(() => {
    const saved = localStorage.getItem('cloud_files_state');
    return saved ? JSON.parse(saved) : SAMPLE_CLOUD_FILES;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'md'>('all');
  const [saveFileName, setSaveFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    localStorage.setItem('cloud_accounts_state', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('cloud_files_state', JSON.stringify(cloudFiles));
  }, [cloudFiles]);

  useEffect(() => {
    if (currentFilename) {
      const base = currentFilename.replace(/\.pdf$|\.md$|\.txt$/i, '');
      setSaveFileName(`${base}_Converted.md`);
    } else {
      setSaveFileName('Document_Converted.md');
    }
  }, [currentFilename]);

  if (!isOpen) return null;

  const currentAccount = accounts[activeTab];

  const handleToggleAuth = (provider: CloudProvider) => {
    setAccounts(prev => {
      const isConn = prev[provider].connected;
      const updated = {
        ...prev,
        [provider]: {
          ...prev[provider],
          connected: !isConn
        }
      };
      return updated;
    });

    if (!accounts[provider].connected) {
      onShowToast(`Connected to ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}`, 'Account authenticated successfully.', 'success');
    } else {
      onShowToast(`Disconnected ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'}`, 'Storage service unlinked.', 'info');
    }
  };

  const filteredFiles = cloudFiles
    .filter(file => file.provider === activeTab)
    .filter(file => filterType === 'all' || file.type === filterType)
    .filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.path.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSaveToCloud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveFileName.trim()) return;

    if (!currentAccount.connected) {
      onShowToast('Authentication Required', `Please connect your ${activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'} account first.`, 'error');
      return;
    }

    setIsUploading(true);

    setTimeout(() => {
      const folderPath = activeTab === 'google-drive' ? '/My Drive/PDF Conversions/' : '/Dropbox/Documents/';
      const newCloudFile: CloudFile = {
        id: `cloud-${Date.now()}`,
        name: saveFileName.endsWith('.md') ? saveFileName : `${saveFileName}.md`,
        provider: activeTab,
        type: 'md',
        sizeBytes: new Blob([currentMarkdown]).size,
        updatedAt: Date.now(),
        path: `${folderPath}${saveFileName.endsWith('.md') ? saveFileName : `${saveFileName}.md`}`,
        content: currentMarkdown,
      };

      setCloudFiles(prev => [newCloudFile, ...prev]);
      setIsUploading(false);
      setShowSaveForm(false);
      onShowToast(
        'Saved to Cloud Storage', 
        `"${newCloudFile.name}" was saved directly to ${activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'}.`,
        'success'
      );
    }, 1200);
  };

  const handleOpenFile = (file: CloudFile) => {
    if (file.type === 'md' && file.content) {
      onLoadMarkdownFromCloud(file.content, file.name);
      onClose();
      onShowToast('Loaded from Cloud', `Opened "${file.name}" in editor.`, 'success');
    } else if (file.type === 'pdf') {
      // Simulate loading PDF file from cloud
      onLoadPdfFromCloud(file.pdfDataUrl || '', file.name);
      onClose();
      onShowToast('PDF Loaded from Cloud', `Imported "${file.name}" for conversion.`, 'success');
    }
  };

  const handleDeleteCloudFile = (id: string, fileName: string) => {
    setCloudFiles(prev => prev.filter(f => f.id !== id));
    onShowToast('File Removed', `Deleted "${fileName}" from ${activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'}.`, 'info');
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onShowToast('Cloud Sync Complete', `All ${activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'} files are up-to-date.`, 'success');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Cloud Storage Integration
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Connect Google Drive &amp; Dropbox to import PDFs or save Markdown files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Provider Tabs */}
        <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            
            {/* Google Drive Tab */}
            <button
              onClick={() => setActiveTab('google-drive')}
              className={`px-4 py-2.5 rounded-t-xl font-semibold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'google-drive'
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.6 66.85l21.1-36.55h53l-21.1 36.55z" fill="#0066DA"/>
                <path d="M43.65 2.6L64.75 39.15 43.65 75.7 22.55 39.15z" fill="#00AC47"/>
                <path d="M22.55 39.15L1.45 2.6h42.2l21.1 36.55z" fill="#EA4335"/>
                <path d="M22.55 39.15L43.65 2.6H85.9l-21.15 36.55z" fill="#FFBA00"/>
              </svg>
              <span>Google Drive</span>
              {accounts['google-drive'].connected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

            {/* Dropbox Tab */}
            <button
              onClick={() => setActiveTab('dropbox')}
              className={`px-4 py-2.5 rounded-t-xl font-semibold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'dropbox'
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <svg className="w-4 h-4 text-blue-600 fill-current" viewBox="0 0 24 24">
                <path d="M6 2l6 3.75L18 2l5 4.125L17 9.875 12 6.125 7 9.875 1 6.125 6 2zm12 11.875l5-4.125-6-3.75-5 3.75-5-3.75-6 3.75 5 4.125L12 10.125l6 3.75zm-6 1.125l-5-3.75-6 4.125 11 6.75 11-6.75-6-4.125-5 3.75z"/>
              </svg>
              <span>Dropbox</span>
              {accounts['dropbox'].connected && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>

          </div>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing || !currentAccount.connected}
            className="mb-2 text-xs text-slate-600 hover:text-blue-600 font-semibold flex items-center space-x-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Cloud</span>
          </button>
        </div>

        {/* Account Status Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {currentAccount.avatarUrl ? (
                <img 
                  src={currentAccount.avatarUrl} 
                  alt={currentAccount.accountName} 
                  className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                  {currentAccount.accountName?.charAt(0) || 'U'}
                </div>
              )}
              {currentAccount.connected && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">{currentAccount.accountName}</span>
                {currentAccount.connected ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{currentAccount.accountEmail}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Storage Progress Meter */}
            {currentAccount.connected && (
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-slate-500 font-semibold mb-1">
                  {(currentAccount.usedStorageMb! / 1024).toFixed(1)} GB / {(currentAccount.totalStorageMb! / 1024).toFixed(0)} GB Used
                </div>
                <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full" 
                    style={{ width: `${(currentAccount.usedStorageMb! / currentAccount.totalStorageMb!) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => handleToggleAuth(activeTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shadow-xs ${
                currentAccount.connected
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {currentAccount.connected ? 'Disconnect' : 'Connect Account'}
            </button>
          </div>
        </div>

        {/* Action Toolbar & Save Form Toggle */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          
          {/* Search & Filter Bar */}
          <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'} files...`}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="pdf">PDF Documents</option>
              <option value="md">Markdown (.md)</option>
            </select>
          </div>

          {/* Quick Action: Save current Markdown to Cloud */}
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            disabled={!currentAccount.connected}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold text-xs rounded-md shadow-xs flex items-center space-x-1.5 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Save Current Doc to Cloud</span>
          </button>
        </div>

        {/* Expandable Form: Save File to Cloud */}
        {showSaveForm && currentAccount.connected && (
          <form onSubmit={handleSaveToCloud} className="p-4 bg-blue-50/50 border-b border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-600" />
                Save Document directly to {activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {activeTab === 'google-drive' ? '/My Drive/PDF Conversions/' : '/Dropbox/Documents/'}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                placeholder="Filename.md"
                className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-xs"
                required
              />
              <button
                type="submit"
                disabled={isUploading || !saveFileName.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow-xs flex items-center space-x-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Confirm Save</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Cloud File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/60 min-h-[220px]">
          {!currentAccount.connected ? (
            <div className="text-center py-12 text-slate-500">
              <Lock className="w-10 h-10 mx-auto mb-3 text-slate-400" />
              <p className="text-sm font-bold text-slate-700">Account Disconnected</p>
              <p className="text-xs text-slate-500 mt-1">
                Please connect your {activeTab === 'google-drive' ? 'Google Drive' : 'Dropbox'} account above to browse and save files.
              </p>
              <button
                onClick={() => handleToggleAuth(activeTab)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs inline-flex items-center space-x-1.5"
              >
                <span>Authenticate Account</span>
              </button>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Folder className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No cloud files match your search</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting search filters or upload a new document.</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl p-3 flex items-center justify-between transition-all group shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                    file.type === 'pdf' 
                      ? 'bg-red-50 text-red-600 border border-red-200' 
                      : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {file.type === 'pdf' ? 'PDF' : 'MD'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                      {file.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                      {file.path}
                    </p>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  <span className="text-[10px] text-slate-400 font-mono font-medium hidden sm:inline">
                    {(file.sizeBytes / 1024).toFixed(1)} KB
                  </span>

                  <button
                    onClick={() => handleOpenFile(file)}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-xs font-bold flex items-center space-x-1 transition-colors"
                    title={file.type === 'pdf' ? 'Import PDF to Converter' : 'Open in Markdown Editor'}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{file.type === 'pdf' ? 'Convert PDF' : 'Open MD'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCloudFile(file.id, file.name)}
                    className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Delete Cloud File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Direct API sync enabled
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md font-semibold transition-all shadow-2xs"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
