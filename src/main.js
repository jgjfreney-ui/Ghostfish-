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
    catch: false, dark: false, ghostKid: false, habitat: 'ghost', location: null,
    kidTile: { x: 9, y: 2 },
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

  // ---------- BEDROOM: Ryosuke's room — the personal hub ----------
  const Bedroom = {
    cols: 11, rows: 8,
    get pxW() { return this.cols * T; },
    get pxH() { return this.rows * T; },
    minX: T, minY: T, pad: T,
    phase: 'morning',   // 'morning' (wake, then head out) | 'evening' (sleep/play)
    // furniture tiles { type, gx, gy, w, h } — spaced so each has its own clear tile
    objects: [
      { type: 'bed',      gx: 1, gy: 1, w: 2, h: 3 },   // left wall
      { type: 'shelf',    gx: 4, gy: 1, w: 2, h: 3 },   // back wall
      { type: 'spiderweb',gx: 8, gy: 1, w: 1, h: 1 },   // top-right corner, isolated
      { type: 'desk',     gx: 6, gy: 4, w: 2, h: 1 },   // handheld console, lower area
      { type: 'window',   gx: 4, gy: 0, w: 1, h: 1 },
    ],
    isSolidPx(px, py) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      const doorX = Math.floor(this.cols / 2);
      if (ty >= this.rows - 1 && (tx === doorX || tx === doorX - 1)) return false; // stairs gap
      if (tx <= 0 || ty <= 0 || tx >= this.cols - 1 || ty >= this.rows - 1) return true;
      // solid furniture: bed, shelf, desk
      for (const o of this.objects) {
        if (o.type === 'spiderweb' || o.type === 'window') continue;
        if (tx >= o.gx && tx < o.gx + o.w && ty >= o.gy && ty < o.gy + o.h) return true;
      }
      return false;
    },
    exitTile() { return { x: Math.floor(this.cols / 2), y: this.rows - 1 }; },
    // object whose body contains the faced tile (furniture is solid, so the
    // player stands adjacent and faces into it; the window is not interactable)
    facing(gx, gy) {
      return this.objects.find(o =>
        o.type !== 'window' &&
        gx >= o.gx && gx < o.gx + o.w && gy >= o.gy && gy < o.gy + o.h);
    },
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
      GB.Story.load();
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
      if (!GB.Story.started) this.startIntro();
      else this.startMorning();
    },

    // ================= INTRO =================
    startIntro() {
      GB.Audio.playSong('title');
      this.playScene([
        { bg: '#ffd9a0', render: 'school', title: '— The Last Day of Term —',
          text: 'The final bell of summer term rings out. Kids pour through the gates of Akebono Elementary, bags swinging, shouting into the sun.' },
        { bg: '#ffcf90', render: 'school', title: '— Summer —',
          text: '"It\'s summer break! School has ended. Enjoy your holiday, Ryosuke!"' },
        { bg: '#0e0c12', render: 'black', title: null, text: 'Everything fades, warm and slow, into the dark behind your eyes…' },
      ], () => this.firstMorning());
    },

    firstMorning() {
      GB.Story.started = true;
      GB.Story.hasNet = GB.Story.hasTorch = GB.Story.hasCamera = true;
      GB.Story.save();
      GB.Audio.playSong('title');
      this.playScene([
        { bg: '#caa05a', render: 'wakeup', title: '— First Morning of Summer —',
          text: 'You wake bright and early, sunlight warm on the wall. Your eyes blink slowly open. The whole holiday is ahead of you.' },
        { bg: '#3a2a44', title: '— Downstairs —',
          text: 'Mum presses a brand-new bug net into your hands. "Ganbatte, ne? Go and have fun."' },
        { bg: '#3a2a44', title: '— Downstairs —',
          text: 'Dad grins and hands you a torch and a little camera. "For the night-bugs, champ. …Not that you\'d ever stay up THAT late. Right?"' },
        { bg: '#2a2440', title: '— Your Mission —',
          text: 'Today there\'s only one thing to do: enjoy it. Head outside and catch some bugs.' },
      ], () => this.startMorning());
    },

    // ================= DAY / NIGHT SETUP =================
    // each day begins in Ryosuke's room
    startMorning() {
      this.enterBedroom('morning');
    },

    // leave the bedroom for the open town (daytime roam)
    goOutside() {
      this.mode = 'play';
      GB.env = GB.World;
      Interior.exit();
      GB.Time.reset('day');
      GB.Catching.reset();
      GB.Player.spawnAtHome();
      GB.Player.y -= T; // step out of the doorway
      GB.Audio.stopAmbience();
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
      else if (this.mode === 'bedroom') this.updateBedroom(dt);
      else if (this.mode === 'gameboy') this.updateGameboy(dt);
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
      if (!res) return;
      // catching the one-of-one Father resolves the cave
      if (res.species.id === 'g_father') {
        GB.Story.fatherCaught = true; GB.Story.save();
        GB.Audio.sfx('reveal');
        GB.UI.dialogue('—', [
          'The net closes. He doesn\'t fight. He just… stops.',
          'Something that was wrong for a very long time is, finally, over.',
          'Go and tell her. Go back to the park.',
        ]);
        return;
      }
      const t = GB.Collection.totals();
      GB.UI.message(res.isNew
        ? `★ NEW! ${res.species.name} added to your log! (${t.all}/${t.allTotal})`
        : `Caught a ${res.species.name}!`, res.isNew ? 3.5 : 2);
      if (res.levels) this._levelToast(res.levels);
    },

    _levelToast(levels) {
      GB.Audio.sfx('levelup');
      setTimeout(() => GB.UI.message(`✦ Level up! Ryosuke is now Lv.${GB.Story.level}.`, 3), 600);
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
      // chore turn-in: report to Dad during the day
      if (npc.key === 'dad' && !GB.Time.isNight && GB.Reputation.chore && !GB.Reputation.chore.done) {
        GB.Reputation.completeChore();
        const lv = GB.Story.addXp(8);
        GB.Audio.sfx('select');
        GB.UI.dialogue('Dad', ['"You did your chore? Atta boy."', '"Here — keep the change for the festival, champ."'],
          () => { GB.UI.message('Chore done! Mum and Dad approve. ♥', 3); if (lv) this._levelToast(lv); });
        return;
      }
      const d = GB.getDialogue(npc.key, GB.Time.isNight ? 'night' : 'day');
      if (!d) return;
      GB.UI.dialogue(d.name, d.lines);
    },

    useDoor(building, viaSecret) {
      const night = GB.Time.isNight;
      const kind = building.kind;

      // Reaching home during the evening/curfew triggers the going-home sequence.
      if (kind === 'home' && (GB.Time.phase === 'dusk' || GB.Time.curfew) && !night) { this.startEvening(); return; }
      // Sneaking back home at night = success, ends the night.
      if (kind === 'home' && night) { this.endNightSafe(); return; }

      // THE PARK — open by day; at night it opens to you once you're brave enough.
      if (kind === 'park') {
        if (night && GB.Story.level < GB.Story.PARK_LEVEL) {
          GB.Audio.sfx('fail');
          GB.UI.message(`The park is dark and still. You don't dare, not yet… (Lv.${GB.Story.PARK_LEVEL})`, 3.5);
          return;
        }
        GB.Audio.sfx('door'); this.enterInterior(building, night); return;
      }

      // THE HIDDEN CAVE — only real once the girl has named her father, and only
      // if Ryosuke is strong enough to go deep into the night woods.
      if (kind === 'cave') {
        if (!GB.Story.fatherRevealed) {
          GB.Audio.sfx('fail');
          GB.UI.message('Just a black crack in the rock. Nothing calls to you… yet.', 3);
          return;
        }
        if (GB.Story.level < GB.Story.WOODS_LEVEL) {
          GB.Audio.sfx('fail');
          GB.UI.message(`The woods are pitch dark. Ryosuke isn't ready to go this deep. (Lv.${GB.Story.WOODS_LEVEL})`, 4);
          return;
        }
        GB.Audio.sfx('door'); GB.Audio.sfx('drip'); this.enterInterior(building, true); return;
      }

      // The night woods (abandoned places) — also gated until Ryosuke is brave.
      if (building.abandoned && night && GB.Story.level < GB.Story.WOODS_LEVEL) {
        GB.Audio.sfx('fail');
        GB.UI.message(`It's so dark out here in the woods… not yet. (Lv.${GB.Story.WOODS_LEVEL})`, 3.5);
        return;
      }

      // Town buildings are locked at night — find the secret entrance.
      if (night && !viaSecret && !building.abandoned) {
        GB.Audio.sfx('fail');
        GB.UI.message(`The ${building.name} is locked up tight. Find another way in…`, 3);
        return;
      }

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
      this._gkTip = false; // ghost-girl conversation resets each visit
      const ex = Interior.exitTile();
      GB.Player.x = ex.x * T - 3; GB.Player.y = (ex.y - 1) * T; GB.Player.dir = 1;
      this.cam.x = -(VW - Interior.pxW) / 2;
      this.cam.y = -(VH - Interior.pxH) / 2;

      const kind = building.kind;
      Interior.location = kind;
      let habitat, song;
      if (kind === 'park') {
        habitat = 'park'; Interior.dark = night; Interior.catch = true;
        Interior.ghostKid = night && !GB.Story.ghostKidFreed;
        song = night ? 'park' : 'day';
      } else if (kind === 'cave') {
        habitat = 'cave'; Interior.dark = true; Interior.catch = true; Interior.ghostKid = false;
        song = GB.Story.fatherCaught ? 'cave' : 'father';
      } else if (building.abandoned) {
        habitat = 'abandoned'; Interior.dark = night; Interior.catch = night; Interior.ghostKid = false;
        song = night ? 'night' : 'day';
      } else {
        habitat = 'ghost'; Interior.dark = night; Interior.catch = night; Interior.ghostKid = false;
        song = night ? 'night' : 'day';
      }
      Interior.habitat = habitat;

      if (Interior.catch) this._spawnInteriorCritters(building, night, habitat);
      GB.Audio.playSong(song);

      // contextual hint
      if (kind === 'cave' && !GB.Story.fatherCaught)
        GB.UI.message('Something old and angry waits in the dark. Find it. (X to swing)', 4.5);
      else if (Interior.ghostKid)
        GB.UI.message('A little girl sits on the swings, alone. (Z to talk · X to catch)', 4.5);
      else if (Interior.catch)
        GB.UI.message('Swing your net at what stirs in here! (X)', 3.5);
      else
        GB.UI.message('Press Z to chat · Press X or step out the door to leave', 3);
    },

    _spawnInteriorCritters(building, night, habitat) {
      const n = habitat === 'cave' ? 4 : building.abandoned ? 2 : 3;
      const isNight = habitat === 'cave' ? true : night;
      for (let i = 0; i < n; i++) {
        const sp = GB.rollSpecies(habitat, isNight) || GB.rollSpecies(habitat, !isNight);
        if (!sp) continue;
        const c = GB.makeCritter(sp, GB.util.rand(T * 2, Interior.pxW - T * 2), GB.util.rand(T * 2, Interior.pxH - T * 3));
        GB.Catching.critters.push(c);
      }
      // the one-of-one father, present until he's caught
      if (habitat === 'cave' && !GB.Story.fatherCaught) {
        const dad = GB.makeCritter(GB.speciesById['g_father'], Interior.pxW / 2, T * 3);
        dad.life = 9999;
        GB.Catching.critters.push(dad);
      }
      if (night || habitat === 'cave') GB.Audio.sfx('ghost');
    },

    updateInterior(dt) {
      if (GB.UI.journalOpen) { GB.UI.journalInput(); this.drawInterior(); GB.UI.drawJournal(); return; }
      if (!GB.UI.dialogueActive() && GB.Input.justPressed('journal')) GB.UI.openJournal();

      const talking = GB.UI.dialogueActive();
      if (talking) { if (GB.Input.justPressed('a')) GB.UI.advanceDialogue(); }
      else {
        if (GB.Input.justPressed('a')) this.interiorInteract();
        if (GB.Input.justPressed('b')) {
          if (Interior.catch) this.doSwing();
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
      // the lonely girl in the park takes priority when you're beside her
      if (Interior.ghostKid) {
        const k = Interior.kidTile;
        const px = Math.floor(GB.Player.centerX() / T), py = Math.floor((GB.Player.y + GB.Player.h) / T);
        if (Math.abs(px - k.x) <= 1 && Math.abs(py - k.y) <= 2) { this.talkGhostKid(); return; }
      }
      if (Interior.catch) { this.doSwing(); return; }
      // talk to the building's keeper (town buildings, daytime)
      const keep = { store: 'shopkeeper', school: 'teacher', shrine: 'grandpa_sato', home: 'mum' }[Interior.building.kind];
      const d = keep && GB.getDialogue(keep, 'day');
      if (d) GB.UI.dialogue(d.name, d.lines);
      else GB.UI.dialogue('Clinic', ['A quiet waiting room. A nurse nods. "Mind the heat, little one."']);
    },

    // ----- the park girl questline -----
    _ghostTips() {
      return [
        '"Ghosts flee when you rush. Walk slow. Let them drift close."',
        '"Rare ones only come out when you go looking — lift, search, shake. Don\'t just wait."',
        '"The torch makes the dark smaller. Big things hide where it\'s darkest."',
        '"Nocturnal bugs love the water at night. The fireflies especially."',
        '"Be home before dawn. Getting caught isn\'t worth one more catch. ...Usually."',
        '"The abandoned places hold the shyest yokai. Bring a kind heart."',
      ];
    },

    talkGhostKid() {
      if (GB.Story.ghostKidFreed) return;
      // returned after the cave — she can rest now
      if (GB.Story.fatherCaught) { this._freeGhostKid(); return; }
      // first press each visit: a tip. next press: ask the question.
      if (!this._gkTip) {
        this._gkTip = true;
        GB.Audio.sfx('ghostgirl');
        GB.UI.dialogue('Lonely Girl', ['"…You came back. Most people don\'t."', GB.util.pick(this._ghostTips())]);
        return;
      }
      this._askGhostKid();
    },

    _askGhostKid() {
      GB.Audio.sfx('ghostgirl');
      // count one "separate" talk per night
      if (GB.Story.lastParkTalkDay !== GB.Reputation.day) {
        GB.Story.parkTalks++; GB.Story.lastParkTalkDay = GB.Reputation.day; GB.Story.save();
      }
      // the reveal, once she trusts you enough
      if (GB.Story.parkTalks >= GB.Story.REVEAL_TALKS && !GB.Story.fatherRevealed) {
        GB.Story.fatherRevealed = true; GB.Story.save();
        GB.Audio.stop(); GB.Audio.sfx('reveal');
        GB.UI.dialogue('Lonely Girl', [
          'You ask again: "How did you end up like this?"',
          'She is quiet a long, long time. Then, very small:',
          '"…It was my father. It was him."',
          '"He\'s still here. In a cave, deep in the night woods. He just… waits."',
          '"You\'d do that? For me? …Then go. Please. Let me rest."',
        ], () => { GB.Audio.playSong('park'); GB.UI.message('A cave has woken in the north woods. Be strong before you go in. (Lv.' + GB.Story.WOODS_LEVEL + ')', 6); });
        return;
      }
      // before the reveal — the same gentle refusal, each night a little closer
      GB.UI.dialogue('Lonely Girl', [
        'You ask: "How did you end up like this?"',
        '"I\'d tell you. But it\'s rude to talk bad about someone who\'s listening."',
        `(She trusts you a little more each night. ${GB.util.clamp(GB.Story.parkTalks, 0, GB.Story.REVEAL_TALKS)}/${GB.Story.REVEAL_TALKS})`,
      ]);
    },

    _freeGhostKid() {
      GB.Story.ghostKidFreed = true;
      const isNew = GB.Collection.record('g_parkgirl');
      GB.Story.addXp(30); GB.Story.save();
      Interior.ghostKid = false;
      GB.Audio.stop(); GB.Audio.playSong('freed'); GB.Audio.sfx('free');
      GB.UI.dialogue('The Girl in the Park', [
        '"You found him. You really… you let me go."',
        '"I\'ve been so tired, for so long. I think I can sleep now."',
        '"Thank you, Ryosuke. …Look after yourself too, okay? Truly."',
      ], () => GB.UI.message('★ The Girl in the Park joins your collection. One of one. ♥', 6));
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

    // ================= BEDROOM HUB =================
    enterBedroom(phase) {
      Bedroom.phase = phase;
      GB.env = Bedroom;
      this.mode = 'bedroom';
      Interior.exit();
      GB.Catching.reset();
      const ex = Bedroom.exitTile();
      GB.Player.x = ex.x * T - 3; GB.Player.y = (ex.y - 1) * T; GB.Player.dir = 1;
      this.cam.x = -(VW - Bedroom.pxW) / 2;
      this.cam.y = -(VH - Bedroom.pxH) / 2;
      GB.Audio.stopAmbience();
      GB.Audio.playSong('title');
      if (phase === 'morning') GB.UI.message('Morning! Head downstairs (the stairs at the bottom) to go outside.', 4);
      else GB.UI.message('Your room. Check your collection, play your handheld, or sleep (the bed).', 4);
    },

    updateBedroom(dt) {
      if (GB.UI.journalOpen) { GB.UI.journalInput(); this.drawBedroom(); GB.UI.drawJournal(); return; }
      if (!GB.UI.dialogueActive() && GB.Input.justPressed('journal')) GB.UI.openJournal();

      const talking = GB.UI.dialogueActive();
      if (talking) { if (GB.Input.justPressed('a')) GB.UI.advanceDialogue(); }
      else if (GB.Input.justPressed('a')) this.bedroomInteract();

      GB.Player.update(dt, !talking);

      // stepping onto the stairs
      const px = Math.floor(GB.Player.centerX() / T), py = Math.floor((GB.Player.y + GB.Player.h) / T);
      if (py >= Bedroom.rows - 1) {
        if (Bedroom.phase === 'morning') { this.goOutside(); return; }
        else { GB.Player.y -= 3; GB.UI.message("It's the middle of the evening… you should sleep. (the bed)", 2.5); }
      }
      this.drawBedroom();
    },

    bedroomInteract() {
      const f = GB.Player.facingTile();
      const o = Bedroom.facing(f.x, f.y) || Bedroom.facing(
        Math.floor(GB.Player.centerX() / T), Math.floor((GB.Player.y + GB.Player.h) / T));
      if (!o) return;
      switch (o.type) {
        case 'bed':
          if (Bedroom.phase === 'evening') this.goToSleep();
          else GB.UI.dialogue('Ryosuke', ['You\'re already up! Summer\'s waiting.']);
          break;
        case 'shelf':
          GB.Audio.sfx('book');
          GB.UI.openJournal();
          break;
        case 'desk':
          this.enterGameboy();
          break;
        case 'spiderweb':
          // the only interactable spiderweb is here, indoors. it's about Ryosuke, quietly.
          if (GB.Story.level >= 15) {
            GB.Audio.sfx('select');
            GB.UI.dialogue('Ryosuke', ['Ryosuke looks at the web a long moment.', 'Then, carefully, he clears it away. …He\'s getting there.']);
          } else {
            GB.UI.dialogue('Ryosuke', ['Ryosuke is scared of spiders.', 'These things take time.']);
          }
          break;
      }
    },

    goToSleep() {
      // owls, crickets, the night breathing — then waking in the dark.
      GB.Audio.stop();
      GB.Audio.startAmbience('night');
      this.playScene([
        { bg: '#10101e', title: '— Lights out —',
          text: 'You burrow under the covers. Outside, an owl calls. Crickets stitch the dark together. The house settles into sleep.' },
        { bg: '#0c0a16', render: 'wake', title: '— …? —',
          text: 'Something stirs you. Your eyes blink open in the dark. The clock glows midnight.' },
        { bg: '#0c0a16', render: 'wake', title: '— Awake —',
          text: 'You have woken in the dead of night. Go back to sleep?',
          choices: [
            { label: 'Yes — sleep until morning', color: '#9fe88a', act: () => { GB.Audio.stopAmbience(); this.startDawn(false); } },
            { label: 'No — slip out of the covers', color: '#b59aff', act: () => { GB.Audio.stopAmbience(); this.beginNight(); } },
          ] },
      ], null);
    },

    drawBedroom() {
      const c = this.ctx, cam = this.cam;
      this._clear('#1a1622');
      const night = Bedroom.phase === 'evening';
      const floor = night ? '#3a2e3a' : '#7a5a44';
      const wall = night ? '#2a2336' : '#9a7a5a';
      for (let y = 1; y < Bedroom.rows - 1; y++)
        for (let x = 1; x < Bedroom.cols - 1; x++) {
          c.fillStyle = ((x + y) % 2 === 0) ? floor : GB.util.mix(floor, '#000', 0.1);
          c.fillRect(x * T - cam.x, y * T - cam.y, T, T);
        }
      for (let x = 0; x < Bedroom.cols; x++) this._wallTile(c, x, 0, wall);
      for (let y = 0; y < Bedroom.rows; y++) { this._wallTile(c, 0, y, wall); this._wallTile(c, Bedroom.cols - 1, y, wall); }
      // stairs mat
      const ex = Bedroom.exitTile();
      c.fillStyle = '#4a3424';
      c.fillRect((ex.x - 1) * T - cam.x, (ex.y) * T - cam.y, T * 2, T);
      GB.UI._text(c, night ? 'sleep' : 'stairs', (ex.x - 1) * T - cam.x + 3, ex.y * T - cam.y + 4, '#caa05a');

      // furniture
      const have = GB.Collection.totals().all;
      for (const o of Bedroom.objects) {
        const ox = o.gx * T - cam.x, oy = o.gy * T - cam.y;
        if (o.type === 'bed') GB.Sprites.bed(c, ox, oy);
        else if (o.type === 'shelf') GB.Sprites.shelf(c, ox, oy, have);
        else if (o.type === 'desk') GB.Sprites.desk(c, ox, oy);
        else if (o.type === 'spiderweb') GB.Sprites.spiderweb(c, ox, oy);
        else if (o.type === 'window') GB.Sprites.window(c, ox, oy, night);
      }

      GB.Player.draw(c, cam);

      if (night) {
        c.fillStyle = 'rgba(20,18,40,0.45)'; c.fillRect(0, 0, VW, VH);
      }
      // header
      c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, VW, 12);
      GB.UI._text(c, (night ? '☾ ' : '☀ ') + 'Ryosuke\'s Room  ·  Lv.' + GB.Story.level, 4, 2, '#ffe9a8');
      GB.UI.drawMessage();
      GB.UI.drawDialogue();
    },

    // ----- Game Boy handheld mini-distraction -----
    enterGameboy() {
      this.mode = 'gameboy';
      this._gb = { t: 0, x: 80, y: 90, vx: 70, vy: 55, score: 0 };
      GB.Audio.sfx('gameboy');
    },
    updateGameboy(dt) {
      const g = this._gb; g.t += dt;
      // a tiny bouncing critter you watch (and can boop with A for points)
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (g.x < 70 || g.x > 240) g.vx *= -1;
      if (g.y < 70 || g.y > 150) g.vy *= -1;
      if (GB.Input.justPressed('a')) {
        if (GB.util.dist(g.x, g.y, 160, 170) < 9999) { g.score++; g.vx *= -1; g.vy *= -1; GB.Audio.sfx('blip'); }
      }
      if (GB.Input.justPressed('b')) { GB.Audio.sfx('book'); this.mode = 'bedroom'; return; }
      this.drawGameboy();
    },
    drawGameboy() {
      const c = this.ctx;
      this._clear('#2a2640');
      // big handheld shell
      c.fillStyle = '#b8b0a0'; c.fillRect(70, 30, 180, 190);
      c.fillStyle = '#8a8478'; c.fillRect(70, 30, 180, 6);
      // screen
      c.fillStyle = '#2a3a2a'; c.fillRect(90, 50, 140, 110);
      c.fillStyle = '#9bd86a'; c.fillRect(94, 54, 132, 102);
      // bouncing critter on screen
      const g = this._gb;
      c.save(); c.translate(g.x, g.y); c.scale(1.4, 1.4);
      GB.Sprites.critter(c, 0, 0, GB.speciesById['ladybug'], g.t);
      c.restore();
      GB.UI._text(c, 'POKÉ-BUG  ' + g.score, 100, 58, '#2a3a2a');
      // controls
      c.fillStyle = '#3a3a44'; c.fillRect(96, 180, 16, 16);
      c.fillStyle = '#a03a4a'; c.beginPath(); c.arc(210, 190, 9, 0, Math.PI*2); c.fill();
      GB.UI._text(c, '[Z] boop   [X] put it down', 78, 205, '#3a3024');
    },

    // ================= SCENE RUNNER (generic cutscenes + choices) =================
    // steps: { bg, title, text, render?, choices?:[{label,color,act}] }
    playScene(steps, onEnd) {
      this.scene = { steps, i: 0, onEnd: onEnd || null };
      this.mode = 'scene';
      GB.UI.dlg = null;
    },

    updateScene(dt) {
      const s = this.scene; if (!s) return;
      this._sceneT = (this._sceneT || 0) + dt;
      const step = s.steps[s.i];
      if (step.choices) {
        if (GB.Input.justPressed('a')) { GB.Audio.sfx('select'); step.choices[0].act(); return; }
        if (step.choices[1] && GB.Input.justPressed('b')) { GB.Audio.sfx('select'); step.choices[1].act(); return; }
      } else if (GB.Input.justPressed('a') || GB.Input.justPressed('b')) {
        GB.Audio.sfx('blip');
        s.i++; this._sceneT = 0;
        if (s.i >= s.steps.length) {
          const cb = s.onEnd; this.scene = null;
          if (cb) cb(); else { this.mode = 'play'; }
          return;
        }
      }
      if (this.scene && this.mode === 'scene') this.drawScene();
    },

    drawScene() {
      const c = this.ctx;
      const step = this.scene.steps[this.scene.i];
      this._clear(step.bg || '#1c1830');
      const g = c.createRadialGradient(VW/2, VH/2, 40, VW/2, VH/2, 180);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      c.fillStyle = g; c.fillRect(0, 0, VW, VH);

      if (step.render === 'school') this._drawSchool(c);
      else if (step.render === 'wakeup') this._drawWakeup(c, false);
      else if (step.render === 'wake') this._drawWakeup(c, true);
      else if (step.render === 'enclosures') this._drawEnclosures(c);
      else if (step.render === 'family') this._drawFamily(c);
      else if (step.render === 'black') { /* just darkness */ }

      if (step.title) GB.UI._text(c, step.title, VW/2, 24, '#ffe9a8', 'center');
      if (step.text) {
        const x = 22, y = VH - 72, w = VW - 44;
        GB.UI._panel(c, x, y, w, step.choices ? 62 : 50);
        const after = GB.UI._wrap(c, step.text, x + 8, y + 8, w - 16, '#f4ecd6');
        if (step.choices) {
          step.choices.forEach((ch, k) => {
            GB.UI._text(c, `[${k === 0 ? 'Z' : 'X'}] ${ch.label}`, x + 8, after + 2 + k * 11, ch.color || '#e8e0c0');
          });
        } else if (GB.util.pulse(performance.now()/200, 1) > 0.5) {
          GB.UI._text(c, '▼ Z', x + w - 26, y + 36, '#9a8ad0');
        }
      }
    },

    // ----- scene backdrops -----
    _drawSchool(c) {
      const t = this._sceneT || 0;
      // sky
      c.fillStyle = '#ffd9a0'; c.fillRect(0, 0, VW, VH);
      c.fillStyle = '#fff4c0'; c.beginPath(); c.arc(VW - 50, 50, 22, 0, Math.PI * 2); c.fill();
      // ground
      c.fillStyle = '#7ac060'; c.fillRect(0, 150, VW, VH - 150);
      c.fillStyle = '#cdab78'; c.fillRect(0, 150, VW, 18);
      // school building
      GB.Sprites.building(c, 90, 64, 9, 6, 'school', false);
      GB.UI._text(c, 'Akebono Elementary', 96, 56, '#3a2a44');
      // kids running out, bags swinging
      const cols = ['#ce5a78', '#4a8acc', '#5aaa5a', '#e0b040', '#9a6ad0'];
      for (let i = 0; i < 6; i++) {
        const sx = ((i * 53 + t * 70) % (VW + 40)) - 20;
        const sy = 158 + (i % 3) * 8;
        const fr = Math.floor((t * 6 + i)) % 2;
        GB.Sprites.npc(c, sx, sy, { body: cols[i % cols.length], hair: '#3a2a1a' }, fr);
        // little dust
        c.fillStyle = 'rgba(200,180,140,0.5)'; c.fillRect(sx - 2, sy + 14, 2, 2);
      }
    },

    _drawWakeup(c, midnight) {
      c.fillStyle = midnight ? '#0e0c1a' : '#caa05a';
      c.fillRect(0, 0, VW, VH);
      // window glow
      GB.Sprites.window(c, VW / 2 - 8, 40, midnight);
      // Ryosuke in bed, eyes blinking open
      const bx = VW / 2 - 16, by = 110;
      GB.Sprites.bed(c, bx, by);
      // head on pillow
      c.fillStyle = '#f2c89a'; c.fillRect(bx + 4, by + 2, 8, 7);
      c.fillStyle = '#3a2a1a'; c.fillRect(bx + 3, by, 10, 3);
      // blinking eyes: open amount grows with scene time
      const t = this._sceneT || 0;
      const open = GB.util.clamp((t - 0.4) * 1.5, 0, 1) * (0.6 + 0.4 * Math.abs(Math.sin(t * 3)));
      c.fillStyle = '#2a2030';
      const eh = Math.max(1, Math.round(open * 2));
      c.fillRect(bx + 6, by + 4, 1, eh);
      c.fillRect(bx + 9, by + 4, 1, eh);
      if (midnight) {
        c.fillStyle = 'rgba(120,120,200,0.12)'; c.fillRect(0, 0, VW, VH);
      }
    },

    _drawFamily(c) {
      // dinner table silhouette with the family + grandparents
      c.fillStyle = '#3a2436'; c.fillRect(0, 0, VW, VH);
      c.fillStyle = '#5a3a2a'; c.fillRect(VW/2 - 70, 150, 140, 10); // table
      const people = [
        { x: VW/2 - 78, c: '#6a6a8a', label: 'Dad' },
        { x: VW/2 - 48, c: '#ce5a78', label: 'Mum' },
        { x: VW/2 - 8,  c: '#4a8acc', label: 'You' },
        { x: VW/2 + 30, c: '#9a8a7a', label: 'Obaachan' },
        { x: VW/2 + 60, c: '#8a8a7a', label: 'Ojiichan' },
      ];
      people.forEach(p => {
        c.save(); c.translate(p.x, 118); c.scale(1.6, 1.6);
        GB.Sprites.npc(c, 0, 0, { body: p.c, hair: '#cfcfcf' }, 0);
        c.restore();
      });
      // warm lamp glow
      const g = c.createRadialGradient(VW/2, 90, 10, VW/2, 90, 120);
      g.addColorStop(0, 'rgba(255,210,120,0.18)'); g.addColorStop(1, 'rgba(255,210,120,0)');
      c.fillStyle = g; c.fillRect(0, 0, VW, VH);
    },

    _drawEnclosures(c) {
      const have = GB.Collection.enclosures();
      const cols = 8, cell = 22, startX = (VW - cols * cell) / 2, startY = 56;
      for (let i = 0; i < 24; i++) {
        const cx = startX + (i % cols) * cell, cy = startY + Math.floor(i / cols) * cell;
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

    // ================= EVENING / DINNER =================
    startEvening() {
      const onTime = GB.Reputation.homeOnTime && !GB.Time.curfew;
      GB.Reputation.cameHome(onTime);

      // The grandparents arrive for dinner on the second Saturday.
      if (GB.Story.isGrandparentsDay() && !GB.Story.grandparentsVisited) {
        this.startGrandparentsDinner(onTime);
        return;
      }

      GB.Audio.playSong('title');
      GB.Audio.sfx('dinner');
      const steps = [
        { bg: '#3a2a44', title: '— Home before dark —',
          text: onTime ? 'You kick off your sandals as the streetlights flicker on. Mum smiles from the kitchen.'
                       : "You creep in late. Mum's arms are folded. Dad pretends to read the paper." },
        { bg: '#5a3a3a', title: '— Dinner —', text: GB.getDialogue('mum', 'dinner').lines[0] },
        { bg: '#5a3a3a', title: '— Dinner —', text: GB.getDialogue('dad', 'dinner').lines[0] },
      ];
      // Day 1: Mum announces the grandparents' visit.
      if (GB.Reputation.day === 1 && !GB.Story.grandparentsAnnounced) {
        GB.Story.grandparentsAnnounced = true; GB.Story.save();
        steps.push({ bg: '#4a3550', title: '— Mum —',
          text: 'Mum: "Ryosuke — Obaachan and Ojiichan are coming next Saturday. A whole week away. I want it to be nice, ne?"' });
      }
      this.playScene(steps, () => this.enterBedroom('evening'));
    },

    startGrandparentsDinner(onTime) {
      GB.Story.grandparentsVisited = true; GB.Story.save();
      GB.Audio.stopAmbience();
      GB.Audio.playSong('tender');   // the scene's whole heart is in this music
      const askStep = {
        bg: '#2a2436', render: 'family', title: '— Dinner with Obaachan & Ojiichan —',
        text: 'The table is warm and full. Then Obaachan sets down her tea, takes your hand, and asks softly:\n"How have you been feeling lately, Ryosuke? Is it getting a little better?"',
        choices: [
          { label: '"…I\'m not better."', color: '#bfe3ff', act: () => this.grandparentsTruth() },
          { label: 'Lie — "I\'ve been better."', color: '#d0a0c0', act: () => this.grandparentsLie() },
        ],
      };
      const intro = [
        { bg: '#3a2a44', render: 'family', title: '— They\'re here —',
          text: 'You come home to shoes by the door you don\'t recognise. Obaachan and Ojiichan are at the table. The house smells of home.' },
        { bg: '#2a2436', render: 'family', title: '— Dinner —',
          text: 'Ojiichan ruffles your hair. Obaachan has made all your favourites. For a little while, everything is soft and golden.' },
        askStep,
      ];
      this.playScene(intro, null); // choice step handles the branch
    },

    grandparentsTruth() {
      GB.Story.liedToGrandparents = false; GB.Story.save();
      const steps = [
        { bg: '#2a2436', render: 'family', title: '— The truth —',
          text: 'The words come out small. The table goes quiet — but not a cold quiet.' },
        { bg: '#2a2436', render: 'family', title: '— Obaachan —',
          text: 'She squeezes your hand. "Thank you for telling us, Ryosuke. We\'re here. Zenbu daijoubu — we\'ll get through it together."' },
        { bg: '#2a2436', render: 'family', title: '— Dad —',
          text: 'Dad clears his throat, eyes shiny. "That took real guts, buddy. Braver than your old man ever was."' },
      ];
      GB.Story.addXp(20);
      this.playScene(steps, () => this.enterBedroom('evening'));
    },

    grandparentsLie() {
      GB.Story.liedToGrandparents = true; GB.Story.save();
      const steps = [
        { bg: '#241f30', render: 'family', title: '— The lie —',
          text: '"I\'ve been better," you say. It comes out easy. Too easy.' },
        { bg: '#241f30', render: 'family', title: '— Ojiichan —',
          text: 'Ojiichan says nothing. He just looks at you a moment, then quietly looks away.' },
        { bg: '#1f1b2a', render: 'family', title: '— Mum —',
          text: 'Mum sets down her chopsticks. Without looking up, she says it for you, gently: "…He\'s still struggling."' },
        { bg: '#1a1726', render: 'family', title: null,
          text: 'No one is angry. That\'s almost worse. The lie settles in your chest like a stone — heavier than any bug you\'ve carried.' },
      ];
      this.playScene(steps, () => this.enterBedroom('evening'));
    },

    startDawn(caught) {
      GB.Audio.stopAmbience();
      GB.Audio.playSong('title');
      const t = GB.Collection.totals();
      const summary = caught
        ? "You're grounded for the morning. Worth it? …Mostly."
        : (GB.Reputation.standing >= 2 ? 'A good kid, by all accounts. Mum is proud.'
                                       : 'Another summer day begins.');
      const steps = [
        { bg: '#caa05a', render: 'wakeup', title: '— Dawn —', text: 'Light leaks under the curtains. The cicadas start up again.' },
        { bg: '#e0b86a', title: `— End of Day ${GB.Reputation.day} (${GB.Reputation.weekday()}) —`,
          text: `Collection ${t.all}/${t.allTotal} · Lv.${GB.Story.level} · ${GB.Reputation.standingLabel()}. ${summary}` },
      ];
      this.playScene(steps, () => { GB.Reputation.nextDay(); this.startMorning(); });
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
      const cave = Interior.location === 'cave';
      const park = Interior.location === 'park';
      const floor = cave ? '#2a2630' : park ? (Interior.dark ? '#2a3a2a' : '#5a8a4a') : (Interior.dark ? '#2a2438' : '#6a5240');
      const wall = cave ? '#201c28' : park ? '#3a5a2a' : (Interior.dark ? '#1f1b2e' : '#4a3628');
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

      // a swing set in the park
      if (park) {
        const sx = 3 * T - cam.x, sy = 1 * T - cam.y;
        c.strokeStyle = '#7a5a3a'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 8, sy + 20); c.moveTo(sx + 28, sy); c.lineTo(sx + 20, sy + 20); c.stroke();
        c.fillStyle = '#5a4030'; c.fillRect(sx + 8, sy + 18, 12, 2);
      }

      // a keeper NPC by day (town buildings only)
      if (!Interior.catch) {
        c.save(); c.translate((Interior.cols / 2 + 1) * T - cam.x, 2 * T - cam.y);
        GB.Sprites.npc(c, 0, 0, { body: '#8a5a4a', hair: '#2a2a2a' }, 0);
        c.restore();
      }

      // the lonely girl, on the swings
      if (Interior.ghostKid) {
        GB.Sprites.ghostKid(c, Interior.kidTile.x * T - cam.x, Interior.kidTile.y * T - cam.y, GB.World.time, false);
      }

      GB.Catching.draw(c, cam);
      GB.Player.draw(c, cam);

      if (Interior.dark) this._interiorDark(c);
      // header
      c.fillStyle = 'rgba(20,16,30,0.6)'; c.fillRect(0, 0, VW, 12);
      const tag = cave ? ' (deep dark)' : Interior.dark ? ' (after dark)' : '';
      GB.UI._text(c, (Interior.dark ? '☾ ' : '') + Interior.building.name + tag, 4, 2, '#ffe9a8');
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
        // carve a cozy lantern pool around the kid — wider with the torch
        const r = GB.Story.hasTorch ? 96 : 60;
        const px = GB.Player.centerX() - this.cam.x, py = GB.Player.centerY() - this.cam.y;
        const g = c.createRadialGradient(px, py, 14, px, py, r);
        g.addColorStop(0, 'rgba(0,0,0,0.92)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalCompositeOperation = 'destination-out';
        c.fillStyle = g; c.beginPath(); c.arc(px, py, r, 0, Math.PI * 2); c.fill();
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
