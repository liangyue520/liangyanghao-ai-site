import type { Router } from 'vue-router';

export type AnalyticsPayload = {
  type: 'pageview';
  path: string;
  title: string;
  referrer: string;
  screen: string;
  language: string;
};

export type AnalyticsTrackerOptions = {
  endpoint?: string;
  fetcher?: typeof fetch;
  getWindow?: () => Window | undefined;
};

const DEFAULT_ENDPOINT = '/api/v1/analytics/collect';
const MAX_PATH_LENGTH = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_REFERRER_LENGTH = 500;
const MAX_LANGUAGE_LENGTH = 80;
const MAX_SCREEN_LENGTH = 32;

type DntNavigator = Navigator & { msDoNotTrack?: string | number | null };
type DntWindow = Window & { doNotTrack?: string | number | null; navigator: DntNavigator };

function truncate(value: string, max: number): string {
  return Array.from(value).slice(0, max).join('');
}

export function hasDoNotTrack(win: Window = window): boolean {
  const dntWindow = win as DntWindow;
  const value = dntWindow.doNotTrack || dntWindow.navigator.doNotTrack || dntWindow.navigator.msDoNotTrack;
  return value === 1 || value === '1' || value === 'yes';
}

export function shouldTrackPath(path: string): boolean {
  return !!path && !path.startsWith('/admin');
}

export function readAnalyticsPayload(win: Window = window): AnalyticsPayload {
  const { document, location, navigator, screen } = win;
  const path = `${location.pathname}${location.search}`;
  const referrer = normalizeReferrer(document.referrer, location.origin);
  return {
    type: 'pageview',
    path: truncate(path || '/', MAX_PATH_LENGTH),
    title: truncate(document.title || '', MAX_TITLE_LENGTH),
    referrer: truncate(referrer, MAX_REFERRER_LENGTH),
    screen: truncate(`${screen.width}x${screen.height}`, MAX_SCREEN_LENGTH),
    language: truncate(navigator.language || '', MAX_LANGUAGE_LENGTH)
  };
}

export function normalizeReferrer(referrer: string, currentOrigin: string): string {
  if (!referrer) return '';
  try {
    const url = new URL(referrer);
    if (url.origin === currentOrigin) return `${url.pathname}${url.search}`;
    return url.origin;
  } catch {
    return '';
  }
}

export async function sendPageview(options: AnalyticsTrackerOptions = {}): Promise<boolean> {
  const win = options.getWindow?.() ?? (typeof window === 'undefined' ? undefined : window);
  if (!win || hasDoNotTrack(win)) return false;
  const payload = readAnalyticsPayload(win);
  if (!shouldTrackPath(payload.path)) return false;
  const fetcher = options.fetcher ?? win.fetch?.bind(win) ?? globalThis.fetch;
  if (!fetcher) return false;
  try {
    const response = await fetcher(options.endpoint ?? DEFAULT_ENDPOINT, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function installAnalyticsTracker(router: Router, options: AnalyticsTrackerOptions = {}): void {
  const track = () => {
    setTimeout(() => void sendPageview(options).then(ok => { if (ok && typeof window !== 'undefined') window.dispatchEvent(new Event('site-analytics-updated')); }), 0);
  };
  void router.isReady().then(track);
  router.afterEach((to, from) => {
    if (to.fullPath !== from.fullPath) track();
  });
}
