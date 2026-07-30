import React, { useState } from 'react';
import { Download, FileCode, FileText, Globe, Printer, Copy, Check, HardDrive } from 'lucide-react';
import { marked } from 'marked';

interface ExportPanelProps {
  markdown: string;
  filename: string;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({
  markdown,
  filename,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const baseName = filename.replace(/\.[^/.]+$/, "") || "converted-document";

  // 1. Download Markdown (.md)
  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast("Exported to Local Drive", `${baseName}.md saved successfully`);
  };

  // 2. Download Plain Text (.txt)
  const handleDownloadTxt = () => {
    // Strip markdown formatting tags for plain text
    const plainText = markdown
      .replace(/#+\s?/g, '')
      .replace(/\*\*|__/g, '')
      .replace(/\*|_/g, '')
      .replace(/`{3}[\s\S]*?`{3}/g, (match) => match.replace(/`{3}/g, ''))
      .replace(/`([^`]+)`/g, '$1');

    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast("Exported to Local Drive", `${baseName}.txt saved successfully`);
  };

  // 3. Download Formatted Standalone HTML (.html)
  const handleDownloadHtml = async () => {
    const rawHtml = await marked.parse(markdown);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${baseName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: #f8fafc;
    }
    .document-card {
      background: #ffffff;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; }
    h1 { font-size: 2.25rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.3rem; }
    h3 { font-size: 1.25rem; }
    p { margin-bottom: 1rem; }
    code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    pre { background: #0f172a; color: #f8fafc; padding: 1rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 1rem; color: #475569; font-style: italic; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    th, td { border: 1px solid #cbd5e1; padding: 0.75rem; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    a { color: #4f46e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { padding-left: 1.5rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <div class="document-card">
    ${rawHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${baseName}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast("Exported to Local Drive", `${baseName}.html saved successfully`);
  };

  // 4. Export Formatted PDF / Print Document (.pdf)
  const handlePrintPdf = async () => {
    const rawHtml = await marked.parse(markdown);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onShowToast("Popup Blocked", "Please allow popups to open the PDF print dialog", "error");
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
    blockquote { border-left: 3pt solid #4f46e5; margin: 10pt 0; padding-left: 10pt; color: #4b5563; }
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
    onShowToast("Print / Save as PDF Opened", "Use 'Save as PDF' destination in the browser print dialog");
  };

  // 5. Copy Markdown to Clipboard
  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      onShowToast("Copied to Clipboard", "Markdown content copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast("Copy Failed", "Failed to copy text", "error");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <HardDrive className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Export directly to Local Drive
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-mono font-medium">{baseName}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        
        {/* Markdown (.md) */}
        <button
          onClick={handleDownloadMd}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Markdown (.md)</span>
        </button>

        {/* Text (.txt) */}
        <button
          onClick={handleDownloadTxt}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          <span>Text (.txt)</span>
        </button>

        {/* HTML (.html) */}
        <button
          onClick={handleDownloadHtml}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
        >
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          <span>HTML (.html)</span>
        </button>

        {/* PDF (.pdf) */}
        <button
          onClick={handlePrintPdf}
          className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
        >
          <Printer className="w-3.5 h-3.5 text-amber-600" />
          <span>PDF (.pdf)</span>
        </button>

        {/* Copy Clipboard */}
        <button
          onClick={handleCopyClipboard}
          className="col-span-2 sm:col-span-1 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-blue-600" />
              <span>Copy</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
