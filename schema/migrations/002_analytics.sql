CREATE TABLE analytics_sessions(
 id TEXT PRIMARY KEY,
 visitor_hash TEXT NOT NULL UNIQUE,
 browser TEXT,
 os TEXT,
 device TEXT,
 language TEXT,
 screen TEXT,
 created_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL
);
CREATE INDEX analytics_sessions_last_seen ON analytics_sessions(last_seen_at);

CREATE TABLE analytics_visits(
 id TEXT PRIMARY KEY,
 session_id TEXT NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
 started_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 pageviews INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX analytics_visits_session_time ON analytics_visits(session_id,last_seen_at);
CREATE INDEX analytics_visits_started ON analytics_visits(started_at);

CREATE TABLE analytics_events(
 id TEXT PRIMARY KEY,
 session_id TEXT NOT NULL REFERENCES analytics_sessions(id) ON DELETE CASCADE,
 visit_id TEXT NOT NULL REFERENCES analytics_visits(id) ON DELETE CASCADE,
 event_name TEXT NOT NULL CHECK(event_name='pageview'),
 path TEXT NOT NULL,
 title TEXT,
 referrer_domain TEXT,
 created_at TEXT NOT NULL
);
CREATE INDEX analytics_events_created ON analytics_events(created_at);
CREATE INDEX analytics_events_path ON analytics_events(path,created_at);
CREATE INDEX analytics_events_referrer ON analytics_events(referrer_domain,created_at);
