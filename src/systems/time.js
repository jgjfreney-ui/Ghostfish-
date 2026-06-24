// Ghostbug — day/night clock, ambient light, curfew + the cozy->spooky flip.
(function (GB) {
  const Time = {
    phase: 'day',          // 'day' | 'dusk' | 'night'
    // in-game clock in minutes-from-midnight
    clock: 9 * 60,         // start 09:00
    dark: 0,               // 0 bright .. 1 midnight
    duskWarned: false,
    curfew: false,

    DAY_START: 9 * 60,
    DUSK_AT: 18 * 60,      // sun starts going down
    CURFEW_AT: 19 * 60,    // must be home
    NIGHT_START: 0,        // 00:00
    DAWN_AT: 4 * 60,       // sneak-out window ends ~4am

    // real seconds for a full segment
    DAY_LEN: 210,
    NIGHT_LEN: 150,

    reset(phase) {
      this.phase = phase;
      this.duskWarned = false;
      this.curfew = false;
      if (phase === 'day') { this.clock = this.DAY_START; }
      else if (phase === 'night') { this.clock = this.NIGHT_START; }
    },

    get isNight() { return this.phase === 'night'; },

    // returns an event string when a threshold is crossed, else null
    update(dt) {
      let event = null;
      if (this.phase === 'day' || this.phase === 'dusk') {
        const span = this.CURFEW_AT - this.DAY_START + 60; // a touch past curfew
        this.clock += (span / this.DAY_LEN) * dt;
        if (this.clock >= this.DUSK_AT && this.phase === 'day') {
          this.phase = 'dusk';
          event = 'dusk';
        }
        if (this.clock >= this.CURFEW_AT && !this.curfew) {
          this.curfew = true;
          event = 'curfew';
        }
      } else if (this.phase === 'night') {
        const span = this.DAWN_AT - this.NIGHT_START;
        this.clock += (span / this.NIGHT_LEN) * dt;
        if (this.clock >= this.DAWN_AT) event = 'dawn';
      }
      this._computeDark();
      return event;
    },

    _computeDark() {
      const c = this.clock;
      if (this.phase === 'night') {
        // deep night, eases toward dawn
        const k = (c - this.NIGHT_START) / (this.DAWN_AT - this.NIGHT_START);
        this.dark = 0.82 - k * 0.25;
      } else if (c >= this.DUSK_AT) {
        const k = GB.util.clamp((c - this.DUSK_AT) / (this.CURFEW_AT + 60 - this.DUSK_AT), 0, 1);
        this.dark = 0.15 + k * 0.55;
      } else {
        // gentle morning->noon->afternoon shimmer
        const k = (c - this.DAY_START) / (this.DUSK_AT - this.DAY_START);
        this.dark = 0.12 - Math.sin(k * Math.PI) * 0.1;
      }
      this.dark = GB.util.clamp(this.dark, 0, 0.85);
    },

    clockString() {
      const m = Math.floor(this.clock) % (24 * 60);
      const hh = Math.floor(m / 60), mm = Math.floor(m / 5) * 5 % 60;
      return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    },

    // ambient overlay color + alpha for rendering
    overlay() {
      if (this.phase === 'night') return { color: '#1a1438', alpha: this.dark };
      if (this.clock >= this.DUSK_AT) return { color: '#e87a3a', alpha: this.dark * 0.9 };
      return { color: '#fff4c0', alpha: Math.max(0, this.dark) * 0.5 };
    },
  };

  GB.Time = Time;
})(window.GB);
