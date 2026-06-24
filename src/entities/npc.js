// Ghostbug — wandering townsfolk you can talk to.
(function (GB) {
  const T = GB.TILE;

  function makeNPC(key, gx, gy, palette, homeBuilding) {
    return {
      key, x: gx * T, y: gy * T, w: 12, h: 14,
      hx: gx * T, hy: gy * T,           // home anchor (wanders around it)
      palette, frame: 0, animT: 0,
      moveT: 0, vx: 0, vy: 0,
      homeBuilding,
      update(dt, isNight) {
        // adults go inside at night; only a few wander
        this.moveT -= dt;
        if (this.moveT <= 0) {
          this.moveT = GB.util.rand(1.2, 3.0);
          if (GB.util.chance(isNight ? 0.3 : 0.6)) {
            const ang = GB.util.rand(0, Math.PI * 2);
            this.vx = Math.cos(ang) * 14; this.vy = Math.sin(ang) * 14;
          } else { this.vx = 0; this.vy = 0; }
        }
        const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
        // keep near home anchor, avoid solids
        if (GB.util.dist(nx, this.y, this.hx, this.hy) < 40 && !GB.World.isSolidPx(nx + 6, this.y + this.h)) this.x = nx;
        else this.vx *= -1;
        if (GB.util.dist(this.x, ny, this.hx, this.hy) < 40 && !GB.World.isSolidPx(this.x + 6, ny + this.h)) this.y = ny;
        else this.vy *= -1;
        if (this.vx || this.vy) {
          this.animT += dt;
          if (this.animT > 0.2) { this.animT = 0; this.frame = this.frame ? 0 : 1; }
        } else this.frame = 0;
      },
      draw(ctx, cam) {
        GB.Sprites.npc(ctx, Math.round(this.x - cam.x), Math.round(this.y - cam.y), this.palette, this.frame);
      },
    };
  }

  const NPCs = {
    list: [],
    init() {
      this.list = [];
      const B = GB.World.buildings;
      const store = B.find(b => b.kind === 'store');
      const school = B.find(b => b.kind === 'school');
      const shrine = B.find(b => b.kind === 'shrine');
      const home = B.find(b => b.kind === 'home');
      this.list.push(makeNPC('shopkeeper', store.x + 1, store.y + store.h + 1, { body: '#c87a4a', hair: '#3a2a1a' }, store));
      this.list.push(makeNPC('teacher', school.x + school.w + 1, school.y + school.h, { body: '#4a6a8a', hair: '#2a2a2a' }, school));
      this.list.push(makeNPC('grandpa_sato', shrine.x - 2, shrine.y + shrine.h + 1, { body: '#8a8a7a', hair: '#d0d0d0' }, shrine));
      this.list.push(makeNPC('kid', home.x + home.w + 3, home.y, { body: '#5aaa5a', hair: '#5a3a1a' }, home));
      this.list.push(makeNPC('dad', home.x - 2, home.y + 1, { body: '#6a6a8a', hair: '#2a2a2a' }, home));
    },
    update(dt, isNight) { this.list.forEach(n => n.update(dt, isNight)); },
    // find an NPC adjacent to a tile
    near(gx, gy) {
      return this.list.find(n => {
        const nx = Math.floor((n.x + 6) / T), ny = Math.floor((n.y + 7) / T);
        return Math.abs(nx - gx) <= 1 && Math.abs(ny - gy) <= 1;
      });
    },
  };

  GB.NPCs = NPCs;
})(window.GB);
