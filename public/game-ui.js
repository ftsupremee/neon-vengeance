// ---------------------------------------------------------------- high scores
const LS_KEY = 'neon-vengeance-top';
function topScore() {
  try { return parseInt(localStorage.getItem(LS_KEY) || '0', 10) || 0; } catch { return 0; }
}

async function loadScores() {
  try {
    const res = await fetch('/api/scores');
    if (!res.ok) throw new Error('http ' + res.status);
    const data = await res.json();
    el.scoresEmpty.classList.add('hidden');
    el.scoresList.innerHTML = '';
    (data.scores || []).forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'row';
      const rank = document.createElement('span'); rank.className = 'rank';
      const name = document.createElement('span'); name.className = 'name';
      const pts = document.createElement('span');
      rank.textContent = (i === 0 ? '★' : '') + (i + 1);
      name.textContent = s.name;
      pts.textContent = s.score.toLocaleString();
      row.append(rank, name, pts);
      el.scoresList.appendChild(row);
    });
    if (!(data.scores || []).length) {
      el.scoresEmpty.classList.remove('hidden');
      el.scoresList.innerHTML = '';
    }
  } catch {
    el.scoresList.innerHTML = '<div id="scores-empty">LEADERBOARD OFFLINE</div>';
  }
}

function gameOver() {
  game.state = STATE.ENTER_NAME;
  el.finalScore.textContent = 'SCORE: ' + game.score.toLocaleString();
  el.gameoverScreen.classList.remove('hidden');
  el.saveMsg.textContent = '';
  el.nameForm.style.display = 'flex';
  el.playerName.value = localStorage.getItem('neon-vengeance-name') || '';
  if (game.score > topScore()) localStorage.setItem(LS_KEY, String(game.score));
  setTimeout(() => el.playerName.focus(), 50);
}

el.nameForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = el.playerName.value.trim().toUpperCase();
  if (name.length < 3) { el.saveMsg.textContent = 'NAME MUST BE 3+ CHARS'; return; }
  el.saveButton.disabled = true;
  el.saveMsg.textContent = 'SAVING...';
  try {
    localStorage.setItem('neon-vengeance-name', name);
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score: game.score }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'HTTP ' + res.status);
    }
    el.saveMsg.textContent = 'SCORE SAVED! ▸ TOP 10 UPDATED';
    el.nameForm.style.display = 'none';
    loadScores();
  } catch (err) {
    el.saveMsg.textContent = 'SAVE FAILED: ' + err.message;
  } finally {
    el.saveButton.disabled = false;
  }
});

// ---------------------------------------------------------------- flow
function startGame() {
  AudioSys.init(); AudioSys.resume();
  AudioSys.coin();
  game.state = STATE.PLAYING;
  game.score = 0; game.lives = 3; game.wave = 0;
  game.time = 0; game.difficulty = 0; game.shake = 0;
  game.ship = makeShip();
  game.bullets = []; game.eBullets = []; game.enemies = [];
  game.powerups = []; game.parts = [];
  game.banner = null;
  el.titleScreen.classList.add('hidden');
  el.gameoverScreen.classList.add('hidden');
  spawnWave();
}

// ---------------------------------------------------------------- main loop
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  spacePressedEdge = false;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
loadScores();
