/* NEON VENGEANCE — sprites: pixel-art drawing of the ship and enemies. */

function drawShip(s) {
  if (s.invuln > 0 && Math.floor(game.time * 12) % 2 === 0 && game.state === STATE.PLAYING) return;
  const px = Math.round(s.x), py = Math.round(s.y);
  ctx.save();
  ctx.translate(px, py);
  // engine glow
  const fl = Math.sin(game.time * 40) > 0 ? '#00f0ff' : '#ffe34d';
  ctx.fillStyle = fl;
  ctx.fillRect(-2, 12, 4, 5);
  // shield bubble
  if (s.powerups.shield > 0) {
    ctx.strokeStyle = 'rgba(0,240,255,' + (.5 + .3 * Math.sin(game.time * 8)) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  // hull
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, -12, 2, 5);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-11, -6, 22, 12);
  ctx.fillStyle = '#fff';
  ctx.fillRect(-11, -6, 22, 3);
  ctx.fillStyle = '#00f0ff';
  ctx.fillRect(-14, 2, 5, 8);
  ctx.fillRect(9, 2, 5, 8);
  ctx.fillStyle = '#ff2d95';
  ctx.fillRect(-4, 4, 8, 5);
  ctx.restore();
}

function drawEnemy(en) {
  const px = Math.round(en.x), py = Math.round(en.y);
  ctx.save();
  ctx.translate(px, py);
  const flash = en.hitFlash > 0;
  if (en.type === 'tank') {
    ctx.fillStyle = flash ? '#fff' : '#9b1fe3';
    ctx.fillRect(-16, -10, 32, 20);
    ctx.fillStyle = flash ? '#fff' : '#ff2d95';
    ctx.fillRect(-10, -14, 20, 5);
    ctx.fillRect(-14, 10, 28, 4);
    ctx.fillStyle = flash ? '#9b1fe3' : '#ffe34d';
    ctx.fillRect(-4, -4, 8, 8);
  } else if (en.type === 'zig') {
    ctx.fillStyle = flash ? '#fff' : '#ffe34d';
    ctx.fillRect(-2, -12, 4, 24);
    ctx.fillRect(-12, -12, 8, 8);
    ctx.fillRect(4, -12, 8, 8);
    ctx.fillRect(-8, 4, 16, 6);
    ctx.fillStyle = flash ? '#ffe34d' : '#ff6b1a';
    ctx.fillRect(-3, -8, 6, 5);
  } else {
    ctx.fillStyle = flash ? '#fff' : '#4dff88';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.fillStyle = flash ? '#4dff88' : '#0a2f14';
    ctx.fillRect(-6, -4, 12, 5);
    ctx.fillStyle = flash ? '#0a2f14' : '#ffe34d';
    ctx.fillRect(-8, -10, 4, 4);
    ctx.fillRect(4, -10, 4, 4);
  }
  // hp pips for tanks
  if (en.type === 'tank' && en.maxHp > 1) {
    for (let i = 0; i < en.hp; i++) {
      ctx.fillStyle = '#39ff14';
      ctx.fillRect(-12 + i * 9, -18, 7, 3);
    }
  }
  ctx.restore();
}

