// Ghostbug — main orchestrator: game loop, the daily cycle, interiors, scenes.
(function (GB) {
  const T = GB.TILE, VW = GB.VIEW_W, VH = GB.VIEW_H;

  // ---------- INTERIOR environment (rooms behind doors / secret entrances) ----------
  const Interior = {
    active: false,
    cols: 12, rows: 9,
    get pxW() { return this.cols * T; },
    get pxH() { return this.rows * T; },
    minX: T, minY: T, pad: T,
    building: null, night: false,
    enter(building, night) {
      this.active = true; this.building = building; this.night = night;
    },
    exit() { this.active = false; },
    // borders solid, with a doorway gap at bottom-center
    isSolidPx(px, py) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      const doorX = Math.floor(this.cols / 2);
      if (ty === this.rows - 1 && (tx === doorX || tx === doorX - 1)) return false; // exit gap
      return tx <= 0 || ty <= 0 || tx >= this.cols - 1 || ty >= this.rows - 1;
    },
    exitTile() { return { x: Math.floor(this.cols / 2), y: this.rows - 1 }; },
  };

  const Game = {
    canvas: null, ctx: null,
    cam: { x: 0, y: 0 },
    mode: 'title',          // title | play | interior | scene
    last: 0,
    npcCheckT: 0,
    ambientT: 0,
    scene: null,
    nightCaught: false,

    boot() {
      this.canvas = document.getElementById('game');
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;

      GB.Input.init();
      GB.Collection.load();
      GB.Reputation.load();
      GB.World.init();
      GB.NPCs.init();
      GB.env = GB.World;
      GB.UI.setup(this.ctx);
      GB.Player.spawnAtHome();

      const startBtn = document.getElementById('start-btn');
      startBtn.addEventListener('click', () => this.start());

      // title ambience
      requestAnimationFrame((t) => this.loop(t));
    },

    start() {
      document.getElementById('boot').classList.add('hidden');
      GB.Audio.init();
      GB.Audio.resume();
      this.beginDay();
    },

    // ================= DAY / NIGHT SETUP =================
    beginDay() {
      this.mode = 'play';
      GB.env = GB.World;
      Interior.exit();
      GB.Time.reset('day');
      GB.Catching.reset();
      GB.Player.spawnAtHome();
      GB.Player.y -= T; // step out of the doorway
      GB.Audio.playSong('day');
      GB.UI.message(`A bright ${GB.Reputation.weekday()} morning. Catch some bugs!`, 3.5);
      if (GB.Reputation.chore && !GB.Reputation.chore.done)
        setTimeout(() => GB.UI.message('Mum left a chore: ' + GB.Reputation.chore.text, 4), 200);
    },

    beginNight() {
      this.mode = 'play';
      GB.env = GB.World;
      Interior.exit();
      GB.Time.reset('night');
      GB.Catching.reset();
      this.nightCaught = false;
      GB.Reputation.sneakOut();
      GB.Player.spawnAtHome();
      GB.Player.y -= T;
      GB.Audio.playSong('night');
      GB.UI.message('Midnight. The town is asleep… and something is awake.', 4);
      setTimeout(() => GB.UI.message('Find secret ways into the shut-up buildings. Be home before dawn!', 4.5), 300);
    },

    // ================= MAIN LOOP =================
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000 || 0);
      this.last = now;

      if (this.mode === 'title') this.updateTitle(dt);
      else if (this.mode === 'play') this.updatePlay(dt);
      else if (this.mode === 'interior') this.updateInterior(dt);
      else if (this.mode === 'scene') this.updateScene(dt);

      GB.UI.update(dt);
      GB.Input.endFrame();
      requestAnimationFrame((t) => this.loop(t));
    },

    // ================= TITLE =================
    updateTitle() {
      const c = this.ctx;
      this._clear('#10131f');
      // gentle starfield
      const t = performance.now() / 1000;
      for (let i = 0; i < 40; i++) {
        const x = (i * 71) % VW, y = (i * 53) % VH;
        c.globalAlpha = 0.3 + 0.3 * Math.sin(t + i);
        c.fillStyle = '#cfd0ff'; c.fillRect(x, y, 1, 1);
      }
      c.globalAlpha = 1;
    },

    // ================= OVERWORLD PLAY =================
    updatePlay(dt) {
      // journal overlay takes over input
      if (GB.UI.journalOpen) { GB.UI.journalInput(); this.drawPlay(); GB.UI.drawJournal(); return; }
      if (!GB.UI.dialogueActive() && GB.Input.justPressed('journal')) { GB.UI.openJournal(); }

      // time
      const ev = GB.Time.update(dt);
      if (ev) this.handleTimeEvent(ev);

      // input — dialogue blocks movement
      const talking = GB.UI.dialogueActive();
      if (talking) {
        if (GB.Input.justPressed('a')) GB.UI.advanceDialogue();
      } else {
        if (GB.Input.justPressed('a')) this.doInteract();
        if (GB.Input.justPressed('b')) this.doSwing();
      }

      GB.Player.update(dt, !talking);
      GB.World.update(dt);
      GB.NPCs.update(dt, GB.Time.isNight);
      GB.Catching.update(dt, GB.Player);

      // ambient critters appear over time
      this.ambientT -= dt;
      if (this.ambientT <= 0) { this.ambientT = GB.util.rand(2.5, 5); GB.Catching.ambientSpawn(GB.Player); }

      // notify when a caught critter completes (handled in swing); show escapes
      this.updateCamera();
      this.drawPlay();
    },

    doSwing() {
      const res = GB.Catching.swing(GB.Player);
      if (res) {
        const t = GB.Collection.totals();
        GB.UI.message(res.isNew
          ? `★ NEW! ${res.species.name} added to your log! (${t.all}/${t.allTotal})`
          : `Caught a ${res.species.name}!`, res.isNew ? 3.5 : 2);
      }
    },

    doInteract() {
      const res = GB.Catching.interact(GB.Player);
      if (!res) return;
      switch (res.type) {
        case 'talk': this.talkTo(res.npc); break;
        case 'found': GB.UI.message(res.msg, 3); break;
        case 'searched': GB.UI.message(res.msg, 2.5); break;
        case 'door': this.useDoor(res.building, false); break;
        case 'secret': this.useDoor(res.building, true); break;
      }
    },

    talkTo(npc) {
      const data = GB.DIALOGUE[npc.key];
      if (!data) return;
      // chore turn-in: report to Dad during the day
      if (npc.key === 'dad' && !GB.Time.isNight && GB.Reputation.chore && !GB.Reputation.chore.done) {
        GB.Reputation.completeChore();
        GB.Audio.sfx('select');
        GB.UI.dialogue('Dad', ['"You did your chore? Good lad."', '"Here — keep the change for the festival."'],
          () => GB.UI.message('Chore done! Mum and Dad approve. ♥', 3));
        return;
      }
      const set = (GB.Time.isNight && data.night) ? data.night : data.day;
      GB.UI.dialogue(data.name, [GB.util.pick(set)]);
    },

    useDoor(building, viaSecret) {
      const night = GB.Time.isNight;
      // Reaching home during the evening/curfew triggers the going-home sequence.
      if (building.kind === 'home' && (GB.Time.phase === 'dusk' || GB.Time.curfew) && !night) {
        this.startEvening();
        return;
      }
      // Sneaking back home at night = success, ends the night.
      if (building.kind === 'home' && night) {
        this.endNightSafe();
        return;
      }
      if (night && !viaSecret && !building.abandoned) {
        GB.Audio.sfx('fail');
        GB.UI.message(`The ${building.name} is locked up tight. Find another way in…`, 3);
        return;
      }
      // enter interior
      GB.Audio.sfx('door');
      this.enterInterior(building, night);
    },

    handleTimeEvent(ev) {
      if (ev === 'dusk') {
        GB.UI.message('The cicadas are quieting… the sun is setting. Head home!', 4);
      } else if (ev === 'curfew') {
        GB.UI.message("It's past curfew! Get home NOW.", 4);
        GB.Reputation.homeOnTime = false;
      } else if (ev === 'dawn') {
        // night ran out before the kid got home
        if (GB.Time.isNight) this.endNightCaught();
      }
      // hard backstop: if very late and still out during day, walk them home
      if (GB.Time.phase === 'dusk' && GB.Time.clock > GB.Time.CURFEW_AT + 80 && !GB.UI.dialogueActive()) {
        GB.UI.message('You trudge home in the dark, late again…', 3);
        this.startEvening();
      }
    },

    // ================= INTERIORS =================
    enterInterior(building, night) {
      Interior.enter(building, night);
      GB.env = Interior;
      this.mode = 'interior';
      GB.Catching.reset();
      // place player at the exit doorway
      const ex = Interior.exitTile();
      GB.Player.x = ex.x * T - 3; GB.Player.y = (ex.y - 1) * T; GB.Player.dir = 1;
      this.cam.x = -(VW - Interior.pxW) / 2;
      this.cam.y = -(VH - Interior.pxH) / 2;

      if (night) {
        // spawn cute ghosts (rarer in abandoned places)
        const habitat = building.abandoned ? 'abandoned' : 'ghost';
        const n = building.abandoned ? 2 : 3;
        for (let i = 0; i < n; i++) {
          const sp = GB.rollSpecies(habitat, true) || GB.rollSpecies('ghost', true);
          if (!sp) continue;
          const c = GB.makeCritter(sp, GB.util.rand(T * 2, Interior.pxW - T * 2), GB.util.rand(T * 2, Interior.pxH - T * 3));
          GB.Catching.critters.push(c);
        }
        GB.Audio.sfx('ghost');
        GB.UI.message('Something glows in the dark. Swing your net! (X)', 3.5);
      } else {
        GB.UI.message('Press Z to chat · Press X or step out the door to leave', 3);
      }
    },

    updateInterior(dt) {
      if (GB.UI.journalOpen) { GB.UI.journalInput(); this.drawInterior(); GB.UI.drawJournal(); return; }
      if (!GB.UI.dialogueActive() && GB.Input.justPressed('journal')) GB.UI.openJournal();

      const talking = GB.UI.dialogueActive();
      if (talking) { if (GB.Input.justPressed('a')) GB.UI.advanceDialogue(); }
      else {
        if (GB.Input.justPressed('a')) this.interiorInteract();
        if (GB.Input.justPressed('b')) {
          if (Interior.night) this.doSwing();
          else this.leaveInterior();
        }
      }
      GB.Player.update(dt, !talking);
      GB.Catching.update(dt, GB.Player);

      // stepping onto the exit doorway leaves
      const px = Math.floor(GB.Player.centerX() / T), py = Math.floor((GB.Player.y + GB.Player.h) / T);
      if (py >= Interior.rows - 1) this.leaveInterior();

      this.drawInterior();
    },

    interiorInteract() {
      if (Interior.night) { this.doSwing(); return; }
      // talk to the building's keeper
      const keep = { store: 'shopkeeper', school: 'teacher', shrine: 'grandpa', home: 'mum' }[Interior.building.kind];
      if (keep && GB.DIALOGUE[keep]) {
        GB.UI.dialogue(GB.DIALOGUE[keep].name, [GB.util.pick(GB.DIALOGUE[keep].day)]);
      } else {
        GB.UI.dialogue('Clinic', ['A quiet waiting room. A nurse nods. "Mind the heat, little one."']);
      }
    },

    leaveInterior() {
      GB.Audio.sfx('door');
      Interior.exit();
      GB.env = GB.World;
      this.mode = 'play';
      GB.Catching.reset();
      // step back out in front of the door
      const b = Interior.building;
      GB.Player.x = b.doorTile[0] * T - 3; GB.Player.y = (b.doorTile[1] + 1) * T; GB.Player.dir = 0;
    },

    endNightSafe() {
      GB.UI.dialogue('You', ['You slip back through your window… safe.', 'No one heard a thing. Tonight was yours.'],
        () => this.startDawn(false));
    },

    endNightCaught() {
      this.nightCaught = true;
      GB.Reputation.gotCaught();
      GB.Audio.sfx('caught');
      GB.UI.dialogue('Mum', ['"...And just WHERE have you been?"', 'Caught red-handed at the door. Ohh, you are in for it.'],
        () => this.startDawn(true));
    },

    // ================= SCENES (evening / dawn) =================
    startEvening() {
      const onTime = GB.Reputation.homeOnTime && !GB.Time.curfew;
      GB.Reputation.cameHome(onTime);
      GB.Audio.playSong('title');
      GB.Audio.sfx('dinner');
      const t = GB.Collection.totals();
      const steps = [
        { bg: '#3a2a44', title: '— Home before dark —',
          text: onTime ? "You kick off your sandals just as the streetlights flicker on. Mum smiles."
                       : "You creep in late. Mum's arms are folded. Dad pretends to read the paper." },
        { bg: '#5a3a3a', title: '— Dinner —',
          text: GB.util.pick(GB.DIALOGUE.mum.dinner) },
        { bg: '#5a3a3a', title: '— Dinner —',
          text: GB.util.pick(GB.DIALOGUE.dad.dinner) },
        { type: 'bedroom', bg: '#2a2440', title: '— Your Room —',
          text: `Your collection: ${t.all}/${t.allTotal}. The enclosures are filling up.` },
        { type: 'choice', bg: '#1c1830', title: '— Lights out —',
          text: 'Sleep soundly… or sneak out at midnight?' },
      ];
      this.scene = { steps, i: 0 };
      this.mode = 'scene';
      GB.UI.dlg = null;
    },

    startDawn(caught) {
      GB.Audio.playSong('title');
      const t = GB.Collection.totals();
      const summary = caught
        ? "You're grounded for the morning. Worth it? …Mostly."
        : (GB.Reputation.standing >= 2 ? 'A good kid, by all accounts. Mum is proud.'
                                       : 'Another summer day begins.');
      const steps = [
        { bg: '#caa05a', title: '— Dawn —', text: 'Light leaks under the curtains. The cicadas start up again.' },
        { type: 'summary', bg: '#e0b86a', title: `— End of Day ${GB.Reputation.day} —`,
          text: `Collection ${t.all}/${t.allTotal} · ${GB.Reputation.standingLabel()}. ${summary}` },
      ];
      this.scene = { steps, i: 0, advanceDay: true };
      this.mode = 'scene';
      GB.UI.dlg = null;
    },

    updateScene() {
      const s = this.scene; if (!s) return;
      const step = s.steps[s.i];
      if (step.type === 'choice') {
        if (GB.Input.justPressed('a')) { this.endScene('sleep'); return; }
        if (GB.Input.justPressed('b')) { this.endScene('sneak'); return; }
      } else {
        if (GB.Input.justPressed('a') || GB.Input.justPressed('b')) {
          GB.Audio.sfx('blip');
          s.i++;
          if (s.i >= s.steps.length) { this.endScene('done'); return; }
        }
      }
      if (this.scene && this.mode === 'scene') this.drawScene();
    },

    endScene(choice) {
      const s = this.scene;
      if (choice === 'sleep') { this.scene = null; this.startDawn(false); return; }
      if (choice === 'sneak') { this.scene = null; this.beginNight(); return; }
      // 'done'
      if (s && s.advanceDay) {
        GB.Reputation.nextDay();
        this.scene = null;
        this.beginDay();
      } else { this.scene = null; this.mode = 'play'; }
    },

    drawScene() {
      const c = this.ctx;
      const step = this.scene.steps[this.scene.i];
      this._clear(step.bg);
      // soft vignette
      const g = c.createRadialGradient(VW/2, VH/2, 40, VW/2, VH/2, 180);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      c.fillStyle = g; c.fillRect(0, 0, VW, VH);

      if (step.type === 'bedroom') this._drawEnclosures(c);
      if (step.type === 'summary') this._drawSummary(c);

      GB.UI._text(c, step.title, VW/2, 28, '#ffe9a8', 'center');
      // text panel
      const x = 24, y = VH - 70, w = VW - 48;
      GB.UI._panel(c, x, y, w, 54);
      GB.UI._wrap(c, step.text, x + 8, y + 8, w - 16, '#f4ecd6');
      if (step.type === 'choice') {
        GB.UI._text(c, '[Z] Sleep — be a good kid', x + 8, y + 30, '#9fe88a');
        GB.UI._text(c, '[X] Sneak out — hunt ghosts', x + 8, y + 40, '#b59aff');
      } else {
        if (GB.util.pulse(performance.now()/200, 1) > 0.5)
          GB.UI._text(c, '▼ Z', x + w - 26, y + 40, '#9a8ad0');
      }
    },

    _drawEnclosures(c) {
      const have = GB.Collection.enclosures();
      const cols = 8, cell = 22, startX = (VW - cols * cell) / 2, startY = 56;
      for (let i = 0; i < 24; i++) {
        const cx = startX + (i % cols) * cell, cy = startY + Math.floor(i / cols) * cell;
        // wooden enclosure
        c.fillStyle = '#5a4030'; c.fillRect(cx, cy, 18, 18);
        c.fillStyle = '#7a5a3a'; c.fillRect(cx + 1, cy + 1, 16, 16);
        c.fillStyle = '#b9e0ff'; c.globalAlpha = 0.25; c.fillRect(cx + 2, cy + 2, 14, 14); c.globalAlpha = 1;
        const id = have[i];
        if (id) {
          c.save(); c.translate(cx + 3, cy + 3);
          GB.Sprites.critter(c, 0, 0, GB.speciesById[id], performance.now()/1000 + i);
          c.restore();
        }
      }
    },

    _drawSummary(c) {
      const t = GB.Collection.totals();
      c.save(); c.translate(VW/2 - 24, 70); c.scale(2,2);
      // little trophy-ish star
      GB.Sprites.sparkle(c, 12, 12, '#ffe9a8');
      c.restore();
    },

    // ================= CAMERA + RENDER (overworld) =================
    updateCamera() {
      const tx = GB.Player.centerX() - VW / 2;
      const ty = GB.Player.centerY() - VH / 2;
      this.cam.x = GB.util.clamp(tx, 0, GB.World.pxW - VW);
      this.cam.y = GB.util.clamp(ty, 0, GB.World.pxH - VH);
    },

    drawPlay() {
      const c = this.ctx;
      this._clear('#3f7a34');
      this.drawTerrain(c);
      this.drawWorldObjects(c);
      GB.Catching.draw(c, this.cam);
      this.applyLighting(c);
      GB.UI.drawHUD();
      GB.UI.drawMessage();
      GB.UI.drawDialogue();
    },

    drawTerrain(c) {
      const t = GB.World.time;
      const x0 = Math.floor(this.cam.x / T), y0 = Math.floor(this.cam.y / T);
      const x1 = Math.min(GB.World.w, x0 + Math.ceil(VW / T) + 1);
      const y1 = Math.min(GB.World.h, y0 + Math.ceil(VH / T) + 1);
      for (let y = Math.max(0, y0); y < y1; y++)
        for (let x = Math.max(0, x0); x < x1; x++) {
          const sx = x * T - this.cam.x, sy = y * T - this.cam.y;
          const tile = GB.World.tiles[y][x];
          const n = x * 0.7 + y * 1.3;
          if (tile === 'grass') GB.Sprites.grass(c, sx, sy, n);
          else if (tile === 'path') GB.Sprites.path(c, sx, sy, n);
          else if (tile === 'sand') GB.Sprites.sand(c, sx, sy);
          else if (tile === 'water') GB.Sprites.water(c, sx, sy, n, t);
          else if (tile === 'flowers') GB.Sprites.flowers(c, sx, sy, n);
          else GB.Sprites.grass(c, sx, sy, n);
        }
    },

    drawWorldObjects(c) {
      // build y-sorted renderable list for depth
      const list = [];
      GB.World.buildings.forEach(b => list.push({ y: (b.y + b.h) * T, kind: 'building', b }));
      GB.World.objects.forEach(o => {
        if (o.type === 'tree') list.push({ y: (o.gy + 1) * T, kind: 'tree', o });
        else if (o.type === 'rock') list.push({ y: (o.gy + 1) * T, kind: 'rock', o });
        else if (o.type === 'bush') list.push({ y: (o.gy + 1) * T, kind: 'bush', o });
        else if (o.type === 'secret') list.push({ y: (o.gy + 1) * T, kind: 'secret', o });
      });
      GB.NPCs.list.forEach(n => list.push({ y: n.y + n.h, kind: 'npc', n }));
      list.push({ y: GB.Player.y + GB.Player.h, kind: 'player' });
      list.sort((a, b) => a.y - b.y);

      const cam = this.cam;
      for (const r of list) {
        if (r.kind === 'building') {
          const lit = (GB.Time.isNight && false) || (!GB.Time.isNight && GB.Time.clock > GB.Time.DUSK_AT);
          GB.Sprites.building(c, r.b.x * T - cam.x, r.b.y * T - cam.y, r.b.w, r.b.h, r.b.kind, lit);
          // name plate
          GB.UI._text(c, r.b.name, r.b.x * T - cam.x + 2, r.b.y * T - cam.y - 8, 'rgba(255,233,168,0.85)');
        } else if (r.kind === 'tree') {
          GB.Sprites.tree(c, r.o.gx * T - cam.x, r.o.gy * T - cam.y);
        } else if (r.kind === 'rock') {
          GB.Sprites.rock(c, r.o.gx * T - cam.x, r.o.gy * T - cam.y, r.o.state === 'active');
        } else if (r.kind === 'bush') {
          GB.Sprites.bush(c, r.o.gx * T - cam.x, r.o.gy * T - cam.y, r.o.state === 'active');
        } else if (r.kind === 'secret') {
          if (GB.Time.isNight) { // hint a glow at night
            c.fillStyle = 'rgba(181,154,255,0.35)';
            c.fillRect(r.o.gx * T - cam.x + 4, r.o.gy * T - cam.y + 4, 8, 8);
          }
        } else if (r.kind === 'npc') {
          r.n.draw(c, cam);
        } else if (r.kind === 'player') {
          GB.Player.draw(c, cam);
        }
      }
    },

    drawInterior() {
      const c = this.ctx;
      const cam = this.cam;
      this._clear('#1a1622');
      const floor = Interior.night ? '#2a2438' : '#6a5240';
      const wall = Interior.night ? '#1f1b2e' : '#4a3628';
      // floor
      for (let y = 1; y < Interior.rows - 1; y++)
        for (let x = 1; x < Interior.cols - 1; x++) {
          c.fillStyle = ((x + y) % 2 === 0) ? floor : GB.util.mix(floor, '#000', 0.12);
          c.fillRect(x * T - cam.x, y * T - cam.y, T, T);
        }
      // walls
      for (let x = 0; x < Interior.cols; x++) { this._wallTile(c, x, 0, wall); }
      for (let y = 0; y < Interior.rows; y++) { this._wallTile(c, 0, y, wall); this._wallTile(c, Interior.cols - 1, y, wall); }
      // exit mat
      const ex = Interior.exitTile();
      c.fillStyle = '#caa05a';
      c.fillRect((ex.x - 1) * T - cam.x, ex.y * T - cam.y, T * 2, T);
      GB.UI._text(c, 'exit', (ex.x - 1) * T - cam.x + 4, ex.y * T - cam.y + 4, '#3a2a1a');

      // a keeper NPC by day
      if (!Interior.night) {
        c.save(); c.translate((Interior.cols / 2 + 1) * T - cam.x, 2 * T - cam.y);
        GB.Sprites.npc(c, 0, 0, { body: '#8a5a4a', hair: '#2a2a2a' }, 0);
        c.restore();
      }

      GB.Catching.draw(c, cam);
      GB.Player.draw(c, cam);

      if (Interior.night) this._interiorDark(c);
      // header
      c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, VW, 12);
      GB.UI._text(c, (Interior.night ? '☾ ' : '') + Interior.building.name + (Interior.night ? ' (after dark)' : ''), 4, 2, '#ffe9a8');
      GB.UI.drawMessage();
      GB.UI.drawDialogue();
    },

    _wallTile(c, x, y, wall) {
      const cam = this.cam;
      c.fillStyle = wall; c.fillRect(x * T - cam.x, y * T - cam.y, T, T);
      c.fillStyle = GB.util.mix(wall, '#fff', 0.12); c.fillRect(x * T - cam.x, y * T - cam.y, T, 3);
    },

    _interiorDark(c) {
      c.save();
      c.fillStyle = 'rgba(10,8,20,0.78)';
      c.fillRect(0, 0, VW, VH);
      const px = GB.Player.centerX() - this.cam.x, py = GB.Player.centerY() - this.cam.y;
      const g = c.createRadialGradient(px, py, 8, px, py, 64);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalCompositeOperation = 'destination-out';
      c.fillStyle = g; c.beginPath(); c.arc(px, py, 64, 0, Math.PI * 2); c.fill();
      c.restore();
      // warm glow tint
      c.fillStyle = 'rgba(120,90,200,0.06)'; c.fillRect(0, 0, VW, VH);
    },

    // day/dusk/night lighting over the overworld
    applyLighting(c) {
      const ov = GB.Time.overlay();
      if (ov.alpha <= 0.01) return;
      c.save();
      c.fillStyle = ov.color;
      c.globalAlpha = ov.alpha;
      c.fillRect(0, 0, VW, VH);
      c.globalAlpha = 1;
      if (GB.Time.isNight) {
        // carve a cozy lantern pool around the kid
        const px = GB.Player.centerX() - this.cam.x, py = GB.Player.centerY() - this.cam.y;
        const g = c.createRadialGradient(px, py, 12, px, py, 70);
        g.addColorStop(0, 'rgba(0,0,0,0.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = g; c.beginPath(); c.arc(px, py, 70, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    },

    _clear(color) {
      const c = this.ctx;
      c.fillStyle = color; c.fillRect(0, 0, VW, VH);
    },
  };

  GB.Game = Game;
  window.addEventListener('load', () => Game.boot());
})(window.GB);
