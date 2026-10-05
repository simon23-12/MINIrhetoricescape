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
  anaphora:        { name: 'Anaphora',            icon: '🔁', def: 'The same word or phrase is repeated at the beginning of successive sentences or clauses.', ex: 'We shall fight on the beaches, we shall fight on the landing grounds…' },
  antithesis:      { name: 'Antithesis',          icon: '⚔️', def: 'Opposite ideas are placed next to each other in a balanced sentence structure.', ex: 'United we stand, divided we fall.' },
  understatement:  { name: 'Understatement',      icon: '🤏', def: 'Something big or serious is deliberately described as small or unimportant.', ex: '“A bit of wind today,” said the sailor in the hurricane.' }
};

/* Two riddles per level – one of them is picked at random each time. */
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
  ],
  /* Level 4 – Personification */
  [
    { device: 'personification',
      q: 'I give the wind a voice, the sun a smile, the trees the power to sigh.<br>Human actions for things that aren’t human!<br><b>Which device am I?</b>',
      correct: 'Personification', wrong: ['Onomatopoeia', 'Simile', 'Hyperbole'],
      hint: 'Who is acting like a PERSON here – although it isn’t one?' },
    { device: 'personification',
      q: 'In my world, houses groan, flowers dance and the moon watches over you.<br><b>Which sentence uses personification?</b>',
      correct: 'The old house groaned and sighed in the night.', wrong: ['The old house was like a cage.', 'The old house was a haunted castle.', 'I’ve waited a million years for this old house!'],
      hint: 'Find the sentence where a building does something only humans can do.' }
  ],
  /* Level 5 – Hyperbole */
  [
    { device: 'hyperbole',
      q: 'I stretch the truth like rubber and turn a mouse into a mountain.<br><i>I’m so hungry I could eat a horse!</i><br><b>Which device am I?</b>',
      correct: 'Hyperbole', wrong: ['Simile', 'Metaphor', 'Personification'],
      hint: 'Is it a wild exaggeration – way bigger than reality?' },
    { device: 'hyperbole',
      q: 'Nobody believes me, but everybody understands me: I exaggerate on purpose!<br><b>Which sentence is a hyperbole?</b>',
      correct: 'I’ve been waiting here for a hundred years!', wrong: ['The wind whistled through the trees.', 'She is as fast as a cheetah.', 'The balloon went pop!'],
      hint: 'Which sentence is impossible to take literally?' }
  ],
  /* Level 6 – Onomatopoeia */
  [
    { device: 'onomatopoeia',
      q: '<i>Bang! Splash! Sizzle! Buzz!</i><br>My words sound just like the noises they name.<br><b>Which device am I?</b>',
      correct: 'Onomatopoeia', wrong: ['Alliteration', 'Metaphor', 'Hyperbole'],
      hint: 'Say the word out loud – does it SOUND like the thing it describes?' },
    { device: 'onomatopoeia',
      q: 'Put your ear to the page and listen closely!<br><b>Which of these words is an onomatopoeia?</b>',
      correct: 'Sizzle', wrong: ['Table', 'Beautiful', 'Tomorrow'],
      hint: 'Which word imitates a sound?' }
  ]
];

/* Boss battle: seven riddle spells, one per bar of the Cage of Clichés. */
const BOSS_RIDDLES = [
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
  { device: 'anaphora',
    taunt: 'I will win! I will rule! I will WIN!',
    q: '<i>“We shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields…”</i><br>I repeat the same words at the start of sentences or phrases.<br><b>Which device am I?</b>',
    correct: 'Anaphora', wrong: ['Alliteration', 'Metaphor', 'Hyperbole'],
    hint: 'Whole WORDS are repeated at the beginning of each part – not just sounds.' },
  { device: 'antithesis',
    taunt: 'You stand alone, I fall never!',
    q: '<i>“United we stand, divided we fall.” “To err is human; to forgive, divine.”</i><br>Opposite ideas, placed in a balanced sentence.<br><b>Which device am I?</b>',
    correct: 'Antithesis', wrong: ['Oxymoron', 'Simile', 'Onomatopoeia'],
    hint: 'Two opposite IDEAS in balanced parts of one sentence – not just two squeezed-together words.' },
  { device: 'understatement',
    taunt: 'Oh, this? Just a teeny-tiny volcano.',
    q: 'A hurricane flattens the whole town, and I say: <i>“Looks like a bit of wind today.”</i><br>I make something big sound small.<br><b>Which device am I?</b>',
    correct: 'Understatement', wrong: ['Hyperbole', 'Metaphor', 'Alliteration'],
    hint: 'It is the opposite of exaggeration.' },
  { device: 'metaphor',
    taunt: 'This is my FINAL spell! Tremble!',
    q: 'Warerio roars his final threat:<br><i>“Your courage is a tiny candle in my mighty storm!”</i><br><b>Which device is he using?</b>',
    correct: 'Metaphor', wrong: ['Simile', 'Personification', 'Hyperbole'],
    hint: 'Is there a “like” or “as”? Or is one thing simply called another?' }
];

const BOSS_HIT_LINES = ['OUCH! My Oxymoron!', 'ARGH! Not my Irony!', 'WHO… DID… THAT?!', 'My repetition! My repetition!', 'That… was a balanced blow!', 'Barely a scratch! (…it hurts.)', 'NOOOO! Not my storm!'];

if (typeof module !== 'undefined') module.exports = { DEVICES, LEVEL_RIDDLES, BOSS_RIDDLES };
