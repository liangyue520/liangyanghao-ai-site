/** Allow same-host analytics on the configured origin and its HTTPS/www deployment variants. */
export function isAnalyticsOriginAllowed(origin: string | undefined, configured: string): boolean {
  if (!origin) return false;
  try {
    const actual = new URL(origin), expected = new URL(configured);
    if (actual.origin !== origin || !['http:', 'https:'].includes(actual.protocol)) return false;
    const sameHost = actual.hostname.replace(/^www\./, '') === expected.hostname.replace(/^www\./, '');
    const samePort = actual.port === expected.port;
    const schemeAllowed = actual.protocol === expected.protocol || (expected.protocol === 'http:' && actual.protocol === 'https:');
    return sameHost && samePort && schemeAllowed;
  } catch { return false; }
}
