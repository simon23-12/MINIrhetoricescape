# 👑 Rhetoric Escape

**Save Princess Prosa from the evil Warerio!** A Mario-World-style platformer for English class in which pupils clear seven levels by solving riddles about **stylistic devices** (alliteration, simile, metaphor, personification, hyperbole, onomatopoeia – and in the boss battle: oxymoron, irony, rhetorical question, anaphora, antithesis, understatement).

No installation, no build step, no dependencies – plain HTML5 canvas + vanilla JavaScript. Works on desktop, tablets and phones (touch controls appear automatically).

## ▶ Play

Open `index.html` in a browser, or play it on GitHub Pages: **https://simon23-12.github.io/MINIrhetoricescape/**

| Action | Keys | Touch |
|---|---|---|
| Move | `←` `→` or `A` `D` | ◀ ▶ buttons |
| Jump (hold = higher) | `Space`, `↑` or `W` | ▲ button |
| Run | `Shift` or `X` | RUN button |
| Answer a riddle | click or `1`–`4` | tap |
| Back to map | `Esc` or 🗺️ | 🗺️ |

## 🎮 How it works

* **World map** with seven levels – clear a level to unlock the next one (progress is saved in the browser).
* **Levels 1–6** are side-scrolling platform levels. Stomp the *ink blots* (they yell clichés like “BORING!” when squashed), dodge the spiky ones, collect coins, hit `?` blocks and hit the checkpoint flags.
* At the end of each level a **Riddle Gate** guarded by a wise owl asks a riddle about that level’s stylistic device. Every wrong answer costs a heart (5 per level) and shows a hint; the right answer explains the device with a definition and an example.
* **Wisdom Scrolls 📜** hidden in `?` blocks give a 50:50 joker for any riddle.
* **Level 7 – Warerio’s Castle** ends in the **boss battle** (see below).
* The **Codex 📖** collects every device the pupils have mastered – a handy revision sheet.

### 🧙 The boss battle: Warerio and the Cage of Clichés

Warerio hovers on a storm cloud above the throne room and keeps Princess Prosa in a cage with **seven bars – one for every riddle spell**.

1. **Dodge phase** – Warerio lobs *Dull Words* (BORING, BLAND, YAWN…) at you. Every bomb shows a red warning marker where it will land; later rounds add ink waves you have to jump and double volleys.
2. **Riddle spell** – when the timer runs out Warerio casts a riddle (oxymoron, irony, rhetorical question, anaphora, antithesis, understatement, and a final metaphor test).
3. **Strike back** – a correct answer throws a golden *Rhetoric Star* labelled with the device, shatters one bar of the cage and hurts Warerio. A wrong answer costs a heart.
4. After the seventh bar the cage crashes down, the princess runs out, and Warerio plummets from his cloud. 🎉

If the hearts run out, only the current round restarts.

## ✏️ Adapting it (for teachers)

All the learning content lives in **`riddles.js`** – no other file needs to be touched:

* `DEVICES` – the codex entries (name, definition, example sentence)
* `LEVEL_RIDDLES` – two riddles per level (one is chosen at random)
* `BOSS_RIDDLES` – the seven boss spells

```js
{ device: 'simile',
  q: 'Two things sit side by side, tied together by a tiny word…<br><b>Which device am I?</b>',
  correct: 'Simile',
  wrong: ['Metaphor', 'Alliteration', 'Personification'],
  hint: 'There is a little word that builds the bridge between the two things.' }
```

Level layouts are defined in **`levels.js`** with a tiny builder (`a.floor`, `a.plat`, `a.enemy`, `a.q`, …). In the browser console, `RE.start(3)` jumps straight to level 4 and `RE.boss()` to the boss fight.

## 🗂 Files

| File | Purpose |
|---|---|
| `index.html`, `style.css` | page shell, menus, riddle dialog, codex |
| `riddles.js` | **all riddles & definitions** |
| `levels.js` | level builder + the seven level layouts + boss arena |
| `render.js` | procedural graphics (characters, backgrounds, tiles) |
| `game.js` | physics, game flow, riddle UI, world map, boss battle, sound |

All art and sound are generated in code (canvas drawing + WebAudio) – there are no image or audio files. Characters are original drawings inspired by classic platformers.
