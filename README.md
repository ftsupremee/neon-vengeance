# NEON VENGEANCE

A retro 80s arcade space shooter built with vanilla Canvas + Web Audio, deployed on Cloudflare Workers with a D1-backed high-score leaderboard.

## Features

- Pixel-art canvas rendering with a 3-layer parallax starfield, CRT scanline + vignette overlay, and screen shake
- 3 enemy types (drone / zig / tank) with escalating waves, difficulty ramp, and targeting or spray fire patterns
- Power-ups: SPREAD (triple shot), RAPID (double fire rate), SHIELD (absorbs a hit), EXTRA LIFE, MEGA BOMB (screen clear)
- All sound effects are synthesized live with the Web Audio API — no audio assets. Toggle with the ♪ button or `M`
- High scores stored in Cloudflare D1 (SQLite) with server-side validation and per-name spam pruning
- Name entry + top-10 leaderboard on the title screen

## Controls

- Move: Arrow keys / A D / mouse or touch
- Fire: Space
- Pause: P — Mute: M

## Project structure

```
public/index.html   game page, HUD, leaderboard UI, CRT styling
public/game-*.js    the game as ordered classic-script modules
                    core (canvas/audio/DOM) → input → spawn → combat
                    → update → render → draw → ui (HUD, scores, loop)
worker.js           Cloudflare Worker: static assets + /api/scores (GET/POST) on D1
manifest.json       deployment manifest (worker entry + static assets)
wrangler.jsonc      local-dev config only (not used for deployment)
```

## API

- `GET /api/scores?limit=10` — top scores
- `POST /api/scores` `{name, score}` — 3-10 char callsign; same callsign keeps only its top 3 entries

## Local development

```
npm install
npx wrangler dev
```
