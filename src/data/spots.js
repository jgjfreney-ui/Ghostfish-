// Ghostbug — searchable "spots" registry. Every interactable place you can poke
// for bugs/ghosts is one entry here: its habitat (what species roll from it),
// the SFX it makes, and whether it physically blocks movement. Adding a new spot
// to the whole game is just one line here + a sprite + a scatter rule.
(function (GB) {
  GB.SEARCHABLES = {
    // original four
    rock:      { habitat: 'rock',   sfx: 'lift',   solid: true,  verb: 'lift the rock' },
    bush:      { habitat: 'grass',  sfx: 'rustle', solid: false, verb: 'rustle the bush' },
    tree:      { habitat: 'tree',   sfx: 'rustle', solid: true,  verb: 'shake the tree' },
    water:     { habitat: 'water',  sfx: 'splash', solid: false, verb: 'search the water' },

    // new daytime + nighttime hunting grounds
    flowerbed: { habitat: 'flower', sfx: 'rustle', solid: false, verb: 'check the flowers' },
    log:       { habitat: 'log',    sfx: 'lift',   solid: false, verb: 'roll the log' },
    lamp:      { habitat: 'lamp',   sfx: 'rustle', solid: true,  verb: 'check the lamplight' },
    vending:   { habitat: 'vending',sfx: 'lift',   solid: true,  verb: 'peek behind the machine' },
    lantern:   { habitat: 'lantern',sfx: 'lift',   solid: true,  verb: 'peer into the stone lantern' },
    puddle:    { habitat: 'puddle', sfx: 'splash', solid: false, verb: 'wade the puddle' },
    mound:     { habitat: 'dirt',   sfx: 'lift',   solid: false, verb: 'dig at the mound' },
    well:      { habitat: 'well',   sfx: 'splash', solid: true,  verb: 'look down the well' },
    bench:     { habitat: 'bench',  sfx: 'rustle', solid: false, verb: 'look under the bench' },
    bin:       { habitat: 'trash',  sfx: 'lift',   solid: true,  verb: 'rummage the bin' },
  };
})(window.GB);
