// Ghostbug — procedural chiptune engine (Earthbound / Undertale flavoured).
// Everything is synthesized live with the Web Audio API: no audio files.
(function (GB) {
  const NOTE = {}; // name -> frequency
  (function buildNotes() {
    const names = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
    for (let oct = 1; oct <= 6; oct++) {
      for (let i = 0; i < 12; i++) {
        const midi = 12 * (oct + 1) + i;
        NOTE[names[i] + oct] = 440 * Math.pow(2, (midi - 69) / 12);
      }
    }
    NOTE['_'] = 0; // rest
  })();

  const Audio = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    enabled: true,
    _song: null,
    _step: 0,
    _nextTime: 0,
    _timer: null,
    _bpm: 96,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.6;
      this.master.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.55;
      this.musicGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.master);

      // gentle reverb-ish via a short feedback delay for that dreamy cozy haze
      this.delay = this.ctx.createDelay();
      this.delay.delayTime.value = 0.18;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.22;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.18;
      this.delay.connect(fb); fb.connect(this.delay);
      this.delay.connect(wet); wet.connect(this.master);
      this.musicGain.connect(this.delay);
    },

    resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },

    // --- low level voice ---
    _voice(freq, t, dur, { type = 'square', gain = 0.2, attack = 0.005, release = 0.08, dest } = {}) {
      if (!freq) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      g.connect(dest || this.musicGain);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + attack);
      g.gain.setValueAtTime(gain, t + Math.max(attack, dur - release));
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    // ================= SONGS =================
    // 16-step bars. each track: array of note names (or '_' rest), length multiple of 16.
    songs: {
      day: {
        bpm: 104,
        lead: ['E4','_','G4','A4','B4','_','A4','G4', 'E4','_','D4','E4','G4','_','E4','_',
               'C5','_','B4','A4','G4','_','A4','B4', 'A4','_','G4','E4','D4','_','E4','G4'],
        bass: ['C2','_','C3','_','G2','_','G3','_', 'A2','_','A3','_','F2','_','F3','_',
               'C2','_','C3','_','E2','_','E3','_', 'F2','_','F3','_','G2','_','G3','_'],
        arp:  ['C4','E4','G4','E4','G3','B3','D4','B3','A3','C4','E4','C4','F3','A3','C4','A3',
               'C4','E4','G4','E4','E3','G3','B3','G3','F3','A3','C4','A3','G3','B3','D4','G4'],
        leadType: 'square', bassType: 'triangle', arpType: 'square', arpGain: 0.07,
      },
      night: {
        bpm: 84,
        lead: ['A4','_','_','C5','B4','_','A4','_', 'E4','_','F4','_','A4','_','_','_',
               'G4','_','_','A4','F4','_','E4','_', 'D4','_','E4','_','A3','_','_','_'],
        bass: ['A1','_','_','_','E2','_','_','_', 'F1','_','_','_','G1','_','_','_',
               'A1','_','_','_','C2','_','_','_', 'D2','_','_','_','E2','_','_','_'],
        arp:  ['A3','E4','A4','E4','_','_','_','_','F3','C4','F4','C4','_','_','_','_',
               'A3','E4','A4','E4','_','_','_','_','E3','B3','E4','B3','_','_','_','_'],
        leadType: 'triangle', bassType: 'sine', arpType: 'triangle', arpGain: 0.05,
      },
      title: {
        bpm: 90,
        lead: ['C4','E4','G4','C5','B4','G4','E4','C4','D4','F4','A4','D5','C5','A4','F4','D4',
               'E4','G4','C5','E5','D5','C5','B4','A4','G4','E4','C4','G3','C4','_','_','_'],
        bass: ['C2','_','G2','_','A1','_','E2','_','F1','_','C2','_','G1','_','G2','_',
               'C2','_','G2','_','A1','_','E2','_','F1','_','G1','_','C2','_','_','_'],
        arp:  ['C4','E4','G4','E4','G3','B3','D4','B3','A3','C4','E4','C4','F3','A3','C4','A3',
               'E3','G3','C4','G3','D3','F3','A3','F3','G3','B3','D4','B3','C4','E4','G4','C5'],
        leadType: 'square', bassType: 'triangle', arpType: 'square', arpGain: 0.06,
      },
    },

    playSong(name) {
      if (!this.ctx) return;
      if (this._songName === name) return;
      this._songName = name;
      this._song = this.songs[name];
      this._step = 0;
      this._bpm = this._song.bpm;
      this._nextTime = this.ctx.currentTime + 0.05;
      if (!this._timer) this._timer = setInterval(() => this._scheduler(), 25);
    },

    stop() {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      this._songName = null;
    },

    setMusicVolume(v) { if (this.musicGain) this.musicGain.gain.value = v; },

    _scheduler() {
      if (!this._song || !this.enabled) return;
      const stepDur = 60 / this._bpm / 4; // 16th notes
      while (this._nextTime < this.ctx.currentTime + 0.12) {
        this._playStep(this._step, this._nextTime, stepDur);
        this._step++;
        this._nextTime += stepDur;
      }
    },

    _playStep(step, t, dur) {
      const s = this._song;
      const i = step % s.lead.length;
      this._voice(NOTE[s.lead[i]], t, dur * 0.95, { type: s.leadType, gain: 0.16 });
      this._voice(NOTE[s.bass[i]], t, dur * 1.4, { type: s.bassType, gain: 0.22 });
      this._voice(NOTE[s.arp[i]], t, dur * 0.5, { type: s.arpType, gain: s.arpGain });
      // soft percussive tick on the beat for groove
      if (i % 4 === 0) this._noise(t, 0.04, 0.05);
      else if (i % 4 === 2) this._noise(t, 0.03, 0.025);
    },

    _noise(t, dur, gain) {
      const buf = this._noiseBuf || (this._noiseBuf = (() => {
        const b = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.2, this.ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        return b;
      })());
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 6000;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f); f.connect(g); g.connect(this.musicGain);
      src.start(t); src.stop(t + dur);
    },

    // ================= SFX =================
    sfx(name) {
      if (!this.ctx || !this.enabled) return;
      const t = this.ctx.currentTime;
      const d = this.sfxGain;
      switch (name) {
        case 'step':
          this._voice(NOTE['C2'], t, 0.05, { type: 'triangle', gain: 0.05, dest: d });
          break;
        case 'blip':
          this._voice(NOTE['E5'], t, 0.05, { type: 'square', gain: 0.12, dest: d });
          break;
        case 'select':
          this._voice(NOTE['C5'], t, 0.06, { type: 'square', gain: 0.12, dest: d });
          this._voice(NOTE['G5'], t + 0.06, 0.08, { type: 'square', gain: 0.12, dest: d });
          break;
        case 'swoosh': {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(700, t);
          o.frequency.exponentialRampToValueAtTime(180, t + 0.18);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.1, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
          o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.22);
          break;
        }
        case 'lift':
          this._voice(NOTE['G3'], t, 0.08, { type: 'triangle', gain: 0.14, dest: d });
          this._voice(NOTE['C4'], t + 0.06, 0.1, { type: 'triangle', gain: 0.14, dest: d });
          break;
        case 'rustle':
          this._noiseBurst(t, 0.18, 0.12, d, 3000);
          break;
        case 'splash':
          this._noiseBurst(t, 0.25, 0.14, d, 1200);
          break;
        case 'catch': {
          const seq = ['C5', 'E5', 'G5', 'C6'];
          seq.forEach((n, k) => this._voice(NOTE[n], t + k * 0.07, 0.12, { type: 'square', gain: 0.14, dest: d }));
          break;
        }
        case 'newentry': {
          const seq = ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'];
          seq.forEach((n, k) => this._voice(NOTE[n], t + k * 0.09, 0.16, { type: 'square', gain: 0.15, dest: d }));
          break;
        }
        case 'fail':
          this._voice(NOTE['Ds4'], t, 0.12, { type: 'square', gain: 0.12, dest: d });
          this._voice(NOTE['B3'], t + 0.1, 0.16, { type: 'square', gain: 0.12, dest: d });
          break;
        case 'door':
          this._voice(NOTE['A2'], t, 0.18, { type: 'triangle', gain: 0.16, dest: d });
          break;
        case 'ghost': {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(300, t);
          o.frequency.exponentialRampToValueAtTime(660, t + 0.4);
          o.frequency.exponentialRampToValueAtTime(420, t + 0.8);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.linearRampToValueAtTime(0.09, t + 0.1);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
          o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.95);
          break;
        }
        case 'dinner': {
          const seq = ['E4', 'G4', 'C5', 'G4', 'E4', 'C4'];
          seq.forEach((n, k) => this._voice(NOTE[n], t + k * 0.14, 0.2, { type: 'triangle', gain: 0.14, dest: d }));
          break;
        }
        case 'caught': {
          const o = this.ctx.createOscillator(), g = this.ctx.createGain();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(200, t);
          o.frequency.linearRampToValueAtTime(80, t + 0.5);
          g.gain.setValueAtTime(0.16, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
          o.connect(g); g.connect(d); o.start(t); o.stop(t + 0.6);
          break;
        }
      }
    },

    _noiseBurst(t, dur, gain, dest, cutoff) {
      const b = this.ctx.createBuffer(1, this.ctx.sampleRate * dur, this.ctx.sampleRate);
      const data = b.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = this.ctx.createBufferSource();
      src.buffer = b;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = cutoff; f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(dest);
      src.start(t); src.stop(t + dur);
    },
  };

  GB.Audio = Audio;
  GB.NOTE = NOTE;
})(window.GB);
