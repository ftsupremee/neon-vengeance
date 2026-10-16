// ---------------------------------------------------------------- combat
function fireShip() {
  const s = game.ship;
  const spd = 520;
  if (s.powerups.spread > 0) {
    [-0.35, 0, 0.35].forEach((a) => game.bullets.push({ x: s.x, y: s.y - s.h / 2, vx: Math.sin(a) * spd, vy: -Math.cos(a) * spd }));
  } else {
    game.bullets.push({ x: s.x, y: s.y - s.h / 2, vx: 0, vy: -spd });
  }
  AudioSys.shoot();
}

function killEnemiesAt(x, y, r, scoreMult) {
  for (const en of game.enemies) {
    const dx = en.x - x, dy = en.y - y;
    if (dx * dx + dy * dy < r * r) damageEnemy(en, scoreMult);
  }
}

function damageEnemy(en, scoreMult = 1) {
  en.hp--;
  en.hitFlash = .12;
  if (en.hp <= 0) {
    en.dead = true;
    explode(en.x, en.y, en.type === 'tank' ? 26 : 16);
    const pts = (en.type === 'tank' ? 150 : en.type === 'zig' ? 80 : 50) * scoreMult;
    game.score += pts;
    if (Math.random() < (en.type === 'tank' ? .55 : .14)) spawnPowerup(en.x, en.y);
    AudioSys.explode();
  } else {
    AudioSys.tone({ freq: 160, endFreq: 90, dur: .06, type: 'square', vol: .15 });
  }
}

function explode(x, y, count = 14, big = false) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 160;
    game.parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: .4 + Math.random() * .5, t: 0,
      color: ['#fff', '#ffe34d', '#ff2d95', '#00f0ff', '#ff6b1a'][Math.floor(Math.random() * 5)],
      size: 1 + Math.random() * (big ? 4 : 2.5),
    });
  }
  game.shake = Math.min(10, game.shake + (big ? 8 : 3));
}

function megaBomb() {
  killEnemiesAt(game.ship.x, H, 900);
  for (const b of game.eBullets) b.dead = true;
  explode(W / 2, H / 2, 40, true);
  AudioSys.bigExplode();
  game.banner = { text: 'MEGA BOMB!', until: game.time + 1.2 };
  game.shake = 14;
}

function usePowerup(kind) {
  const s = game.ship;
  AudioSys.powerup();
  if (kind === 'life') { game.lives = Math.min(9, game.lives + 1); }
  else if (kind === 'bomb') { megaBomb(); }
  else {
    s.powerups[kind] = POWERUP_TYPES[kind].duration;
  }
  game.banner = { text: POWERUP_TYPES[kind].label, until: game.time + 1 };
}

function hitPlayer() {
  const s = game.ship;
  if (s.invuln > 0) return;
  if (s.powerups.shield > 0) {
    s.powerups.shield = 0;
    s.invuln = 1;
    AudioSys.hitShield();
    explode(s.x, s.y, 10);
    game.banner = { text: 'SHIELD DOWN!', until: game.time + 1 };
    return;
  }
  game.lives--;
  explode(s.x, s.y, 26, true);
  AudioSys.playerDie();
  game.eBullets = []; // brief mercy period
  if (game.lives <= 0) {
    gameOver();
  } else {
    s.x = W / 2; s.y = H - 70;
    s.invuln = 2.5;
    s.powerups.spread = 0; s.powerups.rapid = 0; // lose weapons, keep nothing
  }
}

