/* NEON VENGEANCE — render: draws the scene, HUD, banners and the pause overlay. */

function draw() {
  ctx.fillStyle = '#05010d';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  if (game.shake > 0) {
    ctx.translate((Math.random() * 2 - 1) * game.shake, (Math.random() * 2 - 1) * game.shake);
  }

  // stars
  for (const st of game.stars) {
    ctx.globalAlpha = st.a;
    ctx.fillStyle = st.tint;
    ctx.fillRect(Math.round(st.x), Math.round(st.y), st.size, st.size);
  }
  ctx.globalAlpha = 1;

  if (game.state !== STATE.TITLE) {
    // bullets
    for (const b of game.bullets) {
      ctx.fillStyle = '#ffe34d';
      ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 8, 4, 12);
    }
    for (const b of game.eBullets) {
      ctx.fillStyle = '#ff2d95';
      ctx.fillRect(Math.round(b.x) - 3, Math.round(b.y) - 3, 6, 6);
    }

    // powerups
    for (const p of game.powerups) {
      const info = POWERUP_TYPES[p.kind];
      const bob = Math.sin(p.t * 6) * 3;
      const x = Math.round(p.x), y = Math.round(p.y + bob);
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 10, y - 10, 20, 20);
      ctx.fillStyle = info.color;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.glyph, x, y + 1);
    }

    // enemies
    for (const en of game.enemies) drawEnemy(en);

    // ship
    if (game.state === STATE.PLAYING || game.state === STATE.PAUSED) drawShip(game.ship);

    // particles
    for (const p of game.parts) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // HUD
  if (game.state !== STATE.TITLE) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff2d95';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('SCORE', 10, 22);
    ctx.fillStyle = '#fff';
    ctx.fillText(String(game.score).padStart(7, '0'), 10, 38);
    ctx.fillStyle = '#ffe34d';
    ctx.fillText('HI ' + String(topScore()).padStart(7, '0'), 150, 22);
    // lives as little ships
    ctx.fillStyle = '#00f0ff';
    for (let i = 0; i < game.lives; i++) {
      ctx.fillRect(W - 20 - i * 16, 12, 10, 4);
      ctx.fillRect(W - 18 - i * 16, 16, 4, 4);
    }
    // wave
    ctx.fillStyle = '#39ff14';
    ctx.textAlign = 'right';
    ctx.fillText('WAVE ' + game.wave, W - 10, 38);
    // active powerup timers
    let ty = 56;
    ctx.textAlign = 'left';
    for (const k of Object.keys(game.ship.powerups)) {
      if (game.ship.powerups[k] > 0) {
        ctx.fillStyle = POWERUP_TYPES[k].color;
        ctx.fillText(POWERUP_TYPES[k].label, 10, ty);
        ctx.textAlign = 'right';
        ctx.fillText(Math.ceil(game.ship.powerups[k]) + 's', 90, ty);
        ctx.textAlign = 'left';
        ty += 16;
      }
    }
    // banner
    if (game.banner && game.time < game.banner.until) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe34d';
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.globalAlpha = Math.min(1, (game.banner.until - game.time) * 2);
      ctx.fillText(game.banner.text, W / 2, H * .35);
      ctx.globalAlpha = 1;
    }
  }

  if (game.state === STATE.PAUSED) {
    ctx.fillStyle = 'rgba(3,0,10,.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.fillText('PAUSED', W / 2, H / 2);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#8f8fae';
    ctx.fillText('PRESS P TO RESUME', W / 2, H / 2 + 30);
  }
}

