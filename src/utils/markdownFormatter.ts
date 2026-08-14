/**
 * Markdown Formatter Utility
 * Normalizes lists, whitespace, header spacing, and structural formatting.
 */

export interface MarkdownFormatOptions {
  normalizeLists?: boolean;
  normalizeHeaders?: boolean;
  normalizeSpacing?: boolean;
  normalizeTables?: boolean;
  normalizeBlockquotes?: boolean;
}

export const DEFAULT_FORMAT_OPTIONS: MarkdownFormatOptions = {
  normalizeLists: true,
  normalizeHeaders: true,
  normalizeSpacing: true,
  normalizeTables: true,
  normalizeBlockquotes: true,
};

/**
 * Formats and normalizes a Markdown document according to standard GFM conventions.
 */
export function formatMarkdownDocument(
  markdown: string,
  options: MarkdownFormatOptions = DEFAULT_FORMAT_OPTIONS
): string {
  if (!markdown || !markdown.trim()) {
    return markdown;
  }

  const {
    normalizeLists = true,
    normalizeHeaders = true,
    normalizeSpacing = true,
    normalizeTables = true,
    normalizeBlockquotes = true,
  } = options;

  // Step 1: Extract and preserve fenced code blocks (``` or ~~~) and display math ($$...$$)
  const preservedBlocks: string[] = [];
  let placeholderIndex = 0;

  // Protect code blocks
  let text = markdown.replace(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g, (match) => {
    const placeholder = `__PRESERVED_CODE_BLOCK_${placeholderIndex++}__`;
    preservedBlocks.push(match);
    return placeholder;
  });

  // Protect display math blocks
  text = text.replace(/(\$\$[\s\S]*?\$\$)/g, (match) => {
    const placeholder = `__PRESERVED_CODE_BLOCK_${placeholderIndex++}__`;
    preservedBlocks.push(match);
    return placeholder;
  });

  // Protect frontmatter
  let frontmatter = '';
  const frontmatterMatch = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (frontmatterMatch) {
    frontmatter = frontmatterMatch[0];
    text = text.substring(frontmatter.length);
  }

  const rawLines = text.split(/\r?\n/);
  const formattedLines: string[] = [];

  // Track ordered list numbering across contiguous blocks
  let orderedListStack: { indent: number; currentNum: number }[] = [];
  let inTable = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Trim trailing whitespace if requested
    if (normalizeSpacing) {
      line = line.trimEnd();
    }

    const trimmed = line.trim();

    // Check if line is empty
    if (!trimmed) {
      orderedListStack = [];
      inTable = false;
      formattedLines.push('');
      continue;
    }

    // Check if line is a preserved code block placeholder
    if (trimmed.startsWith('__PRESERVED_CODE_BLOCK_')) {
      orderedListStack = [];
      inTable = false;
      formattedLines.push(line);
      continue;
    }

    // 1. Normalize Headers
    if (normalizeHeaders) {
      // Fix missing space after hashes: e.g., `#Title` -> `# Title`
      const headerMatch = line.match(/^(\s*)(#{1,6})([^\s#].*)$/);
      if (headerMatch) {
        line = `${headerMatch[1]}${headerMatch[2]} ${headerMatch[3]}`;
      }

      // Check if this line is a heading
      const isHeader = /^#{1,6}\s+/.test(line.trimStart());
      if (isHeader) {
        orderedListStack = [];
        inTable = false;

        // Ensure single blank line before heading (unless it is the very first line or previous line is also heading or blank)
        if (formattedLines.length > 0) {
          const lastLine = formattedLines[formattedLines.length - 1];
          if (lastLine !== '' && !/^#{1,6}\s+/.test(lastLine.trimStart()) && !lastLine.startsWith('__PRESERVED_CODE_BLOCK_')) {
            formattedLines.push('');
          }
        }

        formattedLines.push(line);
        continue;
      }
    }

    // 2. Normalize Blockquotes
    if (normalizeBlockquotes) {
      const bqMatch = line.match(/^(\s*)(>+)([^\s>].*)$/);
      if (bqMatch) {
        line = `${bqMatch[1]}${bqMatch[2]} ${bqMatch[3]}`;
      }
    }

    // 3. Normalize Lists
    if (normalizeLists) {
      // Checkbox list items: `- [ ]`, `- [x]`, `- [X]`
      const checkboxMatch = line.match(/^(\s*)([-*+])\s*\[([ xX])\]\s*(.*)$/);
      if (checkboxMatch) {
        const indent = checkboxMatch[1];
        const marker = '-'; // standardize to hyphen
        const checkState = checkboxMatch[3].toLowerCase() === 'x' ? 'x' : ' ';
        const itemContent = checkboxMatch[4];
        line = `${indent}${marker} [${checkState}] ${itemContent}`;
        orderedListStack = [];
        formattedLines.push(line);
        continue;
      }

      // Unordered list items: `-item`, `*item`, `+item` -> `- item`
      const unorderedMatch = line.match(/^(\s*)([-*+])([^\s\-*+].*)$/);
      if (unorderedMatch && !line.match(/^(\s*)(-{3,}|\*{3,}|_{3,})$/)) {
        const indent = unorderedMatch[1];
        const marker = unorderedMatch[2];
        const itemContent = unorderedMatch[3];
        line = `${indent}${marker} ${itemContent}`;
        orderedListStack = [];
        formattedLines.push(line);
        continue;
      }

      // Standardize unordered list items with existing space
      const stdUnorderedMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
      if (stdUnorderedMatch && !line.match(/^(\s*)(-{3,}|\*{3,}|_{3,})$/)) {
        orderedListStack = [];
        formattedLines.push(line);
        continue;
      }

      // Ordered list items: `1.item` -> `1. item` and sequential renumbering
      const orderedMatch = line.match(/^(\s*)(\d+)\.([^\s\d].*)$/);
      if (orderedMatch) {
        line = `${orderedMatch[1]}${orderedMatch[2]}. ${orderedMatch[3]}`;
      }

      const stdOrderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      if (stdOrderedMatch) {
        const indentStr = stdOrderedMatch[1];
        const indentLevel = indentStr.length;
        const itemContent = stdOrderedMatch[3];

        // Find or create level in stack
        let stackItem = orderedListStack.find((s) => s.indent === indentLevel);
        if (!stackItem) {
          // Remove deeper indentation levels
          orderedListStack = orderedListStack.filter((s) => s.indent < indentLevel);
          stackItem = { indent: indentLevel, currentNum: 1 };
          orderedListStack.push(stackItem);
        }

        const nextNum = stackItem.currentNum++;
        line = `${indentStr}${nextNum}. ${itemContent}`;
        formattedLines.push(line);
        continue;
      }
    }

    // 4. Normalize Tables
    if (normalizeTables) {
      const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.length > 2;
      if (isTableRow) {
        // If transitioning into table and previous line is non-empty text, add blank line
        if (!inTable && formattedLines.length > 0) {
          const lastLine = formattedLines[formattedLines.length - 1];
          if (lastLine !== '' && !lastLine.startsWith('|')) {
            formattedLines.push('');
          }
        }
        inTable = true;
        orderedListStack = [];
        formattedLines.push(line);
        continue;
      } else {
        inTable = false;
      }
    }

    // Normal paragraph line
    orderedListStack = [];
    formattedLines.push(line);
  }

  let result = formattedLines.join('\n');

  // Step 2: Normalize excessive blank lines (3 or more newlines -> 2 newlines)
  if (normalizeSpacing) {
    result = result.replace(/\n{3,}/g, '\n\n');
  }

  // Step 3: Re-insert preserved code blocks & math
  for (let i = 0; i < preservedBlocks.length; i++) {
    result = result.replace(`__PRESERVED_CODE_BLOCK_${i}__`, preservedBlocks[i]);
  }

  // Step 4: Re-attach frontmatter
  if (frontmatter) {
    result = frontmatter + result.trimStart();
  }

  // Ensure trailing newline
  return result.trimEnd() + '\n';
}
