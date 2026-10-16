// ---------------------------------------------------------------- input
const keys = {};
let spaceHeld = false, spacePressedEdge = false;

addEventListener('keydown', (e) => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Space') {
    if (!spaceHeld) spacePressedEdge = true;
    spaceHeld = true;
  }
  if (e.code === 'KeyM') AudioSys.toggle();
  if (e.code === 'KeyP' && game.state === STATE.PLAYING) game.state = STATE.PAUSED;
  else if (e.code === 'KeyP' && game.state === STATE.PAUSED) game.state = STATE.PLAYING;
  if (e.code === 'Enter' && game.state === STATE.GAMEOVER) startGame();
  AudioSys.init();
});
addEventListener('keyup', (e) => { keys[e.code] = false; if (e.code === 'Space') spaceHeld = false; });

// touch / pointer controls
let pointerX = null, pointerFiring = false;
canvas.addEventListener('pointerdown', (e) => {
  AudioSys.init(); AudioSys.resume();
  pointerFiring = true;
  pointerX = e.offsetX;
  if (game.state === STATE.TITLE) startGame();
});
canvas.addEventListener('pointermove', (e) => { if (pointerFiring) pointerX = e.offsetX; });
addEventListener('pointerup', () => { pointerFiring = false; pointerX = null; });

el.startButton.addEventListener('click', () => { AudioSys.init(); AudioSys.resume(); startGame(); });
el.soundToggle.addEventListener('click', () => { AudioSys.init(); AudioSys.toggle(); });

// ---------------------------------------------------------------- entities
function makeShip() {
  return {
    x: W / 2, y: H - 70, w: 22, h: 24,
    speed: 260,
    cooldown: 0, fireRate: .18,
    invuln: 2.2,          // seconds of post-respawn invulnerability
    alive: true,
    powerups: { spread: 0, rapid: 0, shield: 0 },
    blink: 0,
  };
}

const game = {
  state: STATE.TITLE,
  score: 0, lives: 3, wave: 0,
  difficulty: 0,          // grows over time
  time: 0,
  ship: makeShip(),
  bullets: [],            // player bullets {x,y,vy,vx}
  eBullets: [],           // enemy bullets
  enemies: [],
  powerups: [],
  parts: [],              // particles
  stars: [],
  shake: 0,
  waveTimer: 2,
  enemiesRemaining: 0,
  banner: null,           // {text, until}
};

// starfield: 3 parallax layers
for (let i = 0; i < 90; i++) {
  const layer = i % 3;
  game.stars.push({
    x: Math.random() * W, y: Math.random() * H,
    speed: 20 + layer * 40,
    size: layer === 0 ? 1 : layer === 1 ? 1.6 : 2.2,
    tint: layer === 2 ? (Math.random() < .5 ? '#00f0ff' : '#ff2d95') : '#9db8ff',
    a: .3 + Math.random() * .7,
  });
}

// ---------------------------------------------------------------- spawning
