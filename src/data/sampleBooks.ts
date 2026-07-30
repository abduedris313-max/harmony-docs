import { Book } from '../types';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'The Art of War',
    author: 'Sun Tzu',
    source: 'online',
    category: 'Classics',
    shelf: 'Currently Reading',
    progressPercent: 42,
    rating: 5,
    lastReadTimestamp: Date.now() - 3600000 * 4,
    tags: ['Strategy', 'Leadership', 'Philosophy'],
    wordCount: 13500,
    coverColor: 'from-amber-600 to-red-800',
    description: 'An ancient Chinese military treatise attributed to Sun Tzu, composed of 13 chapters on military strategy and tactics.',
    fileFormat: 'md',
    isFavorite: true,
    content: `# The Art of War

*By Sun Tzu*

---

## Chapter I: Laying Plans

Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.

The art of war, then, is governed by five constant factors, to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field.

These are:
1. The Moral Law
2. Heaven
3. Earth
4. The Commander
5. Method and discipline

> "All warfare is based on deception. Hence, when able to attack, we must seem unable; when using our forces, we must seem inactive; when we are near, we must make the enemy believe we are far away; when far away, we must make him believe we are near."

---

## Chapter II: Waging War

In the operations of war, where there are in the field a thousand swift chariots, as many heavy chariots, and a hundred thousand mail-clad soldiers, with provisions enough to carry them a thousand li, the expenditure at home and at the front, including the entertainment of guests, small items such as glue and paint, and sums spent on chariots and armor, will reach the total of a thousand ounces of silver per day. Such is the cost of raising an army of 100,000 men.

When you engage in actual fighting, if victory is long in coming, then men's weapons will grow dull and their ardor will be damped. If you lay siege to a town, you will exhaust your strength.

---

## Chapter III: Attack by Stratagem

In the practical art of war, the best thing of all is to take the enemy's country whole and intact; to shatter and destroy it is not so good. So, too, it is better to recapture an army entire than to destroy it, to capture a regiment, a detachment or a company entire than to destroy them.

Hence to fight and conquer in all your battles is not supreme excellence; **supreme excellence consists in breaking the enemy's resistance without fighting.**

> "If you know the enemy and know yourself, you need not fear the result of a hundred battles. If you know yourself but not the enemy, for every victory gained you will also suffer a defeat. If you know neither the enemy nor yourself, you will succumb in every battle."
`,
    bookmarks: [
      {
        id: 'bm-1',
        bookId: 'book-1',
        chapterOrSection: 'Chapter I: Laying Plans',
        note: 'Key insight on five constant factors of decision making.',
        timestamp: Date.now() - 3600000 * 12,
        progressPercent: 15,
        quote: 'The art of war is governed by five constant factors...',
      },
      {
        id: 'bm-2',
        bookId: 'book-1',
        chapterOrSection: 'Chapter III: Attack by Stratagem',
        note: 'Famous quote about knowing oneself and the enemy.',
        timestamp: Date.now() - 3600000 * 2,
        progressPercent: 42,
        quote: 'If you know the enemy and know yourself, you need not fear the result of a hundred battles.',
      },
    ],
  },
  {
    id: 'book-2',
    title: 'Modern Web Architecture & Design System Guide',
    author: 'AI Engineering Press',
    source: 'cloud',
    cloudProvider: 'google-drive',
    category: 'Technical',
    shelf: 'Technical',
    progressPercent: 78,
    rating: 5,
    lastReadTimestamp: Date.now() - 3600000 * 24,
    tags: ['Architecture', 'React', 'TypeScript', 'System Design'],
    wordCount: 18200,
    coverColor: 'from-blue-600 to-indigo-900',
    description: 'A practical handbook covering clean component architecture, scalable design tokens, micro-frontends, and performance optimization.',
    fileFormat: 'md',
    isFavorite: true,
    content: `# Modern Web Architecture & Design System Guide

*Published by AI Engineering Press • 2026 Edition*

---

## 1. Core Principles of Modular UI

Modern frontend application architecture demands extreme clarity in boundaries:

- **State Locality**: Keep state as close as possible to the component consuming it.
- **Pure Component Rendering**: Decouple logic controllers from view layer presentation.
- **Design Token Discipline**: Standardize typography step scales, neutral brightness boundaries, and spatial rhythm.

\`\`\`typescript
interface DesignTokenSystem {
  spacingScale: number[];
  neutralPalette: Record<string, string>;
  fontScaleRatio: number;
}
\`\`\`

---

## 2. Asynchronous State & Real-time Persistence

When designing full-stack offline-first web apps, local cache synchronization ensures high resilience even during transient network degradation.

Key strategies include:
1. **Optimistic UI Updates**: Reflect state changes immediately while queuing backend RPC requests.
2. **Conflict Resolution**: Timestamps or CRDTs for multi-device sync.
3. **Local Storage Fallbacks**: Keep user drafts persistent across app restarts.
`,
    bookmarks: [
      {
        id: 'bm-3',
        bookId: 'book-2',
        chapterOrSection: '1. Core Principles of Modular UI',
        note: 'Remember design token step ratios (1.25+ scale).',
        timestamp: Date.now() - 3600000 * 30,
        progressPercent: 25,
        quote: 'Standardize typography step scales, neutral brightness boundaries, and spatial rhythm.',
      },
    ],
  },
  {
    id: 'book-3',
    title: 'Frankenstein; or, The Modern Prometheus',
    author: 'Mary Wollstonecraft Shelley',
    source: 'online',
    category: 'Classics',
    shelf: 'To Read',
    progressPercent: 0,
    rating: 4,
    lastReadTimestamp: Date.now() - 3600000 * 72,
    tags: ['Sci-Fi', 'Gothic', 'Literature'],
    wordCount: 75000,
    coverColor: 'from-emerald-800 to-slate-900',
    description: 'The iconic gothic masterpiece exploring human ambition, scientific ethics, and the consequences of creation.',
    fileFormat: 'epub',
    isFavorite: false,
    content: `# Frankenstein; or, The Modern Prometheus

*By Mary Wollstonecraft Shelley (1818)*

---

## Letter I

*To Mrs. Saville, England.*

**St. Petersburgh, Dec. 11th, 17--.**

You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings. I arrived here yesterday, and my first task is to assure my dear sister of my welfare and increasing confidence in the success of my undertaking.

I am already far north of London, and as I walk in the streets of Petersburgh, I feel a cold northern breeze play upon my cheeks, which braces my nerves and fills me with delight. Do you understand this feeling? This breeze, which has travelled from the regions towards which I am advancing, gives me a foretaste of those icy climes.

Inspirited by this wind of promise, my daydreams become more fervent and vivid. I try in vain to be persuaded that the pole is the seat of frost and desolation; it ever presents itself to my imagination as the region of beauty and delight.

---

## Chapter I

I am by birth a Genevese, and my family is one of the most distinguished of that republic. My ancestors had been for many years counsellors and syndics, and my father had filled several public situations with honour and reputation. He was respected by all who knew him for his integrity and indefatigable attention to public business.
`,
    bookmarks: [],
  },
  {
    id: 'book-4',
    title: 'Prompt Engineering & LLM Application Blueprint',
    author: 'DeepMind Research Notes',
    source: 'online',
    category: 'Technology',
    shelf: 'Favorites',
    progressPercent: 100,
    rating: 5,
    lastReadTimestamp: Date.now() - 3600000 * 10,
    tags: ['AI', 'Gemini', 'Prompts', 'LLMs'],
    wordCount: 14200,
    coverColor: 'from-purple-600 to-indigo-900',
    description: 'Comprehensive guidelines for constructing structured system prompts, zero-shot grounding, function calling, and agent workflow design.',
    fileFormat: 'md',
    isFavorite: true,
    content: `# Prompt Engineering & LLM Application Blueprint

*DeepMind Developer Guides*

---

## 1. System Prompt Architecture

A robust prompt frame contains four distinct semantic zones:

1. **Identity & Role**: Clearly bound capabilities and target persona.
2. **Context & Environment**: Dynamic runtime capabilities and sandbox constraints.
3. **Execution Instructions**: Concise step-by-step reasoning directives.
4. **Output Schema**: Expected response formatting guidelines.

---

## 2. Function Calling & Tool Synergy

When connecting Gemini models to system APIs:
- Maintain clear parameter descriptions.
- Validate JSON arguments on host before execution.
- Provide descriptive, self-contained error feedback on tool failure.
`,
    bookmarks: [
      {
        id: 'bm-4',
        bookId: 'book-4',
        chapterOrSection: '1. System Prompt Architecture',
        note: 'Four semantic zones pattern.',
        timestamp: Date.now() - 3600000 * 15,
        progressPercent: 100,
        quote: 'A robust prompt frame contains four distinct semantic zones.',
      },
    ],
  },
  {
    id: 'book-5',
    title: 'The Metamorphosis',
    author: 'Franz Kafka',
    source: 'local',
    category: 'Classics',
    shelf: 'Completed',
    progressPercent: 100,
    rating: 5,
    lastReadTimestamp: Date.now() - 3600000 * 120,
    tags: ['Absurdist', 'Classic', 'Fiction'],
    wordCount: 22000,
    coverColor: 'from-amber-700 to-stone-900',
    description: 'Franz Kafka\'s surreal novella about Gregor Samsa, who wakes up one morning transformed into a giant insect.',
    fileFormat: 'txt',
    isFavorite: true,
    content: `# The Metamorphosis

*By Franz Kafka*

---

## Part I

One morning, when Gregor Samsa woke from troubled dreams, he found himself transformed in his bed into a horrible vermin. He lay on his armour-like back, and if he lifted his head a little he could see his brown belly, slightly domed and divided by arches into stiff sections.

The bedding was hardly able to cover it and seemed ready to slide off any moment. His many legs, pitifully thin compared with the size of the rest of him, waved helplessly before his eyes.

"What's happened to me?" he thought. It wasn't a dream. His room, a proper human room although a little too small, lay peacefully between its four familiar walls.
`,
    bookmarks: [],
  },
];
