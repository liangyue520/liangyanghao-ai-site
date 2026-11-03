CREATE TABLE admins(id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE UNIQUE INDEX single_admin ON admins((1));
CREATE TABLE auth_meta(name TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE sessions(id TEXT PRIMARY KEY, admin_id TEXT NOT NULL REFERENCES admins(id), token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE TABLE login_attempts(id TEXT PRIMARY KEY,bucket TEXT NOT NULL, attempted_at INTEGER NOT NULL);
CREATE INDEX login_attempt_time ON login_attempts(bucket,attempted_at);
CREATE TABLE contents(
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('profile','story','diary','video','resource','game')),
 status TEXT NOT NULL CHECK(status IN ('draft','published','withdrawn')), visibility TEXT NOT NULL CHECK(visibility IN ('private','public')),
 revision INTEGER NOT NULL CHECK(revision>=1), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT,
 data_json TEXT NOT NULL CHECK(json_valid(data_json))
);
CREATE UNIQUE INDEX single_profile ON contents(kind) WHERE kind='profile' AND deleted_at IS NULL;
CREATE INDEX public_contents ON contents(status,visibility,deleted_at);
CREATE TABLE media_assets(id TEXT PRIMARY KEY,content_id TEXT NOT NULL REFERENCES contents(id) ON DELETE RESTRICT,purpose TEXT NOT NULL CHECK(purpose IN ('diaryPage','cover','video','resourceFile')),state TEXT NOT NULL CHECK(state='ready'),sha256 TEXT NOT NULL,created_at TEXT NOT NULL,data_json TEXT NOT NULL CHECK(json_valid(data_json)),UNIQUE(content_id,purpose,sha256));
CREATE TABLE export_jobs(id TEXT PRIMARY KEY,state TEXT NOT NULL CHECK(state IN ('pending','running','ready','failed','expired')),created_at TEXT NOT NULL,expires_at TEXT,data_json TEXT NOT NULL CHECK(json_valid(data_json)));
CREATE UNIQUE INDEX single_active_export ON export_jobs((1)) WHERE state IN ('pending','running');
CREATE TABLE idempotency(admin_id TEXT NOT NULL REFERENCES admins(id),key TEXT NOT NULL,method TEXT NOT NULL,path TEXT NOT NULL,digest TEXT NOT NULL,status INTEGER NOT NULL,response_json TEXT NOT NULL,expires_at INTEGER NOT NULL,PRIMARY KEY(admin_id,key));
