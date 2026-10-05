/* ------------------------------------------------------------------
   Rhetoric Escape – rendering: sprites, backgrounds, tiles
   Everything is drawn procedurally with canvas primitives (no image files).
   ------------------------------------------------------------------ */

const W = 800, H = 448, TAU = Math.PI * 2;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const rand = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- text & small shapes ---------- */
function txt(s, x, y, size, color = '#fff', align = 'left', stroke = '#000', font = '"Press Start 2P", monospace') {
  ctx.font = size + 'px ' + font; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if (stroke) { ctx.lineWidth = Math.max(3, size / 3); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function heart(x, y, s, full) {
  ctx.fillStyle = full ? '#ff3b5c' : '#3c2a4d';
  ctx.beginPath(); ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.1, y + s * 0.2, x - s * 0.6, y - s * 0.5, x, y + s * 0.05);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 0.5, x + s * 1.1, y + s * 0.2, x, y + s * 0.9);
  ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
  if (full) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x - s * 0.55, y + s * 0.12, s * 0.22, s * 0.2); }
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ---------- characters ---------- */
/* Shared plumber-style body. (cx, by) = bottom centre. o: facing, pose, t, colours, s (scale), sx (width factor), evil */
function drawPlumber(cx, by, o) {
  const s = o.s || 1;
  ctx.save(); ctx.translate(cx, by); ctx.scale(o.facing * (o.sx || 1) * s, s);
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const step = o.pose === 'run' ? Math.floor(o.t / 5) % 2 : 0;
  const ov = o.overalls, shoe = o.shoe || '#5a3216', sh = o.shirt, skin = o.skin;
  // legs + shoes
  if (o.pose === 'jump') { R(-9, -11, 7, 7, ov); R(2, -13, 7, 7, ov); R(-13, -5, 11, 5, shoe); R(3, -8, 11, 5, shoe); }
  else if (o.pose === 'run') {
    if (step) { R(-9, -11, 7, 7, ov); R(2, -11, 7, 6, ov); R(-13, -5, 11, 5, shoe); R(3, -5, 11, 5, shoe); }
    else { R(-7, -11, 6, 7, ov); R(1, -11, 6, 7, ov); R(-9, -4, 9, 4, shoe); R(0, -4, 9, 4, shoe); }
  } else { R(-8, -11, 6, 7, ov); R(2, -11, 6, 7, ov); R(-11, -4, 10, 4, shoe); R(1, -4, 10, 4, shoe); }
  // torso: shirt + overalls
  R(-8, -24, 16, 15, sh); R(-8, -16, 16, 8, ov); R(-6, -17, 12, 9, ov);
  R(-6, -23, 3, 8, ov); R(3, -23, 3, 8, ov);
  R(-5, -17, 2, 2, '#ffd23f'); R(3, -17, 2, 2, '#ffd23f');
  // arms
  if (o.pose === 'jump') { R(-13, -24, 5, 8, sh); R(-13, -17, 5, 4, '#fff'); R(8, -33, 5, 11, sh); R(8, -37, 5, 5, '#fff'); }
  else if (o.pose === 'run') { const a = step ? 3 : -3; R(-13, -23 + a, 5, 8, sh); R(-13, -15 + a, 5, 4, '#fff'); R(8, -23 - a, 5, 8, sh); R(8, -15 - a, 5, 4, '#fff'); }
  else { R(-13, -23, 5, 9, sh); R(-13, -14, 5, 4, '#fff'); R(8, -23, 5, 9, sh); R(8, -14, 5, 4, '#fff'); }
  // head
  R(-8, -36, 16, 13, skin);
  R(-9, -34, 4, 9, o.hair || '#4a2410');
  R(7, -30, 5, 5, skin);                       // nose
  // eye
  R(3, -33, 4, 6, '#fff'); R(5, -31, 2, 4, '#111');
  // moustache
  R(2, -25, 11, 3, o.hair || '#4a2410');
  if (o.evil) { // angry brow + fangs
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(0, -37); ctx.lineTo(8, -32); ctx.lineTo(8, -35); ctx.lineTo(2, -39); ctx.fill();
    R(3, -22, 8, 2, '#fff'); R(4, -20, 2, 2, '#fff'); R(8, -20, 2, 2, '#fff');
  }
  // cap
  R(-9, -41, 18, 7, o.cap); R(-9, -41, 18, 2, o.capDark || o.cap); R(2, -36, 12, 3, o.cap);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -38, 4, 0, TAU); ctx.fill();
  ctx.fillStyle = o.cap; ctx.font = 'bold 7px "Nunito", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(o.letter || 'R', 0, -37.5);
  ctx.restore();
}
const HERO = { cap: '#e8302b', capDark: '#b81d1a', shirt: '#e8302b', overalls: '#2956d6', skin: '#ffc9a0', letter: 'R' };
const VILLAIN = { cap: '#f4d21f', capDark: '#c9a90f', shirt: '#f4d21f', overalls: '#7a3dc2', skin: '#eaa877', letter: 'W', evil: true, sx: 1.2, shoe: '#3a1f55', hair: '#2b1608' };
function drawHero(p, t) {
  if (p.inv > 0 && Math.floor(p.inv / 4) % 2) return;
  drawPlumber(p.x + p.w / 2, p.y + p.h, Object.assign({ facing: p.facing, pose: p.pose, t: p.t }, HERO));
}
function drawPrincess(cx, by, t, wave = true, scale = 1) {
  ctx.save(); ctx.translate(cx, by); ctx.scale(scale, scale);
  const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  R(-11, -46, 22, 22, '#ffd75e');                 // hair back
  R(-12, -34, 6, 22, '#ffd75e'); R(6, -34, 6, 22, '#ffd75e');
  ctx.fillStyle = '#ff7eb6'; ctx.beginPath(); ctx.moveTo(-8, -26); ctx.lineTo(8, -26); ctx.lineTo(15, 0); ctx.lineTo(-15, 0); ctx.fill();   // dress
  R(-9, -4, 18, 3, '#ffb3d5');
  R(-6, -28, 12, 8, '#ff9ccb');                    // bodice
  const wv = wave ? Math.sin(t * 0.15) * 7 : 0;
  R(-12, -27, 4, 9, '#ffe0c2'); R(8, -27 - 8 + wv * 0.3, 4, 12, '#ffe0c2');   // arms
  R(-7, -42, 14, 14, '#ffe0c2');                   // face
  R(-8, -45, 16, 5, '#ffd75e');                    // fringe
  R(-4, -37, 2, 3, '#222'); R(2, -37, 2, 3, '#222');
  R(-1, -32, 3, 1, '#d4455f');
  R(-5, -34, 2, 1, '#ff8fa3'); R(3, -34, 2, 1, '#ff8fa3');
  ctx.fillStyle = '#ffcf33'; ctx.beginPath();     // crown
  ctx.moveTo(-6, -45); ctx.lineTo(-6, -52); ctx.lineTo(-3, -48); ctx.lineTo(0, -54); ctx.lineTo(3, -48); ctx.lineTo(6, -52); ctx.lineTo(6, -45); ctx.fill();
  ctx.fillStyle = '#ff3b5c'; ctx.fillRect(-1, -50, 2, 2);
  ctx.restore();
}

/* ---------- enemies ---------- */
function drawBlot(e, t) {
  const { x, y, w, h } = e, big = e.type === 'big', spike = e.type === 'spike';
  ctx.save(); ctx.translate(x + w / 2, y + h);
  if (e.dead) ctx.scale(1.25, 0.3);
  const flash = e.flash > 0 && Math.floor(e.flash / 3) % 2;
  const body = flash ? '#fff' : big ? '#8a1d44' : spike ? '#5d1f78' : '#2d1b55';
  const wob = Math.sin(e.t * 0.25) * 1.5;
  // feet
  const f = Math.floor(e.t / 8) % 2;
  ctx.fillStyle = '#16102e';
  ctx.beginPath(); ctx.ellipse(-w * 0.25 + (f ? 3 : -2), -3, w * 0.2, 4, 0, 0, TAU); ctx.ellipse(w * 0.25 + (f ? -2 : 3), -3, w * 0.2, 4, 0, 0, TAU); ctx.fill();
  // body
  ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -h * 0.5 - 2, w * 0.5 + wob * 0.3, h * 0.5 - 1 - wob * 0.3, 0, 0, TAU); ctx.fill();
  if (spike) {
    ctx.fillStyle = '#e9e5ff';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.16 - 5, -h * 0.82); ctx.lineTo(i * w * 0.16, -h * 1.12 + Math.abs(i) * 3); ctx.lineTo(i * w * 0.16 + 5, -h * 0.82); ctx.fill(); }
  }
  ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(-w * 0.2, -h * 0.75, w * 0.14, h * 0.09, -0.5, 0, TAU); ctx.fill();
  // angry eyes
  const ex = w * 0.19, ey = -h * 0.55, er = Math.max(4, w * 0.13);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-ex, ey, er, er * 1.15, 0, 0, TAU); ctx.ellipse(ex, ey, er, er * 1.15, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-ex + e.dir * er * 0.35, ey + 1, er * 0.5, 0, TAU); ctx.arc(ex + e.dir * er * 0.35, ey + 1, er * 0.5, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = big ? 4 : 3;
  ctx.beginPath(); ctx.moveTo(-ex - er, ey - er * 1.4); ctx.lineTo(-ex + er * 0.9, ey - er * 0.7); ctx.moveTo(ex + er, ey - er * 1.4); ctx.lineTo(ex - er * 0.9, ey - er * 0.7); ctx.stroke();
  ctx.restore();
}
function drawBat(e, t) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2, fl = Math.sin(e.t * 0.35);
  ctx.save(); ctx.translate(cx, cy);
  if (e.dead) ctx.scale(1, 0.35);
  ctx.fillStyle = e.flash > 0 ? '#fff' : '#3b2466';
  ctx.beginPath(); ctx.moveTo(-3, 0); ctx.quadraticCurveTo(-18, -14 * fl - 4, -22, 4 - 6 * fl); ctx.quadraticCurveTo(-14, 2, -9, 8); ctx.quadraticCurveTo(-5, 3, -3, 8); ctx.fill();
  ctx.beginPath(); ctx.moveTo(3, 0); ctx.quadraticCurveTo(18, -14 * fl - 4, 22, 4 - 6 * fl); ctx.quadraticCurveTo(14, 2, 9, 8); ctx.quadraticCurveTo(5, 3, 3, 8); ctx.fill();
  ctx.fillStyle = '#4c2f85'; ctx.beginPath(); ctx.ellipse(0, 2, 8, 9, 0, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-7, -4); ctx.lineTo(-5, -12); ctx.lineTo(-1, -6); ctx.moveTo(7, -4); ctx.lineTo(5, -12); ctx.lineTo(1, -6); ctx.fill();
  ctx.fillStyle = '#ffe14d'; ctx.fillRect(-5, -1, 3, 3); ctx.fillRect(2, -1, 3, 3);
  ctx.fillStyle = '#fff'; ctx.fillRect(-2, 6, 1, 2); ctx.fillRect(1, 6, 1, 2);
  ctx.restore();
}
function drawEnemy(e, t) { (e.type === 'bat' ? drawBat : drawBlot)(e, t); }

/* ---------- pickups ---------- */
function drawCoin(x, y, t, ph) {
  const w = Math.abs(Math.cos(t * 0.07 + ph)) * 8 + 2;
  ctx.fillStyle = '#c98a0b'; ctx.beginPath(); ctx.ellipse(x, y, w + 1.5, 10.5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.ellipse(x, y, w, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.ellipse(x - w * 0.2, y - 2, Math.max(1, w * 0.3), 4, 0, 0, TAU); ctx.fill();
}
function drawScroll(x, y, t) {
  const b = Math.sin(t * 0.08) * 3; y += b;
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255,240,150,.25)'; ctx.beginPath(); ctx.arc(0, 0, 17 + Math.sin(t * 0.1) * 2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f7e6b4'; ctx.fillRect(-10, -7, 20, 14);
  ctx.fillStyle = '#d9b667'; ctx.beginPath(); ctx.ellipse(-10, 0, 3.5, 8, 0, 0, TAU); ctx.ellipse(10, 0, 3.5, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b8903f'; ctx.beginPath(); ctx.ellipse(-10, 0, 1.5, 4, 0, 0, TAU); ctx.ellipse(10, 0, 1.5, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#b89a5c'; ctx.fillRect(-6, -3, 12, 1.5); ctx.fillRect(-6, 0.5, 9, 1.5); ctx.fillRect(-6, 4, 11, 1.5);
  ctx.fillStyle = '#e8302b'; ctx.fillRect(-1.5, -8, 3, 16);
  ctx.restore();
}

/* ---------- gate (riddle owl door / boss door) ---------- */
function drawGate(g, camX, t, open) {
  const x = g.c * TILE - camX, y = 9 * TILE, boss = g.type === 'boss';
  // arch
  ctx.fillStyle = boss ? '#2a1a3a' : '#9a97b8';
  roundRect(x - 8, y - 14, 80, 110, 20); ctx.fill();
  ctx.fillRect(x - 8, y + 20, 80, 76);
  ctx.fillStyle = boss ? '#44284f' : '#b9b6d6'; ctx.fillRect(x - 8, y + 20, 5, 76); ctx.fillRect(x + 67, y + 20, 5, 76);
  // opening
  const grad = ctx.createLinearGradient(0, y, 0, y + 96);
  if (open > 0) { grad.addColorStop(0, '#fff7b0'); grad.addColorStop(1, '#ffd35a'); } else { grad.addColorStop(0, '#120a24'); grad.addColorStop(1, '#241540'); }
  ctx.fillStyle = grad; roundRect(x, y, 64, 96, 16); ctx.fill(); ctx.fillRect(x, y + 20, 64, 76);
  // door panels sliding apart
  const pw = 32 * (1 - open);
  if (pw > 0.5) {
    ctx.fillStyle = boss ? '#5a1a26' : '#4a3a8c';
    ctx.save(); roundRect(x, y, 64, 96, 16); ctx.clip();
    ctx.fillRect(x, y, pw, 96); ctx.fillRect(x + 64 - pw, y, pw, 96);
    ctx.fillStyle = boss ? '#7a2434' : '#6a58c0'; ctx.fillRect(x + 3, y + 4, Math.max(0, pw - 6), 88); ctx.fillRect(x + 67 - pw, y + 4, Math.max(0, pw - 6), 88);
    ctx.restore();
    if (open < 0.4) {
      const glow = 0.6 + Math.sin(t * 0.1) * 0.4;
      if (boss) txt('W', x + 32, y + 62, 30, `rgba(255,207,51,${glow})`, 'center', '#000');
      else txt('?', x + 32, y + 62, 32, `rgba(255,236,120,${glow})`, 'center', '#000');
    }
  }
  if (boss) { // flames
    for (let i = 0; i < 2; i++) {
      const fx = x - 20 + i * 104, fl = Math.sin(t * 0.3 + i) * 3;
      ctx.fillStyle = '#6b6b80'; ctx.fillRect(fx - 3, y + 30, 6, 30);
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(fx - 8, y + 30); ctx.quadraticCurveTo(fx, y - 4 + fl, fx + 8, y + 30); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(fx - 4, y + 30); ctx.quadraticCurveTo(fx, y + 8 + fl, fx + 4, y + 30); ctx.fill();
    }
  } else { // wise owl
    const ox = x + 32, oy = y - 22, blink = Math.floor(t / 150) % 4 === 0 && t % 150 < 8;
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.ellipse(ox, oy, 19, 22, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#e9c98e'; ctx.beginPath(); ctx.ellipse(ox, oy + 6, 11, 14, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.moveTo(ox - 17, oy - 14); ctx.lineTo(ox - 11, oy - 28); ctx.lineTo(ox - 4, oy - 17); ctx.moveTo(ox + 17, oy - 14); ctx.lineTo(ox + 11, oy - 28); ctx.lineTo(ox + 4, oy - 17); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox - 8, oy - 8, 7, 0, TAU); ctx.arc(ox + 8, oy - 8, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox - 8, oy - 8, 7, 0, TAU); ctx.arc(ox + 8, oy - 8, 7, 0, TAU); ctx.stroke();
    if (blink) { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(ox - 15, oy - 15, 14, 8); ctx.fillRect(ox + 1, oy - 15, 14, 8); }
    else { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ox - 8 + Math.sin(t * 0.03) * 2, oy - 8, 3, 0, TAU); ctx.arc(ox + 8 + Math.sin(t * 0.03) * 2, oy - 8, 3, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.moveTo(ox - 3, oy - 2); ctx.lineTo(ox + 3, oy - 2); ctx.lineTo(ox, oy + 5); ctx.fill();
    // little academic cap
    ctx.fillStyle = '#1d1b3a'; ctx.fillRect(ox - 14, oy - 32, 28, 4); ctx.beginPath(); ctx.moveTo(ox - 8, oy - 31); ctx.lineTo(ox - 5, oy - 24); ctx.lineTo(ox + 5, oy - 24); ctx.lineTo(ox + 8, oy - 31); ctx.fill();
    ctx.strokeStyle = '#ffcf33'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ox + 12, oy - 30); ctx.lineTo(ox + 14, oy - 22); ctx.stroke();
  }
}
function drawFlag(f, camX, t) {
  const x = f.c * TILE - camX + 14, y = 12 * TILE;
  ctx.fillStyle = '#d8d8e8'; ctx.fillRect(x, y - 58, 4, 58);
  ctx.fillStyle = '#ffcf33'; ctx.beginPath(); ctx.arc(x + 2, y - 60, 4, 0, TAU); ctx.fill();
  const rise = f.up ? 0 : 34, wave = Math.sin(t * 0.12) * 2;
  ctx.fillStyle = f.up ? '#3ed36a' : '#9a95b8';
  ctx.beginPath(); ctx.moveTo(x + 4, y - 54 + rise); ctx.lineTo(x + 30 + wave, y - 46 + rise); ctx.lineTo(x + 4, y - 36 + rise); ctx.fill();
  if (f.up) txt('✓', x + 14, y - 41 + rise, 9, '#fff', 'center', null);
}

/* ---------- themes ---------- */
const THEMES = {
  meadow: { sky: ['#6ec6ff', '#e3f6ff'], top: '#52c75a', topD: '#3da64a', dirt: '#a2703d', dirt2: '#8a5c30', brick: '#f08a4b', brickD: '#c96a2f', plat: '#d9a05b', platD: '#b57c3a', liquid: '#2f8fe0', liquid2: '#8bd3ff' },
  shore:  { sky: ['#ff9a6c', '#ffe2a8'], top: '#f6dc8b', topD: '#e7c46a', dirt: '#d9b36c', dirt2: '#c49c55', brick: '#4fb7c9', brickD: '#2e93a8', plat: '#9be0e8', platD: '#6bc3cf', liquid: '#1d7fb8', liquid2: '#7fe0f4' },
  peaks:  { sky: ['#6d5fd1', '#f7c6ee'], top: '#eef6ff', topD: '#c5dcf2', dirt: '#7d7a9c', dirt2: '#67648a', brick: '#a98bd9', brickD: '#8567bd', plat: '#c9d6f2', platD: '#9fb2d9', liquid: '#6fb8ee', liquid2: '#e8f8ff' },
  forest: { sky: ['#12372b', '#3e8f5c'], top: '#3fa34d', topD: '#2c8040', dirt: '#5b3b22', dirt2: '#4a2f1b', brick: '#8e5fa8', brickD: '#6d447f', plat: '#7a5230', platD: '#5a3a20', liquid: '#10241c', liquid2: '#3d8c66' },
  desert: { sky: ['#ffbf4d', '#fff1c6'], top: '#f2c466', topD: '#dba748', dirt: '#d89c52', dirt2: '#c1853f', brick: '#e8664a', brickD: '#c24a31', plat: '#e8b878', platD: '#c8965a', liquid: '#c0702a', liquid2: '#ffb347' },
  storm:  { sky: ['#14123a', '#463a82'], top: '#5d62a8', topD: '#464a8c', dirt: '#34325e', dirt2: '#2a284c', brick: '#ffd93b', brickD: '#d1a800', plat: '#6f78c4', platD: '#515aa8', liquid: '#0c0b22', liquid2: '#4a6bf0' },
  castle: { sky: ['#16081f', '#5e1f3d'], top: '#6e6e80', topD: '#51515f', dirt: '#3c3c4c', dirt2: '#2f2f3d', brick: '#b0343f', brickD: '#8a2630', plat: '#8c8ca0', platD: '#6c6c80', liquid: '#e8470f', liquid2: '#ffc02e' }
};

/* ---------- backgrounds ---------- */
function repeatX(cam, par, spacing, fn) {
  const off = cam * par, i0 = Math.floor(off / spacing) - 1, n = Math.ceil(W / spacing) + 3;
  for (let i = i0; i < i0 + n; i++) fn(i * spacing - off, i, rand(i));
}
function hills(cam, par, base, amp, freq, color, seed = 0) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H); const off = cam * par;
  for (let x = 0; x <= W + 8; x += 8) { const wx = x + off; ctx.lineTo(x, base - (Math.sin(wx * freq + seed) * amp + Math.sin(wx * freq * 2.3 + seed * 2) * amp * 0.4)); }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
function peaks(cam, par, base, h, w, color, snow, seed) {
  repeatX(cam, par, w, (x, i) => {
    const ph = h * (0.55 + 0.45 * rand(i + seed)), ax = x + w / 2, ay = base - ph, hb = w * 0.75;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(ax - hb, base); ctx.lineTo(ax, ay); ctx.lineTo(ax + hb, base); ctx.fill();
    if (snow) { const sh = ph * 0.3, sw = sh * (hb / ph); ctx.fillStyle = snow; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax - sw, ay + sh); ctx.lineTo(ax - sw * 0.4, ay + sh * 0.7); ctx.lineTo(ax, ay + sh * 1.05); ctx.lineTo(ax + sw * 0.4, ay + sh * 0.7); ctx.lineTo(ax + sw, ay + sh); ctx.fill(); }
  });
}
function cloud(x, y, s, color) {
  ctx.fillStyle = color; ctx.beginPath();   // one path, one fill: translucent colours must not double up where shapes overlap
  for (const [dx, dy, r] of [[0, 0, 16], [18, -9, 21], [40, -2, 17], [58, 3, 12]]) { ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }
  ctx.rect(x, y, 58 * s, 15 * s); ctx.fill();
}
function clouds(cam, par, color, n = 6, yoff = 0) {
  const span = 1500;
  for (let i = 0; i < n; i++) { const x = (((i * 310 + rand(i) * 90) - cam * par) % span + span) % span - 150; cloud(x, 28 + rand(i + 9) * 110 + yoff, 0.8 + rand(i + 3) * 0.8, color); }
}
function sunDisc(x, y, r, c1, c2) {
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2); g.addColorStop(0, c1); g.addColorStop(0.45, c2); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
  ctx.fillStyle = c1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

const BG = {
  meadow(cam, t) {
    sunDisc(690, 76, 30, '#fff7b0', 'rgba(255,240,150,.45)');
    clouds(cam, 0.15, '#fff', 6);
    hills(cam, 0.15, 300, 30, 0.006, '#a8e6a3', 1); hills(cam, 0.3, 340, 26, 0.008, '#80d38b', 4); hills(cam, 0.5, 372, 18, 0.011, '#5bbf6b', 7);
    repeatX(cam, 0.7, 190, (x, i, r) => {
      ctx.fillStyle = '#2f9c47'; ctx.beginPath(); ctx.arc(x, 386, 24 + r * 12, Math.PI, 0); ctx.arc(x + 26, 386, 18 + r * 8, Math.PI, 0); ctx.fill();
      for (let k = 0; k < 3; k++) { const fx = x - 20 + k * 22 + r * 10; ctx.fillStyle = '#2a8a3f'; ctx.fillRect(fx, 368, 2, 16); ctx.fillStyle = ['#ff5d7a', '#fff', '#ffd23f'][(i + k + 9) % 3 | 0]; ctx.beginPath(); ctx.arc(fx + 1, 366 + Math.sin(t * 0.05 + k) , 4, 0, TAU); ctx.fill(); }
    });
  },
  shore(cam, t) {
    sunDisc(560, 238, 62, '#fff2c4', 'rgba(255,200,120,.55)');
    const g = ctx.createLinearGradient(0, 250, 0, H); g.addColorStop(0, '#3cc3d9'); g.addColorStop(1, '#17689c'); ctx.fillStyle = g; ctx.fillRect(0, 250, W, H - 250);
    for (let i = 0; i < 9; i++) { const y = 262 + i * 20, w = 40 + i * 14; ctx.fillStyle = 'rgba(255,255,255,.28)'; for (let k = 0; k < 7; k++) { const x = ((k * 150 + i * 63 + t * (0.3 + i * 0.05) - cam * 0.1) % (W + 120)) - 60; ctx.fillRect(x, y, w, 2); } }
    ctx.fillStyle = 'rgba(255,240,180,.35)'; for (let i = 0; i < 8; i++) ctx.fillRect(560 - 60 + (i % 2) * 12, 262 + i * 11, 120 - i * 10, 3);
    clouds(cam, 0.12, 'rgba(255,255,255,.75)', 5);
    hills(cam, 0.12, 275, 14, 0.01, '#e28a5e', 3);
    repeatX(cam, 0.65, 300, (x, i, r) => {
      const px = x + 40, sway = Math.sin(t * 0.03 + i) * 2;
      ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, 386); ctx.quadraticCurveTo(px + 22, 340, px + 14 + sway, 296 - r * 20); ctx.stroke();
      const tx = px + 14 + sway, ty = 296 - r * 20;
      ctx.fillStyle = '#2f9d5a'; for (let k = 0; k < 6; k++) { const a = -Math.PI + k * (Math.PI / 5); ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 24, ty + Math.sin(a) * 30 - 10, tx + Math.cos(a) * 46, ty + Math.sin(a) * 18 + 20); ctx.quadraticCurveTo(tx + Math.cos(a) * 24, ty + Math.sin(a) * 30 + 2, tx, ty); ctx.fill(); }
      ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(tx - 4, ty + 6, 4, 0, TAU); ctx.arc(tx + 5, ty + 7, 4, 0, TAU); ctx.fill();
    });
  },
  peaks(cam, t) {
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 40; i++) ctx.fillRect(rand(i) * W, rand(i + 50) * 170, 2, 2);
    clouds(cam, 0.1, 'rgba(255,255,255,.55)', 5, 20);
    peaks(cam, 0.12, 340, 230, 210, '#9a8be0', '#fff', 1); peaks(cam, 0.25, 375, 180, 170, '#6f5fc4', '#f4f1ff', 7); peaks(cam, 0.45, 392, 120, 130, '#4d3da4', '#dcd6ff', 13);
    repeatX(cam, 0.7, 150, (x, i, r) => {
      const h = 40 + r * 30; ctx.fillStyle = '#23266a';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x - 16 + k * 2, 388 - k * 14); ctx.lineTo(x + 6, 388 - h + k * 4 - k * 14 + 28); ctx.lineTo(x + 28 - k * 2, 388 - k * 14); ctx.fill(); }
    });
  },
  forest(cam, t) {
    repeatX(cam, 0.2, 90, (x, i, r) => { ctx.fillStyle = '#0b2a20'; ctx.fillRect(x, 0, 22 + r * 12, H); });
    repeatX(cam, 0.4, 130, (x, i, r) => { ctx.fillStyle = '#14402f'; ctx.fillRect(x, 0, 30 + r * 10, H); });
    const g = ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, 'rgba(8,30,20,.85)'); g.addColorStop(1, 'rgba(8,30,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
    repeatX(cam, 0.65, 230, (x, i, r) => { // living trees with faces – personification!
      const tx = x + 30, blink = (Math.floor(t / 40) + i) % 7 === 0;
      ctx.fillStyle = '#5e3a1f'; ctx.fillRect(tx - 20, 210, 40, 176);
      ctx.fillStyle = '#4a2d17'; ctx.fillRect(tx - 20, 210, 8, 176);
      ctx.strokeStyle = '#5e3a1f'; ctx.lineWidth = 8; ctx.lineCap = 'round'; const wv = Math.sin(t * 0.05 + i) * 6;
      ctx.beginPath(); ctx.moveTo(tx - 20, 270); ctx.quadraticCurveTo(tx - 44, 250 + wv, tx - 52, 232 + wv * 1.5); ctx.moveTo(tx + 20, 280); ctx.quadraticCurveTo(tx + 44, 270 - wv, tx + 54, 246 - wv * 1.5); ctx.stroke();
      ctx.fillStyle = '#2f8f46'; ctx.beginPath(); ctx.arc(tx, 200, 46, 0, TAU); ctx.arc(tx - 34, 222, 32, 0, TAU); ctx.arc(tx + 34, 222, 32, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3aa656'; ctx.beginPath(); ctx.arc(tx - 14, 186, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(tx - 9, 262, 6, blink ? 1 : 7, 0, 0, TAU); ctx.ellipse(tx + 9, 262, 6, blink ? 1 : 7, 0, 0, TAU); ctx.fill();
      if (!blink) { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(tx - 8 + Math.sin(t * 0.02 + i) * 2, 263, 3, 0, TAU); ctx.arc(tx + 10 + Math.sin(t * 0.02 + i) * 2, 263, 3, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#2a1608'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, 280, 9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    });
    for (let i = 0; i < 14; i++) { const fx = ((rand(i) * 900 + Math.sin(t * 0.01 + i) * 30 - cam * 0.5) % 900 + 900) % 900 - 50, fy = 120 + rand(i + 7) * 240 + Math.sin(t * 0.03 + i * 2) * 14;
      const a = 0.5 + Math.sin(t * 0.08 + i) * 0.4; ctx.fillStyle = `rgba(255,245,130,${a})`; ctx.beginPath(); ctx.arc(fx, fy, 2.5, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,245,130,${a * 0.25})`; ctx.beginPath(); ctx.arc(fx, fy, 8, 0, TAU); ctx.fill(); }
  },
  desert(cam, t) {
    const g = ctx.createRadialGradient(430, 260, 20, 430, 260, 210); g.addColorStop(0, '#fff2a0'); g.addColorStop(0.6, '#ffb436'); g.addColorStop(1, '#ff8a1f');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(430 - cam * 0.02, 260, 200, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 3; i++) ctx.fillRect(60 + i * 50, 80 + i * 22, 130, 6);
    hills(cam, 0.15, 340, 22, 0.006, '#f2b462', 2); hills(cam, 0.3, 370, 20, 0.009, '#e3a04e', 6);
    repeatX(cam, 0.6, 330, (x, i, r) => { // gigantic cactus
      const cx = x + 60, top = 60 + r * 80;
      ctx.fillStyle = '#3d9a4a'; roundRect(cx - 16, top, 32, 330, 14); ctx.fill();
      roundRect(cx - 62, top + 90, 24, 70, 10); ctx.fill(); ctx.fillRect(cx - 62, top + 140, 62, 22);
      roundRect(cx + 40, top + 60, 24, 80, 10); ctx.fill(); ctx.fillRect(cx, top + 118, 52, 22);
      ctx.fillStyle = '#2e7d3a'; ctx.fillRect(cx - 16, top, 6, 330);
      ctx.fillStyle = '#fff3'; for (let k = 0; k < 8; k++) ctx.fillRect(cx + (k % 2 ? 6 : -10), top + 24 + k * 36, 4, 2);
    });
  },
  storm(cam, t) {
    clouds(cam, 0.1, '#2e2a5e', 7, 10);
    const ph = t % 420;
    if (ph < 14) { ctx.fillStyle = `rgba(200,210,255,${0.55 * (1 - ph / 14)})`; ctx.fillRect(0, 0, W, H); }
    if (ph > 4 && ph < 10) { const bx = 200 + rand(Math.floor(t / 420)) * 400; ctx.strokeStyle = '#fff8c0'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx - 20, 90); ctx.lineTo(bx + 6, 110); ctx.lineTo(bx - 24, 220); ctx.lineTo(bx, 250); ctx.lineTo(bx - 14, 330); ctx.stroke(); }
    const words = ['BOOM!', 'CRASH!', 'ZAP!', 'SPLASH!', 'THUD!', 'KA-POW!', 'RUMBLE!'], cols = ['#ffd93b', '#ff6fa8', '#6fe0ff', '#9dff7a'];
    repeatX(cam, 0.35, 380, (x, i, r) => {
      const w = words[(i % 7 + 7) % 7], y = 80 + r * 170 + Math.sin(t * 0.03 + i) * 8;
      ctx.save(); ctx.translate(x + 120, y); ctx.rotate((r - 0.5) * 0.5); ctx.globalAlpha = 0.5;
      txt(w, 0, 0, 26 + r * 10, cols[(i % 4 + 4) % 4], 'center', '#000'); ctx.restore();
    });
    ctx.strokeStyle = 'rgba(180,200,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 55; i++) { const x = (i * 53 + t * 5) % (W + 40), y = (i * 97 + t * 15) % H; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 13); }
    ctx.stroke();
  },
  castle(cam, t) {
    ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) { ctx.globalAlpha = 0.3 + rand(i) * 0.5; ctx.fillRect(rand(i) * W, rand(i + 20) * 200, 2, 2); } ctx.globalAlpha = 1;
    sunDisc(630, 84, 34, '#f2eeff', 'rgba(200,190,255,.35)');
    ctx.fillStyle = '#d8d0f0'; ctx.beginPath(); ctx.arc(618, 76, 5, 0, TAU); ctx.arc(642, 96, 7, 0, TAU); ctx.fill();
    repeatX(cam, 0.25, 360, (x, i, r) => {
      const bx = x + 40, top = 190 + r * 60; ctx.fillStyle = '#1c0d2a';
      ctx.fillRect(bx, top, 70, 300); ctx.fillRect(bx - 6, top - 8, 82, 10);
      for (let k = 0; k < 4; k++) ctx.fillRect(bx - 6 + k * 24, top - 20, 14, 14);
      ctx.beginPath(); ctx.moveTo(bx + 70, top + 40); ctx.lineTo(bx + 105, top - 40); ctx.lineTo(bx + 140, top + 40); ctx.fill(); ctx.fillRect(bx + 70, top + 40, 70, 260);
      ctx.fillStyle = '#ffb02e'; ctx.fillRect(bx + 28, top + 40, 14, 24); ctx.fillRect(bx + 98, top + 70, 14, 24);
      ctx.fillStyle = '#1c0d2a';
    });
    repeatX(cam, 0.45, 240, (x, i, r) => { ctx.fillStyle = '#26122f'; ctx.fillRect(x, 250, 120, 140); ctx.fillStyle = '#16081f'; roundRect(x + 36, 290, 48, 100, 24); ctx.fill(); ctx.fillRect(x + 36, 320, 48, 70); });
    repeatX(cam, 0.8, 260, (x, i, r) => {
      const fl = Math.sin(t * 0.3 + i * 2) * 3 + Math.sin(t * 0.7 + i) * 1.5;
      const gl = ctx.createRadialGradient(x, 300, 4, x, 300, 70); gl.addColorStop(0, 'rgba(255,170,60,.45)'); gl.addColorStop(1, 'rgba(255,170,60,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, 300, 70, 0, TAU); ctx.fill();
      ctx.fillStyle = '#55556a'; ctx.fillRect(x - 3, 306, 6, 34); ctx.fillRect(x - 8, 302, 16, 6);
      ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.moveTo(x - 8, 302); ctx.quadraticCurveTo(x + fl, 268, x + 8, 302); ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(x - 4, 302); ctx.quadraticCurveTo(x + fl * 0.6, 280, x + 4, 302); ctx.fill();
    });
  }
};
function drawBackground(key, cam, t) {
  const th = THEMES[key], g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  BG[key](cam, t);
}
function drawLiquid(th, cam, t) {
  ctx.fillStyle = th.liquid; ctx.fillRect(0, H - 40, W, 40);
  ctx.fillStyle = th.liquid2; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, H - 40 + Math.sin((x + cam) * 0.05 + t * 0.08) * 3);
  for (let x = W + 8; x >= 0; x -= 8) ctx.lineTo(x, H - 33 + Math.sin((x + cam) * 0.05 + t * 0.08) * 3);
  ctx.closePath(); ctx.fill();
}

/* ---------- tiles ---------- */
const isSolidTile = v => v !== 0 && v !== 8;
const BOOK_COLORS = ['#d9423b', '#3b7bd9', '#3bb36a', '#e0a526', '#8e4fc4', '#e5733f'];
function drawTile(v, x, y, th, c, r, aboveSolid, t) {
  const T = TILE;
  switch (v) {
    case 1: {
      ctx.fillStyle = th.dirt; ctx.fillRect(x, y, T, T);
      ctx.fillStyle = th.dirt2; for (let k = 0; k < 4; k++) ctx.fillRect(x + ((c * 7 + k * 11 + r * 5) % 26), y + 12 + ((k * 9 + c * 3) % 18), 4, 3);
      if (!aboveSolid) {
        ctx.fillStyle = th.top; ctx.fillRect(x, y, T, 9); ctx.fillStyle = th.topD; ctx.fillRect(x, y + 9, T, 3);
        ctx.fillStyle = th.top; for (let k = 0; k < 3; k++) { const gx = x + 3 + k * 11 + (c % 3) * 2; ctx.beginPath(); ctx.moveTo(gx, y + 12); ctx.lineTo(gx + 3, y + 17); ctx.lineTo(gx + 6, y + 12); ctx.fill(); }
      }
      break;
    }
    case 3: {
      ctx.fillStyle = th.brickD; ctx.fillRect(x, y, T, T); ctx.fillStyle = th.brick; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x + 2, y + 2, T - 4, 4); ctx.fillRect(x + 2, y + 2, 4, T - 4);
      txt('ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(c * 5 + r * 3) % 26], x + T / 2, y + 23, 14, 'rgba(255,255,255,.9)', 'center', th.brickD);
      break;
    }
    case 4: case 5: {
      const sh = Math.sin(t * 0.08 + c) * 0.5 + 0.5;
      ctx.fillStyle = '#b8860b'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#ffcf33'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      ctx.fillStyle = `rgba(255,255,255,${0.25 + sh * 0.3})`; ctx.fillRect(x + 2, y + 2, T - 4, 5);
      ctx.fillStyle = '#b8860b'; for (const [dx, dy] of [[4, 4], [T - 7, 4], [4, T - 7], [T - 7, T - 7]]) ctx.fillRect(x + dx, y + dy, 3, 3);
      txt('?', x + T / 2, y + 24, 16, '#fff', 'center', '#8a5a00');
      break;
    }
    case 6: {
      ctx.fillStyle = '#4e4258'; ctx.fillRect(x, y, T, T); ctx.fillStyle = '#7a6b86'; ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
      ctx.fillStyle = '#4e4258'; for (const [dx, dy] of [[4, 4], [T - 7, 4], [4, T - 7], [T - 7, T - 7]]) ctx.fillRect(x + dx, y + dy, 3, 3);
      break;
    }
    case 7: { // stack of books
      const bh = T / 3;
      for (let k = 0; k < 3; k++) {
        const col = BOOK_COLORS[(c * 3 + r * 5 + k * 2) % 6], off = ((c + r + k) % 3 - 1) * 1.5;
        ctx.fillStyle = '#111'; ctx.fillRect(x + off - 1, y + k * bh, T + 2, bh + 1);
        ctx.fillStyle = col; ctx.fillRect(x + off, y + k * bh + 1, T, bh - 1);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x + off, y + k * bh + 1, T, 2);
        ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x + off + 5, y + k * bh + 4, 3, bh - 6); ctx.fillRect(x + off + T - 8, y + k * bh + 4, 3, bh - 6);
      }
      break;
    }
    case 8: {
      ctx.fillStyle = '#000'; roundRect(x - 1, y - 1, T + 2, 15, 5); ctx.fill();
      ctx.fillStyle = th.plat; roundRect(x, y, T, 13, 4); ctx.fill();
      ctx.fillStyle = th.platD; ctx.fillRect(x + 2, y + 9, T - 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 3, y + 2, T - 6, 3);
      break;
    }
  }
}
function drawTiles(L, th, camX, t) {
  const c0 = Math.max(0, Math.floor(camX / TILE)), c1 = Math.min(L.cols - 1, Math.floor((camX + W) / TILE));
  for (let r = 0; r < ROWS; r++) for (let c = c0; c <= c1; c++) {
    const v = L.grid[r][c]; if (!v) continue;
    let y = r * TILE;
    for (const b of L.bumps) if (b.c === c && b.r === r) y -= Math.sin(b.t / 10 * Math.PI) * 8;
    drawTile(v, c * TILE - camX, y, th, c, r, r > 0 && isSolidTile(L.grid[r - 1][c]), t);
  }
}
