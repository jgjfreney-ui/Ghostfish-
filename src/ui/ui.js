// Ghostbug — HUD, dialogue, toasts, and the collection journal.
(function (GB) {
  const VW = GB.VIEW_W, VH = GB.VIEW_H;

  const UI = {
    ctx: null,
    msg: null, msgT: 0,
    dlg: null,                 // { name, lines, i, onDone }
    journalOpen: false,
    journalPage: 0,
    journalSel: 0,

    setup(ctx) { this.ctx = ctx; },

    // --- transient toast ---
    message(text, dur = 3) { this.msg = text; this.msgT = dur; },

    // --- npc / story dialogue (blocks movement until done) ---
    dialogue(name, lines, onDone) {
      this.dlg = { name, lines: Array.isArray(lines) ? lines : [lines], i: 0, onDone: onDone || null };
      GB.Audio.sfx('blip');
    },
    dialogueActive() { return !!this.dlg; },
    advanceDialogue() {
      if (!this.dlg) return;
      this.dlg.i++;
      if (this.dlg.i >= this.dlg.lines.length) {
        const cb = this.dlg.onDone; this.dlg = null;
        if (cb) cb();
      } else GB.Audio.sfx('blip');
    },

    update(dt) {
      if (this.msgT > 0) { this.msgT -= dt; if (this.msgT <= 0) this.msg = null; }
    },

    // ============ HUD ============
    drawHUD() {
      const c = this.ctx;
      // top bar
      c.fillStyle = 'rgba(20,16,30,0.62)';
      c.fillRect(0, 0, VW, 14);
      this._text(c, `Day ${GB.Reputation.day} · ${GB.Reputation.weekday()}`, 4, 4, '#ffe9a8');
      const clock = GB.Time.clockString();
      const moon = GB.Time.isNight ? '☾ ' : '☀ ';
      this._text(c, moon + clock, 116, 4, GB.Time.isNight ? '#b9c8ff' : '#ffe9a8');

      const t = GB.Collection.totals();
      this._text(c, `Lv${GB.Story.level}`, 168, 4, '#ffd24a');
      this._text(c, `✦${t.all}/${t.allTotal}`, 196, 4, '#bfe3ff');
      // item icons (net / torch / camera) once owned
      let ix = 236;
      if (GB.Story.hasNet) { this._text(c, '⌒', ix, 4, '#e8e8f0'); ix += 10; }
      if (GB.Story.hasTorch) { this._text(c, '▮', ix, 4, '#ffd24a'); ix += 10; }
      if (GB.Story.hasCamera) { this._text(c, '⊡', ix, 4, '#9ad0ff'); ix += 10; }
      this._text(c, GB.Reputation.standingLabel(), VW - 2, 4, this._standColor(), 'right');

      // chore reminder (small, lower-left) during day
      if (!GB.Time.isNight && GB.Reputation.chore && !GB.Reputation.chore.done) {
        c.fillStyle = 'rgba(20,16,30,0.5)';
        c.fillRect(0, VH - 12, 180, 12);
        this._text(c, '✎ ' + GB.Reputation.chore.text, 4, VH - 10, '#cfc0e0');
      }
    },

    _standColor() {
      const s = GB.Reputation.standing;
      if (s >= 2) return '#9fe88a';
      if (s > -2) return '#e8e0c0';
      return '#e88a8a';
    },

    // ============ MESSAGE TOAST ============
    drawMessage() {
      if (!this.msg) return;
      const c = this.ctx;
      const w = Math.min(VW - 16, this.msg.length * 5 + 16);
      const x = (VW - w) / 2, y = VH - 46;
      this._panel(c, x, y, w, 18);
      this._text(c, this.msg, x + 8, y + 6, '#f4ecd6');
    },

    // ============ DIALOGUE ============
    drawDialogue() {
      if (!this.dlg) return;
      const c = this.ctx;
      const x = 12, y = VH - 56, w = VW - 24, h = 44;
      this._panel(c, x, y, w, h);
      this._text(c, this.dlg.name, x + 8, y + 5, '#ffd24a');
      this._wrap(c, this.dlg.lines[this.dlg.i], x + 8, y + 17, w - 16, '#f4ecd6');
      // blinking prompt
      if (GB.util.pulse(performance.now() / 200, 1) > 0.5)
        this._text(c, '▼ Z', x + w - 28, y + h - 10, '#9a8ad0');
    },

    // ============ JOURNAL ============
    openJournal() { this.journalOpen = true; this.journalSel = 0; this.journalPage = 0; GB.Audio.sfx('select'); }
    ,
    closeJournal() { this.journalOpen = false; GB.Audio.sfx('blip'); },
    journalInput() {
      if (GB.Input.justPressed('journal') || GB.Input.justPressed('b')) { this.closeJournal(); return; }
      const list = this._journalList();
      if (GB.Input.justPressed('down')) { this.journalSel = (this.journalSel + 1) % list.length; GB.Audio.sfx('blip'); }
      if (GB.Input.justPressed('up')) { this.journalSel = (this.journalSel - 1 + list.length) % list.length; GB.Audio.sfx('blip'); }
      if (GB.Input.justPressed('a')) { this.journalPage = this.journalPage === 0 ? 1 : 0; GB.Audio.sfx('blip'); }
    },
    _journalList() {
      const kind = this.journalPage === 0 ? 'bug' : 'ghost';
      return GB.SPECIES.filter(s => s.kind === kind);
    },
    drawJournal() {
      const c = this.ctx;
      c.fillStyle = 'rgba(14,10,20,0.94)';
      c.fillRect(0, 0, VW, VH);
      // header tabs
      const t = GB.Collection.totals();
      this._text(c, 'MUSHIZUKAN — Collection Log', 10, 8, '#ffe9a8');
      this._text(c, this.journalPage === 0 ? `▣ BUGS ${t.bugs}/${t.bugsTotal}   ghosts ${t.ghosts}/${t.ghostsTotal}`
                                            : `bugs ${t.bugs}/${t.bugsTotal}   ▣ GHOSTS ${t.ghosts}/${t.ghostsTotal}`,
        10, 20, '#bfe3ff');
      this._text(c, '[A] flip page   [J/X] close', 10, VH - 12, '#7a6ea0');

      const list = this._journalList();
      this.journalSel = GB.util.clamp(this.journalSel, 0, list.length - 1);
      // left: list
      const top = 34, rowH = 14;
      const maxRows = 12;
      const start = GB.util.clamp(this.journalSel - 5, 0, Math.max(0, list.length - maxRows));
      for (let r = 0; r < Math.min(maxRows, list.length); r++) {
        const s = list[start + r]; if (!s) break;
        const y = top + r * rowH;
        const sel = (start + r) === this.journalSel;
        if (sel) { c.fillStyle = 'rgba(107,75,176,0.5)'; c.fillRect(6, y - 2, 150, rowH); }
        const have = GB.Collection.has(s.id);
        const label = have ? s.name : '— — —';
        this._text(c, (sel ? '▶ ' : '  ') + label, 10, y, have ? '#f4ecd6' : '#5a5470');
        if (have) this._text(c, '×' + GB.Collection.count(s.id), 130, y, '#9a8ad0');
      }

      // right: detail card
      const sp = list[this.journalSel];
      const dx = 168, dy = 34, dw = VW - dx - 8, dh = 150;
      this._panel(c, dx, dy, dw, dh);
      const have = GB.Collection.has(sp.id);
      // big sprite preview
      c.save();
      c.translate(dx + dw / 2 - 16, dy + 16); c.scale(3, 3);
      if (have) GB.Sprites.critter(c, 0, 0, sp, performance.now() / 1000);
      else { c.fillStyle = '#2a2438'; c.fillRect(0, 0, 12, 12); this._text(c, '?', 4, 2, '#5a5470'); }
      c.restore();
      this._text(c, have ? sp.name : '???', dx + 8, dy + 60, '#ffe9a8');
      this._text(c, 'rarity ' + '★'.repeat(sp.rarity), dx + 8, dy + 72, '#ffd24a');
      this._text(c, have ? this._habitatLabel(sp) : 'not yet discovered', dx + 8, dy + 84, '#bfe3ff');
      if (have) this._wrap(c, sp.blurb, dx + 8, dy + 98, dw - 16, '#cfc0e0');
    },

    _habitatLabel(sp) {
      const h = { rock: 'under rocks', grass: 'in the grass', tree: 'on tree trunks',
        water: "at the water's edge", ghost: 'in shut-up buildings', abandoned: 'in abandoned places' }[sp.habitat];
      const when = sp.time === 'night' ? ' · night' : sp.time === 'day' ? ' · day' : '';
      return h + when;
    },

    // ============ helpers ============
    _panel(c, x, y, w, h) {
      c.fillStyle = 'rgba(28,22,44,0.95)';
      c.fillRect(x, y, w, h);
      c.strokeStyle = '#7a5ac8'; c.lineWidth = 1;
      c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      c.strokeStyle = '#ffe9a8';
      c.strokeRect(x + 2.5, y + 2.5, w - 5, h - 5);
    },
    _text(c, str, x, y, color, align) {
      c.font = '8px ui-monospace, monospace';
      c.textBaseline = 'top';
      c.textAlign = align || 'left';
      c.fillStyle = '#000';
      c.fillText(str, x + 1, y + 1);
      c.fillStyle = color || '#fff';
      c.fillText(str, x, y);
      c.textAlign = 'left';
    },
    _wrap(c, str, x, y, maxW, color) {
      c.font = '8px ui-monospace, monospace';
      const words = String(str).split(' ');
      let line = '', yy = y;
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (c.measureText(test).width > maxW && line) {
          this._text(c, line, x, yy, color); yy += 10; line = w;
        } else line = test;
      }
      if (line) this._text(c, line, x, yy, color);
      return yy + 10;
    },
  };

  GB.UI = UI;
})(window.GB);
