/* NEON VENGEANCE — retro 80s arcade space shooter
   Core: constants, canvas, DOM references, synthesized audio, safe storage. */
'use strict';

// ---------------------------------------------------------------- constants
const W = 480, H = 640;

const STATE = { TITLE: 0, PLAYING: 1, PAUSED: 2, GAMEOVER: 3, ENTER_NAME: 4 };
const DIFFICULTY_RAMP = 0.045; // difficulty units gained per second

const POWERUP_TYPES = {
  spread:  { color: '#ff2d95', glyph: 'W', label: 'SPREAD',  duration: 12 },
  rapid:   { color: '#ffe34d', glyph: 'R', label: 'RAPID',   duration: 10 },
  shield:  { color: '#00f0ff', glyph: 'S', label: 'SHIELD',  duration: 8  },
  life:    { color: '#39ff14', glyph: '1', label: 'EXTRA LIFE', duration: 0 },
  bomb:    { color: '#ff6b1a', glyph: 'B', label: 'MEGA BOMB', duration: 0 },
};

// ---------------------------------------------------------------- canvas
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// ---------------------------------------------------------------- DOM
const el = {
  titleScreen:   document.getElementById('title-screen'),
  gameoverScreen:document.getElementById('gameover-screen'),
  startButton:   document.getElementById('start-button'),
  soundToggle:   document.getElementById('sound-toggle'),
  scoresList:    document.getElementById('scores-list'),
  scoresEmpty:   document.getElementById('scores-empty'),
  finalScore:    document.getElementById('final-score'),
  nameForm:      document.getElementById('name-form'),
  playerName:    document.getElementById('player-name'),
  saveButton:    document.getElementById('save-score'),
  saveMsg:       document.getElementById('save-msg'),
  restartButton: document.getElementById('restart-button'),
  gameoverHint:  document.getElementById('gameover-hint'),
};

// ---------------------------------------------------------------- storage
// localStorage throws in some private-browsing modes; never let that break the game.
const storage = {
  get(key, fallback = '') {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage unavailable: ignore */ }
  },
};

// ---------------------------------------------------------------- audio (synth SFX)
const AudioSys = {
  ctx: null, master: null, enabled: true,

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.enabled = false; }
  },

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

  toggle() {
    this.enabled = !this.enabled;
    el.soundToggle.textContent = this.enabled ? '♪ SOUND: ON' : '♪ SOUND: OFF';
    el.soundToggle.classList.toggle('off', !this.enabled);
    if (this.enabled) { this.resume(); this.blip(440, .06, 'square', .12); }
    return this.enabled;
  },

  // tiny helper: one oscillator one envelope
  tone({ freq = 440, endFreq = null, dur = .1, type = 'square', vol = .3, delay = 0 }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + .02);
  },

  // noise burst (explosions)
  noise({ dur = .3, vol = .4, freq = 1000, delay = 0 }) {
    if (!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.ceil(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
    src.connect(filter); filter.connect(g); g.connect(this.master);
    src.start(t0);
  },

  shoot()      { this.tone({ freq: 880, endFreq: 320, dur: .08, type: 'square', vol: .12 }); },
  enemyShoot() { this.tone({ freq: 240, endFreq: 120, dur: .1, type: 'sawtooth', vol: .1 }); },
  explode()    { this.noise({ dur: .35, vol: .5, freq: 900 }); this.tone({ freq: 220, endFreq: 40, dur: .3, type: 'triangle', vol: .3 }); },
  bigExplode() { this.noise({ dur: .6, vol: .65, freq: 500 }); this.tone({ freq: 150, endFreq: 30, dur: .5, type: 'triangle', vol: .4 }); },
  powerup()    { this.tone({ freq: 523, dur: .09, type: 'square', vol: .2 }); this.tone({ freq: 659, dur: .09, type: 'square', vol: .2, delay: .09 }); this.tone({ freq: 784, dur: .12, type: 'square', vol: .2, delay: .18 }); },
  hitShield()  { this.tone({ freq: 200, endFreq: 600, dur: .12, type: 'sine', vol: .25 }); },
  playerDie()  { this.tone({ freq: 400, endFreq: 50, dur: .8, type: 'sawtooth', vol: .4 }); this.noise({ dur: .8, vol: .6, freq: 600 }); },
  coin()       { this.tone({ freq: 988, dur: .07, type: 'square', vol: .25 }); this.tone({ freq: 1319, dur: .25, type: 'square', vol: .25, delay: .07 }); },
  waveStart()  { [440, 554, 659, 880].forEach((f, i) => this.tone({ freq: f, dur: .1, type: 'square', vol: .2, delay: i * .1 })); },
};

