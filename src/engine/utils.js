// Ghostbug — shared utilities and the global namespace.
window.GB = window.GB || {};

GB.TILE = 16;          // tile size in pixels
GB.VIEW_W = 320;       // canvas logical width
GB.VIEW_H = 240;       // canvas logical height

GB.util = {
  clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  rand(a, b) { return a + Math.random() * (b - a); },
  randInt(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  chance(p) { return Math.random() < p; },
  dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); },

  // axis-aligned box overlap
  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  },

  // smooth pulse 0..1
  pulse(t, speed) { return 0.5 + 0.5 * Math.sin(t * speed); },

  // blend two hex colors, t=0 -> c1, t=1 -> c2
  mix(c1, c2, t) {
    const a = GB.util._hex(c1), b = GB.util._hex(c2);
    const r = Math.round(GB.util.lerp(a[0], b[0], t));
    const g = Math.round(GB.util.lerp(a[1], b[1], t));
    const bl = Math.round(GB.util.lerp(a[2], b[2], t));
    return `rgb(${r},${g},${bl})`;
  },
  _hex(c) {
    c = c.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  },
};

// tiny deterministic-ish PRNG seeded value-noise for ground texture
GB.noise = function (x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
};
