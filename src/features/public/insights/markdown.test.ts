import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarkdown, parseInlineMarkdown, safeMarkdownHref } from './markdown';

test('Chinese headings, paragraphs and raw HTML remain plain data', () => {
  assert.deepEqual(parseMarkdown('## 数据真的保存了吗？\n\n普通中文\n下一行\n\n<script>alert(1)</script>'), [
    { kind: 'heading', level: 2, text: '数据真的保存了吗？' },
    { kind: 'paragraph', text: '普通中文\n下一行' },
    { kind: 'paragraph', text: '<script>alert(1)</script>' },
  ]);
});
test('fences preserve commands, blank lines, Markdown and literal HTML', () => {
  const body = 'rm -rf example\n\n## 不是标题\n<script>x</script>';
  assert.deepEqual(parseMarkdown('````sh\n' + body + '\n```\n````'), [{ kind: 'code', language: 'sh', text: body + '\n```' }]);
  assert.deepEqual(parseMarkdown('~~~text\n> 原样保留\n~~~'), [{ kind: 'code', language: 'text', text: '> 原样保留' }]);
  assert.deepEqual(parseMarkdown('```\n未闭合'), [{ kind: 'code', language: '', text: '未闭合' }]);
});
test('quotes, ordered lists, nested lists and separators retain their content', () => {
  assert.deepEqual(parseMarkdown('> 引用\n> 第二行\n\n3. 上传\n4. 提问\n\n- 第一项\n  - 子项\n- 第二项\n\n---'), [
    { kind: 'quote', text: '引用\n第二行' },
    { kind: 'list', ordered: true, start: 3, items: ['上传', '提问'] },
    { kind: 'list', ordered: false, start: 1, items: ['第一项\n- 子项', '第二项'] },
    { kind: 'rule' },
  ]);
});
test('tables keep every row and escaped pipes', () => {
  assert.deepEqual(parseMarkdown('| 环节 | 结果 |\n| --- | :---: |\n| 上传 | 成功 |\n| 检索 | A\\|B |'), [
    { kind: 'table', header: ['环节', '结果'], rows: [['上传', '成功'], ['检索', 'A|B']] },
  ]);
});
test('inline formatting remains compatible and link labels remain literal text', () => {
  assert.deepEqual(parseInlineMarkdown('**重点** `代码` *强调* [<img onerror=x>](https://example.com/a_(b))'), [
    { kind: 'strong', text: '重点' }, { kind: 'text', text: ' ' }, { kind: 'code', text: '代码' },
    { kind: 'text', text: ' ' }, { kind: 'em', text: '强调' }, { kind: 'text', text: ' ' },
    { kind: 'link', text: '<img onerror=x>', href: 'https://example.com/a_(b)' },
  ]);
});
test('dangerous, relative and obfuscated URLs never produce links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', '//evil.test', '/path', 'https:\\evil.test', 'https://examp\nle.com', 'http://']) {
    assert.equal(safeMarkdownHref(url), undefined, url);
    assert.ok(parseInlineMarkdown(`[标签](${url})`).every(part => part.kind !== 'link'), url);
  }
  assert.equal(safeMarkdownHref('https://example.com'), 'https://example.com');
  assert.equal(safeMarkdownHref('http://example.com'), 'http://example.com');
});
