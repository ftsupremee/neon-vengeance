# Changes in 1.1.0

**Gameplay bugs**
- Tanks now spawn at every wave. The old thresholds crossed at wave 5, so tanks vanished (and were only 1–4% of spawns before that).
- MEGA BOMB now actually clears tanks (area kills ignore remaining hp).
- Restart works. The game-over screen promised "press Enter to play again" but the handler could never fire. Added Enter + a PLAY AGAIN button, and Esc to skip saving.
- Hotkeys (M mute, P pause) no longer trigger while typing a callsign.
- Storage access is wrapped everywhere; game over no longer breaks when `localStorage` throws.

**API**
- Per-callsign cap now really keeps the best 3 scores (before, a low score was inserted regardless).
- Insert + prune run in one atomic batch; added an index on `(name, score)`.
- 500 responses no longer leak exception text; unused CORS wildcard and `ctx` parameter removed.
- A failed schema init is retried instead of cached forever.

**Cleanup**
- Removed dead code: `spacePressedEdge`, `ship.alive`, `ship.blink`.
- Files renamed to match contents (`game-render.js` ↔ `game-draw.js` were swapped in meaning), state moved out of `game-input.js` into `game-state.js`, header comment on every file.
- Added `package.json` (the README's `npm install` previously had nothing to install), tests, and clarified the two config files.
