-- Rooms table: stores each collaborative session
CREATE TABLE IF NOT EXISTS rooms (
  id          VARCHAR(36) PRIMARY KEY,      -- UUID, used in the shareable URL
  name        VARCHAR(100) NOT NULL,         -- display name for the room
  language    VARCHAR(20) DEFAULT 'javascript', -- current language selected
  code        TEXT DEFAULT '',               -- the latest snapshot of the code
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Index on created_at so we can efficiently query recent rooms
CREATE INDEX IF NOT EXISTS idx_rooms_created_at ON rooms(created_at DESC);