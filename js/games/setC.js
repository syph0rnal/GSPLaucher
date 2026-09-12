/* ============================================================
   setC.js — Games 21-30
   Excitebike, Sonic, Adventure Island, Zelda, Kirby, Felix,
   Bugs Bunny, Chip'n'Dale, Tiny Toon, Contra
   ============================================================ */

/* ---------- 21. EXCITEBIKE ---------- */
class ExcitebikeGame extends Game {
  init() {
    this.trackLen = 5200;
    this.hills = [];
    let x = 500;
    const rng = makeRNG('excite_track');
    while (x < this.trackLen - 300) {
      const w = 60 + rng() * 160;
      const h = 30 + rng() * 90;
      this.hills.push({ x, w, h });
      x += w + 160 + rng() * 260;
    }
    this.bikes = [{ x: 120, y: 0, vy: 0, speed: 340, temp: 0, idx: 0, airborne: false, dead: 0 }];
    if (this.is2P) this.bikes.push({ x: 60, y: 0, vy: 0, speed: 340, temp: 0, idx: 1, airborne: false, dead: 0 });
    this.camX = 0;
    this.groundY = 440;
  }

  hillAt(x) {
    for (const h of this.hills) {
      if (x > h.x && x < h.x + h.w) {
        // ramp height
        const t = (x - h.x) / h.w;
        return h.h * (1 - t);
      }
    }
    return 0;
  }

  update(dt) {
    this.t += dt;
    for (const b of this.bikes) {
      if (b.dead > 0) { b.dead -= dt; if (b.dead <= 0) { b.x = Math.max(60, b.x - 200); b.speed = 200; b.temp = 0; } continue; }
      const inp = b.idx === 0 ? this.in.p1 : this.in.p2;
      // throttle
      if (inp.action) b.speed = Math.min(560, b.speed + 300 * dt);
      else b.speed = Math.max(220, b.speed - 160 * dt);
      if (inp.secondary) b.speed = Math.max(120, b.speed - 400 * dt);
      // overheat
      if (inp.action) {
        b.temp += dt * 0.22;
        if (b.temp >= 1) { b.dead = 1.4; this.audio.explode(); continue; }
      } else b.temp = Math.max(0, b.temp - dt * 0.3);

      b.x += b.speed * dt;
      const groundH = this.hillAt(b.x + 20);
      const gy = this.groundY - groundH;
      if (!b.airborne) {
        if (b.y < gy - 2) { b.airborne = true; }
        else b.y = gy;
      }
      if (b.airborne) {
        b.vy += 1500 * dt;
        b.y += b.vy * dt;
        if (b.y >= gy) {
          // landing
          const impact = b.vy;
          b.y = gy; b.airborne = false; b.vy = 0;
          if (impact > 620) { b.dead = 1.2; this.audio.explode(); }
          else this.audio.blip(180);
        }
      } else {
        // launch off ramps
        const ahead = this.hillAt(b.x + 34);
        if (groundH - ahead > 18) {
          b.airborne = true;
          b.vy = -(b.speed * 0.55 + (groundH - ahead) * 2.2);
          this.audio.jump();
        }
      }
      if (b.x >= this.trackLen) {
        if (this.is2P) this.wins(b.idx);
        else this.win1P('FINISH!');
        return;
      }
    }
    const focus = Math.max(...this.bikes.map(b => b.x));
    this.camX = clamp(focus - this.W * 0.35, 0, this.trackLen - this.W + 100);
  }

  render(ctx) {
    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#3a7ae8'); grad.addColorStop(0.65, '#8fc4fc'); grad.addColorStop(1, '#e8d8a8');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(-this.camX, 0);
    // crowd stands
    for (let i = 0; i < 30; i++) {
      const sx = i * 240;
      ctx.fillStyle = '#2a3a5a'; ctx.fillRect(sx, 200, 200, 90);
      for (let j = 0; j < 30; j++) {
        ctx.fillStyle = `hsl(${(i * 30 + j * 17) % 360},60%,${45 + (j % 3) * 8}%)`;
        ctx.fillRect(sx + 8 + (j % 10) * 19, 210 + Math.floor(j / 10) * 26, 12, 18);
      }
    }
    // track
    ctx.fillStyle = '#8a6a42'; ctx.fillRect(0, this.groundY, this.trackLen + 100, this.H - this.groundY);
    ctx.fillStyle = '#a8824f'; ctx.fillRect(0, this.groundY, this.trackLen + 100, 10);
    // dirt stripes
    ctx.fillStyle = 'rgba(0,0,0,.12)';
    for (let i = 0; i < 60; i++) ctx.fillRect(i * 90, this.groundY + 20 + (i % 3) * 26, 46, 8);
    // hills/ramps
    for (const h of this.hills) {
      ctx.fillStyle = '#c8a05a';
      ctx.beginPath();
      ctx.moveTo(h.x, this.groundY);
      ctx.lineTo(h.x + h.w, this.groundY);
      ctx.lineTo(h.x + h.w, this.groundY - h.h * 0.12);
      ctx.lineTo(h.x + 8, this.groundY - h.h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#e8c878';
      ctx.fillRect(h.x + 2, this.groundY - h.h - 4, h.w - 10, 8);
    }
    // finish flag
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.trackLen, 240, 6, this.groundY - 240);
    ctx.fillStyle = '#111';
    for (let i = 0; i < 6; i++) ctx.fillRect(this.trackLen + 6, 244 + i * 24, 30, 12);
    // bikes
    for (const b of this.bikes) {
      if (b.dead > 0) {
        ctx.font = '40px serif'; ctx.textAlign = 'center';
        ctx.fillText('💥', b.x + 20, b.y - 10);
        ctx.textAlign = 'left';
        continue;
      }
      this.drawBike(ctx, b);
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    const b0 = this.bikes[0];
    txt(ctx, `SPEED ${Math.round(b0.speed / 3)}`, 16, 16, { size: 10, color: '#ffd76b' });
    // temp bar
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(140, 12, 100, 8);
    ctx.fillStyle = b0.temp > 0.7 ? '#ff5a5a' : '#7dffb0';
    ctx.fillRect(140, 12, 100 * b0.temp, 8);
    txt(ctx, 'TEMP', 140, 32, { size: 7, color: '#8fa8c8' });
    const prog = clamp(b0.x / this.trackLen, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(this.W / 2 - 110, 12, 220, 8);
    ctx.fillStyle = '#7dffb0'; ctx.fillRect(this.W / 2 - 110, 12, 220 * prog, 8);
    txt(ctx, '🏁', this.W / 2 + 110, 16, { size: 10, color: '#fff', px: false });
    if (this.is2P) {
      const b1 = this.bikes[1];
      txt(ctx, `P2 ${Math.round(b1.x / this.trackLen * 100)}%`, this.W - 16, 16, { size: 10, color: '#ff8d99', align: 'right' });
    }
  }

  drawBike(ctx, b) {
    const col = b.idx === 0 ? '#3a7ae8' : '#e83a3a';
    const x = b.x, y = b.y;
    ctx.save();
    ctx.translate(x + 22, y - 12);
    if (b.airborne) ctx.rotate(clamp(b.vy * 0.0004, -0.3, 0.3));
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(0, 14, 26, 5, 0, 0, 7); ctx.fill();
    // wheels
    ctx.strokeStyle = '#222'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(-16, 8, 11, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(18, 8, 11, 0, 7); ctx.stroke();
    // frame
    ctx.strokeStyle = col; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-16, 8); ctx.lineTo(-2, -4); ctx.lineTo(14, -4); ctx.lineTo(18, 8);
    ctx.moveTo(-2, -4); ctx.lineTo(-8, 8);
    ctx.stroke();
    // rider
    drawDude(ctx, -8, -32, 18, 30, col, { face: 1 });
    // handlebar
    ctx.strokeStyle = '#444'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(18, -14); ctx.stroke();
    ctx.restore();
  }
}

/* ---------- 22. SONIC ---------- */
class SonicGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 230, speed: 430, accel: 3200, jump: 880,
      walkerStyle: 'goomba', flyerStyle: 'bat', rings: true,
      enemyDensity: 0.35, flyerDensity: 0.22,
      theme: {
        sky: ['#48a0e8', '#a8e0f8'], hill: '#2a9a3a', hill2: '#1a7a2a',
        ground: '#8a5a2a', groundTop: '#7ac850', plat: '#b08a4a', accent: '#ffd76b'
      }
    });
  }
}

/* ---------- 23. ADVENTURE ISLAND ---------- */
class AdventureIslandGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 200, fruit: true, timer: 0, walkerStyle: 'goomba', flyerStyle: 'bat',
      melee: { range: 46, rate: 0.4, color: '#e8e8f0' },
      enemyDensity: 0.5, flyerDensity: 0.3,
      theme: {
        sky: ['#48c8e8', '#b8ecf8'], hill: '#2a9a3a', hill2: '#1a7a2a',
        ground: '#7a5a32', groundTop: '#5ac850', plat: '#a8824a', accent: '#ff8a5a'
      }
    });
  }
}

/* ---------- 24. THE LEGEND OF ZELDA ---------- */
class ZeldaGame extends Game {
  init() {
    this.cell = 44;
    this.cols = 18; this.rows = 9;
    this.area = 1;
    this.maxArea = 5;
    this.makeRoom();
    this.player = { x: 2 * this.cell, y: 4.5 * this.cell, dir: 1, cd: 0, hp: 6, maxHp: 6, inv: 0, swing: 0 };
    this.enemies = [];
    this.projectiles = [];
    this.spawnEnemies();
    this.keysFound = 0;
    this.msg = `DUNGEON ${this.area} / ${this.maxArea} — FIND THE TRIFORCE`;
    this.msgT = 2;
  }

  makeRoom() {
    const rng = makeRNG('zelda_room_' + this.area);
    this.blocked = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const border = r === 0 || c === 0 || r === this.rows - 1 || c === this.cols - 1;
        row.push(border ? 1 : (rng() < 0.1 ? 1 : 0));
      }
      this.blocked.push(row);
    }
    // doors
    this.doors = { right: this.area < this.maxArea, left: this.area > 1 };
    if (this.doors.right) { this.blocked[Math.floor(this.rows / 2)][this.cols - 1] = 0; }
    if (this.doors.left) { this.blocked[Math.floor(this.rows / 2)][0] = 0; }
    // triforce in last room
    this.triforce = this.area === this.maxArea ? { x: (this.cols - 3) * this.cell, y: (this.rows / 2) * this.cell } : null;
    // hearts
    this.pickups = [];
    if (rng() < 0.7) {
      this.pickups.push({ x: (2 + Math.floor(rng() * (this.cols - 4))) * this.cell, y: (1 + Math.floor(rng() * (this.rows - 2))) * this.cell, kind: 'heart' });
    }
  }

  spawnEnemies() {
    const rng = makeRNG('zelda_en_' + this.area);
    const n = 3 + this.area;
    this.enemies = [];
    for (let i = 0; i < n; i++) {
      let ex, ey, tries = 0;
      do {
        ex = (1 + Math.floor(rng() * (this.cols - 2))) * this.cell;
        ey = (1 + Math.floor(rng() * (this.rows - 2))) * this.cell;
        tries++;
      } while (tries < 30 && (this.blocked[Math.floor(ey / this.cell)][Math.floor(ex / this.cell)] || dist2(ex, ey, this.player.x, this.player.y) < 200 * 200));
      this.enemies.push({
        x: ex, y: ey, w: 30, h: 30, hp: 1 + Math.floor(this.area / 2),
        t: rnd(6), cd: rnd(1, 2), animT: rnd(6)
      });
    }
  }

  free(x, y, w, h) {
    const pts = [[x + 4, y + 4], [x + w - 4, y + 4], [x + 4, y + h - 4], [x + w - 4, y + h - 4]];
    for (const [px, py] of pts) {
      const c = Math.floor(px / this.cell), r = Math.floor(py / this.cell);
      if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
      if (this.blocked[r][c]) return false;
    }
    return true;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    const p = this.player;
    const inp = this.in.p1;
    p.cd = Math.max(0, p.cd - dt); p.inv = Math.max(0, p.inv - dt);
    p.swing = Math.max(0, p.swing - dt);
    const sp = 220;
    let dx = 0, dy = 0;
    if (inp.left) { dx = -1; p.dir = 3; }
    else if (inp.right) { dx = 1; p.dir = 1; }
    else if (inp.up) { dy = -1; p.dir = 0; }
    else if (inp.down) { dy = 1; p.dir = 2; }
    if (dx || dy) {
      const nx = p.x + dx * sp * dt, ny = p.y + dy * sp * dt;
      if (this.free(nx, p.y, 30, 30)) p.x = nx;
      if (this.free(p.x, ny, 30, 30)) p.y = ny;
    }
    // attack
    if (inp.actionPressed && p.cd <= 0) {
      p.cd = 0.35; p.swing = 0.18;
      this.audio.shoot();
      // sword hitbox
      const range = 46;
      const hx = p.dir === 1 ? p.x + 30 : p.dir === 3 ? p.x - range : p.x - 8;
      const hy = p.dir === 2 ? p.y + 30 : p.dir === 0 ? p.y - range : p.y - 8;
      const box = { x: hx, y: hy, w: p.dir === 1 || p.dir === 3 ? range : 46, h: p.dir === 0 || p.dir === 2 ? range : 46 };
      for (const e of this.enemies) {
        if (aabb(box, e)) {
          e.hp--;
          this.audio.hit();
          if (e.hp <= 0) { this.addScore(100); }
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.hp > 0);

    // enemy AI (octorok-like: wander + shoot)
    for (const e of this.enemies) {
      e.animT += dt;
      e.t -= dt;
      e.cd -= dt;
      if (e.t <= 0) {
        e.t = rnd(0.8, 1.8);
        e.dir = rndInt(0, 3);
      }
      const sp = 70 + this.area * 10;
      const dc = [0, 1, 0, -1][e.dir || 0], dr = [-1, 0, 1, 0][e.dir || 0];
      const nx = e.x + dc * sp * dt, ny = e.y + dr * sp * dt;
      if (this.free(nx, ny, 30, 30)) { e.x = nx; e.y = ny; }
      else e.dir = rndInt(0, 3);
      if (e.cd <= 0) {
        e.cd = rnd(1.5, 3);
        this.projectiles.push({ x: e.x + 15, y: e.y + 15, dir: e.dir || 0 });
      }
      // touch player
      if (p.inv <= 0 && aabb({ x: e.x, y: e.y, w: 30, h: 30 }, { x: p.x, y: p.y, w: 30, h: 30 })) {
        this.hurtPlayer();
      }
    }
    // projectiles
    for (const pr of this.projectiles) {
      const sp = 190;
      pr.x += [0, 1, 0, -1][pr.dir] * sp * dt;
      pr.y += [-1, 0, 1, 0][pr.dir] * sp * dt;
      if (!this.free(pr.x - 6, pr.y - 6, 12, 12)) pr.dead = true;
      if (p.inv <= 0 && Math.abs(pr.x - (p.x + 15)) < 20 && Math.abs(pr.y - (p.y + 15)) < 20) {
        pr.dead = true;
        this.hurtPlayer();
      }
    }
    this.projectiles = this.projectiles.filter(pr => !pr.dead);
    // pickups
    for (const pk of this.pickups) {
      if (pk.got) continue;
      if (dist2(pk.x + 15, pk.y + 15, p.x + 15, p.y + 15) < 34 * 34) {
        pk.got = true;
        p.hp = Math.min(p.maxHp, p.hp + 2);
        this.audio.powerup();
      }
    }
    // triforce
    if (this.triforce && dist2(this.triforce.x, this.triforce.y, p.x + 15, p.y + 15) < 40 * 40) {
      this.win1P('TRIFORCE OBTAINED!');
      return;
    }
    // doors
    const cxCell = Math.floor((p.x + 15) / this.cell), cyCell = Math.floor((p.y + 15) / this.cell);
    if (this.doors.right && cxCell >= this.cols - 1 && cyCell === Math.floor(this.rows / 2)) {
      this.area++; this.makeRoom(); this.spawnEnemies();
      p.x = this.cell; p.y = Math.floor(this.rows / 2) * this.cell;
      this.msg = `DUNGEON ${this.area} / ${this.maxArea}`; this.msgT = 1.4;
      this.audio.powerup();
    } else if (this.doors.left && cxCell <= 0 && cyCell === Math.floor(this.rows / 2)) {
      this.area--; this.makeRoom(); this.spawnEnemies();
      p.x = (this.cols - 2) * this.cell; p.y = Math.floor(this.rows / 2) * this.cell;
      this.msg = `DUNGEON ${this.area} / ${this.maxArea}`; this.msgT = 1.4;
      this.audio.blip(300);
    }
  }

  hurtPlayer() {
    this.player.hp--;
    this.player.inv = 1.4;
    this.audio.hurt();
    if (this.player.hp <= 0) this.lose1P();
  }

  render(ctx) {
    ctx.fillStyle = '#14141c'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate((this.W - this.cols * this.cell) / 2, (this.H - this.rows * this.cell) / 2 + 10);
    // floor
    ctx.fillStyle = '#3a5a3a';
    ctx.fillRect(0, 0, this.cols * this.cell, this.rows * this.cell);
    ctx.fillStyle = 'rgba(0,0,0,.15)';
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if ((r + c) % 2 === 0) ctx.fillRect(c * this.cell, r * this.cell, this.cell, this.cell);
    // walls
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.blocked[r][c]) {
          ctx.fillStyle = '#5a6a8a';
          ctx.fillRect(c * this.cell, r * this.cell, this.cell, this.cell);
          ctx.fillStyle = '#7a8aaa';
          ctx.fillRect(c * this.cell + 3, r * this.cell + 3, this.cell - 6, this.cell - 6);
        }
      }
    }
    // door markers
    const midR = Math.floor(this.rows / 2), midC = Math.floor(this.cols / 2);
    if (this.doors.right) { ctx.fillStyle = '#ffd76b'; ctx.fillRect((this.cols - 1) * this.cell, midR * this.cell, this.cell, this.cell); }
    if (this.doors.left) { ctx.fillStyle = '#ffd76b'; ctx.fillRect(0, midR * this.cell, this.cell, this.cell); }
    // triforce
    if (this.triforce) {
      const pulse = 1 + Math.sin(this.t * 4) * 0.1;
      ctx.fillStyle = '#ffd76b';
      ctx.shadowColor = '#ffd76b'; ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(this.triforce.x, this.triforce.y - 20 * pulse);
      ctx.lineTo(this.triforce.x - 22, this.triforce.y + 16);
      ctx.lineTo(this.triforce.x + 22, this.triforce.y + 16);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // pickups
    for (const pk of this.pickups) {
      if (pk.got) continue;
      ctx.font = '22px serif'; ctx.textAlign = 'center';
      ctx.fillText('❤️', pk.x + 15, pk.y + 22);
      ctx.textAlign = 'left';
    }
    // enemies (octorok)
    for (const e of this.enemies) {
      const wob = Math.sin(e.animT * 8) * 2;
      ctx.fillStyle = '#c85a3a';
      rr(ctx, e.x, e.y + wob, 30, 30, 8); ctx.fill();
      ctx.fillStyle = '#e87a5a';
      ctx.fillRect(e.x + 4, e.y + 4 + wob, 8, 8); ctx.fillRect(e.x + 18, e.y + 4 + wob, 8, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(e.x + 6, e.y + 6 + wob, 4, 4); ctx.fillRect(e.x + 20, e.y + 6 + wob, 4, 4);
    }
    // projectiles
    ctx.fillStyle = '#e8d44a';
    for (const pr of this.projectiles) {
      ctx.beginPath(); ctx.arc(pr.x, pr.y, 6, 0, 7); ctx.fill();
    }
    // player (link-like)
    const p = this.player;
    if (!(p.inv > 0 && Math.floor(this.t * 12) % 2 === 0)) {
      drawDude(ctx, p.x, p.y, 30, 34, '#3a8a4a', { face: p.dir === 3 ? -1 : 1 });
      // hat
      ctx.fillStyle = '#2a6a3a';
      ctx.fillRect(p.x + 5, p.y - 6, 20, 6);
      // sword
      if (p.swing > 0) {
        ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 4;
        ctx.beginPath();
        const cxp = p.x + 15, cyp = p.y + 15;
        const angles = { 0: -Math.PI / 2, 1: 0, 2: Math.PI / 2, 3: Math.PI };
        const a = angles[p.dir];
        ctx.moveTo(cxp, cyp);
        ctx.lineTo(cxp + Math.cos(a) * 48, cyp + Math.sin(a) * 48);
        ctx.stroke();
      }
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.7)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `-LIFE-`, 16, 12, { size: 8, color: '#e8d44a' });
    for (let i = 0; i < p.maxHp; i++) {
      ctx.fillStyle = i < p.hp ? '#ff5a5a' : 'rgba(255,255,255,.15)';
      ctx.font = '14px serif';
      ctx.fillText('❤', 16 + i * 18, 30);
    }
    txt(ctx, `DUNGEON ${this.area}/${this.maxArea}`, this.W / 2, 16, { size: 10, color: '#e8d44a', align: 'center' });
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, this.W - 16, 16, { size: 10, color: '#e8d44a', align: 'right' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 70, { size: 11, color: '#fff', align: 'center', glow: 10 });
  }
}

/* ---------- 25. KIRBY ---------- */
class KirbyGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 190, fly: true, walkerStyle: 'goomba', flyerStyle: 'bat',
      enemyDensity: 0.4, flyerDensity: 0.3, coinScore: 150,
      theme: {
        sky: ['#ffb8d8', '#ffe0ec'], hill: '#8ad85a', hill2: '#6ab84a',
        ground: '#c88a5a', groundTop: '#8ad85a', plat: '#e8a8c8', accent: '#ff8ac8'
      }
    });
  }
}

/* ---------- 26. FELIX THE CAT ---------- */
class FelixGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 180, walkerStyle: 'goomba', flyerStyle: 'bat', springs: true,
      doubleJump: true, enemyDensity: 0.4, flyerDensity: 0.25,
      theme: {
        sky: ['#ffd76b', '#ffeec8'], hill: '#e88a5a', hill2: '#d86a4a',
        ground: '#8a5a32', groundTop: '#e8a84a', plat: '#c8783a', accent: '#ffd76b'
      }
    });
  }
}

/* ---------- 27. BUGS BUNNY ---------- */
class BugsBunnyGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 185, walkerStyle: 'goomba', flyerStyle: 'bat', doubleJump: true,
      enemyDensity: 0.42, flyerDensity: 0.25,
      theme: {
        sky: ['#48a0e8', '#c8ecff'], hill: '#c8a04a', hill2: '#a8803a',
        ground: '#8a6a3a', groundTop: '#5ac850', plat: '#b8924a', accent: '#ffb84a'
      }
    });
  }
}

/* ---------- 28. CHIP 'N DALE ---------- */
class ChipDaleGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 175, walkerStyle: 'goomba', flyerStyle: 'bat', coOp: true,
      doubleJump: true, enemyDensity: 0.4, flyerDensity: 0.22,
      theme: {
        sky: ['#48b8e8', '#c8f0ff'], hill: '#3a8a5a', hill2: '#2a6a4a',
        ground: '#7a5a3a', groundTop: '#8ad85a', plat: '#a8825a', accent: '#e8b84a'
      }
    });
  }
}

/* ---------- 29. TINY TOON ---------- */
class TinyToonGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 180, walkerStyle: 'goomba', flyerStyle: 'bat', springs: true,
      enemyDensity: 0.45, flyerDensity: 0.28,
      theme: {
        sky: ['#b88ae8', '#ecd8ff'], hill: '#e88ab8', hill2: '#d86a9a',
        ground: '#8a5a6a', groundTop: '#8ae85a', plat: '#c87a9a', accent: '#ffd76b'
      }
    });
  }
}

/* ---------- 30. CONTRA ---------- */
class ContraGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 220, coOp: true, shoot: { rate: 0.22, color: '#ffe27a', speed: 640 },
      walkerStyle: 'soldier', flyerStyle: 'bat', guardStyle: 'guard',
      enemySpeed: 85, enemyDensity: 0.55, flyerDensity: 0.3,
      theme: {
        sky: ['#0a2a3a', '#1a5a4a'], hill: '#0a3a2a', hill2: '#062a1e',
        ground: '#4a5a3a', groundTop: '#5a8a4a', plat: '#5a6a4a', accent: '#ffe27a'
      }
    });
  }
}

window.ExcitebikeGame = ExcitebikeGame;
window.SonicGame = SonicGame;
window.AdventureIslandGame = AdventureIslandGame;
window.ZeldaGame = ZeldaGame;
window.KirbyGame = KirbyGame;
window.FelixGame = FelixGame;
window.BugsBunnyGame = BugsBunnyGame;
window.ChipDaleGame = ChipDaleGame;
window.TinyToonGame = TinyToonGame;
window.ContraGame = ContraGame;
