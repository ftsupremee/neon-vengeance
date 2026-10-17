/* NEON VENGEANCE — input: keyboard, touch and pointer controls. */

const keys = {};
let spaceHeld = false;

// Hotkeys must not fire while the player is typing their callsign.
const isTyping = (e) => e.target instanceof HTMLInputElement;

addEventListener('keydown', (e) => {
  AudioSys.init();
  if (isTyping(e)) {
    // Escape skips saving a score; Enter is handled by the form's submit event.
    if (e.code === 'Escape' && game.state === STATE.ENTER_NAME) finishGameOver();
    return;
  }

  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  keys[e.code] = true;
  if (e.code === 'Space') spaceHeld = true;
  if (e.code === 'KeyM') AudioSys.toggle();
  if (e.code === 'KeyP' && !e.repeat) {
    if (game.state === STATE.PLAYING) game.state = STATE.PAUSED;
    else if (game.state === STATE.PAUSED) game.state = STATE.PLAYING;
  }
  if (e.code === 'Enter' && !e.repeat && game.state === STATE.GAMEOVER) startGame();
});

addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (e.code === 'Space') spaceHeld = false;
});

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
el.restartButton.addEventListener('click', () => { AudioSys.init(); AudioSys.resume(); startGame(); });
el.soundToggle.addEventListener('click', () => { AudioSys.init(); AudioSys.toggle(); });
