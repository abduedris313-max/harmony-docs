import { PDFParse } from 'pdf-parse';

export interface PdfEngineOptions {
  preserveLayout?: boolean;
  extractTables?: boolean;
  cleanHeadersFooters?: boolean;
  pageRange?: string;
  mathLatex?: boolean;
}

interface PageData {
  pageIndex: number;
  lines: string[];
}

export async function parsePdfToMarkdown(pdfBuffer: Buffer, options: PdfEngineOptions = {}): Promise<string> {
  const {
    preserveLayout = true,
    extractTables = true,
    cleanHeadersFooters = true,
    pageRange = 'All',
  } = options;

  const parser = new PDFParse({ data: new Uint8Array(pdfBuffer) });
  const textResult = await parser.getText();
  
  const pages: PageData[] = [];

  if (textResult && textResult.pages && textResult.pages.length > 0) {
    textResult.pages.forEach((p, idx) => {
      const rawLines = (p.text || '').split(/\r?\n/).map(l => l.trimEnd());
      pages.push({
        pageIndex: p.num || idx + 1,
        lines: rawLines,
      });
    });
  } else if (textResult && textResult.text) {
    const rawLines = textResult.text.split(/\r?\n/).map(l => l.trimEnd());
    pages.push({ pageIndex: 1, lines: rawLines });
  }

  await parser.destroy();

  // Filter page range if specified (e.g. "1-3" or "2")
  let targetPages = pages;
  if (pageRange && pageRange.toLowerCase() !== 'all') {
    const rangeMatch = pageRange.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : start;
      targetPages = pages.filter(p => p.pageIndex >= start && p.pageIndex <= end);
    }
  }

  // Optional: Detect and strip repeated running headers and footers across pages
  if (cleanHeadersFooters && targetPages.length > 1) {
    cleanRepeatedHeadersFooters(targetPages);
  }

  // Convert each page's lines into Markdown structure
  const markdownPages: string[] = [];

  for (let i = 0; i < targetPages.length; i++) {
    const page = targetPages[i];
    const pageMd = convertLinesToMarkdown(page.lines, { preserveLayout, extractTables });
    
    if (targetPages.length > 1) {
      markdownPages.push(`<!-- Page ${page.pageIndex} -->\n${pageMd}`);
    } else {
      markdownPages.push(pageMd);
    }
  }

  return markdownPages.join('\n\n---\n\n');
}

/**
 * Strips repeated top and bottom lines across multiple pages (e.g., page numbers, running headers)
 */
function cleanRepeatedHeadersFooters(pages: PageData[]) {
  if (pages.length < 2) return;

  const topLinesMap = new Map<string, number>();
  const bottomLinesMap = new Map<string, number>();

  for (const page of pages) {
    if (page.lines.length > 0) {
      const top = page.lines[0].trim();
      if (top) topLinesMap.set(top, (topLinesMap.get(top) || 0) + 1);
    }
    if (page.lines.length > 1) {
      const bottom = page.lines[page.lines.length - 1].trim();
      if (bottom) bottomLinesMap.set(bottom, (bottomLinesMap.get(bottom) || 0) + 1);
    }
  }

  const threshold = Math.ceil(pages.length * 0.5); // repeated on >50% pages

  for (const page of pages) {
    if (page.lines.length > 0) {
      const top = page.lines[0].trim();
      if (topLinesMap.get(top)! >= threshold || /^page\s+\d+(\s+of\s+\d+)?$/i.test(top)) {
        page.lines.shift();
      }
    }
    if (page.lines.length > 0) {
      const bottom = page.lines[page.lines.length - 1].trim();
      if (bottomLinesMap.get(bottom)! >= threshold || /^page\s+\d+(\s+of\s+\d+)?$/i.test(bottom) || /^\d+$/i.test(bottom)) {
        page.lines.pop();
      }
    }
  }
}

/**
 * Parses lines of text into structured Markdown elements (Headings, Lists, Tables, Code, Paragraphs)
 */
function convertLinesToMarkdown(lines: string[], opts: { preserveLayout: boolean; extractTables: boolean }): string {
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      result.push('');
      i++;
      continue;
    }

    // Check for Table (lines containing 2 or more multi-space gaps, tabs, or pipe characters)
    if (opts.extractTables && isTableCandidate(lines, i)) {
      const { tableMd, nextIndex } = parseTableBlock(lines, i);
      result.push(tableMd);
      i = nextIndex;
      continue;
    }

    // Check for Bullet or Numbered Lists
    const listMatch = trimmed.match(/^(?:[•⁃–*\-o]\s+|\d+[\.\)]\s+|[a-zA-Z][\.\)]\s+)(.+)$/);
    if (listMatch) {
      if (/^\d+[\.\)]/.test(trimmed)) {
        result.push(trimmed.replace(/^(\d+)[\.\)]\s+/, '$1. '));
      } else {
        result.push('- ' + listMatch[1]);
      }
      i++;
      continue;
    }

    // Check for Heading patterns
    // 1. ALL CAPS line (under 60 chars)
    // 2. Numbered section like "1. Introduction" or "1.1 Subsection"
    // 3. Short title-like line without ending punctuation
    if (isHeadingCandidate(trimmed, i, lines.length)) {
      const headingLevel = getHeadingLevel(trimmed);
      const cleanHeading = trimmed.replace(/^[#\s]+/, '').replace(/^(\d+(\.\d+)*)\s+/, '$1 ');
      result.push(`${headingLevel} ${cleanHeading}`);
      i++;
      continue;
    }

    // Check for Blockquote or Note
    if (/^(note|warning|important|caution|quote):/i.test(trimmed)) {
      result.push(`> **${trimmed.split(':')[0]}**: ${trimmed.substring(trimmed.indexOf(':') + 1).trim()}`);
      i++;
      continue;
    }

    // Regular paragraph / text block
    result.push(trimmed);
    i++;
  }

  // Join paragraphs cleanly
  return result.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Determines if a line is likely a document heading
 */
function isHeadingCandidate(trimmed: string, index: number, totalLines: number): boolean {
  if (trimmed.length > 80) return false;
  if (/[.!?]$/.test(trimmed) && !/^\d+(\.\d+)*\s+/.test(trimmed)) return false;

  // ALL CAPS headings e.g. "ABSTRACT", "1. INTRODUCTION"
  if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return true;
  }

  // Numbered section heading e.g. "1. Introduction" or "2.3.1 Experimental Results"
  if (/^\d+(\.\d+)*\s+[A-Z]/.test(trimmed)) {
    return true;
  }

  // Section title keyword start e.g. "Chapter 1", "Section 2"
  if (/^(chapter|section|part|appendix|abstract|conclusion|references|summary|table of contents)\b/i.test(trimmed)) {
    return true;
  }

  return false;
}

function getHeadingLevel(trimmed: string): string {
  if (/^(chapter|part)\b/i.test(trimmed) || (trimmed === trimmed.toUpperCase() && trimmed.length < 30)) {
    return '#';
  }
  if (/^\d+\.\d+\.\d+/.test(trimmed)) {
    return '###';
  }
  if (/^\d+\.\d+/.test(trimmed)) {
    return '##';
  }
  return '#';
}

/**
 * Identifies whether current and subsequent lines represent tabular column data
 */
function isTableCandidate(lines: string[], startIndex: number): boolean {
  const line = lines[startIndex];
  // Look for multiple columns separated by 2+ spaces or tabs or pipes
  const columns = line.split(/\s{2,}|\t|\|/).map(c => c.trim()).filter(Boolean);
  if (columns.length < 2) return false;

  // Check next line to see if it also has multiple columns
  if (startIndex + 1 < lines.length) {
    const nextLine = lines[startIndex + 1];
    const nextCols = nextLine.split(/\s{2,}|\t|\|/).map(c => c.trim()).filter(Boolean);
    if (nextCols.length >= 2) return true;
  }

  return false;
}

/**
 * Converts a series of tab/space-aligned lines into a Markdown table
 */
function parseTableBlock(lines: string[], startIndex: number): { tableMd: string; nextIndex: number } {
  const tableRows: string[][] = [];
  let curr = startIndex;

  while (curr < lines.length) {
    const line = lines[curr];
    const cols = line.split(/\s{2,}|\t|\|/).map(c => c.trim()).filter(Boolean);

    if (cols.length < 2) {
      break;
    }

    tableRows.push(cols);
    curr++;
  }

  if (tableRows.length === 0) {
    return { tableMd: lines[startIndex], nextIndex: startIndex + 1 };
  }

  // Find max columns
  const maxCols = Math.max(...tableRows.map(r => r.length));

  // Build GFM Table
  const mdLines: string[] = [];
  
  // Header Row
  const header = tableRows[0];
  while (header.length < maxCols) header.push('');
  mdLines.push('| ' + header.join(' | ') + ' |');

  // Separator Row
  mdLines.push('| ' + new Array(maxCols).fill('---').join(' | ') + ' |');

  // Data Rows
  for (let r = 1; r < tableRows.length; r++) {
    const row = tableRows[r];
    while (row.length < maxCols) row.push('');
    mdLines.push('| ' + row.join(' | ') + ' |');
  }

  return {
    tableMd: mdLines.join('\n'),
    nextIndex: curr,
  };
}
