// Ghostbug — the collection log ("Mushizukan" + Yokai roll) and save data.
(function (GB) {
  const KEY = 'ghostbug.collection.v1';

  const Collection = {
    counts: {},     // id -> times caught
    firstDay: {},   // id -> day number first caught

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw);
          this.counts = d.counts || {};
          this.firstDay = d.firstDay || {};
        }
      } catch (e) { /* fresh */ }
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify({ counts: this.counts, firstDay: this.firstDay })); }
      catch (e) { /* ignore */ }
    },

    record(id) {
      const isNew = !this.counts[id];
      this.counts[id] = (this.counts[id] || 0) + 1;
      if (isNew) this.firstDay[id] = GB.Reputation ? GB.Reputation.day : 1;
      this.save();
      return isNew;
    },

    has(id) { return !!this.counts[id]; },
    count(id) { return this.counts[id] || 0; },

    totals() {
      const bugs = GB.SPECIES.filter(s => s.kind === 'bug');
      const ghosts = GB.SPECIES.filter(s => s.kind === 'ghost');
      const haveB = bugs.filter(s => this.has(s.id)).length;
      const haveG = ghosts.filter(s => this.has(s.id)).length;
      return {
        bugs: haveB, bugsTotal: bugs.length,
        ghosts: haveG, ghostsTotal: ghosts.length,
        all: haveB + haveG, allTotal: bugs.length + ghosts.length,
      };
    },

    // for the bedroom: how many "enclosures" are filled — drives that growing display
    enclosures() {
      return GB.SPECIES.filter(s => this.has(s.id)).map(s => s.id);
    },
  };

  GB.Collection = Collection;
})(window.GB);
