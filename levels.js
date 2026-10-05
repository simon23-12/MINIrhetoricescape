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
  /* ---------- 1 · Alliteration Meadow ---------- */
  { name: 'Alliteration Meadow', device: 'alliteration', theme: 'meadow', cols: 90, build(a) {
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

  /* ---------- 2 · Simile Shore ---------- */
  { name: 'Simile Shore', device: 'simile', theme: 'shore', cols: 100, build(a) {
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

  /* ---------- 3 · Metaphor Mountains ---------- */
  { name: 'Metaphor Mountains', device: 'metaphor', theme: 'peaks', cols: 105, build(a) {
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

  /* ---------- 4 · Personification Forest ---------- */
  { name: 'Personification Forest', device: 'personification', theme: 'forest', cols: 110, build(a) {
      a.floor([[18, 3], [34, 10], [58, 3], [72, 4], [90, 3]]);
      a.coins(5, 10, 3);
      a.enemy('blot', 8); a.enemy('blot', 12);
      a.arc(18, 10, 3);
      a.enemy('bat', 25, 8); a.enemy('spike', 30);
      a.plat(35, 10, 2); a.plat(38, 9, 2); a.plat(41, 10, 2);
      a.coins(35, 9, 2); a.coins(38, 8, 2); a.coins(41, 9, 2);
      a.enemy('blot', 47);
      a.flag(50);
      a.enemy('blot', 54);
      a.arc(58, 10, 3);
      a.blocks(62, 8); a.q(63, 8, 'scroll'); a.blocks(64, 8);
      a.enemy('blot', 62 + 5); a.enemy('spike', 69);
      a.plat(73, 9, 2); a.arc(72, 10, 4);
      a.enemy('blot', 79); a.enemy('spike', 82); a.pillar(85, 2); a.enemy('bat', 87, 8);
      a.arc(90, 10, 3);
      a.enemy('blot', 96);
      a.flag(98);
      a.q(100, 8, 'coin');
      a.gate(104);
  } },

  /* ---------- 5 · Hyperbole Desert ---------- */
  { name: 'Hyperbole Desert', device: 'hyperbole', theme: 'desert', cols: 115, build(a) {
      a.floor([[16, 3], [30, 4], [48, 4], [66, 4], [82, 3], [96, 4]]);
      a.pillar(9, 3); a.enemy('blot', 5); a.enemy('blot', 12);
      a.arc(16, 10, 3);
      a.enemy('big', 24);
      a.plat(31, 9, 2); a.arc(30, 10, 4);
      a.q(36, 8, 'scroll'); a.blocks(35, 8); a.blocks(37, 8);
      a.enemy('blot', 36); a.enemy('big', 41);
      a.flag(43);
      a.plat(49, 9, 2); a.arc(48, 10, 4);
      a.pillar(55, 3, 2); a.enemy('bat', 60, 8); a.enemy('blot', 62);
      a.plat(67, 9, 2); a.arc(66, 10, 4);
      a.enemy('big', 74); a.pillar(79, 3);
      a.arc(82, 10, 3);
      a.enemy('blot', 87); a.enemy('big', 91);
      a.plat(97, 9, 2); a.arc(96, 10, 4);
      a.flag(102);
      a.enemy('blot', 104);
      a.gate(109);
  } },

  /* ---------- 6 · Onomatopoeia Storm ---------- */
  { name: 'Onomatopoeia Storm', device: 'onomatopoeia', theme: 'storm', cols: 120, build(a) {
      a.floor([[14, 3], [28, 4], [42, 3], [56, 4], [70, 4], [84, 3], [98, 4]]);
      a.enemy('blot', 8); a.coins(5, 10, 3);
      a.arc(14, 10, 3);
      a.enemy('bat', 20, 8); a.enemy('blot', 22);
      a.plat(29, 9, 2); a.arc(28, 10, 4);
      a.q(35, 8, 'scroll'); a.blocks(34, 8); a.blocks(36, 8);
      a.enemy('bat', 36, 7); a.enemy('blot', 38);
      a.arc(42, 10, 3);
      a.flag(46);
      a.enemy('spike', 50); a.enemy('blot', 53);
      a.plat(57, 9, 2); a.arc(56, 10, 4);
      a.enemy('blot', 62); a.enemy('spike', 66);
      a.plat(71, 9, 2); a.arc(70, 10, 4);
      a.pillar(76, 2); a.enemy('blot', 79); a.enemy('spike', 81);
      a.arc(84, 10, 3);
      a.flag(88);
      a.enemy('bat', 92, 8); a.enemy('blot', 91); a.q(94, 8, 'coin');
      a.plat(99, 9, 2); a.arc(98, 10, 4);
      a.enemy('blot', 106);
      a.gate(112);
  } },

  /* ---------- 7 · Warerio's Castle (ends in the boss battle) ---------- */
  { name: 'Warerio’s Castle', device: 'boss', theme: 'castle', cols: 135, build(a) {
      a.floor([[12, 3], [26, 4], [40, 5], [56, 4], [70, 3], [84, 5], [100, 4], [114, 3]]);
      a.coins(5, 10, 3);
      a.enemy('blot', 6);
      a.arc(12, 10, 3);
      a.enemy('spike', 20);
      a.plat(27, 9, 2); a.arc(26, 10, 4);
      a.q(33, 8, 'scroll'); a.blocks(32, 8); a.blocks(34, 8);
      a.enemy('big', 35);
      a.plat(41, 10, 2); a.plat(44, 10, 1); a.arc(40, 9, 5);
      a.enemy('bat', 48, 8); a.enemy('blot', 52);
      a.flag(47);
      a.plat(57, 9, 2); a.arc(56, 10, 4);
      a.enemy('blot', 62); a.pillar(65, 3); a.enemy('blot', 67);
      a.arc(70, 10, 3);
      a.enemy('bat', 76, 7); a.enemy('big', 79);
      a.plat(85, 10, 2); a.plat(88, 10, 1); a.arc(84, 9, 5);
      a.flag(92);
      a.enemy('spike', 94); a.enemy('blot', 97);
      a.plat(101, 9, 2); a.arc(100, 10, 4);
      a.enemy('blot', 108); a.enemy('spike', 111);
      a.arc(114, 10, 3);
      a.enemy('big', 120); a.q(122, 8, 'coin');
      a.gate(128, 'boss');
  } }
];

/* boss arena: a single screen, 25 columns wide */
const ARENA_DEF = { name: 'Warerio’s Throne Room', device: 'boss', theme: 'castle', cols: 25, build(a) {
  a.ground(0, 24);
  a.plat(3, 9, 4); a.plat(18, 9, 4);
  a.plat(10, 9, 5);
} };

if (typeof module !== 'undefined') module.exports = { makeLevel, LEVEL_DEFS, ARENA_DEF, TILE, ROWS };
