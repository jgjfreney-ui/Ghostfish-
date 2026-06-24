// Ghostbug — a live bug/ghost on the map that you chase and net.
(function (GB) {
  const T = GB.TILE;

  function makeCritter(species, px, py) {
    return {
      sp: species,
      x: px, y: py, w: 10, h: 10,
      vx: 0, vy: 0,
      t: Math.random() * 10,
      panicT: 0,
      wanderT: 0,
      caught: false, escaped: false,
      life: 14,                 // seconds before it wanders off if ignored

      update(dt, player) {
        this.t += dt;
        this.life -= dt;
        if (this.life <= 0) this.escaped = true;

        const sp = this.sp;
        const px = player.centerX(), py = player.centerY();
        const d = GB.util.dist(this.x, this.y, px, py);

        // flee when the kid gets close (flightier species flee from farther)
        const fleeRange = 26 + sp.flighty * 30;
        if (d < fleeRange) {
          const away = Math.atan2(this.y - py, this.x - px);
          const spd = sp.speed * (1 + sp.flighty);
          this.vx = Math.cos(away) * spd;
          this.vy = Math.sin(away) * spd;
          this.panicT = 0.4;
        } else {
          this.panicT -= dt;
          if (this.panicT <= 0) {
            // gentle wander
            this.wanderT -= dt;
            if (this.wanderT <= 0) {
              this.wanderT = GB.util.rand(0.5, 1.4);
              const a = GB.util.rand(0, Math.PI * 2);
              const s = sp.speed * 0.4;
              this.vx = Math.cos(a) * s; this.vy = Math.sin(a) * s;
            }
          }
        }

        // ghosts drift through obstacles; bugs avoid water/solids
        const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt;
        if (sp.kind === 'ghost') { this.x = nx; this.y = ny; }
        else {
          if (!GB.env.isSolidPx(nx, this.y)) this.x = nx; else this.vx *= -0.6;
          if (!GB.env.isSolidPx(this.x, ny)) this.y = ny; else this.vy *= -0.6;
        }
        // keep within environment bounds
        this.x = GB.util.clamp(this.x, GB.env.minX, GB.env.pxW - GB.env.pad);
        this.y = GB.util.clamp(this.y, GB.env.minY, GB.env.pxH - GB.env.pad);
      },

      hitBox() { return { x: this.x - 5, y: this.y - 5, w: this.w, h: this.h }; },

      draw(ctx, cam) {
        GB.Sprites.critter(ctx, Math.round(this.x - cam.x - 6), Math.round(this.y - cam.y - 6), this.sp, this.t);
      },
    };
  }

  GB.makeCritter = makeCritter;
})(window.GB);
