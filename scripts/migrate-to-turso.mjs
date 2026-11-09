// Copies your local data/chores.db into a Turso database.
// Usage: TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-turso.mjs [path/to/chores.db]
import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';
import { SCHEMA } from '../lib/app.js';

const { TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: authToken } = process.env;
if (!url || !authToken) { console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN first.'); process.exit(1); }
const src = new DatabaseSync(process.argv[2] || 'data/chores.db', { readOnly: true });
const dst = createClient({ url, authToken });
await dst.executeMultiple(SCHEMA);
try { await dst.execute('ALTER TABLE chores ADD COLUMN nth INTEGER'); } catch { /* exists */ }

const existing = (await dst.execute('SELECT COUNT(*) n FROM chores')).rows[0][0];
if (Number(existing) > 0) { console.error(`The target already has ${existing} chores. Refusing to overwrite. Use an empty database.`); process.exit(1); }

for (const t of ['chores', 'steps', 'step_checks', 'completions', 'projects', 'project_tasks', 'settings']) {
  const rows = src.prepare(`SELECT * FROM ${t}`).all();
  for (let i = 0; i < rows.length; i += 50) {
    await dst.batch(rows.slice(i, i + 50).map((r) => {
      const cols = Object.keys(r);
      return { sql: `INSERT INTO ${t}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, args: cols.map((c) => r[c]) };
    }), 'write');
  }
  console.log(`${t}: ${rows.length} rows`);
}
console.log('Done.');
