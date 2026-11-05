CREATE TABLE IF NOT EXISTS models (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  model_type TEXT NOT NULL DEFAULT 'unknown',
  modalities TEXT[] NOT NULL DEFAULT '{}',
  context_length INTEGER,
  downloads BIGINT,
  likes BIGINT,
  license TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  homepage TEXT,
  inference_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS models_source_idx ON models(source);
CREATE INDEX IF NOT EXISTS models_name_search_idx ON models USING GIN (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS models_downloads_idx ON models(downloads DESC NULLS LAST);
