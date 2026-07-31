import React, { useState, useRef } from 'react';
import {
  FolderSearch,
  FolderPlus,
  FileText,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  Loader2,
  Folder,
  Filter,
  CheckSquare,
  Square,
  HardDrive
} from 'lucide-react';
import { DirectoryScanItem, DocumentFolder } from '../types';
import { parseFileListToScanItems, scanDirectoryWithNativePicker } from '../utils/directoryScanner';

interface DirectoryScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: DocumentFolder[];
  onImportItems: (items: DirectoryScanItem[], targetFolderId?: string) => Promise<void>;
}

export const DirectoryScannerModal: React.FC<DirectoryScannerModalProps> = ({
  isOpen,
  onClose,
  folders,
  onImportItems,
}) => {
  const [items, setItems] = useState<DirectoryScanItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'md' | 'txt' | 'epub'>('all');
  const [scanSourceInfo, setScanSourceInfo] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle native Chrome Directory Picker
  const handleNativeScan = async () => {
    setIsScanning(true);
    setScanSourceInfo('Scanning local folder...');
    try {
      const scanned = await scanDirectoryWithNativePicker();
      setItems(scanned);
      if (scanned.length > 0) {
        setScanSourceInfo(`Found ${scanned.length} document(s)`);
      } else {
        setScanSourceInfo('No matching documents (.pdf, .md, .txt, .epub) found in folder.');
      }
    } catch (err: any) {
      console.warn('Native directory picker failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle fallback file input with directory selection
  const handleFileInputScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const parsed = parseFileListToScanItems(e.target.files);
      setItems(parsed);
      setScanSourceInfo(`Scanned ${parsed.length} document(s) from selected folder.`);
      setIsScanning(false);
    }
  };

  const toggleSelectAll = () => {
    const allSelected = items.every((i) => i.selected);
    setItems((prev) => prev.map((item) => ({ ...item, selected: !allSelected })));
  };

  const toggleItemSelection = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const filteredItems = items.filter((item) => {
    if (formatFilter === 'all') return true;
    return item.fileFormat === formatFilter;
  });

  const selectedCount = items.filter((i) => i.selected).length;

  const handleStartImport = async () => {
    const toImport = items.filter((i) => i.selected);
    if (toImport.length === 0) return;

    setIsImporting(true);
    setImportProgress(`Importing ${toImport.length} documents...`);

    try {
      await onImportItems(toImport, selectedFolderId || undefined);
      onClose();
    } catch (err) {
      console.error('Import failed:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#007AFF] flex items-center justify-center shadow-md">
              <FolderSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Scan Local Directory</h2>
              <p className="text-xs text-slate-400">Scan folders on your computer for PDFs, Markdown notes, & ebooks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scan Controls / Buttons */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {'showDirectoryPicker' in window ? (
              <button
                onClick={handleNativeScan}
                disabled={isScanning || isImporting}
                className="px-4 py-2.5 rounded-2xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                <span>Choose Directory to Scan</span>
              </button>
            ) : null}

            <label className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-95">
              <FolderPlus className="w-4 h-4 text-slate-600" />
              <span>Select Folder (File Explorer)</span>
              <input
                ref={fileInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                // @ts-ignore
                directory="true"
                multiple
                className="hidden"
                onChange={handleFileInputScan}
              />
            </label>
          </div>

          {scanSourceInfo && (
            <span className="text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs self-center sm:self-auto">
              {scanSourceInfo}
            </span>
          )}
        </div>

        {/* Filter and Selection Toolbar */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-900 font-semibold"
              >
                {items.every((i) => i.selected) ? (
                  <CheckSquare className="w-4 h-4 text-[#007AFF]" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
                <span>Select All ({selectedCount}/{items.length})</span>
              </button>
            </div>

            {/* Format Filter */}
            <div className="flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
              {(['all', 'pdf', 'md', 'txt', 'epub'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormatFilter(fmt)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${
                    formatFilter === fmt
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scanned Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2 min-h-[220px]">
          {isScanning ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#007AFF]" />
              <p className="text-sm font-medium">Scanning directory structure...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-[#007AFF] mx-auto flex items-center justify-center">
                <FolderSearch className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">No Scanned Files Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click <strong>Choose Directory to Scan</strong> or select a folder on your computer to scan all local PDFs, Markdown notes, and eBooks automatically.
                </p>
              </div>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItemSelection(item.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.selected
                    ? 'bg-blue-50/70 border-blue-200 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="shrink-0">
                    {item.selected ? (
                      <CheckSquare className="w-5 h-5 text-[#007AFF]" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </div>

                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    {item.fileFormat === 'pdf' ? (
                      <FileText className="w-5 h-5 text-red-500" />
                    ) : item.fileFormat === 'md' ? (
                      <FileCode className="w-5 h-5 text-[#007AFF]" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.name}</h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                        {item.fileFormat}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.relativePath}</p>
                  </div>
                </div>

                <div className="text-right ml-4 shrink-0">
                  <span className="text-xs font-medium text-slate-500">{formatBytes(item.sizeBytes)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Import Action */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">Import to Folder:</span>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="">(Root Document Library)</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleStartImport}
              disabled={selectedCount === 0 || isImporting}
              className="px-5 py-2.5 rounded-xl bg-[#007AFF] hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{importProgress}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Import {selectedCount} Selected Document(s)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
