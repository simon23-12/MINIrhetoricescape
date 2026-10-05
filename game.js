/* ------------------------------------------------------------------
   Rhetoric Escape – game logic
   modes: title · story · map · play · clearing · boss · fail · win
   ------------------------------------------------------------------ */
(() => {
'use strict';
const T = TILE, LAST = LEVEL_DEFS.length - 1;     // index of the final level (the castle with the boss)
const $ = id => document.getElementById(id);
const stage = $('stage');
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rectsHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const IS_TOUCH = matchMedia('(pointer: coarse)').matches || /[?&]touch=1/.test(location.search);   // ?touch=1 previews the tablet layout on a desktop
document.body.classList.toggle('touch', IS_TOUCH);
/* scale the 800x448 stage to the screen and render the canvas at device resolution (sharp on Retina iPads) */
function fit() {
  const vv = window.visualViewport, vw = (vv && vv.width) || innerWidth, vh = (vv && vv.height) || innerHeight;
  const s = Math.min(vw / W, vh / H);
  // on touch devices the game hugs the top so the thumb controls get the free space underneath
  stage.style.top = IS_TOUCH ? '0' : '50%'; stage.style.transformOrigin = IS_TOUCH ? 'top center' : 'center';
  stage.style.transform = IS_TOUCH ? `translate(-50%,0) scale(${s})` : `translate(-50%,-50%) scale(${s})`;
  const res = clamp(Math.round(s * (window.devicePixelRatio || 1) * 4) / 4, 1, 2.5);
  if (canvas.width !== Math.round(W * res)) { canvas.width = Math.round(W * res); canvas.height = Math.round(H * res); }
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250));
if (window.visualViewport) visualViewport.addEventListener('resize', fit);
fit();
/* stop iOS pinch-zoom, double-tap zoom and the long-press menu */
['gesturestart', 'gesturechange', 'contextmenu'].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
document.addEventListener('touchmove', e => { if (!e.target.closest('.clist, .card.riddle')) e.preventDefault(); }, { passive: false });
let lastTap = 0; document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTap < 350 && !e.target.closest('button')) e.preventDefault(); lastTap = n; }, { passive: false });

/* ---------- save ---------- */
const SAVE_KEY = 'rhetoricescape.v1';
let save = (() => { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s.cleared === 'number') { s.cleared = Math.min(s.cleared, LEVEL_DEFS.length); return s; } } catch (e) {} return { cleared: 0, codex: {}, won: false }; })();
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} };

/* ---------- audio ---------- */
const Sfx = (() => {
  let ac = null, muted = false, timer = null, step = 0, song = null;
  const ensure = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); };
  const tone = (f, d, type = 'square', v = 0.05, slide = 0, delay = 0) => {
    if (muted || !ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
  };
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = {
    adventure: { bpm: 150, wave: 'square', lv: 0.016, bass: [0, 12, 7, 12, 0, 12, 7, 12], bars: [48, 53, 55, 48],
      lead: [72, 0, 76, 0, 79, 76, 72, 0, 74, 0, 77, 0, 81, 77, 74, 0, 71, 0, 74, 0, 79, 74, 71, 0, 72, 76, 79, 84, 79, 76, 72, 0] },
    map: { bpm: 112, wave: 'triangle', lv: 0.05, bass: [0, 0, 7, 0, 12, 0, 7, 0], bars: [43, 45, 47, 43],
      lead: [67, 0, 71, 0, 74, 0, 71, 0, 69, 0, 72, 0, 76, 0, 72, 0, 71, 0, 74, 0, 78, 0, 74, 0, 67, 0, 71, 0, 74, 71, 67, 0] },
    boss: { bpm: 172, wave: 'sawtooth', lv: 0.012, bass: [0, 0, 12, 0, 0, 12, 7, 12], bars: [45, 44, 43, 44],
      lead: [69, 69, 0, 72, 0, 69, 0, 76, 68, 68, 0, 71, 0, 68, 0, 75, 67, 67, 0, 70, 0, 67, 0, 74, 68, 0, 71, 0, 75, 0, 71, 0] }
  };
  const play = name => {
    stop(); song = SONGS[name]; step = 0; if (!song) return;
    const tick = () => {
      if (!ac || muted) return;
      const n = song.lead[step % 32], root = song.bars[Math.floor(step / 8) % 4], b = song.bass[step % 8], d = 60 / song.bpm / 2;
      if (n) tone(midi(n), d * 0.9, song.wave, song.lv);
      tone(midi(root + b - 12), d * 0.9, 'triangle', 0.05);
      step++;
    };
    timer = setInterval(tick, 60 / song.bpm / 2 * 1000);
  };
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  return {
    ensure, play, stop,
    toggle() { muted = !muted; return muted; },
    jump() { tone(300, 0.16, 'square', 0.05, 380); },
    coin() { tone(988, 0.07, 'square', 0.04); tone(1319, 0.2, 'square', 0.04, 0, 0.07); },
    stomp() { tone(220, 0.13, 'square', 0.06, -140); },
    hurt() { tone(260, 0.3, 'sawtooth', 0.07, -190); },
    bump() { tone(150, 0.08, 'square', 0.06); },
    scroll() { [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.12, 'triangle', 0.07, 0, i * 0.07)); },
    flag() { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', 0.04, 0, i * 0.08)); },
    click() { tone(660, 0.05, 'square', 0.04); },
    good() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.05, 0, i * 0.1)); },
    bad() { tone(200, 0.25, 'sawtooth', 0.06, -90); tone(150, 0.3, 'sawtooth', 0.06, -70, 0.2); },
    warn() { tone(440, 0.08, 'square', 0.03); },
    explode() { tone(120, 0.3, 'sawtooth', 0.08, -80); tone(70, 0.3, 'square', 0.06, -30); },
    bossHit() { tone(180, 0.5, 'sawtooth', 0.08, -120); [784, 988, 1175].forEach((f, i) => tone(f, 0.12, 'square', 0.05, 0, 0.1 + i * 0.07)); },
    win() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'square', 0.06, 0, i * 0.14)); }
  };
})();

/* ---------- input ---------- */
['pointerdown', 'touchend', 'click'].forEach(ev => addEventListener(ev, () => Sfx.ensure(), { passive: true }));
const keys = {}, pressed = {};
const press = code => { if (!keys[code]) pressed[code] = true; keys[code] = true; };
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  Sfx.ensure(); press(e.code); onKey(e);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
document.querySelectorAll('.tbtn[data-key]').forEach(b => {
  const k = b.dataset.key;
  const on = e => { e.preventDefault(); Sfx.ensure(); press(k); b.classList.add('on'); };
  const off = e => { e.preventDefault(); keys[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
});
/* sliding D-pad: one finger can glide from left to right without lifting */
(() => {
  const pad = $('dpad'), L = $('dpL'), R = $('dpR');
  const set = (l, r) => { keys.ArrowLeft = l; keys.ArrowRight = r; if (l) pressed.ArrowLeft = true; if (r) pressed.ArrowRight = true; L.classList.toggle('on', l); R.classList.toggle('on', r); };
  const at = e => { const b = pad.getBoundingClientRect(), f = (e.clientX - b.left) / b.width; set(f < 0.5, f >= 0.5); };
  pad.addEventListener('pointerdown', e => { e.preventDefault(); Sfx.ensure(); try { pad.setPointerCapture(e.pointerId); } catch (_) {} at(e); });
  pad.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') { if (pad.hasPointerCapture && pad.hasPointerCapture(e.pointerId)) at(e); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => pad.addEventListener(ev, () => set(false, false)));
})();
let runOn = IS_TOUCH;                                   // on touch screens RUN is a toggle (default on)
$('runBtn').classList.toggle('on', runOn);
$('runBtn').addEventListener('pointerdown', e => { e.preventDefault(); runOn = !runOn; $('runBtn').classList.toggle('on', runOn); Sfx.click(); });
const ctl = {
  left: () => keys.ArrowLeft || keys.KeyA, right: () => keys.ArrowRight || keys.KeyD,
  jump: () => keys.Space || keys.ArrowUp || keys.KeyW, run: () => keys.ShiftLeft || keys.ShiftRight || keys.KeyX || runOn,
  jumpPressed: () => pressed.Space || pressed.ArrowUp || pressed.KeyW,
  confirm: () => pressed.Enter || pressed.Space
};

/* ---------- state ---------- */
const MAXH = 5;
const G = { mode: 'title', t: 0, idx: 0, L: null, p: null, hearts: MAXH, scrolls: 0, coins: 0, cam: 0, parts: [], enemies: [], coinObjs: [], items: [], flags: [],
  theme: null, cp: null, intro: 0, shake: 0, sel: 0, mapAnim: null, gateBusy: false, gateOpen: 0, clearT: 0, codexOpen: false, failCtx: null };
const isPaused = () => RU.open || G.codexOpen;

function setMode(m) {
  G.mode = m; document.body.dataset.mode = m;
  $('title').classList.toggle('hidden', m !== 'title');
  $('story').classList.toggle('hidden', m !== 'story');
  $('fail').classList.toggle('hidden', m !== 'fail');
  $('win').classList.toggle('hidden', m !== 'win');
  const inGame = m === 'play' || m === 'clearing' || m === 'boss';
  $('bMap').classList.toggle('hidden', !inGame);
  $('bCodex').classList.toggle('hidden', !(inGame || m === 'map'));
  $('btnCont').classList.toggle('hidden', !(save.cleared > 0));
  if (m === 'title' || m === 'story' || m === 'map') Sfx.play('map');
  else if (m === 'play') Sfx.play('adventure');
  else if (m === 'boss') Sfx.play('boss');
}
function toast(msg) {
  const el = $('toast'); el.textContent = msg; el.classList.remove('hidden'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), 2900);
}

/* ---------- particles ---------- */
function burst(x, y, color, n = 10, sp = 3) {
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = (0.4 + Math.random()) * sp; G.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 26 + Math.random() * 16, max: 42, color, size: 2 + Math.random() * 3, grav: 0.18 }); }
}
function floatText(x, y, text, color = '#fff', size = 9) { G.parts.push({ x, y, vx: 0, vy: -0.7, life: 55, max: 55, text, color, size, grav: 0 }); }
function updParts() { for (const p of G.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life--; } G.parts = G.parts.filter(p => p.life > 0); }
function drawParts(camX) {
  for (const p of G.parts) {
    ctx.globalAlpha = clamp(p.life / (p.max * 0.5), 0, 1);
    if (p.text) txt(p.text, p.x - camX, p.y, p.size, p.color, 'center');
    else { ctx.fillStyle = p.color; ctx.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size); }
  }
  ctx.globalAlpha = 1;
}

/* ---------- physics ---------- */
const tileAt = (L, c, r) => { if (c < 0 || c >= L.cols) return 1; if (r < 0 || r >= ROWS) return 0; return L.grid[r][c]; };
function moveEntity(e, L) {
  e.hitWall = false; e.bumped = [];
  e.x += e.vx;
  let c0 = Math.floor(e.x / T), c1 = Math.floor((e.x + e.w - 0.01) / T), r0 = Math.floor(e.y / T), r1 = Math.floor((e.y + e.h - 0.01) / T);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const v = tileAt(L, c, r);
    if (v && v !== 8) { if (e.vx > 0) e.x = c * T - e.w; else if (e.vx < 0) e.x = (c + 1) * T; e.hitWall = true; e.vx = 0; }
  }
  const prevBottom = e.y + e.h;
  e.y += e.vy; e.onGround = false;
  c0 = Math.floor(e.x / T); c1 = Math.floor((e.x + e.w - 0.01) / T); r0 = Math.floor(e.y / T); r1 = Math.floor((e.y + e.h - 0.01) / T);
  const vy = e.vy;
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const v = tileAt(L, c, r); if (!v) continue;
    if (v === 8) { if (vy > 0 && prevBottom <= r * T + 0.5) { e.y = r * T - e.h; e.vy = 0; e.onGround = true; } }
    else if (vy > 0) { e.y = r * T - e.h; e.vy = 0; e.onGround = true; }
    else if (vy < 0) { e.y = (r + 1) * T; e.vy = 0; e.bumped.push([c, r]); }
  }
}
const newPlayer = (x, y) => ({ x, y, w: 20, h: 32, vx: 0, vy: 0, facing: 1, onGround: false, coyote: 0, buf: 0, inv: 0, pose: 'idle', t: 0 });
function updatePlayer(p, L, lockX = false) {
  const left = ctl.left(), right = ctl.right(), run = ctl.run(), held = ctl.jump();
  const maxV = run ? 4.4 : 3.1, acc = p.onGround ? 0.45 : 0.3;
  if (left && !right) { p.vx -= acc; p.facing = -1; }
  else if (right && !left) { p.vx += acc; p.facing = 1; }
  else { const f = p.onGround ? 0.5 : 0.08; p.vx = Math.abs(p.vx) < f ? 0 : p.vx - Math.sign(p.vx) * f; }
  p.vx = clamp(p.vx, -maxV, maxV);
  if (ctl.jumpPressed()) p.buf = 7; else if (p.buf > 0) p.buf--;
  p.coyote = p.onGround ? 6 : Math.max(0, p.coyote - 1);
  if (p.buf > 0 && p.coyote > 0) { p.vy = -12.4 - Math.abs(p.vx) * 0.12; p.buf = 0; p.coyote = 0; Sfx.jump(); }
  p.vy = Math.min(p.vy + ((p.vy < 0 && !held) ? 1.5 : 0.6), 14);
  moveEntity(p, L);
  p.pose = !p.onGround ? 'jump' : Math.abs(p.vx) > 0.4 ? 'run' : 'idle';
  if (p.inv > 0) p.inv--;
  p.t++;
}

/* ---------- level play ---------- */
const STOMP_WORDS = ['BORING!', 'CLICHÉ!', 'DULL!', 'BLAND!', 'YAWN!', 'MEH!'];
function mkEnemy(d) {
  const sz = { blot: [28, 26], spike: [28, 28], big: [46, 44], bat: [26, 20] }[d.type];
  const x = d.c * T + (T - sz[0]) / 2, y = d.type === 'bat' ? d.r * T : (d.r + 1) * T - sz[1];
  return { type: d.type, w: sz[0], h: sz[1], x, y, vx: 0, vy: 0, dir: -1, hp: d.type === 'big' ? 2 : 1, dead: 0, flash: 0, t: Math.floor(rand(d.c) * 100), baseY: y, ox: x, onGround: false };
}
function startLevel(i) {
  G.idx = i; const def = LEVEL_DEFS[i], L = makeLevel(def);
  G.L = L; G.theme = THEMES[def.theme]; G.hearts = MAXH;
  G.p = newPlayer(L.startCol * T + 6, 12 * T - 32);
  G.enemies = L.enemies.map(mkEnemy);
  G.coinObjs = L.coins.map(c => ({ x: c.c * T + 16, y: c.r * T + 16, got: false, ph: rand(c.c + c.r) * 6 }));
  G.items = []; G.flags = L.flags.map(f => ({ c: f.c, up: false }));
  G.cp = { x: G.p.x, y: G.p.y }; G.cam = 0; G.parts = []; G.intro = 170; G.gateBusy = false; G.gateOpen = 0; G.shake = 0;
  RU.open = false; $('riddle').classList.add('hidden');
  setMode('play');
}
function loseHeart() { G.hearts--; Sfx.hurt(); G.shake = 10; return G.hearts <= 0; }
function hurtPlayer(srcX) {
  const p = G.p; if (p.inv > 0) return;
  const dead = loseHeart(); p.inv = 100; p.vy = -6; p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * 4;
  burst(p.x + p.w / 2, p.y + 14, '#ff3b5c', 8);
  if (dead) failLevel();
}
function respawn() { const p = G.p; p.x = G.cp.x; p.y = G.cp.y; p.vx = p.vy = 0; p.inv = 110; G.cam = clamp(p.x - 300, 0, G.L.cols * T - W); }
function failLevel() {
  G.failCtx = G.mode === 'boss' ? 'boss' : 'level';
  $('failTitle').textContent = G.failCtx === 'boss' ? 'Warerio laughs!' : 'Out of ink!';
  $('failText').textContent = G.failCtx === 'boss' ? '“Not stylish enough, little plumber!” – You will restart this round with full hearts.' : 'You ran out of hearts. Take a breath and try this world again!';
  G.prevMode = G.mode; setMode('fail'); Sfx.stop(); Sfx.bad();
}
function updEnemies() {
  const p = G.p, L = G.L;
  for (const e of G.enemies) {
    if (e.dead) { e.dead--; continue; }
    e.t++; if (e.flash > 0) e.flash--;
    if (e.type === 'bat') {
      e.x += e.dir * 0.9; e.y = e.baseY + Math.sin(e.t * 0.05) * 22;
      const fx = Math.floor((e.x + (e.dir > 0 ? e.w : 0)) / T), fr = Math.floor((e.y + e.h / 2) / T);
      if (Math.abs(e.x - e.ox) > 90 || isSolidTile(tileAt(L, fx, fr))) e.dir *= -1;
    } else {
      e.vx = e.dir * (e.type === 'big' ? 0.55 : e.type === 'spike' ? 0.5 : 0.8); e.vy = Math.min(e.vy + 0.6, 12);
      moveEntity(e, L);
      if (e.hitWall) e.dir *= -1;
      else if (e.onGround) { const fx = e.dir > 0 ? e.x + e.w + 2 : e.x - 2; if (!tileAt(L, Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T))) e.dir *= -1; }
      if (e.y > H + 60) { e.dead = 1; e.hp = 0; }
    }
    if (!e.dead && rectsHit(p, e)) {
      if (p.vy > 0 && e.type !== 'spike' && p.y + p.h - e.y < 20 + p.vy) {
        e.hp--; Sfx.stomp(); p.vy = ctl.jump() ? -11 : -8; p.y = e.y - p.h;
        if (e.hp <= 0) { e.dead = 26; burst(e.x + e.w / 2, e.y + e.h / 2, '#6d4fd1', 10); floatText(e.x + e.w / 2, e.y - 4, STOMP_WORDS[Math.floor(Math.random() * STOMP_WORDS.length)], '#ffd23f'); }
        else { e.flash = 24; floatText(e.x + e.w / 2, e.y - 4, 'OOF!', '#fff'); }
      } else hurtPlayer(e.x + e.w / 2);
    }
  }
  G.enemies = G.enemies.filter(e => !(e.dead === 0 && e.hp <= 0));
}
function hitBlock(c, r) {
  const L = G.L, v = L.grid[r][c];
  L.bumps.push({ c, r, t: 10 }); Sfx.bump();
  if (v === 4) { L.grid[r][c] = 6; G.coins++; Sfx.coin(); floatText(c * T + 16, r * T - 6, '+1', '#ffd23f'); burst(c * T + 16, r * T, '#ffd23f', 6); }
  else if (v === 5) { L.grid[r][c] = 6; G.items.push({ x: c * T + 16, y: (r - 1) * T + 14, got: false }); burst(c * T + 16, r * T, '#fff3a8', 8); }
}
function updPlay() {
  const L = G.L, p = G.p;
  updatePlayer(p, L);
  for (const [c, r] of p.bumped) hitBlock(c, r);
  for (const b of L.bumps) b.t--; L.bumps = L.bumps.filter(b => b.t > 0);
  if (p.y > H + 40) { if (loseHeart()) { failLevel(); return; } respawn(); }
  const pc = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
  for (const c of G.coinObjs) if (!c.got && Math.abs(c.x - pc.x) < 20 && Math.abs(c.y - pc.y) < 24) { c.got = true; G.coins++; Sfx.coin(); floatText(c.x, c.y - 8, '+1', '#ffd23f', 8); }
  for (const s of G.items) if (!s.got && Math.abs(s.x - pc.x) < 22 && Math.abs(s.y - pc.y) < 26) { s.got = true; G.scrolls++; Sfx.scroll(); floatText(s.x, s.y - 14, 'WISDOM SCROLL!', '#fff3a8', 8); toast('📜 Wisdom Scroll collected – use it at a riddle for a 50:50 hint!'); }
  for (const f of G.flags) if (!f.up && Math.abs(p.x - f.c * T) < 30) { f.up = true; G.cp = { x: f.c * T, y: 12 * T - 32 }; Sfx.flag(); floatText(f.c * T + 16, 12 * T - 70, 'CHECKPOINT', '#3ed36a', 8); }
  updEnemies();
  // gate
  const g = L.gate, gx = g.c * T;
  if (!G.gateBusy && p.x + p.w > gx + 8 && p.x < gx + 2 * T - 8) {   // even a high jump over the door can't skip the riddle
    G.gateBusy = true;
    if (g.type === 'boss') { startBoss(); return; }
    openGateRiddle();
  }
  G.cam = lerp(G.cam, clamp(p.x + p.w / 2 - W * 0.42, 0, L.cols * T - W), 0.14);
  if (G.intro > 0) G.intro--;
  if (G.shake > 0) G.shake--;
  updParts();
}
function openGateRiddle() {
  const pool = LEVEL_RIDDLES[G.idx], r = pool[Math.floor(Math.random() * pool.length)];
  G.p.vx = 0;
  openRiddle({ tag: `LEVEL ${G.idx + 1} · RIDDLE GATE`, riddle: r,
    onSolved() { G.mode = 'clearing'; G.clearT = 0; Sfx.flag(); },
    onDead() { failLevel(); } });
}
function updClearing() {
  const L = G.L, p = G.p, g = L.gate; G.clearT++;
  G.gateOpen = Math.min(1, G.clearT / 40);
  const target = g.c * T + T - p.w / 2;
  if (G.clearT > 25) { p.vx = clamp((target - p.x) * 0.12, -2.2, 2.2); p.facing = p.vx >= 0 ? 1 : -1; } else p.vx = 0;
  p.vy = Math.min(p.vy + 0.6, 14); moveEntity(p, L); p.pose = Math.abs(p.vx) > 0.4 ? 'run' : 'idle'; p.t++; p.inv = 0;
  if (G.clearT % 6 === 0 && G.clearT < 100) burst(g.c * T + 32, 9 * T + 30, '#ffe566', 3, 2.5);
  updParts();
  if (G.clearT > 110) finishLevel();
}
function finishLevel() {
  const fresh = G.idx + 1 > save.cleared;
  save.cleared = Math.max(save.cleared, G.idx + 1); persist();
  G.mapAnim = fresh ? { from: G.idx, to: Math.min(G.idx + 1, LAST), t: 0 } : null;
  G.sel = fresh ? Math.min(G.idx + 1, LAST) : G.idx;
  setMode('map');
  toast(`✔ Level ${G.idx + 1} cleared! “${DEVICES[LEVEL_DEFS[G.idx].device].name}” is in your Codex.`);
}

function drawHUD(boss) {
  for (let i = 0; i < MAXH; i++) heart(24 + i * 27, 10, 12, i < G.hearts);
  if (!boss) {
    txt(`LEVEL ${G.idx + 1}`, 330, 22, 9, '#ffd23f', 'center');
    drawCoin(468, 18, G.t, 0); txt('×' + G.coins, 482, 24, 9, '#fff');
    drawScroll(560, 17, 0); txt('×' + G.scrolls, 576, 24, 9, '#fff');
  } else { drawScroll(196, 18, 0); txt('×' + G.scrolls, 212, 24, 9, '#fff'); }
}
function drawPlay() {
  const L = G.L, th = G.theme, cam = Math.round(G.cam), t = G.t;
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
  drawBackground(L.theme, cam, t); drawLiquid(th, cam, t);
  drawTiles(L, th, cam, t);
  for (const f of G.flags) drawFlag(f, cam, t);
  drawGate(L.gate, cam, t, G.gateOpen);
  for (const c of G.coinObjs) if (!c.got && c.x - cam > -20 && c.x - cam < W + 20) drawCoin(c.x - cam, c.y, t, c.ph);
  for (const s of G.items) if (!s.got) drawScroll(s.x - cam, s.y, t);
  for (const e of G.enemies) if (e.x - cam > -60 && e.x - cam < W + 60) { ctx.save(); ctx.translate(-cam, 0); drawEnemy(e, t); ctx.restore(); }
  if (!(G.mode === 'clearing' && G.clearT > 85)) {
    const hide = G.mode === 'clearing' && G.clearT > 60; if (hide) ctx.globalAlpha = clamp(1 - (G.clearT - 60) / 25, 0, 1);
    ctx.save(); ctx.translate(-cam, 0); drawHero(G.p, t); ctx.restore(); ctx.globalAlpha = 1;
  }
  drawParts(cam);
  ctx.restore();
  drawHUD(false);
  if (G.intro > 0) {
    const a = clamp(Math.min(G.intro / 30, (170 - G.intro) / 20), 0, 1), d = LEVEL_DEFS[G.idx];
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,6,40,.55)'; roundRect(150, 118, 500, 104, 14); ctx.fill();
    txt(`LEVEL ${G.idx + 1}`, 400, 154, 14, '#ffd23f', 'center');
    txt(d.name, 400, 184, 15, '#fff', 'center');
    if (d.device !== 'boss') txt('Reach the riddle gate at the end!', 400, 208, 9, '#9fe3ff', 'center');
    else txt('Beat Warerio – free the princess!', 400, 208, 9, '#ff9aa8', 'center');
    ctx.globalAlpha = 1;
  }
}

/* ---------- riddle UI ---------- */
const RU = { open: false, done: false, r: null, opts: [], dis: [], cb: null };
function heartsText() { const n = clamp(G.hearts, 0, MAXH); return '♥'.repeat(n) + `<span class="off">${'♥'.repeat(MAXH - n)}</span>`; }
function refreshRiddleHud() {
  $('rhearts').innerHTML = heartsText(); $('rscrolln').textContent = G.scrolls;
  $('rscroll').disabled = G.scrolls <= 0 || RU.done || RU.opts.filter((o, i) => !o.ok && !RU.dis[i]).length < 2;
}
function openRiddle(cb) {
  const r = cb.riddle; RU.cb = cb; RU.r = r; RU.done = false; RU.open = true;
  RU.opts = shuffle([{ t: r.correct, ok: true }, ...r.wrong.map(t => ({ t, ok: false }))]); RU.dis = [false, false, false, false];
  $('rtag').textContent = cb.tag; $('rtext').innerHTML = `<div>${r.q}</div>`; $('rfb').innerHTML = '';
  const box = $('ropts'); box.innerHTML = '';
  RU.opts.forEach((o, i) => {
    const b = document.createElement('button'); b.className = 'opt'; b.innerHTML = `<span class="k">${i + 1}</span><span>${o.t}</span>`;
    b.addEventListener('click', () => pickOpt(i)); box.appendChild(b);
  });
  $('rnext').classList.add('hidden'); refreshRiddleHud(); $('riddle').classList.remove('hidden'); Sfx.click();
}
function pickOpt(i) {
  if (!RU.open || RU.done || RU.dis[i]) return;
  const o = RU.opts[i], btn = $('ropts').children[i], dev = DEVICES[RU.r.device];
  if (o.ok) {
    RU.done = true; btn.classList.add('ok'); Sfx.good();
    [...$('ropts').children].forEach(b => b.disabled = true);
    save.codex[RU.r.device] = true; persist();
    $('rfb').innerHTML = `<span class="good">✔ Correct!</span> <b>${dev.name}</b> – ${dev.def}<small>Example: <i>${dev.ex}</i></small>`;
    $('rnext').textContent = 'Continue ▶'; $('rnext').classList.remove('hidden'); $('rnext').dataset.act = 'solved';
  } else {
    RU.dis[i] = true; btn.classList.add('bad'); btn.disabled = true; Sfx.bad();
    G.hearts--; G.shake = 8;
    if (G.hearts <= 0) {
      RU.done = true; [...$('ropts').children].forEach(b => b.disabled = true);
      $('rfb').innerHTML = '<span class="badtxt">✘ Out of ink!</span> You have no hearts left.';
      $('rnext').textContent = 'Try again ↻'; $('rnext').classList.remove('hidden'); $('rnext').dataset.act = 'dead';
    } else $('rfb').innerHTML = `<span class="badtxt">✘ Not quite!</span> You lose a heart. <small>Hint: ${RU.r.hint}</small>`;
  }
  refreshRiddleHud();
}
function riddleNext() {
  if (!RU.open || !RU.done) return;
  const act = $('rnext').dataset.act, cb = RU.cb; RU.open = false; $('riddle').classList.add('hidden'); Sfx.click();
  if (act === 'solved') cb.onSolved(); else cb.onDead();
}
$('rnext').addEventListener('click', riddleNext);
$('rscroll').addEventListener('click', () => {
  if (!RU.open || RU.done || G.scrolls <= 0) return;
  const wrongs = shuffle(RU.opts.map((o, i) => i).filter(i => !RU.opts[i].ok && !RU.dis[i])).slice(0, 2);
  if (wrongs.length < 2) return;
  G.scrolls--; Sfx.scroll();
  wrongs.forEach(i => { RU.dis[i] = true; const b = $('ropts').children[i]; b.classList.add('gone'); b.disabled = true; });
  $('rfb').innerHTML = '<span class="good">📜 The scroll glows – two wrong answers vanish!</span>'; refreshRiddleHud();
});

/* ---------- codex ---------- */
function openCodex() {
  const list = $('codexList'); list.innerHTML = '';
  for (const k of Object.keys(DEVICES)) {
    const d = DEVICES[k], got = save.codex[k], div = document.createElement('div'); div.className = 'cc' + (got ? '' : ' locked');
    div.innerHTML = got ? `<h3>${d.icon} ${d.name}</h3><p>${d.def}</p><p class="ex">“${d.ex}”</p>` : `<h3>🔒 ???</h3><p>Solve a riddle about this device to unlock it.</p>`;
    list.appendChild(div);
  }
  G.codexOpen = true; $('codex').classList.remove('hidden'); Sfx.click();
}
function closeCodex() { G.codexOpen = false; $('codex').classList.add('hidden'); Sfx.click(); }

/* ---------- world map ---------- */
const NODES = [[110, 350], [280, 298], [468, 346], [706, 196]];
const NODE_COL = ['#52c75a', '#f6c46a', '#a98bd9', '#b0343f'];
function updMap() {
  if (G.mapAnim) { G.mapAnim.t++; if (G.mapAnim.t > 70) G.mapAnim = null; return; }
  const maxSel = Math.min(save.cleared, LAST);
  if ((pressed.ArrowRight || pressed.KeyD) && G.sel < maxSel) { G.sel++; Sfx.click(); }
  if ((pressed.ArrowLeft || pressed.KeyA) && G.sel > 0) { G.sel--; Sfx.click(); }
  if (ctl.confirm()) startLevel(G.sel);
}
function drawMap() {
  const t = G.t;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fd3ff'); g.addColorStop(1, '#2b86c9'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 12; i++) { const x = ((i * 130 + t * 0.4) % (W + 100)) - 50; ctx.fillRect(x, 130 + (i * 37) % 300, 40 + (i % 3) * 14, 3); }
  clouds(t * 0.6, 0.5, 'rgba(255,255,255,.85)', 5, -10);
  // island
  ctx.fillStyle = '#c9a566'; ctx.beginPath(); ctx.ellipse(400, 342, 400, 128, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#7ed36b'; ctx.beginPath(); ctx.ellipse(400, 334, 386, 118, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#6cc25d'; ctx.beginPath(); ctx.ellipse(700, 262, 100, 80, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#5e5a78'; ctx.beginPath(); ctx.ellipse(710, 225, 80, 40, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 14; i++) { const tx = 40 + rand(i) * 640, ty = 270 + rand(i + 5) * 120; if (Math.abs(tx - 400) < 400 && ty > 260) { ctx.fillStyle = '#2f9c47'; ctx.beginPath(); ctx.arc(tx, ty, 9 + rand(i + 2) * 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#6b4220'; ctx.fillRect(tx - 1, ty + 8, 3, 6); } }
  // path
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const trace = (n) => { ctx.beginPath(); ctx.moveTo(NODES[0][0], NODES[0][1]); for (let i = 1; i <= n; i++) ctx.lineTo(NODES[i][0], NODES[i][1]); ctx.stroke(); };
  ctx.strokeStyle = '#b08a4a'; ctx.lineWidth = 13; trace(LAST);
  ctx.strokeStyle = '#f3dfa8'; ctx.lineWidth = 8; trace(LAST);
  if (save.cleared > 0) { ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 5; trace(Math.min(save.cleared, LAST)); }
  // castle (behind node 7)
  const cx = 706, cy = 196;
  ctx.fillStyle = '#4d4a66'; ctx.fillRect(cx - 44, cy - 62, 88, 62); ctx.fillRect(cx - 54, cy - 90, 24, 90); ctx.fillRect(cx + 30, cy - 90, 24, 90); ctx.fillRect(cx - 12, cy - 112, 24, 50);
  ctx.fillStyle = '#b0343f'; for (const [px, py, pw] of [[cx - 58, cy - 90, 32], [cx + 26, cy - 90, 32], [cx - 16, cy - 112, 32]]) { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + pw / 2, py - 22); ctx.lineTo(px + pw, py); ctx.fill(); }
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(cx - 4, cy - 108, 8, 10); ctx.fillRect(cx - 46, cy - 70, 8, 10); ctx.fillRect(cx + 38, cy - 70, 8, 10);
  ctx.fillStyle = '#2a1a3a'; roundRect(cx - 12, cy - 30, 24, 30, 10); ctx.fill();
  ctx.fillStyle = '#e8302b'; ctx.fillRect(cx - 1, cy - 150, 2, 38); ctx.beginPath(); ctx.moveTo(cx + 1, cy - 150); ctx.lineTo(cx + 22 + Math.sin(t * 0.1) * 2, cy - 143); ctx.lineTo(cx + 1, cy - 136); ctx.fill();
  txt('W', cx + 10, cy - 139, 7, '#ffd23f', 'center', null);
  drawPrincess(cx + 1, cy - 66, t, true, 0.38);
  // nodes
  const maxSel = Math.min(save.cleared, LAST);
  NODES.forEach(([x, y], i) => {
    const cleared = i < save.cleared, open = i <= save.cleared;
    const pulse = i === G.sel && !G.mapAnim ? Math.sin(t * 0.15) * 2 : 0;
    if (i === G.sel && !G.mapAnim) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 24 + pulse, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y, 19, 0, TAU); ctx.fill();
    ctx.fillStyle = open ? (cleared ? '#ffd23f' : NODE_COL[i]) : '#7b7b8c'; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x - 5, y - 7, 7, 4, -0.4, 0, TAU); ctx.fill();
    if (!open) txt('🔒', x, y + 5, 13, '#fff', 'center', null, 'sans-serif');
    else txt(i === LAST ? '☠' : String(i + 1), x, y + 5, i === LAST ? 14 : 12, cleared ? '#7a4a00' : '#fff', 'center', cleared ? null : '#000', i === LAST ? 'sans-serif' : undefined);
    if (cleared && i < LAST) txt('★', x + 14, y - 12, 12, '#fff', 'center', '#b8860b', 'sans-serif');
  });
  // hero marker
  let hx, hy;
  if (G.mapAnim) { const a = G.mapAnim, k = clamp(a.t / 60, 0, 1), e = k * k * (3 - 2 * k); hx = lerp(NODES[a.from][0], NODES[a.to][0], e); hy = lerp(NODES[a.from][1], NODES[a.to][1], e); }
  else { hx = NODES[G.sel][0]; hy = NODES[G.sel][1]; }
  const moving = !!G.mapAnim && G.mapAnim.t < 62, face = G.mapAnim ? (NODES[G.mapAnim.to][0] >= NODES[G.mapAnim.from][0] ? 1 : -1) : 1;
  drawPlumber(hx, hy - 12 - (moving ? Math.abs(Math.sin(t * 0.3)) * 6 : Math.sin(t * 0.1) * 1.5), Object.assign({ facing: face, pose: moving ? 'run' : 'idle', t, s: 0.8 }, HERO));
  // header + info panel
  txt('WORLD MAP', 20, 36, 14, '#fff');
  ctx.fillStyle = 'rgba(14,10,43,.88)'; roundRect(18, 392, 764, 46, 12); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 3; ctx.stroke();
  const d = LEVEL_DEFS[G.sel], boss = d.device === 'boss';
  txt(`LEVEL ${G.sel + 1}: ${d.name}`, 34, 412, 10, '#ffd23f', 'left', null);
  ctx.font = '800 14px Nunito, sans-serif'; ctx.fillStyle = '#e8e6ff'; ctx.textAlign = 'left';
  ctx.fillText(boss ? 'Boss battle! Defeat Warerio and free Princess Prosa.' : 'Reach the Riddle Gate at the end – and solve its riddle to pass!', 34, 430);
  const hov = G.mapHover; ctx.fillStyle = hov ? '#fff29a' : '#ffcf33'; roundRect(656, 398, 116, 34, 8); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
  txt('PLAY ▶', 714, 420, 10, '#231a00', 'center', null);
  if (maxSel > 0 || true) { ctx.font = '700 11px Nunito, sans-serif'; ctx.fillStyle = '#cfd0ff'; ctx.textAlign = 'right'; ctx.fillText(IS_TOUCH ? 'Tap a level, then PLAY' : '← → choose · Enter play', 640, 430); }
}

/* ---------- boss battle ---------- */
const B = {};
const WORDS = ['BORING', 'BLAND', 'DULL', 'YAWN', 'CLICHÉ', 'MEH', 'SNORE', 'SO-SO'];
const BOSS_INTRO = ['Hahaha! You solved my little riddles… how ADORABLE!', 'Princess Prosa is locked in my CAGE OF CLICHÉS. One bar for every riddle spell!', 'Dodge my DULL WORDS, answer my spells… if you can!'];
const CAGE = { x: 330, top: 70, w: 130, h: 120 };
const NB = BOSS_RIDDLES.length;                          // rounds = cage bars = riddles
const ROUND_DUR = [330, 340, 350, 360, 370, 380, 390], BOMB_EVERY = [76, 68, 62, 56, 50, 46, 42];
const D = r => Math.round(r * 6 / Math.max(1, NB - 1));   // spread the difficulty tables over however many rounds there are
function startBoss() {
  G.L = makeLevel(ARENA_DEF); G.theme = THEMES.castle; G.cam = 0; G.parts = []; G.enemies = []; G.items = []; G.hearts = MAXH;
  G.p = newPlayer(70, 12 * T - 32); G.shake = 0;
  Object.assign(B, { round: 0, bars: Array(NB).fill(true), phase: 'intro', timer: 0, bombs: [], warns: [], waves: [], blasts: [], waveWarn: 0, spawnT: 0, wx: 640, wy: 170, wshake: 0, wflash: 0,
    hammer: null, bubble: '', bubbleT: 0, cageDy: 0, princess: null, gone: false });
  setMode('boss');
}
function startRound(n) {
  B.round = n; B.phase = 'ready'; B.timer = 0; B.bombs = []; B.warns = []; B.waves = []; B.blasts = []; B.waveWarn = 0; B.spawnT = 50;
  B.bubble = BOSS_RIDDLES[n].taunt; B.bubbleT = 110;
}
function lobBomb(offset = 0) {
  const tx = clamp(G.p.x + G.p.w / 2 + offset + (Math.random() - 0.5) * 120, 24, W - 24), sx = B.wx - 40, sy = B.wy, gy = 12 * T - 14, Tf = 64, g = 0.22;
  B.bombs.push({ x: sx, y: sy, vx: (tx - sx) / Tf, vy: (gy - sy - g * Tf * (Tf + 1) / 2) / Tf, g, tx, gy, word: WORDS[Math.floor(Math.random() * WORDS.length)], t: 0 });
  B.warns.push({ x: tx, t: Tf }); Sfx.warn();
}
function bossHurt(srcX) { const p = G.p; if (p.inv > 0) return; const dead = loseHeart(); p.inv = 100; p.vy = -6; p.vx = (p.x + p.w / 2 < srcX ? -1 : 1) * 4; burst(p.x + 10, p.y + 14, '#ff3b5c', 8); if (dead) { B.phase = 'failwait'; failLevel(); } }
function updBoss() {
  const p = G.p, L = G.L, t = G.t, r = B.round;
  if (B.phase !== 'failwait') updatePlayer(p, L);
  if (p.y > H + 40) { p.x = 70; p.y = 12 * T - 32; p.vy = 0; }
  if (!B.gone) B.wx = 640 + Math.sin(t * 0.025) * 36; B.wy = 170 + Math.sin(t * 0.04) * 16 + (B.phase === 'defeat' ? B.fall || 0 : 0);
  if (B.wshake > 0) B.wshake--; if (B.wflash > 0) B.wflash--; if (B.bubbleT > 0) B.bubbleT--;
  B.timer++;
  const ph = B.phase;
  if (ph === 'intro') {
    const line = Math.floor(B.timer / 150);
    if (line >= BOSS_INTRO.length) startRound(0);
    else { B.bubble = BOSS_INTRO[line]; B.bubbleT = 9999; if (ctl.confirm() && B.timer > 20) B.timer = (line + 1) * 150; }
  } else if (ph === 'ready') {
    if (B.timer > 80) { B.phase = 'dodge'; B.timer = 0; }
  } else if (ph === 'dodge' || ph === 'cast') {
    if (ph === 'dodge') {
      if (--B.spawnT <= 0) { B.spawnT = BOMB_EVERY[D(r)]; lobBomb(); if (D(r) >= 4) lobBomb(Math.random() < 0.5 ? -110 : 110); }
      if (D(r) >= 3) { if (B.waveWarn > 0) { if (--B.waveWarn === 0) B.waves.push({ x: W + 40, w: 60, h: 24 }); } else if (B.timer % 170 === 100) { B.waveWarn = 50; Sfx.warn(); } }
      if (B.timer >= ROUND_DUR[D(r)]) { B.phase = 'cast'; B.timer = 0; B.waves = []; B.waveWarn = 0; B.bubble = 'Riddle spell… TIME!'; B.bubbleT = 80; }
    } else if (B.timer > 85 && !B.bombs.length && !B.waves.length) { B.phase = 'riddle'; castSpell(); }
    // hazards
    for (const b of B.bombs) {
      b.t++; b.x += b.vx; b.vy += b.g; b.y += b.vy;
      if (b.y >= b.gy) { b.dead = true; B.blasts.push({ x: b.tx, y: b.gy, t: 16 }); burst(b.tx, b.gy, '#ff9a3a', 12, 3.5); Sfx.explode(); G.shake = 6; }
      else if (rectsHit(p, { x: b.x - 13, y: b.y - 13, w: 26, h: 26 })) { b.dead = true; burst(b.x, b.y, '#ff9a3a', 10, 3); bossHurt(b.x); }
    }
    B.bombs = B.bombs.filter(b => !b.dead);
    for (const bl of B.blasts) { bl.t--; if (bl.t > 5 && rectsHit(p, { x: bl.x - 30, y: bl.y - 34, w: 60, h: 40 })) bossHurt(bl.x); }
    B.blasts = B.blasts.filter(bl => bl.t > 0);
    for (const w of B.waves) { w.x -= 3.4; if (rectsHit(p, { x: w.x, y: 12 * T - w.h, w: w.w, h: w.h })) bossHurt(w.x + 30); }
    B.waves = B.waves.filter(w => w.x > -80);
    for (const wn of B.warns) wn.t--; B.warns = B.warns.filter(wn => wn.t > 0);
  } else if (ph === 'strike') {
    const h = B.hammer; h.t++;
    const k = clamp(h.t / 38, 0, 1); h.x = lerp(h.sx, B.wx, k); h.y = lerp(h.sy, B.wy, k) - Math.sin(k * Math.PI) * 70;
    if (h.t === 38) {
      B.wflash = 34; B.wshake = 46; B.bars[r] = false; Sfx.bossHit(); G.shake = 16;
      burst(B.wx, B.wy, '#ffd23f', 26, 5);
      const bx = CAGE.x - CAGE.w / 2 + (r + 0.5) * CAGE.w / NB; burst(bx, CAGE.top + 60, '#cfcfe8', 16, 4);
      floatText(CAGE.x, CAGE.top - 18, DEVICES[BOSS_RIDDLES[r].device].name.toUpperCase() + '!', '#ffd23f', 11);
      B.bubble = BOSS_HIT_LINES[r]; B.bubbleT = 100;
    }
    if (h.t > 125) { if (r >= NB - 1) { B.phase = 'defeat'; B.timer = 0; B.fall = 0; } else startRound(r + 1); }
  } else if (ph === 'defeat') {
    const k = B.timer;
    if (k === 1) { B.bubble = 'My words… have no POWER…!'; B.bubbleT = 150; }
    if (k > 90) { B.fall = (B.fall || 0) + Math.min(14, (k - 90) * 0.18); if (B.fall > 420) B.gone = true; }
    if (k > 150 && B.cageDy < 192) { B.cageDy = Math.min(192, B.cageDy + 3); if (B.cageDy >= 192 && !B.princess) { B.princess = { x: CAGE.x, t: 0 }; Sfx.win(); } }
    if (B.princess) { B.princess.t++; const tx = p.x + p.w / 2 + 34; if (B.princess.t > 40) B.princess.x += clamp((tx - B.princess.x) * 0.04, -1.6, 1.6); if (B.princess.t % 14 === 0) { G.parts.push({ x: B.princess.x + (Math.random() - 0.5) * 80, y: 330, vx: 0, vy: -1.2, life: 60, max: 60, text: '♥', color: '#ff5d8a', size: 14, grav: 0 }); } }
    if (k > 420) showWin();
  } else if (ph === 'win') {
    if (G.t % 3 === 0) G.parts.push({ x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 2, life: 260, max: 260, color: ['#ffd23f', '#ff5d8a', '#4aa3ff', '#3ed36a', '#fff'][Math.floor(Math.random() * 5)], size: 5, grav: 0.02 });
  }
  if (B.phase !== 'win' && B.phase !== 'defeat' && B.phase !== 'strike') { /* nothing */ }
  if (B.princess && ph === 'win') B.princess.t++;
  if (G.shake > 0) G.shake--;
  updParts();
}
function castSpell() {
  const r = BOSS_RIDDLES[B.round];
  G.p.vx = 0; B.bubbleT = 0;
  openRiddle({ tag: `WARERIO’S RIDDLE SPELL · ROUND ${B.round + 1}/${NB}`, riddle: r,
    onSolved() { B.phase = 'strike'; B.timer = 0; B.hammer = { t: 0, sx: G.p.x + 10, sy: G.p.y, x: G.p.x, y: G.p.y, name: DEVICES[r.device].name }; Sfx.flag(); },
    onDead() { B.phase = 'failwait'; failLevel(); } });
}
function showWin() {
  B.phase = 'win'; save.cleared = LEVEL_DEFS.length; save.won = true; persist();
  const n = Object.keys(DEVICES).filter(k => save.codex[k]).length;
  $('winText').textContent = `Rhetorio and Princess Prosa are reunited and Warerio’s Castle of Clichés crumbles. You collected ${G.coins} coins and unlocked ${n} of ${Object.keys(DEVICES).length} stylistic devices in the Codex. Brilliant rhetoric!`;
  setMode('win'); Sfx.stop(); Sfx.win();
}
function wrapText(s, maxW) {
  ctx.font = '800 14px Nunito, sans-serif'; const words = s.split(' '), lines = []; let line = '';
  for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; }
  lines.push(line); return lines;
}
function speech(x, y, text, alpha = 1) {
  const lines = wrapText(text, 240), bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24, bh = lines.length * 18 + 16;
  const bx = clamp(x - bw, 8, W - bw - 8), by = clamp(y - bh, 40, 300);
  ctx.globalAlpha = alpha; ctx.fillStyle = '#fff'; roundRect(bx, by, bw, bh, 10); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw - 30, by + bh); ctx.lineTo(bx + bw - 8, by + bh + 14); ctx.lineTo(bx + bw - 14, by + bh); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.fillStyle = '#1b1740'; ctx.font = '800 14px Nunito, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  lines.forEach((l, i) => ctx.fillText(l, bx + 12, by + 22 + i * 18)); ctx.globalAlpha = 1;
}
function drawCage() {
  const x0 = CAGE.x - CAGE.w / 2, y0 = CAGE.top + B.cageDy, y1 = y0 + CAGE.h;
  if (B.cageDy === 0) { ctx.fillStyle = '#8a8a9a'; for (let y = 0; y < y0 - 8; y += 10) ctx.fillRect(CAGE.x - 2, y, 4, 7); }
  ctx.fillStyle = 'rgba(20,10,30,.6)'; ctx.fillRect(x0, y0, CAGE.w, CAGE.h);
  if (!B.princess) drawPrincess(CAGE.x, y1 - 8, G.t, true, 1);
  for (let i = 0; i < NB; i++) if (B.bars[i]) { const bx = x0 + (i + 0.5) * CAGE.w / NB; ctx.fillStyle = '#2f2f40'; ctx.fillRect(bx - 4, y0, 8, CAGE.h); ctx.fillStyle = '#a8a8c4'; ctx.fillRect(bx - 3, y0, 3, CAGE.h); }
  ctx.fillStyle = '#000'; ctx.fillRect(x0 - 8, y0 - 10, CAGE.w + 16, 14); ctx.fillRect(x0 - 8, y1 - 4, CAGE.w + 16, 14);
  ctx.fillStyle = '#ffcf33'; ctx.fillRect(x0 - 6, y0 - 8, CAGE.w + 12, 10); ctx.fillRect(x0 - 6, y1 - 2, CAGE.w + 12, 10);
  ctx.fillStyle = '#fff6a8'; ctx.fillRect(x0 - 6, y0 - 8, CAGE.w + 12, 3);
}
function drawWarerio() {
  if (B.gone) return;
  const sx = B.wshake > 0 ? (Math.random() - 0.5) * 8 : 0, flash = B.wflash > 0 && Math.floor(B.wflash / 3) % 2;
  const x = B.wx + sx, y = B.wy + 40;
  // storm cloud he rides on
  ctx.fillStyle = '#2a1840'; ctx.beginPath(); ctx.ellipse(x, y + 6, 70, 16, 0, 0, TAU); ctx.ellipse(x - 40, y + 2, 30, 14, 0, 0, TAU); ctx.ellipse(x + 40, y + 2, 32, 14, 0, 0, TAU); ctx.fill();
  if (G.t % 40 < 5) { ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 20, y + 18); ctx.lineTo(x - 28, y + 32); ctx.lineTo(x - 18, y + 34); ctx.lineTo(x - 26, y + 48); ctx.stroke(); }
  const casting = B.phase === 'cast' || B.phase === 'riddle';
  if (casting) { for (let i = 0; i < 6; i++) { const a = G.t * 0.08 + i * TAU / 6; txt('?!§#µ&'[i], x + Math.cos(a) * 80, y - 40 + Math.sin(a) * 40, 14, '#ff6fd8', 'center'); } }
  const o = Object.assign({ facing: -1, pose: 'idle', t: G.t, s: 2.2 }, VILLAIN);
  if (flash) Object.assign(o, { cap: '#fff', shirt: '#fff', overalls: '#fff', skin: '#fff', capDark: '#fff', shoe: '#fff', hair: '#fff' });
  drawPlumber(x, y - 4 + (casting ? Math.sin(G.t * 0.4) * 2 : 0), o);
}
function drawBoss() {
  const t = G.t, cam = 0;
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
  drawBackground('castle', t * 0.0, t);
  // throne-room banner
  ctx.fillStyle = '#6a1a2a'; ctx.fillRect(560, 0, 160, 28); ctx.beginPath(); ctx.moveTo(560, 28); ctx.lineTo(640, 80); ctx.lineTo(720, 28); ctx.fill();
  drawLiquid(G.theme, 0, t);
  drawTiles(G.L, G.theme, 0, t);
  drawCage();
  // warnings
  for (const wn of B.warns) { const a = 0.35 + Math.abs(Math.sin(wn.t * 0.3)) * 0.5; ctx.fillStyle = `rgba(255,60,60,${a})`; ctx.beginPath(); ctx.ellipse(wn.x, 12 * T - 2, 28, 7, 0, 0, TAU); ctx.fill(); txt('!', wn.x, 12 * T - 8, 12, '#fff', 'center'); }
  if (B.waveWarn > 0) { const a = 0.4 + Math.abs(Math.sin(B.waveWarn * 0.3)) * 0.6; txt('◀ WAVE!', W - 14, 12 * T - 30, 10, `rgba(255,120,200,${a})`, 'right'); }
  drawWarerio();
  for (const b of B.bombs) {
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(b.x, b.y, 14, 0, TAU); ctx.fill(); ctx.strokeStyle = '#6a6a8a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(b.x - 5, b.y - 5, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b8903f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b.x + 4, b.y - 12); ctx.quadraticCurveTo(b.x + 10, b.y - 20, b.x + 14, b.y - 18); ctx.stroke();
    ctx.fillStyle = Math.random() < 0.5 ? '#ffd23f' : '#ff7a1a'; ctx.beginPath(); ctx.arc(b.x + 14, b.y - 18, 3, 0, TAU); ctx.fill();
    txt(b.word, b.x, b.y - 24, 8, '#ff9aa8', 'center');
  }
  for (const w of B.waves) {
    const y = 12 * T; ctx.fillStyle = '#3b1f6e'; ctx.beginPath(); ctx.moveTo(w.x, y); ctx.quadraticCurveTo(w.x + 6, y - 34, w.x + 34, y - 20); ctx.quadraticCurveTo(w.x + 48, y - 10, w.x + 60, y); ctx.fill();
    ctx.fillStyle = '#7b5ad6'; ctx.beginPath(); ctx.arc(w.x + 20, y - 18, 4, 0, TAU); ctx.fill(); txt('ZZZ', w.x + 30, y - 4, 7, '#fff', 'center', null);
  }
  for (const bl of B.blasts) { const k = 1 - bl.t / 16; ctx.fillStyle = `rgba(255,${160 - k * 80},40,${1 - k})`; ctx.beginPath(); ctx.ellipse(bl.x, bl.y, 14 + k * 34, 8 + k * 26, 0, 0, TAU); ctx.fill(); }
  if (B.hammer && B.phase === 'strike' && B.hammer.t <= 38) {
    const h = B.hammer; ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.t * 0.4);
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5, r = i % 2 ? 9 : 22; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    txt(h.name, h.x, h.y - 30, 8, '#fff3a8', 'center');
  }
  if (B.princess) {
    const pr = B.princess; if (G.mode === 'win') { /* keep waving */ }
    drawPrincess(pr.x, 12 * T, t, true, 1);
  }
  if (B.phase !== 'defeat' || true) { if (!(B.phase === 'win' && false)) { ctx.save(); drawHero(G.p, t); ctx.restore(); } }
  drawParts(0);
  if (B.bubbleT > 0 && !B.gone) speech(B.wx - 40, B.wy - 60, B.bubble, clamp(B.bubbleT / 20, 0, 1));
  ctx.restore();
  drawHUD(true);
  // boss bar
  const bx = 360, bw = 250; txt('WARERIO', bx - 10, 24, 9, '#ff9aa8', 'right');
  for (let i = 0; i < NB; i++) { ctx.fillStyle = '#000'; ctx.fillRect(bx + i * (bw / NB) - 1, 12, bw / NB + 1, 14); ctx.fillStyle = B.bars[NB - 1 - i] ? '#ff3b5c' : '#3c2a4d'; ctx.fillRect(bx + i * (bw / NB) + 1, 14, bw / NB - 3, 10); }
  txt(`ROUND ${Math.min(B.round + 1, NB)}/${NB}`, 24, 52, 9, '#ffd23f', 'left');
  if (B.phase === 'ready') { const a = clamp(Math.min(B.timer / 15, (80 - B.timer) / 15), 0, 1); ctx.globalAlpha = a; txt(`ROUND ${B.round + 1}`, 400, 238, 26, '#ffd23f', 'center'); txt('Dodge the Dull Words!', 400, 266, 10, '#fff', 'center'); ctx.globalAlpha = 1; }
  if (B.phase === 'dodge') { const f = 1 - B.timer / ROUND_DUR[D(B.round)]; ctx.fillStyle = '#000'; ctx.fillRect(250, 36, 300, 8); ctx.fillStyle = '#9fe3ff'; ctx.fillRect(252, 38, 296 * f, 4); }
  if (B.phase === 'intro') txt(IS_TOUCH ? 'Tap ▶ skip' : 'Enter / Space ▶ skip', 400, 300, 8, '#fff', 'center');
}

/* ---------- title / ambient ---------- */
function drawTitle() {
  const t = G.t, cam = t * 1.2, th = THEMES.meadow;
  drawBackground('meadow', cam, t);
  const off = cam % T, c0 = Math.floor(cam / T);
  for (let i = 0; i <= 26; i++) { drawTile(1, i * T - off, 12 * T, th, c0 + i, 12, false, t); drawTile(1, i * T - off, 13 * T, th, c0 + i, 13, true, t); }
  drawPlumber(130, 12 * T, Object.assign({ facing: 1, pose: 'run', t, s: 1.15 }, HERO));
  // Warerio running away with the caged princess
  const bob = Math.abs(Math.sin(t * 0.2)) * 3;
  drawPlumber(640, 12 * T - bob, Object.assign({ facing: 1, pose: 'run', t, s: 1.7 }, VILLAIN));
  ctx.save(); ctx.translate(574, 296 - bob); ctx.fillStyle = 'rgba(20,10,30,.6)'; ctx.fillRect(-34, -20, 68, 60);
  drawPrincess(0, 36, t, true, 0.7);
  ctx.fillStyle = '#ffcf33'; ctx.fillRect(-38, -24, 76, 6); ctx.fillRect(-38, 38, 76, 6);
  ctx.fillStyle = '#2f2f40'; for (let i = 0; i < 6; i++) ctx.fillRect(-30 + i * 12, -20, 4, 60);
  ctx.restore();
  if (Math.floor(t / 45) % 2) { ctx.fillStyle = '#fff'; roundRect(500, 236 - bob, 78, 26, 8); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.stroke(); txt('HELP!', 539, 255 - bob, 10, '#e8302b', 'center', null); }
}
function drawAmbient() { if (G.prevMode === 'boss') drawBoss(); else drawPlay(); }

/* ---------- flow / ui wiring ---------- */
function goMap() { RU.open = false; $('riddle').classList.add('hidden'); G.mapAnim = null; G.sel = clamp(G.sel, 0, Math.min(save.cleared, LAST)); setMode('map'); }
function newGame() { save = { cleared: 0, codex: {}, won: false }; persist(); G.coins = 0; G.scrolls = 0; G.sel = 0; setMode('story'); }
$('btnNew').addEventListener('click', () => { Sfx.ensure(); if (save.cleared > 0 && !confirm('Start a new game? Your saved progress will be erased.')) return; newGame(); });
$('btnCont').addEventListener('click', () => { Sfx.ensure(); G.sel = Math.min(save.cleared, LAST); setMode('map'); });
$('btnGo').addEventListener('click', () => { G.sel = 0; setMode('map'); });
$('btnCodex').addEventListener('click', openCodex);
$('bCodex').addEventListener('click', openCodex);
$('btnWinCodex').addEventListener('click', openCodex);
$('btnCodexClose').addEventListener('click', closeCodex);
$('bMap').addEventListener('click', () => { if (G.mode === 'play' || G.mode === 'boss' || G.mode === 'clearing') { Sfx.click(); G.sel = clamp(G.mode === 'boss' ? LAST : G.idx, 0, LAST); goMap(); } });
$('bMute').addEventListener('click', () => { Sfx.ensure(); const m = Sfx.toggle(); $('bMute').textContent = m ? '🔇' : '🔊'; if (!m) setMode(G.mode); });
$('btnRetry').addEventListener('click', () => {
  Sfx.ensure();
  if (G.failCtx === 'boss') { G.hearts = MAXH; G.p = newPlayer(70, 12 * T - 32); G.parts = []; setMode('boss'); startRound(B.round); }
  else startLevel(G.idx);
});
$('btnFailMap').addEventListener('click', () => { G.sel = clamp(G.failCtx === 'boss' ? LAST : G.idx, 0, LAST); goMap(); });
$('btnWinMap').addEventListener('click', () => { G.sel = LAST; goMap(); });
canvas.addEventListener('pointerdown', e => {
  Sfx.ensure();
  if (G.mode === 'boss' && B.phase === 'intro' && B.timer > 20) { B.timer = (Math.floor(B.timer / 150) + 1) * 150; return; }
  if (G.mode !== 'map' || G.mapAnim) return;
  const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  if (x > 656 && x < 772 && y > 398 && y < 432) { startLevel(G.sel); return; }
  NODES.forEach(([nx, ny], i) => { if (Math.hypot(nx - x, ny - y) < 26 && i <= save.cleared) { if (G.sel === i) startLevel(i); else { G.sel = i; Sfx.click(); } } });
});
canvas.addEventListener('pointermove', e => {
  if (G.mode !== 'map') return; const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  G.mapHover = x > 656 && x < 772 && y > 398 && y < 432;
});

function onKey(e) {
  if (RU.open) {
    const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code];
    if (n !== undefined) pickOpt(n);
    else if ((e.code === 'Enter' || e.code === 'Space') && RU.done) riddleNext();
    delete pressed[e.code]; return;
  }
  if (G.codexOpen) { if (e.code === 'Escape' || e.code === 'Enter') closeCodex(); delete pressed[e.code]; return; }
  if (e.code === 'Escape' && (G.mode === 'play' || G.mode === 'boss')) { $('bMap').click(); return; }
  if (G.mode === 'title' && e.code === 'Enter') { if (save.cleared > 0) $('btnCont').click(); else newGame(); delete pressed[e.code]; }
  else if (G.mode === 'story' && (e.code === 'Enter' || e.code === 'Space')) { $('btnGo').click(); delete pressed[e.code]; }
  else if ((G.mode === 'fail') && e.code === 'Enter') $('btnRetry').click();
}

/* ---------- main loop ---------- */
function update() {
  G.t++;
  if (isPaused()) return;
  switch (G.mode) {
    case 'map': updMap(); break;
    case 'play': updPlay(); break;
    case 'clearing': updClearing(); break;
    case 'boss': updBoss(); break;
    case 'win': updBoss(); break;
  }
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  switch (G.mode) {
    case 'title': case 'story': drawTitle(); break;
    case 'map': drawMap(); break;
    case 'play': case 'clearing': drawPlay(); break;
    case 'boss': case 'win': drawBoss(); break;
    case 'fail': drawAmbient(); break;
  }
}
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw();
  for (const k in pressed) delete pressed[k];
  requestAnimationFrame(frame);
}
setMode('title');
requestAnimationFrame(frame);

// tiny debug/test hook (also handy for teachers to jump to a level: RE.start(3))
window.RE = { start: i => startLevel(i), boss: () => { startBoss(); }, G, B, save: () => save, unlockAll: () => { save.cleared = LAST; persist(); } };
})();
