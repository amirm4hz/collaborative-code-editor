const pool = require('./pool');

async function migrate() {
  console.log('🔧 Running migration...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id           VARCHAR(36) PRIMARY KEY,
        room_id      VARCHAR(36) NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        name         VARCHAR(100) NOT NULL,
        language     VARCHAR(20) DEFAULT 'javascript',
        code         TEXT DEFAULT '',
        created_at   TIMESTAMP DEFAULT NOW(),
        updated_at   TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_files_room_id ON files(room_id);
    `);

    console.log('✅ Migration complete — files table created');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

migrate();