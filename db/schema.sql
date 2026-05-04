CREATE TABLE IF NOT EXISTS members (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NULL,
  kind ENUM('Adulto', 'Jovem', 'Convidado') NOT NULL,
  region VARCHAR(120) NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_members_kind (kind)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INT NOT NULL AUTO_INCREMENT,
  member_id INT NOT NULL,
  attendance_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_attendance_member_date (member_id, attendance_date),
  INDEX idx_attendance_date (attendance_date),
  CONSTRAINT fk_attendance_member
    FOREIGN KEY (member_id)
    REFERENCES members (id)
    ON DELETE CASCADE
);
