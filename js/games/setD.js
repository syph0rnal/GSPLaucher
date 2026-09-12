/* ============================================================
   setD.js — Games 31-40
   Gun.Smoke, Choplifter, Pac-Man, Castlevania, Shadow Warriors,
   Prince of Persia, Jurassic Park, DuckTales, F-1 Race, TMNT2
   ============================================================ */

/* ---------- 31. GUN.SMOKE ---------- */
class GunSmokeGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 200, shoot: { rate: 0.3, color: '#ffe27a', speed: 560 },
      walkerStyle: 'soldier', flyerStyle: 'bat', guardStyle: 'guard',
      enemySpeed: 80, enemyDensity: 0.55, flyerDensity: 0.2,
      theme: {
        sky: ['#e8a05a', '#f8d8a8'], hill: '#b8824a', hill2: '#9a6a3a',
        ground: '#a8824a', groundTop: '#c8a05a', plat: '#8a6a3a', accent: '#ffd76b'
      }
    });
  }
}

/* ---------- 32. CHOPLIFTER ---------- */
class ChoplifterGame extends Game {
  init() {
    this.worldW = 3200;
    this.chopper = { x: 200, y: 200, vx: 0, vy: 0, facing: 1, tilt: 0, dead: 0 };
    this.hostages = [];
    for (let i = 0; i < 8; i++) this.hostages.push({ x: 2900 + rnd(-80, 80), y: 452, rescued: false, carried: false, inChopper: false });
    this.jets = [];
    this.tanks = [];
    this.bullets = [];
    this.parts = [];
    this.lives = 3;
    this.delivered = 0;
    this.spawnT = 4;
    this.pad = { x: 120, w: 160 };
  }

  update(dt) {
    this.t += dt;
    const c = this.chopper;
    const inp = this.in.p1;
    if (c.dead > 0) {
      c.dead -= dt;
      c.vy += 900 * dt; c.y += c.vy * dt;
      if (c.dead <= 0) {
        if (this.lives < 0) { this.lose1P(); return; }
        c.x = this.pad.x + 60; c.y = 200; c.vx = 0; c.vy = 0;
        this.hostages.forEach(h => { if (h.carried) { h.carried = false; h.x = c.x; h.y = 452; } });
      }
      return;
    }
    // controls
    const acc = 420;
    if (inp.left) { c.vx -= acc * dt; c.facing = -1; }
    if (inp.right) { c.vx += acc * dt; c.facing = 1; }
    if (inp.up) c.vy -= acc * dt;
    if (inp.down) c.vy += acc * dt;
    c.vx *= (1 - 1.4 * dt); c.vy *= (1 - 1.4 * dt);
    c.vx = clamp(c.vx, -280, 280); c.vy = clamp(c.vy, -240, 240);
    c.x += c.vx * dt; c.y += c.vy * dt;
    c.tilt = lerp(c.tilt, clamp(c.vx / 280, -1, 1) * 0.3, 6 * dt);
    c.x = clamp(c.x, 20, this.worldW - 40);
    if (c.y < 60) { c.y = 60; c.vy = Math.max(0, c.vy); }
    if (c.y > 452) {
      c.y = 452; c.vy = 0;
      if (Math.abs(c.vx) > 120) { this.killChopper(); return; }
      // drop off hostages at pad
      if (c.x < this.pad.x + this.pad.w && this.hostages.some(h => h.inChopper)) {
        const n = this.hostages.filter(h => h.inChopper).length;
        this.delivered += n;
        this.addScore(n * 250);
        this.audio.powerup();
        this.hostages.forEach(h => { if (h.inChopper) { h.inChopper = false; h.delivered = true; } });
        if (this.delivered >= 6) { this.win1P('ALL HOSTAGES RESCUED!'); return; }
      }
    }
    // pick up hostages
    for (const h of this.hostages) {
      if (!h.rescued && !h.carried && !h.inChopper && !h.delivered) {
        if (Math.abs(h.x - c.x) < 50 && c.y > 380) {
          h.carried = true; h.rescued = true;
          this.audio.coin();
        }
      }
      if (h.carried) { h.x = c.x; h.y = c.y + 26; }
    }
    // shoot
    if (inp.actionPressed) {
      this.bullets.push({ x: c.x + c.facing * 30, y: c.y, vx: c.facing * 620, vy: 0, from: 'gun' });
      this.audio.shoot();
    }
    if (inp.secondaryPressed) {
      this.bullets.push({ x: c.x, y: c.y + 20, vx: c.vx * 0.5, vy: 380, from: 'bomb', g: 500 });
      this.audio.blip(200);
    }
    // enemies spawn
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rnd(3, 6);
      if (chance(0.5)) {
        const fromRight = chance(0.5);
        this.jets.push({
          x: fromRight ? this.worldW + 40 : -40,
          y: rnd(100, 260), vx: (fromRight ? -1 : 1) * rnd(180, 260), cd: rnd(1, 2)
        });
      } else {
        this.tanks.push({ x: rnd(1200, 2800), cd: rnd(1, 2), dir: chance(0.5) ? 1 : -1 });
      }
    }
    // jets
    for (const j of this.jets) {
      j.x += j.vx * dt;
      j.cd -= dt;
      if (j.cd <= 0) {
        j.cd = rnd(1.2, 2.4);
        const ang = Math.atan2(c.y - j.y, c.x - j.x);
        this.bullets.push({ x: j.x, y: j.y, vx: Math.cos(ang) * 300, vy: Math.sin(ang) * 300, from: 'enemy' });
      }
      if (dist2(j.x, j.y, c.x, c.y) < 36 * 36) this.killChopper();
    }
    this.jets = this.jets.filter(j => j.x > -80 && j.x < this.worldW + 80);
    // tanks
    for (const tk of this.tanks) {
      tk.cd -= dt;
      tk.x += tk.dir * 40 * dt;
      if (tk.cd <= 0) {
        tk.cd = rnd(1.8, 3.2);
        const ang = Math.atan2(c.y - 440, c.x - tk.x);
        this.bullets.push({ x: tk.x, y: 440, vx: Math.cos(ang) * 280, vy: Math.sin(ang) * 280, from: 'enemy' });
      }
    }
    // bullets
    for (const b of this.bullets) {
      if (b.g) b.vy += b.g * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > 452 || b.y < 0 || b.x < 0 || b.x > this.worldW) b.dead = true;
      if (b.from === 'gun' || b.from === 'bomb') {
        for (const j of this.jets) {
          if (Math.abs(j.x - b.x) < 30 && Math.abs(j.y - b.y) < 20) {
            j.dead = true; b.dead = true;
            this.addScore(300); this.audio.explode();
            this.boom(j.x, j.y);
          }
        }
        for (const tk of this.tanks) {
          if (Math.abs(tk.x - b.x) < 30 && b.y > 420) {
            tk.dead = true; b.dead = true;
            this.addScore(200); this.audio.explode();
            this.boom(tk.x, 440);
          }
        }
      } else if (Math.abs(b.x - c.x) < 28 && Math.abs(b.y - c.y) < 20) {
        b.dead = true;
        this.killChopper();
      }
    }
    this.bullets = this.bullets.filter(b => !b.dead);
    this.jets = this.jets.filter(j => !j.dead);
    this.tanks = this.tanks.filter(tk => !tk.dead);
    for (const p of this.parts) { p.ttl -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter(p => p.ttl > 0);
  }

  killChopper() {
    this.chopper.dead = 1.5;
    this.chopper.vy = -100;
    this.lives--;
    this.audio.explode();
    this.boom(this.chopper.x, this.chopper.y);
  }

  boom(x, y) {
    for (let i = 0; i < 16; i++) this.parts.push({
      x, y, vx: rnd(-200, 200), vy: rnd(-200, 200), ttl: rnd(0.3, 0.7),
      color: pick(['#ffd76b', '#ff8a3a', '#fff'])
    });
  }

  render(ctx) {
    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#2a6ae8'); grad.addColorStop(0.7, '#8fc4fc'); grad.addColorStop(1, '#e8d8b0');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(-clamp(this.chopper.x - this.W / 2, 0, this.worldW - this.W), 0);
    // ground
    ctx.fillStyle = '#7a9a4a'; ctx.fillRect(0, 452, this.worldW, this.H - 452);
    ctx.fillStyle = '#6a8a3a'; ctx.fillRect(0, 452, this.worldW, 8);
    // city
    for (let i = 0; i < 12; i++) {
      const bx = 300 + i * 220;
      ctx.fillStyle = '#8a8a9a';
      ctx.fillRect(bx, 360 + (i % 3) * 20, 90, 92);
      ctx.fillStyle = 'rgba(255,255,220,.4)';
      for (let wy = 0; wy < 4; wy++) for (let wx = 0; wx < 3; wx++)
        if ((i + wy + wx) % 3 === 0) ctx.fillRect(bx + 10 + wx * 26, 372 + wy * 20, 12, 10);
    }
    // pad
    ctx.fillStyle = '#555';
    ctx.fillRect(this.pad.x, 452, this.pad.w, 20);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('H', this.pad.x + 62, 472);
    // hostages
    for (const h of this.hostages) {
      if (h.delivered || h.inChopper) continue;
      if (h.carried) continue;
      drawDude(ctx, h.x - 10, h.y - 34, 20, 34, '#e8d44a', { face: 1, walk: false });
    }
    // jets
    for (const j of this.jets) {
      ctx.save();
      ctx.translate(j.x, j.y);
      if (j.vx > 0) ctx.scale(-1, 1);
      ctx.fillStyle = '#8a9ab0';
      ctx.beginPath();
      ctx.moveTo(-30, 0); ctx.lineTo(20, -6); ctx.lineTo(30, 0); ctx.lineTo(20, 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6a7a90';
      ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-18, -16); ctx.lineTo(-2, -2); ctx.fill();
      ctx.restore();
    }
    // tanks
    for (const tk of this.tanks) {
      ctx.fillStyle = '#4a6a3a';
      rr(ctx, tk.x - 24, 428, 48, 22, 6); ctx.fill();
      ctx.fillStyle = '#5a7a4a';
      ctx.fillRect(tk.x - 12, 414, 24, 14);
      ctx.fillStyle = '#333';
      ctx.fillRect(tk.x + (tk.dir > 0 ? 10 : -34), 418, 24, 5);
    }
    // chopper
    const c = this.chopper;
    if (c.dead <= 0 || c.dead > 0) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.tilt + (c.dead > 0 ? this.t * 4 : 0));
      // body
      ctx.fillStyle = '#3a8a4a';
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 13, 0, 0, 7); ctx.fill();
      // tail
      ctx.fillStyle = '#2a6a3a';
      ctx.fillRect(-52, -4, 30, 7);
      ctx.fillRect(-58, -12, 8, 14);
      // cockpit
      ctx.fillStyle = '#b8e0f8';
      ctx.beginPath(); ctx.ellipse(16, -3, 12, 8, 0, 0, 7); ctx.fill();
      // skids
      ctx.strokeStyle = '#224'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-18, 16); ctx.lineTo(20, 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, 12); ctx.lineTo(-14, 16); ctx.moveTo(14, 12); ctx.lineTo(16, 16); ctx.stroke();
      // rotor
      ctx.strokeStyle = 'rgba(40,50,60,.9)'; ctx.lineWidth = 4;
      const rw = Math.sin(this.t * 30) * 46;
      ctx.beginPath(); ctx.moveTo(-rw, -16); ctx.lineTo(rw, -16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -22); ctx.stroke();
      ctx.restore();
    }
    // bullets
    for (const b of this.bullets) {
      ctx.fillStyle = b.from === 'enemy' ? '#ff8a8a' : '#ffe27a';
      ctx.fillRect(b.x - 3, b.y - 2, 8, 4);
    }
    // particles
    for (const p of this.parts) {
      ctx.globalAlpha = clamp(p.ttl * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `RESCUED ${this.delivered}/6`, 16, 16, { size: 10, color: '#ffd76b' });
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, this.W / 2, 16, { size: 10, color: '#fff', align: 'center' });
    txt(ctx, '❤'.repeat(Math.max(0, this.lives)), this.W - 16, 18, { size: 13, color: '#ff6b7a', align: 'right', px: false });
  }
}

/* ---------- 33. PAC-MAN ---------- */
class PacManGame extends Game {
  init() {
    // 0 empty, 1 wall, 2 pellet, 3 power pellet, 4 ghost house door
    this.map = [
      '############################',
      '#............##............#',
      '#.####.#####.##.#####.####.#',
      '#o####.#####.##.#####.####o#',
      '#.####.#####.##.#####.####.#',
      '#..........................#',
      '#.####.##.########.##.####.#',
      '#.####.##.########.##.####.#',
      '#......##....##....##......#',
      '######.#####.##.#####.######',
      '######.#####.##.#####.######',
      '######.##..........##.######',
      '######.##.###--###.##.######',
      '######.##.#      #.##.######',
      '..........#      #..........',
      '######.##.#      #.##.######',
      '######.##.########.##.######',
      '######.##..........##.######',
      '######.##.########.##.######',
      '#............##............#',
      '#.####.#####.##.#####.####.#',
      '#.####.#####.##.#####.####.#',
      '#o..##.......  .......##..o#',
      '###.##.##.########.##.##.###',
      '#......##....##....##......#',
      '#.##########.##.##########.#',
      '#..........................#',
      '############################'
    ].map(row => row.split('').map(ch => ch === '#' ? 1 : ch === 'o' ? 3 : ch === '.' ? 2 : ch === '-' ? 4 : 0));

    this.rows = this.map.length;
    this.cols = this.map[0].length;
    this.cell = Math.min(30, Math.floor((this.W - 40) / this.cols));
    this.bx = (this.W - this.cols * this.cell) / 2;
    this.by = (this.H - this.rows * this.cell) / 2 + 16;
    this.resetActors();
    this.pelletsLeft = this.map.flat().filter(v => v === 2 || v === 3).length;
    this.lives = 3;
    this.frightT = 0;
    this.msg = 'READY!'; this.msgT = 1.6;
  }

  resetActors() {
    this.pac = { c: 13.5, r: 22, dir: 1, want: 1, mouth: 0, dead: 0 };
    this.ghosts = [
      { c: 13.5, r: 14, dir: 0, color: '#ff5a5a', name: 'blinky', release: 0 },
      { c: 11.5, r: 14, dir: 2, color: '#ffb8de', name: 'pinky', release: 2 },
      { c: 15.5, r: 14, dir: 2, color: '#5ae0e0', name: 'inky', release: 5 },
      { c: 13.5, r: 14, dir: 0, color: '#ffb85a', name: 'clyde', release: 8 }
    ];
    this.ghosts.forEach(g => { g.state = 'house'; g.houseT = g.release; });
  }

  isWall(c, r) {
    r = Math.round(r);
    if (!(r >= 0 && r < this.rows)) return true;
    c = Math.round(c);
    c = ((c % this.cols) + this.cols) % this.cols;
    const row = this.map[r];
    return !row || row[c] === 1;
  }
  isDoor(c, r) {
    r = Math.round(r);
    if (!(r >= 0 && r < this.rows)) return false;
    c = Math.round(c);
    c = ((c % this.cols) + this.cols) % this.cols;
    const row = this.map[r];
    return !!row && row[c] === 4;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    const p = this.pac;
    if (p.dead > 0) {
      p.dead -= dt;
      if (p.dead <= 0) {
        this.lives--;
        if (this.lives < 0) { this.lose1P(); return; }
        this.resetActors();
        this.frightT = 0;
      }
      return;
    }
    const inp = this.in.p1;
    if (inp.upPressed) p.want = 0;
    if (inp.rightPressed) p.want = 1;
    if (inp.downPressed) p.want = 2;
    if (inp.leftPressed) p.want = 3;

    const speed = 5.2;
    const move = (actor, dir, sp) => {
      const dc = [0, 1, 0, -1][dir], dr = [-1, 0, 1, 0][dir];
      actor.c += dc * sp * dt;
      actor.r += dr * sp * dt;
    };

    // pac movement: try want dir at cell centers
    const pacMove = () => {
      const cc = Math.round(p.c * 2) / 2, cr = Math.round(p.r * 2) / 2;
      const nearCenter = Math.abs(p.c - cc) < 0.08 && Math.abs(p.r - cr) < 0.08;
      if (nearCenter) {
        p.c = cc; p.r = cr;
        const dc = [0, 1, 0, -1][p.want], dr = [-1, 0, 1, 0][p.want];
        if (!this.isWall(cc + dc * 0.55, cr + dr * 0.55)) p.dir = p.want;
      }
      const dc = [0, 1, 0, -1][p.dir], dr = [-1, 0, 1, 0][p.dir];
      const nc = p.c + dc * speed * dt, nr = p.r + dr * speed * dt;
      if (!this.isWall(Math.round(nc * 2) / 2 + dc * 0.45, Math.round(nr * 2) / 2 + dr * 0.45)) {
        p.c = ((nc % this.cols) + this.cols) % this.cols;
        p.r = nr;
      } else {
        p.c = Math.round(p.c * 2) / 2; p.r = Math.round(p.r * 2) / 2;
      }
    };
    pacMove();
    p.mouth += dt * 10;

    // eat pellets
    const cc = Math.round(p.c), cr = Math.round(p.r);
    if (cr >= 0 && cr < this.rows && cc >= 0 && cc < this.cols) {
      const v = this.map[cr][cc];
      if (v === 2) {
        this.map[cr][cc] = 0; this.pelletsLeft--;
        this.addScore(10); this.audio.blip(700);
      } else if (v === 3) {
        this.map[cr][cc] = 0; this.pelletsLeft--;
        this.addScore(50);
        this.frightT = 7;
        this.audio.powerup();
      }
    }
    if (this.pelletsLeft <= 0) { this.win1P('MAZE CLEARED!'); return; }

    this.frightT = Math.max(0, this.frightT - dt);

    // ghosts
    for (const g of this.ghosts) {
      if (g.state === 'house') {
        g.houseT -= dt;
        g.c += Math.sin(this.t * 3) * 0.3 * dt;
        if (g.houseT <= 0) { g.state = 'chase'; g.c = 13.5; g.r = 11; g.dir = chance(0.5) ? 1 : 3; }
        continue;
      }
      const gc = Math.round(g.c * 2) / 2, gr = Math.round(g.r * 2) / 2;
      if (Math.abs(g.c - gc) < 0.1 && Math.abs(g.r - gr) < 0.1) {
        g.c = gc; g.r = gr;
        // choose direction
        const options = [];
        for (let d = 0; d < 4; d++) {
          if (d === (g.dir + 2) % 4) continue;
          const dc = [0, 1, 0, -1][d], dr = [-1, 0, 1, 0][d];
          if (!this.isWall(gc + dc * 0.55, gr + dr * 0.55) && !this.isDoor(gc + dc * 0.55, gr + dr * 0.55)) options.push(d);
        }
        if (options.length) {
          if (this.frightT > 0) g.dir = pick(options);
          else {
            // chase pac
            const target = g.name === 'blinky' ? [p.c, p.r] :
              g.name === 'pinky' ? [p.c + [0, 2, 0, -2][p.dir], p.r + [-2, 0, 2, 0][p.dir]] :
                g.name === 'inky' ? [p.c - 2, p.r] : [p.c, p.r];
            let best = options[0], bd = 1e9;
            for (const d of options) {
              const nc = gc + [0, 1, 0, -1][d], nr = gr + [-1, 0, 1, 0][d];
              const dd = dist2(nc, nr, target[0], target[1]);
              if (dd < bd) { bd = dd; best = d; }
            }
            g.dir = best;
          }
        } else g.dir = (g.dir + 2) % 4;
      }
      const sp = this.frightT > 0 ? 3.2 : 4.6;
      const dc = [0, 1, 0, -1][g.dir], dr = [-1, 0, 1, 0][g.dir];
      const nc = g.c + dc * sp * dt, nr = g.r + dr * sp * dt;
      if (!this.isWall(Math.round(nc * 2) / 2 + dc * 0.45, Math.round(nr * 2) / 2 + dr * 0.45)) {
        g.c = ((nc % this.cols) + this.cols) % this.cols;
        g.r = nr;
      }
      // collision with pac
      if (dist2(g.c, g.r, p.c, p.r) < 0.7 * 0.7) {
        if (this.frightT > 0) {
          g.state = 'house'; g.houseT = 4; g.c = 13.5; g.r = 14;
          this.addScore(200);
          this.audio.explode();
        } else {
          p.dead = 1.4;
          this.audio.lose();
          return;
        }
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#020208'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(this.bx, this.by);
    // walls
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.map[r][c];
        const x = c * this.cell, y = r * this.cell;
        if (v === 1) {
          ctx.fillStyle = '#2233cc';
          ctx.fillRect(x + 1, y + 1, this.cell - 2, this.cell - 2);
          ctx.fillStyle = '#020208';
          ctx.fillRect(x + 4, y + 4, this.cell - 8, this.cell - 8);
        } else if (v === 4) {
          ctx.fillStyle = '#ffb8de';
          ctx.fillRect(x, y + this.cell / 2 - 2, this.cell, 4);
        } else if (v === 2) {
          ctx.fillStyle = '#ffd76b';
          ctx.beginPath(); ctx.arc(x + this.cell / 2, y + this.cell / 2, 2.5, 0, 7); ctx.fill();
        } else if (v === 3) {
          const pl = 1 + Math.sin(this.t * 6) * 0.3;
          ctx.fillStyle = '#ffd76b';
          ctx.beginPath(); ctx.arc(x + this.cell / 2, y + this.cell / 2, 6 * pl, 0, 7); ctx.fill();
        }
      }
    }
    // pac
    const p = this.pac;
    const px = p.c * this.cell + this.cell / 2, py = p.r * this.cell + this.cell / 2;
    if (p.dead > 0) {
      // death animation
      const frac = 1 - p.dead / 1.4;
      ctx.fillStyle = '#ffd76b';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 13, frac * Math.PI, (2 - frac) * Math.PI);
      ctx.closePath(); ctx.fill();
    } else {
      const open = (Math.sin(p.mouth) * 0.25 + 0.15) * Math.PI;
      const ang = [(-1.5), 0, 0.5, 1][p.dir] * Math.PI / 2;
      ctx.fillStyle = '#ffd76b';
      ctx.shadowColor = '#ffd76b'; ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(px, py, 13, ang + open, ang - open + Math.PI * 2);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // ghosts
    for (const g of this.ghosts) {
      const gx = g.c * this.cell + this.cell / 2, gy = g.r * this.cell + this.cell / 2;
      const fright = this.frightT > 0;
      const flash = fright && this.frightT < 2 && Math.floor(this.t * 6) % 2 === 0;
      ctx.fillStyle = fright ? (flash ? '#fff' : '#2233dd') : g.color;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, 11, Math.PI, 0);
      const wob = Math.sin(this.t * 10) * 2;
      ctx.lineTo(gx + 11, gy + 9 + wob * 0.3);
      for (let i = 0; i < 3; i++) {
        ctx.lineTo(gx + 11 - (i * 2 + 1) * 3.7, gy + 9 + (i % 2 === 0 ? -wob : wob * 0.3));
      }
      ctx.lineTo(gx - 11, gy - 2);
      ctx.closePath(); ctx.fill();
      // eyes
      if (!fright) {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(gx - 4, gy - 3, 3.4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 4, gy - 3, 3.4, 0, 7); ctx.fill();
        ctx.fillStyle = '#2233cc';
        const dx = [0, 2, 0, -2][g.dir], dy = [-2, 0, 2, 0][g.dir];
        ctx.beginPath(); ctx.arc(gx - 4 + dx, gy - 3 + dy, 1.8, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(gx + 4 + dx, gy - 3 + dy, 1.8, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = flash ? '#ff5a5a' : '#fff';
        ctx.fillRect(gx - 5, gy - 5, 3, 3); ctx.fillRect(gx + 2, gy - 5, 3, 3);
        ctx.fillRect(gx - 5, gy + 1, 10, 2);
      }
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 40);
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, 16, 14, { size: 10, color: '#ffd76b' });
    txt(ctx, `PELLETS ${this.pelletsLeft}`, this.W / 2, 14, { size: 10, color: '#fff', align: 'center' });
    txt(ctx, '●'.repeat(Math.max(0, this.lives)), this.W - 16, 15, { size: 12, color: '#ffd76b', align: 'right' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, this.H - 30, { size: 12, color: '#ffd76b', align: 'center', glow: 10 });
  }
}

/* ---------- 34. CASTLEVANIA ---------- */
class CastlevaniaGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 190, walkerStyle: 'ninja', flyerStyle: 'bat', guardStyle: 'guard',
      melee: { range: 56, rate: 0.38, color: '#e8e8f0' },
      enemySpeed: 75, enemyDensity: 0.5, flyerDensity: 0.35,
      theme: {
        sky: ['#1a1030', '#2a1a40'], hill: '#241a3a', hill2: '#180f28',
        ground: '#3a3a4a', groundTop: '#5a5a6a', plat: '#4a4458', accent: '#e8d44a'
      }
    });
  }
}

/* ---------- 35. SHADOW WARRIORS ---------- */
class ShadowWarriorsGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 195, walkerStyle: 'ninja', flyerStyle: 'bat',
      doubleJump: true, melee: { range: 52, rate: 0.3, color: '#e8d44a' },
      enemySpeed: 100, enemyDensity: 0.6, flyerDensity: 0.3,
      theme: {
        sky: ['#2a1a2e', '#4a2a3a'], hill: '#2a1a2e', hill2: '#1a1020',
        ground: '#3a2a3a', groundTop: '#6a4a5a', plat: '#4a3a4a', accent: '#ff5a8a'
      }
    });
  }
}

/* ---------- 36. PRINCE OF PERSIA ---------- */
class PrinceOfPersiaGame extends Game {
  init() {
    this.rooms = 4;
    this.room = 1;
    this.cell = 44;
    this.cols = 20; this.rows = 10;
    this.makeRoom();
    this.player = { x: 2 * this.cell, y: 8 * this.cell, vx: 0, vy: 0, onGround: false, face: 1, hp: 5, inv: 0, cd: 0, atkT: 0 };
    this.timeLeft = 300;
    this.guards = [];
    this.potions = [];
    this.spikes = [];
    this.exitDoor = { x: (this.cols - 3) * this.cell, y: 9 * this.cell };
    this.msg = 'ESCAPE THE DUNGEON!'; this.msgT = 2;
  }

  makeRoom() {
    const rng = makeRNG('pop_room_' + this.room);
    this.platforms = [];
    // floor is implicit at row 9
    for (let i = 0; i < 5; i++) {
      const px = (2 + Math.floor(rng() * (this.cols - 8))) * this.cell;
      const py = (3 + Math.floor(rng() * 4)) * this.cell;
      this.platforms.push({ x: px, y: py, w: (2 + Math.floor(rng() * 3)) * this.cell });
    }
    this.spikes = [];
    for (let i = 0; i < 3; i++) {
      this.spikes.push({ x: (3 + Math.floor(rng() * (this.cols - 6))) * this.cell, y: 9 * this.cell });
    }
    this.potions = [];
    for (const p of this.platforms) {
      if (rng() < 0.6) this.potions.push({ x: p.x + p.w / 2, y: p.y - 20 });
    }
    this.guards = [];
    if (this.room > 1) {
      this.guards.push({
        x: (this.cols - 5) * this.cell, y: 9 * this.cell, w: 26, h: 40,
        hp: 2 + this.room, face: -1, cd: 1, atkT: 0, animT: 0
      });
    }
  }

  groundAt(x) {
    // find highest platform below
    let g = 9 * this.cell;
    for (const p of this.platforms) {
      if (x > p.x - 10 && x < p.x + p.w + 10 && p.y >= this.player.y + 20) {
        g = Math.min(g, p.y);
      }
    }
    return g;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) { this.lose1P(); return; }
    const p = this.player;
    const inp = this.in.p1;
    p.inv = Math.max(0, p.inv - dt);
    p.cd = Math.max(0, p.cd - dt);
    p.atkT = Math.max(0, p.atkT - dt);
    const sp = 200;
    let dir = 0;
    if (inp.left) { dir = -1; p.face = -1; }
    if (inp.right) { dir = 1; p.face = 1; }
    // walk: only when on ground (classic pop feel) but allow air control slight
    p.vx = lerp(p.vx, dir * sp, p.onGround ? 12 * dt : 3 * dt);
    // climb / step up small ledges: simplified — auto step if platform close above ground
    if (inp.actionPressed && p.onGround) {
      p.vy = -560;
      p.onGround = false;
      this.audio.jump();
    }
    if (inp.secondaryPressed && p.cd <= 0) {
      p.cd = 0.5; p.atkT = 0.2;
      this.audio.shoot();
      const hx = p.face > 0 ? p.x + 20 : p.x - 48;
      for (const g of this.guards) {
        if (aabb({ x: hx, y: p.y, w: 48, h: 40 }, g)) {
          g.hp--;
          this.audio.hit();
          if (g.hp <= 0) { this.addScore(300); this.audio.explode(); }
        }
      }
    }
    // physics
    p.vy += 1500 * dt;
    p.x = clamp(p.x + p.vx * dt, 10, this.cols * this.cell - 40);
    const oldY = p.y;
    p.y += p.vy * dt;
    const g = this.groundAt(p.x + 14);
    if (p.y >= g) {
      if (p.vy > 700) { p.hp--; this.audio.hurt(); p.inv = 1; if (p.hp <= 0) { this.lose1P(); return; } }
      p.y = g; p.vy = 0; p.onGround = true;
    } else p.onGround = false;
    // spikes
    for (const s of this.spikes) {
      if (p.inv <= 0 && Math.abs(p.x + 14 - (s.x + 22)) < 24 && p.y > s.y - 20 && p.y < s.y + 10) {
        p.hp -= 2; p.inv = 1.5; this.audio.hurt();
        if (p.hp <= 0) { this.lose1P(); return; }
      }
    }
    // potions
    for (const po of this.potions) {
      if (!po.got && Math.abs(po.x - (p.x + 14)) < 24 && Math.abs(po.y - p.y) < 30) {
        po.got = true;
        p.hp = Math.min(5, p.hp + 1);
        this.addScore(100);
        this.audio.powerup();
      }
    }
    // guards
    for (const gd of this.guards) {
      if (gd.hp <= 0) continue;
      gd.animT += dt;
      gd.cd -= dt;
      const dx = p.x - gd.x;
      gd.face = dx > 0 ? 1 : -1;
      if (Math.abs(dx) > 50) {
        gd.x += gd.face * 90 * dt;
      } else if (gd.cd <= 0) {
        gd.cd = rnd(0.9, 1.5); gd.atkT = 0.25;
        if (p.inv <= 0) {
          p.hp--; p.inv = 1.2; this.audio.hurt();
          if (p.hp <= 0) { this.lose1P(); return; }
        }
      }
    }
    this.guards = this.guards.filter(gd => gd.hp > 0);
    // exit
    if (Math.abs(p.x - this.exitDoor.x) < 30 && Math.abs(p.y - this.exitDoor.y) < 40) {
      if (this.room >= this.rooms) { this.win1P('ESCAPED THE DUNGEON!'); return; }
      this.room++;
      this.makeRoom();
      p.x = this.cell; p.y = 8 * this.cell;
      this.msg = `LEVEL ${this.room} / ${this.rooms}`; this.msgT = 1.4;
      this.audio.powerup();
    }
  }

  render(ctx) {
    ctx.fillStyle = '#0c0a12'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate((this.W - this.cols * this.cell) / 2, (this.H - this.rows * this.cell) / 2 + 8);
    // bg wall
    ctx.fillStyle = '#2a2438';
    ctx.fillRect(0, 0, this.cols * this.cell, this.rows * this.cell);
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if ((r + c) % 2 === 0) ctx.fillRect(c * this.cell, r * this.cell, this.cell, this.cell);
    // arches decoration
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    for (let i = 0; i < 5; i++) {
      const ax = (i * 4 + 1) * this.cell;
      ctx.beginPath(); ctx.arc(ax + 22, 3 * this.cell, 26, Math.PI, 0); ctx.fill();
      ctx.fillRect(ax - 4, 3 * this.cell, 52, 2 * this.cell);
    }
    // platforms
    for (const p of this.platforms) {
      ctx.fillStyle = '#4a4058';
      ctx.fillRect(p.x, p.y, p.w, 14);
      ctx.fillStyle = '#6a5a7a';
      ctx.fillRect(p.x, p.y, p.w, 5);
    }
    // floor
    ctx.fillStyle = '#4a4058';
    ctx.fillRect(0, 9 * this.cell, this.cols * this.cell, this.cell);
    ctx.fillStyle = '#6a5a7a';
    ctx.fillRect(0, 9 * this.cell, this.cols * this.cell, 5);
    // spikes
    for (const s of this.spikes) {
      ctx.fillStyle = '#c8c8d8';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(s.x + i * 11, 9 * this.cell);
        ctx.lineTo(s.x + i * 11 + 5, 9 * this.cell - 14);
        ctx.lineTo(s.x + i * 11 + 11, 9 * this.cell);
        ctx.fill();
      }
    }
    // exit door
    ctx.fillStyle = '#1a1420';
    ctx.fillRect(this.exitDoor.x - 10, this.exitDoor.y - 60, 44, 60);
    ctx.strokeStyle = '#ffd76b'; ctx.lineWidth = 2;
    ctx.strokeRect(this.exitDoor.x - 10, this.exitDoor.y - 60, 44, 60);
    // potions
    for (const po of this.potions) {
      if (po.got) continue;
      ctx.fillStyle = '#e83a8a';
      ctx.beginPath(); ctx.arc(po.x, po.y, 7, 0, 7); ctx.fill();
      ctx.fillStyle = '#c8c8d8';
      ctx.fillRect(po.x - 2, po.y - 12, 4, 6);
    }
    // guards
    for (const gd of this.guards) {
      drawDude(ctx, gd.x, gd.y - 40, 26, 40, '#8a2a3a', { face: gd.face, walk: true, animT: gd.animT });
      ctx.fillStyle = '#c8c8d8';
      ctx.fillRect(gd.x + (gd.face > 0 ? 22 : -6), gd.y - 30, 4, 22);
    }
    // player (white prince)
    const p = this.player;
    if (!(p.inv > 0 && Math.floor(this.t * 12) % 2 === 0)) {
      drawDude(ctx, p.x, p.y - 40, 28, 40, '#e8e8f0', { face: p.face, walk: Math.abs(p.vx) > 20, animT: this.t });
      if (p.atkT > 0) {
        ctx.strokeStyle = '#e8e8f0'; ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x + 14, p.y - 20);
        ctx.lineTo(p.x + 14 + p.face * 44, p.y - 28);
        ctx.stroke();
      }
    }
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.7)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `HP ${'❤'.repeat(Math.max(0, p.hp))}`, 16, 16, { size: 12, color: '#ff6b7a', px: false });
    const tl = Math.max(0, Math.ceil(this.timeLeft));
    txt(ctx, `${Math.floor(tl / 60)}:${String(tl % 60).padStart(2, '0')}`, this.W / 2, 16, { size: 13, color: tl < 60 ? '#ff6b7a' : '#fff', align: 'center' });
    txt(ctx, `LEVEL ${this.room}/${this.rooms}`, this.W - 16, 16, { size: 10, color: '#c8b88a', align: 'right' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 70, { size: 11, color: '#fff', align: 'center', glow: 10 });
  }
}

/* ---------- 37. JURASSIC PARK ---------- */
class JurassicGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 200, walkerStyle: 'raptor', flyerStyle: 'bat', chase: true,
      doubleJump: true, enemySpeed: 110, enemyDensity: 0.55, flyerDensity: 0.25,
      theme: {
        sky: ['#1a4a2a', '#3a7a4a'], hill: '#0f3a1e', hill2: '#0a2a16',
        ground: '#3a5a2a', groundTop: '#5a8a3a', plat: '#4a6a3a', accent: '#7dffb0'
      }
    });
  }
}

/* ---------- 38. DUCKTALES ---------- */
class DuckTalesGame extends PlatGame {
  constructor(host) {
    super(host, {
      len: 185, pogo: true, walkerStyle: 'goomba', flyerStyle: 'bat',
      enemyDensity: 0.45, flyerDensity: 0.25, coinScore: 200,
      theme: {
        sky: ['#48a0e8', '#b8e0f8'], hill: '#c8a04a', hill2: '#a8803a',
        ground: '#8a6a3a', groundTop: '#e8c850', plat: '#b8924a', accent: '#ffd76b'
      }
    });
  }
}

/* ---------- 39. F-1 RACE ---------- */
class F1RaceGame extends Game {
  init() {
    this.roadW = 380;
    this.roadX = (this.W - this.roadW) / 2;
    this.player = { x: this.W / 2, y: this.H - 90, speed: 320, w: 40, h: 64, lap: 1 };
    this.rivals = [];
    this.curves = [];
    let d = 0;
    const rng = makeRNG('f1_track');
    while (d < 4) {
      this.curves.push({ from: d, to: d + 0.5 + rng(), dir: chance(0.5) ? 1 : -1, strength: rnd(0.3, 1) });
      d += 0.9 + rng();
    }
    for (let i = 0; i < 6; i++) {
      this.rivals.push({
        z: (i + 1) * 0.12, lane: rnd(-0.8, 0.8), speed: rnd(280, 380),
        col: pick(['#e8d44a', '#4ad8e8', '#e85a5a', '#8a5ae8', '#4ae85a', '#e88a3a']), w: 38, h: 58
      });
    }
    this.progress = 0;
    this.laps = 3;
    this.lapLen = 1;
    this.roadOffset = 0;
    this.stripes = 0;
    this.msg = `LAP 1 / ${this.laps}`; this.msgT = 1.6;
  }

  curveAt(z) {
    for (const c of this.curves) {
      if (z >= c.from && z < c.to) return c.dir * c.strength;
    }
    return 0;
  }

  update(dt) {
    this.t += dt;
    const inp = this.in.p1;
    const p = this.player;
    // speed
    if (inp.up) p.speed = Math.min(520, p.speed + 280 * dt);
    else p.speed = Math.max(260, p.speed - 140 * dt);
    if (inp.down) p.speed = Math.max(160, p.speed - 400 * dt);
    // steering
    const curve = this.curveAt(this.progress % this.lapLen);
    const steer = 320 * dt;
    if (inp.left) p.x -= steer;
    if (inp.right) p.x += steer;
    // curve pushes player outward
    p.x -= curve * p.speed * dt * 0.55;
    p.x = clamp(p.x, this.roadX + 24, this.roadX + this.roadW - 24);

    // progress
    const dz = p.speed * dt / 3000;
    this.progress += dz;
    const lapNow = Math.floor(this.progress / this.lapLen) + 1;
    if (lapNow > p.lap) {
      p.lap = lapNow;
      if (lapNow > this.laps) { this.win1P('RACE COMPLETE!'); return; }
      this.msg = `LAP ${lapNow} / ${this.laps}`; this.msgT = 1.4;
      this.audio.powerup();
    }
    this.stripes = (this.stripes + p.speed * dt) % 60;
    this.roadOffset += curve * p.speed * dt * 0.12;

    // rivals
    for (const r of this.rivals) {
      r.z += (r.speed - 240) * dt / 3000;
      if (r.z > this.progress + 0.08) r.z = this.progress - 0.06 - rnd(0.02);
      if (r.z < this.progress - 0.1) r.z = this.progress + 0.05 + rnd(0.02);
      r.lane += rnd(-0.3, 0.3) * dt;
      r.lane = clamp(r.lane, -0.85, 0.85);
      // screen position
      const rel = r.z - this.progress;
      r.sy = this.H / 2 + 40 - rel * 2600;
      r.sx = this.W / 2 + r.lane * (this.roadW / 2) * (0.4 + clamp(1 - Math.abs(rel) * 2, 0.1, 1));
      r.scale = clamp(1 - Math.abs(rel) * 1.6, 0.25, 1);
      // collision
      if (Math.abs(rel) < 0.012 && Math.abs(r.lane * (this.roadW / 2) - (p.x - this.W / 2)) < 36) {
        p.speed = 180;
        this.audio.crash ? this.audio.crash() : this.audio.hit();
      }
    }
  }

  render(ctx) {
    // sky
    const grad = ctx.createLinearGradient(0, 0, 0, this.H * 0.5);
    grad.addColorStop(0, '#3a7ae8'); grad.addColorStop(1, '#a8d0f0');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H * 0.5);
    // ground
    ctx.fillStyle = '#3a8a3a'; ctx.fillRect(0, this.H * 0.5, this.W, this.H * 0.5);
    // road (trapezoid)
    const horizon = this.H * 0.5;
    const curve = this.curveAt(this.progress % this.lapLen);
    const shift = (this.roadOffset % 200) * 2;
    ctx.fillStyle = '#484c56';
    ctx.beginPath();
    ctx.moveTo(this.roadX + curve * 60 + shift, horizon);
    ctx.lineTo(this.roadX + this.roadW + curve * 60 + shift, horizon);
    ctx.lineTo(this.roadX + this.roadW + curve * -40, this.H);
    ctx.lineTo(this.roadX + curve * -40, this.H);
    ctx.closePath(); ctx.fill();
    // kerbs
    ctx.fillStyle = '#e85a5a';
    for (let i = 0; i < 8; i++) {
      const t0 = i / 8, t1 = (i + 0.5) / 8;
      if (i % 2) continue;
      const y0 = horizon + t0 * t0 * (this.H - horizon);
      const y1 = horizon + t1 * t1 * (this.H - horizon);
      const w0 = 6 + t0 * 10, w1 = 6 + t1 * 10;
      const cx0 = this.roadX + curve * 60 * (1 - t0) + shift * (1 - t0);
      const cx1 = this.roadX + curve * 60 * (1 - t1) + shift * (1 - t1);
      ctx.fillRect(cx0 - w0, y0, w0, y1 - y0 + 2);
      ctx.fillRect(cx0 + this.roadW * (1 - t0 * 0.25), y0, w0, y1 - y0 + 2);
    }
    // center stripes
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 6; i++) {
      const tt = ((i / 6) + (this.stripes / 60) / 6) % 1;
      const y = horizon + tt * tt * (this.H - horizon);
      const w = 3 + tt * 8;
      const cx = this.W / 2 + curve * 60 * (1 - tt) + shift * (1 - tt);
      ctx.fillRect(cx - w / 2, y, w, 4 + tt * 26);
    }
    // rivals
    for (const r of this.rivals) {
      if (r.sy < horizon - 20 || r.sy > this.H + 40) continue;
      this.drawF1(ctx, r.sx, r.sy, r.col, r.scale, r.w * r.scale, r.h * r.scale);
    }
    // player
    this.drawF1(ctx, this.player.x, this.player.y, '#f04a4a', 1, this.player.w, this.player.h, true);
    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `${Math.round(this.player.speed / 3)} km/h`, 16, 16, { size: 10, color: '#ffd76b' });
    txt(ctx, this.msgT > 0 ? this.msg : `LAP ${this.player.lap} / ${this.laps}`, this.W / 2, 16, { size: 11, color: '#fff', align: 'center' });
    const prog = (this.progress % this.lapLen) / this.lapLen;
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(this.W - 216, 12, 200, 8);
    ctx.fillStyle = '#7dffb0'; ctx.fillRect(this.W - 216, 12, 200 * prog, 8);
  }

  drawF1(ctx, x, y, col, scale, w, h, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(0, h * 0.45, w * 0.6, 6, 0, 0, 7); ctx.fill();
    // rear wing
    ctx.fillStyle = '#222';
    ctx.fillRect(-w / 2 - 4, -h / 2, w + 8, 7);
    // body
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h / 2 + 8);
    ctx.lineTo(w * 0.3, -h / 2 + 8);
    ctx.lineTo(w * 0.18, h / 2);
    ctx.lineTo(-w * 0.18, h / 2);
    ctx.closePath(); ctx.fill();
    // front wing
    ctx.fillStyle = '#222';
    ctx.fillRect(-w * 0.42, h / 2 - 6, w * 0.84, 5);
    // wheels
    ctx.fillStyle = '#111';
    ctx.fillRect(-w / 2, -h * 0.1, 10, h * 0.4);
    ctx.fillRect(w / 2 - 10, -h * 0.1, 10, h * 0.4);
    ctx.fillRect(-w * 0.36, h * 0.22, 9, h * 0.24);
    ctx.fillRect(w * 0.36 - 9, h * 0.22, 9, h * 0.24);
    // helmet
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(0, -h * 0.14, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a7ae8';
    ctx.fillRect(-5, -h * 0.16, 8, 4);
    if (isPlayer && this.player.speed > 440) {
      ctx.fillStyle = 'rgba(255,200,80,.5)';
      ctx.fillRect(-w * 0.2, -h / 2 - 10, w * 0.4, 8);
    }
    ctx.restore();
  }
}

/* ---------- 40. TMNT TOURNAMENT (versus fighter) ---------- */
class TMNT2Game extends FighterGame {
  constructor(host) {
    super(host, {
      p1: { name: 'LEONARDO', color: '#4ad84a', pants: '#2a7a2a', special: 'katana', specialColor: '#8aff8a' },
      p2: { name: 'DONATELLO', color: '#b06ae8', pants: '#6a3aa8', special: 'bo', specialColor: '#c8a0ff' },
      sky: ['#1a2a4a', '#0a1020'], floor: '#3a4a5a', crowd: '#0e1626',
      roundTime: 60, roundsToWin: 2
    });
  }
}

window.GunSmokeGame = GunSmokeGame;
window.ChoplifterGame = ChoplifterGame;
window.PacManGame = PacManGame;
window.CastlevaniaGame = CastlevaniaGame;
window.ShadowWarriorsGame = ShadowWarriorsGame;
window.PrinceOfPersiaGame = PrinceOfPersiaGame;
window.JurassicGame = JurassicGame;
window.DuckTalesGame = DuckTalesGame;
window.F1RaceGame = F1RaceGame;
window.TMNT2Game = TMNT2Game;
