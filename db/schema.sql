CREATE TABLE IF NOT EXISTS members (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('Adulto', 'Jovem', 'Convidado')),
  region VARCHAR(120),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_kind ON members (kind);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  member_id INTEGER NOT NULL,
  attendance_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uniq_attendance_member_date UNIQUE (member_id, attendance_date),
  CONSTRAINT fk_attendance_member
    FOREIGN KEY (member_id)
    REFERENCES members (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance (attendance_date);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_members_updated_at ON members;

CREATE TRIGGER trigger_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
