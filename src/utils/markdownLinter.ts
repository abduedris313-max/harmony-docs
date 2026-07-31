export type IssueSeverity = 'error' | 'warning' | 'info';

export interface MarkdownIssue {
  id: string;
  ruleId: string;
  severity: IssueSeverity;
  title: string;
  message: string;
  lineIndex: number;
  startPos: number;
  endPos: number;
  lineText: string;
  suggestedFix?: string;
  autoFixable: boolean;
}

/**
 * Analyzes markdown text and returns a list of syntax/formatting issues.
 */
export function lintMarkdownSyntax(markdown: string): MarkdownIssue[] {
  const issues: MarkdownIssue[] = [];
  if (!markdown) return issues;

  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeBlockStartLine = -1;
  let codeBlockFence = '';

  let charOffset = 0;

  // Track ordered lists for sequence continuity
  let currentListStartLine = -1;
  let expectedListNumber = 1;

  // Track table column counts
  let inTable = false;
  let tableHeaderCols = 0;
  let tableStartLine = -1;

  // Track headings for duplicates
  const headingCounts = new Map<string, number[]>();

  lines.forEach((line, lineIndex) => {
    const lineStartPos = charOffset;
    const lineEndPos = charOffset + line.length;
    charOffset += line.length + 1; // +1 for newline

    // 1. Code Block Fence Check
    const codeBlockMatch = line.match(/^(\s*)(```|~~~)(.*)$/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockStartLine = lineIndex;
        codeBlockFence = codeBlockMatch[2];
      } else {
        // Closing fence match
        if (codeBlockMatch[2] === codeBlockFence) {
          inCodeBlock = false;
          codeBlockStartLine = -1;
          codeBlockFence = '';
        }
      }
      // Reset list and table tracking on code block fences
      currentListStartLine = -1;
      inTable = false;
      return;
    }

    // Skip syntax linting inside fenced code blocks (except checking if code block itself ends)
    if (inCodeBlock) {
      return;
    }

    // 2. Missing Header Space Check (e.g. `#Title` instead of `# Title`)
    const missingHeaderSpaceMatch = line.match(/^(#{1,6})([^\s#].*)$/);
    if (missingHeaderSpaceMatch) {
      const hashes = missingHeaderSpaceMatch[1];
      const text = missingHeaderSpaceMatch[2];
      issues.push({
        id: `header-space-${lineIndex}`,
        ruleId: 'header-missing-space',
        severity: 'error',
        title: 'Missing Header Space',
        message: `Header "${hashes}" requires a space before "${text.substring(0, 15)}" (e.g., "${hashes} ${text}").`,
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: `${hashes} ${text}`,
        autoFixable: true,
      });
    }

    // Track Valid Headings for Duplicates
    const validHeaderMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (validHeaderMatch) {
      const headerText = validHeaderMatch[2].trim().toLowerCase();
      const existing = headingCounts.get(headerText) || [];
      existing.push(lineIndex);
      headingCounts.set(headerText, existing);
    }

    // 3. List Item Formatting & Sequence Check
    // Missing space after list marker (e.g., `-Item` or `1.Item`)
    const missingListSpaceMatch = line.match(/^(\s*)([-+*]|\d+\.)([^\s\-\+\*\d].*)$/);
    if (missingListSpaceMatch && !line.match(/^(\s*)(-{3,}|\*{3,}|_{3,})$/)) { // exclude horizontal rule --- or ***
      const indent = missingListSpaceMatch[1];
      const marker = missingListSpaceMatch[2];
      const rest = missingListSpaceMatch[3];
      issues.push({
        id: `list-space-${lineIndex}`,
        ruleId: 'list-missing-space',
        severity: 'warning',
        title: 'Missing Space in List Item',
        message: `List marker "${marker}" should be followed by a space.`,
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: `${indent}${marker} ${rest}`,
        autoFixable: true,
      });
    }

    // Check Numbered List Order Continuity (e.g. 1., 3. skipping 2.)
    const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (orderedListMatch) {
      const num = parseInt(orderedListMatch[2], 10);
      const indent = orderedListMatch[1];
      const rest = orderedListMatch[3];

      if (currentListStartLine === -1 || lineIndex !== currentListStartLine + 1) {
        // Start of a new ordered list block
        currentListStartLine = lineIndex;
        expectedListNumber = num + 1;
      } else {
        // Continuous list item
        currentListStartLine = lineIndex;
        if (num !== expectedListNumber && num !== 1) { // allow resetting to 1 for nested
          issues.push({
            id: `list-seq-${lineIndex}`,
            ruleId: 'list-sequence-jump',
            severity: 'info',
            title: 'Numbered List Sequence Skip',
            message: `List jumps from ${expectedListNumber - 1}. to ${num}. (expected ${expectedListNumber}.).`,
            lineIndex,
            startPos: lineStartPos,
            endPos: lineEndPos,
            lineText: line,
            suggestedFix: `${indent}${expectedListNumber}. ${rest}`,
            autoFixable: true,
          });
        }
        expectedListNumber = num + 1;
      }
    } else if (line.trim() === '') {
      // blank line resets list continuity
      currentListStartLine = -1;
    }

    // 4. Table Format & Mismatched Column Count Check
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|') && line.trim().length > 2;
    if (isTableRow) {
      // count cells by splitting on unescaped '|'
      const cells = line.split(/(?<!\\)\|/).slice(1, -1);
      const colCount = cells.length;

      const isSeparatorRow = line.match(/^\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?$/);

      if (!inTable) {
        inTable = true;
        tableStartLine = lineIndex;
        tableHeaderCols = colCount;
      } else {
        if (!isSeparatorRow && colCount !== tableHeaderCols && tableHeaderCols > 0) {
          issues.push({
            id: `table-cols-${lineIndex}`,
            ruleId: 'table-column-mismatch',
            severity: 'warning',
            title: 'Table Column Mismatch',
            message: `Table row has ${colCount} columns, but header on line ${tableStartLine + 1} has ${tableHeaderCols} columns.`,
            lineIndex,
            startPos: lineStartPos,
            endPos: lineEndPos,
            lineText: line,
            autoFixable: false,
          });
        }
      }
    } else if (line.trim() === '') {
      inTable = false;
    }

    // 5. Unclosed Inline Code Backticks or Bold formatting on a single line
    // Inline code backtick check
    const backtickMatches = line.match(/(?<!\\)`/g);
    if (backtickMatches && backtickMatches.length % 2 !== 0) {
      issues.push({
        id: `unclosed-backtick-${lineIndex}`,
        ruleId: 'unclosed-inline-code',
        severity: 'warning',
        title: 'Unclosed Inline Code',
        message: 'Uneven number of backticks (`) found on line.',
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: `${line}\``,
        autoFixable: true,
      });
    }

    // Bold formatting `**` check
    const boldMatches = line.match(/(?<!\\)\*\*/g);
    if (boldMatches && boldMatches.length % 2 !== 0) {
      issues.push({
        id: `unclosed-bold-${lineIndex}`,
        ruleId: 'unclosed-bold-tag',
        severity: 'warning',
        title: 'Unclosed Bold Formatting',
        message: 'Uneven number of double asterisks (**) found on line.',
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: `${line}**`,
        autoFixable: true,
      });
    }

    // 6. Empty or Broken Link Target Check e.g., `[label]()` or `![alt]()`
    const emptyLinkMatch = line.match(/!?\[([^\]]+)\]\(\s*\)/);
    if (emptyLinkMatch) {
      const label = emptyLinkMatch[1];
      issues.push({
        id: `empty-link-${lineIndex}`,
        ruleId: 'empty-link-target',
        severity: 'warning',
        title: 'Empty Link / Image Target',
        message: `Link "[${label}]()" has an empty URL target.`,
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: line.replace(/!?\[([^\]]+)\]\(\s*\)/, '[$1](#)'),
        autoFixable: true,
      });
    }

    // Unclosed bracket link e.g. `[text](http://example.com`
    if (line.includes('[') && line.includes('](') && !line.includes(')')) {
      issues.push({
        id: `unclosed-link-${lineIndex}`,
        ruleId: 'unclosed-link-syntax',
        severity: 'warning',
        title: 'Unclosed Link Syntax',
        message: 'Link URL appears missing a closing parenthesis ")".',
        lineIndex,
        startPos: lineStartPos,
        endPos: lineEndPos,
        lineText: line,
        suggestedFix: `${line})`,
        autoFixable: true,
      });
    }
  });

  // Check if document ends with unclosed Code Block
  if (inCodeBlock && codeBlockStartLine !== -1) {
    const startLinePos = lines.slice(0, codeBlockStartLine).reduce((acc, l) => acc + l.length + 1, 0);
    issues.push({
      id: `unclosed-codeblock-${codeBlockStartLine}`,
      ruleId: 'unclosed-code-block',
      severity: 'error',
      title: 'Unclosed Code Block',
      message: `Code block started on line ${codeBlockStartLine + 1} with "${codeBlockFence}" was never closed.`,
      lineIndex: codeBlockStartLine,
      startPos: startLinePos,
      endPos: startLinePos + lines[codeBlockStartLine].length,
      lineText: lines[codeBlockStartLine],
      suggestedFix: `${markdown}\n${codeBlockFence}`,
      autoFixable: true,
    });
  }

  // Check Duplicate Headings
  headingCounts.forEach((lineIndices, text) => {
    if (lineIndices.length > 1) {
      lineIndices.slice(1).forEach((lineIndex) => {
        const line = lines[lineIndex];
        const lineStartPos = lines.slice(0, lineIndex).reduce((acc, l) => acc + l.length + 1, 0);
        issues.push({
          id: `dup-heading-${lineIndex}`,
          ruleId: 'duplicate-heading',
          severity: 'info',
          title: 'Duplicate Heading',
          message: `Heading "${lines[lineIndex].replace(/^#+\s*/, '')}" is repeated. Consider making headings unique for TOC links.`,
          lineIndex,
          startPos: lineStartPos,
          endPos: lineStartPos + line.length,
          lineText: line,
          autoFixable: false,
        });
      });
    }
  });

  // Sort issues by line number
  return issues.sort((a, b) => a.lineIndex - b.lineIndex);
}

/**
 * Automatically fixes all auto-fixable issues in the Markdown document.
 */
export function fixAllMarkdownIssues(markdown: string): { newMarkdown: string; fixedCount: number } {
  let issues = lintMarkdownSyntax(markdown);
  let currentMarkdown = markdown;
  let fixedCount = 0;

  // Perform pass on auto-fixable line-by-line issues
  const lines = currentMarkdown.split('\n');
  let modified = false;

  issues.forEach((issue) => {
    if (issue.autoFixable && issue.suggestedFix && issue.ruleId !== 'unclosed-code-block') {
      lines[issue.lineIndex] = issue.suggestedFix;
      fixedCount++;
      modified = true;
    }
  });

  if (modified) {
    currentMarkdown = lines.join('\n');
  }

  // Check for unclosed code block fix
  const unclosedBlockIssue = issues.find((i) => i.ruleId === 'unclosed-code-block' && i.autoFixable);
  if (unclosedBlockIssue) {
    currentMarkdown = `${currentMarkdown.trimEnd()}\n\`\`\`\n`;
    fixedCount++;
  }

  return { newMarkdown: currentMarkdown, fixedCount };
}
