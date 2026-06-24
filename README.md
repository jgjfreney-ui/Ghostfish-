# 🦋 Ghostbug

### *a cozy summer of bugs & ghosts*

You're **Ryosuke**, a kid on summer holiday in your sleepy hometown — your dad's
an American who moved here for your mum, who grew up on these streets. By day you
chase bugs with your net — lifting rocks, rustling the grass, shaking the trees,
peering at the water's edge. By night, if you're brave (or naughty) enough to
sneak out past your parents, the shut-up town fills with cute little **yokai** to
catch instead.

There's a quieter story under the bug-catching, too — about how Ryosuke's really
doing, and the week building toward his grandparents' visit.

A *Yokai Watch* / *Animal Crossing* collection game with an *Undertale / Earthbound*
soul — built to feel **tactile**: the world is something you poke, lift, and rummage
through, not just walk over.

> This is a **playable vertical slice** — the real engine and the full core loop are
> here and working. The grand campaign and questlines are the road ahead (see below).

---

## ▶ How to play

**On a computer:** just open **`index.html`** in any modern browser. No build step,
no install — the whole game (art included) is drawn in code, and the music is
synthesized live.

**On a phone (Android / Pixel):** two options —
- **Single file:** build `dist/Ghostbug.html` with `node tools/build-single-file.js`
  (or grab the `Ghostbug-HTML` artifact from CI), open it in Chrome, then
  **⋮ → Add to Home Screen**. Runs offline, feels like an app, no install prompt.
- **APK:** download the **`Ghostbug.apk`** built by CI and sideload it — see
  [`android/README.md`](android/README.md).

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

The summer opens on the **last day of term** — school lets out, and you wake the
next morning in **your room** (bed, handheld console, and a spiderweb in the
corner Ryosuke isn't quite ready to deal with). Mum and Dad hand you a **net, a
torch, and a camera**, and the only mission is to *enjoy the day.*

1. **Morning** — Wake in your room. Head downstairs and out into town.
2. **Daytime** — Roam one big, open map (no loading zones). There are **14 kinds
   of spots** to poke at: lift **rocks**, rustle **grass/bushes/flowerbeds**, shake
   **trees**, roll **logs**, dig **ant-mounds**, wade **puddles**, check the
   **water's edge**, look under **park benches** — and after dark the night gathers
   at **streetlamps**, **vending machines**, **stone lanterns**, **trash bins**, and
   the **old well**, each with its own bugs and ghosts. Talk to NPCs (Dad's an
   American expat, Mum's a
   local — their lines shift with the story). Do your **chore**. Enter the store,
   school, clinic, and shrine. Catching things and finishing tasks earns **XP and
   levels**.
3. **Sundown** — A warning: *get home before dark.* On time = good kid; dawdle and
   your parents notice.
4. **Evening** — Dinner with Mum and Dad, then up to **your room**: scroll your
   **collection enclosures** (one cute cage per bug, filling up over time), play
   your **handheld**, or climb into **bed**.
5. **The middle of the night** — As you sleep you hear owls and crickets… then
   Ryosuke stirs awake. *Go back to sleep?* **Yes** → morning. **No** → slip out
   of the covers into the dark.
6. **Sneaking out** — The town is shut. Buildings are locked — find their **secret
   entrances** (and the **abandoned buildings** hidden in the woods; the torch
   lights your way). Catch **nocturnal bugs** and cozy-spooky **ghosts**, then
   sneak home **before dawn** or get caught at the door.
7. **The grandparents** — One week in (the next Saturday) Obaachan and Ojiichan are
   at the table when you come home. They ask Ryosuke how he's *really* been. You
   can tell the truth… or lie. It matters.

Your **standing** (Golden Child ↔ Little Troublemaker) and **level** shift with
your choices, and your collection + progress **save automatically**.

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
    story.js          # levels/XP, items, and the narrative flags
  ui/
    ui.js             # HUD, dialogue, toasts, collection journal
  main.js             # game loop, intro, bedroom hub, night-wake, scenes
android/              # native WebView wrapper -> sideloadable APK
.github/workflows/
  android-apk.yml     # CI: builds Ghostbug.apk as a downloadable artifact
```

---

## 🛣 Roadmap (the dream, layer by layer)

- [x] Open traversable town + nature map
- [x] Tactile catching (rocks / grass / trees / water) with the net
- [x] Day → dinner → bedroom → sneak-out → night → dawn loop
- [x] Cozy-spooky night mode with ghosts, secret entrances, abandoned buildings
- [x] Collection log (bugs + yokai) with auto-save
- [x] Chores + good-kid / bad-kid standing + week system
- [x] Procedural day/night/title/tender soundtrack + tactile SFX + night ambience
- [x] Intro cutscene, bedroom hub, the middle-of-the-night wake decision
- [x] Levels & XP, items (net / torch / camera), the spiderweb (level-15 gate)
- [x] Story opening: the grandparents' visit + the mental-health scene
- [x] Dad (American) / Mum (Japanese) dialogue that reacts to the story
- [x] Two more places to explore: the **Park** and a hidden **Cave** (new bugs
      & ghosts in each)
- [x] The **park girl questline** — ten nights of talking, the truth about her
      father, the cave that opens, the one-of-one "Ghost of the Father", and
      setting her free as a one-of-one of her own
- [x] Level gates: park at night (Lv.5), the deep night woods + cave (Lv.20)
- [x] Single-file `Ghostbug.html` build + sideloadable Android APK + CI
- [ ] **Main campaign** — extend the story across the whole summer
- [ ] **More questlines** from NPCs that unlock the best content
- [ ] Festival days, weather, seasons
- [ ] The Game Boy mini-game as a real little game
- [ ] More species, rare time-and-weather-gated yokai
- [ ] Hand-pixeled art passes & expanded original soundtrack

---

*Built with love. Catch them all — and don't let Mum catch you.*
