-- Local Crisis Radar — core schema (Phase 1: CRUD only, no PostGIS/AI columns yet)

CREATE TYPE user_role AS ENUM ('citizen', 'authority', 'admin');
CREATE TYPE crisis_type AS ENUM ('flood', 'roadblock', 'power', 'fire', 'medical', 'infrastructure');
CREATE TYPE severity_level AS ENUM ('critical', 'high', 'moderate', 'low');
CREATE TYPE report_status AS ENUM ('reported', 'verified', 'progress', 'resolved');

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'citizen',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id              SERIAL PRIMARY KEY,
  type            crisis_type NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  latitude        DOUBLE PRECISION NOT NULL,
  longitude       DOUBLE PRECISION NOT NULL,
  area            VARCHAR(160),
  severity        severity_level NOT NULL DEFAULT 'moderate',
  status          report_status NOT NULL DEFAULT 'reported',
  evidence_url    TEXT,
  reporter_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verified_by_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_status   ON reports(status);
CREATE INDEX idx_reports_type     ON reports(type);
CREATE INDEX idx_reports_severity ON reports(severity);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- Keep updated_at fresh on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON reports
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
