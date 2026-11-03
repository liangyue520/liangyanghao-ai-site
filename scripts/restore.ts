import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import yauzl from 'yauzl';
import type { Content, MediaAsset } from '../shared/contracts';
import { CONTRACT_VERSION } from '../shared/contracts';
import { readConfig } from '../server/core/config';
import { createContext } from '../server/core/context';

type ManifestFile = { path: string; byteSize: number; sha256: string };
type ExportManifest = {
  formatVersion: '1';
  contractVersion: string;
  schemaVersion: number;
  exportId: string;
  createdAt: string;
  snapshotAt: string;
  counts: { contents: number; mediaAssets: number; files: number };
  files: ManifestFile[];
};

function usage(): never {
  process.stderr.write([
    '用法:',
    '  npm run restore -- --env test-restore-r01 --archive <export.zip>',
    '',
    '说明:',
    '  仅恢复到 test-* 空隔离环境；不会覆盖 dev/e02/e03/e04/qa。',
    '  先执行 npm run init:local -- --env <test-env> 创建空库与测试身份。',
  ].join('\n') + '\n');
  process.exit(2);
}

function arg(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function safeEntry(name: string) {
  if (!name || name.includes('\\') || path.isAbsolute(name) || name.includes(':')) return false;
  return name.split('/').every(part => part && part !== '.' && part !== '..');
}

function openZip(file: string) {
  return new Promise<yauzl.ZipFile>((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true, validateEntrySizes: true }, (error, zip) => {
      if (error || !zip) reject(error ?? Error('ZIP打开失败'));
      else resolve(zip);
    });
  });
}

async function readEntry(zip: yauzl.ZipFile, entry: yauzl.Entry) {
  return new Promise<Buffer>((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error || !stream) { reject(error ?? Error('ZIP条目读取失败')); return; }
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  });
}

async function extractEntry(zip: yauzl.ZipFile, entry: yauzl.Entry, target: string, expected: ManifestFile) {
  await fsp.mkdir(path.dirname(target), { recursive: true });
  return new Promise<void>((resolve, reject) => {
    zip.openReadStream(entry, (error, stream) => {
      if (error || !stream) { reject(error ?? Error('ZIP条目读取失败')); return; }
      const hash = createHash('sha256');
      let size = 0;
      const out = fs.createWriteStream(target, { flags: 'wx' });
      stream.on('data', chunk => { size += chunk.byteLength; hash.update(chunk); });
      stream.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => {
        const actual = hash.digest('hex');
        if (size !== expected.byteSize || actual !== expected.sha256) reject(Error(`恢复文件校验失败: ${entry.fileName}`));
        else resolve();
      });
      stream.pipe(out);
    });
  });
}

async function collectEntries(archive: string) {
  const zip = await openZip(archive);
  const names = new Set<string>();
  try {
    await new Promise<void>((resolve, reject) => {
      zip.on('entry', entry => {
        if (/\/$/.test(entry.fileName)) { zip.readEntry(); return; }
        if (!safeEntry(entry.fileName) || entry.fileName.startsWith('objects/') || entry.fileName.startsWith('tmp/')) {
          reject(Error(`非法ZIP路径: ${entry.fileName}`));
          return;
        }
        names.add(entry.fileName);
        zip.readEntry();
      });
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.readEntry();
    });
    return names;
  } finally {
    zip.close();
  }
}

async function readJsonEntries(archive: string, required: Set<string>) {
  const zip = await openZip(archive);
  const jsonBuffers = new Map<string, Buffer>();
  const pending = new Set(required);

  try {
    await new Promise<void>((resolve, reject) => {
      const next = () => {
        if (!pending.size) { resolve(); return; }
        zip.readEntry();
      };
      zip.on('entry', entry => {
        if (/\/$/.test(entry.fileName) || !required.has(entry.fileName)) { next(); return; }
        readEntry(zip, entry)
          .then(buffer => {
            jsonBuffers.set(entry.fileName, buffer);
            pending.delete(entry.fileName);
            next();
          })
          .catch(reject);
      });
      zip.on('error', reject);
      zip.on('end', () => {
        if (pending.size) reject(Error(`导出包缺少JSON条目: ${Array.from(pending).join(', ')}`));
        else resolve();
      });
      zip.readEntry();
    });
    return jsonBuffers;
  } finally {
    zip.close();
  }
}

async function extractFiles(archive: string, dataRoot: string, fileMap: Map<string, ManifestFile>) {
  const zip = await openZip(archive);
  const extracted: string[] = [];
  const pending = new Map(fileMap);
  try {
    await new Promise<void>((resolve, reject) => {
      const next = () => {
        if (!pending.size) { resolve(); return; }
        zip.readEntry();
      };
      zip.on('entry', entry => {
        if (/\/$/.test(entry.fileName) || !pending.has(entry.fileName)) { next(); return; }
        const expected = pending.get(entry.fileName)!;
        const target = path.join(dataRoot, entry.fileName);
        extractEntry(zip, entry, target, expected)
          .then(() => {
            extracted.push(entry.fileName);
            pending.delete(entry.fileName);
            next();
          })
          .catch(reject);
      });
      zip.on('error', reject);
      zip.on('end', () => {
        if (pending.size) reject(Error(`ZIP缺少文件: ${Array.from(pending.keys()).join(', ')}`));
        else resolve();
      });
      zip.readEntry();
    });
    return extracted;
  } finally {
    zip.close();
  }
}

async function readArchive(archive: string, dataRoot: string) {
  const entryNames = await collectEntries(archive);

  if (!entryNames.has('manifest.json') || !entryNames.has('contents.json') || !entryNames.has('media.json')) {
    throw Error('导出包缺少 manifest/contents/media');
  }
  const jsonBuffers = await readJsonEntries(archive, new Set(['manifest.json', 'contents.json', 'media.json']));

  const manifest = JSON.parse(jsonBuffers.get('manifest.json')!.toString('utf8')) as ExportManifest;
  if (manifest.formatVersion !== '1') throw Error('不支持的导出格式版本');
  if (manifest.contractVersion !== CONTRACT_VERSION) throw Error(`契约版本不匹配: ${manifest.contractVersion}`);
  if (manifest.schemaVersion !== 1) throw Error(`schema版本不匹配: ${manifest.schemaVersion}`);

  const fileMap = new Map(manifest.files.map(file => [file.path, file]));
  for (const name of ['contents.json', 'media.json']) {
    const expected = fileMap.get(name);
    const buffer = jsonBuffers.get(name)!;
    if (!expected) throw Error(`manifest缺少条目: ${name}`);
    const actualHash = createHash('sha256').update(buffer).digest('hex');
    if (expected.byteSize !== buffer.length || expected.sha256 !== actualHash) throw Error(`JSON条目校验失败: ${name}`);
  }

  const contents = JSON.parse(jsonBuffers.get('contents.json')!.toString('utf8')) as Content[];
  const media = JSON.parse(jsonBuffers.get('media.json')!.toString('utf8')) as MediaAsset[];
  if (contents.length !== manifest.counts.contents || media.length !== manifest.counts.mediaAssets) throw Error('记录数量与manifest不一致');

  const expectedPaths = new Set(['manifest.json', ...manifest.files.map(file => file.path)]);
  for (const name of entryNames) if (!expectedPaths.has(name)) throw Error(`ZIP含manifest外文件: ${name}`);

  const extractMap = new Map<string, ManifestFile>();
  for (const file of manifest.files) {
    if (['manifest.json', 'contents.json', 'media.json'].includes(file.path)) continue;
    if (!file.path.startsWith('files/')) throw Error(`不支持的文件路径: ${file.path}`);
    if (!entryNames.has(file.path)) throw Error(`ZIP缺少文件: ${file.path}`);
    extractMap.set(file.path, file);
  }
  const extracted = await extractFiles(archive, dataRoot, extractMap);

  return { manifest, contents, media, extracted };
}

const archive = arg('--archive');
const env = arg('--env');
if (!archive || !env) usage();
if (!env.startsWith('test-')) throw Error('恢复只允许写入 test-* 隔离环境');

const absoluteArchive = path.resolve(archive);
if (!fs.existsSync(absoluteArchive)) throw Error(`导出包不存在: ${absoluteArchive}`);

const config = readConfig(env);
const ctx = createContext(config);
try {
  const contentCount = ctx.db.get<{ count: number }>('SELECT COUNT(*) AS count FROM contents')?.count ?? 0;
  const mediaCount = ctx.db.get<{ count: number }>('SELECT COUNT(*) AS count FROM media_assets')?.count ?? 0;
  const exportCount = ctx.db.get<{ count: number }>('SELECT COUNT(*) AS count FROM export_jobs')?.count ?? 0;
  if (contentCount || mediaCount || exportCount) throw Error(`目标环境不是空数据集: contents=${contentCount}, media=${mediaCount}, exports=${exportCount}`);
  const filesRoot = path.join(config.dataRoot, 'files');
  if (fs.existsSync(filesRoot) && fs.readdirSync(filesRoot).length) throw Error('目标 files/ 目录非空');

  const restored = await readArchive(absoluteArchive, config.dataRoot);
  ctx.db.transaction(() => {
    for (const content of restored.contents) {
      ctx.db.run(
        'INSERT INTO contents(id,kind,status,visibility,revision,created_at,updated_at,deleted_at,data_json) VALUES(?,?,?,?,?,?,?,?,?)',
        content.id,
        content.kind,
        content.status,
        content.visibility,
        content.revision,
        content.createdAt,
        content.updatedAt,
        content.deletedAt,
        JSON.stringify(content),
      );
    }
    for (const asset of restored.media) {
      ctx.db.run(
        'INSERT INTO media_assets(id,content_id,purpose,state,sha256,created_at,data_json) VALUES(?,?,?,?,?,?,?)',
        asset.id,
        asset.contentId,
        asset.purpose,
        asset.state,
        asset.sha256,
        asset.createdAt,
        JSON.stringify(asset),
      );
    }
  });

  const summary = {
    outcome: 'RESTORED',
    env,
    archive: absoluteArchive,
    dataRoot: config.dataRoot,
    exportId: restored.manifest.exportId,
    snapshotAt: restored.manifest.snapshotAt,
    contents: restored.contents.length,
    mediaAssets: restored.media.length,
    files: restored.extracted.length,
  };
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally {
  ctx.db.close();
}
