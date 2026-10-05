/* ------------------------------------------------------------------
   Rhetoric Escape – level data
   Grid: 14 rows, ground surface = row 12 (ground tiles on rows 12–13).
   Tile ids: 0 air · 1 ground · 3 alphabet brick · 4 ? (coin) · 5 ? (scroll)
             6 used block · 7 book pillar · 8 one-way floating slab
   ------------------------------------------------------------------ */

const TILE = 32, ROWS = 14, GROUND_ROW = 12;

function makeLevel(def) {
  const cols = def.cols;
  const L = { cols, grid: [], coins: [], enemies: [], flags: [], gate: null, startCol: 2, theme: def.theme, name: def.name, bumps: [] };
  for (let r = 0; r < ROWS; r++) L.grid.push(new Uint8Array(cols));
  const set = (c, r, v) => { if (c >= 0 && c < cols && r >= 0 && r < ROWS) L.grid[r][c] = v; };

  const a = {
    start(c) { L.startCol = c; },
    ground(c0, c1) { for (let c = c0; c <= c1; c++) { set(c, 12, 1); set(c, 13, 1); } },
    /* ground everywhere except the given [startCol, width] gaps */
    floor(gaps) {
      const gap = new Set();
      gaps.forEach(([s, w]) => { for (let i = 0; i < w; i++) gap.add(s + i); });
      for (let c = 0; c < cols; c++) if (!gap.has(c)) a.ground(c, c);
    },
    blocks(c, r, n = 1) { for (let i = 0; i < n; i++) set(c + i, r, 3); },
    q(c, r, kind) { set(c, r, kind === 'scroll' ? 5 : 4); },
    plat(c, r, n) { for (let i = 0; i < n; i++) set(c + i, r, 8); },
    pillar(c, h, w = 1) { for (let i = 0; i < w; i++) for (let k = 1; k <= h; k++) set(c + i, 12 - k, 7); },
    coins(c, r, n, step = 1) { for (let i = 0; i < n; i++) L.coins.push({ c: c + i * step, r }); },
    /* little coin arch, r = baseline row */
    arc(c, r, n) { for (let i = 0; i < n; i++) L.coins.push({ c: c + i, r: r - Math.round(Math.sin(Math.PI * (i + 0.5) / n) * 1.6) }); },
    /* ground types: blot | spike | big (r = row of the tile it stands in).  bat: r = hover row. */
    enemy(type, c, r = 11) { L.enemies.push({ type, c, r }); },
    flag(c) { L.flags.push({ c }); },
    gate(c, type = 'riddle') { L.gate = { c, type }; }
  };
  def.build(a);
  return L;
}

const LEVEL_DEFS = [
  /* ---------- 1 · Sunny Meadow (riddle: alliteration) ---------- */
  { name: 'Sunny Meadow', device: 'alliteration', theme: 'meadow', cols: 90, build(a) {
      a.floor([[26, 2], [48, 3], [68, 2]]);
      a.coins(6, 10, 4);
      a.blocks(11, 8); a.q(12, 8, 'scroll'); a.blocks(13, 8); a.coins(11, 7, 3);
      a.pillar(16, 2);
      a.enemy('blot', 20); a.enemy('blot', 34); a.enemy('blot', 40);
      a.arc(25, 10, 4);
      a.plat(31, 9, 4); a.coins(31, 8, 4);
      a.pillar(42, 3);
      a.flag(46);
      a.arc(48, 10, 3);
      a.blocks(54, 8); a.q(55, 8, 'coin'); a.q(56, 8, 'coin'); a.blocks(57, 8);
      a.enemy('blot', 58); a.enemy('blot', 63);
      a.pillar(60, 2);
      a.arc(67, 10, 4);
      a.enemy('blot', 71); a.pillar(74, 1); a.pillar(78, 2);
      a.coins(80, 10, 3);
      a.gate(84);
  } },

  /* ---------- 2 · Sunset Beach (riddle: simile) ---------- */
  { name: 'Sunset Beach', device: 'simile', theme: 'shore', cols: 100, build(a) {
      a.floor([[22, 3], [44, 3], [60, 3], [78, 3]]);
      a.coins(6, 10, 3);
      a.plat(10, 9, 3); a.coins(10, 8, 3);
      a.enemy('blot', 14); a.enemy('bat', 18, 8);
      a.arc(22, 10, 3);
      a.blocks(28, 8); a.q(29, 8, 'coin'); a.blocks(30, 8);
      a.enemy('blot', 33); a.pillar(35, 2); a.enemy('blot', 38);
      a.arc(44, 10, 3);
      a.flag(50);
      a.blocks(52, 8); a.q(53, 8, 'scroll'); a.blocks(54, 8);
      a.enemy('blot', 57);
      a.arc(60, 10, 3);
      a.enemy('blot', 65); a.pillar(68, 2); a.enemy('bat', 71, 8); a.enemy('blot', 74);
      a.arc(78, 10, 3);
      a.enemy('blot', 84); a.pillar(88, 2); a.enemy('blot', 91);
      a.coins(92, 10, 2);
      a.gate(95);
  } },

  /* ---------- 3 · Frosty Peaks (riddle: metaphor) ---------- */
  { name: 'Frosty Peaks', device: 'metaphor', theme: 'peaks', cols: 105, build(a) {
      a.floor([[20, 3], [40, 4], [58, 3], [76, 4], [90, 3]]);
      a.pillar(8, 1); a.pillar(9, 2); a.pillar(10, 3); a.pillar(11, 2); a.pillar(12, 1);
      a.coins(10, 8, 1); a.coins(5, 10, 2);
      a.enemy('blot', 15); a.enemy('spike', 18);
      a.arc(20, 10, 3);
      a.plat(26, 9, 3); a.coins(26, 8, 3);
      a.blocks(30, 8); a.q(31, 8, 'scroll'); a.blocks(32, 8);
      a.enemy('blot', 29); a.enemy('spike', 35);
      a.plat(41, 9, 2); a.arc(40, 10, 4);
      a.enemy('blot', 46);
      a.flag(48);
      a.pillar(52, 3); a.enemy('blot', 55);
      a.arc(58, 10, 3);
      a.enemy('blot', 64); a.enemy('spike', 68); a.plat(70, 9, 3); a.coins(70, 8, 3);
      a.plat(77, 9, 2); a.arc(76, 10, 4);
      a.enemy('blot', 83); a.q(82, 8, 'coin'); a.enemy('blot', 86);
      a.arc(90, 10, 3);
      a.pillar(96, 1);
      a.gate(100);
  } },

  /* ---------- 4 · Warerio's Castle (ends in the boss battle) ---------- */
  { name: 'Warerio’s Castle', device: 'boss', theme: 'castle', cols: 105, build(a) {
      a.floor([[14, 3], [28, 4], [44, 5], [60, 4], [78, 3]]);
      a.coins(5, 10, 3);
      a.enemy('blot', 7);
      a.arc(14, 10, 3);
      a.enemy('spike', 21);
      a.plat(29, 9, 2); a.arc(28, 10, 4);
      a.q(35, 8, 'scroll'); a.blocks(34, 8); a.blocks(36, 8);
      a.enemy('big', 38);
      a.plat(45, 10, 2); a.plat(48, 10, 1); a.arc(44, 9, 5);
      a.flag(52);
      a.enemy('blot', 55); a.enemy('bat', 57, 8);
      a.plat(61, 9, 2); a.arc(60, 10, 4);
      a.enemy('blot', 66); a.pillar(70, 3); a.enemy('blot', 74);
      a.arc(78, 10, 3);
      a.flag(84);
      a.enemy('blot', 87); a.enemy('spike', 93); a.q(95, 8, 'coin');
      a.gate(100, 'boss');
  } }
];

/* boss arena: a single screen, 25 columns wide */
const ARENA_DEF = { name: 'Warerio’s Throne Room', device: 'boss', theme: 'castle', cols: 25, build(a) {
  a.ground(0, 24);
  a.plat(3, 9, 4); a.plat(18, 9, 4);
  a.plat(10, 9, 5);
} };

if (typeof module !== 'undefined') module.exports = { makeLevel, LEVEL_DEFS, ARENA_DEF, TILE, ROWS };
