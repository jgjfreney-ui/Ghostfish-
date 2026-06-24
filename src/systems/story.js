// Ghostbug — story state: levels, XP, inventory, and the narrative flags that
// make Ryosuke's world (and his parents) respond to what has happened.
(function (GB) {
  const KEY = 'ghostbug.story.v1';

  const Story = {
    started: false,        // has the intro played on this save?
    level: 1,
    xp: 0,

    // items the parents hand you on the first morning
    hasNet: false,
    hasTorch: false,
    hasCamera: false,

    // narrative flags — dialogue reads these
    grandparentsAnnounced: false,
    grandparentsVisited: false,
    liedToGrandparents: null,   // null = not asked yet, true = lied, false = told truth
    photos: 0,                  // bugs photographed with the camera

    GRANDPARENTS_DAY: 8,        // the next Saturday

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) Object.assign(this, JSON.parse(raw));
      } catch (e) { /* fresh */ }
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          started: this.started, level: this.level, xp: this.xp,
          hasNet: this.hasNet, hasTorch: this.hasTorch, hasCamera: this.hasCamera,
          grandparentsAnnounced: this.grandparentsAnnounced,
          grandparentsVisited: this.grandparentsVisited,
          liedToGrandparents: this.liedToGrandparents, photos: this.photos,
        }));
      } catch (e) { /* ignore */ }
    },

    xpForNext() { return 6 + this.level * 6; },

    // returns the number of levels gained (0 if none)
    addXp(n) {
      this.xp += n;
      let gained = 0;
      while (this.xp >= this.xpForNext()) {
        this.xp -= this.xpForNext();
        this.level++;
        gained++;
      }
      this.save();
      return gained;
    },

    // is it the day the grandparents come for dinner?
    isGrandparentsDay() {
      return GB.Reputation && GB.Reputation.day === this.GRANDPARENTS_DAY;
    },
  };

  GB.Story = Story;
})(window.GB);
