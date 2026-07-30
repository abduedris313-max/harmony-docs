import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css'; // Light theme code highlighting

// Configure Marked to use Highlight.js for code block syntax highlighting
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Custom renderer for GFM features, code syntax highlighting, and copy buttons
 */
export function renderMarkdownToHtml(markdownText: string): string {
  if (!markdownText) return '';

  try {
    // Parse markdown to HTML
    let rawHtml = marked.parse(markdownText) as string;

    // Enhance code blocks with syntax highlighting and copy header
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = rawHtml;

    // Process all code elements inside pre
    const codeBlocks = tempContainer.querySelectorAll('pre code');
    codeBlocks.forEach((codeEl, index) => {
      const codeText = codeEl.textContent || '';
      const className = codeEl.className || '';
      const langMatch = className.match(/language-(\w+)/);
      const language = langMatch ? langMatch[1] : 'plaintext';

      // Highlight syntax if language is supported
      if (langMatch && hljs.getLanguage(language)) {
        try {
          codeEl.innerHTML = hljs.highlight(codeText, { language }).value;
        } catch {
          codeEl.innerHTML = hljs.highlightAuto(codeText).value;
        }
      } else {
        codeEl.innerHTML = hljs.highlightAuto(codeText).value;
      }

      // Wrap pre in a code-block wrapper with header badge & copy button
      const preEl = codeEl.parentElement;
      if (preEl && preEl.tagName.toLowerCase() === 'pre') {
        const wrapper = document.createElement('div');
        wrapper.className = 'my-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden shadow-sm group';
        
        const header = document.createElement('div');
        header.className = 'flex items-center justify-between bg-slate-800/90 px-3.5 py-1.5 border-b border-slate-700 text-[11px] font-mono text-slate-300';
        header.innerHTML = `
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 inline-block"></span>
            <span className="ml-2 font-semibold text-slate-200 uppercase">${language}</span>
          </div>
          <button 
            type="button" 
            onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(codeText)}')); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy', 2000)" 
            className="hover:text-white bg-slate-700/80 hover:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-sans transition-colors cursor-pointer"
          >Copy</button>
        `;

        preEl.className = 'p-4 overflow-x-auto text-xs leading-relaxed font-mono';
        
        preEl.parentNode?.insertBefore(wrapper, preEl);
        wrapper.appendChild(header);
        wrapper.appendChild(preEl);
      }
    });

    // Enhance task list checkboxes
    const listItems = tempContainer.querySelectorAll('li');
    listItems.forEach((li) => {
      const html = li.innerHTML;
      if (html.startsWith('[ ] ')) {
        li.innerHTML = `<input type="checkbox" disabled class="mr-2 rounded text-blue-600 focus:ring-blue-500 align-middle" /> ${html.replace('[ ] ', '')}`;
        li.classList.add('list-none', 'my-1');
      } else if (html.startsWith('[x]') || html.startsWith('[X]')) {
        li.innerHTML = `<input type="checkbox" checked disabled class="mr-2 rounded text-blue-600 focus:ring-blue-500 align-middle" /> <span class="line-through text-slate-400">${html.substring(4)}</span>`;
        li.classList.add('list-none', 'my-1');
      }
    });

    return tempContainer.innerHTML;
  } catch (err) {
    console.error('Markdown parsing error:', err);
    return `<p class="text-red-500 text-xs">Failed to render markdown content.</p>`;
  }
}

/**
 * Line-by-line diff utility for Version History comparison
 */
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumberOld?: number;
  lineNumberNew?: number;
}

export function computeSimpleDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldLine === newLine) {
      result.push({
        type: 'unchanged',
        content: oldLine || '',
        lineNumberOld: oldIdx + 1,
        lineNumberNew: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else if (newLine !== undefined && (!oldLines.slice(oldIdx).includes(newLine))) {
      result.push({
        type: 'added',
        content: newLine,
        lineNumberNew: newIdx + 1,
      });
      newIdx++;
    } else if (oldLine !== undefined) {
      result.push({
        type: 'removed',
        content: oldLine,
        lineNumberOld: oldIdx + 1,
      });
      oldIdx++;
    } else {
      newIdx++;
    }
  }

  return result;
}
