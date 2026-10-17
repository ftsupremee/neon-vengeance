/* NEON VENGEANCE — worker: serves the game and a D1-backed high-score API.
 *
 * The game and the API share one origin, so no CORS headers are sent.
 * NOTE: scores are reported by the browser and cannot be verified server-side.
 * Validation below only rejects malformed or absurd values.
 */

const MAX_SCORE = 100_000_000; // sanity cap against junk submissions
const PER_NAME_LIMIT = 3;      // each callsign keeps only its best N scores

// Idempotent schema init, run once per isolate.
let tableReady = null;
function ensureTable(db) {
  if (!tableReady) {
    tableReady = db
      .batch([
        db.prepare(
          `CREATE TABLE IF NOT EXISTS scores (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             name TEXT NOT NULL,
             score INTEGER NOT NULL,
             created_at TEXT NOT NULL DEFAULT (datetime('now'))
           )`
        ),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)'),
        db.prepare('CREATE INDEX IF NOT EXISTS idx_scores_name ON scores(name, score DESC)'),
      ])
      .catch((err) => {
        tableReady = null; // allow a retry on the next request
        throw err;
      });
  }
  return tableReady;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function handleScores(request, db) {
  await ensureTable(db);

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 100);
    const { results } = await db
      .prepare('SELECT name, score, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?1')
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
  if (body === null || typeof body !== 'object') return json({ error: 'invalid JSON' }, 400);

  const name = typeof body.name === 'string' ? body.name.trim().toUpperCase().slice(0, 10) : '';
  const score = Math.floor(Number(body.score));

  if (name.length < 3) return json({ error: 'name must be 3-10 characters' }, 400);
  if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: 'invalid score' }, 400);
  }

  // Per-name cap: if this name already has N scores at least as good, the new one is not kept.
  const better = await db
    .prepare('SELECT COUNT(*) AS n FROM scores WHERE name = ?1 AND score >= ?2')
    .bind(name, score)
    .first();
  if (better && better.n >= PER_NAME_LIMIT) {
    return json({ ok: true, saved: false }, 200);
  }

  // Insert, then prune everything beyond this name's best N, atomically.
  await db.batch([
    db.prepare('INSERT INTO scores (name, score) VALUES (?1, ?2)').bind(name, score),
    db
      .prepare(
        `DELETE FROM scores WHERE name = ?1 AND id NOT IN (
           SELECT id FROM scores WHERE name = ?1
           ORDER BY score DESC, created_at ASC, id ASC LIMIT ?2
         )`
      )
      .bind(name, PER_NAME_LIMIT),
  ]);

  const rankRow = await db
    .prepare('SELECT COUNT(*) + 1 AS rank FROM scores WHERE score > ?1')
    .bind(score)
    .first();

  return json({ ok: true, saved: true, rank: rankRow ? rankRow.rank : 1 }, 201);
}

// ---------------------------------------------------------------- worker entry
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/scores') {
      if (!env.DB) return json({ error: 'database unavailable' }, 503);
      try {
        return await handleScores(request, env.DB);
      } catch (err) {
        console.error('scores handler failed:', err); // details stay in the logs, not the response
        return json({ error: 'internal error' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);

    return env.ASSETS.fetch(request);
  },
};
