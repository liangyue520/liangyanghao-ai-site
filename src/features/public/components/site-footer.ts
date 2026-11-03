export interface SiteStats {
  todayVisitors: number;
  todayPageviews: number;
  totalVisitors: number;
  totalPageviews: number;
}

export function readSiteStats(value: unknown): SiteStats | null {
  if (!value || typeof value !== 'object') return null;
  const stats = value as Record<string, unknown>;
  const keys = ['todayVisitors', 'todayPageviews', 'totalVisitors', 'totalPageviews'] as const;
  if (!keys.every(key => typeof stats[key] === 'number' && Number.isSafeInteger(stats[key]) && (stats[key] as number) >= 0)) return null;
  return Object.fromEntries(keys.map(key => [key, stats[key]])) as unknown as SiteStats;
}

export function formatUptime(start: string | undefined, now: number): string | null {
  if (!start) return null;
  // A date without a time is understood as midnight in the site's local timezone.
  const parsed = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(start) ? `${start}T00:00:00+08:00` : start);
  if (!Number.isFinite(parsed) || parsed > now) return null;
  const seconds = Math.floor((now - parsed) / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  return `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds % 60} 秒`;
}
