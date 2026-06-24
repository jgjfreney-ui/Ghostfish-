// Ghostbug — the open, traversable town + nature map.
// One continuous map (no sectioning). Terrain grid + object/interactable list.
(function (GB) {
  const T = GB.TILE;
  const W = 96, H = 72; // tiles — a bigger, walkable hometown

  const World = {
    w: W, h: H, pxW: W * T, pxH: H * T,
    minX: T, minY: 0, pad: T,        // env interface (collision bounds)
    tiles: null,           // terrain type grid
    objects: [],           // interactable / decorative objects
    buildings: [],
    solid: null,           // boolean collision grid
    time: 0,

    init() {
      this.generate();
    },

    generate() {
      const tiles = [];
      for (let y = 0; y < H; y++) {
        const row = [];
        for (let x = 0; x < W; x++) row.push('grass');
        tiles.push(row);
      }
      this.tiles = tiles;
      this.objects = [];
      this.buildings = [];

      // ---- a wide pond + a river winding down the east side ----
      this._blob(74, 40, 9, 'water');
      this._blob(70, 44, 6, 'water');
      for (let y = 0; y < H; y++) {
        const cx = 86 + Math.round(Math.sin(y * 0.22) * 4);
        for (let x = cx; x < cx + 2; x++) if (x >= 0 && x < W) tiles[y][x] = 'water';
      }
      // sandy banks around water
      this._ring('water', 'sand');

      // ---- roads: the town's main streets ----
      for (let x = 4; x < W - 4; x++) this._set(x, 34, 'path');   // high street
      for (let x = 6; x < W - 6; x++) this._set(x, 52, 'path');   // lower lane
      for (let y = 8; y < H - 6; y++) this._set(28, y, 'path');   // central road
      for (let y = 8; y < H - 6; y++) this._set(52, y, 'path');   // east road
      for (let y = 30; y < 56; y++) this._set(16, y, 'path');     // lane to home

      // ---- buildings — Ryosuke's hometown, laid out to feel lived-in ----
      // home is down in the south-west; the school is up north (the intro lets out there)
      this._addBuilding('home', 'Ryosuke\'s House', 10, 54, 6, 5, { secret: [13, 59] });
      this._addBuilding('school', 'Akebono Elementary', 24, 8, 9, 6, { secret: [32, 13] });
      this._addBuilding('store', 'Sato General Store', 46, 26, 6, 5, { secret: [46, 30] });
      this._addBuilding('hospital', 'Town Clinic', 60, 24, 7, 5, { secret: [66, 28] });
      this._addBuilding('shrine', 'Inari Shrine', 64, 46, 5, 5, { secret: [64, 50] });
      // the park — daytime play, and a lonelier place after dark
      this._addBuilding('park', 'Komorebi Park', 30, 40, 7, 5, { secret: [33, 44] });
      // a cave hidden deep in the north woods (only matters once her story is told)
      this._addBuilding('cave', 'Hidden Cave', 14, 2, 4, 3, {});

      // abandoned places hidden in the nature fringes
      this._addBuilding('abandoned', 'Old Yamada House', 8, 8, 5, 4, { secret: [10, 11], abandoned: true });
      this._addBuilding('abandoned', 'Ruined Mill', 80, 10, 5, 4, { secret: [82, 13], abandoned: true });
      this._addBuilding('abandoned', 'Forgotten Bus Stop', 78, 60, 5, 4, { secret: [80, 63], abandoned: true });

      // ---- scatter nature (counts scaled up for the bigger map) ----
      this._scatterTrees();
      this._scatterObject('rock', 48, (x, y) => tiles[y][x] === 'grass');
      this._scatterObject('bush', 56, (x, y) => tiles[y][x] === 'grass');
      this._scatterFlowers(70);
      this._scatterWaterSpots(20);

      // ---- new searchable spots, day & night ----
      const grass = (x, y) => tiles[y][x] === 'grass';
      const grassOrFlower = (x, y) => tiles[y][x] === 'grass' || tiles[y][x] === 'flowers';
      this._scatterObject('flowerbed', 34, grassOrFlower);
      this._scatterObject('log', 26, grass);
      this._scatterObject('mound', 22, grass);
      this._scatterObject('bench', 12, grassOrFlower);
      this._scatterObject('lamp', 22, (x, y) => grass(x, y) && this._adjPath(x, y));
      this._scatterObject('vending', 8, (x, y) => grass(x, y) && this._adjPath(x, y));
      this._scatterObject('bin', 10, (x, y) => grass(x, y) && this._adjPath(x, y));
      this._scatterObject('puddle', 18, (x, y) => grass(x, y) && (this._adjPath(x, y) || this._adjTile(x, y, 'sand')));
      this._scatterObject('lantern', 10, (x, y) => grass(x, y) && this._adjBuildingKind(x, y, 'shrine'));
      this._scatterObject('well', 5, grass);

      this._buildCollision();
    },

    _set(x, y, t) { if (x >= 0 && x < W && y >= 0 && y < H) this.tiles[y][x] = t; },
    _get(x, y) { return (x >= 0 && x < W && y >= 0 && y < H) ? this.tiles[y][x] : 'edge'; },

    _blob(cx, cy, r, t) {
      for (let y = cy - r; y <= cy + r; y++)
        for (let x = cx - r; x <= cx + r; x++) {
          const d = Math.hypot(x - cx, y - cy) + GB.noise(x, y) * 1.5;
          if (d <= r) this._set(x, y, t);
        }
    },
    _ring(of, put) {
      const adds = [];
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (this.tiles[y][x] !== of) continue;
          [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy]) => {
            const nx = x+dx, ny = y+dy;
            if (this._get(nx,ny) === 'grass') adds.push([nx,ny]);
          });
        }
      adds.forEach(([x,y]) => this._set(x,y,put));
    },

    _addBuilding(kind, name, x, y, w, h, opts = {}) {
      const b = {
        kind, name, x, y, w, h,
        doorTile: [x + Math.floor(w/2), y + h - 1],
        secret: opts.secret,
        abandoned: !!opts.abandoned,
        id: kind + '_' + this.buildings.length,
      };
      this.buildings.push(b);
      // door interactable
      this.objects.push({ type: 'door', building: b, gx: b.doorTile[0], gy: b.doorTile[1] });
      // secret entrance interactable (used at night)
      if (b.secret) this.objects.push({ type: 'secret', building: b, gx: b.secret[0], gy: b.secret[1] });
      // clear a welcome mat patch in front
      this._set(b.doorTile[0], b.doorTile[1] + 1, 'path');
    },

    _inBuilding(x, y, pad = 0) {
      return this.buildings.some(b =>
        x >= b.x - pad && x < b.x + b.w + pad &&
        y >= b.y - pad && y < b.y + b.h + pad);
    },

    _scatterTrees() {
      // dense woods band across the top + sprinkles
      for (let i = 0; i < 360; i++) {
        const x = GB.util.randInt(1, W - 2);
        const y = GB.util.randInt(1, H - 2);
        const inWoods = y < 10 || y > H - 8 || GB.util.chance(0.22);
        if (!inWoods) continue;
        if (this.tiles[y][x] !== 'grass') continue;
        if (this._inBuilding(x, y, 1)) continue;
        if (this._nearObject(x, y, 1)) continue;
        this.objects.push({ type: 'tree', gx: x, gy: y });
      }
    },
    _scatterObject(type, count, ok) {
      let placed = 0, guard = 0;
      while (placed < count && guard++ < 2000) {
        const x = GB.util.randInt(1, W - 2), y = GB.util.randInt(1, H - 2);
        if (!ok(x, y)) continue;
        if (this._inBuilding(x, y, 1)) continue;
        if (this._nearObject(x, y, 1)) continue;
        this.objects.push({ type, gx: x, gy: y, state: 'idle', cooldown: 0 });
        placed++;
      }
    },
    _scatterFlowers(count) {
      let placed = 0, guard = 0;
      while (placed < count && guard++ < 2000) {
        const x = GB.util.randInt(1, W - 2), y = GB.util.randInt(1, H - 2);
        if (this.tiles[y][x] !== 'grass' || this._inBuilding(x, y, 0)) continue;
        this.tiles[y][x] = 'flowers';
        placed++;
      }
    },
    _scatterWaterSpots(count) {
      // grass tiles adjacent to water become "water-search" spots
      let placed = 0, guard = 0;
      while (placed < count && guard++ < 3000) {
        const x = GB.util.randInt(1, W - 2), y = GB.util.randInt(1, H - 2);
        if (this.tiles[y][x] !== 'sand') continue;
        const nearWater = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => this._get(x+dx,y+dy) === 'water');
        if (!nearWater || this._nearObject(x, y, 1)) continue;
        this.objects.push({ type: 'water', gx: x, gy: y, state: 'idle', cooldown: 0 });
        placed++;
      }
    },
    _nearObject(x, y, r) {
      return this.objects.some(o => o.gx !== undefined && Math.abs(o.gx - x) <= r && Math.abs(o.gy - y) <= r);
    },
    _adjPath(x, y) { return this._adjTile(x, y, 'path'); },
    _adjTile(x, y, t) {
      return [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => this._get(x+dx, y+dy) === t);
    },
    _adjBuildingKind(x, y, kind) {
      return this.buildings.some(b => b.kind === kind &&
        x >= b.x - 3 && x < b.x + b.w + 3 && y >= b.y - 3 && y < b.y + b.h + 3);
    },

    _buildCollision() {
      const solid = [];
      for (let y = 0; y < H; y++) { solid.push(new Array(W).fill(false)); }
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++)
          if (this.tiles[y][x] === 'water') solid[y][x] = true;
      // buildings solid except their door tile
      this.buildings.forEach(b => {
        for (let y = b.y; y < b.y + b.h; y++)
          for (let x = b.x; x < b.x + b.w; x++)
            if (x >= 0 && x < W && y >= 0 && y < H) solid[y][x] = true;
        const [dx, dy] = b.doorTile;
        if (solid[dy] && solid[dy][dx] !== undefined) solid[dy][dx] = false;
      });
      // searchable spots flagged solid in the registry block movement
      this.objects.forEach(o => {
        const cfg = GB.SEARCHABLES && GB.SEARCHABLES[o.type];
        if (cfg && cfg.solid && o.gx !== undefined && solid[o.gy])
          solid[o.gy][o.gx] = true;
      });
      // map border
      for (let x = 0; x < W; x++) { solid[0][x] = true; solid[H-1][x] = true; }
      for (let y = 0; y < H; y++) { solid[y][0] = true; solid[y][W-1] = true; }
      this.solid = solid;
    },

    isSolidPx(px, py) {
      const tx = Math.floor(px / T), ty = Math.floor(py / T);
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return true;
      return this.solid[ty][tx];
    },

    // find an interactable object whose tile sits in front of the player
    interactableAt(gx, gy) {
      return this.objects.find(o => o.gx === gx && o.gy === gy &&
        (GB.SEARCHABLES[o.type] || o.type === 'door' || o.type === 'secret'));
    },

    update(dt) {
      this.time += dt;
      // refresh interactable cooldowns
      this.objects.forEach(o => {
        if (o.cooldown > 0) {
          o.cooldown -= dt;
          if (o.cooldown <= 0) { o.cooldown = 0; o.state = 'idle'; }
        }
      });
    },
  };

  GB.World = World;
})(window.GB);
