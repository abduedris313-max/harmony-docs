import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  LogOut,
  LogIn,
  Database,
  ShieldCheck,
  Folder,
  BookOpen,
  History,
  Layers,
  Sparkles,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  syncAllLocalToFirestore,
} from '../firebase/firebaseService';
import { Book, DocumentFolder, HistoryItem, VersionSnapshot } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface FirebaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  folders: DocumentFolder[];
  history: HistoryItem[];
  snapshots: VersionSnapshot[];
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onSyncComplete?: () => void;
}

export const FirebaseSyncModal: React.FC<FirebaseSyncModalProps> = ({
  isOpen,
  onClose,
  books,
  folders,
  history,
  snapshots,
  onShowToast,
  onSyncComplete,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<number | null>(() => {
    const saved = localStorage.getItem('firebase_last_sync_time');
    return saved ? parseInt(saved, 10) : null;
  });

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsAuthLoading(true);
    try {
      const user = await loginWithGoogle();
      onShowToast('Signed In with Google', `Welcome back, ${user.displayName || user.email}!`, 'success');
    } catch (err: any) {
      console.error('Login error:', err);
      onShowToast('Sign-In Failed', err.message || 'Could not complete Google authentication.', 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsAuthLoading(true);
    try {
      await logoutUser();
      onShowToast('Signed Out', 'You have been disconnected from Firebase.', 'info');
    } catch (err: any) {
      console.error('Logout error:', err);
      onShowToast('Sign-Out Error', err.message, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSyncToFirestore = async () => {
    if (!currentUser) {
      onShowToast('Authentication Required', 'Please sign in with Google to sync with Firestore.', 'error');
      return;
    }
    setIsSyncing(true);
    try {
      const { booksCount, foldersCount } = await syncAllLocalToFirestore(
        currentUser.uid,
        books,
        folders,
        history,
        snapshots
      );
      const now = Date.now();
      setLastSyncedTime(now);
      localStorage.setItem('firebase_last_sync_time', now.toString());
      onShowToast(
        'Firestore Cloud Sync Complete',
        `Successfully synced ${booksCount} documents and ${foldersCount} folders to your personal Firebase cloud!`,
        'success'
      );
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      console.error('Firestore Sync Error:', err);
      onShowToast('Sync Failed', err.message || 'Error communicating with Firestore.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Flame className="w-6 h-6 text-white fill-amber-200" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Firebase Cloud Database</h2>
              <p className="text-xs text-amber-100 font-medium">Real-time Cloud Firestore &amp; Auth Sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-700 text-sm">
          {/* Project & Database Status Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Project: {firebaseConfig.projectId}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate max-w-xs">
                  DB: {firebaseConfig.firestoreDatabaseId || '(default)'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Connected</span>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">
              Firebase Authentication
            </h3>

            {isAuthLoading ? (
              <div className="py-4 flex items-center justify-center space-x-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span>Checking Firebase Auth...</span>
              </div>
            ) : currentUser ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {currentUser.displayName || 'Authenticated User'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <p className="text-[10px] text-emerald-600 font-medium">UID: {currentUser.uid.slice(0, 10)}...</p>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">Not Signed In</p>
                  <p className="text-[11px] text-slate-500">
                    Sign in with Google to enable multi-device sync and cloud backup.
                  </p>
                </div>
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-2 shrink-0 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Sync Stats Overview */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Firestore Cloud Synchronizer
              </h3>
              {lastSyncedTime && (
                <span className="text-[10px] text-slate-500 font-medium">
                  Last synced: {new Date(lastSyncedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex justify-center mb-1 text-amber-500">
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">{books.length}</p>
                <p className="text-[10px] text-slate-500">Library Books</p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex justify-center mb-1 text-blue-500">
                  <Folder className="w-4 h-4" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">{folders.length}</p>
                <p className="text-[10px] text-slate-500">Folders</p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex justify-center mb-1 text-purple-500">
                  <Layers className="w-4 h-4" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">{snapshots.length}</p>
                <p className="text-[10px] text-slate-500">Snapshots</p>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-center">
                <div className="flex justify-center mb-1 text-emerald-500">
                  <History className="w-4 h-4" />
                </div>
                <p className="text-sm font-extrabold text-slate-900">{history.length}</p>
                <p className="text-[10px] text-slate-500">History Items</p>
              </div>
            </div>

            {/* Sync Action Button */}
            <button
              onClick={handleSyncToFirestore}
              disabled={isSyncing || !currentUser}
              className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-xs active:scale-98 ${
                !currentUser
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
              }`}
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Syncing documents to Firestore...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync Library &amp; Notes with Firestore Now</span>
                </>
              )}
            </button>
          </div>

          {/* Security & Zero-Trust Notice */}
          <div className="flex items-start space-x-2.5 text-[11px] text-slate-500 bg-amber-50/50 border border-amber-200/40 p-3 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Protected by Zero-Trust Attribute-Based Access Control (ABAC). All documents are encrypted and
              accessible exclusively by your authenticated Google Account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
