// Ghostbug — keyboard + touch input.
(function (GB) {
  const Input = {
    keys: {},
    pressed: {},     // edge: true only on the frame the key went down
    _consumed: {},

    init() {
      const map = {
        ArrowUp: 'up', KeyW: 'up',
        ArrowDown: 'down', KeyS: 'down',
        ArrowLeft: 'left', KeyA: 'left',
        ArrowRight: 'right', KeyD: 'right',
        KeyZ: 'a', Enter: 'a', Space: 'a',
        KeyX: 'b', ShiftLeft: 'b', Backspace: 'b',
        KeyJ: 'journal', Tab: 'journal',
        KeyM: 'mute',
      };

      window.addEventListener('keydown', (e) => {
        const a = map[e.code];
        if (a) {
          if (!this.keys[a]) this.pressed[a] = true;
          this.keys[a] = true;
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
        }
      });
      window.addEventListener('keyup', (e) => {
        const a = map[e.code];
        if (a) { this.keys[a] = false; }
      });

      // touch
      const tc = document.getElementById('touch-controls');
      const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
      if (isTouch && tc) {
        tc.classList.remove('hidden');
        tc.querySelectorAll('button[data-key]').forEach((btn) => {
          const a = map[btn.dataset.key];
          const down = (e) => { e.preventDefault(); if (!this.keys[a]) this.pressed[a] = true; this.keys[a] = true; };
          const up = (e) => { e.preventDefault(); this.keys[a] = false; };
          btn.addEventListener('touchstart', down, { passive: false });
          btn.addEventListener('touchend', up, { passive: false });
          btn.addEventListener('touchcancel', up, { passive: false });
          btn.addEventListener('mousedown', down);
          btn.addEventListener('mouseup', up);
          btn.addEventListener('mouseleave', up);
        });
      }
    },

    // call once per frame AFTER all reads
    endFrame() { this.pressed = {}; },

    held(a) { return !!this.keys[a]; },
    // edge press, consumed so multiple systems don't double-handle
    justPressed(a) {
      if (this.pressed[a]) { return true; }
      return false;
    },
    dir() {
      let x = 0, y = 0;
      if (this.keys.left) x -= 1;
      if (this.keys.right) x += 1;
      if (this.keys.up) y -= 1;
      if (this.keys.down) y += 1;
      return { x, y };
    },
  };

  GB.Input = Input;
})(window.GB);
