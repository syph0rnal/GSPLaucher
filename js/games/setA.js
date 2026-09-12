/* ============================================================
   setA.js — Games 1-10
   Frogger, Mario, Battle City, Duck Hunt, Punch-Out,
   TMNT, Ninja Gaiden, Double Dragon, Mortal Kombat, Street Fighter
   ============================================================ */

/* ---------- 1. FROGGER ---------- */
class FroggerGame extends Game {
  init() {
    this.rows = 13;
    this.cell = 40;
    this.gridTop = 100;
    this.frog = { c: 6, r: 12, onLog: null, dead: 0 };
    this.lanes = [];
    const laneDefs = [
      { r: 1, kind: 'log',   n: 3, len: 3, speed: 55 },
      { r: 2, kind: 'turtle',n: 3, len: 2, speed: -45 },
      { r: 3, kind: 'log',   n: 2, len: 4, speed: 75 },
      { r: 4, kind: 'log',   n: 3, len: 2, speed: 50 },
      { r: 5, kind: 'turtle',n: 2, len: 3, speed: -60 },
      { r: 7, kind: 'car',   n: 3, len: 1, speed: -80 },
      { r: 8, kind: 'car',   n: 2, len: 2, speed: 60 },
      { r: 9, kind: 'car',   n: 3, len: 1, speed: 110 },
      { r: 10, kind: 'truck',n: 2, len: 2, speed: -70 },
      { r: 11, kind: 'car',  n: 3, len: 1, speed: 90 }
    ];
    for (const d of laneDefs) {
      const items = [];
      const gap = 13 / d.n;
      for (let i = 0; i < d.n; i++) items.push({ x: i * gap + rnd(2), len: d.len, w: d.len * this.cell });
      this.lanes.push({ ...d, items });
    }
    this.homes = [];
    for (let i = 0; i < 5; i++) this.homes.push({ c: 1 + i * 2.6, filled: false });
    this.lives = 4;
    this.score = 0;
    this.deaths = 0;
  }

  get cx() { return this.frog.c * this.cell + this.cell / 2; }

  update(dt) {
    this.t += dt;
    // move lanes
    for (const lane of this.lanes) {
      for (const it of lane.items) {
        it.x += lane.speed * dt / this.cell;
        const span = 13 + lane.len;
        if (it.x > span) it.x -= span;
        if (it.x < -lane.len) it.x += span;
      }
    }
    const f = this.frog;
    if (f.dead > 0) { f.dead -= dt; if (f.dead <= 0) this.resetFrog(); return; }

    const inp = this.in.p1;
    if (inp.upPressed) this.move(0, -1);
    if (inp.downPressed) this.move(0, 1);
    if (inp.leftPressed) this.move(-1, 0);
    if (inp.rightPressed) this.move(1, 0);

    if (f.r <= 5) {
      // on water — need a log
      const lane = this.lanes.find(l => l.r === f.r);
      let onLog = null;
      for (const it of lane.items) {
        if (this.cx > it.x * this.cell - 6 && this.cx < (it.x + it.len) * this.cell + 6) { onLog = it; break; }
      }
      if (onLog) {
        f.onLog = lane;
        f.c += lane.speed * dt / this.cell;
        if (f.c < -0.4 || f.c > 12.4) return this.die();
      } else return this.die();
      // homes
      if (f.r === 1) {
        for (const h of this.homes) {
          if (!h.filled && Math.abs(h.c - f.c) < 1.2) {
            h.filled = true; this.score += 200; this.audio.coin(); this.resetFrog();
            if (this.homes.every(x => x.filled)) this.win1P('ALL FROGS HOME!');
            return;
          }
        }
        return this.die();
      }
    } else if (f.r >= 7 && f.r <= 11) {
      // road — collision with cars
      const lane = this.lanes.find(l => l.r === f.r);
      if (lane) for (const it of lane.items) {
        const x1 = it.x * this.cell, x2 = x1 + it.len * this.cell;
        if (this.cx > x1 + 6 && this.cx < x2 - 6) return this.die();
      }
    }
  }

  move(dc, dr) {
    const f = this.frog;
    const nc = clamp(f.c + dc, 0, 12), nr = clamp(f.r + dr, 1, 12);
    if (nc === f.c && nr === f.r) return;
    f.c = nc; f.r = nr; f.onLog = null;
    this.audio.blip(500);
    this.score += 5;
  }

  die() {
    this.frog.dead = 1;
    this.lives--;
    this.deaths++;
    this.audio.explode();
    if (this.lives < 0) this.lose1P();
  }

  resetFrog() { this.frog = { c: 6, r: 12, onLog: null, dead: 0 }; }

  render(ctx) {
    // water
    ctx.fillStyle = '#0a2a5e'; ctx.fillRect(0, this.gridTop, this.W, 5 * this.cell);
    // grass rows
    ctx.fillStyle = '#123c1a'; ctx.fillRect(0, this.gridTop + 5 * this.cell, this.W, this.cell);
    // road
    ctx.fillStyle = '#22242c'; ctx.fillRect(0, this.gridTop + 6 * this.cell, this.W, 6 * this.cell);
    // lane markers
    ctx.fillStyle = 'rgba(255,255,255,.15)';
    for (let r = 7; r < 13; r++) {
      if (r === 7) continue;
      ctx.fillRect(0, this.gridTop + r * this.cell - 1, this.W, 2);
    }
    // start row
    ctx.fillStyle = '#123c1a'; ctx.fillRect(0, this.gridTop + 12 * this.cell, this.W, this.cell);

    // home bays
    for (const h of this.homes) {
      const x = h.c * this.cell;
      ctx.fillStyle = h.filled ? '#3fae4a' : '#0a2a5e';
      ctx.fillRect(x - 8, this.gridTop, this.cell + 16, this.cell);
      if (h.filled) { ctx.font = '24px serif'; ctx.fillText('🐸', x + 6, this.gridTop + 28); }
    }

    // lanes items
    for (const lane of this.lanes) {
      for (const it of lane.items) {
        const x = it.x * this.cell, y = this.gridTop + (lane.r - 1) * this.cell;
        const w = it.len * this.cell;
        if (lane.kind === 'log') {
          ctx.fillStyle = '#7a4a26'; rr(ctx, x, y + 6, w, this.cell - 12, 8); ctx.fill();
          ctx.fillStyle = '#9a6236'; ctx.fillRect(x + 6, y + 10, w - 12, 5);
        } else if (lane.kind === 'turtle') {
          ctx.fillStyle = '#2a7a4a';
          for (let i = 0; i < it.len; i++) {
            rr(ctx, x + i * this.cell + 3, y + 6, this.cell - 6, this.cell - 12, 10); ctx.fill();
            ctx.fillStyle = '#1a5a34'; ctx.fillRect(x + i * this.cell + 10, y + 12, this.cell - 20, this.cell - 24);
            ctx.fillStyle = '#2a7a4a';
          }
        } else if (lane.kind === 'truck') {
          ctx.fillStyle = '#c8c8d0'; rr(ctx, x, y + 4, w, this.cell - 8, 4); ctx.fill();
          ctx.fillStyle = '#4a6ad8'; ctx.fillRect(x + 4, y + 8, w - 8, 10);
          ctx.fillStyle = '#222'; ctx.fillRect(x + 6, y + this.cell - 8, 12, 5); ctx.fillRect(x + w - 18, y + this.cell - 8, 12, 5);
        } else {
          const cols = { 7: '#e8d44a', 8: '#4ad8e8', 9: '#e85a5a', 11: '#8a5ae8' };
          ctx.fillStyle = cols[lane.r] || '#e8e8f0';
          rr(ctx, x, y + 7, w, this.cell - 14, 6); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 4, y + 11, w - 8, 6);
          ctx.fillStyle = '#222'; ctx.fillRect(x + 4, y + this.cell - 10, 10, 5); ctx.fillRect(x + w - 14, y + this.cell - 10, 10, 5);
        }
      }
    }

    // frog
    const f = this.frog;
    const fx = f.c * this.cell + this.cell / 2;
    const fy = this.gridTop + (f.r - 1) * this.cell + this.cell / 2;
    if (f.dead > 0) {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = '26px serif'; ctx.textAlign = 'center';
      ctx.fillText('💥', fx, fy + 8);
      ctx.textAlign = 'left';
    } else {
      const hop = Math.abs(Math.sin(this.t * 6)) * 3;
      ctx.fillStyle = '#5ae05a';
      ctx.shadowColor = '#5ae05a'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(fx, fy - hop, 12, 10, 0, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#2a8a2a';
      ctx.fillRect(fx - 12, fy - 2 - hop, 6, 4); ctx.fillRect(fx + 6, fy - 2 - hop, 6, 4);
      ctx.fillStyle = '#fff';
      ctx.fillRect(fx - 7, fy - 8 - hop, 4, 4); ctx.fillRect(fx + 3, fy - 8 - hop, 4, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(fx - 6, fy - 7 - hop, 2, 2); ctx.fillRect(fx + 4, fy - 7 - hop, 2, 2);
    }

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `SCORE ${padScore(this.score)}`, 16, 16, { size: 11, color: '#7fc4ff' });
    txt(ctx, '🐸 FROGGER', this.W / 2, 16, { size: 11, color: '#5ae05a', align: 'center' });
    txt(ctx, '❤'.repeat(Math.max(0, this.lives)), this.W - 16, 18, { size: 14, color: '#ff6b7a', align: 'right', px: false });
  }
}

/* ---------- 2. SUPER MARIO BROS. ---------- */
class MarioGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 200, coinScore: 200, walkerStyle: 'goomba', flyerStyle: 'bat',
      theme: {
        sky: ['#5c94fc', '#8fc4fc'], hill: '#2a8a2a', hill2: '#1a6a1a',
        ground: '#8a5a2a', groundTop: '#d8a04a', plat: '#b06a2a', accent: '#ffd76b'
      }
    });
  }
  init() {
    super.init();
    this.showRound = false;
  }
}

/* ---------- 3. BATTLE CITY ---------- */
class TankGame extends Game {
  init() {
    this.cell = 40;
    this.cols = 24; this.rows = 12;
    this.gridY = 70;
    this.map = this.makeMap();
    this.base = { c: 11, r: 11, alive: true };
    this.player = { c: 9, r: 11, dir: 0, cd: 0, alive: true, respawnT: 0 };
    this.p2 = this.is2P ? { c: 13, r: 11, dir: 0, cd: 0, alive: true, respawnT: 0 } : null;
    this.enemies = [];
    this.bullets = [];
    this.spawnQueue = 12;
    this.spawnT = 1;
    this.spawnPoints = [[0, 0], [11, 0], [23, 0]];
    this.p1Lives = 3;
    this.p2Lives = 3;
    this.explosions = [];
  }

  makeMap() {
    const rng = makeRNG('battlecity_map');
    const m = [];
    for (let r = 0; r < this.rows; r++) {
      m.push([]);
      for (let c = 0; c < this.cols; c++) m[r].push(0);
    }
    for (let i = 0; i < 70; i++) {
      const c = rndInt(1, 22), r = rndInt(1, 10);
      const w = rndInt(1, 3), h = rndInt(1, 2);
      for (let dc = 0; dc < w; dc++) for (let dr = 0; dr < h; dr++) {
        const cc = c + dc, rr_ = r + dr;
        if (cc < 1 || cc > 22 || rr_ < 1 || rr_ > 10) continue;
        if (Math.abs(cc - 11) < 2 && rr_ > 9) continue;
        m[rr_][cc] = 1;
      }
    }
    // steel blocks
    for (let i = 0; i < 8; i++) {
      const c = rndInt(2, 21), r = rndInt(2, 8);
      m[r][c] = 2;
    }
    // clear base area & spawns
    for (let c = 9; c <= 15; c++) { m[11][c] = 0; m[10][c] = c === 11 || c === 12 ? 1 : 0; }
    m[10][10] = 1; m[10][13] = 1;
    m[11][10] = 0; m[11][15] = 0;
    m[0][0] = 0; m[0][11] = 0; m[0][23] = 0;
    return m;
  }

  cellFree(c, r, self) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    if (this.map[r][c] !== 0) return false;
    // base
    if (r >= 10 && c >= 10 && c <= 13) return false;
    if (self) {
      const others = [this.player, this.p2, ...this.enemies].filter(x => x && x !== self && x.alive !== false && !x.dead);
      for (const o of others) {
        if (Math.abs(o.c - c) < 1 && Math.abs(o.r - r) < 1) return false;
      }
    }
    return true;
  }

  update(dt) {
    this.t += dt;
    // respawn players
    for (const [tk, spawnC, livesKey] of [[this.player, 9, 'p1Lives'], [this.p2, 13, 'p2Lives']]) {
      if (!tk) continue;
      if (!tk.alive && tk.respawnT > 0) {
        tk.respawnT -= dt;
        if (tk.respawnT <= 0) {
          tk.alive = true; tk.c = spawnC; tk.r = 11; tk.dir = 0; tk.cd = 0.5; tk.spawnT = 1;
        }
      }
      if (tk.spawnT > 0) tk.spawnT -= dt;
    }
    // spawn
    if (this.spawnQueue > 0) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = 2.2;
        this.spawnQueue--;
        const [sc, sr] = pick(this.spawnPoints);
        this.enemies.push({ c: sc, r: sr, dir: 2, cd: 1, hp: 1, spawnT: 0.8, score: 100 });
      }
    }
    // player controls
    this.controlTank(this.player, this.in.p1, dt);
    if (this.p2) this.controlTank(this.p2, this.in.p2, dt);
    // enemies AI
    for (const e of this.enemies) {
      if (e.spawnT > 0) { e.spawnT -= dt; continue; }
      e.cd -= dt;
      if (e.cd <= 0) {
        e.cd = rnd(0.6, 1.4);
        // move toward base or player
        const target = this.base.alive ? { c: this.base.c, r: this.base.r } : this.player;
        const dirs = [];
        if (target.c < e.c) dirs.push(3); else if (target.c > e.c) dirs.push(1);
        if (target.r < e.r) dirs.push(0); else if (target.r > e.r) dirs.push(2);
        const dir = dirs.length && chance(0.75) ? pick(dirs) : rndInt(0, 3);
        this.tryMove(e, dir);
        if (chance(0.55)) this.fire(e);
      }
    }
    // bullets
    for (const b of this.bullets) {
      const sp = 320 * dt;
      const steps = 3;
      for (let s = 0; s < steps; s++) {
        if (b.dir === 0) b.y -= sp / steps;
        if (b.dir === 1) b.x += sp / steps;
        if (b.dir === 2) b.y += sp / steps;
        if (b.dir === 3) b.x -= sp / steps;
        this.bulletCollide(b);
        if (b.dead) break;
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    for (const ex of this.explosions) ex.ttl -= dt;
    this.explosions = this.explosions.filter(e => e.ttl > 0);

    if (!this.base.alive) this.lose1P();
    if (this.spawnQueue === 0 && this.enemies.length === 0 && !this.finished) {
      this.win1P('STAGE CLEAR!');
    }
  }

  controlTank(tk, inp, dt) {
    if (!tk.alive || !tk) return;
    tk.cd = Math.max(0, tk.cd - dt);
    let dir = -1;
    if (inp.up) dir = 0;
    else if (inp.right) dir = 1;
    else if (inp.down) dir = 2;
    else if (inp.left) dir = 3;
    if (dir >= 0) { tk.dir = dir; this.tryMove(tk, dir); }
    if (inp.actionPressed && tk.cd <= 0) {
      tk.cd = 0.45;
      this.bullets.push({
        x: tk.c * this.cell + this.cell / 2, y: tk.r * this.cell + this.cell / 2,
        dir: tk.dir, from: tk, dead: false
      });
      this.audio.shoot();
    }
  }

  tryMove(tk, dir) {
    const dc = [0, 1, 0, -1][dir], dr = [-1, 0, 1, 0][dir];
    const nc = tk.c + dc, nr = tk.r + dr;
    if (this.cellFree(nc, nr, tk)) { tk.c = nc; tk.r = nr; }
  }

  fire(tk) {
    this.bullets.push({
      x: tk.c * this.cell + this.cell / 2, y: tk.r * this.cell + this.cell / 2,
      dir: tk.dir, from: tk, dead: false
    });
    if (tk === this.player || tk === this.p2) this.audio.shoot();
  }

  bulletCollide(b) {
    const c = Math.floor(b.x / this.cell), r = Math.floor(b.y / this.cell);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) { b.dead = true; return; }
    const cell = this.map[r][c];
    if (cell === 1) { this.map[r][c] = 0; b.dead = true; this.audio.hit(); this.boom(b.x, b.y, 0.5); return; }
    if (cell === 2) { b.dead = true; this.audio.blip(200); return; }
    // base
    if (r >= 10 && c >= 10 && c <= 13 && this.base.alive) {
      if (b.from === this.player || b.from === this.p2) {
        // players can't destroy own base... classic: they can. Keep friendly: no.
        b.dead = true; return;
      }
      this.base.alive = false;
      b.dead = true;
      this.audio.explode();
      this.boom(b.x, b.y, 2);
      return;
    }
    // tanks
    const targets = (b.from === this.player || b.from === this.p2) ? this.enemies : [this.player, this.p2].filter(Boolean);
    for (const tk of targets) {
      if (!tk || tk === b.from) continue;
      if (tk.alive === false || tk.spawnT > 0) continue;
      const tc = tk.c * this.cell, tr = tk.r * this.cell;
      if (b.x > tc + 6 && b.x < tc + this.cell - 6 && b.y > tr + 6 && b.y < tr + this.cell - 6) {
        b.dead = true;
        this.boom(b.x, b.y, 1);
        if (targets === this.enemies) {
          tk.hp--;
          if (tk.hp <= 0) {
            tk.dead = true;
            this.addScore(100, b.from === this.p2 ? 1 : 0);
            this.audio.explode();
          }
        } else {
          tk.alive = false;
          tk.respawnT = 1.2;
          this.audio.explode();
          const livesKey = tk === this.player ? 'p1Lives' : 'p2Lives';
          this[livesKey]--;
          if (this[livesKey] < 0) {
            if (!this.p2 || this.p2Lives < 0) this.lose1P();
          }
        }
        break;
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.p1Lives < 0 && (!this.p2 || this.p2Lives < 0)) this.lose1P();
  }

  boom(x, y, size) {
    this.explosions.push({ x, y, ttl: 0.4, size });
  }

  render(ctx) {
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(0, this.gridY);
    // map
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.map[r][c];
        const x = c * this.cell, y = r * this.cell;
        if (v === 1) {
          ctx.fillStyle = '#b06a2a'; ctx.fillRect(x, y, this.cell, this.cell);
          ctx.fillStyle = 'rgba(255,255,255,.15)';
          for (let i = 0; i < 4; i++) ctx.fillRect(x + (i % 2) * 20, y + Math.floor(i / 2) * 20, 18, 18);
        } else if (v === 2) {
          ctx.fillStyle = '#c8c8d0'; ctx.fillRect(x, y, this.cell, this.cell);
          ctx.fillStyle = '#8a8a98'; ctx.fillRect(x + 4, y + 4, this.cell - 8, this.cell - 8);
          ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x + 8, y + 8, this.cell - 16, this.cell - 16);
        }
      }
    }
    // base (eagle)
    const bx = this.base.c * this.cell, by = this.base.r * this.cell;
    ctx.fillStyle = this.base.alive ? '#d8c860' : '#555';
    ctx.beginPath();
    ctx.moveTo(bx + 4, by + 36); ctx.lineTo(bx + 20, by + 6); ctx.lineTo(bx + 36, by + 36);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillRect(bx + 16, by + 26, 8, 10);

    // spawn stars
    for (const e of this.enemies) {
      if (e.spawnT > 0) {
        ctx.save();
        ctx.translate(e.c * this.cell + 20, e.r * this.cell + 20);
        ctx.rotate(this.t * 6);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-14, -2, 28, 4); ctx.fillRect(-2, -14, 4, 28);
        ctx.restore();
      }
    }
    // tanks
    this.drawTank(ctx, this.player, '#d8a030');
    if (this.p2) this.drawTank(ctx, this.p2, '#3aa0ff');
    for (const e of this.enemies) {
      if (e.spawnT > 0) continue;
      this.drawTank(ctx, e, e.hp > 1 ? '#7dff9a' : '#c8d8e8');
    }
    // bullets
    for (const b of this.bullets) {
      ctx.fillStyle = '#fff';
      const s = 5;
      ctx.fillRect(b.x - s / 2, b.y - s / 2, s, s);
    }
    // explosions
    for (const ex of this.explosions) {
      ctx.globalAlpha = clamp(ex.ttl * 2.5, 0, 1);
      ctx.fillStyle = '#ff9a3a';
      const r = 10 + ex.size * 14 * (1 - ex.ttl / 0.4);
      ctx.beginPath(); ctx.arc(ex.x, ex.y, r, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath(); ctx.arc(ex.x, ex.y, r * 0.55, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // top bar
    ctx.fillStyle = '#4a4a58'; ctx.fillRect(0, 0, this.W, this.gridY);
    txt(ctx, `ENEMIES ${this.spawnQueue + this.enemies.length}`, 20, 22, { size: 11, color: '#fff' });
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, 20, 44, { size: 10, color: '#ffd76b' });
    if (this.is2P) txt(ctx, `P2 ${padScore(this.scores[1])}`, 20, 60, { size: 9, color: '#8fd0ff' });
    txt(ctx, '🎖️ BATTLE CITY', this.W / 2, 28, { size: 13, color: '#e8e8f0', align: 'center' });
    txt(ctx, this.base.alive ? 'BASE OK' : 'BASE LOST', this.W / 2, 52, { size: 9, color: this.base.alive ? '#7dffb0' : '#ff6b7a', align: 'center' });
  }

  drawTank(ctx, tk, color) {
    if (!tk || tk.alive === false) return;
    const x = tk.c * this.cell, y = tk.r * this.cell;
    ctx.save();
    ctx.translate(x + 20, y + 20);
    ctx.rotate(tk.dir * Math.PI / 2);
    ctx.fillStyle = color;
    ctx.fillRect(-16, -16, 32, 32);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(-18, -16, 4, 32); ctx.fillRect(14, -16, 4, 32);
    ctx.fillStyle = color;
    ctx.fillRect(-5, -24, 10, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(-2, -26, 4, 10);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(-8, -10, 16, 12);
    ctx.restore();
  }
}

/* ---------- 4. DUCK HUNT ---------- */
class DuckHuntGame extends Game {
  init() {
    this.round = 1;
    this.shots = 3;
    this.ducks = [];
    this.score = 0;
    this.spawnWave();
    this.crossX = this.W / 2; this.crossY = this.H / 2;
    this.msgT = 0;
  }

  spawnWave() {
    this.ducks = [];
    const n = 2 + Math.floor(this.round / 2);
    for (let i = 0; i < n; i++) {
      this.ducks.push({
        x: rnd(100, this.W - 100), y: rnd(100, 300),
        vx: (chance(0.5) ? 1 : -1) * rnd(90, 140) * (1 + this.round * 0.1),
        vy: -rnd(40, 90), flap: rnd(6), state: 'fly', t: 0
      });
    }
    this.shots = 3;
    this.waveT = 12;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    this.waveT -= dt;
    const inp = this.in.p1;
    // aim with arrows or WASD, shoot with space/enter
    const sp = 560 * dt;
    if (inp.left) this.crossX -= sp;
    if (inp.right) this.crossX += sp;
    if (inp.up) this.crossY -= sp;
    if (inp.down) this.crossY += sp;
    this.crossX = clamp(this.crossX, 0, this.W); this.crossY = clamp(this.crossY, 40, this.H - 60);

    if ((inp.actionPressed || inp.secondaryPressed) && this.shots > 0) {
      this.shots--;
      this.audio.shoot();
      let hit = false;
      for (const d of this.ducks) {
        if (d.state !== 'fly') continue;
        if (Math.abs(d.x - this.crossX) < 34 && Math.abs(d.y - this.crossY) < 34) {
          d.state = 'shot'; d.t = 0; hit = true;
          this.score += 100 * this.round;
          this.audio.explode();
          break;
        }
      }
      if (!hit) this.audio.blip(180);
    }

    for (const d of this.ducks) {
      d.flap += dt * 14;
      if (d.state === 'fly') {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < 40 || d.x > this.W - 40) { d.vx *= -1; d.x = clamp(d.x, 40, this.W - 40); }
        if (d.y < 50) d.vy = Math.abs(d.vy);
        if (d.y > 330) d.vy = -Math.abs(d.vy);
        d.t += dt;
        if (chance(dt * 0.5)) d.vy = rnd(-110, -30);
      } else if (d.state === 'shot') {
        d.t += dt;
        if (d.t > 0.4) { d.state = 'fall'; d.t = 0; }
      } else if (d.state === 'fall') {
        d.y += 500 * dt;
        if (d.y > 430) { d.state = 'dead'; d.t = 0; }
      } else if (d.state === 'dead') {
        d.t += dt;
      }
    }
    const flying = this.ducks.filter(d => d.state === 'fly').length;
    if (flying === 0 || this.waveT <= 0) {
      if (flying === 0) { this.round++; this.msgT = 1.2; this.spawnWave(); this.audio.powerup(); }
      else {
        this.ducks.forEach(d => { if (d.state === 'fly') d.state = 'flee'; });
        this.lose1P();
      }
    }
  }

  render(ctx) {
    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#8fd4ff'); grad.addColorStop(0.7, '#c8ecff'); grad.addColorStop(1, '#9adf8f');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    // tree
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(80, 300, 24, 120);
    ctx.fillStyle = '#2a8a2a';
    ctx.beginPath(); ctx.arc(92, 280, 60, 0, 7); ctx.fill();
    // bush
    ctx.fillStyle = '#3fae4a';
    ctx.beginPath(); ctx.ellipse(700, 440, 120, 46, 0, Math.PI, 0); ctx.fill();
    // grass
    ctx.fillStyle = '#5ac05a'; ctx.fillRect(0, 430, this.W, this.H - 430);
    // ducks
    for (const d of this.ducks) {
      if (d.state === 'dead') continue;
      this.drawDuck(ctx, d);
    }
    // crosshair
    const cx = this.crossX, cy = this.crossY;
    ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 30, cy); ctx.lineTo(cx - 8, cy);
    ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 30, cy);
    ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy - 8);
    ctx.moveTo(cx, cy + 8); ctx.lineTo(cx, cy + 30);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `SCORE ${padScore(this.score)}`, 16, 16, { size: 11, color: '#ffd76b' });
    txt(ctx, `ROUND ${this.round}`, this.W / 2, 16, { size: 11, color: '#fff', align: 'center' });
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < this.shots ? '#fff' : 'rgba(255,255,255,.2)';
      ctx.fillRect(this.W - 60 + i * 18, 10, 6, 18);
    }
    if (this.msgT > 0) txt(ctx, `ROUND ${this.round} — FLY!`, this.W / 2, 200, { size: 22, color: '#fff', align: 'center', glow: 18 });
  }

  drawDuck(ctx, d) {
    ctx.save();
    ctx.translate(d.x, d.y);
    if (d.vx < 0) ctx.scale(-1, 1);
    if (d.state === 'shot') { ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.fillText('💥', 0, 10); ctx.restore(); return; }
    if (d.state === 'fall') { ctx.rotate(Math.PI); }
    const flap = Math.sin(d.flap) * 14;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.ellipse(0, 0, 22, 13, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a5a2a';
    ctx.beginPath(); ctx.ellipse(0, -2, 18, 10, 0, 0, 7); ctx.fill();
    // head
    ctx.fillStyle = '#2a8a2a';
    ctx.beginPath(); ctx.arc(18, -12, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#7ac87a'; ctx.fillRect(14, -20, 6, 5);
    ctx.fillStyle = '#e8b02a'; ctx.fillRect(24, -13, 10, 5);
    // eye
    ctx.fillStyle = '#fff'; ctx.fillRect(20, -16, 4, 4);
    ctx.fillStyle = '#000'; ctx.fillRect(21, -15, 2, 2);
    // wing
    ctx.fillStyle = '#1a4a1a';
    ctx.beginPath();
    ctx.ellipse(-2, -4 + flap * 0.5, 14, 6, flap * 0.05, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

/* ---------- 5. PUNCH-OUT!! ---------- */
class BoxingGame extends Game {
  init() {
    this.round = 1;
    this.playerHp = 100; this.foeHp = 100;
    this.playerState = 'idle'; this.foeState = 'idle';
    this.pT = 0; this.fT = 0;
    this.foe = this.makeFoe();
    this.msg = 'ROUND 1 — FIGHT!'; this.msgT = 1.6;
    this.phase = 'fight';
  }

  makeFoe() {
    const foes = [
      { name: 'GLASS JOE', col: '#e8a05a', speed: 1.0, dmg: 8, telegraph: 0.9 },
      { name: 'PISTON HONDA', col: '#d87a4a', speed: 1.25, dmg: 12, telegraph: 0.7 },
      { name: 'BALD BULL', col: '#c85a3a', speed: 1.5, dmg: 16, telegraph: 0.55 }
    ];
    return foes[Math.min(this.round - 1, 2)];
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    if (this.phase === 'over') return;
    const inp = this.in.p1;
    this.pT = Math.max(0, this.pT - dt);
    this.fT = Math.max(0, this.fT - dt);

    if (this.playerState === 'idle') {
      if (inp.actionPressed) { this.playerState = 'jab'; this.pT = 0.28; this._jabDone = false; this.audio.blip(600); }
      else if (inp.secondaryPressed) { this.playerState = 'block'; this.pT = 0.4; }
    } else if (this.pT <= 0) {
      this.playerState = 'idle';
      this._jabDone = false;
    }
    if (this.playerState === 'jab' && this.pT < 0.18 && !this._jabDone) {
      this._jabDone = true;
      if (this.foeState === 'wind' || this.foeState === 'strike') {
        // counter hit!
        this.foeHp -= 14; this.audio.hit(); this.foeState = 'hurt'; this.fT = 0.6;
        this.addScore(150);
      } else {
        this.foeHp -= 7; this.audio.hit(); this.addScore(60);
        this.foeState = 'hurt'; this.fT = 0.25;
      }
      if (this.foeHp <= 0) {
        this.addScore(1000);
        this.round++;
        if (this.round > 3) { this.win1P('CHAMPION!'); this.phase = 'over'; return; }
        this.foe = this.makeFoe();
        this.foeHp = 100;
        this.msg = `VS ${this.foe.name}!`; this.msgT = 1.6;
      }
    }

    // foe AI
    if (this.foeState === 'idle' && this.fT <= 0) {
      if (chance(dt * 0.8 * this.foe.speed)) {
        this.foeState = 'wind'; this.fT = this.foe.telegraph / this.foe.speed;
      }
    } else if (this.foeState === 'wind' && this.fT <= 0) {
      this.foeState = 'strike'; this.fT = 0.3;
    } else if (this.foeState === 'strike' && this.fT <= 0) {
      if (this.playerState === 'block') { this.audio.blip(240); this.addScore(40); }
      else {
        this.playerHp -= this.foe.dmg;
        this.audio.hurt();
        if (this.playerHp <= 0) { this.lose1P(); this.phase = 'over'; return; }
      }
      this.foeState = 'idle'; this.fT = rnd(0.4, 1) / this.foe.speed;
    } else if (this.foeState === 'hurt' && this.fT <= 0) {
      this.foeState = 'idle';
    }
  }

  render(ctx) {
    // ring
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#1a1a2e'); grad.addColorStop(1, '#0a0a14');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    // crowd
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + (i % 5) * 0.015})`;
      ctx.beginPath(); ctx.arc((i * 97) % this.W, 60 + (i % 4) * 26, 14, 0, 7); ctx.fill();
    }
    // ring floor
    ctx.fillStyle = '#3a5a8a'; ctx.fillRect(0, 400, this.W, 140);
    ctx.fillStyle = '#4a6a9a'; ctx.fillRect(0, 400, this.W, 14);
    // ropes
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = ['#e8e8f0', '#e8d44a', '#e85a5a'][i];
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, 330 + i * 24); ctx.lineTo(this.W, 330 + i * 24); ctx.stroke();
    }

    // foe (back view)
    const fy = 300 + (this.foeState === 'strike' ? 26 : this.foeState === 'wind' ? -10 : 0);
    ctx.fillStyle = this.foe.col;
    ctx.fillRect(400, fy, 160, 110);
    ctx.fillStyle = '#fff';
    ctx.fillRect(430, fy + 20, 26, 20); ctx.fillRect(504, fy + 20, 26, 20);
    ctx.fillStyle = '#222';
    ctx.fillRect(436, fy + 26, 12, 8); ctx.fillRect(510, fy + 26, 12, 8);
    // foe gloves
    ctx.fillStyle = '#e83a3a';
    const gy = this.foeState === 'strike' ? 380 : 350;
    ctx.beginPath(); ctx.arc(380, gy, 26, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(580, gy, 26, 0, 7); ctx.fill();
    if (this.foeState === 'wind') {
      txt(ctx, '!', 480, fy - 30, { size: 30, color: '#ffd76b', align: 'center', glow: 14 });
    }

    // player (front view, bottom)
    const py = 470 + (this.playerState === 'hurt' ? 0 : 0);
    ctx.fillStyle = '#3a8a5a';
    ctx.fillRect(430, py, 100, 70);
    ctx.fillStyle = '#ffcf9e';
    ctx.beginPath(); ctx.arc(480, py, 26, 0, 7); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.fillRect(466, py - 10, 10, 6); ctx.fillRect(488, py - 10, 10, 6);
    // player gloves
    ctx.fillStyle = '#3a8aff';
    const gx = this.playerState === 'jab' ? 440 : 456;
    ctx.beginPath(); ctx.arc(gx, py - 16, 22, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(504, py - 16, 22, 0, 7); ctx.fill();
    if (this.playerState === 'block') {
      ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 4; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(480, py - 10, 44, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.7)'; ctx.fillRect(0, 0, this.W, 60);
    txt(ctx, `YOU`, 40, 20, { size: 10, color: '#7fc4ff' });
    this.bar(ctx, 40, 34, 320, 14, this.playerHp / 100, '#5db8ff');
    txt(ctx, this.foe.name, this.W - 40, 20, { size: 10, color: '#ff8d99', align: 'right' });
    this.bar(ctx, this.W - 360, 34, 320, 14, this.foeHp / 100, '#ff6b7a');
    txt(ctx, `ROUND ${this.round}/3`, this.W / 2, 30, { size: 12, color: '#fff', align: 'center' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 180, { size: 20, color: '#ffd76b', align: 'center', glow: 18 });
    txt(ctx, 'SPACE JAB · SHIFT BLOCK (counter when he winds up!)', this.W / 2, 515, { size: 9, color: '#8fa8c8', align: 'center' });
  }

  bar(ctx, x, y, w, h, p, col) {
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, x, y, w, h, 5); ctx.fill();
    ctx.fillStyle = col; rr(ctx, x, y, w * clamp(p, 0, 1), h, 5); ctx.fill();
  }
}

/* ---------- 6. TMNT (scrolling co-op beat'em up) ---------- */
class TMNTGame extends BrawlerGame {
  constructor(host) {
    super(host, {
      scrolling: true, len: 2600, waves: 4, enemiesPerWave: 4,
      enemyColor: '#8a4bd8', enemySpeed: 100, boss: true,
      p1Color: '#4ad84a', p2Color: '#e84a4a'
    });
  }
}

/* ---------- 7. NINJA GAIDEN ---------- */
class NinjaGaidenGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 210, walkerStyle: 'ninja', flyerStyle: 'bat', guardStyle: 'guard',
      doubleJump: true, melee: { range: 54, rate: 0.34, color: '#e8d44a' },
      enemySpeed: 95, enemyDensity: 0.6, flyerDensity: 0.28,
      theme: {
        sky: ['#0a1030', '#28304e'], hill: '#141c38', hill2: '#0c1226',
        ground: '#3a4258', groundTop: '#5a6a8a', plat: '#4a5470', accent: '#e8d44a'
      }
    });
  }
}

/* ---------- 8. DOUBLE DRAGON ---------- */
class DoubleDragonGame extends BrawlerGame {
  constructor(host) {
    super(host, {
      scrolling: true, len: 2800, waves: 5, enemiesPerWave: 4,
      enemyColor: '#c86a2a', enemySpeed: 95, boss: true,
      p1Color: '#3a7ae8', p2Color: '#e84a4a'
    });
  }
}

/* ---------- 9. MORTAL KOMBAT ---------- */
class MortalKombatGame extends FighterGame {
  constructor(host) {
    super(host, {
      p1: { name: 'LIU KANG', color: '#ffd76b', pants: '#3a3a5a', special: 'fire', specialColor: '#ff9a3a' },
      p2: { name: 'SUB-ZERO', color: '#5db8ff', pants: '#274a72', special: 'ice', specialColor: '#8fe0ff' },
      sky: ['#3a1414', '#0a0208'], floor: '#4a3a2a', crowd: '#1a0c0c',
      roundTime: 60, roundsToWin: 2
    });
  }
}

/* ---------- 10. STREET FIGHTER ---------- */
class StreetFighterGame extends FighterGame {
  constructor(host) {
    super(host, {
      p1: { name: 'RYU', color: '#fff', pants: '#3a5ae8', special: 'hadou', specialColor: '#8fe0ff' },
      p2: { name: 'KEN', color: '#ffd76b', pants: '#e85a3a', special: 'flame', specialColor: '#ff9a3a' },
      sky: ['#2a4a6e', '#0c1420'], floor: '#6a5a3a', crowd: '#141c28',
      roundTime: 60, roundsToWin: 2
    });
  }
}

window.FroggerGame = FroggerGame;
window.MarioGame = MarioGame;
window.TankGame = TankGame;
window.DuckHuntGame = DuckHuntGame;
window.BoxingGame = BoxingGame;
window.TMNTGame = TMNTGame;
window.NinjaGaidenGame = NinjaGaidenGame;
window.DoubleDragonGame = DoubleDragonGame;
window.MortalKombatGame = MortalKombatGame;
window.StreetFighterGame = StreetFighterGame;
