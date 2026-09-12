/* ============================================================
   setB.js — Games 11-20
   Road Fighter, 1942, Galaga, Space Invaders, Tetris, Snake,
   Pong, Arkanoid, Bomberman, Nintendo World Cup
   ============================================================ */

/* ---------- 11. ROAD FIGHTER ---------- */
class RoadFighterGame extends Game {
  init() {
    this.roadW = 420; this.roadX = (this.W - 420) / 2;
    this.player = { x: this.W / 2, y: this.H - 100, speed: 300, w: 44, h: 76 };
    this.cars = [];
    this.distance = 0;
    this.goal = 22000;
    this.lives = 3;
    this.crashT = 0;
    this.roadMark = 0;
    this.spawnT = 0.5;
  }

  update(dt) {
    this.t += dt;
    const inp = this.in.p1;
    if (this.crashT > 0) {
      this.crashT -= dt;
      if (this.crashT <= 0) {
        if (this.lives < 0) { this.lose1P(); return; }
        this.player.x = this.W / 2; this.player.speed = 300;
      }
      return;
    }
    // accel / brake
    if (inp.up) this.player.speed = Math.min(680, this.player.speed + 260 * dt);
    else this.player.speed = Math.max(240, this.player.speed - 120 * dt);
    if (inp.down) this.player.speed = Math.max(140, this.player.speed - 420 * dt);
    // steer
    const steer = 280 * dt * (0.5 + this.player.speed / 680);
    if (inp.left) this.player.x -= steer;
    if (inp.right) this.player.x += steer;
    this.player.x = clamp(this.player.x, this.roadX + 26, this.roadX + this.roadW - 26);

    this.distance += this.player.speed * dt;
    this.roadMark = (this.roadMark + this.player.speed * dt) % 80;

    // spawn traffic
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = rnd(0.5, 1.3) * (300 / this.player.speed) + 0.25;
      const lane = rndInt(0, 3);
      const lx = this.roadX + 60 + lane * ((this.roadW - 120) / 3);
      this.cars.push({
        x: lx, y: -100, w: 40, h: 70,
        v: rnd(120, 220) + this.player.speed * 0.15,
        col: pick(['#e85a5a', '#4a8ae8', '#e8d44a', '#8a5ae8', '#4ad8b0']),
        sway: rnd(2), ph: rnd(6)
      });
    }
    for (const c of this.cars) {
      c.y += (this.player.speed - c.v) * dt;
      if (c.sway) c.x += Math.sin(this.t * 2 + c.ph) * 26 * dt;
      c.x = clamp(c.x, this.roadX + 24, this.roadX + this.roadW - 24);
      // collision
      if (Math.abs(c.x - this.player.x) < 38 && Math.abs(c.y - this.player.y) < 68) {
        this.crash();
        return;
      }
    }
    this.cars = this.cars.filter(c => c.y < this.H + 120 && c.y > -300);

    if (this.distance >= this.goal) this.win1P('FINISH!');
  }

  crash() {
    this.lives--;
    this.crashT = 1.2;
    this.player.speed = 0;
    this.audio.explode();
    this.addScore(-200);
  }

  render(ctx) {
    // grass
    ctx.fillStyle = '#1a5a2a'; ctx.fillRect(0, 0, this.W, this.H);
    // road
    ctx.fillStyle = '#33363e'; ctx.fillRect(this.roadX, 0, this.roadW, this.H);
    ctx.fillStyle = '#e8e8f0'; ctx.fillRect(this.roadX + 4, 0, 6, this.H); ctx.fillRect(this.roadX + this.roadW - 10, 0, 6, this.H);
    // lane dashes
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    for (let i = 0; i < 3; i++) {
      const lx = this.roadX + 60 + i * ((this.roadW - 120) / 3) + 18;
      for (let y = -80 + this.roadMark; y < this.H; y += 80) ctx.fillRect(lx, y, 6, 40);
    }
    // cars
    for (const c of this.cars) this.drawCar(ctx, c.x, c.y, c.col, c.w, c.h);
    // player
    if (this.crashT > 0) {
      ctx.font = '60px serif'; ctx.textAlign = 'center';
      ctx.fillText('💥', this.player.x, this.player.y);
      ctx.textAlign = 'left';
    } else {
      this.drawCar(ctx, this.player.x, this.player.y, '#f04a4a', 44, 76, true);
    }
    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `SPEED ${Math.round(this.player.speed / 3)} km/h`, 16, 16, { size: 10, color: '#ffd76b' });
    const prog = clamp(this.distance / this.goal, 0, 1);
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(this.W / 2 - 100, 12, 200, 8);
    ctx.fillStyle = '#7dffb0'; ctx.fillRect(this.W / 2 - 100, 12, 200 * prog, 8);
    txt(ctx, '🏁', this.W / 2 - 100 + 200 * prog, 34, { size: 12, color: '#fff', align: 'center', px: false });
    txt(ctx, '❤'.repeat(Math.max(0, this.lives)), this.W - 16, 18, { size: 14, color: '#ff6b7a', align: 'right', px: false });
  }

  drawCar(ctx, x, y, col, w, h, isPlayer) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(0, h * 0.42, w * 0.55, 8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col;
    rr(ctx, -w / 2, -h / 2, w, h, 9); ctx.fill();
    ctx.fillStyle = 'rgba(20,30,50,.9)';
    ctx.fillRect(-w / 2 + 5, -h / 2 + 12, w - 10, 16);
    ctx.fillRect(-w / 2 + 5, h / 2 - 26, w - 10, 14);
    ctx.fillStyle = '#222';
    ctx.fillRect(-w / 2 - 3, -h / 2 + 12, 5, 14); ctx.fillRect(w / 2 - 2, -h / 2 + 12, 5, 14);
    ctx.fillRect(-w / 2 - 3, h / 2 - 26, 5, 14); ctx.fillRect(w / 2 - 2, h / 2 - 26, 5, 14);
    if (isPlayer) {
      ctx.fillStyle = '#ffe9a0';
      ctx.fillRect(-w / 2 + 6, -h / 2 - 4, 8, 5); ctx.fillRect(w / 2 - 14, -h / 2 - 4, 8, 5);
      if (this.player.speed > 500) {
        ctx.fillStyle = 'rgba(255,150,60,.6)';
        ctx.fillRect(-6, h / 2 + 2, 4, rnd(10, 22));
        ctx.fillRect(2, h / 2 + 2, 4, rnd(10, 22));
      }
    }
    ctx.restore();
  }
}

/* ---------- 12. 1942 ---------- */
class Game1942 extends VertShooter {
  constructor(host) {
    super(host, {
      waves: 6, formation: 'sine', enemyColor: '#7ac87a', bulletColor: '#ffd76b',
      playerColor: '#4a9ae8', enemyHp: 1, scorePer: 120, dive: false
    });
  }
}

/* ---------- 13. GALAGA ---------- */
class GalagaGame extends VertShooter {
  constructor(host) {
    super(host, {
      waves: 5, formation: 'grid', enemyColor: '#8ab0ff', bulletColor: '#ff8ab0',
      playerColor: '#e8e8f0', enemyHp: 1, dive: true, scorePer: 150
    });
  }
}

/* ---------- 14. SPACE INVADERS ---------- */
class InvadersGame extends Game {
  init() {
    this.cell = 40;
    this.invaders = [];
    const rows = 5, cols = 10;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.invaders.push({
          c, r, x: 120 + c * 62, y: 100 + r * 48, w: 36, h: 28,
          alive: true, type: r
        });
      }
    }
    this.dir = 1; this.speed = 26; this.dropNext = false;
    this.player = { x: this.W / 2 - 24, y: this.H - 70, w: 48, h: 24, cd: 0, lives: 3 };
    this.pBullets = []; this.eBullets = [];
    this.fireT = 1;
    this.barriers = [];
    for (let i = 0; i < 4; i++) {
      const bx = 140 + i * 200;
      for (let yy = 0; yy < 3; yy++) for (let xx = 0; xx < 6; xx++) {
        if ((xx === 2 || xx === 3) && yy === 2) continue;
        this.barriers.push({ x: bx + xx * 12, y: 430 + yy * 12, alive: true });
      }
    }
    this.moveT = 0;
    this.ufo = null; this.ufoT = rnd(8, 16);
  }

  update(dt) {
    this.t += dt;
    const inp = this.in.p1;
    const alive = this.invaders.filter(i => i.alive);
    if (alive.length === 0) { this.win1P('EARTH DEFENDED!'); return; }

    // player
    this.player.cd = Math.max(0, this.player.cd - dt);
    if (inp.left) this.player.x -= 340 * dt;
    if (inp.right) this.player.x += 340 * dt;
    this.player.x = clamp(this.player.x, 20, this.W - 68);
    if (inp.actionPressed && this.player.cd <= 0) {
      this.player.cd = 0.5;
      this.pBullets.push({ x: this.player.x + 22, y: this.player.y - 8 });
      this.audio.shoot();
    }

    // invader movement (classic step)
    this.moveT += dt;
    const stepTime = clamp(0.02 + alive.length * 0.008, 0.04, 0.7);
    if (this.moveT >= stepTime) {
      this.moveT = 0;
      let minX = 1e9, maxX = -1e9, maxY = -1e9;
      for (const iv of alive) { minX = Math.min(minX, iv.x); maxX = Math.max(maxX, iv.x + iv.w); maxY = Math.max(maxY, iv.y + iv.h); }
      if (this.dropNext) {
        for (const iv of alive) iv.y += 18;
        this.dropNext = false;
        this.speed += 4;
      } else {
        let dx = this.dir * this.speed;
        if (maxX + dx > this.W - 30 || minX + dx < 30) { this.dropNext = true; this.dir *= -1; }
        else for (const iv of alive) iv.x += dx;
      }
      this.audio.blip(200 + (Math.floor(this.t * 2) % 2) * 60);
      if (maxY > this.player.y - 10) { this.lose1P(); return; }
    }

    // invader fire
    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fireT = rnd(0.5, 1.4) * clamp(alive.length / 20, 0.3, 1);
      const shooter = pick(alive);
      this.eBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h });
    }
    // ufo
    this.ufoT -= dt;
    if (this.ufoT <= 0 && !this.ufo) {
      this.ufo = { x: -60, dir: 1 };
      this.ufoT = rnd(10, 18);
    }
    if (this.ufo) {
      this.ufo.x += 130 * dt;
      if (this.ufo.x > this.W + 60) this.ufo = null;
    }

    // bullets
    for (const b of this.pBullets) {
      b.y -= 560 * dt;
      if (b.y < 40) b.dead = true;
      for (const iv of this.invaders) {
        if (!iv.alive) continue;
        if (b.x > iv.x && b.x < iv.x + iv.w && b.y > iv.y && b.y < iv.y + iv.h) {
          iv.alive = false; b.dead = true;
          this.addScore([30, 40, 50, 60, 80][iv.type] || 50);
          this.audio.hit();
          break;
        }
      }
      if (this.ufo && !b.dead && b.x > this.ufo.x && b.x < this.ufo.x + 50 && b.y < 80 && b.y > 50) {
        this.ufo = null; b.dead = true;
        this.addScore(300); this.audio.powerup();
      }
      for (const bar of this.barriers) {
        if (bar.alive && !b.dead && Math.abs(bar.x + 6 - b.x) < 10 && Math.abs(bar.y + 6 - b.y) < 10) {
          bar.alive = false; b.dead = true; this.audio.blip(150);
        }
      }
    }
    this.pBullets = this.pBullets.filter(b => !b.dead);
    for (const b of this.eBullets) {
      b.y += 300 * dt;
      if (b.y > this.H) b.dead = true;
      if (b.x > this.player.x && b.x < this.player.x + this.player.w && b.y > this.player.y && b.y < this.player.y + this.player.h) {
        b.dead = true;
        this.player.lives--;
        this.audio.explode();
        if (this.player.lives < 0) { this.lose1P(); return; }
      }
      for (const bar of this.barriers) {
        if (bar.alive && !b.dead && Math.abs(bar.x + 6 - b.x) < 10 && Math.abs(bar.y + 6 - b.y) < 10) {
          bar.alive = false; b.dead = true;
        }
      }
    }
    this.eBullets = this.eBullets.filter(b => !b.dead);
  }

  render(ctx) {
    ctx.fillStyle = '#020208'; ctx.fillRect(0, 0, this.W, this.H);
    // stars
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.1 + (i % 4) * 0.08})`;
      ctx.fillRect((i * 137) % this.W, (i * 89) % this.H, 2, 2);
    }
    // ufo
    if (this.ufo) {
      ctx.fillStyle = '#e85a5a';
      rr(ctx, this.ufo.x, 52, 50, 18, 9); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(this.ufo.x + 16, 46, 18, 8);
    }
    // invaders
    const cols = ['#8aff8a', '#8ac8ff', '#e8d44a', '#ff8ab0', '#c8a0ff'];
    for (const iv of this.invaders) {
      if (!iv.alive) continue;
      ctx.fillStyle = cols[iv.type];
      const x = iv.x, y = iv.y, wob = Math.sin(this.t * 6) > 0 ? 0 : 3;
      // pixel invader
      ctx.fillRect(x + 8, y + wob, 20, 8);
      ctx.fillRect(x + 2, y + 8 + wob, 32, 8);
      ctx.fillRect(x, y + 16, 10, 8); ctx.fillRect(x + 26, y + 16, 10, 8);
      ctx.fillRect(x + 12, y + 16, 12, 6);
      ctx.fillStyle = '#020208';
      ctx.fillRect(x + 10, y + 10 + wob, 5, 4); ctx.fillRect(x + 21, y + 10 + wob, 5, 4);
    }
    // barriers
    for (const bar of this.barriers) {
      if (!bar.alive) continue;
      ctx.fillStyle = '#3a9a4a';
      ctx.fillRect(bar.x, bar.y, 12, 12);
    }
    // player cannon
    const p = this.player;
    ctx.fillStyle = '#5db8ff';
    ctx.fillRect(p.x + 20, p.y - 10, 8, 12);
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#2a5a8a';
    ctx.fillRect(p.x + 8, p.y + 8, 12, 8); ctx.fillRect(p.x + 28, p.y + 8, 12, 8);
    // bullets
    ctx.fillStyle = '#fff';
    for (const b of this.pBullets) ctx.fillRect(b.x - 2, b.y - 10, 4, 12);
    ctx.fillStyle = '#ff8a8a';
    for (const b of this.eBullets) { ctx.fillRect(b.x - 2, b.y, 4, 10); ctx.fillRect(b.x - 5, b.y + 4, 10, 3); }
    // ground
    ctx.fillStyle = '#3a9a4a'; ctx.fillRect(0, this.H - 34, this.W, 6);

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 40);
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, 16, 14, { size: 10, color: '#8aff8a' });
    txt(ctx, '👾 SPACE INVADERS', this.W / 2, 14, { size: 10, color: '#fff', align: 'center' });
    txt(ctx, '❤'.repeat(Math.max(0, this.player.lives)), this.W - 16, 16, { size: 13, color: '#ff6b7a', align: 'right', px: false });
  }
}

/* ---------- 15. TETRIS ---------- */
class TetrisGame extends Game {
  init() {
    this.cols = 10; this.rows = 20;
    this.cell = 24;
    this.boardW = this.cols * this.cell; this.boardH = this.rows * this.cell;
    this.bx = (this.W - this.boardW) / 2; this.by = (this.H - this.boardH) / 2 + 10;
    this.board = [];
    for (let r = 0; r < this.rows; r++) this.board.push(new Array(this.cols).fill(0));
    this.pieces = [
      { m: [[1, 1, 1, 1]], c: '#4ad8e8' },                 // I
      { m: [[1, 1], [1, 1]], c: '#ffd76b' },               // O
      { m: [[0, 1, 0], [1, 1, 1]], c: '#b06ae8' },         // T
      { m: [[1, 0, 0], [1, 1, 1]], c: '#4a7ae8' },         // J
      { m: [[0, 0, 1], [1, 1, 1]], c: '#e88a3a' },         // L
      { m: [[0, 1, 1], [1, 1, 0]], c: '#5ae05a' },         // S
      { m: [[1, 1, 0], [0, 1, 1]], c: '#e85a5a' }          // Z
    ];
    this.bag = [];
    this.cur = this.newPiece();
    this.next = this.newPiece();
    this.fallT = 0;
    this.fallSpeed = 0.8;
    this.lines = 0;
    this.level = 1;
    this.flashRows = [];
    this.flashT = 0;
  }

  newPiece() {
    if (this.bag.length === 0) {
      this.bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5);
    }
    const idx = this.bag.pop();
    const p = this.pieces[idx];
    return {
      m: p.m.map(r => [...r]), c: p.c,
      x: Math.floor((this.cols - p.m[0].length) / 2), y: 0
    };
  }

  collides(m, px, py) {
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const x = px + c, y = py + r;
        if (x < 0 || x >= this.cols || y >= this.rows) return true;
        if (y >= 0 && this.board[y][x]) return true;
      }
    }
    return false;
  }

  rotate(m) {
    const N = m.length, M = m[0].length;
    const res = [];
    for (let c = 0; c < M; c++) {
      res.push([]);
      for (let r = N - 1; r >= 0; r--) res[c].push(m[r][c]);
    }
    return res;
  }

  update(dt) {
    this.t += dt;
    const inp = this.in.p1;
    // flash animation
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.board = this.board.filter((row, i) => !this.flashRows.includes(i));
        while (this.board.length < this.rows) this.board.unshift(new Array(this.cols).fill(0));
        this.flashRows = [];
      }
      return;
    }

    if (inp.leftPressed) { if (!this.collides(this.cur.m, this.cur.x - 1, this.cur.y)) { this.cur.x--; this.audio.blip(400); } }
    if (inp.rightPressed) { if (!this.collides(this.cur.m, this.cur.x + 1, this.cur.y)) { this.cur.x++; this.audio.blip(400); } }
    if (inp.upPressed) {
      const rm = this.rotate(this.cur.m);
      if (!this.collides(rm, this.cur.x, this.cur.y)) { this.cur.m = rm; this.audio.blip(650); }
      else if (!this.collides(rm, this.cur.x - 1, this.cur.y)) { this.cur.m = rm; this.cur.x--; this.audio.blip(650); }
      else if (!this.collides(rm, this.cur.x + 1, this.cur.y)) { this.cur.m = rm; this.cur.x++; this.audio.blip(650); }
    }
    if (inp.downPressed) this.fallT += 0.12;

    this.fallT += dt;
    const speed = Math.max(0.12, this.fallSpeed - this.level * 0.06);
    if (this.fallT >= speed) {
      this.fallT = 0;
      if (!this.collides(this.cur.m, this.cur.x, this.cur.y + 1)) {
        this.cur.y++;
      } else {
        // lock
        for (let r = 0; r < this.cur.m.length; r++)
          for (let c = 0; c < this.cur.m[r].length; c++)
            if (this.cur.m[r][c]) {
              const y = this.cur.y + r;
              if (y < 0) { this.lose1P(); return; }
              this.board[y][this.cur.x + c] = this.cur.c;
            }
        this.audio.blip(240);
        // clear lines
        const full = [];
        for (let r = 0; r < this.rows; r++) {
          if (this.board[r].every(v => v)) full.push(r);
        }
        if (full.length) {
          this.flashRows = full; this.flashT = 0.25;
          this.lines += full.length;
          this.addScore([0, 100, 300, 500, 800][full.length] * this.level);
          this.level = 1 + Math.floor(this.lines / 8);
          this.audio.coin();
        }
        this.cur = this.next;
        this.next = this.newPiece();
        if (this.collides(this.cur.m, this.cur.x, this.cur.y)) { this.lose1P(); return; }
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, this.W, this.H);
    // board frame
    ctx.fillStyle = 'rgba(20,30,60,.8)';
    ctx.fillRect(this.bx - 6, this.by - 6, this.boardW + 12, this.boardH + 12);
    ctx.strokeStyle = 'rgba(120,190,255,.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(this.bx - 6, this.by - 6, this.boardW + 12, this.boardH + 12);
    // grid
    ctx.strokeStyle = 'rgba(120,160,255,.07)';
    for (let c = 1; c < this.cols; c++) {
      ctx.beginPath(); ctx.moveTo(this.bx + c * this.cell, this.by);
      ctx.lineTo(this.bx + c * this.cell, this.by + this.boardH); ctx.stroke();
    }
    for (let r = 1; r < this.rows; r++) {
      ctx.beginPath(); ctx.moveTo(this.bx, this.by + r * this.cell);
      ctx.lineTo(this.bx + this.boardW, this.by + r * this.cell); ctx.stroke();
    }
    // settled blocks
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c]) this.block(ctx, this.bx + c * this.cell, this.by + r * this.cell, this.board[r][c]);
      }
    }
    // flashing rows
    if (this.flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(this.t * 40) * 0.4})`;
      for (const r of this.flashRows) ctx.fillRect(this.bx, this.by + r * this.cell, this.boardW, this.cell);
    }
    // ghost
    let gy = this.cur.y;
    while (!this.collides(this.cur.m, this.cur.x, gy + 1)) gy++;
    ctx.globalAlpha = 0.22;
    for (let r = 0; r < this.cur.m.length; r++)
      for (let c = 0; c < this.cur.m[r].length; c++)
        if (this.cur.m[r][c]) this.block(ctx, this.bx + (this.cur.x + c) * this.cell, this.by + (gy + r) * this.cell, this.cur.c);
    ctx.globalAlpha = 1;
    // current piece
    for (let r = 0; r < this.cur.m.length; r++)
      for (let c = 0; c < this.cur.m[r].length; c++)
        if (this.cur.m[r][c]) this.block(ctx, this.bx + (this.cur.x + c) * this.cell, this.by + (this.cur.y + r) * this.cell, this.cur.c);

    // side panel
    const sx = this.bx + this.boardW + 40;
    txt(ctx, 'NEXT', sx, this.by + 30, { size: 12, color: '#9fd4ff' });
    const off = this.next.m[0].length * this.cell / 2;
    for (let r = 0; r < this.next.m.length; r++)
      for (let c = 0; c < this.next.m[r].length; c++)
        if (this.next.m[r][c]) this.block(ctx, sx + 40 - off + c * this.cell, this.by + 60 + r * this.cell, this.next.c);
    txt(ctx, `SCORE`, sx, this.by + 180, { size: 11, color: '#9fd4ff' });
    txt(ctx, padScore(this.scores[0]), sx, this.by + 206, { size: 13, color: '#fff' });
    txt(ctx, `LINES`, sx, this.by + 250, { size: 11, color: '#9fd4ff' });
    txt(ctx, `${this.lines}`, sx, this.by + 276, { size: 13, color: '#fff' });
    txt(ctx, `LEVEL`, sx, this.by + 320, { size: 11, color: '#9fd4ff' });
    txt(ctx, `${this.level}`, sx, this.by + 346, { size: 13, color: '#ffd76b' });
    txt(ctx, '←→ MOVE · ↑ ROTATE · ↓ SOFT DROP', this.W / 2, this.by + this.boardH + 34, { size: 9, color: '#5c7a9c', align: 'center' });
  }

  block(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, this.cell - 2, this.cell - 2);
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.fillRect(x + 1, y + 1, this.cell - 2, 4);
    ctx.fillRect(x + 1, y + 1, 4, this.cell - 2);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(x + 1, y + this.cell - 5, this.cell - 2, 4);
    ctx.fillRect(x + this.cell - 5, y + 1, 4, this.cell - 2);
  }
}

/* ---------- 16. SNAKE ---------- */
class SnakeGame extends Game {
  init() {
    this.cell = 24;
    this.cols = 36; this.rows = 19;
    this.bx = (this.W - this.cols * this.cell) / 2;
    this.by = (this.H - this.rows * this.cell) / 2 + 14;
    this.snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.moveT = 0;
    this.stepTime = 0.13;
    this.growth = 0;
    this.pulse = 0;
  }

  spawnFood() {
    let f;
    do {
      f = { x: rndInt(0, this.cols - 1), y: rndInt(0, this.rows - 1) };
    } while (this.snake.some(s => s.x === f.x && s.y === f.y));
    return f;
  }

  update(dt) {
    this.t += dt;
    this.pulse += dt;
    const inp = this.in.p1;
    if (inp.upPressed && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
    else if (inp.downPressed && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
    else if (inp.leftPressed && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
    else if (inp.rightPressed && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };

    this.moveT += dt;
    if (this.moveT >= this.stepTime) {
      this.moveT = 0;
      // prevent reversing into yourself
      if (!(this.nextDir.x === -this.dir.x && this.nextDir.y === -this.dir.y)) {
        this.dir = this.nextDir;
      }
      const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
      // wall or self collision
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows ||
        this.snake.some(s => s.x === head.x && s.y === head.y)) {
        this.audio.explode();
        this.lose1P();
        return;
      }
      this.snake.unshift(head);
      if (head.x === this.food.x && head.y === this.food.y) {
        this.addScore(10);
        this.food = this.spawnFood();
        this.pulse = 0;
        this.audio.coin();
        this.stepTime = Math.max(0.06, this.stepTime - 0.004);
      } else {
        this.snake.pop();
      }
    }
  }

  render(ctx) {
    ctx.fillStyle = '#04101c'; ctx.fillRect(0, 0, this.W, this.H);
    // board
    ctx.fillStyle = 'rgba(20,60,40,.35)';
    ctx.fillRect(this.bx, this.by, this.cols * this.cell, this.rows * this.cell);
    ctx.strokeStyle = 'rgba(110,220,110,.35)'; ctx.lineWidth = 2;
    ctx.strokeRect(this.bx, this.by, this.cols * this.cell, this.rows * this.cell);
    // checker
    ctx.fillStyle = 'rgba(255,255,255,.02)';
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++)
      if ((r + c) % 2 === 0) ctx.fillRect(this.bx + c * this.cell, this.by + r * this.cell, this.cell, this.cell);

    // food
    const fp = 1 + Math.sin(this.pulse * 6) * 0.15;
    const fx = this.bx + this.food.x * this.cell + this.cell / 2;
    const fy = this.by + this.food.y * this.cell + this.cell / 2;
    ctx.fillStyle = '#ff5a5a';
    ctx.shadowColor = '#ff5a5a'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.arc(fx, fy, 8 * fp, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#3fae4a';
    ctx.fillRect(fx - 1, fy - 13, 3, 5);

    // snake
    for (let i = this.snake.length - 1; i >= 0; i--) {
      const s = this.snake[i];
      const x = this.bx + s.x * this.cell, y = this.by + s.y * this.cell;
      const isHead = i === 0;
      const shade = isHead ? '#8aff8a' : `rgba(90,${200 - i * 2},90,1)`;
      ctx.fillStyle = i % 2 === 0 ? shade : '#4ac04a';
      rr(ctx, x + 2, y + 2, this.cell - 4, this.cell - 4, 6); ctx.fill();
      if (isHead) {
        // eyes
        ctx.fillStyle = '#fff';
        const ex = this.dir.x * 4, ey = this.dir.y * 4;
        ctx.fillRect(x + 8 + ex, y + 7 + ey, 4, 4);
        ctx.fillRect(x + 13 + ex, y + 7 + ey, 4, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 9 + ex, y + 8 + ey, 2, 2);
        ctx.fillRect(x + 14 + ex, y + 8 + ey, 2, 2);
      }
    }

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 40);
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, 16, 14, { size: 10, color: '#8aff8a' });
    txt(ctx, `LENGTH ${this.snake.length}`, this.W / 2, 14, { size: 10, color: '#fff', align: 'center' });
    txt(ctx, '🐍 SNAKE', this.W - 16, 14, { size: 10, color: '#8aff8a', align: 'right' });
  }
}

/* ---------- 17. PONG ---------- */
class PongGame extends Game {
  init() {
    this.target = 7;
    this.p1 = { y: this.H / 2 - 50, h: 100, x: 40 };
    this.p2y = this.H / 2 - 50;
    this.p2h = 100;
    this.ball = this.resetBall(1);
    this.serveT = 1;
    this.rally = 0;
    this.msg = 'FIRST TO 7';
    this.msgT = 1.4;
  }

  resetBall(dir) {
    return { x: this.W / 2, y: this.H / 2, vx: 0, vy: 0, r: 9, spin: 0 };
  }

  serve(dir) {
    this.ball = {
      x: this.W / 2, y: this.H / 2, r: 9,
      vx: dir * rnd(340, 420), vy: rnd(-160, 160)
    };
    this.rally = 0;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    const inp = this.in.p1, inp2 = this.in.p2;
    const PS = 460;

    // paddles
    if (inp.up) this.p1.y -= PS * dt;
    if (inp.down) this.p1.y += PS * dt;
    this.p1.y = clamp(this.p1.y, 60, this.H - 40 - this.p1.h);

    if (this.is2P) {
      if (inp2.up) this.p2y -= PS * dt;
      if (inp2.down) this.p2y += PS * dt;
      this.p2y = clamp(this.p2y, 60, this.H - 40 - this.p2h);
    } else {
      // CPU follows with limited speed
      const target = this.ball.y - this.p2h / 2;
      const cpuSpeed = 300 + Math.min(160, this.scores[1] * 20);
      this.p2y += clamp(target - this.p2y, -cpuSpeed * dt, cpuSpeed * dt);
      this.p2y = clamp(this.p2y, 60, this.H - 40 - this.p2h);
    }

    // serve delay
    if (this.serveT > 0) {
      this.serveT -= dt;
      if (this.serveT <= 0) this.serve(this._serveDir || 1);
      return;
    }

    const b = this.ball;
    b.x += b.vx * dt; b.y += b.vy * dt;
    // walls
    if (b.y < 50 + b.r) { b.y = 50 + b.r; b.vy = Math.abs(b.vy); this.audio.blip(300); }
    if (b.y > this.H - 30 - b.r) { b.y = this.H - 30 - b.r; b.vy = -Math.abs(b.vy); this.audio.blip(300); }

    // paddles
    const PW = 16;
    if (b.vx < 0 && b.x - b.r < this.p1.x + PW && b.x > this.p1.x && b.y > this.p1.y && b.y < this.p1.y + this.p1.h) {
      b.x = this.p1.x + PW + b.r;
      const rel = (b.y - (this.p1.y + this.p1.h / 2)) / (this.p1.h / 2);
      b.vx = Math.abs(b.vx) * 1.06;
      b.vy = rel * 380 + (inp.up ? -60 : 0) + (inp.down ? 60 : 0);
      this.rally++;
      this.audio.blip(520);
      this.addScore(1);
    }
    const p2x = this.W - 56;
    if (b.vx > 0 && b.x + b.r > p2x && b.x < p2x + PW && b.y > this.p2y && b.y < this.p2y + this.p2h) {
      b.x = p2x - b.r;
      const rel = (b.y - (this.p2y + this.p2h / 2)) / (this.p2h / 2);
      b.vx = -Math.abs(b.vx) * 1.06;
      b.vy = rel * 380;
      this.rally++;
      this.audio.blip(520);
      if (this.is2P) this.addScore(1, 1);
    }

    // score
    if (b.x < -30) {
      if (this.is2P) this.addScore(1, 1); else this.addScore(0, 0), this.scores[1]++;
      this._serveDir = -1;
      this.serveT = 1; this.ball = this.resetBall();
      this.audio.lose();
      this.msg = this.is2P ? 'POINT PLAYER 2!' : 'CPU SCORES!';
      this.msgT = 1;
      if (this.is2P && this.scores[1] >= this.target) this.wins(1);
      if (!this.is2P && this.scores[1] >= this.target) this.lose1P();
    } else if (b.x > this.W + 30) {
      this.addScore(1);
      this._serveDir = 1;
      this.serveT = 1; this.ball = this.resetBall();
      this.audio.coin();
      this.msg = this.is2P ? 'POINT PLAYER 1!' : 'YOU SCORE!';
      this.msgT = 1;
      if (this.scores[0] >= this.target) this.wins(0);
    }
  }

  render(ctx) {
    ctx.fillStyle = '#04070e'; ctx.fillRect(0, 0, this.W, this.H);
    // court
    ctx.strokeStyle = 'rgba(140,200,255,.25)'; ctx.lineWidth = 3;
    ctx.strokeRect(20, 50, this.W - 40, this.H - 80);
    // center line
    ctx.setLineDash([12, 14]);
    ctx.beginPath(); ctx.moveTo(this.W / 2, 56); ctx.lineTo(this.W / 2, this.H - 36); ctx.stroke();
    ctx.setLineDash([]);
    // big scores
    txt(ctx, `${this.scores[0]}`, this.W / 2 - 90, 130, { size: 64, color: 'rgba(120,190,255,.35)', align: 'center' });
    txt(ctx, `${this.scores[1]}`, this.W / 2 + 90, 130, { size: 64, color: 'rgba(255,140,150,.35)', align: 'center' });

    // paddles
    ctx.fillStyle = '#5db8ff'; ctx.shadowColor = '#5db8ff'; ctx.shadowBlur = 16;
    rr(ctx, this.p1.x, this.p1.y, 16, this.p1.h, 8); ctx.fill();
    ctx.fillStyle = this.is2P ? '#ff5a6e' : '#e8e8f0';
    ctx.shadowColor = this.is2P ? '#ff5a6e' : '#e8e8f0';
    rr(ctx, this.W - 56, this.p2y, 16, this.p2h, 8); ctx.fill();
    ctx.shadowBlur = 0;
    // ball
    if (this.serveT <= 0) {
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      if (Math.sin(this.t * 10) > 0) txt(ctx, 'READY...', this.W / 2, this.H / 2 - 80, { size: 16, color: '#fff', align: 'center', glow: 14 });
    }
    // labels
    txt(ctx, this.is2P ? 'P1' : 'YOU', 48, this.H - 20, { size: 10, color: '#5db8ff' });
    txt(ctx, this.is2P ? 'P2' : 'CPU', this.W - 48, this.H - 20, { size: 10, color: this.is2P ? '#ff5a6e' : '#e8e8f0', align: 'right' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 210, { size: 15, color: '#ffd76b', align: 'center', glow: 12 });
  }
}

/* ---------- 18. ARKANOID ---------- */
class ArkanoidGame extends Game {
  init() {
    this.cols = 12; this.rows = 6;
    this.brickW = 64; this.brickH = 22;
    this.gridW = this.cols * (this.brickW + 4);
    this.gx = (this.W - this.gridW) / 2; this.gy = 80;
    this.bricks = [];
    const colors = ['#e85a5a', '#e8a03a', '#e8d44a', '#5ae05a', '#4a9ae8', '#b06ae8'];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const skip = (r === 2 && (c === 5 || c === 6));
        if (skip) continue;
        this.bricks.push({
          x: this.gx + c * (this.brickW + 4), y: this.gy + r * (this.brickH + 4),
          hp: r < 1 ? 2 : 1, color: colors[r], pts: (this.rows - r) * 10
        });
      }
    }
    this.paddle = { x: this.W / 2 - 52, y: this.H - 60, w: 104, h: 16 };
    this.ball = { x: this.W / 2, y: this.paddle.y - 12, vx: 0, vy: 0, r: 8, stuck: true };
    this.lives = 3;
    this.level = 1;
  }

  update(dt) {
    this.t += dt;
    const inp = this.in.p1;
    // paddle
    if (inp.left) this.paddle.x -= 520 * dt;
    if (inp.right) this.paddle.x += 520 * dt;
    this.paddle.x = clamp(this.paddle.x, 10, this.W - this.paddle.w - 10);

    const b = this.ball;
    if (b.stuck) {
      b.x = this.paddle.x + this.paddle.w / 2;
      b.y = this.paddle.y - 12;
      if (inp.actionPressed || inp.secondaryPressed) {
        b.stuck = false;
        b.vx = rnd(-140, 140); b.vy = -430;
        this.audio.blip(600);
      }
      return;
    }

    b.x += b.vx * dt; b.y += b.vy * dt;
    // walls
    if (b.x < b.r + 8) { b.x = b.r + 8; b.vx = Math.abs(b.vx); this.audio.blip(300); }
    if (b.x > this.W - b.r - 8) { b.x = this.W - b.r - 8; b.vx = -Math.abs(b.vx); this.audio.blip(300); }
    if (b.y < b.r + 46) { b.y = b.r + 46; b.vy = Math.abs(b.vy); this.audio.blip(300); }

    // paddle
    if (b.vy > 0 && b.y + b.r > this.paddle.y && b.y < this.paddle.y + this.paddle.h &&
      b.x > this.paddle.x - 6 && b.x < this.paddle.x + this.paddle.w + 6) {
      b.y = this.paddle.y - b.r;
      const rel = (b.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      const speed = Math.min(640, Math.hypot(b.vx, b.vy) * 1.03);
      const ang = rel * 1.05 - Math.PI / 2;
      b.vx = Math.cos(ang) * speed;
      b.vy = Math.sin(ang) * speed;
      this.audio.blip(520);
    }

    // bricks
    for (const br of this.bricks) {
      if (br.hp <= 0) continue;
      if (b.x > br.x - b.r && b.x < br.x + this.brickW + b.r && b.y > br.y - b.r && b.y < br.y + this.brickH + b.r) {
        // determine bounce side
        const overlapX = Math.min(b.x - (br.x - b.r), (br.x + this.brickW + b.r) - b.x);
        const overlapY = Math.min(b.y - (br.y - b.r), (br.y + this.brickH + b.r) - b.y);
        if (overlapX < overlapY) b.vx *= -1; else b.vy *= -1;
        br.hp--;
        this.addScore(br.pts);
        this.audio.hit();
        if (br.hp <= 0 && chance(0.12)) this.powerDrop(br);
        break;
      }
    }

    // fall
    if (b.y > this.H + 20) {
      this.lives--;
      this.audio.lose();
      if (this.lives < 0) { this.lose1P(); return; }
      b.stuck = true;
    }
    // win
    if (this.bricks.every(br => br.hp <= 0)) {
      this.level++;
      this.addScore(500);
      this.init();
      this.lives = Math.min(3, this.lives + 1);
      this.msg = `LEVEL ${this.level}`; this.msgT = 1.2;
    }
  }

  powerDrop(br) {
    // simple: widen paddle
    this.paddle.w = Math.min(160, this.paddle.w + 20);
    this.audio.powerup();
  }

  render(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#0a1428'); grad.addColorStop(1, '#04060e');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    // frame
    ctx.strokeStyle = 'rgba(120,190,255,.3)'; ctx.lineWidth = 4;
    ctx.strokeRect(8, 46, this.W - 16, this.H - 54);
    // bricks
    for (const br of this.bricks) {
      if (br.hp <= 0) continue;
      ctx.fillStyle = br.color;
      rr(ctx, br.x, br.y, this.brickW, this.brickH, 4); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(br.x + 3, br.y + 3, this.brickW - 6, 4);
      if (br.hp > 1) {
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
        rr(ctx, br.x + 2, br.y + 2, this.brickW - 4, this.brickH - 4, 4); ctx.stroke();
      }
    }
    // paddle
    const p = this.paddle;
    ctx.fillStyle = '#5db8ff'; ctx.shadowColor = '#5db8ff'; ctx.shadowBlur = 14;
    rr(ctx, p.x, p.y, p.w, p.h, 8); ctx.fill();
    ctx.fillStyle = '#e8f4ff';
    rr(ctx, p.x + p.w / 2 - 14, p.y + 3, 28, p.h - 6, 5); ctx.fill();
    ctx.shadowBlur = 0;
    // ball
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 40);
    txt(ctx, `SCORE ${padScore(this.scores[0])}`, 16, 14, { size: 10, color: '#8ac8ff' });
    txt(ctx, `LEVEL ${this.level}`, this.W / 2, 14, { size: 10, color: '#fff', align: 'center' });
    txt(ctx, '❤'.repeat(Math.max(0, this.lives)), this.W - 16, 16, { size: 13, color: '#ff6b7a', align: 'right', px: false });
    if (this.ball.stuck) txt(ctx, 'SPACE TO LAUNCH', this.W / 2, this.H - 100, { size: 11, color: '#ffd76b', align: 'center', glow: 10 });
  }
}

/* ---------- 19. BOMBERMAN ---------- */
class BombermanGame extends Game {
  init() {
    this.cols = 15; this.rows = 11;
    this.cell = 44;
    this.bx = (this.W - this.cols * this.cell) / 2;
    this.by = (this.H - this.rows * this.cell) / 2 + 12;
    // grid: 0 floor, 1 wall, 2 soft block
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 || c === 0 || r === this.rows - 1 || c === this.cols - 1) row.push(1);
        else if (r % 2 === 0 && c % 2 === 0) row.push(1);
        else row.push(0);
      }
      this.grid.push(row);
    }
    // soft blocks
    const rng = makeRNG('bomber_lvl');
    for (let r = 1; r < this.rows - 1; r++) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.grid[r][c] === 0 && rng() < 0.42) this.grid[r][c] = 2;
      }
    }
    // clear spawn corners
    const clearSpots = [[1, 1], [2, 1], [1, 2], [this.cols - 2, 1], [this.cols - 3, 1], [this.cols - 2, 2]];
    for (const [c, r] of clearSpots) this.grid[r][c] = 0;

    this.p1 = { c: 1, r: 1, px: 1.5, py: 1.5, speed: 4.2, bombs: 1, power: 1, alive: true, color: '#ffffff', dir: 1, animT: 0 };
    this.p2 = this.is2P ? { c: this.cols - 2, r: 1, px: this.cols - 1.5, py: 1.5, speed: 4.2, bombs: 1, power: 1, alive: true, color: '#ff8a8a', dir: 3, animT: 0 } : null;
    this.bombs = [];
    this.explosions = [];
    this.enemies = [];
    const nEnemies = 3 + Math.min(3, Math.floor(this.round || 1));
    for (let i = 0; i < nEnemies; i++) {
      let ec, er;
      do { ec = rndInt(1, this.cols - 2); er = rndInt(1, this.rows - 2); }
      while (this.grid[er][ec] !== 0 || dist2(ec, er, 1, 1) < 30 || (this.p2 && dist2(ec, er, this.p2.c, this.p2.r) < 30));
      this.enemies.push({ c: ec, r: er, dir: rndInt(0, 3), moveT: 0, speed: 2.2, animT: rnd(6) });
    }
    this.exits = { c: this.cols - 2, r: this.rows - 2, revealed: false };
    if (this.grid[this.exits.r][this.exits.c] === 0) this.grid[this.exits.r][this.exits.c] = 2;
    this.msg = 'DEFEAT ALL ENEMIES'; this.msgT = 2;
  }

  passable(c, r) {
    c = Math.floor(c); r = Math.floor(r);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    if (this.grid[r][c] !== 0) return false;
    if (this.bombs.some(b => b.c === c && b.r === r)) return false;
    return true;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    // bombs
    for (const b of this.bombs) {
      b.ttl -= dt;
      if (b.ttl <= 0) this.detonate(b);
    }
    this.bombs = this.bombs.filter(b => b.ttl > 0);
    for (const ex of this.explosions) ex.ttl -= dt;
    this.explosions = this.explosions.filter(e => e.ttl > 0);

    this.movePlayer(this.p1, this.in.p1, dt);
    if (this.p2) this.movePlayer(this.p2, this.in.p2, dt);

    // enemies — grid-locked cell movement
    for (const e of this.enemies) {
      e.animT += dt;
      e.moveT -= dt;
      if (e.moveT <= 0) {
        const dc = [0, 1, 0, -1][e.dir], dr = [-1, 0, 1, 0][e.dir];
        if (this.passable(e.c + dc, e.r + dr)) {
          e.c += dc; e.r += dr;
          e.moveT = 1 / e.speed;
        } else {
          const options = [0, 1, 2, 3].filter(d => {
            const oc = [0, 1, 0, -1][d], or_ = [-1, 0, 1, 0][d];
            return this.passable(e.c + oc, e.r + or_);
          });
          if (options.length) {
            e.dir = options.includes(e.dir) && chance(0.7) ? e.dir : pick(options);
          } else {
            e.dir = rndInt(0, 3);
          }
          e.moveT = 0.15;
        }
      }
      // touch player
      for (const p of [this.p1, this.p2]) {
        if (!p || !p.alive) continue;
        if (Math.abs(p.px - (e.c + 0.5)) < 0.7 && Math.abs(p.py - (e.r + 0.5)) < 0.7) this.killPlayer(p);
      }
    }

    // explosion kills
    for (const ex of this.explosions) {
      for (const p of [this.p1, this.p2]) {
        if (!p || !p.alive) continue;
        if (Math.abs(p.px - 0.5 - ex.c) < 0.6 && Math.abs(p.py - 0.5 - ex.r) < 0.6) this.killPlayer(p);
      }
      this.enemies = this.enemies.filter(e => {
        if (Math.abs(e.c + 0.5 - 0.5 - ex.c) < 0.6 && Math.abs(e.r + 0.5 - 0.5 - ex.r) < 0.6) {
          this.addScore(200, ex.from);
          this.audio.hit();
          return false;
        }
        return true;
      });
    }

    // win / lose
    const p1dead = !this.p1.alive;
    const p2dead = this.p2 && !this.p2.alive;
    if (p1dead && (p2dead || !this.p2)) { this.lose1P(); return; }
    if (this.enemies.length === 0) {
      if (this.exits.revealed) {
        for (const p of [this.p1, this.p2]) {
          if (p && p.alive && p.c === this.exits.c && p.r === this.exits.r) {
            this.addScore(1000, p === this.p2 ? 1 : 0);
            if (this.is2P) { this.wins(p === this.p2 ? 1 : 0); } else this.win1P('STAGE CLEAR!');
            return;
          }
        }
      }
    }
  }

  movePlayer(p, inp, dt) {
    if (!p.alive) return;
    p.animT += dt;
    let dx = 0, dy = 0;
    if (inp.left) { dx = -1; p.dir = 3; }
    else if (inp.right) { dx = 1; p.dir = 1; }
    else if (inp.up) { dy = -1; p.dir = 0; }
    else if (inp.down) { dy = 1; p.dir = 2; }
    if (dx || dy) {
      const nx = p.px + dx * p.speed * dt;
      const ny = p.py + dy * p.speed * dt;
      // free movement with corner sliding
      const cx = Math.floor(nx), cy = Math.floor(ny);
      const canX = this.passable(cx, Math.floor(p.py)) || Math.abs(p.py - (Math.floor(p.py) + 0.5)) < 0.35;
      const canY = this.passable(Math.floor(p.px), cy) || Math.abs(p.px - (Math.floor(p.px) + 0.5)) < 0.35;
      if (dx && (canX || this.nearCenter(p.py))) p.px = clamp(nx, 0.5, this.cols - 0.5);
      else if (dy && (canY || this.nearCenter(p.px))) p.py = clamp(ny, 0.5, this.rows - 0.5);
      // snap toward center of corridor
      if (dx) p.py = lerp(p.py, Math.floor(p.py) + 0.5, 8 * dt);
      if (dy) p.px = lerp(p.px, Math.floor(p.px) + 0.5, 8 * dt);
      p.c = Math.floor(p.px); p.r = Math.floor(p.py);
    }
    if (inp.actionPressed) this.placeBomb(p);
  }

  nearCenter(v) { return Math.abs(v - (Math.floor(v) + 0.5)) < 0.4; }

  placeBomb(p) {
    const c = Math.floor(p.px), r = Math.floor(p.py);
    if (this.bombs.some(b => b.c === c && b.r === r)) return;
    const mine = this.bombs.filter(b => b.from === p).length;
    if (mine >= p.bombs) return;
    this.bombs.push({ c, r, ttl: 2.2, power: p.power, from: p });
    this.audio.blip(220);
  }

  detonate(b) {
    this.audio.explode();
    const cells = [{ c: b.c, r: b.r }];
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const [dc, dr] of dirs) {
      for (let i = 1; i <= b.power; i++) {
        const c = b.c + dc * i, r = b.r + dr * i;
        if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) break;
        if (this.grid[r][c] === 1) break;
        cells.push({ c, r });
        if (this.grid[r][c] === 2) {
          this.grid[r][c] = 0;
          if (c === this.exits.c && r === this.exits.r) this.exits.revealed = true;
          break;
        }
        // chain
        const other = this.bombs.find(ob => ob.c === c && ob.r === r && ob !== b);
        if (other) other.ttl = Math.min(other.ttl, 0.05);
      }
    }
    for (const cell of cells) this.explosions.push({ c: cell.c, r: cell.r, ttl: 0.45, from: b.from === this.p2 ? 1 : 0 });
  }

  killPlayer(p) {
    if (!p.alive) return;
    p.alive = false;
    this.audio.explode();
  }

  render(ctx) {
    ctx.fillStyle = '#1a2a1a'; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    ctx.translate(this.bx, this.by);
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const v = this.grid[r][c];
        const x = c * this.cell, y = r * this.cell;
        ctx.fillStyle = (r + c) % 2 ? '#2a5a2a' : '#245024';
        ctx.fillRect(x, y, this.cell, this.cell);
        if (v === 1) {
          ctx.fillStyle = '#6a6a78'; ctx.fillRect(x, y, this.cell, this.cell);
          ctx.fillStyle = '#8a8a98'; ctx.fillRect(x + 3, y + 3, this.cell - 6, this.cell - 6);
          ctx.fillStyle = '#55555f'; ctx.fillRect(x + 6, y + 6, this.cell - 12, this.cell - 12);
        } else if (v === 2) {
          ctx.fillStyle = '#a06a3a'; ctx.fillRect(x + 2, y + 2, this.cell - 4, this.cell - 4);
          ctx.fillStyle = '#c88a4a';
          ctx.fillRect(x + 5, y + 5, this.cell - 10, 6);
          ctx.fillRect(x + 5, y + 14, this.cell - 10, 6);
          ctx.fillRect(x + 5, y + 23, this.cell - 10, 6);
        }
        // exit door
        if (this.exits.revealed && c === this.exits.c && r === this.exits.r) {
          ctx.fillStyle = '#111'; ctx.fillRect(x + 4, y + 4, this.cell - 8, this.cell - 8);
          ctx.fillStyle = '#ffd76b'; ctx.fillRect(x + 10, y + 10, this.cell - 20, this.cell - 20);
        }
      }
    }
    // bombs
    for (const b of this.bombs) {
      const x = b.c * this.cell + this.cell / 2, y = b.r * this.cell + this.cell / 2;
      const pulse = 1 + Math.sin(this.t * (b.ttl < 0.7 ? 24 : 8)) * 0.12;
      ctx.fillStyle = '#222';
      ctx.beginPath(); ctx.arc(x, y, 15 * pulse, 0, 7); ctx.fill();
      ctx.fillStyle = '#ff5a5a';
      ctx.fillRect(x - 2, y - 22, 4, 8);
      ctx.fillStyle = '#ffd76b';
      ctx.beginPath(); ctx.arc(x + 2, y - 22, 3, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.4)';
      ctx.beginPath(); ctx.arc(x - 4, y - 4, 4, 0, 7); ctx.fill();
    }
    // explosions
    for (const ex of this.explosions) {
      const x = ex.c * this.cell, y = ex.r * this.cell;
      ctx.globalAlpha = clamp(ex.ttl * 2.4, 0, 1);
      ctx.fillStyle = '#ff9a3a';
      ctx.fillRect(x + 2, y + 2, this.cell - 4, this.cell - 4);
      ctx.fillStyle = '#ffe27a';
      ctx.fillRect(x + 8, y + 8, this.cell - 16, this.cell - 16);
      ctx.globalAlpha = 1;
    }
    // enemies
    for (const e of this.enemies) {
      const x = e.c * this.cell + this.cell / 2, y = e.r * this.cell + this.cell / 2;
      const wob = Math.sin(e.animT * 8) * 3;
      ctx.fillStyle = '#e85a8a';
      rr(ctx, x - 14, y - 14 + wob, 28, 26, 8); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 9, y - 8 + wob, 6, 8); ctx.fillRect(x + 3, y - 8 + wob, 6, 8);
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 7, y - 6 + wob, 3, 4); ctx.fillRect(x + 5, y - 6 + wob, 3, 4);
      ctx.fillStyle = '#b03a6a';
      ctx.fillRect(x - 14, y + 8 + wob, 28, 5);
    }
    // players
    this.drawBomber(ctx, this.p1, '#ffffff', '#3a7ae8');
    if (this.p2) this.drawBomber(ctx, this.p2, '#ffb0b0', '#e83a3a');
    ctx.restore();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.6)'; ctx.fillRect(0, 0, this.W, 40);
    txt(ctx, `ENEMIES ${this.enemies.length}`, 16, 14, { size: 10, color: '#ff9ab0' });
    txt(ctx, '💣 BOMBERMAN', this.W / 2, 14, { size: 10, color: '#fff', align: 'center' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 64, { size: 12, color: '#ffd76b', align: 'center', glow: 10 });
  }

  drawBomber(ctx, p, body, accent) {
    if (!p.alive) return;
    const x = p.px * this.cell, y = p.py * this.cell;
    const bob = Math.sin(p.animT * 10) * 2;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(x, y - 10 + bob, 11, 0, 7); ctx.fill(); // head
    ctx.fillStyle = body;
    rr(ctx, x - 11, y - 2 + bob, 22, 18, 6); ctx.fill();
    ctx.fillStyle = accent;
    ctx.fillRect(x - 13, y + 14 + bob, 8, 8); ctx.fillRect(x + 5, y + 14 + bob, 8, 8);
    // antenna
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 20 + bob); ctx.lineTo(x, y - 26 + bob); ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(x, y - 28 + bob, 3, 0, 7); ctx.fill();
  }
}

/* ---------- 20. NINTENDO WORLD CUP ---------- */
class SoccerGame extends Game {
  init() {
    this.field = { x: 60, y: 70, w: this.W - 120, h: this.H - 130 };
    this.goalH = 150;
    this.p1 = { x: this.field.x + 160, y: this.H / 2, vx: 0, vy: 0, color: '#3a7ae8' };
    this.p2 = this.is2P ? { x: this.field.x + this.field.w - 160, y: this.H / 2, vx: 0, vy: 0, color: '#e83a3a' } : null;
    this.ball = { x: this.W / 2, y: this.H / 2, vx: 0, vy: 0 };
    this.cpu = this.p2 || { x: this.field.x + this.field.w - 160, y: this.H / 2, color: '#e83a3a' };
    this.msg = 'KICK OFF!'; this.msgT = 1.4;
    this.celebrateT = 0;
    this.lastTouch = 0;
    this.timeLeft = 90;
  }

  resetPositions(dir) {
    this.p1.x = this.field.x + 160; this.p1.y = this.H / 2;
    if (this.p2) { this.p2.x = this.field.x + this.field.w - 160; this.p2.y = this.H / 2; }
    this.cpu.x = this.field.x + this.field.w - 160; this.cpu.y = this.H / 2;
    this.ball.x = this.W / 2; this.ball.y = this.H / 2;
    this.ball.vx = dir * 100; this.ball.vy = 0;
  }

  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    if (this.celebrateT > 0) {
      this.celebrateT -= dt;
      if (this.celebrateT <= 0) this.resetPositions(this.lastTouch === 0 ? -1 : 1);
      return;
    }
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      if (this.scores[0] > this.scores[1]) this.is2P ? this.wins(0) : this.win1P('YOU WIN THE CUP!');
      else if (this.scores[1] > this.scores[0]) this.is2P ? this.wins(1) : this.lose1P();
      else this.drawEnd();
      return;
    }

    const inp = this.in.p1;
    const PS = 300;
    let dx = 0, dy = 0;
    if (inp.left) dx -= 1;
    if (inp.right) dx += 1;
    if (inp.up) dy -= 1;
    if (inp.down) dy += 1;
    this.p1.x = clamp(this.p1.x + dx * PS * dt, this.field.x + 14, this.field.x + this.field.w - 14);
    this.p1.y = clamp(this.p1.y + dy * PS * dt, this.field.y + 14, this.field.y + this.field.h - 14);
    if ((inp.actionPressed || inp.secondaryPressed)) this.kick(this.p1, 0);

    // P2 or CPU
    if (this.is2P) {
      const i2 = this.in.p2;
      let dx2 = 0, dy2 = 0;
      if (i2.left) dx2 -= 1;
      if (i2.right) dx2 += 1;
      if (i2.up) dy2 -= 1;
      if (i2.down) dy2 += 1;
      this.p2.x = clamp(this.p2.x + dx2 * PS * dt, this.field.x + 14, this.field.x + this.field.w - 14);
      this.p2.y = clamp(this.p2.y + dy2 * PS * dt, this.field.y + 14, this.field.y + this.field.h - 14);
      if (i2.actionPressed || i2.secondaryPressed) this.kick(this.p2, 1);
    } else {
      // CPU chases ball
      const targetX = this.ball.x - 30, targetY = this.ball.y;
      const sp = 260;
      this.cpu.x += clamp(targetX - this.cpu.x, -sp * dt, sp * dt);
      this.cpu.y += clamp(targetY - this.cpu.y, -sp * dt, sp * dt);
      this.cpu.x = clamp(this.cpu.x, this.field.x + 14, this.field.x + this.field.w - 14);
      this.cpu.y = clamp(this.cpu.y, this.field.y + 14, this.field.y + this.field.h - 14);
      if (dist2(this.cpu.x, this.cpu.y, this.ball.x, this.ball.y) < 30 * 30 && chance(dt * 2)) {
        this.kick(this.cpu, 1);
      }
    }

    // ball physics
    const b = this.ball;
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.vx *= (1 - 0.6 * dt); b.vy *= (1 - 0.6 * dt);
    // bounce walls (top/bottom)
    if (b.y < this.field.y + 10) { b.y = this.field.y + 10; b.vy = Math.abs(b.vy); this.audio.blip(260); }
    if (b.y > this.field.y + this.field.h - 10) { b.y = this.field.y + this.field.h - 10; b.vy = -Math.abs(b.vy); this.audio.blip(260); }
    // goals
    const gy1 = this.field.y + this.field.h / 2, gh = this.goalH / 2;
    if (b.x < this.field.x + 8) {
      if (Math.abs(b.y - gy1) < gh) this.goal(1);
      else { b.x = this.field.x + 8; b.vx = Math.abs(b.vx); }
    }
    if (b.x > this.field.x + this.field.w - 8) {
      if (Math.abs(b.y - gy1) < gh) this.goal(0);
      else { b.x = this.field.x + this.field.w - 8; b.vx = -Math.abs(b.vx); }
    }
    // player-ball collision (dribble)
    for (const pl of [this.p1, this.p2, this.cpu]) {
      if (!pl) continue;
      const d = dist2(pl.x, pl.y, b.x, b.y);
      if (d < 26 * 26) {
        const ang = Math.atan2(b.y - pl.y, b.x - pl.x);
        const push = 200;
        b.vx += Math.cos(ang) * push * dt * 10;
        b.vy += Math.sin(ang) * push * dt * 10;
        b.vx = clamp(b.vx, -520, 520); b.vy = clamp(b.vy, -520, 520);
      }
    }
  }

  kick(pl, idx) {
    const b = this.ball;
    const d = dist2(pl.x, pl.y, b.x, b.y);
    if (d < 40 * 40) {
      const ang = Math.atan2(b.y - pl.y, b.x - pl.x);
      const pow = 480;
      b.vx = Math.cos(ang) * pow;
      b.vy = Math.sin(ang) * pow;
      this.lastTouch = idx;
      this.audio.shoot();
    }
  }

  goal(scorer) {
    this.addScore(1, scorer);
    this.audio.start();
    this.celebrateT = 1.6;
    this.lastTouch = scorer;
    this.msg = (scorer === 0 ? (this.is2P ? 'PLAYER 1' : 'YOU') : (this.is2P ? 'PLAYER 2' : 'CPU')) + ' SCORES!';
    this.msgT = 1.6;
    this.ball.vx = 0; this.ball.vy = 0;
  }

  render(ctx) {
    // stadium bg
    ctx.fillStyle = '#0a1a10'; ctx.fillRect(0, 0, this.W, this.H);
    // crowd
    for (let i = 0; i < 120; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.03 + (i % 6) * 0.012})`;
      ctx.fillRect((i * 61) % this.W, (i * 37) % 60, 8, 8);
      ctx.fillRect((i * 71) % this.W, this.H - 50 + (i * 13) % 44, 8, 8);
    }
    const f = this.field;
    // grass
    ctx.fillStyle = '#2a7a3a'; ctx.fillRect(f.x, f.y, f.w, f.h);
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 0) continue;
      ctx.fillStyle = 'rgba(255,255,255,.03)';
      ctx.fillRect(f.x + i * f.w / 8, f.y, f.w / 8, f.h);
    }
    // lines
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3;
    ctx.strokeRect(f.x + 6, f.y + 6, f.w - 12, f.h - 12);
    ctx.beginPath(); ctx.moveTo(this.W / 2, f.y + 6); ctx.lineTo(this.W / 2, f.y + f.h - 6); ctx.stroke();
    ctx.beginPath(); ctx.arc(this.W / 2, f.y + f.h / 2, 60, 0, 7); ctx.stroke();
    // goals
    const gy = f.y + f.h / 2;
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.fillRect(f.x - 14, gy - this.goalH / 2, 14, this.goalH);
    ctx.fillRect(f.x + f.w, gy - this.goalH / 2, 14, this.goalH);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(f.x - 14, gy - this.goalH / 2, 14, this.goalH);
    ctx.strokeRect(f.x + f.w, gy - this.goalH / 2, 14, this.goalH);

    // players
    this.drawFootballer(ctx, this.p1, '#3a7ae8');
    if (this.is2P) this.drawFootballer(ctx, this.p2, '#e83a3a');
    else this.drawFootballer(ctx, this.cpu, '#e83a3a');
    // ball
    const b = this.ball;
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(b.x, b.y, 10, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(b.x + 2, b.y - 2, 3.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x - 4, b.y + 3, 2.5, 0, 7); ctx.fill();

    // HUD
    ctx.fillStyle = 'rgba(2,6,16,.7)'; ctx.fillRect(0, 0, this.W, 44);
    txt(ctx, `${this.is2P ? 'P1' : 'YOU'}  ${this.scores[0]}`, 40, 16, { size: 13, color: '#6db8ff' });
    txt(ctx, `${Math.max(0, Math.ceil(this.timeLeft))}s`, this.W / 2, 16, { size: 13, color: '#fff', align: 'center' });
    txt(ctx, `${this.scores[1]}  ${this.is2P ? 'P2' : 'CPU'}`, this.W - 40, 16, { size: 13, color: '#ff7a8a', align: 'right' });
    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 110, { size: 20, color: '#ffd76b', align: 'center', glow: 16 });
    if (this.celebrateT > 0) {
      txt(ctx, '⚽ GOAL! ⚽', this.W / 2, this.H / 2 - 40, { size: 44, color: '#ffd76b', align: 'center', glow: 26 });
    }
  }

  drawFootballer(ctx, pl, col) {
    drawDude(ctx, pl.x - 12, pl.y - 26, 24, 46, col, { walk: Math.abs(pl.vx) > 10, animT: this.t, face: 1 });
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(pl.x, pl.y + 22, 14, 5, 0, 0, 7); ctx.fill();
  }
}

window.RoadFighterGame = RoadFighterGame;
window.Game1942 = Game1942;
window.GalagaGame = GalagaGame;
window.InvadersGame = InvadersGame;
window.TetrisGame = TetrisGame;
window.SnakeGame = SnakeGame;
window.PongGame = PongGame;
window.ArkanoidGame = ArkanoidGame;
window.BombermanGame = BombermanGame;
window.SoccerGame = SoccerGame;
