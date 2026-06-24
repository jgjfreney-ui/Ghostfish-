// Ghostbug — the kid you play as.
(function (GB) {
  const T = GB.TILE;

  const Player = {
    x: 0, y: 0, w: 10, h: 12,
    dir: 0,            // 0 down 1 up 2 left 3 right
    frame: 0,
    animT: 0,
    stepT: 0,
    speed: 64,         // px/sec
    swing: 0,          // net swing timer
    palette: { hair: '#3a2a1a', shirt: '#4a8acc', hat: '#ffd24a' },

    spawnAtHome() {
      const home = GB.World.buildings.find(b => b.kind === 'home');
      this.x = (home.doorTile[0]) * T + 3;
      this.y = (home.doorTile[1] + 2) * T;
      this.dir = 0;
    },

    centerX() { return this.x + this.w / 2; },
    centerY() { return this.y + this.h / 2; },

    // tile the player is facing into
    facingTile() {
      let cx = Math.floor(this.centerX() / T);
      let cy = Math.floor((this.y + this.h - 2) / T); // feet
      if (this.dir === 0) cy += 1;
      else if (this.dir === 1) cy -= 1;
      else if (this.dir === 2) cx -= 1;
      else if (this.dir === 3) cx += 1;
      return { x: cx, y: cy };
    },

    update(dt, allowMove) {
      if (this.swing > 0) this.swing -= dt;

      let vx = 0, vy = 0;
      if (allowMove) {
        const d = GB.Input.dir();
        vx = d.x; vy = d.y;
        if (vx && vy) { vx *= 0.707; vy *= 0.707; }
        if (d.x || d.y) {
          // face dominant axis
          if (Math.abs(d.x) > Math.abs(d.y)) this.dir = d.x < 0 ? 2 : 3;
          else if (d.y) this.dir = d.y < 0 ? 1 : 0;
        }
      }

      const moving = (vx || vy);
      // move with per-axis collision against feet box
      const nx = this.x + vx * this.speed * dt;
      if (!this._blocked(nx, this.y)) this.x = nx;
      const ny = this.y + vy * this.speed * dt;
      if (!this._blocked(this.x, ny)) this.y = ny;

      // clamp to map
      this.x = GB.util.clamp(this.x, GB.env.minX, GB.env.pxW - GB.env.pad - this.w);
      this.y = GB.util.clamp(this.y, GB.env.minY, GB.env.pxH - GB.env.pad - this.h);

      // animation + footsteps
      if (moving) {
        this.animT += dt;
        if (this.animT > 0.16) { this.animT = 0; this.frame = this.frame ? 0 : 1; }
        this.stepT += dt;
        if (this.stepT > 0.28) { this.stepT = 0; GB.Audio.sfx('step'); }
      } else { this.frame = 0; this.animT = 0; }
    },

    _blocked(px, py) {
      // feet box (lower part of sprite) for nicer overlap with tall objects
      const fx = px + 1, fy = py + this.h - 6, fw = this.w - 2, fh = 6;
      return GB.env.isSolidPx(fx, fy) ||
             GB.env.isSolidPx(fx + fw, fy) ||
             GB.env.isSolidPx(fx, fy + fh) ||
             GB.env.isSolidPx(fx + fw, fy + fh);
    },

    swingNet() {
      this.swing = 0.3;
      GB.Audio.sfx('swoosh');
    },

    // net hit box in front of player while swinging
    netBox() {
      if (this.swing <= 0) return null;
      const reach = 14;
      let bx = this.centerX() - 8, by = this.centerY() - 8;
      if (this.dir === 0) by += reach;
      else if (this.dir === 1) by -= reach;
      else if (this.dir === 2) bx -= reach;
      else if (this.dir === 3) bx += reach;
      return { x: bx, y: by, w: 16, h: 16 };
    },

    draw(ctx, cam) {
      GB.Sprites.kid(ctx, Math.round(this.x - cam.x), Math.round(this.y - cam.y),
        this.dir, this.frame, this.swing, this.palette);
    },
  };

  GB.Player = Player;
})(window.GB);
