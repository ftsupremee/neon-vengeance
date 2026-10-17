/* NEON VENGEANCE — spawning: waves, enemies and power-up drops. */

function spawnWave() {
  game.wave++;
  game.enemiesRemaining = Math.min(6 + game.wave * 2, 26);
  game.waveTimer = Math.max(1.2, 4 - game.wave * .15);
  if (game.wave > 1) AudioSys.waveStart();
  game.banner = { text: 'WAVE ' + game.wave, until: game.time + 1.6 };
}

function pickEnemyType(wave, roll = Math.random()) {
  // Independent chances that grow with the wave, so every type stays reachable.
  // wave 1: 8% tank / 14% zig · wave 5: 20% / 30% · wave 7+: 25% / 35% (rest are drones)
  const tankChance = Math.min(.05 + wave * .03, .25);
  const zigChance  = Math.min(.10 + wave * .04, .35);
  if (roll < tankChance) return 'tank';
  if (roll < tankChance + zigChance) return 'zig';
  return 'drone';
}

function spawnEnemy() {
  const type = pickEnemyType(game.wave);
  const hp = type === 'tank' ? 3 : 1;
  const size = type === 'tank' ? 34 : 26;
  game.enemies.push({
    type, x: 30 + Math.random() * (W - 60), y: -size,
    w: size, h: size * .8,
    vy: (type === 'tank' ? 45 : 75) * (1 + game.difficulty * .35),
    drift: (Math.random() * 2 - 1) * (type === 'zig' ? 130 : 45),
    hp, maxHp: hp,
    fireT: 1 + Math.random() * 2.5,
    t: 0, hitFlash: 0,
  });
}

function spawnPowerup(x, y) {
  const pool = ['spread', 'rapid', 'shield', 'spread', 'rapid', 'life', 'bomb'];
  const kind = pool[Math.floor(Math.random() * pool.length)];
  game.powerups.push({ kind, x, y, vy: 70, t: 0 });
}

