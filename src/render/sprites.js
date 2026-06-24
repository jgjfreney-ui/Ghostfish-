// Ghostbug — procedural pixel-art sprites. Everything drawn with rectangles
// so the whole game ships as code, no image assets, one cohesive palette.
(function (GB) {
  const T = GB.TILE;
  const S = {};

  // helper: filled pixel block
  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  // ---------- TERRAIN TILES ----------
  // drawn at tile (gx,gy) in world pixels
  S.grass = (ctx, x, y, n) => {
    px(ctx, x, y, T, T, '#5a9a44');
    // texture blades from noise
    const a = GB.noise(n * 3, n * 7);
    px(ctx, x + 3, y + 4, 2, 4, '#4a8038');
    if (a > 0.5) px(ctx, x + 9, y + 8, 2, 4, '#6aae50');
    if (a > 0.75) px(ctx, x + 6, y + 11, 2, 3, '#4a8038');
  };
  S.path = (ctx, x, y, n) => {
    px(ctx, x, y, T, T, '#cdab78');
    const a = GB.noise(n * 5, n * 2);
    if (a > 0.6) px(ctx, x + 4, y + 5, 2, 2, '#b8966a');
    if (a > 0.8) px(ctx, x + 10, y + 9, 2, 2, '#dcc090');
  };
  S.sand = (ctx, x, y) => px(ctx, x, y, T, T, '#e3cf9a');
  S.water = (ctx, x, y, n, t) => {
    px(ctx, x, y, T, T, '#3a78b0');
    const w = Math.sin(t * 2 + n) * 0.5 + 0.5;
    px(ctx, x + 2, y + 4 + Math.floor(w * 2), 5, 1, '#6aa8d8');
    px(ctx, x + 9, y + 9 - Math.floor(w * 2), 4, 1, '#6aa8d8');
  };
  S.flowers = (ctx, x, y, n) => {
    S.grass(ctx, x, y, n);
    const cols = ['#ff6a8a', '#ffd23a', '#ff9a3a', '#d28aff'];
    const c = cols[Math.floor(GB.noise(n, n * 2) * cols.length)];
    px(ctx, x + 5, y + 6, 2, 2, c);
    px(ctx, x + 4, y + 7, 1, 1, c); px(ctx, x + 7, y + 7, 1, 1, c);
    px(ctx, x + 5, y + 8, 2, 1, '#ffe');
  };

  // ---------- OBJECTS ----------
  S.tree = (ctx, x, y) => {
    // trunk
    px(ctx, x + 6, y + 14, 4, 10, '#6a4a2a');
    px(ctx, x + 6, y + 14, 1, 10, '#7a5a3a');
    // canopy
    const g1 = '#3f7a34', g2 = '#5a9a44', g3 = '#2e5a26';
    px(ctx, x + 2, y + 2, 12, 12, g1);
    px(ctx, x, y + 5, 16, 8, g1);
    px(ctx, x + 3, y + 1, 5, 5, g2);
    px(ctx, x + 9, y + 4, 4, 4, g2);
    px(ctx, x + 2, y + 9, 4, 3, g3);
    px(ctx, x + 11, y + 9, 3, 3, g3);
  };
  S.rock = (ctx, x, y, lifted) => {
    if (lifted) {
      // tipped-over rock + dark hollow
      px(ctx, x + 2, y + 9, 12, 6, '#3a2e22');
      px(ctx, x + 1, y + 2, 9, 7, '#8a8490');
      px(ctx, x + 1, y + 2, 9, 2, '#a8a2b0');
      px(ctx, x + 2, y + 7, 7, 2, '#6a6470');
      return;
    }
    px(ctx, x + 2, y + 6, 12, 8, '#8a8490');
    px(ctx, x + 3, y + 5, 10, 3, '#a8a2b0');
    px(ctx, x + 2, y + 12, 12, 2, '#6a6470');
    px(ctx, x + 5, y + 9, 2, 2, '#6a6470');
  };
  S.bush = (ctx, x, y, rustle) => {
    const c = rustle ? '#6aae50' : '#4a8a3a';
    px(ctx, x + 2, y + 5, 12, 9, '#357028');
    px(ctx, x + 1, y + 7, 14, 6, c);
    px(ctx, x + 3, y + 4, 5, 4, c);
    px(ctx, x + 9, y + 5, 4, 3, c);
    px(ctx, x + 4, y + 9, 2, 2, '#2a5a1e');
    px(ctx, x + 10, y + 10, 2, 2, '#2a5a1e');
  };

  // buildings drawn over a footprint of (w,h) tiles, origin top-left world px
  S.building = (ctx, x, y, w, h, kind, lit) => {
    const W = w * T, H = h * T;
    const wall = kind === 'home' ? '#d9b38a'
              : kind === 'store' ? '#c98a6a'
              : kind === 'school' ? '#c8c2b0'
              : kind === 'hospital' ? '#e4e8ec'
              : kind === 'shrine' ? '#b03a3a'
              : '#7a6a5a';
    const roof = kind === 'home' ? '#8a4a3a'
              : kind === 'store' ? '#5a7a8a'
              : kind === 'school' ? '#7a8a6a'
              : kind === 'hospital' ? '#7aa8c8'
              : kind === 'shrine' ? '#3a2a2a'
              : '#3a3038';
    const roofH = Math.floor(H * 0.42);
    // wall
    px(ctx, x, y + roofH, W, H - roofH, wall);
    px(ctx, x, y + roofH, W, 2, 'rgba(255,255,255,0.15)');
    // roof
    px(ctx, x - 2, y + roofH - 3, W + 4, 4, roof);
    for (let ry = 0; ry < roofH; ry++) {
      const inset = Math.floor((roofH - ry) * (W * 0.5) / roofH);
      px(ctx, x + inset, y + ry, W - inset * 2, 1, ry % 3 === 0 ? roof : GB.util.mix(roof, '#000', 0.18));
    }
    // door (centered, 1 tile)
    const dx = x + Math.floor(W / 2) - T / 2;
    const dy = y + H - T;
    px(ctx, dx, dy, T, T, '#4a3424');
    px(ctx, dx + 2, dy + 2, T - 4, T - 2, '#5a4030');
    px(ctx, dx + T - 5, dy + 7, 2, 2, '#ffd24a');
    // windows
    const winC = lit ? '#ffe9a8' : '#3a4a6a';
    for (let wx = x + 4; wx < x + W - T; wx += 14) {
      if (Math.abs(wx - dx) < 10) continue;
      px(ctx, wx, y + roofH + 4, 7, 7, '#2a2030');
      px(ctx, wx + 1, y + roofH + 5, 5, 5, winC);
      px(ctx, wx + 3, y + roofH + 5, 1, 5, '#2a2030');
    }
    if (kind === 'shrine') { // torii hint: gold finial
      px(ctx, x + Math.floor(W / 2) - 1, y - 4, 2, 5, '#ffd24a');
    }
    return { dx, dy }; // door rect origin
  };

  // ---------- CHARACTERS ----------
  // player kid. dir: 0 down 1 up 2 left 3 right. frame: walk cycle. swing: net out
  S.kid = (ctx, x, y, dir, frame, swing, palette) => {
    const skin = '#f2c89a', hairC = palette.hair, shirt = palette.shirt, shorts = '#3a4a8a', hat = palette.hat;
    const bob = (frame === 1) ? 1 : 0;
    y += bob;
    // legs
    const lswap = frame === 1 ? 1 : -1;
    px(ctx, x + 5, y + 12, 2, 3, '#caa070');
    px(ctx, x + 9, y + 12, 2, 3, '#caa070');
    px(ctx, x + 5 + (frame === 1 ? lswap : 0), y + 14, 2, 1, '#3a2a1a');
    px(ctx, x + 9 - (frame === 1 ? lswap : 0), y + 14, 2, 1, '#3a2a1a');
    // body / shirt
    px(ctx, x + 4, y + 7, 8, 6, shirt);
    px(ctx, x + 4, y + 7, 8, 1, GB.util.mix(shirt, '#fff', 0.25));
    // head
    px(ctx, x + 4, y + 1, 8, 7, skin);
    // hair / hat
    if (hat) {
      px(ctx, x + 3, y, 10, 3, hat);
      px(ctx, x + 2, y + 2, 12, 2, hat);
    } else {
      px(ctx, x + 3, y, 10, 3, hairC);
      px(ctx, x + 3, y + 2, 2, 3, hairC);
      px(ctx, x + 11, y + 2, 2, 3, hairC);
    }
    // face by direction
    if (dir === 1) { // up: back of head
      px(ctx, x + 4, y + 3, 8, 4, hairC);
    } else if (dir === 2) { // left
      px(ctx, x + 5, y + 4, 1, 2, '#2a2030');
    } else if (dir === 3) { // right
      px(ctx, x + 10, y + 4, 1, 2, '#2a2030');
    } else { // down
      px(ctx, x + 6, y + 4, 1, 2, '#2a2030');
      px(ctx, x + 9, y + 4, 1, 2, '#2a2030');
      px(ctx, x + 7, y + 6, 2, 1, '#c87a6a');
    }
    // arms / net
    if (swing > 0) {
      // net swung in facing direction
      const ex = dir === 2 ? x - 8 : dir === 3 ? x + 16 : x + 6;
      const ey = dir === 1 ? y - 6 : dir === 0 ? y + 14 : y + 4;
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 8, y + 9); ctx.lineTo(ex + 4, ey + 4); ctx.stroke();
      // hoop
      ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ex + 4, ey + 4, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(230,230,255,0.25)';
      ctx.beginPath(); ctx.arc(ex + 4, ey + 4, 5, 0, Math.PI * 2); ctx.fill();
    }
  };

  S.npc = (ctx, x, y, palette, frame) => {
    const bob = frame === 1 ? 1 : 0; y += bob;
    px(ctx, x + 4, y + 13, 3, 2, '#3a2a1a');
    px(ctx, x + 9, y + 13, 3, 2, '#3a2a1a');
    px(ctx, x + 3, y + 6, 10, 8, palette.body);
    px(ctx, x + 4, y + 1, 8, 6, '#f2c89a');
    px(ctx, x + 3, y, 10, 3, palette.hair);
    px(ctx, x + 6, y + 3, 1, 2, '#2a2030');
    px(ctx, x + 9, y + 3, 1, 2, '#2a2030');
  };

  // ---------- CRITTERS (bug/ghost on the map) ----------
  S.critter = (ctx, x, y, sp, t) => {
    const [body, accent, dark] = sp.palette;
    if (sp.kind === 'ghost') {
      const fl = Math.sin(t * 4) * 1.5;
      y += fl;
      if (sp.glow) {
        ctx.fillStyle = sp.glow + '';
        ctx.globalAlpha = 0.18 + 0.1 * (Math.sin(t * 5) * 0.5 + 0.5);
        ctx.beginPath(); ctx.arc(x + 6, y + 6, 9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      // round wispy body
      px(ctx, x + 2, y + 1, 8, 8, body);
      px(ctx, x + 1, y + 3, 10, 5, body);
      px(ctx, x + 3, y, 6, 3, accent);
      // wavy tail
      px(ctx, x + 2, y + 9, 2, 2, body);
      px(ctx, x + 5, y + 9, 2, 1, body);
      px(ctx, x + 8, y + 9, 2, 2, body);
      // cute eyes
      px(ctx, x + 4, y + 4, 1, 2, dark);
      px(ctx, x + 7, y + 4, 1, 2, dark);
      px(ctx, x + 4, y + 7, 3, 1, dark); // smile
      return;
    }
    // bug
    if (sp.glow) {
      ctx.fillStyle = sp.glow;
      ctx.globalAlpha = 0.25 + 0.2 * (Math.sin(t * 6) * 0.5 + 0.5);
      ctx.beginPath(); ctx.arc(x + 6, y + 6, 6, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    px(ctx, x + 4, y + 4, 5, 6, body);     // body
    px(ctx, x + 4, y + 3, 5, 2, accent);   // head
    px(ctx, x + 3, y + 5, 1, 4, dark);     // legs L
    px(ctx, x + 9, y + 5, 1, 4, dark);     // legs R
    px(ctx, x + 5, y + 2, 1, 1, dark);     // antenna
    px(ctx, x + 7, y + 2, 1, 1, dark);
    if (sp.id.includes('butterfly') || sp.id.includes('dragonfly') || sp.id === 'cicada') {
      ctx.fillStyle = accent; ctx.globalAlpha = 0.7;
      const flap = Math.sin(t * 14) * 2;
      px(ctx, x + 1, y + 3 + flap, 3, 4, accent);
      px(ctx, x + 9, y + 3 - flap, 3, 4, accent);
      ctx.globalAlpha = 1;
    }
  };

  // sparkle particle
  S.sparkle = (ctx, x, y, c) => {
    px(ctx, x, y - 2, 1, 5, c);
    px(ctx, x - 2, y, 5, 1, c);
  };

  GB.Sprites = S;
})(window.GB);
