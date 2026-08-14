import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Cloud,
  Folder,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Lock,
  UserCheck,
  FolderPlus,
  LogIn,
  ExternalLink,
  ShieldCheck,
  FileCode,
  FileText,
  FileEdit,
  PlusCircle,
} from 'lucide-react';
import { CloudProvider, CloudFile } from '../types';
import {
  getStoredGoogleDriveToken,
  saveGoogleDriveToken,
  clearGoogleDriveToken,
  revokeGoogleDriveToken,
  getDriveAboutInfo,
  listDriveFiles,
  uploadFileToGoogleDrive,
  downloadFileContentFromDrive,
  deleteFileFromDrive,
} from '../utils/googleDriveService';
import {
  listGoogleDocs,
  createGoogleDocFromMarkdown,
  getGoogleDocAsMarkdown,
  updateGoogleDocContent,
} from '../utils/googleDocsService';
import { loginWithGoogle, logoutUser, subscribeToAuth } from '../firebase/firebaseService';
import { User } from 'firebase/auth';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMarkdown: string;
  currentFilename: string;
  onLoadPdfFromCloud: (pdfDataUrl: string, filename: string) => void;
  onLoadMarkdownFromCloud: (markdownContent: string, filename: string, cloudFileId?: string) => void;
  onSavedFileToCloud?: (fileId: string, filename: string) => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  currentMarkdown,
  currentFilename,
  onLoadPdfFromCloud,
  onLoadMarkdownFromCloud,
  onSavedFileToCloud,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<CloudProvider>('google-drive');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(getStoredGoogleDriveToken());
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isDriveLoading, setIsDriveLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<CloudFile[]>([]);
  const [googleDocs, setGoogleDocs] = useState<CloudFile[]>([]);
  const [dropboxFiles, setDropboxFiles] = useState<CloudFile[]>(() => {
    const saved = localStorage.getItem('dropbox_local_files_cache');
    return saved ? JSON.parse(saved) : [];
  });

  const [accountInfo, setAccountInfo] = useState<{
    displayName: string;
    email: string;
    photoUrl?: string;
    usedStorageMb: number;
    totalStorageMb: number;
  }>({
    displayName: 'Google Account',
    email: '',
    photoUrl: '',
    usedStorageMb: 0,
    totalStorageMb: 15360,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gdoc' | 'pdf' | 'md'>('all');
  const [saveFileName, setSaveFileName] = useState('');
  const [docExportTitle, setDocExportTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [showDocExportForm, setShowDocExportForm] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setAccountInfo((prev) => ({
          ...prev,
          displayName: user.displayName || 'Google Account',
          email: user.email || '',
          photoUrl: user.photoURL || '',
        }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Update save filename default based on active file
  useEffect(() => {
    if (currentFilename) {
      const base = currentFilename.replace(/\.pdf$|\.md$|\.txt$|\.gdoc$/i, '');
      setSaveFileName(`${base}_Converted.md`);
      setDocExportTitle(`${base} (Google Doc)`);
    } else {
      setSaveFileName('Document_Converted.md');
      setDocExportTitle('Converted Document');
    }
  }, [currentFilename]);

  // Fetch Drive info & Google Docs files
  const fetchDriveData = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || getStoredGoogleDriveToken();
    if (!token) return;

    setIsDriveLoading(true);
    setOperationError(null);

    try {
      // 1. Fetch quota and user info from Google Drive
      try {
        const about = await getDriveAboutInfo(token);
        if (about.storageQuota) {
          const usedBytes = parseInt(about.storageQuota.usage || '0', 10);
          const limitBytes = parseInt(about.storageQuota.limit || '16106127360', 10);
          setAccountInfo((prev) => ({
            ...prev,
            displayName: about.user?.displayName || prev.displayName,
            email: about.user?.emailAddress || prev.email,
            photoUrl: about.user?.photoLink || prev.photoUrl,
            usedStorageMb: Math.round(usedBytes / (1024 * 1024)),
            totalStorageMb: Math.round(limitBytes / (1024 * 1024)),
          }));
        }
      } catch (err) {
        console.warn('Could not fetch Drive about quota:', err);
      }

      // 2. Fetch list of files from Google Drive
      const files = await listDriveFiles({ fileType: 'all' }, token);
      setDriveFiles(files);

      // 3. Fetch list of Google Docs documents
      try {
        const docs = await listGoogleDocs('', 30, token);
        setGoogleDocs(docs);
      } catch (docErr) {
        console.warn('Could not fetch Google Docs list:', docErr);
      }
    } catch (err: any) {
      console.error('Fetch Drive data error:', err);
      if (err.message && err.message.includes('401')) {
        setGdriveToken(null);
        clearGoogleDriveToken();
        setOperationError('Google Drive session expired. Please re-authenticate.');
      } else {
        setOperationError(err.message || 'Failed to fetch files from Google Drive & Docs.');
      }
    } finally {
      setIsDriveLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === 'google-drive') {
      const token = getStoredGoogleDriveToken();
      setGdriveToken(token);
      if (token) {
        fetchDriveData(token);
      }
    }
  }, [isOpen, activeTab, fetchDriveData]);

  if (!isOpen) return null;

  // Handle Google OAuth Sign-In and Scope Grant
  const handleConnectGoogleDrive = async () => {
    setIsAuthLoading(true);
    setOperationError(null);
    try {
      const { user, accessToken } = await loginWithGoogle();
      setCurrentUser(user);
      if (accessToken) {
        setGdriveToken(accessToken);
        saveGoogleDriveToken(accessToken);
        onShowToast(
          'Google Workspace Connected',
          `Authenticated as ${user.displayName || user.email}. Google Drive and Docs enabled!`,
          'success'
        );
        await fetchDriveData(accessToken);
      } else {
        const stored = getStoredGoogleDriveToken();
        if (stored) {
          setGdriveToken(stored);
          await fetchDriveData(stored);
        }
      }
    } catch (err: any) {
      console.error('Google Drive Auth Error:', err);
      setOperationError(err.message || 'Google authentication was cancelled or failed.');
      onShowToast('Authentication Failed', err.message || 'Could not connect Google Workspace.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Disconnect & Revoke
  const handleDisconnectGoogleDrive = async () => {
    setIsAuthLoading(true);
    try {
      await revokeGoogleDriveToken();
      clearGoogleDriveToken();
      setGdriveToken(null);
      setDriveFiles([]);
      setGoogleDocs([]);
      onShowToast('Google Account Unlinked', 'Your Google Drive & Docs connection was removed.', 'info');
    } catch (err: any) {
      console.error('Disconnect error:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Upload/Save current active Markdown to Google Drive
  const handleSaveToDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveFileName.trim()) return;

    const token = getStoredGoogleDriveToken();
    if (!token) {
      onShowToast('Authentication Required', 'Please connect your Google account first.', 'error');
      return;
    }

    setIsUploading(true);
    setOperationError(null);

    try {
      const cleanName = saveFileName.endsWith('.md') ? saveFileName : `${saveFileName}.md`;
      const result = await uploadFileToGoogleDrive(
        {
          name: cleanName,
          content: currentMarkdown,
          mimeType: 'text/markdown',
        },
        token
      );

      onShowToast(
        'Saved to Google Drive',
        `"${result.name}" was successfully uploaded to "/My Drive/PDF Conversions/".`,
        'success'
      );

      if (onSavedFileToCloud && result.id) {
        onSavedFileToCloud(result.id, result.name);
      }

      setShowSaveForm(false);
      await fetchDriveData(token);
    } catch (err: any) {
      console.error('Upload to Drive error:', err);
      setOperationError(err.message || 'Failed to save document to Google Drive.');
      onShowToast('Upload Failed', err.message || 'Failed to save file to Google Drive.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Export current active Markdown to Google Docs
  const handleExportToGoogleDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docExportTitle.trim()) return;

    const token = getStoredGoogleDriveToken();
    if (!token) {
      onShowToast('Authentication Required', 'Please connect your Google account first.', 'error');
      return;
    }

    setIsExportingDoc(true);
    setOperationError(null);

    try {
      const result = await createGoogleDocFromMarkdown(docExportTitle.trim(), currentMarkdown, token);
      onShowToast(
        'Google Doc Created!',
        `"${result.title}" created successfully in Google Docs.`,
        'success'
      );
      if (onSavedFileToCloud && result.documentId) {
        onSavedFileToCloud(result.documentId, `${result.title}.gdoc`);
      }
      setShowDocExportForm(false);
      await fetchDriveData(token);
    } catch (err: any) {
      console.error('Create Google Doc error:', err);
      setOperationError(err.message || 'Failed to create Google Doc.');
      onShowToast('Google Doc Error', err.message || 'Could not export to Google Docs.', 'error');
    } finally {
      setIsExportingDoc(false);
    }
  };

  // Open & Read File directly from Google Drive or Google Docs into the app
  const handleOpenFile = async (file: CloudFile) => {
    const token = getStoredGoogleDriveToken();
    if (!token) {
      onShowToast('Authentication Required', 'Please connect your Google account to read files.', 'error');
      return;
    }

    try {
      if (file.type === 'gdoc') {
        onShowToast('Reading Google Doc', `Importing "${file.name}"...`, 'info');
        const docResult = await getGoogleDocAsMarkdown(file.id, token);
        onLoadMarkdownFromCloud(docResult.markdown, `${docResult.title}.md`, file.id);
        onClose();
        onShowToast('Google Doc Imported', `"${docResult.title}" loaded into Markdown Editor.`, 'success');
      } else if (file.type === 'pdf') {
        onShowToast('Downloading PDF', `Fetching "${file.name}" from Drive...`, 'info');
        const result = await downloadFileContentFromDrive(file.id, true, token);
        if (result.dataUrl) {
          onLoadPdfFromCloud(result.dataUrl, file.name);
          onClose();
          onShowToast('PDF Imported', `"${file.name}" loaded into PDF converter.`, 'success');
        }
      } else {
        onShowToast('Downloading Markdown', `Fetching "${file.name}" from Drive...`, 'info');
        const result = await downloadFileContentFromDrive(file.id, false, token);
        if (typeof result.text === 'string') {
          onLoadMarkdownFromCloud(result.text, file.name, file.id);
          onClose();
          onShowToast('Document Loaded', `Opened "${file.name}" in Markdown Editor.`, 'success');
        }
      }
    } catch (err: any) {
      console.error('Download file error:', err);
      onShowToast('Read Error', err.message || 'Could not open document from Google Workspace.', 'error');
    }
  };

  // Delete file from Google Drive / Docs with explicit confirmation
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${fileName}" from your Google account? This action cannot be undone.`);
    if (!confirmed) return;

    const token = getStoredGoogleDriveToken();
    if (!token) return;

    try {
      await deleteFileFromDrive(fileId, token);
      setDriveFiles((prev) => prev.filter((f) => f.id !== fileId));
      setGoogleDocs((prev) => prev.filter((f) => f.id !== fileId));
      onShowToast('File Deleted', `Removed "${fileName}" from Google Workspace.`, 'info');
    } catch (err: any) {
      console.error('Delete file error:', err);
      onShowToast('Delete Failed', err.message || 'Could not delete file from Google Workspace.', 'error');
    }
  };

  const isConnected = !!gdriveToken;

  // Merge Drive files and Google Docs without duplicate IDs
  const combinedGoogleFiles: CloudFile[] = [
    ...googleDocs,
    ...driveFiles.filter((df) => !googleDocs.some((gd) => gd.id === df.id)),
  ];

  const currentFiles = activeTab === 'google-drive' ? combinedGoogleFiles : dropboxFiles;

  const filteredFiles = currentFiles
    .filter((file) => (filterType === 'all' ? true : file.type === filterType))
    .filter(
      (file) =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.path.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-inner">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight flex items-center gap-2">
                Google Workspace &amp; Cloud Storage
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Google Docs, Google Drive, PDF conversion, and Markdown sync
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Provider Navigation Tabs */}
        <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex space-x-2">
            {/* Google Drive & Docs Tab */}
            <button
              onClick={() => setActiveTab('google-drive')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'google-drive'
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.6 66.85l21.1-36.55h53l-21.1 36.55z" fill="#0066DA" />
                <path d="M43.65 2.6L64.75 39.15 43.65 75.7 22.55 39.15z" fill="#00AC47" />
                <path d="M22.55 39.15L1.45 2.6h42.2l21.1 36.55z" fill="#EA4335" />
                <path d="M22.55 39.15L43.65 2.6H85.9l-21.15 36.55z" fill="#FFBA00" />
              </svg>
              <span>Google Drive &amp; Docs</span>
              {isConnected && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            </button>

            {/* Dropbox Tab */}
            <button
              onClick={() => setActiveTab('dropbox')}
              className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs flex items-center space-x-2 transition-all ${
                activeTab === 'dropbox'
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <svg className="w-4 h-4 text-blue-600 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M6 2l6 3.75L18 2l5 4.125L17 9.875 12 6.125 7 9.875 1 6.125 6 2zm12 11.875l5-4.125-6-3.75-5 3.75-5-3.75-6 3.75 5 4.125L12 10.125l6 3.75zm-6 1.125l-5-3.75-6 4.125 11 6.75 11-6.75-6-4.125-5 3.75z" />
              </svg>
              <span>Dropbox (Local Cache)</span>
            </button>
          </div>

          {activeTab === 'google-drive' && isConnected && (
            <button
              onClick={() => fetchDriveData()}
              disabled={isDriveLoading}
              className="mb-2 text-xs text-slate-700 hover:text-blue-600 font-bold flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 shadow-3xs transition-all disabled:opacity-40"
              title="Refresh Google Workspace files list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDriveLoading ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Sync Cloud</span>
            </button>
          )}
        </div>

        {/* Account Info & Status Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {accountInfo.photoUrl ? (
                <img
                  src={accountInfo.photoUrl}
                  alt={accountInfo.displayName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full border border-slate-300 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shadow-xs">
                  {accountInfo.displayName?.charAt(0) || 'G'}
                </div>
              )}
              {isConnected && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-900">{accountInfo.displayName}</span>
                {isConnected ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Connected
                  </span>
                ) : (
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {accountInfo.email || (isConnected ? 'Personal Drive & Docs Storage' : 'Sign in to access Google Docs & Drive')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Storage Progress Meter */}
            {isConnected && accountInfo.totalStorageMb > 0 && (
              <div className="hidden sm:block text-right">
                <div className="text-[10px] text-slate-500 font-semibold mb-1">
                  {(accountInfo.usedStorageMb / 1024).toFixed(1)} GB / {(accountInfo.totalStorageMb / 1024).toFixed(0)} GB Used
                </div>
                <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.min(100, (accountInfo.usedStorageMb / accountInfo.totalStorageMb) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'google-drive' ? (
              isConnected ? (
                <button
                  onClick={handleDisconnectGoogleDrive}
                  disabled={isAuthLoading}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-3xs bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectGoogleDrive}
                  disabled={isAuthLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs flex items-center space-x-1.5 active:scale-95 transition-all"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span>Connect Google Account</span>
                </button>
              )
            ) : null}
          </div>
        </div>

        {/* Error Alert if any */}
        {operationError && (
          <div className="mx-4 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start space-x-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Google Notice</p>
              <p className="mt-0.5">{operationError}</p>
            </div>
            <button onClick={() => setOperationError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

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
                placeholder="Search Google Docs, PDF or Markdown files..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-bold focus:outline-none"
            >
              <option value="all">All Documents</option>
              <option value="gdoc">Google Docs</option>
              <option value="pdf">PDFs (.pdf)</option>
              <option value="md">Markdown (.md)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setShowDocExportForm(!showDocExportForm);
                setShowSaveForm(false);
              }}
              disabled={!isConnected}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-3xs flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-40"
              title="Create a Google Doc from current Markdown"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
              <span>Export to Google Doc</span>
            </button>

            <button
              onClick={() => {
                setShowSaveForm(!showSaveForm);
                setShowDocExportForm(false);
              }}
              disabled={!isConnected}
              className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0062CC] disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Save to Drive</span>
            </button>
          </div>
        </div>

        {/* Expandable Form: Export to Google Doc */}
        {showDocExportForm && isConnected && (
          <form onSubmit={handleExportToGoogleDoc} className="p-4 bg-indigo-50/70 border-b border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <FileEdit className="w-4 h-4 text-indigo-600" />
                Export current Markdown to a new Google Document
              </span>
              <span className="text-[11px] text-indigo-700 font-medium bg-indigo-100/70 px-2 py-0.5 rounded-md">
                Google Docs API v1
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={docExportTitle}
                onChange={(e) => setDocExportTitle(e.target.value)}
                placeholder="Google Document Title"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs"
                required
              />
              <button
                type="submit"
                disabled={isExportingDoc || !docExportTitle.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 shrink-0"
              >
                {isExportingDoc ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Google Doc</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Expandable Form: Save File to Google Drive */}
        {showSaveForm && isConnected && (
          <form onSubmit={handleSaveToDrive} className="p-4 bg-blue-50/70 border-b border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-blue-600" />
                Save Document directly to your Google Drive
              </span>
              <span className="text-[11px] text-blue-700 font-mono bg-blue-100/70 px-2 py-0.5 rounded-md">
                /My Drive/PDF Conversions/
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={saveFileName}
                onChange={(e) => setSaveFileName(e.target.value)}
                placeholder="Document_Converted.md"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500 shadow-2xs"
                required
              />
              <button
                type="submit"
                disabled={isUploading || !saveFileName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 shrink-0"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload to Drive</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Cloud File List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/60 min-h-[220px]">
          {!isConnected ? (
            <div className="text-center py-12 text-slate-500">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-slate-800">Google Workspace Not Connected</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Sign in with your Google account to access and sync Google Docs and Google Drive documents.
              </p>
              <button
                onClick={handleConnectGoogleDrive}
                disabled={isAuthLoading}
                className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 active:scale-95 transition-all"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>Sign in &amp; Connect Google Workspace</span>
              </button>
            </div>
          ) : isDriveLoading ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Loading your Google Docs and Drive files...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Folder className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No documents found in Google Workspace</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Use "Export to Google Doc" or "Save to Drive" above to create or upload documents.
              </p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-2xl p-3 flex items-center justify-between transition-all group shadow-2xs"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs shadow-3xs ${
                      file.type === 'gdoc'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : file.type === 'pdf'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}
                  >
                    {file.type === 'gdoc' ? (
                      <FileEdit className="w-5 h-5 text-blue-600" />
                    ) : file.type === 'pdf' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileCode className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {file.name}
                      </h4>
                      {file.type === 'gdoc' && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded font-sans shrink-0">
                          Google Doc
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                      <span className="font-mono">{file.path}</span>
                      <span>•</span>
                      <span>{new Date(file.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center space-x-2 shrink-0 ml-3">
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Open in Google Docs in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenFile(file)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-3xs"
                    title={
                      file.type === 'gdoc'
                        ? 'Import Google Doc as Markdown'
                        : file.type === 'pdf'
                        ? 'Import PDF to Converter'
                        : 'Open in Markdown Editor'
                    }
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {file.type === 'gdoc' ? 'Import Doc' : file.type === 'pdf' ? 'Convert PDF' : 'Open MD'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteFile(file.id, file.name)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer with Security Notice */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium text-[11px] text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Google Docs &amp; Drive APIs enabled with user consent.</span>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold transition-all shadow-3xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
