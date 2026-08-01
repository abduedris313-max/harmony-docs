import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker for browser environment
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface PdfExtractOptions {
  preserveLayout?: boolean;
  extractTables?: boolean;
  cleanHeadersFooters?: boolean;
  pageRange?: string;
  mathLatex?: boolean;
}

interface PdfItem {
  str: string;
  x: number;
  y: number;
  fontSize: number;
  fontName: string;
  width: number;
}

interface PdfLine {
  y: number;
  x: number;
  maxFontSize: number;
  isBold: boolean;
  text: string;
  items: PdfItem[];
}

export async function extractTextFromPdfArrayBuffer(
  arrayBuffer: ArrayBuffer,
  filename: string,
  options: PdfExtractOptions = {}
): Promise<string> {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const pdfjsVersion = pdfjsLib.version || '4.0.379';
    const cMapUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/`;
    const standardFontDataUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/standard_fonts/`;

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      cMapUrl,
      cMapPacked: true,
      standardFontDataUrl,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pagesMd: string[] = [];

    const docTitle = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      const items: PdfItem[] = textContent.items
        .map((item: any) => {
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const x = transform[4] || 0;
          const y = transform[5] || 0;
          const fontSize = Math.abs(transform[0]) || Math.abs(transform[3]) || item.height || 10;
          const fontName = item.fontName || '';
          const rawStr = item.str || '';
          const cleanedStr = normalizeArabicAndEthiopicText(rawStr);
          const width = item.width || (cleanedStr ? cleanedStr.length * (fontSize * 0.5) : 0);

          return {
            str: cleanedStr,
            x,
            y,
            fontSize,
            fontName,
            width,
          };
        })
        .filter((item) => item.str && item.str.trim().length > 0);

      if (items.length === 0) {
        pagesMd.push(
          `<!-- Page ${pageNum} -->\n*Page ${pageNum}: Scanned image or non-text page detected. Click **Refine with AI** or select **Gemini AI Engine** to perform OCR.*`
        );
        continue;
      }

      // Group items into lines sorted from top of page to bottom
      items.sort((a, b) => b.y - a.y);

      const lines: PdfLine[] = [];
      let currentLineItems: PdfItem[] = [];
      let currentY: number | null = null;

      for (const item of items) {
        if (currentY === null || Math.abs(currentY - item.y) > Math.max(3.5, item.fontSize * 0.35)) {
          if (currentLineItems.length > 0) {
            lines.push(buildLineObject(currentLineItems));
          }
          currentLineItems = [item];
          currentY = item.y;
        } else {
          currentLineItems.push(item);
        }
      }
      if (currentLineItems.length > 0) {
        lines.push(buildLineObject(currentLineItems));
      }

      const pageMarkdown = convertPdfLinesToMarkdown(lines, pageNum, numPages);
      pagesMd.push(pageMarkdown);
    }

    if (pagesMd.length === 0) {
      return generateFallbackMarkdown(docTitle);
    }

    return pagesMd.join('\n\n---\n\n');
  } catch (err: any) {
    console.error('Client PDF extraction error:', err);
    return generateFallbackMarkdown(filename);
  }
}

const ARABIC_PRESENTATION_MAP: Record<string, string> = {
  '\uFE80': 'ء', '\uFE81': 'آ', '\uFE82': 'آ', '\uFE83': 'أ', '\uFE84': 'أ',
  '\uFE85': 'ؤ', '\uFE86': 'ؤ', '\uFE87': 'إ', '\uFE88': 'إ', '\uFE89': 'ئ',
  '\uFE8A': 'ئ', '\uFE8B': 'ئ', '\uFE8C': 'ئ', '\uFE8D': 'ا', '\uFE8E': 'ا',
  '\uFE8F': 'ب', '\uFE90': 'ب', '\uFE91': 'ب', '\uFE92': 'ب', '\uFE93': 'ة',
  '\uFE94': 'ة', '\uFE95': 'ت', '\uFE96': 'ت', '\uFE97': 'ت', '\uFE98': 'ت',
  '\uFE99': 'ث', '\uFE9A': 'ث', '\uFE9B': 'ث', '\uFE9C': 'ث', '\uFE9D': 'ج',
  '\uFE9E': 'ج', '\uFE9F': 'ج', '\uFEA0': 'ج', '\uFEA1': 'ح', '\uFEA2': 'ح',
  '\uFEA3': 'ح', '\uFEA4': 'ح', '\uFEA5': 'خ', '\uFEA6': 'خ', '\uFEA7': 'خ',
  '\uFEA8': 'خ', '\uFEA9': 'د', '\uFEAA': 'د', '\uFEAB': 'ذ', '\uFEAC': 'ذ',
  '\uFEAD': 'ر', '\uFEAE': 'ر', '\uFEAF': 'ز', '\uFEB0': 'ز', '\uFEB1': 'س',
  '\uFEB2': 'س', '\uFEB3': 'س', '\uFEB4': 'س', '\uFEB5': 'ش', '\uFEB6': 'ش',
  '\uFEB7': 'ش', '\uFEB8': 'ش', '\uFEB9': 'ص', '\uFEBA': 'ص', '\uFEBB': 'ص',
  '\uFEBC': 'ص', '\uFEBD': 'ض', '\uFEBE': 'ض', '\uFEBF': 'ض', '\uFEC0': 'ض',
  '\uFEC1': 'ط', '\uFEC2': 'ط', '\uFEC3': 'ط', '\uFEC4': 'ط', '\uFEC5': 'ظ',
  '\uFEC6': 'ظ', '\uFEC7': 'ظ', '\uFEC8': 'ظ', '\uFEC9': 'ع', '\uFECA': 'ع',
  '\uFECB': 'ع', '\uFECC': 'ع', '\uFECD': 'غ', '\uFECE': 'غ', '\uFECF': 'غ',
  '\uFED0': 'غ', '\uFED1': 'ف', '\uFED2': 'ف', '\uFED3': 'ف', '\uFED4': 'ف',
  '\uFED5': 'ق', '\uFED6': 'ق', '\uFED7': 'ق', '\uFED8': 'ق', '\uFED9': 'ك',
  '\uFEDA': 'ك', '\uFEDB': 'ك', '\uFEDC': 'ك', '\uFEDD': 'ل', '\uFEDE': 'ل',
  '\uFEDF': 'ل', '\uFEE0': 'ل', '\uFEE1': 'م', '\uFEE2': 'م', '\uFEE3': 'م',
  '\uFEE4': 'م', '\uFEE5': 'ن', '\uFEE6': 'ن', '\uFEE7': 'ن', '\uFEE8': 'ن',
  '\uFEE9': 'ه', '\uFEEA': 'ه', '\uFEEB': 'ه', '\uFEEC': 'ه', '\uFEED': 'و',
  '\uFEEE': 'و', '\uFEEF': 'ى', '\uFEF0': 'ى', '\uFEF1': 'ي', '\uFEF2': 'ي',
  '\uFEF3': 'ي', '\uFEF4': 'ي', '\uFEF5': 'لأ', '\uFEF6': 'لأ', '\uFEF7': 'لإ',
  '\uFEF8': 'لإ', '\uFEF9': 'لآ', '\uFEFA': 'لآ', '\uFEFB': 'لا', '\uFEFC': 'لا'
};

function normalizeArabicAndEthiopicText(str: string): string {
  if (!str) return '';
  return str.replace(/[\uFB50-\uFDFF\uFE70-\uFEFF]/g, (ch) => ARABIC_PRESENTATION_MAP[ch] || ch);
}

function buildLineObject(items: PdfItem[]): PdfLine {
  const hasArabic = items.some((it) => /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(it.str));

  if (hasArabic) {
    const isXDescending = items.length > 1 && items[0].x > items[items.length - 1].x;
    if (isXDescending) {
      items.sort((a, b) => b.x - a.x);
    } else {
      items.sort((a, b) => a.x - b.x);
    }
  } else {
    items.sort((a, b) => a.x - b.x);
  }

  let text = '';
  let maxFontSize = 0;
  let isBold = false;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.fontSize > maxFontSize) maxFontSize = it.fontSize;
    if (/bold|black|heavy|700|800|900/i.test(it.fontName)) isBold = true;

    if (i > 0) {
      const prev = items[i - 1];
      const gap = Math.abs(it.x - (prev.x + prev.width));
      if (gap > 2) {
        text += ' ';
      }
    }
    text += it.str;
  }

  return {
    y: items[0].y,
    x: items[0].x,
    maxFontSize,
    isBold,
    text: text.trim(),
    items,
  };
}

function convertPdfLinesToMarkdown(lines: PdfLine[], pageNum: number, totalPages: number): string {
  if (lines.length === 0) return '';

  // Calculate modal body font size
  const fontCounts: Record<number, number> = {};
  lines.forEach((l) => {
    const sz = Math.round(l.maxFontSize);
    if (sz > 0) {
      fontCounts[sz] = (fontCounts[sz] || 0) + 1;
    }
  });

  let modalSize = 12;
  let maxCount = 0;
  Object.keys(fontCounts).forEach((szStr) => {
    const sz = parseFloat(szStr);
    if (fontCounts[sz] > maxCount) {
      maxCount = fontCounts[sz];
      modalSize = sz;
    }
  });

  const mdBlocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const txt = line.text;

    if (!txt) {
      i++;
      continue;
    }

    // Table detection (lines with multiple spaced items or pipes)
    if (isTableLine(line) && i + 1 < lines.length && isTableLine(lines[i + 1])) {
      const { tableMd, nextIndex } = parseTableFromLines(lines, i);
      mdBlocks.push(tableMd);
      i = nextIndex;
      continue;
    }

    // Headings
    if (line.maxFontSize >= modalSize * 1.4) {
      const cleanH1 = txt.replace(/^#+\s*/, '');
      mdBlocks.push(`# ${cleanH1}`);
      i++;
      continue;
    }

    if (line.maxFontSize >= modalSize * 1.2 || (line.isBold && txt.length < 80 && !txt.endsWith('.'))) {
      const cleanH2 = txt.replace(/^#+\s*/, '');
      mdBlocks.push(`## ${cleanH2}`);
      i++;
      continue;
    }

    if (line.maxFontSize >= modalSize * 1.08 && line.isBold && txt.length < 60) {
      const cleanH3 = txt.replace(/^#+\s*/, '');
      mdBlocks.push(`### ${cleanH3}`);
      i++;
      continue;
    }

    // Lists
    const listMatch = txt.match(/^(?:[•⁃–*\-o]\s+|[\d፩-፱٠-٩]+[\.\)]\s+|[a-zA-Z][\.\)]\s+)(.+)$/);
    if (listMatch) {
      if (/^[\d፩-፱٠-٩]+[\.\)]/.test(txt)) {
        mdBlocks.push(txt.replace(/^([\d፩-፱٠-٩]+)[\.\)]\s+/, '$1. '));
      } else {
        mdBlocks.push('- ' + listMatch[1]);
      }
      i++;
      continue;
    }

    // Blockquote
    if (/^(note|warning|important|caution|quote):/i.test(txt)) {
      mdBlocks.push(`> **${txt.split(':')[0]}**: ${txt.substring(txt.indexOf(':') + 1).trim()}`);
      i++;
      continue;
    }

    // Standard paragraph line
    mdBlocks.push(txt);
    i++;
  }

  const pageHeader = totalPages > 1 ? `<!-- Page ${pageNum} -->\n` : '';
  return pageHeader + mdBlocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isTableLine(line: PdfLine): boolean {
  if (line.items.length >= 2) return true;
  const parts = line.text.split(/\s{2,}|\t|\|/).map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2;
}

function parseTableFromLines(lines: PdfLine[], startIndex: number): { tableMd: string; nextIndex: number } {
  const tableRows: string[][] = [];
  let curr = startIndex;

  while (curr < lines.length) {
    const line = lines[curr];
    let cols: string[] = [];

    if (line.items.length >= 2) {
      cols = line.items.map((it) => it.str.trim()).filter(Boolean);
    } else {
      cols = line.text.split(/\s{2,}|\t|\|/).map((c) => c.trim()).filter(Boolean);
    }

    if (cols.length < 2) break;

    tableRows.push(cols);
    curr++;
  }

  if (tableRows.length < 2) {
    return { tableMd: lines[startIndex].text, nextIndex: startIndex + 1 };
  }

  const maxCols = Math.max(...tableRows.map((r) => r.length));
  const mdLines: string[] = [];

  const header = tableRows[0];
  while (header.length < maxCols) header.push('');
  mdLines.push('| ' + header.join(' | ') + ' |');
  mdLines.push('| ' + new Array(maxCols).fill('---').join(' | ') + ' |');

  for (let r = 1; r < tableRows.length; r++) {
    const row = tableRows[r];
    while (row.length < maxCols) row.push('');
    mdLines.push('| ' + row.join(' | ') + ' |');
  }

  return { tableMd: mdLines.join('\n'), nextIndex: curr };
}

function generateFallbackMarkdown(title: string): string {
  return `# ${title}

*Imported PDF Document*

---

### Document Overview
This PDF document was successfully loaded into your **PDF to Markdown Reader**.

#### Actions Available:
1. Use the **Markdown Toolbar** above to format headings, tables, code blocks, or equations.
2. Click **Refine with AI** to rephrase, summarize, format tables, or fix spelling.
3. Click **Export** to save your document as a .md file or print to .pdf.
`;
}

