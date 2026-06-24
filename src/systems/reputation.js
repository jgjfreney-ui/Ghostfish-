// Ghostbug — the week, chores, and the good-kid / bad-kid standing with parents.
(function (GB) {
  const KEY = 'ghostbug.rep.v1';
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const Reputation = {
    day: 1,            // day counter (1..)
    standing: 0,       // -10 (rascal) .. +10 (good kid)
    sneakCount: 0,     // nights snuck out
    caughtCount: 0,    // times caught sneaking
    chore: null,       // today's chore { text, done }
    homeOnTime: true,

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) Object.assign(this, JSON.parse(raw));
      } catch (e) { /* fresh */ }
      if (!this.chore) this.rollChore();
    },
    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify({
          day: this.day, standing: this.standing, sneakCount: this.sneakCount,
          caughtCount: this.caughtCount, chore: this.chore, homeOnTime: this.homeOnTime,
        }));
      } catch (e) { /* ignore */ }
    },

    weekday() { return DAYS[(this.day - 1) % 7]; },

    standingLabel() {
      if (this.standing >= 6) return 'Golden Child';
      if (this.standing >= 2) return 'Good Kid';
      if (this.standing > -2) return 'Ordinary Kid';
      if (this.standing > -6) return 'Bit of a Rascal';
      return 'Little Troublemaker';
    },

    adjust(n) { this.standing = GB.util.clamp(this.standing + n, -10, 10); this.save(); },
    goodDeed(n = 1) { this.adjust(n); },
    badDeed(n = 1) { this.adjust(-n); },

    rollChore() {
      this.chore = {
        text: GB.util.pick([
          'Water the morning-glories by the door.',
          'Take the recycling to the store.',
          'Sweep the front step.',
          'Buy mosquito coils from the shop.',
          'Help Dad carry the cooler in.',
        ]),
        done: false,
      };
      this.save();
    },

    completeChore() {
      if (this.chore && !this.chore.done) { this.chore.done = true; this.goodDeed(1); this.save(); return true; }
      return false;
    },

    sneakOut() { this.sneakCount++; this.save(); },
    gotCaught() { this.caughtCount++; this.badDeed(3); this.save(); },
    cameHome(onTime) {
      this.homeOnTime = onTime;
      if (onTime) this.goodDeed(1); else this.badDeed(2);
    },

    nextDay() {
      this.day++;
      this.homeOnTime = true;
      this.rollChore();
      this.save();
    },
  };

  GB.Reputation = Reputation;
})(window.GB);
