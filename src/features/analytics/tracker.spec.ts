import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Router } from 'vue-router';
import { installAnalyticsTracker, normalizeReferrer, sendPageview } from './tracker';

function mockWindow(path = '/', options: { dnt?: string; referrer?: string; title?: string } = {}): Window {
  const url = new URL(path, 'https://example.test');
  return {
    doNotTrack: options.dnt,
    document: { title: options.title ?? '公开页面', referrer: options.referrer ?? '' },
    location: { pathname: url.pathname, search: url.search, origin: url.origin },
    navigator: { language: 'zh-CN', doNotTrack: options.dnt },
    screen: { width: 390, height: 844 },
    fetch: undefined
  } as unknown as Window;
}

test('analytics payload posts only the public whitelist fields', async () => {
  let body: unknown;
  const ok = await sendPageview({
    getWindow: () => mockWindow('/story?from=home', { referrer: 'https://example.test/diary?page=2' }),
    fetcher: async (_input, init) => {
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }
  });
  assert.equal(ok, true);
  assert.deepEqual(Object.keys(body as Record<string, unknown>).sort(), ['language', 'path', 'referrer', 'screen', 'title', 'type']);
  assert.deepEqual(body, { type: 'pageview', path: '/story?from=home', title: '公开页面', referrer: '/diary?page=2', screen: '390x844', language: 'zh-CN' });
});

test('analytics respects do not track and skips admin routes', async () => {
  let calls = 0;
  const fetcher = async () => {
    calls++;
    return new Response(null, { status: 204 });
  };
  assert.equal(await sendPageview({ getWindow: () => mockWindow('/story', { dnt: '1' }), fetcher }), false);
  assert.equal(await sendPageview({ getWindow: () => mockWindow('/admin/contents'), fetcher }), false);
  assert.equal(calls, 0);
});

test('analytics route hook sends initial and changed public pageviews only', async () => {
  let afterEach: Parameters<Router['afterEach']>[0] | undefined;
  let currentPath = '/';
  const seen: string[] = [];
  const router = {
    isReady: () => Promise.resolve(),
    afterEach: (callback: Parameters<Router['afterEach']>[0]) => {
      afterEach = callback;
      return () => {};
    }
  } as unknown as Router;
  installAnalyticsTracker(router, {
    getWindow: () => mockWindow(currentPath),
    fetcher: async (_input, init) => {
      seen.push(JSON.parse(String(init?.body)).path);
      return new Response(null, { status: 204 });
    }
  });
  await new Promise(resolve => setTimeout(resolve, 10));
  currentPath = '/resources';
  afterEach?.({ fullPath: '/resources' } as never, { fullPath: '/' } as never, undefined as never);
  await new Promise(resolve => setTimeout(resolve, 10));
  currentPath = '/admin/contents';
  afterEach?.({ fullPath: '/admin/contents' } as never, { fullPath: '/resources' } as never, undefined as never);
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.deepEqual(seen, ['/', '/resources']);
});

test('analytics normalizes referrer and treats network failure as a skipped send', async () => {
  assert.equal(normalizeReferrer('https://example.test/story?x=1', 'https://example.test'), '/story?x=1');
  assert.equal(normalizeReferrer('https://referrer.test/path?q=1', 'https://example.test'), 'https://referrer.test');
  assert.equal(normalizeReferrer('not a url', 'https://example.test'), '');
  assert.equal(await sendPageview({ getWindow: () => mockWindow('/story'), fetcher: async () => { throw new Error('offline'); } }), false);
});
