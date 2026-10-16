/* NEON VENGEANCE — worker: serves the game and a D1-backed high-score API. */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Idempotent schema init, run once per isolate.
let tableReady = null;
function ensureTable(db) {
  if (!tableReady) {
    tableReady = db.batch([
      db.prepare(
        `CREATE TABLE IF NOT EXISTS scores (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           name TEXT NOT NULL,
           score INTEGER NOT NULL,
           created_at TEXT NOT NULL DEFAULT (datetime('now'))
         )`
      ),
      db.prepare('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)'),
    ]);
  }
  return tableReady;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

const MAX_SCORE = 100_000_000; // sanity cap against junk submissions

async function handleScores(request, db) {
  await ensureTable(db);

  const url = new URL(request.url);

  if (request.method === 'GET') {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 100);
    const { results } = await db
      .prepare('SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?')
      .bind(limit)
      .all();
    return json({ scores: results });
  }

  if (request.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const name = typeof body.name === 'string' ? body.name.trim().toUpperCase().slice(0, 10) : '';
  const score = Math.floor(Number(body.score));

  if (name.length < 3) return json({ error: 'name must be 3-10 characters' }, 400);
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'invalid score' }, 400); 
  }

  // Basic anti-spam: same name may hold only their top 3 entries.
  const count = await db
    .prepare(
      `SELECT COUNT(*) AS n FROM scores WHERE name = ?1
       AND score <= ?2`
    )
    .bind(name, score)
    .first();
  if (count && count.n >= 3) {
    const deleted = await db
      .prepare(
        `DELETE FROM scores WHERE id IN (
           SELECT id FROM scores WHERE name = ?1 AND score <= ?2
           ORDER BY created_at ASC LIMIT ?3
         )`
      )
      .bind(name, score, Math.max(1, count.n - 2))
      .run();
    if (!deleted.meta || !deleted.meta.changes) {
      return json({ error: 'too many entries for this name' }, 429);
    }
  }

  await db.prepare('INSERT INTO scores (name, score) VALUES (?1, ?2)').bind(name, score).run();
  const rankRow = await db
    .prepare('SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?1')
    .bind(score)
    .first();

  return json({ ok: true, rank: rankRow ? rankRow.rank : 1 }, 201);
}

// ---------------------------------------------------------------- worker entry
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (url.pathname === '/api/scores') {
      if (!env.DB) return json({ error: 'database unavailable' }, 503);
      try {
        return await handleScores(request, env.DB);
      } catch (err) {
        return json({ error: 'internal error', detail: String(err) }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);

    return env.ASSETS.fetch(request);
  },
};
