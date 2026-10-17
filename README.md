# NEON VENGEANCE

A retro 80s arcade space shooter built with vanilla Canvas + Web Audio, deployed on Cloudflare Workers with a D1-backed high-score leaderboard.

## Features

- Pixel-art canvas rendering with a 3-layer parallax starfield, CRT scanline + vignette overlay, and screen shake
- 3 enemy types (drone / zig / tank) with escalating waves, difficulty ramp, and targeting or spray fire patterns
- Power-ups: SPREAD (triple shot), RAPID (double fire rate), SHIELD (absorbs a hit), EXTRA LIFE, MEGA BOMB (screen clear)
- All sound effects are synthesized live with the Web Audio API — no audio assets. Toggle with the ♪ button or `M`
- High scores stored in Cloudflare D1 (SQLite) with range validation and a per-callsign top-3 cap
- Name entry + top-10 leaderboard on the title screen

## Controls

- Move: Arrow keys / WASD / mouse or touch
- Fire: Space
- Pause: P — Mute: M
- Game over: Enter saves your score (Esc skips); then Enter or the PLAY AGAIN button restarts

## Project structure

```
public/index.html     game page, HUD, leaderboard UI, CRT styling
public/game-*.js      the game as ordered classic scripts (shared global scope, load order matters):
  game-core.js          constants, canvas, DOM refs, Web Audio synth, safe storage
  game-state.js         `game` state object, ship factory, starfield
  game-input.js         keyboard / touch / pointer handlers
  game-spawn.js         waves, enemy mix (pickEnemyType), power-up drops
  game-combat.js        firing, damage, explosions, power-ups, player hits
  game-update.js        per-frame simulation
  game-sprites.js       drawShip / drawEnemy
  game-render.js        draw(): scene, HUD, banners, pause overlay
  game-ui.js            leaderboard, game-over flow, main loop
worker.js             Cloudflare Worker: static assets + /api/scores (GET/POST) on D1
test/worker.test.mjs  API + enemy-mix tests (node:test, no dependencies)
manifest.json         deployment manifest (worker entry + static assets)
wrangler.jsonc        local-dev config only (not used for deployment)
```

## API

- `GET /api/scores?limit=10` — top scores (limit 1–100)
- `POST /api/scores` `{name, score}` — 3–10 char callsign. Each callsign keeps its best 3 scores;
  a score that doesn't make that personal top 3 returns `200 {ok: true, saved: false}`.
  Success returns `201 {ok: true, saved: true, rank}`.

**Limitation:** scores are reported by the browser, so a determined player can submit fake ones.
The server only rejects malformed or out-of-range values (0 – 100,000,000).
The API is same-origin only (no CORS headers).

## Local development

```
npm install
npm run dev     # wrangler dev, http://localhost:8787
npm test        # needs Node 22.5+
```
