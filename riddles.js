/* ------------------------------------------------------------------
   Rhetoric Escape – content: stylistic devices + riddles
   To add or change riddles, edit this file only. A riddle looks like:
   { device:'simile', q:'riddle text (HTML ok)', correct:'Simile',
     wrong:['Metaphor','Irony','Hyperbole'], hint:'shown after a wrong answer' }
   ------------------------------------------------------------------ */

const DEVICES = {
  alliteration:    { name: 'Alliteration',        icon: '🐝', def: 'The same first sound (usually a consonant) is repeated in words that stand close together.', ex: 'Busy bees buzz by.' },
  simile:          { name: 'Simile',              icon: '⚖️', def: 'Two different things are compared using the words “like” or “as”.', ex: 'He is as brave as a lion.' },
  metaphor:        { name: 'Metaphor',            icon: '🎭', def: 'One thing is directly called another thing – a comparison without “like” or “as”.', ex: 'Time is a thief.' },
  personification: { name: 'Personification',     icon: '🌳', def: 'Things, animals or ideas are described as if they were human and could act like people.', ex: 'The wind whispered through the trees.' },
  hyperbole:       { name: 'Hyperbole',           icon: '🎈', def: 'Extreme exaggeration for effect – it is not meant to be taken literally.', ex: 'I’m so hungry I could eat a horse!' },
  onomatopoeia:    { name: 'Onomatopoeia',        icon: '💥', def: 'A word that imitates the sound it describes.', ex: 'Bang! Splash! Sizzle!' },
  oxymoron:        { name: 'Oxymoron',            icon: '☯️', def: 'Two contradictory words are combined into one expression.', ex: 'Deafening silence, bittersweet, jumbo shrimp.' },
  irony:           { name: 'Irony',               icon: '🙃', def: 'What happens (or is said) is the opposite of what you would expect or what is meant.', ex: 'A fire station burns down.' },
  rhetorical:      { name: 'Rhetorical Question', icon: '❓', def: 'A question asked for effect, not because an answer is expected.', ex: 'Who doesn’t love pizza?' },
};

/* Two riddles per level – one of them is picked at random each time.
   (The level names are neutral on purpose, so they never give away the answer.) */
const LEVEL_RIDDLES = [
  /* Level 1 – Alliteration */
  [
    { device: 'alliteration',
      q: 'I’m the tongue-twister’s treasure, the poet’s playful tune.<br>My words begin with the very same sound – <i>Peter Piper picked a peck of pickled peppers</i>.<br><b>Which device am I?</b>',
      correct: 'Alliteration', wrong: ['Simile', 'Hyperbole', 'Onomatopoeia'],
      hint: 'Listen to the SOUNDS at the beginning of the words.' },
    { device: 'alliteration',
      q: 'One sentence below holds my secret: the same first sound, again and again.<br><b>Which sentence uses alliteration?</b>',
      correct: 'Silly snakes slither slowly.', wrong: ['The sky is very blue today.', 'She ran as fast as lightning.', 'The door went bang!'],
      hint: 'Look for words that START with the same sound.' }
  ],
  /* Level 2 – Simile */
  [
    { device: 'simile',
      q: 'Two things sit side by side, tied together by a tiny word: <i>“like”</i> or <i>“as”</i>.<br><i>As brave as a lion. Runs like the wind.</i><br><b>Which device am I?</b>',
      correct: 'Simile', wrong: ['Metaphor', 'Alliteration', 'Personification'],
      hint: 'There is a little word that builds the bridge between the two things.' },
    { device: 'simile',
      q: 'I compare, and I always say so out loud with “like” or “as”.<br><b>Which sentence is a simile?</b>',
      correct: 'Her laugh was as bright as sunshine.', wrong: ['Her laugh was sunshine.', 'Her laugh danced across the room.', 'I’ve told you a million times!'],
      hint: 'Look for the little words “like” or “as”.' }
  ],
  /* Level 3 – Metaphor */
  [
    { device: 'metaphor',
      q: 'I say one thing <b>IS</b> another – no “like”, no “as” to show.<br><i>Time is a thief. The world is a stage.</i><br><b>Which device am I?</b>',
      correct: 'Metaphor', wrong: ['Simile', 'Hyperbole', 'Alliteration'],
      hint: 'The comparison is direct – there is no “like” or “as”.' },
    { device: 'metaphor',
      q: 'I turn one thing into another without any helper words.<br><b>Which sentence is a metaphor?</b>',
      correct: 'The classroom was a zoo.', wrong: ['The classroom was like a zoo.', 'The classroom was so loud the whole planet shook.', 'The bell went ding-dong.'],
      hint: 'Which sentence says something IS something else – without “like” or “as”?' }
  ]
];

/* Boss battle: seven riddle spells, one per bar of the Cage of Clichés.
   Rounds 1-3 revisit the "easy" devices of the classic riddle gates, 4-6 introduce new ones, 7 is a final review. */
const BOSS_RIDDLES = [
  { device: 'personification',
    taunt: 'My castle groans, my walls whisper… can you hear them?',
    q: 'Warerio cackles: <i>“My castle walls whisper and my torches dance!”</i><br>Things that are not human act like people.<br><b>Which sentence below uses the same device?</b>',
    correct: 'The old house groaned and sighed in the night.', wrong: ['The old house was like a cage.', 'The old house was a haunted castle.', 'I’ve waited a million years for this old house!'],
    hint: 'Find the sentence where a building does something only humans can do.' },
  { device: 'hyperbole',
    taunt: 'I’ve waited a MILLION years to beat you!',
    q: 'I stretch the truth like rubber and turn a mouse into a mountain.<br><i>I’m so hungry I could eat a horse!</i><br><b>Which device am I?</b>',
    correct: 'Hyperbole', wrong: ['Simile', 'Metaphor', 'Personification'],
    hint: 'Is it a wild exaggeration – way bigger than reality?' },
  { device: 'onomatopoeia',
    taunt: 'BOOM! CRASH! Tremble, little plumber!',
    q: '<i>Bang! Splash! Sizzle! Buzz!</i><br>My words sound just like the noises they name.<br><b>Which device am I?</b>',
    correct: 'Onomatopoeia', wrong: ['Alliteration', 'Metaphor', 'Hyperbole'],
    hint: 'Say the word out loud – does it SOUND like the thing it describes?' },
  { device: 'oxymoron',
    taunt: 'Hear the DEAFENING SILENCE of your defeat!',
    q: 'Warerio snarls: <i>“Taste the BITTERSWEET end of your quest!”</i><br>Two opposite words are squeezed together in my name.<br><b>Which device am I?</b>',
    correct: 'Oxymoron', wrong: ['Simile', 'Alliteration', 'Onomatopoeia'],
    hint: 'Two words that contradict each other, side by side.' },
  { device: 'irony',
    taunt: 'Fire station on fire? How… unexpected!',
    q: 'A fire station burns to the ground. A dentist has the worst teeth in town.<br>What happens is the opposite of what we expect.<br><b>Which device am I?</b>',
    correct: 'Irony', wrong: ['Hyperbole', 'Personification', 'Metaphor'],
    hint: 'Expectation and reality clash!' },
  { device: 'rhetorical',
    taunt: 'Who could ever defeat the mighty Warerio?',
    q: '<i>“Who wouldn’t want to save a princess?” “Are you kidding me?”</i><br>I ask, but I never wait for an answer.<br><b>Which device am I?</b>',
    correct: 'Rhetorical Question', wrong: ['Simile', 'Onomatopoeia', 'Alliteration'],
    hint: 'A question – but nobody expects a real answer.' },
  { device: 'metaphor',
    taunt: 'This is my FINAL spell! Tremble!',
    q: 'Warerio roars his final threat:<br><i>“Your courage is a tiny candle in my mighty storm!”</i><br><b>Which device is he using?</b>',
    correct: 'Metaphor', wrong: ['Simile', 'Personification', 'Hyperbole'],
    hint: 'Is there a “like” or “as”? Or is one thing simply called another?' }
];

const BOSS_HIT_LINES = ['OW! My poor Personification!', 'That hurt a MILLION times!', 'CRASH! BANG! …OUCH!', 'Oww! That was… terribly good!', 'Oh, how… unexpected. (Irony!)', 'Who dares to hurt the mighty Warerio?!', 'NOOOO! Not my storm!'];

if (typeof module !== 'undefined') module.exports = { DEVICES, LEVEL_RIDDLES, BOSS_RIDDLES };
