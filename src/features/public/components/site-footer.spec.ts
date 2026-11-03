import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatUptime, readSiteStats } from './site-footer';

test('uptime uses the supplied date in Beijing time and handles invalid or future dates', () => {
  const now = Date.parse('2026-11-03T09:02:03+08:00');
  assert.equal(formatUptime('2026-11-02', now), '1 天 9 小时 2 分 3 秒');
  assert.equal(formatUptime(undefined, now), null);
  assert.equal(formatUptime('invalid', now), null);
  assert.equal(formatUptime('2026-11-04', now), null);
});

test('statistics reject missing, negative and noninteger values instead of inventing counts', () => {
  const stats = { todayVisitors: 1, todayPageviews: 2, totalVisitors: 3, totalPageviews: 4 };
  assert.deepEqual(readSiteStats(stats), stats);
  assert.equal(readSiteStats({ ...stats, todayVisitors: -1 }), null);
  assert.equal(readSiteStats({ ...stats, totalPageviews: 1.5 }), null);
  assert.equal(readSiteStats({ todayVisitors: 1 }), null);
});
