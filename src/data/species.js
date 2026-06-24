// Ghostbug — species definitions for the collection (the "Mushizukan" / Yokai log).
// habitat: where it spawns from (rock, grass, tree, water, ghost-in-building, abandoned)
// time: 'day' | 'night' | 'any'
// rarity: 1 common .. 5 legendary  (affects spawn chance & flee speed)
// palette: [body, accent, dark] used by procedural sprite drawing
(function (GB) {
  GB.SPECIES = [
    // ---- BUGS: under rocks ----
    { id: 'pillbug', name: 'Pill Bug', kind: 'bug', habitat: 'rock', time: 'any', rarity: 1,
      palette: ['#7a7280', '#9a92a0', '#3a3540'], speed: 14, flighty: 0.2,
      blurb: 'Rolls into a perfect little ball when startled. Harmless and shy.' },
    { id: 'beetle_stag', name: 'Stag Beetle', kind: 'bug', habitat: 'rock', time: 'night', rarity: 3,
      palette: ['#5a3a1e', '#8a5a2e', '#2a1a0e'], speed: 22, flighty: 0.4,
      blurb: 'The summer prize. Boys trade these like treasure. Pinchy.' },
    { id: 'centipede', name: 'Coin Centipede', kind: 'bug', habitat: 'rock', time: 'night', rarity: 4,
      palette: ['#b08020', '#e0b040', '#604010'], speed: 34, flighty: 0.6,
      blurb: 'Glints like a dropped coin. Gone the instant you blink.' },

    // ---- BUGS: in grass ----
    { id: 'grasshopper', name: 'Grasshopper', kind: 'bug', habitat: 'grass', time: 'day', rarity: 1,
      palette: ['#6aa83a', '#9ad05a', '#2e5a1e'], speed: 30, flighty: 0.5,
      blurb: 'Springs away in great leaps. Patience, little one.' },
    { id: 'ladybug', name: 'Ladybug', kind: 'bug', habitat: 'grass', time: 'day', rarity: 1,
      palette: ['#cc3a3a', '#ee6a6a', '#3a1010'], speed: 16, flighty: 0.3,
      blurb: 'Grandmother says one on your hand means good luck tomorrow.' },
    { id: 'mantis', name: 'Praying Mantis', kind: 'bug', habitat: 'grass', time: 'day', rarity: 3,
      palette: ['#7ac060', '#aee090', '#3a6020'], speed: 18, flighty: 0.35,
      blurb: 'Watches you back. Folds its arms like it is praying for escape.' },
    { id: 'cricket_bell', name: 'Bell Cricket', kind: 'bug', habitat: 'grass', time: 'night', rarity: 2,
      palette: ['#3a3a4a', '#5a5a7a', '#1a1a24'], speed: 24, flighty: 0.5,
      blurb: 'Its song is the sound of the holiday ending. Bittersweet.' },

    // ---- BUGS: on trees ----
    { id: 'cicada', name: 'Cicada', kind: 'bug', habitat: 'tree', time: 'day', rarity: 1,
      palette: ['#4a6a3a', '#7a9a5a', '#243a1a'], speed: 20, flighty: 0.6,
      blurb: 'Screams of high summer. Buzzes off the bark the moment your net lifts.' },
    { id: 'rhino_beetle', name: 'Rhinoceros Beetle', kind: 'bug', habitat: 'tree', time: 'night', rarity: 4,
      palette: ['#4a2e1a', '#7a4e2a', '#241408'], speed: 16, flighty: 0.3,
      blurb: 'The king of the sap trees. Heavy, horned, and worth the whole night.' },
    { id: 'butterfly_swallow', name: 'Swallowtail', kind: 'bug', habitat: 'tree', time: 'day', rarity: 2,
      palette: ['#e8d040', '#fff0a0', '#3a2a00'], speed: 26, flighty: 0.55,
      blurb: 'Drifts in lazy ribbons of yellow. Surprisingly hard to corner.' },

    // ---- BUGS: by water ----
    { id: 'strider', name: 'Pond Skater', kind: 'bug', habitat: 'water', time: 'day', rarity: 1,
      palette: ['#5a6a7a', '#8a9aaa', '#2a3440'], speed: 28, flighty: 0.5,
      blurb: 'Walks on water like it is nothing. Show-off.' },
    { id: 'dragonfly', name: 'Red Dragonfly', kind: 'bug', habitat: 'water', time: 'day', rarity: 2,
      palette: ['#d04a3a', '#f08a6a', '#601a10'], speed: 32, flighty: 0.6,
      blurb: 'Akatombo. When the dragonflies turn red, autumn is coming.' },
    { id: 'firefly', name: 'Firefly', kind: 'bug', habitat: 'water', time: 'night', rarity: 3,
      palette: ['#3a4a2a', '#aaff80', '#101808'], speed: 14, flighty: 0.3, glow: '#bfff7a',
      blurb: 'A green lantern drifting over the river. Catching one feels like a secret.' },

    // ---- GHOSTS: night, inside buildings & abandoned places ----
    { id: 'g_soot', name: 'Soot Sprite', kind: 'ghost', habitat: 'ghost', time: 'night', rarity: 1,
      palette: ['#2a2a36', '#4a4a5a', '#101018'], speed: 18, flighty: 0.4, glow: '#6a6a8a',
      blurb: 'A dust bunny with eyes. Lives behind the cupboards of shut-up shops.' },
    { id: 'g_lantern', name: 'Paper Lantern Ghost', kind: 'ghost', habitat: 'ghost', time: 'night', rarity: 2,
      palette: ['#e0a040', '#ffd070', '#603010'], speed: 16, flighty: 0.45, glow: '#ffcf7a',
      blurb: 'A chochin-obake. Hops on one foot and sticks its tongue out. More cheeky than scary.' },
    { id: 'g_umbrella', name: 'Hop-Umbrella', kind: 'ghost', habitat: 'ghost', time: 'night', rarity: 3,
      palette: ['#6a4ab0', '#9a7ad0', '#2a1a50'], speed: 22, flighty: 0.5, glow: '#b59aff',
      blurb: 'Kasa-obake. A forgotten umbrella that learned to bounce. One big silly eye.' },
    { id: 'g_kitsune', name: 'Foxfire Wisp', kind: 'ghost', habitat: 'abandoned', time: 'night', rarity: 4,
      palette: ['#ff8a3a', '#ffd0a0', '#802000'], speed: 30, flighty: 0.6, glow: '#ffb06a',
      blurb: 'A drop of fox-fire from the shrine. Warm, weightless, and far too quick.' },
    { id: 'g_noppera', name: 'Faceless Friend', kind: 'ghost', habitat: 'abandoned', time: 'night', rarity: 5,
      palette: ['#cfd0e0', '#ffffff', '#9090a0'], speed: 26, flighty: 0.7, glow: '#e6e8ff',
      blurb: 'Noppera-bo. It only wanted someone to talk to. Hold still and it will smile back.' },

    // ---- PARK: a new place to play (day) and to meet the lonely (night) ----
    { id: 'bug_atlas', name: 'Atlas Beetle', kind: 'bug', habitat: 'park', time: 'day', rarity: 3,
      palette: ['#3a2a4a', '#6a4a7a', '#1a1020'], speed: 16, flighty: 0.3,
      blurb: 'Three great horns like a mountain range. Slow, proud, magnificent.' },
    { id: 'bug_bluemorpho', name: 'Blue Morpho', kind: 'bug', habitat: 'park', time: 'day', rarity: 2,
      palette: ['#3a6ad0', '#9ac0ff', '#10204a'], speed: 26, flighty: 0.55,
      blurb: 'A scrap of fallen sky drifting over the park flowerbeds.' },
    { id: 'bug_moonmoth', name: 'Moon Moth', kind: 'bug', habitat: 'park', time: 'night', rarity: 3,
      palette: ['#bfe0c0', '#eafff0', '#5a7a6a'], speed: 20, flighty: 0.45, glow: '#cfffe0',
      blurb: 'Pale wings that drink the lamplight. Only comes out under the park lamps.' },
    { id: 'g_swing', name: 'Swing Spirit', kind: 'ghost', habitat: 'park', time: 'night', rarity: 2,
      palette: ['#6a8ad0', '#a0c0ff', '#2a3a6a'], speed: 18, flighty: 0.4, glow: '#a0c0ff',
      blurb: 'It just wants someone to push the swing. Back and forth, back and forth, forever.' },
    { id: 'g_sandbox', name: 'Sandbox Shade', kind: 'ghost', habitat: 'park', time: 'night', rarity: 3,
      palette: ['#caa86a', '#ead0a0', '#6a4a20'], speed: 22, flighty: 0.5, glow: '#ead0a0',
      blurb: 'Builds little sand castles that always crumble before the dawn.' },

    // ---- CAVE: hidden deep in the woods, unlocked by the park girl's story ----
    { id: 'bug_cavecricket', name: 'Cave Cricket', kind: 'bug', habitat: 'cave', time: 'any', rarity: 1,
      palette: ['#5a5040', '#7a705a', '#2a2418'], speed: 24, flighty: 0.4,
      blurb: 'Long pale legs, grown for a life with no sun.' },
    { id: 'bug_glowworm', name: 'Glow-worm', kind: 'bug', habitat: 'cave', time: 'any', rarity: 2,
      palette: ['#2a3a2a', '#aaff90', '#101808'], speed: 8, flighty: 0.2, glow: '#bfffa0',
      blurb: 'A living constellation strung across the cave ceiling.' },
    { id: 'bug_blindbeetle', name: 'Blind Beetle', kind: 'bug', habitat: 'cave', time: 'any', rarity: 4,
      palette: ['#d0ccc0', '#ffffff', '#8a8478'], speed: 18, flighty: 0.4,
      blurb: 'Ghost-white, eyeless, ancient. It has never once seen a star.' },
    { id: 'g_caveshade', name: 'Cave Shade', kind: 'ghost', habitat: 'cave', time: 'any', rarity: 2,
      palette: ['#3a3a4a', '#5a5a7a', '#10101a'], speed: 18, flighty: 0.45, glow: '#5a5a8a',
      blurb: 'A shadow that quietly peeled itself off the cave wall.' },
    { id: 'g_dripspecter', name: 'Dripping Specter', kind: 'ghost', habitat: 'cave', time: 'any', rarity: 3,
      palette: ['#4a6a7a', '#8ab0c0', '#1a2a34'], speed: 16, flighty: 0.4, glow: '#8ab0c0',
      blurb: 'Drip… drip… it weeps cold water that never reaches the floor.' },

    // ---- ONE-OF-ONES (story; never spawn randomly) ----
    { id: 'g_father', name: 'Ghost of the Father', kind: 'ghost', habitat: 'cave', time: 'any', rarity: 5,
      unique: true, palette: ['#5a2a2a', '#8a4a4a', '#1a0808'], speed: 24, flighty: 0.5, glow: '#a04a4a',
      blurb: 'He waited in the dark a very long time. He does not get to wait any longer.' },
    { id: 'g_parkgirl', name: 'The Girl in the Park', kind: 'ghost', habitat: 'park', time: 'night', rarity: 5,
      unique: true, palette: ['#cfd0e8', '#ffffff', '#9090b0'], speed: 0, flighty: 0, glow: '#e6e8ff',
      blurb: 'She kept her seat on the swings until someone finally sat and listened. Now she can rest.' },
  ];

  GB.speciesById = {};
  GB.SPECIES.forEach(s => GB.speciesById[s.id] = s);

  // pick a species appropriate to a habitat + phase, weighted by rarity
  GB.rollSpecies = function (habitat, isNight) {
    const phase = isNight ? 'night' : 'day';
    const pool = GB.SPECIES.filter(s =>
      s.habitat === habitat && !s.unique &&
      (s.time === 'any' || s.time === phase));
    if (!pool.length) return null;
    // weight: common (rarity 1) much more likely than legendary
    let total = 0;
    const weighted = pool.map(s => {
      const w = 1 / (s.rarity * s.rarity);
      total += w;
      return { s, w };
    });
    let r = Math.random() * total;
    for (const e of weighted) { r -= e.w; if (r <= 0) return e.s; }
    return pool[0];
  };
})(window.GB);
