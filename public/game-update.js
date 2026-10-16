// ---------------------------------------------------------------- update
function update(dt) {
  game.time += dt;
  game.difficulty = game.time * DIFFICULTY_RAMP;

  // stars always scroll
  for (const st of game.stars) {
    st.y += st.speed * dt;
    if (st.y > H) { st.y = -2; st.x = Math.random() * W; }
  }

  // particles
  for (const p of game.parts) {
    p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt;
  }
  game.parts = game.parts.filter((p) => p.t < p.life);
  if (game.shake > 0) game.shake = Math.max(0, game.shake - dt * 24);

  if (game.state !== STATE.PLAYING) return;

  const s = game.ship;

  // timers / powerup durations
  for (const k of Object.keys(s.powerups)) if (s.powerups[k] > 0) s.powerups[k] -= dt;
  if (s.invuln > 0) s.invuln -= dt;

  // movement
  let dir = 0;
  if (keys.ArrowLeft || keys.KeyA) dir -= 1;
  if (keys.ArrowRight || keys.KeyD) dir += 1;
  s.x += dir * s.speed * dt;
  if (keys.ArrowUp || keys.KeyW) s.y -= s.speed * dt;
  if (keys.ArrowDown || keys.KeyS) s.y += s.speed * dt;
  if (pointerX !== null) {
    const target = pointerX;
    s.x += Math.max(-260 * dt, Math.min(260 * dt, target - s.x));
  }
  s.x = Math.max(14, Math.min(W - 14, s.x));
  s.y = Math.max(H * .45, Math.min(H - 30, s.y));

  // firing
  s.cooldown -= dt;
  const rate = s.powerups.rapid > 0 ? s.fireRate * .45 : s.fireRate;
  if ((spaceHeld || pointerFiring) && s.cooldown <= 0) {
    s.cooldown = rate;
    fireShip();
  }

  // waves
  game.enemiesRemaining = Math.max(0, game.enemiesRemaining);
  game.waveTimer -= dt;
  if (game.enemiesRemaining > 0 && game.waveTimer <= 0) {
    spawnEnemy();
    game.enemiesRemaining--;
    game.waveTimer = Math.max(.25, 1.1 - game.difficulty * .5);
  } else if (game.enemiesRemaining === 0 && game.enemies.length === 0 && game.waveTimer <= 0) {
    game.score += 100 * game.wave; // wave clear bonus
    spawnWave();
  }

  // player bullets
  for (const b of game.bullets) { b.x += b.vx * dt; b.y += b.vy * dt; if (b.y < -10) b.dead = true; }
  game.bullets = game.bullets.filter((b) => !b.dead);

  // enemies
  for (const en of game.enemies) {
    en.t += dt;
    if (en.hitFlash > 0) en.hitFlash -= dt;
    en.y += en.vy * dt;
    en.x += Math.sin(en.t * (en.type === 'zig' ? 5 : 1.5)) * en.drift * dt;
    en.x = Math.max(en.w / 2, Math.min(W - en.w / 2, en.x));
    // enemy fire
    en.fireT -= dt;
    if (en.fireT <= 0 && en.y > 10 && en.y < H * .7) {
      en.fireT = (1.5 + Math.random() * 2.5) / (1 + game.difficulty * .5);
      const dx = s.x - en.x, dy = s.y - en.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = 170 + game.difficulty * 40;
      if (en.type === 'zig') {
        game.eBullets.push({ x: en.x, y: en.y + en.h / 2, vx: 0, vy: spd * 1.3 });
      } else {
        game.eBullets.push({ x: en.x, y: en.y + en.h / 2, vx: dx / d * spd, vy: dy / d * spd });
      }
      AudioSys.enemyShoot();
    }
    if (en.y > H + en.h) { en.dead = true; }
    // collide with player
    if (s.invuln <= 0 && Math.abs(en.x - s.x) < (en.w + s.w) / 2 * .8 && Math.abs(en.y - s.y) < (en.h + s.h) / 2 * .8) {
      damageEnemy(en);
      hitPlayer();
    }
    // collide with bullets
    for (const b of game.bullets) {
      if (!b.dead && Math.abs(b.x - en.x) < en.w / 2 + 3 && Math.abs(b.y - en.y) < en.h / 2 + 6) {
        b.dead = true;
        damageEnemy(en, 1);
      }
    }
  }
  game.enemies = game.enemies.filter((en) => !en.dead);

  // enemy bullets
  for (const b of game.eBullets) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y > H + 10 || b.y < -10 || b.x < -10 || b.x > W + 10) b.dead = true;
    if (s.invuln <= 0 && Math.abs(b.x - s.x) < s.w / 2 && Math.abs(b.y - s.y) < s.h / 2) {
      b.dead = true;
      hitPlayer();
    }
  }
  game.eBullets = game.eBullets.filter((b) => !b.dead);

  // powerups
  for (const p of game.powerups) {
    p.t += dt; p.y += p.vy * dt;
    if (p.y > H + 14) p.dead = true;
    if (Math.abs(p.x - s.x) < s.w / 2 + 12 && Math.abs(p.y - s.y) < s.h / 2 + 12) {
      p.dead = true;
      usePowerup(p.kind);
    }
  }
  game.powerups = game.powerups.filter((p) => !p.dead);
}

