import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Code, 
  Table as TableIcon, 
  Bold, 
  List, 
  Quote, 
  Sigma, 
  Copy, 
  Check, 
  Sparkles,
  ExternalLink,
  BookOpen,
  Plus
} from 'lucide-react';

interface MarkdownHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSnippet?: (snippetText: string) => void;
}

interface SyntaxGuideCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  rules: {
    name: string;
    syntax: string;
    description: string;
    example: string;
  }[];
}

export const MarkdownHelpModal: React.FC<MarkdownHelpModalProps> = ({
  isOpen,
  onClose,
  onInsertSnippet,
}) => {
  const [activeTab, setActiveTab] = useState<string>('formatting');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: SyntaxGuideCategory[] = [
    {
      id: 'formatting',
      title: 'Text & Headings',
      icon: <Bold className="w-4 h-4" />,
      rules: [
        {
          name: 'Headings (H1 - H3)',
          syntax: '# Heading 1\n## Heading 2\n### Heading 3',
          description: 'Prefix line with # up to 6 levels.',
          example: '# Executive Overview',
        },
        {
          name: 'Bold & Italic',
          syntax: '**bold text** or *italic text*',
          description: 'Wrap with double asterisks for bold, single for italic.',
          example: 'This is **important** and *emphasized*.',
        },
        {
          name: 'Strikethrough',
          syntax: '~~deleted text~~',
          description: 'GFM extension to cross out text.',
          example: 'Old price: ~~$100~~ $49',
        },
        {
          name: 'Horizontal Line Divider',
          syntax: '---',
          description: 'Creates a clean horizontal dividing rule.',
          example: 'Section A\n\n---\n\nSection B',
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists & Tasks',
      icon: <List className="w-4 h-4" />,
      rules: [
        {
          name: 'Bullet List',
          syntax: '- Item 1\n- Item 2\n  - Sub-item',
          description: 'Use hyphens or asterisks.',
          example: '- Market Research\n- User Testing',
        },
        {
          name: 'Numbered List',
          syntax: '1. Step One\n2. Step Two',
          description: 'Sequential numbers followed by periods.',
          example: '1. Upload PDF\n2. AI Processing\n3. Export MD',
        },
        {
          name: 'Task Checkbox List (GFM)',
          syntax: '- [x] Completed task\n- [ ] Pending task',
          description: 'Interactive checklist items.',
          example: '- [x] Convert document\n- [ ] Review formatting',
        },
      ],
    },
    {
      id: 'tables',
      title: 'Tables & Code',
      icon: <TableIcon className="w-4 h-4" />,
      rules: [
        {
          name: 'GFM Tables',
          syntax: '| Column 1 | Column 2 |\n| :--- | :---: |\n| Cell A | Cell B |',
          description: 'Use pipes | and dashes. Colons set text alignment.',
          example: '| Name | Role | Status |\n| --- | --- | --- |\n| Sarah | Lead | Active |',
        },
        {
          name: 'Fenced Code Blocks',
          syntax: '```typescript\nconst greeting = "Hello World";\n```',
          description: 'Triple backticks with language for syntax highlighting.',
          example: '```ts\nfunction add(a: number, b: number) {\n  return a + b;\n}\n```',
        },
        {
          name: 'Inline Code',
          syntax: '`npm run dev`',
          description: 'Wrap short variable or command names in single backticks.',
          example: 'Run `npm install` to setup.',
        },
      ],
    },
    {
      id: 'advanced',
      title: 'Quotes, Math & Media',
      icon: <Sigma className="w-4 h-4" />,
      rules: [
        {
          name: 'Blockquotes',
          syntax: '> "Innovation distinguishes between a leader and a follower."',
          description: 'Prefix line with > for callouts and block quotes.',
          example: '> Note: Always double check generated table borders.',
        },
        {
          name: 'Hyperlinks & Images',
          syntax: '[Link Text](https://url.com)\n![Alt Text](https://img.com/pic.png)',
          description: 'Standard link and image embed tags.',
          example: '[Google AI Studio](https://ai.studio)',
        },
        {
          name: 'LaTeX Mathematical Formulas',
          syntax: 'Inline: $E = mc^2$\nBlock: $$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$',
          description: 'Math formulas rendered via LaTeX syntax.',
          example: 'Block math: $$\\int_{0}^{\\infty} x^2 dx$$',
        },
      ],
    },
  ];

  const currentCategory = categories.find((c) => c.id === activeTab) || categories[0];

  const handleCopy = (text: string, indexKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(indexKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/30 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Markdown Syntax Reference
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Quick guide for GitHub Flavored Markdown (GFM) &amp; formatting options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-slate-100 px-4 pt-3 border-b border-slate-200 flex space-x-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-3.5 py-2 rounded-t-xl font-semibold text-xs flex items-center space-x-1.5 transition-all whitespace-nowrap ${
                activeTab === cat.id
                  ? 'bg-white text-blue-700 border-t border-x border-slate-200 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {cat.icon}
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Content Rules Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/50">
          {currentCategory.rules.map((rule, idx) => {
            const key = `${activeTab}-${idx}`;
            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-200 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    {rule.name}
                  </h3>
                  
                  <div className="flex items-center space-x-1.5">
                    {onInsertSnippet && (
                      <button
                        onClick={() => {
                          onInsertSnippet(rule.example);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                        title="Insert into editor"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleCopy(rule.example, key)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors"
                      title="Copy example snippet"
                    >
                      {copiedIndex === key ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium mb-2.5">
                  {rule.description}
                </p>

                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                  <pre className="whitespace-pre-wrap">{rule.syntax}</pre>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Supports standard Markdown, GFM, LaTeX &amp; HTML elements
          </span>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-all"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};
