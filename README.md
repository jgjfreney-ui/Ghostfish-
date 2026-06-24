# 🦋 Ghostbug

### *a cozy summer of bugs & ghosts*

You're a kid on summer holiday in a sleepy Japanese town. By day you chase bugs
with your net — lifting rocks, rustling the grass, shaking the trees, peering at
the water's edge. By night, if you're brave (or naughty) enough to sneak out past
your parents, the shut-up town fills with cute little **yokai** to catch instead.

A *Yokai Watch* / *Animal Crossing* collection game with an *Undertale / Earthbound*
soul — built to feel **tactile**: the world is something you poke, lift, and rummage
through, not just walk over.

> This is a **playable vertical slice** — the real engine and the full core loop are
> here and working. The grand campaign and questlines are the road ahead (see below).

---

## ▶ How to play

Just open **`index.html`** in any modern browser. No build step, no install — the
whole game (art included) is drawn in code, and the music is synthesized live.

> Tip: some browsers restrict audio until you click — that's why the game starts on
> a **▶ Start Summer** button.

### Controls

| Action | Keyboard | Touch |
|---|---|---|
| Move | Arrow keys / WASD | D-pad |
| **A** — interact / lift / talk / confirm | `Z` (or Space/Enter) | A button |
| **B** — swing your net / back | `X` (or Shift) | B button |
| Open collection log | `J` (or Tab) | — |

---

## ☀ The day, the night, the week

1. **Daytime** — Roam one big, open map (no loading zones). Lift **rocks**, search
   **grass** and **bushes**, shake **trees**, and check the **water's edge**. Each
   habitat hides different bugs. Talk to adult NPCs about their wonderfully boring
   grown-up problems. Do your **chore** for a good-kid point. Enter the store,
   school, clinic, and shrine.
2. **Sundown** — A warning: *get home before dark.* Make it back to your house in
   time and you're a good kid; dawdle and your parents notice.
3. **Evening** — Dinner with Mum and Dad, then up to **your room**, where your
   **collection enclosures** visibly fill up as you catch more.
4. **Lights out** — Sleep soundly… **or sneak out at midnight.**
5. **Midnight** — The town is shut. Buildings are locked — find their **secret
   entrances** (and the **abandoned buildings** hidden in the woods). Catch
   **nocturnal bugs** and cozy-spooky **ghosts**. Then sneak home **before dawn**,
   or get caught at the door and lose standing.
6. **Dawn** — The day advances. A new chore, a new weekday, the summer rolls on.

Your **standing** (Golden Child ↔ Little Troublemaker) shifts with your choices,
and your collection + progress **save automatically** in your browser.

---

## 🎨 Style

- **Graphics:** hand-coded pixel art, one warm cozy palette, soft day/dusk/night
  lighting with a lantern-glow pool around you after dark.
- **Music:** a procedural chiptune engine — a bright Earthbound-y **day theme**, a
  hushed **night theme**, and a little **title/evening** tune, plus tactile SFX
  (the *thunk* of a lifted rock, the rustle of grass, the four-note catch jingle,
  the wobble of a ghost appearing).

---

## 🗂 Project structure

```
index.html            # shell + script load order
styles.css            # frame, title screen, touch controls
src/
  engine/
    utils.js          # math, color mixing, value-noise, global GB namespace
    audio.js          # Web Audio chiptune sequencer + songs + SFX
    input.js          # keyboard + touch, edge-press handling
  data/
    species.js        # every bug & ghost (habitat, time, rarity, blurb, palette)
    dialogue.js       # NPC lines (adults being boringly adult)
  render/
    sprites.js        # all procedural pixel-art drawing
  world/
    world.js          # open map generation, collision, interactables
  entities/
    player.js         # the kid: movement, net, facing
    npc.js            # wandering townsfolk
    critter.js        # a live bug/ghost you chase and net
  systems/
    time.js           # day/night clock, curfew, ambient light
    catching.js       # lift/rustle/search interactions + the net catch
    collection.js     # the Mushizukan log + save
    reputation.js     # week, chores, good-kid/bad-kid standing
  ui/
    ui.js             # HUD, dialogue, toasts, collection journal
  main.js             # game loop, daily cycle, interiors, scenes
```

---

## 🛣 Roadmap (the dream, layer by layer)

- [x] Open traversable town + nature map
- [x] Tactile catching (rocks / grass / trees / water) with the net
- [x] Day → dinner → bedroom → sneak-out → night → dawn loop
- [x] Cozy-spooky night mode with ghosts, secret entrances, abandoned buildings
- [x] Collection log (bugs + yokai) with auto-save
- [x] Chores + good-kid / bad-kid standing + week system
- [x] Procedural day/night/title soundtrack + tactile SFX
- [ ] **Main campaign** — a story that takes you across the map and through moods
- [ ] **Questlines** from NPCs that unlock the best content
- [ ] Festival days, weather, seasons
- [ ] Richer interiors and a real bedroom hub
- [ ] More species, rare time-and-weather-gated yokai
- [ ] Hand-pixeled art passes & expanded original soundtrack

---

*Built with love. Catch them all — and don't let Mum catch you.*
