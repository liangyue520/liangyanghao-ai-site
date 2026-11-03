export type InlinePart =
  | { kind: 'text' | 'strong' | 'code' | 'em'; text: string }
  | { kind: 'link'; text: string; href: string };

/** Only explicit web URLs become links. Vue renders all labels as text. */
export function safeMarkdownHref(value: string): string | undefined {
  const href = value.trim();
  if (!/^https?:\/\//i.test(href) || /[\u0000-\u0020\u007f\\]/.test(href)) return undefined;
  try {
    const url = new URL(href);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname ? href : undefined;
  } catch { return undefined; }
}

export function parseInlineMarkdown(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let plain = '';
  const flush = () => { if (plain) parts.push({ kind: 'text', text: plain }); plain = ''; };
  for (let i = 0; i < text.length;) {
    const rest = text.slice(i);
    const code = /^`([^`\n]+)`/.exec(rest);
    const strong = /^\*\*([^*\n]+)\*\*/.exec(rest);
    const em = /^\*([^*\n]+)\*/.exec(rest);
    const match = code ?? strong ?? em;
    if (match) {
      flush(); parts.push({ kind: code ? 'code' : strong ? 'strong' : 'em', text: match[1]! });
      i += match[0].length; continue;
    }
    const label = /^\[([^\]\n]+)\]\(/.exec(rest);
    if (label) {
      let end = i + label[0].length;
      const start = end;
      let depth = 1;
      while (end < text.length && depth && text[end] !== '\n') {
        if (text[end] === '(') depth++;
        if (text[end] === ')') depth--;
        if (depth) end++;
      }
      if (!depth) {
        const href = safeMarkdownHref(text.slice(start, end));
        flush();
        if (href) parts.push({ kind: 'link', text: label[1]!, href });
        else parts.push({ kind: 'text', text: text.slice(i, end + 1) });
        i = end + 1; continue;
      }
    }
    plain += text[i++];
  }
  flush();
  return parts;
}

export type MarkdownBlock =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph' | 'quote'; text: string }
  | { kind: 'code'; text: string; language: string }
  | { kind: 'rule' }
  | { kind: 'list'; ordered: boolean; start: number; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] };

const fence = (line: string) => /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
const listItem = (line: string) => /^( {0,3})([-+*]|\d+[.)])\s+(.*)$/.exec(line);
const rule = (line: string) => /^ {0,3}(?:\*\s*){3,}$|^ {0,3}(?:-\s*){3,}$|^ {0,3}(?:_\s*){3,}$/.test(line);
const heading = (line: string) => /^ {0,3}(#{1,6})\s+(.+?)(?:\s+#+\s*)?$/.exec(line);
const quote = (line: string) => /^ {0,3}> ?/.test(line);
function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
}
function tableAt(lines: string[], i: number): boolean {
  if (!lines[i]?.includes('|') || !lines[i + 1]) return false;
  const cells = tableCells(lines[i + 1]!);
  return cells.length === tableCells(lines[i]!).length && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

/** Parse data only; HTML, commands and code fences are never evaluated. */
export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;
  const startsBlock = (index: number) => {
    const line = lines[index] ?? '';
    return !line.trim() || fence(line) || heading(line) || rule(line) || quote(line) || listItem(line) || tableAt(lines, index);
  };
  while (i < lines.length) {
    const line = lines[i]!;
    if (!line.trim()) { i++; continue; }
    const opening = fence(line);
    if (opening) {
      const mark = opening[1]!;
      const close = new RegExp('^ {0,3}' + (mark[0] === '`' ? '`' : '~') + '{' + mark.length + ',}\\s*$');
      const content: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i]!)) content.push(lines[i++]!);
      if (i < lines.length) i++;
      blocks.push({ kind: 'code', language: opening[2]!.trim(), text: content.join('\n') });
      continue;
    }
    const h = heading(line);
    if (h) { blocks.push({ kind: 'heading', level: h[1]!.length, text: h[2]! }); i++; continue; }
    if (rule(line)) { blocks.push({ kind: 'rule' }); i++; continue; }
    if (quote(line)) {
      const content: string[] = [];
      while (i < lines.length && quote(lines[i]!)) content.push(lines[i++]!.replace(/^ {0,3}> ?/, ''));
      blocks.push({ kind: 'quote', text: content.join('\n') }); continue;
    }
    if (tableAt(lines, i)) {
      const header = tableCells(line); const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i]!.trim() && lines[i]!.includes('|')) rows.push(tableCells(lines[i++]!));
      blocks.push({ kind: 'table', header, rows }); continue;
    }
    const first = listItem(line);
    if (first) {
      const indent = first[1]!.length;
      const ordered = /^\d/.test(first[2]!);
      const start = ordered ? Number.parseInt(first[2]!, 10) : 1;
      const items: string[] = [];
      while (i < lines.length) {
        const item = listItem(lines[i]!);
        if (!item || item[1]!.length !== indent || /^\d/.test(item[2]!) !== ordered || rule(lines[i]!)) break;
        const body = [item[3]!];
        i++;
        while (i < lines.length) {
          if (!lines[i]!.trim()) {
            const next = lines[i + 1];
            if (next !== undefined && (listItem(next)?.[1]?.length === indent || /^ {2,}\S/.test(next))) { body.push(''); i++; continue; }
            break;
          }
          if (!new RegExp('^ {' + (indent + 2) + ',}').test(lines[i]!)) break;
          body.push(lines[i++]!.slice(indent + 2));
        }
        items.push(body.join('\n').replace(/\n+$/, ''));
      }
      blocks.push({ kind: 'list', ordered, start, items }); continue;
    }
    const content = [line]; i++;
    while (i < lines.length && !startsBlock(i)) content.push(lines[i++]!);
    blocks.push({ kind: 'paragraph', text: content.join('\n') });
  }
  return blocks;
}
