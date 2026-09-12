/* ============================================================
   core.js — shared game engines
   PlatGame (side-scroll platformer), FighterGame (versus fighting),
   VertShooter (vertical shooter), BrawlerGame (beat'em up / arena)
   ============================================================ */

/* ============================================================
   PlatGame — parameterized side-scroll platformer
   Powers: Mario, Sonic, Adventure Island, Kirby, Ninja Gaiden,
   Castlevania, Felix, Bugs Bunny, Chip'n'Dale, Tiny Toon, Contra,
   Jurassic Park, DuckTales, Prince of Persia, TMNT
   ============================================================ */
class PlatGame extends Game {
  constructor(host, opts = {}) {
    super(host);
    this.o = Object.assign({
      len: 190, tile: 36, rows: 15,
      gravity: 2400, jump: 820, speed: 310, accel: 2600,
      doubleJump: false, fly: false, pogo: false,
      shoot: null,            // {rate:0.4, color:'#fff', speed:520, arc:false}
      melee: null,            // {range:52, rate:0.45, color:'#ffe27a'}
      springs: false, rings: false, fruit: false,
      timer: 0, chase: false, race2P: false, coOp: false,
      walkerStyle: 'goomba', flyerStyle: 'bat', guardStyle: null,
      enemySpeed: 70, enemyDensity: 0.45, flyerDensity: 0.18,
      coinKind: 'coin', coinScore: 100,
      theme: {
        sky: ['#0b1e42', '#1a3a6b'], hill: '#122b52', hill2: '#0d2140',
        ground: '#5a3a22', groundTop: '#3fae4a', plat: '#7a5230', accent: '#ffd76b'
      },
      goalLabel: 'GOAL'
    }, opts);
    this.T = this.o.tile;
  }

  init() {
    this.buildLevel();
    this.camX = 0;
    this.particles = [];
    this.bullets = [];
    this.checkpoint = 2 * this.T;
    this.timeLeft = this.o.timer;
    this.fruitMeter = 100;
    this.rings = [0, 0];
    this.msg = ''; this.msgT = 0;
    this.players = this.makePlayers();
  }

  makePlayers() {
    const list = [{
      x: 2 * this.T, y: 12 * this.T, w: 24, h: 34, vx: 0, vy: 0, face: 1,
      onGround: false, coyote: 0, jumps: 0, invuln: 0, dead: 0, animT: 0,
      atkT: 0, cd: 0, pogo: 0, idx: 0, color: '#4d9dff', input: 'p1'
    }];
    if (this.o.coOp || this.o.race2P) {
      list.push({
        x: 2 * this.T, y: 12 * this.T, w: 24, h: 34, vx: 0, vy: 0, face: 1,
        onGround: false, coyote: 0, jumps: 0, invuln: 0, dead: 0, animT: 0,
        atkT: 0, cd: 0, pogo: 0, idx: 1, color: '#ff5a5a', input: 'p2'
      });
    }
    return list;
  }

  buildLevel() {
    const { len, rows } = this.o;
    const T = this.T;
    const rng = makeRNG(this.host.gameDef.id + '_lvl');
    const grid = [];
    for (let r = 0; r < rows; r++) grid.push(new Array(len).fill('.'));
    this.grid = grid;
    this.coins = []; this.enemies = []; this.springs = []; this.flag = null;

    const groundRow = rows - 2;
    let x = 0;
    while (x < len) {
      const seg = Math.floor(rng() * 7) + 6;
      const end = Math.min(len, x + seg);
      for (let cx = x; cx < end; cx++) {
        grid[groundRow][cx] = '#'; grid[groundRow + 1][cx] = '#';
      }
      // decorations on this segment
      if (x > 14 && x < len - 16) {
        if (rng() < this.o.enemyDensity) {
          const ex = x + 2 + Math.floor(rng() * (seg - 3));
          this.enemies.push(this.makeEnemy('walker', ex * T + 4, groundRow * T - 34));
        }
        if (rng() < this.o.flyerDensity) {
          const fx = x + 1 + Math.floor(rng() * seg);
          this.enemies.push(this.makeEnemy('flyer', fx * T, (4 + Math.floor(rng() * 4)) * T));
        }
        if (this.o.guardStyle && x > len * 0.4 && rng() < 0.3) {
          const gx = x + 3 + Math.floor(rng() * (seg - 4));
          this.enemies.push(this.makeEnemy('guard', gx * T, groundRow * T - 40));
        }
        if (rng() < 0.09) grid[groundRow - 1][x + 2 + Math.floor(rng() * (seg - 3))] = '^';
        // coin arcs
        if (rng() < 0.75) {
          const n = 3 + Math.floor(rng() * 3);
          const cx0 = x + 1 + Math.floor(rng() * Math.max(1, seg - n - 1));
          const cr = groundRow - 1 - Math.floor(rng() * 2);
          for (let i = 0; i < n; i++) this.coins.push({ x: (cx0 + i) * T + T / 2, y: cr * T + T / 2, got: false });
        }
        // floating platforms
        if (rng() < 0.55) {
          const pw = 3 + Math.floor(rng() * 4);
          const px0 = x + Math.floor(rng() * Math.max(1, seg - pw));
          const pr = groundRow - 3 - Math.floor(rng() * 3);
          for (let i = 0; i < pw && px0 + i < len - 6; i++) grid[pr][px0 + i] = '=';
          if (rng() < 0.6) for (let i = 0; i < pw; i++) this.coins.push({ x: (px0 + i) * T + T / 2, y: (pr - 1) * T + T / 2, got: false });
          if (rng() < 0.35) this.enemies.push(this.makeEnemy('walker', (px0 + 1) * T, pr * T - 34, true));
        }
        if (this.o.springs && rng() < 0.3) this.springs.push({ x: (x + 3) * T, y: (groundRow - 1) * T, t: 0 });
      }
      // gap
      if (x > 20 && x < len - 22 && rng() < 0.45) {
        const gap = 2 + Math.floor(rng() * 2);
        for (let i = 0; i < gap; i++) { grid[groundRow][end + i] = '.'; grid[groundRow + 1][end + i] = '.'; }
        x = end + gap;
      } else x = end;
    }
    // ensure flat ground near start & end
    for (let cx = 0; cx < 10; cx++) { grid[groundRow][cx] = '#'; grid[groundRow + 1][cx] = '#'; }
    for (let cx = len - 10; cx < len; cx++) { grid[groundRow][cx] = '#'; grid[groundRow + 1][cx] = '#'; }
    // flag
    const fx = len - 6;
    this.flag = { x: fx * T + T / 2, y: (groundRow - 3) * T, h: 3 * T };
    this.levelW = len * T;
  }

  makeEnemy(kind, x, y, onPlat) {
    const o = this.o;
    const base = {
      kind, x, y, w: 30, h: 32, dir: chance(0.5) ? 1 : -1, hp: 1, dead: 0,
      animT: rnd(10), baseY: y, t: rnd(6), onPlat: !!onPlat
    };
    if (kind === 'walker') { base.speed = o.enemySpeed; base.style = o.walkerStyle; base.score = 100; }
    if (kind === 'flyer') { base.speed = o.enemySpeed * 0.7; base.style = o.flyerStyle; base.score = 150; base.w = 28; base.h = 22; }
    if (kind === 'guard') { base.speed = 55; base.style = o.guardStyle; base.hp = 3; base.score = 400; base.w = 26; base.h = 40; }
    if (o.chase && kind === 'walker') { base.chaser = true; base.speed = o.enemySpeed + 40; }
    return base;
  }

  solid(tx, ty) {
    if (tx < 0 || tx >= this.o.len) return true;
    if (ty < 0) return false;
    if (ty >= this.o.rows) return false;
    const c = this.grid[ty][tx];
    return c === '#' || c === '=';
  }
  tileAt(px, py) {
    const tx = Math.floor(px / this.T), ty = Math.floor(py / this.T);
    if (ty < 0 || ty >= this.o.rows || tx < 0 || tx >= this.o.len) return '.';
    return this.grid[ty][tx];
  }

  update(dt) {
    this.t += dt; this.frame++;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.o.timer) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.lose1P(); return; }
    }
    if (this.o.fruit) {
      this.fruitMeter -= dt * 4;
      if (this.fruitMeter <= 0) { this.fruitMeter = 0; this.killPlayer(this.players[0]); }
    }
    for (const p of this.players) this.updatePlayer(p, dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateParticles(dt);
    // camera
    const focus = this.players.reduce((m, p) => Math.max(m, p.x), 0);
    this.camX = clamp(focus - this.W * 0.42, 0, this.levelW - this.W);
    // fall out
    for (const p of this.players) if (!p.dead && p.y > this.H + 80) this.killPlayer(p, true);
  }

  updatePlayer(p, dt) {
    const o = this.o;
    if (p.dead > 0) {
      p.dead -= dt;
      p.vy += o.gravity * dt; p.y += p.vy * dt;
      if (p.dead <= 0) this.respawn(p);
      return;
    }
    const inp = this.in[p.input];
    p.animT += dt; p.invuln = Math.max(0, p.invuln - dt);
    p.cd = Math.max(0, p.cd - dt); p.atkT = Math.max(0, p.atkT - dt);
    p.pogo = Math.max(0, p.pogo - dt); p.coyote = Math.max(0, p.coyote - dt);

    // horizontal
    let dir = 0;
    if (inp.left) dir -= 1;
    if (inp.right) dir += 1;
    if (dir !== 0) p.face = dir;
    const target = dir * o.speed;
    p.vx = lerp(p.vx, target, clamp(o.accel * dt / o.speed, 0, 1));

    // jump / fly / pogo
    // shoot/melee games: Space = attack, Shift(L) = jump; pure platformers: Space = jump
    const jumpPressed = (o.shoot || o.melee) ? inp.secondaryPressed : inp.actionPressed;
    const jumpHeld = (o.shoot || o.melee) ? inp.secondary : inp.action;
    if (jumpPressed) {
      if (p.onGround || p.coyote > 0) {
        p.vy = -o.jump; p.onGround = false; p.coyote = 0; p.jumps = 1;
        this.audio.jump();
      } else if (o.doubleJump && p.jumps < 2) {
        p.vy = -o.jump * 0.9; p.jumps = 2; this.audio.jump();
      } else if (o.pogo) {
        p.vy = -o.jump * 0.85; p.pogo = 0.25; this.audio.jump();
      }
    }
    if (o.fly) {
      if (jumpHeld && !p.onGround) {
        p.vy = lerp(p.vy, -140, 4 * dt);
        p.floating = true;
      } else p.floating = false;
    }

    // attack
    if (o.shoot && !o.melee && inp.actionPressed && p.cd <= 0) {
      p.cd = o.shoot.rate;
      this.bullets.push({
        x: p.x + (p.face > 0 ? p.w : -8), y: p.y + 12,
        vx: p.face * o.shoot.speed, vy: o.shoot.arc ? -260 : 0,
        g: o.shoot.arc ? 900 : 0, ttl: 1.4, color: o.shoot.color, from: p.idx
      });
      this.audio.shoot();
    }
    if (o.melee && inp.actionPressed && p.cd <= 0) {
      p.cd = o.melee.rate; p.atkT = 0.16;
      this.audio.shoot();
    }

    // physics
    p.vy += o.gravity * dt;
    if (o.fly && p.floating) p.vy = Math.min(p.vy, 220);
    p.vy = Math.min(p.vy, 1300);

    // X move + collide
    p.x += p.vx * dt;
    this.collideX(p);
    // Y move + collide
    p.y += p.vy * dt;
    const wasGround = p.onGround;
    p.onGround = false;
    this.collideY(p);
    if (p.onGround) { p.coyote = 0.1; p.jumps = 0; if (!wasGround) p.vy = 0; }

    p.x = clamp(p.x, this.camX + 2, Math.min(this.levelW - p.w - 2, this.camX + this.W - p.w - 2));

    // spikes
    if (this.tileAt(p.x + p.w / 2, p.y + p.h - 4) === '^' || this.tileAt(p.x + p.w / 2, p.y + 4) === '^') {
      if (p.invuln <= 0) this.hurtPlayer(p);
    }
    // coins
    for (const c of this.coins) {
      if (!c.got && Math.abs(c.x - (p.x + p.w / 2)) < 20 && Math.abs(c.y - (p.y + p.h / 2)) < 24) {
        c.got = true;
        this.addScore(this.o.coinScore, p.idx);
        if (this.o.rings) this.rings[p.idx]++;
        if (this.o.fruit) this.fruitMeter = Math.min(100, this.fruitMeter + 30);
        this.audio.coin();
        this.burst(c.x, c.y, this.o.theme.accent, 6);
      }
    }
    // springs
    for (const s of this.springs) {
      if (p.vy > 0 && Math.abs(p.x + p.w / 2 - (s.x + this.T / 2)) < 26 && Math.abs(p.y + p.h - s.y) < 14) {
        p.vy = -o.jump * 1.35; s.t = 0.3; this.audio.powerup();
      }
    }
    // flag
    if (this.flag && Math.abs(p.x + p.w / 2 - this.flag.x) < 24 && p.y + p.h > this.flag.y) {
      this.finish(p);
    }
  }

  collideX(p) {
    const T = this.T;
    const ty0 = Math.floor(p.y / T), ty1 = Math.floor((p.y + p.h - 1) / T);
    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w) / T);
      for (let ty = ty0; ty <= ty1; ty++) if (this.solid(tx, ty)) { p.x = tx * T - p.w - 0.01; p.vx = 0; break; }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / T);
      for (let ty = ty0; ty <= ty1; ty++) if (this.solid(tx, ty)) { p.x = (tx + 1) * T + 0.01; p.vx = 0; break; }
    }
  }
  collideY(p) {
    const T = this.T;
    const tx0 = Math.floor(p.x / T), tx1 = Math.floor((p.x + p.w - 1) / T);
    if (p.vy > 0) {
      const ty = Math.floor((p.y + p.h) / T);
      for (let tx = tx0; tx <= tx1; tx++) if (this.solid(tx, ty)) { p.y = ty * T - p.h - 0.01; p.onGround = true; p.vy = 0; break; }
    } else if (p.vy < 0) {
      const ty = Math.floor(p.y / T);
      for (let tx = tx0; tx <= tx1; tx++) if (this.solid(tx, ty)) { p.y = (ty + 1) * T + 0.01; p.vy = 0; break; }
    }
  }

  updateEnemies(dt) {
    const T = this.T;
    for (const e of this.enemies) {
      if (e.dead > 0) { e.dead -= dt; continue; }
      e.animT += dt; e.t += dt;
      const vis = e.x > this.camX - 80 && e.x < this.camX + this.W + 80;
      if (!vis) continue;

      if (e.kind === 'walker') {
        // turn at wall / edge
        const aheadX = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
        const footY = e.y + e.h + 4;
        const wall = this.solid(Math.floor(aheadX / T), Math.floor((e.y + e.h / 2) / T));
        const edge = !this.solid(Math.floor(aheadX / T), Math.floor(footY / T));
        if (e.chaser) {
          const tgt = this.players[0];
          if (Math.abs(tgt.x - e.x) < 300 && !tgt.dead) e.dir = tgt.x > e.x ? 1 : -1;
        }
        if (wall || (edge && !e.onPlat)) e.dir *= -1;
        e.x += e.dir * e.speed * dt;
        // gravity for platform walkers
        e.y += 300 * dt;
        const ty = Math.floor((e.y + e.h) / T);
        if (this.solid(Math.floor((e.x + e.w / 2) / T), ty)) { e.y = ty * T - e.h; }
      } else if (e.kind === 'flyer') {
        e.x += Math.cos(e.t * 0.9) * e.speed * dt;
        e.y = e.baseY + Math.sin(e.t * 2.2) * 26;
      } else if (e.kind === 'guard') {
        const tgt = this.nearestPlayer(e);
        if (tgt && Math.abs(tgt.x - e.x) < 220 && Math.abs(tgt.y - e.y) < 80) {
          e.dir = tgt.x > e.x ? 1 : -1;
          e.x += e.dir * 90 * dt;
        } else {
          const aheadX = e.dir > 0 ? e.x + e.w + 2 : e.x - 2;
          const wall = this.solid(Math.floor(aheadX / T), Math.floor((e.y + e.h / 2) / T));
          if (wall) e.dir *= -1;
          e.x += e.dir * e.speed * dt;
        }
        e.y += 300 * dt;
        const ty = Math.floor((e.y + e.h) / T);
        if (this.solid(Math.floor((e.x + e.w / 2) / T), ty)) e.y = ty * T - e.h;
      }

      // vs players
      for (const p of this.players) {
        if (p.dead > 0) continue;
        if (aabb(p, e)) {
          const stomp = p.vy > 100 && (p.y + p.h) - e.y < 20;
          if (p.pogo > 0 || stomp) {
            e.hp--;
            if (e.hp <= 0) { e.dead = 0.4; this.addScore(e.score, p.idx); this.audio.hit(); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#ffffff', 10); }
            else this.audio.blip(300);
            p.vy = -this.o.jump * 0.6;
          } else if (p.invuln <= 0) {
            this.hurtPlayer(p);
          }
        }
      }
      // melee hits
      for (const p of this.players) {
        if (p.atkT > 0) {
          const hx = p.face > 0 ? p.x + p.w : p.x - this.o.melee.range;
          const box = { x: hx, y: p.y, w: this.o.melee.range, h: p.h };
          if (aabb(box, e)) {
            e.hp -= 1;
            if (e.hp <= 0) { e.dead = 0.4; this.addScore(e.score, p.idx); this.audio.hit(); this.burst(e.x + e.w / 2, e.y, '#ffe27a', 10); }
          }
        }
      }
    }
    this.enemies = this.enemies.filter(e => e.dead <= 0);
  }

  nearestPlayer(e) {
    let best = null, bd = 1e9;
    for (const p of this.players) {
      if (p.dead > 0) continue;
      const d = dist2(e.x, e.y, p.x, p.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  updateBullets(dt) {
    for (const b of this.bullets) {
      b.ttl -= dt;
      if (b.g) b.vy += b.g * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (this.tileAt(b.x, b.y) === '#' || this.tileAt(b.x, b.y) === '=') b.ttl = 0;
      for (const e of this.enemies) {
        if (e.dead !== 0) continue;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          e.hp--;
          b.ttl = 0;
          if (e.hp <= 0) { e.dead = 0.4; this.addScore(e.score, b.from); this.audio.hit(); this.burst(e.x + e.w / 2, e.y + e.h / 2, '#fff', 10); }
          break;
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.ttl > 0);
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) this.particles.push({
      x, y, vx: rnd(-160, 160), vy: rnd(-220, 40), ttl: rnd(0.3, 0.7), color
    });
  }
  updateParticles(dt) {
    for (const p of this.particles) { p.ttl -= dt; p.vy += 500 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.particles = this.particles.filter(p => p.ttl > 0);
  }

  hurtPlayer(p) {
    if (this.o.rings) {
      if (this.rings[p.idx] > 0) {
        this.rings[p.idx] = 0; p.invuln = 1.6; this.audio.hurt();
        this.burst(p.x + p.w / 2, p.y, '#ffd76b', 12);
        return;
      }
    }
    this.killPlayer(p);
  }

  killPlayer(p, pit) {
    if (p.dead > 0) return;
    this.lives[p.idx]--;
    p.dead = 1.1; p.vy = -420; p.vx = 0;
    this.audio.explode();
    this.burst(p.x + p.w / 2, p.y + p.h / 2, p.color, 16);
    if (this.lives[p.idx] < 0) {
      if (this.is2P && this.players.length === 2) {
        const other = this.players[1 - p.idx];
        if (this.lives[other.idx] < 0) this.lose1P();
      } else this.lose1P();
    }
  }

  respawn(p) {
    if (this.lives[p.idx] < 0) { p.dead = 9999; p.y = -200; return; }
    p.x = Math.max(this.camX + 40, this.checkpoint);
    p.y = 4 * this.T; p.vx = 0; p.vy = 0; p.invuln = 2; p.dead = 0;
  }

  finish(p) {
    this.checkpoint = p.x;
    if (this.o.race2P) { this.wins(p.idx); return; }
    this.addScore(1000, p.idx);
    this.win1P('LEVEL CLEAR!');
  }

  controlsHint() {
    const o = this.o;
    if (o.shoot) return 'SPACE SHOOT · SHIFT JUMP · P PAUSE · ESC MENU';
    if (o.melee) return 'SPACE ATTACK · SHIFT JUMP · P PAUSE · ESC MENU';
    if (o.fly) return 'HOLD SPACE TO FLY · P PAUSE · ESC MENU';
    return 'SPACE JUMP · P PAUSE · ESC MENU';
  }

  /* ---------------- rendering ---------------- */
  render(ctx) {
    const th = this.o.theme;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, th.sky[0]); grad.addColorStop(1, th.sky[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);

    // parallax hills
    this.drawHills(ctx, th);
    // clouds
    ctx.save();
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 340 + 80) - this.camX * 0.15) % (this.W + 300) - 150;
      const cy = 50 + (i % 3) * 60;
      ctx.fillStyle = '#dfeeff';
      rr(ctx, cx, cy, 110, 26, 13); ctx.fill();
      rr(ctx, cx + 24, cy - 14, 70, 24, 12); ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(-Math.round(this.camX), 0);
    this.drawTiles(ctx);
    for (const s of this.springs) this.drawSpring(ctx, s);
    this.drawFlag(ctx);
    for (const c of this.coins) if (!c.got) this.drawCoin(ctx, c);
    for (const e of this.enemies) if (e.dead <= 0) this.drawEnemy(ctx, e);
    for (const b of this.bullets) {
      ctx.fillStyle = b.color; ctx.shadowColor = b.color; ctx.shadowBlur = 8;
      ctx.fillRect(b.x - 4, b.y - 3, 9, 6); ctx.shadowBlur = 0;
    }
    for (const p of this.players) if (p.dead <= 0 || p.dead < 9000) this.drawPlayer(ctx, p);
    for (const pt of this.particles) {
      ctx.globalAlpha = clamp(pt.ttl * 2, 0, 1);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (this.msgT > 0) txt(ctx, this.msg, this.W / 2, 80, { size: 16, color: '#fff', align: 'center', glow: 16 });
  }

  drawHills(ctx, th) {
    ctx.fillStyle = th.hill2;
    for (let i = -1; i < 8; i++) {
      const hx = i * 220 - (this.camX * 0.2) % 220;
      ctx.beginPath();
      ctx.arc(hx, this.H - 60, 150, Math.PI, 0); ctx.fill();
    }
    ctx.fillStyle = th.hill;
    for (let i = -1; i < 10; i++) {
      const hx = i * 170 - (this.camX * 0.4) % 170;
      ctx.beginPath();
      ctx.arc(hx, this.H - 20, 110, Math.PI, 0); ctx.fill();
    }
  }

  drawTiles(ctx) {
    const T = this.T, th = this.o.theme;
    const x0 = Math.floor(this.camX / T), x1 = Math.ceil((this.camX + this.W) / T);
    for (let ty = 0; ty < this.o.rows; ty++) {
      for (let tx = x0; tx <= x1 && tx < this.o.len; tx++) {
        const c = this.grid[ty][tx];
        const px = tx * T, py = ty * T;
        if (c === '#') {
          ctx.fillStyle = th.ground; ctx.fillRect(px, py, T, T);
          if (!this.solid(tx, ty - 1)) { ctx.fillStyle = th.groundTop; ctx.fillRect(px, py, T, 8); }
          ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(px, py + T - 3, T, 3);
        } else if (c === '=') {
          ctx.fillStyle = th.plat; ctx.fillRect(px, py, T, 12);
          ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(px, py, T, 3);
        } else if (c === '^') {
          ctx.fillStyle = '#c8d4e8';
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(px + i * 12, py + T); ctx.lineTo(px + i * 12 + 6, py + T - 16); ctx.lineTo(px + i * 12 + 12, py + T);
            ctx.fill();
          }
        }
      }
    }
  }

  drawSpring(ctx, s) {
    s.t = Math.max(0, s.t - 0.016);
    const comp = s.t > 0 ? 6 : 0;
    ctx.fillStyle = '#e8e8f0';
    ctx.fillRect(s.x + 4, s.y + 18 + comp, this.T - 8, 6);
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(s.x + 2, s.y + 10 + comp, this.T - 4, 8);
  }

  drawFlag(ctx) {
    const f = this.flag;
    ctx.fillStyle = '#cfd8e8'; ctx.fillRect(f.x - 3, f.y, 6, f.h);
    const wave = Math.sin(this.t * 5) * 4;
    ctx.fillStyle = '#ff4d5e';
    ctx.beginPath();
    ctx.moveTo(f.x + 3, f.y + 4);
    ctx.lineTo(f.x + 46 + wave, f.y + 18);
    ctx.lineTo(f.x + 3, f.y + 34);
    ctx.fill();
    txt(ctx, this.o.goalLabel, f.x + 2, f.y - 14, { size: 8, color: '#fff', align: 'center' });
  }

  drawCoin(ctx, c) {
    const s = Math.abs(Math.sin(this.t * 4 + c.x));
    ctx.fillStyle = '#ffd76b';
    ctx.shadowColor = '#ffd76b'; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, 8 * s + 2, 9, 0, 0, 7); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#a8741a';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 3 * s + 1, 4, 0, 0, 7); ctx.fill();
  }

  drawEnemy(ctx, e) {
    const style = e.style;
    const flash = e.dead > 0;
    if (flash) { ctx.globalAlpha = 0.5; }
    if (style === 'goomba') {
      ctx.fillStyle = '#8a4b22';
      ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h * 0.4, e.w / 2, e.h * 0.42, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#f0e0c0'; ctx.fillRect(e.x + 4, e.y + e.h * 0.68, e.w - 8, e.h * 0.3);
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x + 6, e.y + 10, 7, 8); ctx.fillRect(e.x + e.w - 13, e.y + 10, 7, 8);
      ctx.fillStyle = '#000'; ctx.fillRect(e.x + 8, e.y + 12, 4, 5); ctx.fillRect(e.x + e.w - 11, e.y + 12, 4, 5);
    } else if (style === 'ninja' || style === 'foot' || style === 'soldier' || style === 'guardm') {
      const col = style === 'foot' ? '#8a4bd8' : style === 'ninja' ? '#2a3a6e' : '#5a6a8a';
      drawDude(ctx, e.x, e.y, e.w, e.h, col, { face: e.dir, walk: true, animT: e.animT, skin: style === 'ninja' ? '#c8a06a' : '#ffcf9e' });
      if (style === 'ninja') { ctx.fillStyle = '#e8d44a'; ctx.fillRect(e.x + e.w * 0.2, e.y + 2, e.w * 0.6, 4); }
    } else if (style === 'bat') {
      const f = Math.sin(e.animT * 12) * 8;
      ctx.fillStyle = '#4a3a6e';
      ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h / 2, 9, 7, 0, 0, 7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2, e.y + e.h / 2); ctx.lineTo(e.x - 8, e.y + e.h / 2 - f);
      ctx.lineTo(e.x + 2, e.y + e.h / 2 + 4); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(e.x + e.w / 2, e.y + e.h / 2); ctx.lineTo(e.x + e.w + 8, e.y + e.h / 2 - f);
      ctx.lineTo(e.x + e.w - 2, e.y + e.h / 2 + 4); ctx.fill();
      ctx.fillStyle = '#ff5a5a'; ctx.fillRect(e.x + e.w / 2 - 4, e.y + e.h / 2 - 2, 2, 2); ctx.fillRect(e.x + e.w / 2 + 2, e.y + e.h / 2 - 2, 2, 2);
    } else if (style === 'raptor') {
      ctx.fillStyle = '#5a9e3a';
      const lo = Math.sin(e.animT * 14) * 4;
      ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h * 0.55, e.w * 0.55, e.h * 0.32, 0, 0, 7); ctx.fill();
      ctx.fillRect(e.x + (e.dir > 0 ? e.w - 8 : 0), e.y, 14, 14); // head
      ctx.fillStyle = '#28401a';
      ctx.fillRect(e.x + 4 + lo, e.y + e.h - 8, 5, 8); ctx.fillRect(e.x + e.w - 9 - lo, e.y + e.h - 8, 5, 8);
      ctx.beginPath();
      ctx.moveTo(e.x + (e.dir > 0 ? 2 : e.w - 2), e.y + e.h * 0.4);
      ctx.lineTo(e.x + (e.dir > 0 ? -12 : e.w + 12), e.y + e.h * 0.2);
      ctx.lineTo(e.x + (e.dir > 0 ? 2 : e.w - 2), e.y + e.h * 0.6); ctx.fill();
      ctx.fillStyle = '#ffd76b'; ctx.fillRect(e.x + (e.dir > 0 ? e.w - 4 : 2), e.y + 3, 3, 3);
    } else if (style === 'guard') {
      drawDude(ctx, e.x, e.y, e.w, e.h, '#7a8494', { face: e.dir, walk: true, animT: e.animT });
      ctx.fillStyle = '#c8d0dc'; ctx.fillRect(e.x + e.w * 0.15, e.y, e.w * 0.7, 6);
      ctx.fillStyle = '#e8d44a'; ctx.fillRect(e.x + e.w / 2 - 2, e.y - 8, 4, 8);
    } else {
      drawDude(ctx, e.x, e.y, e.w, e.h, '#8a4b22', { face: e.dir, walk: true, animT: e.animT });
    }
    ctx.globalAlpha = 1;
  }

  drawPlayer(ctx, p) {
    if (p.invuln > 0 && Math.floor(this.t * 14) % 2 === 0) return;
    const o = this.o;
    drawDude(ctx, p.x, p.y, p.w, p.h, p.color, {
      face: p.face, walk: Math.abs(p.vx) > 30 && p.onGround, animT: p.animT, legs: '#28324a'
    });
    // melee swing
    if (p.atkT > 0 && o.melee) {
      ctx.strokeStyle = o.melee.color; ctx.lineWidth = 4;
      ctx.beginPath();
      const cx = p.face > 0 ? p.x + p.w : p.x;
      ctx.arc(cx, p.y + p.h * 0.4, o.melee.range * 0.8, p.face > 0 ? -1 : Math.PI - 1, p.face > 0 ? 0.9 : Math.PI + 0.9);
      ctx.stroke();
    }
    // cap
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x + p.w * 0.14, p.y - 4, p.w * 0.72, 6);
    ctx.fillRect(p.face > 0 ? p.x + p.w * 0.6 : p.x - 4, p.y - 2, p.w * 0.5, 4);
  }

  drawHud(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.55)';
    ctx.fillRect(0, 0, this.W, 34);
    txt(ctx, `P1 ${padScore(this.scores[0])}`, 14, 17, { size: 10, color: '#7fc4ff' });
    if (this.is2P) txt(ctx, `P2 ${padScore(this.scores[1])}`, this.W - 14, 17, { size: 10, color: '#ff8d99', align: 'right' });
    const lifeStr = '❤'.repeat(clamp(this.lives[0], 0, 5));
    txt(ctx, lifeStr || '—', 160, 18, { size: 12, color: '#7fc4ff', px: false });
    if (this.is2P) txt(ctx, '❤'.repeat(clamp(this.lives[1], 0, 5)) || '—', this.W - 160, 18, { size: 12, color: '#ff8d99', px: false, align: 'right' });
    if (this.o.rings) txt(ctx, '🪙 ' + this.rings[0], 230, 17, { size: 10, color: '#ffd76b', px: false });
    if (this.o.timer) txt(ctx, 'TIME ' + Math.ceil(this.timeLeft), this.W / 2, 17, { size: 11, color: this.timeLeft < 20 ? '#ff6b7a' : '#e8f4ff', align: 'center' });
    if (this.o.fruit) {
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(this.W / 2 - 60, 24, 120, 6);
      ctx.fillStyle = '#7dffb0'; ctx.fillRect(this.W / 2 - 60, 24, 120 * this.fruitMeter / 100, 6);
    }
    ctx.restore();
  }
}

/* ============================================================
   FighterGame — 1v1 fighting (Mortal Kombat / Street Fighter)
   ============================================================ */
class FighterGame extends Game {
  constructor(host, opts = {}) {
    super(host);
    this.o = Object.assign({
      p1: { name: 'FIGHTER 1', color: '#ffd76b', pants: '#3a3a5a', special: 'fire', specialColor: '#ff9a3a' },
      p2: { name: 'FIGHTER 2', color: '#5db8ff', pants: '#274a72', special: 'ice', specialColor: '#8fe0ff' },
      sky: ['#2a0a12', '#0a0208'], floor: '#3a2a2a', crowd: '#1a1020',
      roundTime: 60, roundsToWin: 2
    }, opts);
  }

  init() {
    this.fighters = [this.makeFighter(0), this.makeFighter(1)];
    this.projectiles = [];
    this.sparks = [];
    this.roundWins = [0, 0];
    this.round = 1;
    this.timeLeft = this.o.roundTime;
    this.phase = 'intro'; this.phaseT = 1.6;
    this.msg = 'ROUND ' + this.round;
  }

  makeFighter(idx) {
    const x = idx === 0 ? 260 : 700;
    return {
      idx, x, y: 400, w: 46, h: 96, vx: 0, vy: 0, face: idx === 0 ? 1 : -1,
      hp: 100, state: 'idle', animT: 0, stun: 0, cd: 0, atkT: 0, atkType: null,
      hitDone: false, block: false, roundWins: 0, color: idx === 0 ? this.o.p1.color : this.o.p2.color
    };
  }

  resetRound() {
    this.fighters = [this.makeFighter(0), this.makeFighter(1)];
    this.projectiles = [];
    this.timeLeft = this.o.roundTime;
    this.phase = 'intro'; this.phaseT = 1.6;
    this.msg = 'ROUND ' + this.round;
  }

  update(dt) {
    this.t += dt; this.frame++;
    for (const s of this.sparks) { s.ttl -= dt; s.x += s.vx * dt; s.y += s.vy * dt; }
    this.sparks = this.sparks.filter(s => s.ttl > 0);

    if (this.phase === 'intro') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) { this.phase = 'fight'; this.msg = 'FIGHT!'; this.phaseT = 0.8; this.audio.powerup(); }
      return;
    }
    if (this.phase === 'msg') {
      this.phaseT -= dt;
      if (this.phaseT <= 0) {
        if (this.roundWins[0] >= this.o.roundsToWin) this.wins(0);
        else if (this.roundWins[1] >= this.o.roundsToWin) this.wins(1);
        else { this.round++; this.resetRound(); }
      }
      return;
    }
    if (this.phase === 'ko') {
      this.phaseT -= dt;
      this.updatePhysics(dt);
      for (const f of this.fighters) f.animT += dt;
      if (this.phaseT <= 0) {
        this.roundWins[this.koWinner]++;
        this.phase = 'msg'; this.phaseT = 1.6;
        this.msg = (this.koWinner === 0 ? this.o.p1.name : this.o.p2.name) + ' WINS ROUND ' + this.round;
      }
      return;
    }

    // fight
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.koWinner = this.fighters[0].hp >= this.fighters[1].hp ? 0 : 1;
      this.phase = 'ko'; this.phaseT = 1.4;
      return;
    }

    this.controlHuman(this.fighters[0], this.in.p1, dt);
    if (this.is2P) this.controlHuman(this.fighters[1], this.in.p2, dt);
    else this.controlCPU(this.fighters[1], this.fighters[0], dt);

    this.updateFighter(this.fighters[0], this.fighters[1], dt);
    this.updateFighter(this.fighters[1], this.fighters[0], dt);
    this.updateProjectiles(dt);
  }

  controlHuman(f, inp, dt) {
    f.onGround = f.onGround || (() => f.y >= 399);
    if (f.stun > 0 || this.phase !== 'fight') return;
    f.block = inp.down && f.onGround();
    let dir = 0;
    if (inp.left) dir -= 1;
    if (inp.right) dir += 1;
    if (!f.block) f.vx = dir * 240;
    if (inp.upPressed && f.onGround()) { f.vy = -640; this.audio.jump(); }
    if (inp.actionPressed && f.cd <= 0) { this.startAttack(f, 'punch'); }
    if (inp.secondaryPressed && f.cd <= 0) {
      this.startAttack(f, 'special');
    }
  }

  controlCPU(f, foe, dt) {
    if (f.stun > 0 || this.phase !== 'fight') return;
    f._aiT = (f._aiT || 0) - dt;
    const d = foe.x - f.x;
    f.face = d > 0 ? 1 : -1;
    if (f._aiT <= 0) {
      f._aiT = rnd(0.2, 0.5);
      const ad = Math.abs(d);
      if (ad > 320) f.vx = f.face * 240;
      else if (ad > 70) { f.vx = f.face * (chance(0.7) ? 220 : -160); if (chance(0.12)) f.vy = -620; }
      else {
        f.vx = 0;
        const r = Math.random();
        if (r < 0.45) this.startAttack(f, chance(0.6) ? 'punch' : 'kick');
        else if (r < 0.58) this.startAttack(f, 'special');
        else if (r < 0.75) f.block = true;
        else f.block = false;
      }
    }
    if (f.block && Math.abs(d) > 90) f.block = false;
  }

  startAttack(f, type) {
    const spec = { punch: { t: 0.22, cd: 0.3 }, kick: { t: 0.3, cd: 0.5 }, special: { t: 0.34, cd: 1.6 } }[type];
    f.state = type; f.atkT = spec.t; f.cd = spec.cd; f.atkType = type; f.hitDone = false;
    if (type !== 'special') this.audio.blip(type === 'punch' ? 500 : 380);
  }

  updateFighter(f, foe, dt) {
    f.animT += dt;
    f.stun = Math.max(0, f.stun - dt);
    f.cd = Math.max(0, f.cd - dt);
    if (f.stun > 0) f.state = 'hit';
    else if (f.state !== 'ko') {
      if (f.atkT > 0) {
        f.atkT -= dt;
        // active frames — hit check
        const ranges = { punch: { s: 0.06, e: 0.16, r: 52, dmg: 7 }, kick: { s: 0.1, e: 0.24, r: 64, dmg: 11 }, special: { s: 0.18, e: 0.26, r: 0, dmg: 0 } };
        const rg = ranges[f.atkType];
        const elapsed = ({ punch: 0.22, kick: 0.3, special: 0.34 })[f.atkType] - f.atkT;
        if (!f.hitDone && elapsed >= rg.s && elapsed <= rg.e) {
          if (f.atkType === 'special') {
            f.hitDone = true;
            const col = f.idx === 0 ? this.o.p1.specialColor : this.o.p2.specialColor;
            this.projectiles.push({ x: f.x + f.w / 2 + f.face * 30, y: f.y + 40, vx: f.face * 460, dmg: 14, color: col, from: f.idx });
            this.audio.shoot();
          } else {
            const hx = f.face > 0 ? f.x + f.w : f.x - rg.r;
            const box = { x: hx, y: f.y + 10, w: rg.r, h: f.h - 10 };
            if (aabb(box, foe)) {
              f.hitDone = true;
              this.damage(foe, rg.dmg, f.face, f.atkType === 'kick');
            }
          }
        }
        if (f.atkT <= 0) f.state = 'idle';
      } else if (f.stun <= 0) f.state = f.block ? 'block' : (Math.abs(f.vx) > 20 ? 'walk' : 'idle');
    }

    // gravity + ground
    f.vy += 2000 * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    const floor = 400;
    if (f.y >= floor) { f.y = floor; f.vy = 0; }
    f.x = clamp(f.x, 40, this.W - 40 - f.w);
    // face foe
    if (f.stun <= 0 && f.atkT <= 0) f.face = foe.x > f.x ? 1 : -1;
  }

  updatePhysics(dt) { /* keep bodies falling during ko */ }

  damage(f, dmg, dir, heavy) {
    if (f.state === 'ko') return;
    if (f.block) dmg = Math.ceil(dmg * 0.25);
    f.hp = Math.max(0, f.hp - dmg);
    f.stun = f.block ? 0.12 : heavy ? 0.45 : 0.3;
    f.vx = dir * (f.block ? 60 : 220);
    this.audio.hit();
    for (let i = 0; i < 8; i++) this.sparks.push({
      x: f.x + f.w / 2, y: f.y + 40, vx: rnd(-200, 200), vy: rnd(-200, 100), ttl: 0.4, color: '#ffd76b'
    });
    if (f.hp <= 0) {
      f.state = 'ko'; f.vy = -300; f.vx = dir * 260;
      this.koWinner = 1 - f.idx;
      this.phase = 'ko'; this.phaseT = 1.6;
      this.audio.explode();
    }
  }

  updateProjectiles(dt) {
    for (const pr of this.projectiles) {
      pr.x += pr.vx * dt;
      const foe = this.fighters[1 - pr.from];
      if (foe.state !== 'ko' && pr.x > foe.x && pr.x < foe.x + foe.w && pr.y > foe.y && pr.y < foe.y + foe.h) {
        this.damage(foe, pr.dmg, Math.sign(pr.vx), true);
        pr.dead = true;
      }
      if (pr.x < -40 || pr.x > this.W + 40) pr.dead = true;
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  render(ctx) {
    const o = this.o;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, o.sky[0]); grad.addColorStop(1, o.sky[1]);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    // moon / lamp
    ctx.fillStyle = 'rgba(255,240,200,.15)';
    ctx.beginPath(); ctx.arc(720, 110, 70, 0, 7); ctx.fill();
    // crowd
    ctx.fillStyle = o.crowd;
    for (let i = 0; i < 40; i++) {
      const cx = (i * 47 + (Math.floor(this.t * 2 + i) % 3)) % this.W;
      ctx.fillRect(cx, 190 + (i % 4) * 14, 26, 34);
    }
    // floor
    ctx.fillStyle = o.floor; ctx.fillRect(0, 496, this.W, 44);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(0, 496, this.W, 4);

    for (const pr of this.projectiles) {
      ctx.fillStyle = pr.color; ctx.shadowColor = pr.color; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(pr.x, pr.y, 12, 0, 7); ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (const f of this.fighters) this.drawFighter(ctx, f);
    for (const s of this.sparks) {
      ctx.globalAlpha = clamp(s.ttl * 2.5, 0, 1);
      ctx.fillStyle = s.color; ctx.fillRect(s.x, s.y, 4, 4);
    }
    ctx.globalAlpha = 1;
    this.drawFightHud(ctx);
    if (this.phase === 'intro' || this.phase === 'msg') {
      txt(ctx, this.msg, this.W / 2, 200, { size: 26, color: '#ffd76b', align: 'center', glow: 22 });
    }
    if (this.phase === 'ko') txt(ctx, 'K.O.!', this.W / 2, 200, { size: 40, color: '#ff5a5a', align: 'center', glow: 26 });
  }

  drawFighter(ctx, f) {
    const c = f.color;
    const x = f.x, y = f.y, w = f.w, h = f.h;
    ctx.save();
    if (f.state === 'ko') { ctx.translate(x + w / 2, y + h); ctx.rotate(Math.PI / 2 * (f.face > 0 ? -1 : 1) * 0.9); ctx.translate(-(x + w / 2), -(y + h)); }
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath(); ctx.ellipse(x + w / 2, 496, w * 0.6, 8, 0, 0, 7); ctx.fill();
    // legs
    ctx.fillStyle = f.idx === 0 ? this.o.p1.pants : this.o.p2.pants;
    const walk = f.state === 'walk' ? Math.sin(f.animT * 12) * 6 : 0;
    ctx.fillRect(x + 6 + walk, y + h * 0.62, 12, h * 0.38);
    ctx.fillRect(x + w - 18 - walk, y + h * 0.62, 12, h * 0.38);
    // torso
    ctx.fillStyle = c;
    ctx.fillRect(x + 4, y + h * 0.26, w - 8, h * 0.4);
    // belt
    ctx.fillStyle = '#222'; ctx.fillRect(x + 4, y + h * 0.6, w - 8, 5);
    // head
    ctx.fillStyle = '#ffcf9e';
    ctx.fillRect(x + 10, y, w - 20, h * 0.24);
    // headband
    ctx.fillStyle = c; ctx.fillRect(x + 10, y + 2, w - 20, 5);
    // eyes
    ctx.fillStyle = '#102030';
    const ex = f.face > 0 ? x + w * 0.55 : x + w * 0.25;
    ctx.fillRect(ex, y + 10, 4, 4);
    // arms
    ctx.fillStyle = '#ffcf9e';
    if (f.state === 'punch') {
      const ext = f.face > 0 ? 26 : -26;
      ctx.fillRect(x + (f.face > 0 ? w - 6 : -20 + ext), y + h * 0.32, 28, 8);
    } else if (f.state === 'special') {
      ctx.fillRect(x + (f.face > 0 ? w - 4 : -14), y + h * 0.3, 20, 10);
      ctx.fillStyle = f.idx === 0 ? this.o.p1.specialColor : this.o.p2.specialColor;
      ctx.beginPath(); ctx.arc(x + (f.face > 0 ? w + 16 : -14), y + h * 0.35, 8, 0, 7); ctx.fill();
    } else {
      ctx.fillRect(x + (f.face > 0 ? -4 : w - 8), y + h * 0.32, 10, h * 0.3);
      ctx.fillRect(x + (f.face > 0 ? w - 2 : 2), y + h * 0.32, 10, h * 0.3);
    }
    // kick leg
    if (f.state === 'kick') {
      ctx.fillStyle = f.idx === 0 ? this.o.p1.pants : this.o.p2.pants;
      ctx.fillRect(x + (f.face > 0 ? w - 8 : -34), y + h * 0.5, 42, 10);
    }
    if (f.state === 'block') {
      ctx.strokeStyle = '#9fd4ff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(x + w / 2 + f.face * 10, y + h * 0.4, 30, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  drawFightHud(ctx) {
    const o = this.o;
    const names = [o.p1.name, o.p2.name];
    for (let i = 0; i < 2; i++) {
      const f = this.fighters[i];
      const bw = 330;
      const bx = i === 0 ? 40 : this.W - 40 - bw;
      const by = 26;
      ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, bx, by, bw, 20, 6); ctx.fill();
      const hpw = bw * (f.hp / 100);
      const hpGrad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      hpGrad.addColorStop(0, i === 0 ? '#5db8ff' : '#ff6b7a');
      hpGrad.addColorStop(1, i === 0 ? '#9fe0ff' : '#ffb0b8');
      ctx.fillStyle = hpGrad;
      if (i === 0) { rr(ctx, bx, by, hpw, 20, 6); ctx.fill(); }
      else { rr(ctx, bx + bw - hpw, by, hpw, 20, 6); ctx.fill(); }
      txt(ctx, names[i], i === 0 ? bx : bx + bw, by + 34, { size: 10, color: '#fff', align: i === 0 ? 'left' : 'right' });
      // round pips
      for (let r = 0; r < o.roundsToWin; r++) {
        ctx.fillStyle = r < this.roundWins[i] ? '#ffd76b' : 'rgba(255,255,255,.2)';
        ctx.beginPath();
        ctx.arc(i === 0 ? bx + bw - 10 - r * 18 : bx + 10 + r * 18, by + 34, 6, 0, 7); ctx.fill();
      }
    }
    txt(ctx, Math.ceil(this.timeLeft).toString(), this.W / 2, 36, { size: 20, color: '#fff', align: 'center', glow: 12 });
  }

  onGround() { return true; }
}

/* ============================================================
   VertShooter — vertical shooter (1942 / Galaga)
   ============================================================ */
class VertShooter extends Game {
  constructor(host, opts = {}) {
    super(host);
    this.o = Object.assign({
      waves: 5, formation: 'grid', enemyColor: '#7dff9a', bulletColor: '#ffd76b',
      playerColor: '#5db8ff', enemyFireRate: 1.4, enemyHp: 1, dive: true, scorePer: 100
    }, opts);
  }

  init() {
    this.ships = [{
      x: this.is2P ? this.W * 0.35 : this.W / 2, y: this.H - 70, w: 34, h: 30,
      cd: 0, inv: 2, dead: 0, idx: 0, lives: 3
    }];
    if (this.is2P) this.ships.push({
      x: this.W * 0.65, y: this.H - 70, w: 34, h: 30, cd: 0, inv: 2, dead: 0, idx: 1, lives: 3
    });
    this.pBullets = []; this.eBullets = []; this.parts = [];
    this.stars = [];
    for (let i = 0; i < 70; i++) this.stars.push({ x: rnd(this.W), y: rnd(this.H), v: rnd(30, 130), s: rnd(1, 3) });
    this.wave = 0;
    this.enemies = [];
    this.waveMsgT = 1.4;
    this.spawnWave();
  }

  spawnWave() {
    this.wave++;
    if (this.wave > this.o.waves) { this.win1P('ALL WAVES CLEARED!'); return; }
    this.waveMsgT = 1.6;
    this.enemies = [];
    const n = 8 + this.wave * 2;
    if (this.o.formation === 'grid') {
      const cols = 6, rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        this.enemies.push({
          x: 120 + c * ((this.W - 240) / (cols - 1)), y: -40 - r * 50,
          tx: 120 + c * ((this.W - 240) / (cols - 1)), ty: 90 + r * 52,
          w: 30, h: 24, hp: this.o.enemyHp, t: rnd(6), state: 'enter', score: this.o.scorePer + r * 20
        });
      }
    } else {
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / 6), c = i % 6;
        this.enemies.push({
          x: 100 + c * 130 + (r % 2) * 40, y: -60 - r * 70 - i * 4,
          tx: 0, ty: 0, w: 32, h: 26, hp: this.o.enemyHp, t: rnd(6),
          state: 'sine', vy: 60 + this.wave * 8, ph: rnd(6), score: this.o.scorePer
        });
      }
    }
  }

  update(dt) {
    this.t += dt; this.frame++;
    this.waveMsgT = Math.max(0, this.waveMsgT - dt);
    for (const s of this.stars) { s.y += s.v * dt; if (s.y > this.H) { s.y = -3; s.x = rnd(this.W); } }

    // ships
    for (const sh of this.ships) {
      if (sh.dead > 0) {
        sh.dead -= dt;
        if (sh.dead <= 0) {
          if (sh.lives < 0) { sh.gone = true; if (this.ships.every(s => s.gone)) { this.lose1P(); return; } }
          else { sh.x = sh.idx === 0 ? this.W * 0.35 : this.W * 0.65; sh.y = this.H - 70; sh.inv = 2; }
        }
        continue;
      }
      const inp = sh.idx === 0 ? this.in.p1 : this.in.p2;
      sh.inv = Math.max(0, sh.inv - dt);
      sh.cd = Math.max(0, sh.cd - dt);
      const sp = 330;
      if (inp.left) sh.x -= sp * dt;
      if (inp.right) sh.x += sp * dt;
      if (inp.up) sh.y -= sp * dt;
      if (inp.down) sh.y += sp * dt;
      sh.x = clamp(sh.x, 20, this.W - 54); sh.y = clamp(sh.y, 60, this.H - 50);
      if (inp.actionPressed && sh.cd <= 0) {
        sh.cd = 0.24;
        this.pBullets.push({ x: sh.x + 15, y: sh.y - 6, vy: -640, from: sh.idx });
        this.audio.shoot();
      }
    }
    this.ships = this.ships.filter(s => !s.gone);

    // enemies
    let alive = 0;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      alive++;
      e.t += dt;
      if (e.state === 'enter') {
        e.y += 90 * dt;
        if (e.y >= e.ty) e.state = 'hold';
      } else if (e.state === 'hold') {
        e.x = e.tx + Math.sin(e.t * 1.2 + e.ph || 0) * 14;
        if (this.o.dive && chance(dt * 0.12)) { e.state = 'dive'; e.dvx = (this.ships[0] ? Math.sign(this.ships[0].x - e.x) : 1) * rnd(40, 90); }
      } else if (e.state === 'dive') {
        e.y += (160 + this.wave * 14) * dt;
        e.x += e.dvx * dt;
        if (e.y > this.H + 40) { e.y = -40; e.x = rnd(80, this.W - 80); e.state = 'enter'; e.ty = rnd(80, 200); }
      } else if (e.state === 'sine') {
        e.y += e.vy * dt;
        e.x += Math.sin(e.t * 2 + e.ph) * 90 * dt;
        e.x = clamp(e.x, 20, this.W - 50);
        if (e.y > this.H + 40) { e.y = -40; e.x = rnd(60, this.W - 60); }
      }
      // fire
      if (chance(dt * (0.5 + this.wave * 0.15) / this.o.enemyFireRate) && e.y > 0 && e.y < this.H - 160) {
        this.eBullets.push({ x: e.x + e.w / 2, y: e.y + e.h, vy: 200 + this.wave * 18 });
      }
      // collide ships
      for (const sh of this.ships) {
        if (sh.dead > 0 || sh.inv > 0) continue;
        if (aabb(sh, e)) { this.killShip(sh); e.hp = 0; }
      }
    }
    if (alive === 0 && this.wave <= this.o.waves) this.spawnWave();

    // bullets
    for (const b of this.pBullets) {
      b.y += b.vy * dt;
      if (b.y < -10) b.dead = true;
      for (const e of this.enemies) {
        if (e.hp <= 0) continue;
        if (b.x > e.x && b.x < e.x + e.w && b.y > e.y && b.y < e.y + e.h) {
          e.hp--; b.dead = true;
          if (e.hp <= 0) { this.addScore(e.score, b.from); this.audio.hit(); this.boom(e.x + e.w / 2, e.y + e.h / 2); }
          break;
        }
      }
    }
    this.pBullets = this.pBullets.filter(b => !b.dead);
    for (const b of this.eBullets) {
      b.y += b.vy * dt;
      if (b.y > this.H + 10) b.dead = true;
      for (const sh of this.ships) {
        if (sh.dead > 0 || sh.inv > 0) continue;
        if (b.x > sh.x + 4 && b.x < sh.x + sh.w - 4 && b.y > sh.y + 4 && b.y < sh.y + sh.h) {
          b.dead = true; this.killShip(sh);
        }
      }
    }
    this.eBullets = this.eBullets.filter(b => !b.dead);
    for (const p of this.parts) { p.ttl -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter(p => p.ttl > 0);
  }

  killShip(sh) {
    sh.lives--; sh.dead = 1.2;
    this.audio.explode();
    this.boom(sh.x + 17, sh.y + 15, true);
    if (this.ships.length === 1 && sh.lives < 0) this.lose1P();
  }

  boom(x, y, big) {
    for (let i = 0; i < (big ? 22 : 12); i++) this.parts.push({
      x, y, vx: rnd(-220, 220), vy: rnd(-220, 220), ttl: rnd(0.3, 0.8),
      color: pick(['#ffd76b', '#ff8a3a', '#fff'])
    });
  }

  render(ctx) {
    ctx.fillStyle = '#040814'; ctx.fillRect(0, 0, this.W, this.H);
    for (const s of this.stars) {
      ctx.globalAlpha = 0.3 + s.s * 0.2;
      ctx.fillStyle = '#9fd4ff';
      ctx.fillRect(s.x, s.y, s.s, s.s + 3);
    }
    ctx.globalAlpha = 1;
    for (const e of this.enemies) {
      if (e.hp <= 0) continue;
      this.drawEnemyShip(ctx, e);
    }
    for (const b of this.pBullets) {
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#8fe0ff'; ctx.shadowBlur = 8;
      ctx.fillRect(b.x - 2, b.y - 10, 4, 14); ctx.shadowBlur = 0;
    }
    for (const b of this.eBullets) {
      ctx.fillStyle = this.o.bulletColor; ctx.shadowColor = this.o.bulletColor; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
    for (const sh of this.ships) {
      if (sh.dead > 0) continue;
      if (sh.inv > 0 && Math.floor(this.t * 12) % 2 === 0) continue;
      this.drawShip(ctx, sh);
    }
    for (const p of this.parts) {
      ctx.globalAlpha = clamp(p.ttl * 2, 0, 1);
      ctx.fillStyle = p.color; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }
    ctx.globalAlpha = 1;
    if (this.waveMsgT > 0) txt(ctx, `WAVE ${this.wave} / ${this.o.waves}`, this.W / 2, this.H / 2 - 40, { size: 18, color: '#fff', align: 'center', glow: 16 });
  }

  drawShip(ctx, sh) {
    const c = sh.idx === 0 ? this.o.playerColor : '#ff8d99';
    const x = sh.x, y = sh.y;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x + 17, y); ctx.lineTo(x + 32, y + 28); ctx.lineTo(x + 22, y + 24);
    ctx.lineTo(x + 17, y + 30); ctx.lineTo(x + 12, y + 24); ctx.lineTo(x + 2, y + 28);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eaf6ff'; ctx.fillRect(x + 14, y + 8, 6, 10);
    ctx.fillStyle = '#ff9a3a';
    const fl = rnd(6, 14);
    ctx.fillRect(x + 14, y + 30, 6, fl);
  }

  drawEnemyShip(ctx, e) {
    const x = e.x, y = e.y;
    ctx.fillStyle = this.o.enemyColor;
    if (this.o.formation === 'grid') {
      ctx.beginPath();
      ctx.moveTo(x + 15, y + 4); ctx.lineTo(x + 28, y + 20); ctx.lineTo(x + 15, y + 16);
      ctx.lineTo(x + 2, y + 20); ctx.closePath(); ctx.fill();
      ctx.fillRect(x + 8, y, 14, 8);
      ctx.fillStyle = '#ff5a5a'; ctx.fillRect(x + 11, y + 8, 3, 3); ctx.fillRect(x + 17, y + 8, 3, 3);
    } else {
      ctx.beginPath(); ctx.ellipse(x + 16, y + 12, 15, 9, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#3a5a3a'; ctx.fillRect(x + 10, y + 2, 12, 8);
      ctx.fillStyle = '#ff5a5a'; ctx.fillRect(x + 13, y + 4, 3, 3); ctx.fillRect(x + 18, y + 4, 3, 3);
    }
  }

  drawHud(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.55)'; ctx.fillRect(0, 0, this.W, 34);
    txt(ctx, `P1 ${padScore(this.scores[0])}`, 14, 17, { size: 10, color: '#7fc4ff' });
    if (this.is2P) txt(ctx, `P2 ${padScore(this.scores[1])}`, this.W - 14, 17, { size: 10, color: '#ff8d99', align: 'right' });
    else txt(ctx, `WAVE ${this.wave}/${this.o.waves}`, this.W - 14, 17, { size: 10, color: '#8fa8c8', align: 'right' });
    for (const sh of this.ships) {
      const lx = sh.idx === 0 ? 160 : this.W - 260;
      const col = sh.idx === 0 ? '#7fc4ff' : '#ff8d99';
      for (let i = 0; i < clamp(sh.lives, 0, 4); i++) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(lx + i * 20, 12); ctx.lineTo(lx + 8 + i * 20, 26); ctx.lineTo(lx + 16 + i * 20, 12);
        ctx.lineTo(lx + 8 + i * 20, 8); ctx.fill();
      }
    }
    ctx.restore();
  }
}

/* ============================================================
   BrawlerGame — beat'em up (Double Dragon scroll / TMNT2 arena)
   ============================================================ */
class BrawlerGame extends Game {
  constructor(host, opts = {}) {
    super(host);
    this.o = Object.assign({
      scrolling: true, len: 2400, waves: 4, enemiesPerWave: 4,
      enemyColor: '#8a4bd8', enemySpeed: 90, boss: true,
      p1Color: '#4d9dff', p2Color: '#ff5a5a', enemyStyle: 'punk',
      arena: false, arenaWaves: 5
    }, opts);
  }

  init() {
    this.players = [{
      x: 140, y: 380, w: 30, h: 56, vx: 0, vy: 0, face: 1, cd: 0, atkT: 0, atkType: null,
      hitDone: false, inv: 0, dead: 0, animT: 0, idx: 0, lives: 3, color: this.o.p1Color, input: 'p1'
    }];
    if (this.is2P) this.players.push({
      x: 190, y: 380, w: 30, h: 56, vx: 0, vy: 0, face: 1, cd: 0, atkT: 0, atkType: null,
      hitDone: false, inv: 0, dead: 0, animT: 0, idx: 1, lives: 3, color: this.o.p2Color, input: 'p2'
    });
    this.enemies = [];
    this.parts = [];
    this.camX = 0;
    this.wave = 0;
    this.spawnGate = 400;
    this.nextWave();
  }

  nextWave() {
    this.wave++;
    if (!this.o.arena && this.wave > this.o.waves) {
      if (this.o.boss && !this.bossSpawned) { this.bossSpawned = true; this.spawnBoss(); return; }
      this.win1P('STREETS CLEARED!');
      return;
    }
    if (this.o.arena && this.wave > this.o.arenaWaves) { this.win1P('ALL WAVES CLEARED!'); return; }
    const n = this.o.arena ? 2 + this.wave : this.o.enemiesPerWave;
    for (let i = 0; i < n; i++) {
      const fromRight = chance(0.6);
      this.enemies.push({
        x: this.o.arena ? (fromRight ? rnd(this.W - 200, this.W - 80) : rnd(80, 200)) : this.camX + this.W + 60 + i * 50,
        y: rnd(330, 430), w: 28, h: 52, vx: 0, face: -1, hp: 3, cd: rnd(0.5, 1.5),
        atkT: 0, animT: rnd(6), dead: 0, speed: this.o.enemySpeed + this.wave * 8, score: 200
      });
    }
    this.waveMsgT = 1.4;
  }

  spawnBoss() {
    this.enemies.push({
      x: this.camX + this.W + 80, y: 340, w: 40, h: 70, vx: 0, face: -1, hp: 14, cd: 1,
      atkT: 0, animT: 0, dead: 0, speed: 110, score: 1500, boss: true
    });
    this.waveMsgT = 1.6;
  }

  update(dt) {
    this.t += dt; this.frame++;
    this.waveMsgT = Math.max(0, (this.waveMsgT || 0) - dt);
    for (const p of this.parts) { p.ttl -= dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter(p => p.ttl > 0);

    for (const p of this.players) {
      if (p.dead > 0) {
        p.dead -= dt;
        if (p.dead <= 0) {
          if (p.lives < 0) {
            p.gone = true;
            if (this.players.every(q => q.gone)) { this.lose1P(); return; }
          } else { p.x = this.camX + 120; p.y = 380; p.inv = 2; }
        }
        continue;
      }
      const inp = this.in[p.input];
      p.animT += dt; p.cd = Math.max(0, p.cd - dt); p.atkT = Math.max(0, p.atkT - dt);
      p.inv = Math.max(0, p.inv - dt);
      let dir = 0;
      if (inp.left) dir -= 1;
      if (inp.right) dir += 1;
      let vdir = 0;
      if (inp.up) vdir -= 1;
      if (inp.down) vdir += 1;
      if (p.atkT <= 0) {
        p.vx = dir * 240; p.vy = vdir * 180;
        if (dir !== 0) p.face = dir;
      } else { p.vx *= 0.8; p.vy *= 0.8; }
      p.x = clamp(p.x + p.vx * dt, this.o.arena ? 30 : this.camX + 10, this.o.arena ? this.W - 60 : this.camX + this.W - 40);
      p.y = clamp(p.y + p.vy * dt, 300, 460);
      if (inp.actionPressed && p.cd <= 0) { p.cd = 0.34; p.atkT = 0.2; p.atkType = 'punch'; p.hitDone = false; this.audio.blip(500); }
      if (inp.secondaryPressed && p.cd <= 0) { p.cd = 0.55; p.atkT = 0.26; p.atkType = 'kick'; p.hitDone = false; this.audio.blip(360); }
      // attacks
      if (p.atkT > 0 && !p.hitDone) {
        const rg = p.atkType === 'punch' ? 46 : 58;
        const dmg = p.atkType === 'punch' ? 1 : 2;
        const hx = p.face > 0 ? p.x + p.w : p.x - rg;
        const box = { x: hx, y: p.y, w: rg, h: p.h };
        for (const e of this.enemies) {
          if (e.dead > 0) continue;
          if (aabb(box, e)) {
            p.hitDone = true;
            e.hp -= dmg;
            e.vx = p.face * 260;
            this.audio.hit();
            this.parts.push({ x: e.x + e.w / 2, y: e.y + 14, vx: rnd(-100, 100), vy: -140, ttl: 0.4, color: '#ffd76b' });
            if (e.hp <= 0) { e.dead = 0.5; this.addScore(e.score, p.idx); }
            break;
          }
        }
      }
    }

    // enemies
    for (const e of this.enemies) {
      if (e.dead > 0) { e.dead -= dt; e.x += e.vx * dt; e.vx *= 0.9; continue; }
      e.animT += dt;
      const tgt = this.players.filter(p => !p.dead && !p.gone).sort((a, b) => Math.abs(a.x - e.x) - Math.abs(b.x - e.x))[0];
      if (tgt) {
        const dx = tgt.x - e.x, dy = tgt.y - e.y;
        e.face = dx > 0 ? 1 : -1;
        e.cd = Math.max(0, e.cd - dt);
        if (e.atkT > 0) {
          e.atkT -= dt;
          if (!e.hitDone && e.atkT < 0.12) {
            e.hitDone = true;
            const rg = 44;
            const hx = e.face > 0 ? e.x + e.w : e.x - rg;
            if (aabb({ x: hx, y: e.y, w: rg, h: e.h }, tgt) && tgt.inv <= 0) {
              tgt.lives--; tgt.inv = 1.2; this.audio.hurt();
              tgt.vx = 0;
              this.parts.push({ x: tgt.x + 15, y: tgt.y + 10, vx: rnd(-80, 80), vy: -160, ttl: 0.4, color: '#ff6b7a' });
              if (tgt.lives < 0) { tgt.dead = 1.2; this.audio.explode(); }
            }
          }
        } else if (Math.abs(dx) > 44 || Math.abs(dy) > 10) {
          e.x += Math.sign(dx) * e.speed * dt;
          e.y += clamp(dy, -1, 1) * 40 * dt;
        } else if (e.cd <= 0) {
          e.atkT = 0.3; e.hitDone = false; e.cd = rnd(0.9, 1.6);
        }
      }
      e.x += e.vx * dt; e.vx *= 0.85;
      e.y = clamp(e.y, 300, 460);
    }
    this.enemies = this.enemies.filter(e => e.dead <= 0);
    if (this.enemies.length === 0) this.nextWave();

    // camera
    if (!this.o.arena) {
      const focus = Math.max(...this.players.map(p => p.x));
      this.camX = clamp(focus - this.W * 0.4, 0, this.o.len - this.W);
    }
  }

  render(ctx) {
    // street bg
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#141c34'); grad.addColorStop(1, '#0a0e1c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    ctx.save();
    if (!this.o.arena) ctx.translate(-this.camX, 0);
    const ox = this.o.arena ? 0 : this.camX;
    // buildings
    for (let i = 0; i < 14; i++) {
      const bx = i * 220 - (ox * 0.5) % 220;
      ctx.fillStyle = i % 2 ? '#1a2440' : '#16203a';
      ctx.fillRect(bx, 120 + (i % 3) * 30, 170, 320);
      ctx.fillStyle = 'rgba(255,220,130,.25)';
      for (let wy = 0; wy < 5; wy++) for (let wx = 0; wx < 3; wx++)
        if ((i * 7 + wy * 3 + wx) % 4 === 0) ctx.fillRect(bx + 18 + wx * 48, 150 + wy * 52, 22, 26);
    }
    // road
    ctx.fillStyle = '#232a3e'; ctx.fillRect(0 - (this.o.arena ? 0 : ox), 480, this.W + (this.o.arena ? 0 : ox + this.o.len), 60);
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    for (let i = 0; i < 30; i++) ctx.fillRect(i * 90 - (ox * 1) % 90, 505, 40, 4);

    for (const e of this.enemies) {
      ctx.globalAlpha = e.dead > 0 ? 0.5 : 1;
      drawDude(ctx, e.x, e.y, e.w, e.h, e.boss ? '#c23a3a' : this.o.enemyColor, { face: e.face, walk: true, animT: e.animT });
      if (e.boss) { ctx.fillStyle = '#ffd76b'; ctx.fillRect(e.x + 4, e.y - 8, e.w - 8, 5); }
      ctx.globalAlpha = 1;
    }
    for (const p of this.players) {
      if (p.gone) continue;
      if (p.dead > 0) continue;
      if (p.inv > 0 && Math.floor(this.t * 12) % 2 === 0) continue;
      drawDude(ctx, p.x, p.y, p.w, p.h, p.color, { face: p.face, walk: Math.abs(p.vx) > 20, animT: p.animT });
      if (p.atkT > 0) {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.globalAlpha = 0.7;
        const rg = p.atkType === 'punch' ? 46 : 58;
        ctx.beginPath();
        ctx.arc(p.face > 0 ? p.x + p.w : p.x, p.y + 18, rg * 0.7, p.face > 0 ? -0.8 : Math.PI - 0.8, p.face > 0 ? 0.8 : Math.PI + 0.8);
        ctx.stroke(); ctx.globalAlpha = 1;
      }
    }
    for (const pt of this.parts) {
      ctx.globalAlpha = clamp(pt.ttl * 2, 0, 1);
      ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, 5, 5);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (this.waveMsgT > 0) {
      const label = this.enemies.some(e => e.boss) ? '⚠ BOSS!' : `WAVE ${this.wave}`;
      txt(ctx, label, this.W / 2, 120, { size: 20, color: '#ffd76b', align: 'center', glow: 18 });
    }
  }

  drawHud(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.55)'; ctx.fillRect(0, 0, this.W, 34);
    this.players.forEach((p, i) => {
      const bx = i === 0 ? 14 : this.W - 214;
      const col = i === 0 ? '#7fc4ff' : '#ff8d99';
      txt(ctx, `P${i + 1} ${padScore(this.scores[i])}`, i === 0 ? bx : bx + 200, 17, { size: 10, color: col, align: i === 0 ? 'left' : 'right' });
      for (let h = 0; h < clamp(p.lives, 0, 4); h++) {
        ctx.fillStyle = col;
        ctx.font = '14px serif';
        ctx.fillText('❤', i === 0 ? bx + 110 + h * 18 : bx + 90 + h * 18, 24);
      }
    });
    if (!this.o.arena) {
      const prog = clamp(this.camX / (this.o.len - this.W), 0, 1);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(this.W / 2 - 90, 14, 180, 6);
      ctx.fillStyle = '#ffd76b'; ctx.fillRect(this.W / 2 - 90, 14, 180 * prog, 6);
    } else {
      txt(ctx, `WAVE ${this.wave}/${this.o.arenaWaves}`, this.W / 2, 17, { size: 10, color: '#e8f4ff', align: 'center' });
    }
    ctx.restore();
  }
}

window.PlatGame = PlatGame;
window.FighterGame = FighterGame;
window.VertShooter = VertShooter;
window.BrawlerGame = BrawlerGame;
