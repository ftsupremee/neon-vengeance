# NEON VENGEANCE

A retro 80s arcade space shooter built with vanilla Canvas + Web Audio, deployed on Cloudflare Workers with a D1-backed high-score leaderboard.

**[▶ PLAY THE LIVE PREVIEW](https://site-05d1815e3f53447c8d15b00f7a6b1ea2.freebuff.page)**

## Features

- Pixel-art canvas rendering with a 3-layer parallax starfield, CRT scanline + vignette overlay, and screen shake
- 3 enemy types (drone / zig / tank) with escalating waves, difficulty ramp, and targeting or spray fire patterns
- Power-ups: **SPREAD** (triple shot), **RAPID** (double fire rate), **SHIELD** (absorbs a hit), **EXTRA LIFE**, **MEGA BOMB** (screen clear)
- All sound effects are synthesized live with the Web Audio API — no audio assets. Toggle with the ♪ button or `M`
- High scores stored in **Cloudflare D1** (SQLite) with server-side validation and per-name spam pruning
- Name entry + top-10 leaderboard on the title screen

## Controls

| Key | Action |
|---|---|
| `←` `→` / `A` `D` (mouse/touch) | Move |
| `Space` | Fire |
| `W` `S` / `↑` `↓` | Move vertically |
| `P` | Pause |
| `M` | Mute/unmute |

## Project structure

```
public/index.html   — game page, HUD, leaderboard UI, CRT styling
public/game.js      — the entire game: loop, entities, particles, synth audio, API client
worker.js           — Cloudflare Worker: static assets + /api/scores (GET/POST) on D1
manifest.json       — deployment manifest (worker entry + static assets)
wrangler.jsonc      — local-dev config only (not used for deployment)
```

## API

- `GET /api/scores?limit=10` — top scores, newest-first tie-break
- `POST /api/scores` `{ name, score }` — 3–10 char callsign, sane score range enforced server-side; same callsign keeps only its top 3 entries

## Local development

```sh
npm install
npx wrangler dev   # serves the game + API on a local D1 database
```
