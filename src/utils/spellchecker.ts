// Comprehensive Spellchecker with dictionary lookup, Levenshtein distance suggestions, and Markdown syntax filter

// Standard common English vocabulary & tech/markdown terms
const BASE_DICTIONARY = new Set<string>([
  // Common tech & markdown terms
  'markdown', 'pdf', 'gfm', 'html', 'css', 'javascript', 'typescript', 'react', 'vite',
  'api', 'apis', 'url', 'urls', 'http', 'https', 'json', 'xml', 'sql', 'database', 'repo',
  'github', 'npm', 'node', 'editor', 'parser', 'renderer', 'code', 'inline', 'syntax',
  'frontmatter', 'table', 'toc', 'header', 'footer', 'sidebar', 'toolbar', 'modal',
  'document', 'documents', 'ios', 'android', 'app', 'apps', 'metadata', 'workflow',
  'download', 'upload', 'file', 'files', 'folder', 'workspace', 'config', 'setup',
  
  // Common English words
  'a', 'about', 'above', 'across', 'act', 'active', 'activity', 'add', 'address',
  'after', 'again', 'against', 'age', 'ago', 'agree', 'air', 'all', 'allow',
  'almost', 'alone', 'along', 'already', 'also', 'although', 'always', 'am', 'american',
  'among', 'amount', 'an', 'analysis', 'analytic', 'and', 'another', 'answer', 'any',
  'anyone', 'anything', 'anyway', 'app', 'appear', 'apply', 'approach', 'approve',
  'are', 'area', 'arg', 'arguing', 'argument', 'around', 'art', 'article', 'as', 'ask',
  'assigned', 'at', 'author', 'auto', 'automatic', 'available', 'away', 'back', 'bad',
  'badge', 'base', 'based', 'be', 'beautiful', 'because', 'become', 'been', 'before',
  'began', 'begin', 'beginning', 'behind', 'being', 'believe', 'below', 'bench', 'best',
  'better', 'between', 'big', 'bill', 'billion', 'binary', 'bit', 'black', 'block',
  'blue', 'board', 'body', 'book', 'border', 'both', 'bottom', 'boy', 'break', 'brief',
  'bring', 'brother', 'buffer', 'bug', 'build', 'builder', 'building', 'built', 'business',
  'but', 'button', 'buy', 'by', 'call', 'called', 'came', 'camera', 'can', 'candidate',
  'cannot', 'car', 'card', 'care', 'carry', 'case', 'cat', 'cause', 'cell', 'center',
  'center', 'central', 'century', 'certain', 'certainly', 'chain', 'chair', 'change',
  'character', 'chart', 'check', 'checker', 'checking', 'child', 'children', 'choice',
  'choose', 'chunk', 'class', 'clean', 'clear', 'clearly', 'click', 'client', 'close',
  'closed', 'cloud', 'cold', 'color', 'column', 'columns', 'com', 'come', 'command',
  'common', 'community', 'company', 'compare', 'comparison', 'complete', 'completed',
  'component', 'compute', 'computer', 'condition', 'config', 'configuration',
  'confirm', 'content', 'context', 'continue', 'control', 'conversion', 'convert',
  'converted', 'converting', 'cookie', 'copy', 'core', 'cost', 'could', 'count', 'country',
  'course', 'create', 'created', 'creating', 'creation', 'cron', 'custom', 'customized',
  'data', 'date', 'day', 'deal', 'decide', 'decision', 'deep', 'default', 'define',
  'defined', 'del', 'delete', 'deleted', 'demo', 'description', 'design', 'designer',
  'desk', 'detail', 'details', 'detect', 'detection', 'developer', 'development',
  'device', 'dialog', 'dict', 'dictionary', 'did', 'different', 'difficult', 'digital',
  'direct', 'direction', 'director', 'directory', 'display', 'dist', 'distance', 'do',
  'doc', 'docs', 'doctor', 'document', 'documentation', 'does', 'dog', 'done', 'door',
  'dot', 'down', 'download', 'draft', 'drag', 'draw', 'drawer', 'drive', 'drop',
  'dropzone', 'due', 'during', 'dynamic', 'each', 'early', 'edit', 'editing', 'editor',
  'education', 'effect', 'effort', 'eight', 'either', 'element', 'else', 'email',
  'embed', 'end', 'engine', 'enjoy', 'enough', 'enter', 'entire', 'entry', 'env',
  'environment', 'equal', 'error', 'errors', 'escape', 'esm', 'event', 'ever', 'every',
  'everyone', 'everything', 'exact', 'example', 'exec', 'execute', 'execution', 'exist',
  'expand', 'expect', 'export', 'expression', 'external', 'extra', 'extract', 'extraction',
  'eye', 'fact', 'fail', 'failed', 'failure', 'fall', 'family', 'far', 'fast', 'fastest',
  'feat', 'feature', 'features', 'feel', 'few', 'field', 'fields', 'figure', 'file',
  'filename', 'files', 'fill', 'filter', 'final', 'finally', 'find', 'fine', 'finish',
  'finished', 'fire', 'first', 'fix', 'fixed', 'flag', 'flags', 'flex', 'float', 'flow',
  'focus', 'folder', 'follow', 'following', 'font', 'font', 'foot', 'footer', 'for',
  'force', 'form', 'format', 'formatted', 'formatting', 'formula', 'forward', 'found',
  'four', 'frame', 'framework', 'free', 'from', 'front', 'frontmatter', 'full', 'function',
  'functional', 'game', 'gather', 'gen', 'general', 'generate', 'generated', 'generation',
  'generator', 'get', 'gib', 'girl', 'give', 'given', 'glass', 'global', 'go', 'goal',
  'god', 'good', 'got', 'gran', 'grant', 'graph', 'graphic', 'great', 'green', 'grid',
  'ground', 'group', 'grow', 'growth', 'guard', 'guideline', 'guide', 'gut', 'guy',
  'hair', 'half', 'hand', 'handle', 'handler', 'handling', 'happen', 'happy', 'hard',
  'has', 'have', 'he', 'head', 'header', 'heading', 'headings', 'health', 'hear',
  'heart', 'heavy', 'height', 'held', 'hello', 'help', 'helper', 'her', 'here',
  'hero', 'herself', 'hidden', 'high', 'highlight', 'highlighted', 'him', 'himself',
  'his', 'history', 'hit', 'hold', 'holder', 'home', 'hope', 'host', 'hot', 'hour',
  'house', 'how', 'however', 'html', 'huge', 'human', 'hundred', 'i', 'icon', 'icons',
  'id', 'idea', 'identify', 'if', 'iframe', 'image', 'images', 'important', 'import',
  'imports', 'in', 'include', 'includes', 'included', 'including', 'index', 'indent',
  'indicator', 'info', 'information', 'ingress', 'initial', 'initiate', 'init', 'input',
  'inside', 'inspect', 'inspector', 'install', 'installation', 'instance', 'instead',
  'instantly', 'instruction', 'instructions', 'integer', 'integrate', 'integrated',
  'integration', 'intense', 'intent', 'interactive', 'interface', 'internal', 'into',
  'intro', 'introduce', 'invalid', 'invoice', 'ip', 'is', 'issue', 'it', 'item', 'items',
  'its', 'itself', 'job', 'join', 'json', 'jump', 'just', 'keep', 'key', 'keys', 'kind',
  'kill', 'know', 'knowledge', 'lab', 'label', 'labels', 'land', 'landing', 'language',
  'large', 'larger', 'last', 'late', 'later', 'laugh', 'launch', 'launched', 'lawn',
  'layer', 'layout', 'lead', 'leader', 'learn', 'least', 'leave', 'left', 'leg',
  'legible', 'length', 'less', 'let', 'letter', 'level', 'leverage', 'library', 'life',
  'light', 'like', 'likely', 'limit', 'limited', 'line', 'line', 'linear', 'link',
  'links', 'list', 'lists', 'listen', 'little', 'live', 'load', 'loading', 'loader',
  'local', 'location', 'log', 'logged', 'logging', 'logic', 'logistics', 'long', 'longer',
  'look', 'loop', 'love', 'low', 'lower', 'made', 'main', 'maintaining', 'maintain',
  'make', 'making', 'manage', 'manager', 'management', 'manual', 'many', 'map', 'margin',
  'marker', 'markdown', 'mark', 'market', 'match', 'matching', 'mate', 'material',
  'math', 'mathematical', 'maximum', 'max', 'may', 'maybe', 'me', 'mean', 'meaning',
  'media', 'medium', 'member', 'memo', 'menu', 'message', 'messages', 'metal', 'method',
  'methods', 'met', 'middle', 'might', 'mike', 'mile', 'mind', 'mine', 'minimal',
  'minimum', 'min', 'minute', 'minutes', 'mode', 'model', 'modern', 'modify', 'module',
  'momentum', 'monospaced', 'month', 'more', 'morning', 'most', 'mother', 'move',
  'movement', 'msg', 'much', 'multi', 'multiple', 'multilingual', 'must', 'my', 'myself',
  'name', 'names', 'nav', 'navigation', 'need', 'nested', 'network', 'never', 'new',
  'news', 'next', 'nice', 'night', 'nine', 'no', 'node', 'noise', 'non', 'none', 'normal',
  'north', 'not', 'note', 'notebook', 'notes', 'nothing', 'notice', 'now', 'null',
  'number', 'numbers', 'num', 'object', 'objects', 'official', 'off', 'offset', 'often',
  'oil', 'old', 'on', 'once', 'one', 'online', 'only', 'open', 'opened', 'opener',
  'operating', 'operation', 'opt', 'option', 'options', 'optional', 'or', 'order',
  'ordinary', 'org', 'organize', 'organized', 'original', 'other', 'others', 'our',
  'out', 'outcome', 'output', 'outside', 'over', 'overall', 'overlay', 'override',
  'own', 'owner', 'package', 'page', 'pages', 'padding', 'paint', 'pair', 'pal', 'panel',
  'paper', 'paragraph', 'params', 'parameter', 'parent', 'parse', 'parsed', 'parser',
  'part', 'participate', 'partly', 'party', 'pass', 'passed', 'pass', 'past', 'path',
  'paths', 'pattern', 'pay', 'pdf', 'pen', 'pending', 'people', 'per', 'percent', 'perfect',
  'perform', 'performance', 'period', 'permission', 'person', 'personal', 'ph', 'phone',
  'photo', 'phrase', 'pick', 'picker', 'picture', 'piece', 'pill', 'pin', 'pipe',
  'pipeline', 'place', 'plan', 'plane', 'plant', 'platform', 'play', 'player', 'playground',
  'please', 'plus', 'pms', 'pod', 'point', 'pointer', 'points', 'poll', 'polyline',
  'pop', 'popup', 'port', 'position', 'possibility', 'possible', 'possibly', 'post',
  'potential', 'pot', 'power', 'powerful', 'practice', 'prefer', 'preference',
  'prefix', 'pre', 'prepare', 'present', 'preserve', 'preset', 'press', 'pretty',
  'prev', 'preview', 'price', 'primary', 'print', 'prior', 'priority', 'privacy',
  'private', 'problem', 'process', 'processing', 'process', 'product', 'production',
  'profile', 'program', 'programmatic', 'progress', 'project', 'prompt', 'property',
  'protocol', 'provide', 'public', 'publish', 'pull', 'pulse', 'purpose', 'push', 'put',
  'quality', 'quantity', 'query', 'question', 'quick', 'quickly', 'quiet', 'quota',
  'quote', 'radix', 'rail', 'range', 'rank', 'rapid', 'rate', 'rather', 'raw', 're',
  'reach', 'react', 'read', 'reader', 'reading', 'readability', 'read', 'ready', 'real',
  'reason', 'receive', 'recent', 'recently', 'recipe', 'record', 'red', 'reduce',
  'ref', 'reference', 'refine', 'refined', 'refresh', 'regex', 'region', 'register',
  'rel', 'related', 'release', 'remain', 'remainder', 'remote', 'remove', 'removed',
  'rename', 'render', 'rendered', 'rendering', 'rep', 'repeat', 'replace-[#007AFF]',
  'replace', 'replacement', 'report', 'repository', 'request', 'required', 'requires',
  'reset', 'resize', 'resolution', 'resource', 'respect', 'res', 'response', 'rest',
  'restart', 'result', 'resume', 'retain', 'retry', 'return', 'revert', 'review',
  'rich', 'right', 'ring', 'rise', 'risk', 'road', 'role', 'roll', 'room', 'root',
  'rounded', 'row', 'rows', 'rule', 'rules', 'run', 'runner', 'running', 'runtime',
  'safe', 'said', 'same', 'sample', 'save', 'saved', 'saw', 'say', 'says', 'scale',
  'scan', 'scanner', 'scanning', 'scenario', 'scene', 'schedule', 'schema', 'scope',
  'score', 'screen', 'script', 'scripts', 'scroll', 'sdk', 'search', 'seat', 'second',
  'secret', 'section', 'secure', 'security', 'see', 'seek', 'select', 'selected',
  'selection', 'selector', 'self', 'send', 'sender', 'sense', 'sentence', 'sepia',
  'september', 'sequence', 'seq', 'server', 'service', 'session', 'set', 'setting',
  'settings', 'setup', 'several', 'shadcn', 'shadow', 'shape', 'share', 'shared',
  'she', 'sheet', 'shelf', 'shield', 'shift', 'ship', 'shot', 'should', 'show',
  'showing', 'side', 'sign', 'signal', 'signature', 'sign', 'silence', 'similar',
  'simple', 'simply', 'since', 'single', 'sink', 'site', 'sit', 'situation', 'size',
  'sizing', 'skill', 'skills', 'skin', 'skip', 'skype', 'sleep', 'slice', 'slide',
  'slides', 'slow', 'slug', 'small', 'smaller', 'smart', 'smooth', 'so', 'social',
  'soft', 'software', 'sole', 'solution', 'some', 'someone', 'something', 'sometimes',
  'son', 'song', 'soon', 'sort', 'sorted', 'sorting', 'sound', 'source', 'space',
  'spacious', 'span', 'spans', 'speak', 'special', 'specific', 'specify', 'specified',
  'spectacular', 'speed', 'spell', 'spelling', 'spellcheck', 'spellchecker', 'spend',
  'split', 'spot', 'spring', 'stack', 'stage', 'standard', 'start', 'started',
  'starter', 'starting', 'state', 'statement', 'stats', 'stat', 'status', 'stay',
  'step', 'steps', 'stick', 'sticky', 'stiff', 'still', 'stop', 'stopped', 'storage',
  'store', 'story', 'strategy', 'stream', 'street', 'strict', 'strictly', 'string',
  'strip', 'stroke', 'strong', 'struct', 'structure', 'styled', 'style', 'styles',
  'styling', 'stylus', 'sub', 'subject', 'submitted', 'subset', 'subtle', 'success',
  'successful', 'successfully', 'such', 'suggest', 'suggestion', 'suggestions', 'sum',
  'summary', 'sun', 'super', 'support', 'supports', 'supported', 'sure', 'surface',
  'swap', 'switch', 'symbol', 'syntax', 'system', 'tab', 'table', 'tables', 'tag',
  'tags', 'tail', 'tailwind', 'take', 'talk', 'target', 'task', 'tasks', 'team',
  'tech', 'tell', 'template', 'temporary', 'temp', 'term', 'terminal', 'terms',
  'test', 'tested', 'text', 'textarea', 'than', 'thank', 'thanks', 'that', 'the',
  'their', 'them', 'theme', 'themes', 'then', 'there', 'these', 'they', 'thick',
  'thin', 'thing', 'things', 'think', 'third', 'this', 'those', 'though', 'thought',
  'thousand', 'three', 'through', 'throw', 'thumb', 'tile', 'time', 'timeout', 'timer',
  'timers', 'times', 'time', 'timestamp', 'title', 'titled', 'to', 'today', 'together',
  'toggle', 'token', 'tokens', 'too', 'tool', 'toolbar', 'tools', 'tooltip', 'top',
  'topic', 'total', 'touch', 'tour', 'toward', 'towards', 'track', 'tracking',
  'trade', 'train', 'transfer', 'transform', 'transformation', 'transient', 'transition',
  'traversal', 'tree', 'trend', 'trial', 'trigger', 'triggered', 'trig', 'trim', 'trip',
  'trouble', 'true', 'trunc', 'truncate', 'trusted', 'truth', 'try', 'tune', 'turn',
  'turned', 'tut', 'tv', 'twilight', 'two', 'type', 'types', 'typescript', 'typo',
  'typos', 'typographic', 'typography', 'ui', 'unable', 'unauthorized', 'unclear',
  'under', 'underline', 'understand', 'unit', 'universal', 'universe', 'unknown',
  'unless', 'until', 'unsupported', 'unusual', 'up', 'update', 'updated', 'updates',
  'updating', 'upgrade', 'upload', 'uploaded', 'uploader', 'upon', 'upper', 'uri',
  'url', 'urls', 'us', 'usage', 'use', 'used', 'useful', 'user', 'users', 'uses',
  'using', 'usr', 'util', 'utility', 'utilities', 'valid', 'validate', 'validation',
  'val', 'validity', 'valuable', 'value', 'values', 'variable', 'variables', 'var',
  'vector', 'vendor', 'verb', 'verbose', 'verified', 'verify', 'version', 'vertical',
  'via', 'video', 'view', 'viewer', 'viewport', 'views', 'visible', 'visit', 'visual',
  'voice', 'volume', 'vote', 'wa', 'wait', 'waiting', 'walk', 'wall', 'want', 'warn',
  'warning', 'was', 'watch', 'water', 'wave', 'way', 'ways', 'we', 'web', 'web',
  'webhook', 'website', 'week', 'weight', 'welcome', 'well', 'went', 'were', 'what',
  'whatever', 'when', 'where', 'whether', 'which', 'while', 'white', 'white', 'who',
  'whole', 'whom', 'whose', 'why', 'wide', 'widget', 'width', 'wiki', 'win', 'window',
  'windows', 'winner', 'wire', 'wise', 'wish', 'with', 'within', 'without', 'woman',
  'word', 'words', 'wordcount', 'work', 'worker', 'working', 'works', 'workspace',
  'world', 'world', 'worse', 'worst', 'worth', 'would', 'wrap', 'wrapped', 'wrapper',
  'write', 'writer', 'writing', 'wrong', 'written', 'ws', 'xml', 'y', 'yard', 'yeah',
  'year', 'yellow', 'yes', 'yesterday', 'yet', 'you', 'young', 'your', 'yours',
  'yourself', 'zip', 'zone', 'zoom'
]);

export interface TypoItem {
  id: string;
  word: string;
  lineIndex: number;
  wordIndex: number;
  startPos: number;
  endPos: number;
  suggestions: string[];
}

// Calculate Levenshtein Distance for spell suggestions
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Generate candidate spelling suggestions for a misspelled word
 */
export function getSpellingSuggestions(
  word: string,
  userDictionary: Set<string>,
  maxSuggestions = 5
): string[] {
  const cleanWord = word.toLowerCase();
  const dict = new Set([...BASE_DICTIONARY, ...userDictionary]);

  const candidates: { word: string; dist: number }[] = [];

  dict.forEach((dictWord) => {
    // Only check words with reasonable length similarity
    if (Math.abs(dictWord.length - cleanWord.length) <= 3) {
      const dist = levenshteinDistance(cleanWord, dictWord);
      if (dist <= 2 && dist > 0) {
        candidates.push({ word: dictWord, dist });
      }
    }
  });

  // Sort by distance and length difference
  candidates.sort((a, b) => a.dist - b.dist);

  // Return formatted suggestions matching original capitalization pattern
  const isFirstUpper = word.length > 0 && word[0] === word[0].toUpperCase();
  const isAllUpper = word === word.toUpperCase() && word.length > 1;

  return candidates.slice(0, maxSuggestions).map((c) => {
    if (isAllUpper) return c.word.toUpperCase();
    if (isFirstUpper) return c.word.charAt(0).toUpperCase() + c.word.slice(1);
    return c.word;
  });
}

/**
 * Scans markdown text and extracts potential typos
 */
export function detectTyposInMarkdown(
  text: string,
  userDictionary: Set<string> = new Set()
): TypoItem[] {
  if (!text || text.trim().length === 0) return [];

  const combinedDict = new Set([
    ...Array.from(BASE_DICTIONARY),
    ...Array.from(userDictionary).map((w) => w.toLowerCase()),
  ]);

  const lines = text.split('\n');
  const typos: TypoItem[] = [];

  let inCodeBlock = false;
  let currentOffset = 0;

  lines.forEach((line, lineIdx) => {
    // Check code blocks
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      currentOffset += line.length + 1;
      return;
    }

    if (inCodeBlock) {
      currentOffset += line.length + 1;
      return;
    }

    // Skip markdown image tags ![alt](url) or URLs
    let sanitizedLine = line
      .replace(/https?:\/\/[^\s]+/gi, ' ') // Strip URLs
      .replace(/!\[.*?\]\(.*?\)/gi, ' ')   // Strip markdown images
      .replace(/\[.*?\]\(.*?\)/gi, ' ')    // Strip markdown links
      .replace(/`[^`]+`/g, ' ');           // Strip inline code backticks

    // Regex to capture individual words (alphanumeric, at least 3 chars long, not numbers)
    const wordRegex = /\b[A-Za-z']{3,25}\b/g;
    let match: RegExpExecArray | null;

    while ((match = wordRegex.exec(sanitizedLine)) !== null) {
      const rawWord = match[0];
      const lowerWord = rawWord.toLowerCase();
      const startPos = currentOffset + match.index;
      const endPos = startPos + rawWord.length;

      // Ignore words with numbers, possessives stripping, or in dict
      const cleanWord = lowerWord.replace(/'s$/, '');

      if (!combinedDict.has(cleanWord) && !combinedDict.has(lowerWord)) {
        // Generate smart suggestions
        const suggestions = getSpellingSuggestions(rawWord, userDictionary);

        typos.push({
          id: `typo-${lineIdx}-${match.index}-${rawWord}`,
          word: rawWord,
          lineIndex: lineIdx,
          wordIndex: match.index,
          startPos,
          endPos,
          suggestions,
        });
      }
    }

    currentOffset += line.length + 1;
  });

  return typos;
}
