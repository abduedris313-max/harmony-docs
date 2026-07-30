import React, { useState } from 'react';
import {
  X,
  Table as TableIcon,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Check,
  Grid,
} from 'lucide-react';

interface TableBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTable: (markdownTable: string) => void;
}

type Alignment = 'left' | 'center' | 'right';

export const TableBuilderModal: React.FC<TableBuilderModalProps> = ({
  isOpen,
  onClose,
  onInsertTable,
}) => {
  // Default 3 columns x 3 rows
  const [headers, setHeaders] = useState<string[]>(['Feature', 'Status', 'Notes']);
  const [alignments, setAlignments] = useState<Alignment[]>(['left', 'center', 'left']);
  const [rows, setRows] = useState<string[][]>([
    ['Document Parsing', 'Completed', 'High accuracy'],
    ['Table Extraction', 'In Progress', 'GFM support'],
    ['Export to PDF/MD', 'Supported', 'Client & server'],
  ]);

  if (!isOpen) return null;

  // Add Column
  const handleAddColumn = () => {
    setHeaders([...headers, `Column ${headers.length + 1}`]);
    setAlignments([...alignments, 'left']);
    setRows(rows.map((row) => [...row, '']));
  };

  // Remove Column
  const handleRemoveColumn = (colIndex: number) => {
    if (headers.length <= 1) return;
    setHeaders(headers.filter((_, i) => i !== colIndex));
    setAlignments(alignments.filter((_, i) => i !== colIndex));
    setRows(rows.map((row) => row.filter((_, i) => i !== colIndex)));
  };

  // Add Row
  const handleAddRow = () => {
    setRows([...rows, new Array(headers.length).fill('')]);
  };

  // Remove Row
  const handleRemoveRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== rowIndex));
  };

  // Handle Header Cell Change
  const handleHeaderChange = (index: number, val: string) => {
    const updated = [...headers];
    updated[index] = val;
    setHeaders(updated);
  };

  // Handle Alignment Toggle
  const handleAlignmentChange = (index: number, align: Alignment) => {
    const updated = [...alignments];
    updated[index] = align;
    setAlignments(updated);
  };

  // Handle Cell Value Change
  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const updated = rows.map((r, rIdx) => {
      if (rIdx === rowIndex) {
        const rowCopy = [...r];
        rowCopy[colIndex] = val;
        return rowCopy;
      }
      return r;
    });
    setRows(updated);
  };

  // Presets
  const applyPreset = (presetType: 'comparison' | 'pricing' | 'tasks') => {
    if (presetType === 'comparison') {
      setHeaders(['Feature', 'Free Plan', 'Pro Plan']);
      setAlignments(['left', 'center', 'center']);
      setRows([
        ['PDF Conversion', '5 docs/day', 'Unlimited'],
        ['OCR Support', 'Basic', 'Advanced'],
        ['Export Formats', 'MD', 'MD, HTML, PDF'],
      ]);
    } else if (presetType === 'pricing') {
      setHeaders(['Tier', 'Price', 'Storage', 'Users']);
      setAlignments(['left', 'center', 'center', 'center']);
      setRows([
        ['Starter', '$0 / mo', '1 GB', '1 User'],
        ['Professional', '$19 / mo', '50 GB', '5 Users'],
        ['Enterprise', 'Custom', 'Unlimited', 'Unlimited'],
      ]);
    } else if (presetType === 'tasks') {
      setHeaders(['Task Description', 'Assignee', 'Priority', 'Status']);
      setAlignments(['left', 'left', 'center', 'center']);
      setRows([
        ['Review PDF engine', 'Sarah', 'High', 'Done'],
        ['Implement Find & Replace', 'Alex', 'Medium', 'Done'],
        ['Add Table GUI Builder', 'Dev Team', 'High', 'In Progress'],
      ]);
    }
  };

  // Generate GFM Markdown Table text
  const generateMarkdownTable = (): string => {
    const formatCell = (val: string) => (val.trim() === '' ? ' ' : val.trim().replace(/\|/g, '\\|'));

    // Header row
    const headerRow = '| ' + headers.map((h) => formatCell(h)).join(' | ') + ' |';

    // Divider row with alignment markers
    const dividerRow =
      '| ' +
      alignments
        .map((a) => {
          if (a === 'center') return ':---:';
          if (a === 'right') return '---:';
          return ':---';
        })
        .join(' | ') +
      ' |';

    // Data rows
    const dataRows = rows.map(
      (row) => '| ' + row.map((cell) => formatCell(cell)).join(' | ') + ' |'
    );

    return `\n${headerRow}\n${dividerRow}\n${dataRows.join('\n')}\n`;
  };

  const handleInsert = () => {
    const md = generateMarkdownTable();
    onInsertTable(md);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white/95 backdrop-blur-2xl border border-black/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* iOS Top Sheet Drag Pill */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shadow-xs">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                Table Builder
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Visually construct and format GitHub Flavored Markdown (GFM) tables
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets & Toolbar */}
        <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5 text-blue-600" /> Quick Presets:
            </span>
            <button
              onClick={() => applyPreset('comparison')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-medium transition-colors"
            >
              Feature Comparison
            </button>
            <button
              onClick={() => applyPreset('pricing')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-medium transition-colors"
            >
              Pricing Matrix
            </button>
            <button
              onClick={() => applyPreset('tasks')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-medium transition-colors"
            >
              Task Backlog
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddColumn}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Column</span>
            </button>
            <button
              onClick={handleAddRow}
              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>
        </div>

        {/* Grid Editor Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-5 bg-slate-50/50 space-y-4">
          
          {/* Interactive Table Grid */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                {/* Alignment Header Controls */}
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="p-2 w-10 text-center text-slate-400 font-mono text-[10px]">Align</th>
                  {headers.map((_, colIdx) => (
                    <th key={`align-${colIdx}`} className="p-2 border-l border-slate-200 text-center">
                      <div className="inline-flex rounded-md shadow-2xs bg-white border border-slate-200 p-0.5 space-x-0.5">
                        <button
                          onClick={() => handleAlignmentChange(colIdx, 'left')}
                          className={`p-1 rounded ${
                            alignments[colIdx] === 'left' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Align Left"
                        >
                          <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAlignmentChange(colIdx, 'center')}
                          className={`p-1 rounded ${
                            alignments[colIdx] === 'center' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Align Center"
                        >
                          <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleAlignmentChange(colIdx, 'right')}
                          className={`p-1 rounded ${
                            alignments[colIdx] === 'right' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Align Right"
                        >
                          <AlignRight className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="p-2 w-12 text-center text-slate-400 font-mono text-[10px]">Action</th>
                </tr>

                {/* Header Inputs Row */}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2 text-center text-slate-500 font-bold text-[11px]">Header</th>
                  {headers.map((header, colIdx) => (
                    <th key={`head-${colIdx}`} className="p-2 border-l border-slate-200">
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleHeaderChange(colIdx, e.target.value)}
                        placeholder={`Column ${colIdx + 1}`}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-800 font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </th>
                  ))}
                  <th className="p-2 text-center"></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={`row-${rowIdx}`} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                    <td className="p-2 text-center text-slate-400 font-mono text-[11px] font-semibold">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td key={`cell-${rowIdx}-${colIdx}`} className="p-2 border-l border-slate-200">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                          placeholder="Cell value..."
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 focus:outline-none focus:border-blue-500 font-sans"
                        />
                      </td>
                    ))}
                    <td className="p-2 border-l border-slate-200 text-center">
                      <button
                        onClick={() => handleRemoveRow(rowIdx)}
                        disabled={rows.length <= 1}
                        className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded transition-colors"
                        title="Delete Row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete Column Bar */}
          <div className="flex items-center space-x-2 overflow-x-auto py-1">
            <span className="text-[11px] font-semibold text-slate-500">Remove Column:</span>
            {headers.map((_, colIdx) => (
              <button
                key={`del-col-${colIdx}`}
                onClick={() => handleRemoveColumn(colIdx)}
                disabled={headers.length <= 1}
                className="px-2 py-0.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded text-[10px] font-medium disabled:opacity-30 transition-colors flex items-center gap-1"
              >
                <span>Col {colIdx + 1}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>

          {/* Live GFM Markdown Code Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-slate-100">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Live Markdown Syntax Output
              </span>
              <span>GFM Table Standard</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-blue-200 overflow-x-auto whitespace-pre">
              {generateMarkdownTable().trim()}
            </pre>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {headers.length} Columns × {rows.length} Rows table ready to embed
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Insert Table into Editor</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
