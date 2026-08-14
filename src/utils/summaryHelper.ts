/**
 * Helper to insert or replace AI Key Takeaways in a Markdown document.
 */
export function insertTakeawaysIntoMarkdown(
  currentMarkdown: string,
  takeawaysMarkdown: string,
  placement: 'top' | 'cursor' | 'replace' = 'top',
  cursorPosition?: number
): string {
  const cleanTakeaways = takeawaysMarkdown.trim();

  if (placement === 'replace') {
    return cleanTakeaways;
  }

  if (placement === 'cursor' && typeof cursorPosition === 'number') {
    const before = currentMarkdown.substring(0, cursorPosition);
    const after = currentMarkdown.substring(cursorPosition);
    return `${before}\n\n${cleanTakeaways}\n\n${after}`;
  }

  // Top placement: check for existing Key Takeaways section first
  const existingTakeawaysRegex = /##\s+Key\s+Takeaways[\s\S]*?(?=(?:\n##|\n#(?![#])|$))/i;

  if (existingTakeawaysRegex.test(currentMarkdown)) {
    // Replace the existing takeaways section in place
    return currentMarkdown.replace(existingTakeawaysRegex, cleanTakeaways + '\n\n');
  }

  // Check for YAML Frontmatter (e.g. --- ... ---)
  const frontmatterMatch = currentMarkdown.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[0];
    const rest = currentMarkdown.substring(frontmatter.length).trimStart();
    return `${frontmatter}\n${cleanTakeaways}\n\n${rest}`;
  }

  // Check for top-level H1 heading (# Document Title)
  const h1Match = currentMarkdown.match(/^#\s+[^\r\n]+(?:\r?\n)+/);
  if (h1Match) {
    const h1Heading = h1Match[0];
    const rest = currentMarkdown.substring(h1Heading.length).trimStart();
    return `${h1Heading.trimEnd()}\n\n${cleanTakeaways}\n\n${rest}`;
  }

  // Otherwise, prepend at the very beginning of the document
  if (!currentMarkdown.trim()) {
    return cleanTakeaways;
  }

  return `${cleanTakeaways}\n\n${currentMarkdown}`;
}
