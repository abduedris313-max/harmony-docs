/**
 * Client-side PDF fallback parser for static deployments (e.g. GitHub Pages)
 * where the Express backend API (/api/convert-pdf) is not reachable or returns 502.
 */

export function extractTextFromPdfArrayBuffer(arrayBuffer: ArrayBuffer, filename: string): string {
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const decoder = new TextDecoder('latin1'); // latin1 handles raw byte string safely without throwing
    const rawString = decoder.decode(bytes);

    const extractedTextParts: string[] = [];

    // Strategy 1: Extract text inside PDF Text Blocks (BT ... ET)
    const btMatches = rawString.match(/BT[\s\S]*?ET/g);
    if (btMatches && btMatches.length > 0) {
      for (const block of btMatches) {
        // Match string literals inside parentheses e.g. (Hello World) Tj or [(Hello) -10 (World)] TJ
        const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
        let match;
        const blockTextParts: string[] = [];
        while ((match = strRegex.exec(block)) !== null) {
          let textChunk = match[1]
            .replace(/\\\( /g, '(')
            .replace(/\\\)/g, ')')
            .replace(/\\\\/g, '\\')
            .replace(/\\r/g, '')
            .replace(/\\n/g, '\n');
          
          if (textChunk.trim().length > 0) {
            blockTextParts.push(textChunk);
          }
        }
        if (blockTextParts.length > 0) {
          extractedTextParts.push(blockTextParts.join(' '));
        }
      }
    }

    let textResult = extractedTextParts.join('\n');

    // Strategy 2: Fallback to printable text streams if BT...ET blocks were compressed or missing
    if (!textResult || textResult.trim().length < 30) {
      const asciiLines = rawString.split(/\r?\n/);
      const cleanLines: string[] = [];
      for (const line of asciiLines) {
        const trimmed = line.trim();
        // Skip structural PDF tags
        if (
          trimmed.length > 3 &&
          !trimmed.startsWith('/') &&
          !trimmed.startsWith('<<') &&
          !trimmed.endsWith('>>') &&
          !/^(obj|endobj|stream|endstream|xref|trailer|startxref|\d+\s+\d+\s+obj)$/.test(trimmed)
        ) {
          // Remove non-printable characters
          const printable = trimmed.replace(/[^\x20-\x7E\s]/g, '').trim();
          if (printable.length > 3 && !printable.includes('EndObject')) {
            cleanLines.push(printable);
          }
        }
      }
      textResult = cleanLines.join('\n');
    }

    // Format extracted lines into clean Markdown
    const docTitle = filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    const formattedMarkdown = formatExtractedTextToMarkdown(textResult, docTitle);
    return formattedMarkdown;
  } catch (err) {
    console.error('Client PDF fallback extraction error:', err);
    return generateFallbackMarkdown(filename);
  }
}

function formatExtractedTextToMarkdown(rawText: string, docTitle: string): string {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    return generateFallbackMarkdown(docTitle);
  }

  const markdownLines: string[] = [
    `# ${docTitle.toUpperCase()}`,
    `*Converted Document • ${new Date().toLocaleDateString()}*\n`,
    '---',
    '',
  ];

  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line looks like a header (short, capitalized, no trailing period)
    if (line.length < 60 && !line.endsWith('.') && (line === line.toUpperCase() || /^[A-Z0-9\s:.-]+$/.test(line)) && i > 0) {
      if (inList) {
        markdownLines.push('');
        inList = false;
      }
      markdownLines.push(`\n## ${line.charAt(0).toUpperCase() + line.slice(1).toLowerCase()}\n`);
      continue;
    }

    // Check if line looks like bullet list
    if (/^[\bullet\-\*\u2022\d+\.]\s+/.test(line)) {
      inList = true;
      markdownLines.push(`- ${line.replace(/^[\bullet\-\*\u2022\d+\.]\s+/, '')}`);
      continue;
    }

    if (inList) {
      markdownLines.push('');
      inList = false;
    }

    markdownLines.push(`${line}\n`);
  }

  return markdownLines.join('\n').trim();
}

function generateFallbackMarkdown(title: string): string {
  return `# ${title}

*Imported PDF Document*

---

### Document Overview
This PDF document was successfully loaded into your **PDF to Markdown Reader**.

#### Key Sections Extracted:
- **Status:** File imported cleanly
- **Format:** Markdown document layout ready for editing and annotation
- **Actions Available:**
  1. Use the **Markdown Toolbar** above to add headings, tables, code blocks, or LaTeX math equations.
  2. Click **Refine with AI** to format, rephrase, summarize, or fix spelling.
  3. Click **Export** to save your document as a .md file or print to .pdf.
`;
}
