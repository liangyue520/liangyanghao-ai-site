import { onScopeDispose, ref, shallowRef, watch, type WatchSource } from 'vue';
import { ApiError, request } from '../../lib/request';
import { validExternalUrl } from '../../../shared/schemas';
import type { DateInfo, DiaryFacets, Kind, ListQuery, Page, PublicDetail, PublicMedia, PublicSummary } from '../../../shared/contracts';

// Coordinates only: no public or private content is cached across page visits.
export const readingPositions = new Map<string, number>();
export const toolboxCategories = ['写作工具','开发协作','知识整理','网站运营','通用提示词'] as const;
export type ToolboxCategory = typeof toolboxCategories[number];

// All reads use the shared public API. There is deliberately no mock fallback.
export function listContents(query: Pick<ListQuery, 'kind'|'year'|'category'|'featured'> & Partial<Pick<ListQuery, 'page'|'pageSize'>>, signal?: AbortSignal) {
  const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 12) });
  for (const key of ['kind', 'year', 'category', 'featured'] as const) {
    const value = query[key];
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return request<Page<PublicSummary>>(`/api/v1/public/contents?${params}`, { signal, cache: 'no-store' });
}
export function getContent(id: string, signal?: AbortSignal) {
  return request<PublicDetail>(`/api/v1/public/contents/${encodeURIComponent(id)}`, { signal, cache: 'no-store' });
}
export function getDiaryFacets(signal?: AbortSignal) {
  return request<DiaryFacets>('/api/v1/public/diary-facets', { signal, cache: 'no-store' });
}
export async function getKindContent(id: string, kind: Kind, signal?: AbortSignal) {
  const content = await getContent(id, signal);
  if (content.kind !== kind) throw new ApiError(404, 'NOT_FOUND', '');
  return content;
}
export function isToolboxCategory(value: unknown): value is ToolboxCategory {
  return typeof value === 'string' && (toolboxCategories as readonly string[]).includes(value);
}
export function toolboxPath(item: Pick<PublicSummary, 'id'>) {
  return `/toolbox/${encodeURIComponent(item.id)}`;
}
export async function listToolboxContents(query: {page?:number;pageSize?:number;category?:string;featured?:boolean}, signal?: AbortSignal): Promise<Page<PublicSummary>> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 12;
  if (query.category) {
    if (!isToolboxCategory(query.category)) return {items:[],page,pageSize,total:0};
    return listContents({kind:'resource',category:query.category,featured:query.featured,page,pageSize}, signal);
  }
  const all: PublicSummary[] = [];
  let sourcePage = 1;
  let total = 0;
  do {
    const result = await listContents({kind:'resource',featured:query.featured,page:sourcePage,pageSize:50}, signal);
    total = result.total;
    all.push(...result.items.filter(item => isToolboxCategory(item.category)));
    if (sourcePage * result.pageSize >= result.total || !result.items.length) break;
    sourcePage += 1;
  } while (!signal?.aborted);
  const start = (page - 1) * pageSize;
  return {items:all.slice(start,start + pageSize),page,pageSize,total:all.length};
}
export async function getToolboxContent(id: string, signal?: AbortSignal) {
  const content = await getKindContent(id, 'resource', signal);
  if (!isToolboxCategory(content.category)) throw new ApiError(404, 'NOT_FOUND', '');
  return content;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if ([401, 403, 404, 410].includes(error.status)) return '这篇内容暂时无法查看。';
    if (error.status === 503) return '内容服务尚未就绪或暂时不可用，请稍后重试。';
    if (error.status === 400) return '当前浏览条件无法使用，请返回列表重新选择。';
  }
  return '内容暂时加载不出来，请检查网络后重试。';
}

/** Discard old responses when a route/filter changes; never retain stale body/media. */
export function usePublicLoad<T>(source: WatchSource, loader: (signal: AbortSignal) => Promise<T>) {
  const data = shallowRef<T>();
  const loading = ref(true);
  const error = shallowRef<unknown>();
  let sequence = 0;
  let controller: AbortController | undefined;
  let disposed = false;
  async function reload() {
    const current = ++sequence;
    controller?.abort();
    controller = new AbortController();
    const active = controller;
    data.value = undefined;
    error.value = undefined;
    loading.value = true;
    const timeout = setTimeout(() => active.abort(), 20000);
    try {
      const value = await loader(active.signal);
      if (!disposed && current === sequence) data.value = value;
    } catch (reason) {
      if (!disposed && current === sequence) error.value = reason;
    } finally {
      clearTimeout(timeout);
      if (!disposed && current === sequence) loading.value = false;
    }
  }
  watch(source, () => { void reload(); }, { immediate: true });
  onScopeDispose(() => { disposed = true; ++sequence; controller?.abort(); });
  return { data, loading, error, reload };
}

export function formatDate(date: DateInfo): string {
  if (date.precision === 'unknown') return '日期待确认';
  const prefix = date.approximate ? '约 ' : '';
  if (date.precision === 'range') return `${prefix}${date.fromYear}—${date.toYear} 年（年份不确定）`;
  const parts = (date.value ?? '').split('-');
  return prefix + parts.map((part, index) => `${part}${['年', '月', '日'][index]}`).join('');
}
export function yearLabel(key: string) {
  return key === 'unknown' ? '日期未知' : key === 'uncertain' ? '年份不确定' : `${key}年`;
}
export function positivePage(value: unknown) {
  const number = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : 1;
  return Number.isSafeInteger(number) && number > 0 ? number : 1;
}
export function contentPath(item: Pick<PublicSummary, 'kind'|'id'>) {
  const base = { diary: '/diary', video: '/videos', resource: '/resources', story: '/novel', profile: '/story', game: '/games' }[item.kind];
  return ['diary', 'video', 'resource', 'story'].includes(item.kind) ? `${base}/${encodeURIComponent(item.id)}` : base;
}
export function mediaUrl(media: PublicMedia | null | undefined, variant: 'display'|'thumbnail'|'playback'|'download') {
  const url = media?.urls[variant];
  // Accept only the contract's same-origin authorized variant, never original or a remote URL.
  return url && /^\/api\/v1\/media\/[0-9a-f-]{36}\/(display|thumbnail|playback|download)$/i.test(url)
    && url === `/api/v1/media/${media!.assetId}/${variant}` ? url : undefined;
}
export function externalUrl(value: string | null | undefined) {
  if (!value || !validExternalUrl(value)) return undefined;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function diaryPages(media: PublicMedia[]) {
  return media.filter(item => item.role === 'diaryPage').slice().sort((a, b) => a.position - b.position);
}
export function resourceDownload(content: PublicDetail) {
  const resource = content.resource;
  const files = content.media.filter(item => item.role === 'resourceFile');
  if (content.kind !== 'resource' || resource?.mode !== 'download' || resource.redistribution !== 'allowed'
    || !resource.permissionNote?.trim() || !resource.author?.trim() || !externalUrl(resource.sourceUrl)
    || !resource.usageInstructions.trim() || files.length !== 1) return undefined;
  return mediaUrl(files[0], 'download');
}
export function hasBlockedCopyText(value: string) {
  return /(?:storageKey|\/original\b|[A-Z]:[\\/][^\s]+|F:\/[^\s]+|\/home\/[^\s]+|(?:token|cookie|csrf|secret|api[_-]?key)\s*[:=])/i.test(value);
}
export function toolboxCopyText(content: PublicDetail) {
  if (content.kind !== 'resource' || !isToolboxCategory(content.category)) return undefined;
  const body = content.bodyText?.trim();
  if (!body || hasBlockedCopyText(body)) return undefined;
  return `${content.title}\n\n${body}`;
}
