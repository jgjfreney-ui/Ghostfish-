// Ghostbug — tactile interaction + the net catch.
// Lift rocks, rustle bushes, shake trees, search the water's edge; then chase
// and net whatever pops out.
(function (GB) {
  const T = GB.TILE;

  const Catching = {
    critters: [],
    particles: [],

    reset() { this.critters = []; this.particles = []; },

    // Player pressed A. Resolve what's in front of them.
    // Returns a descriptor main may need to act on (door/secret/talk), or null.
    interact(player) {
      const f = player.facingTile();

      // talk to a townsperson first
      const npc = GB.NPCs.near(f.x, f.y) || GB.NPCs.near(
        Math.floor(player.centerX() / T), Math.floor((player.y + player.h) / T));
      if (npc) return { type: 'talk', npc };

      const obj = GB.World.interactableAt(f.x, f.y);
      if (!obj) return null;

      switch (obj.type) {
        case 'door':   return { type: 'door', building: obj.building };
        case 'secret': return { type: 'secret', building: obj.building };
        case 'rock':   return this._search(obj, 'rock', 'lift');
        case 'bush':   return this._search(obj, 'grass', 'rustle');
        case 'tree':   return this._search(obj, 'tree', 'rustle');
        case 'water':  return this._search(obj, 'water', 'splash');
      }
      return null;
    },

    _search(obj, habitat, sfx) {
      if (obj.cooldown > 0) {
        return { type: 'searched', found: false, msg: '...nothing else stirs here. (give it a minute)' };
      }
      GB.Audio.sfx(sfx);
      obj.state = 'active';
      obj.cooldown = GB.util.rand(6, 11);
      // dust/leaf burst
      const ox = obj.gx * T + T / 2, oy = obj.gy * T + T / 2;
      this._burst(ox, oy, habitat === 'water' ? '#bfe3ff' : '#cdbf94', 6);

      // chance to find something, better at the right time of day
      const findP = 0.72;
      if (!GB.util.chance(findP)) {
        return { type: 'searched', found: false, msg: this._emptyMsg(habitat) };
      }
      const sp = GB.rollSpecies(habitat, GB.Time.isNight);
      if (!sp) return { type: 'searched', found: false, msg: this._emptyMsg(habitat) };

      // spawn it bursting out near the object
      const c = GB.makeCritter(sp, ox + GB.util.rand(-4, 4), oy + GB.util.rand(-4, 4));
      // initial scurry away from the spot
      const a = GB.util.rand(0, Math.PI * 2);
      c.vx = Math.cos(a) * sp.speed; c.vy = Math.sin(a) * sp.speed;
      c.panicT = 0.6;
      this.critters.push(c);
      return { type: 'found', species: sp,
        msg: `A ${sp.name}! Quick — swing your net! (X)` };
    },

    _emptyMsg(habitat) {
      return GB.util.pick({
        rock: ['Just damp earth and a startled worm.', 'A cosy little hollow. Empty today.'],
        grass: ['The grass rustles… then settles. Nothing.', 'Only a dandelion seed drifts up.'],
        tree: ['Bark, sap, and a flake of old cicada shell.', 'You shake the trunk. A single leaf falls.'],
        water: ['Ripples spread out. The water goes still.', 'Just your own reflection blinking back.'],
      }[habitat]);
    },

    // Player pressed B: swing the net and try to catch.
    swing(player) {
      player.swingNet();
      const box = player.netBox();
      if (!box) return null;
      // find nearest catchable critter overlapping the net
      let hit = null, best = 1e9;
      for (const c of this.critters) {
        if (c.caught) continue;
        if (GB.util.aabb(box, c.hitBox())) {
          const d = GB.util.dist(c.x, c.y, player.centerX(), player.centerY());
          if (d < best) { best = d; hit = c; }
        }
      }
      if (!hit) return null;
      hit.caught = true;
      const ox = hit.x, oy = hit.y;
      this._burst(ox, oy, hit.sp.glow || '#ffe9a8', 10);
      const isNew = GB.Collection.record(hit.sp.id);
      GB.Audio.sfx(isNew ? 'newentry' : 'catch');
      return { species: hit.sp, isNew };
    },

    _burst(x, y, color, n) {
      for (let i = 0; i < n; i++) {
        const a = GB.util.rand(0, Math.PI * 2), s = GB.util.rand(10, 40);
        this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, life: GB.util.rand(0.3, 0.7), color });
      }
    },

    update(dt, player) {
      for (const c of this.critters) c.update(dt, player);
      this.critters = this.critters.filter(c => !c.caught && !c.escaped);
      for (const p of this.particles) {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt;
      }
      this.particles = this.particles.filter(p => p.life > 0);
    },

    draw(ctx, cam) {
      for (const c of this.critters) c.draw(ctx, cam);
      for (const p of this.particles) {
        ctx.globalAlpha = GB.util.clamp(p.life * 2, 0, 1);
        GB.Sprites.sparkle(ctx, Math.round(p.x - cam.x), Math.round(p.y - cam.y), p.color);
      }
      ctx.globalAlpha = 1;
    },

    // spawn loose ambient critters so the world feels alive (called occasionally)
    ambientSpawn(player) {
      if (this.critters.length > 6) return;
      // pick a random nearby object to emit from
      const cand = GB.World.objects.filter(o =>
        ['bush', 'rock', 'tree', 'water'].includes(o.type) &&
        Math.abs(o.gx * T - player.centerX()) < 160 &&
        Math.abs(o.gy * T - player.centerY()) < 130);
      if (!cand.length) return;
      const o = GB.util.pick(cand);
      const habitat = o.type === 'bush' ? 'grass' : o.type;
      if (!GB.util.chance(0.5)) return;
      const sp = GB.rollSpecies(habitat, GB.Time.isNight);
      if (!sp || sp.rarity >= 3) return; // rares only via active searching
      const c = GB.makeCritter(sp, o.gx * T + 8, o.gy * T + 8);
      this.critters.push(c);
    },
  };

  GB.Catching = Catching;
})(window.GB);
