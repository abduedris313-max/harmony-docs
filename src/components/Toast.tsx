import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-3.5 rounded-xl border shadow-xl flex items-start justify-between space-x-3 transition-all animate-in slide-in-from-bottom-3 ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-800 text-rose-200'
              : toast.type === 'info'
              ? 'bg-indigo-950/95 border-indigo-800 text-indigo-200'
              : 'bg-slate-900/95 border-emerald-800/80 text-emerald-200'
          }`}
        >
          <div className="flex items-start space-x-2.5">
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              {toast.message && <p className="text-[11px] text-slate-300 mt-0.5">{toast.message}</p>}
            </div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
