/* ============================================================
   Framework — Game base class + GameHost lifecycle
   States: title -> (ready 2P) -> play <-> pause -> over
   ============================================================ */
const GAME_W = 960, GAME_H = 540;

/* ---------- small helpers ---------- */
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a = 1, b) { return b === undefined ? Math.random() * a : a + Math.random() * (b - a); }
function rndInt(a, b) { return Math.floor(rnd(a, b + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p) { return Math.random() < p; }
function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function dist2(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return dx * dx + dy * dy; }

/* seeded RNG for deterministic levels */
function makeRNG(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function txt(ctx, s, x, y, o = {}) {
  const size = o.size || 16;
  const px = o.px !== undefined ? o.px : true;
  ctx.save();
  ctx.globalAlpha = o.alpha !== undefined ? o.alpha : 1;
  ctx.font = px
    ? `${size}px 'Press Start 2P','Courier New',monospace`
    : `bold ${size}px 'Segoe UI',system-ui,sans-serif`;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.glow) { ctx.shadowColor = o.glowColor || o.color || '#fff'; ctx.shadowBlur = o.glow; }
  ctx.fillStyle = o.color || '#fff';
  ctx.fillText(s, x, y);
  ctx.restore();
}

function padScore(n, len = 6) { return String(Math.max(0, Math.floor(n))).padStart(len, '0'); }

/* draw a tiny pixel person (used by many games) */
function drawDude(ctx, x, y, w, h, color, o = {}) {
  // head
  ctx.fillStyle = o.skin || '#ffcf9e';
  ctx.fillRect(x + w * 0.2, y, w * 0.6, h * 0.28);
  // hair/band
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.2, y, w * 0.6, h * 0.1);
  // body
  ctx.fillStyle = color;
  ctx.fillRect(x + w * 0.12, y + h * 0.3, w * 0.76, h * 0.42);
  // legs
  ctx.fillStyle = o.legs || '#28324a';
  const lo = o.walk ? Math.sin((o.animT || 0) * 14) * w * 0.14 : 0;
  ctx.fillRect(x + w * 0.16 + lo, y + h * 0.72, w * 0.26, h * 0.28);
  ctx.fillRect(x + w * 0.58 - lo, y + h * 0.72, w * 0.26, h * 0.28);
  // eyes
  ctx.fillStyle = '#102030';
  const ex = o.face < 0 ? x + w * 0.28 : x + w * 0.52;
  ctx.fillRect(ex, y + h * 0.12, w * 0.1, h * 0.08);
  ctx.fillRect(ex + w * 0.14, y + h * 0.12, w * 0.1, h * 0.08);
}

/* ============================================================
   Game base class
   ============================================================ */
class Game {
  constructor(host) {
    this.host = host;
    this.ctx = host.ctx;
    this.W = host.W;
    this.H = host.H;
    this.mode = host.mode;          // 1 or 2
    this.in = host.input;           // .p1 / .p2
    this.audio = host.audio;
    this.scores = [0, 0];
    this.lives = [3, 3];
    this.round = 1;
    this.t = 0;                     // elapsed seconds
    this.frame = 0;
    this.finished = false;
    this.result = null;
  }
  get is2P() { return this.mode === 2; }
  addScore(n, p = 0) { this.scores[p] = (this.scores[p] || 0) + n; }
  end(result) {
    if (this.finished) return;
    this.finished = true;
    this.result = result || { type: 'gameover' };
    this.host.gameOver(this.result);
  }
  win1P(title) { this.end({ type: 'victory', title: title || 'VICTORY!' }); }
  lose1P()    { this.end({ type: 'gameover' }); }
  wins(p)     { this.end({ type: p === 0 ? 'p1wins' : 'p2wins' }); }
  drawEnd()   { this.end({ type: 'draw' }); }

  /* default HUD: scores + lives */
  drawHud(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.55)';
    ctx.fillRect(0, 0, this.W, 34);
    txt(ctx, `P1 ${padScore(this.scores[0])}`, 14, 17, { size: 10, color: '#7fc4ff', align: 'left' });
    if (this.is2P) txt(ctx, `P2 ${padScore(this.scores[1])}`, this.W - 14, 17, { size: 10, color: '#ff8d99', align: 'right' });
    else txt(ctx, `HI ${padScore(this.hiScore || 0)}`, this.W - 14, 17, { size: 10, color: '#8fa8c8', align: 'right' });
    if (this.round > 1 || this.showRound) txt(ctx, `ROUND ${this.round}`, this.W / 2, 17, { size: 10, color: '#e8f4ff', align: 'center' });
    // lives hearts
    for (let i = 0; i < Math.max(0, this.lives[0]); i++) { ctx.fillStyle = '#7fc4ff'; ctx.fillText('❤', 150 + i * 18, 24); }
    if (this.is2P) for (let i = 0; i < Math.max(0, this.lives[1]); i++) { ctx.fillStyle = '#ff8d99'; ctx.fillText('❤', this.W - 200 + i * 18, 24); }
    ctx.restore();
  }

  init() {}
  update(dt) {}
  render(ctx) {}

  controlsHint() {
    return 'P PAUSE · ESC MENU';
  }
}

/* ============================================================
   GameHost — canvas state machine
   ============================================================ */
class GameHost {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.W = GAME_W; this.H = GAME_H;
    this.audio = opts.audio;
    this.input = opts.input;
    this.onExit = opts.onExit || (() => {});
    this.state = 'idle';
    this.gameDef = null;
    this.mode = 1;
    this.game = null;
    this._last = 0;
    this._raf = null;
    this._overSel = 0;
    this._stars = [];
    for (let i = 0; i < 90; i++) this._stars.push({ x: rnd(GAME_W), y: rnd(GAME_H), s: rnd(0.4, 1.6), v: rnd(6, 30) });
    this._bindKeys();
  }

  _bindKeys() {
    this._keyHandler = (e) => {
      if (this.state === 'title' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
        e.preventDefault(); this._confirmTitle();
      } else if (this.state === 'ready' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) {
        e.preventDefault(); this._beginPlay();
      } else if (this.state === 'play' && e.code === 'KeyP') {
        this.togglePause();
      } else if (this.state === 'play' && e.code === 'Escape') {
        this.exit();
      } else if (this.state === 'pause' && (e.code === 'KeyP' || e.code === 'Escape')) {
        if (e.code === 'KeyP') this.togglePause(); else this.exit();
      } else if (this.state === 'over') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { this._overSel = (this._overSel + 1) % 2; this.audio.navigate(); }
        else if (e.code === 'ArrowDown' || e.code === 'KeyS') { this._overSel = (this._overSel + 1) % 2; this.audio.navigate(); }
        else if (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter') {
          e.preventDefault();
          if (this._overSel === 0) this.restart(); else this.exit();
        } else if (e.code === 'Escape') this.exit();
      }
    };
    window.addEventListener('keydown', this._keyHandler);
    this._clickHandler = () => {
      if (this.state === 'title') this._confirmTitle();
      else if (this.state === 'ready') this._beginPlay();
    };
    this.canvas.addEventListener('pointerdown', this._clickHandler);
  }

  destroy() {
    window.removeEventListener('keydown', this._keyHandler);
    this.canvas.removeEventListener('pointerdown', this._clickHandler);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  start(gameDef, mode) {
    this.gameDef = gameDef;
    if (typeof gameDef.game === 'string') gameDef.gameClass = window[gameDef.game];
    this.mode = mode || 1;
    this.state = 'title';
    this._overSel = 0;
    this._spawnGame();
    if (this._raf) cancelAnimationFrame(this._raf);
    this._last = performance.now();
    this._raf = requestAnimationFrame(t => this._loop(t));
  }

  restart() {
    this.audio.start();
    this.state = this.mode === 2 ? 'ready' : 'title';
    this._overSel = 0;
    this._spawnGame();
  }

  _spawnGame() {
    this.game = new this.gameDef.gameClass(this);
    try { this.game.init(); } catch (e) { console.error('game init error', e); }
  }

  _confirmTitle() {
    this.audio.start();
    if (this.mode === 2) this.state = 'ready';
    else this._beginPlay();
  }
  _beginPlay() { this.state = 'play'; }

  togglePause() {
    if (this.state === 'play') { this.state = 'pause'; this.audio.pause(); }
    else if (this.state === 'pause') { this.state = 'play'; this.audio.pause(); }
  }

  exit() {
    this.state = 'idle';
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    this.onExit();
  }

  gameOver(result) {
    this.state = 'over';
    this._overSel = 0;
    if (result.type === 'gameover') this.audio.lose(); else this.audio.win();
  }

  _loop(now) {
    this._raf = requestAnimationFrame(t => this._loop(t));
    const dt = Math.min(0.05, (now - this._last) / 1000);
    this._last = now;
    this.input.beginFrame();
    const ctx = this.ctx;

    if (this.state === 'title') this._renderTitle(ctx, dt);
    else if (this.state === 'ready') this._renderReady(ctx, dt);
    else if (this.state === 'play') {
      try { this.game.update(dt); } catch (e) { console.error('game update error', e); }
      try { this.game.render(ctx); } catch (e) { console.error('game render error', e); }
      try { this.game.drawHud(ctx); } catch (e) { /* hud optional */ }
      this._renderPauseHint(ctx);
    } else if (this.state === 'pause') {
      try { this.game.render(ctx); } catch (e) {}
      try { this.game.drawHud(ctx); } catch (e) {}
      this._renderPause(ctx);
    } else if (this.state === 'over') {
      try { this.game.render(ctx); } catch (e) {}
      try { this.game.drawHud(ctx); } catch (e) {}
      this._renderOver(ctx);
    }
  }

  _renderStars(ctx, dt) {
    ctx.save();
    for (const s of this._stars) {
      s.y += s.v * dt;
      if (s.y > this.H) { s.y = -4; s.x = rnd(this.W); }
      ctx.globalAlpha = 0.25 + s.s * 0.3;
      ctx.fillStyle = '#9fd4ff';
      ctx.fillRect(s.x, s.y, s.s * 2, s.s * 2);
    }
    ctx.restore();
  }

  _renderTitle(ctx, dt) {
    const g = this.gameDef;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#0a1a38'); grad.addColorStop(1, '#02040c');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    this._renderStars(ctx, dt);

    // glow orb
    const pulse = 0.5 + Math.sin(this.t0 = (this.t0 || 0) + dt * 2) * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.25 + pulse * 0.3;
    const rg = ctx.createRadialGradient(this.W / 2, 200, 10, this.W / 2, 200, 260);
    rg.addColorStop(0, 'rgba(80,180,255,.5)'); rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(this.W / 2 - 260, -60, 520, 520);
    ctx.restore();

    // icon
    ctx.font = '110px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(90,190,255,.9)'; ctx.shadowBlur = 40;
    ctx.fillText(g.icon, this.W / 2, 200);
    ctx.shadowBlur = 0;

    txt(ctx, g.name, this.W / 2, 300, { size: 26, color: '#ffffff', align: 'center', glow: 18, glowColor: 'rgba(90,190,255,.9)' });
    txt(ctx, g.genre.toUpperCase(), this.W / 2, 336, { size: 10, color: '#6fb6e8', align: 'center' });

    const blink = Math.sin(now2()) > 0;
    if (blink) txt(ctx, 'PRESS ENTER TO START', this.W / 2, 410, { size: 13, color: '#eaf6ff', align: 'center', glow: 12 });
    txt(ctx, this.mode === 2 ? 'MODE: 👥 2 PLAYERS' : 'MODE: 👤 1 PLAYER', this.W / 2, 452, { size: 9, color: this.mode === 2 ? '#ff8d99' : '#7fc4ff', align: 'center' });
    const hint = (this.game && this.game.controlsHint) ? this.game.controlsHint() : 'P PAUSE · ESC MENU';
    txt(ctx, hint, this.W / 2, 486, { size: 8, color: '#5c7a9c', align: 'center' });
  }

  _renderReady(ctx, dt) {
    const g = this.gameDef;
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, '#101c3e'); grad.addColorStop(1, '#04060f');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, this.W, this.H);
    this._renderStars(ctx, dt);

    txt(ctx, '2 PLAYERS', this.W / 2, 90, { size: 30, color: '#ffffff', align: 'center', glow: 24 });
    txt(ctx, g.icon + '  ' + g.name, this.W / 2, 150, { size: 14, color: '#9fd4ff', align: 'center' });

    // P1 card
    this._playerCard(ctx, this.W / 2 - 260, 210, 'PLAYER 1', '#3aa0ff', ['W A S D', 'SPACE — ACTION', 'L-SHIFT — SPECIAL']);
    // P2 card
    this._playerCard(ctx, this.W / 2 + 40, 210, 'PLAYER 2', '#ff4d5e', ['↑ ↓ ← →', 'ENTER — ACTION', 'R-SHIFT — SPECIAL']);

    const blink = Math.sin(now2()) > 0;
    if (blink) txt(ctx, 'READY?  PRESS ENTER TO START', this.W / 2, 470, { size: 13, color: '#eaf6ff', align: 'center', glow: 14 });
  }

  _playerCard(ctx, x, y, title, color, lines) {
    ctx.save();
    rr(ctx, x, y, 220, 190, 16);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.8; ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x + 30, y + 34, 12, 0, 7); ctx.fill();
    txt(ctx, title, x + 52, y + 34, { size: 12, color: '#fff', px: false });
    lines.forEach((l, i) => txt(ctx, l, x + 110, y + 78 + i * 30, { size: 9, color: '#cfe8ff', align: 'center' }));
    ctx.restore();
  }

  _renderPauseHint(ctx) {
    if ((this.game.frameHint || 0) > 0) return;
  }

  _renderPause(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.72)'; ctx.fillRect(0, 0, this.W, this.H);
    rr(ctx, this.W / 2 - 220, this.H / 2 - 90, 440, 180, 18);
    ctx.fillStyle = 'rgba(120,190,255,.07)'; ctx.fill();
    ctx.strokeStyle = 'rgba(140,210,255,.4)'; ctx.lineWidth = 2; ctx.stroke();
    txt(ctx, '⏸ PAUSED', this.W / 2, this.H / 2 - 34, { size: 24, color: '#fff', align: 'center', glow: 16 });
    txt(ctx, 'P — RESUME', this.W / 2, this.H / 2 + 14, { size: 11, color: '#9fd4ff', align: 'center' });
    txt(ctx, 'ESC — BACK TO MENU', this.W / 2, this.H / 2 + 44, { size: 11, color: '#9fd4ff', align: 'center' });
    ctx.restore();
  }

  _renderOver(ctx) {
    const r = this.game.result || { type: 'gameover' };
    ctx.save();
    ctx.fillStyle = 'rgba(2,6,16,.78)'; ctx.fillRect(0, 0, this.W, this.H);

    let title = 'GAME OVER', color = '#ff6b7a', icon = '💀';
    if (r.type === 'victory') { title = r.title || 'VICTORY!'; color = '#7dffb0'; icon = '🏆'; }
    if (r.type === 'p1wins') { title = 'PLAYER 1 WINS!'; color = '#5db8ff'; icon = '🔵'; }
    if (r.type === 'p2wins') { title = 'PLAYER 2 WINS!'; color = '#ff6b7a'; icon = '🔴'; }
    if (r.type === 'draw') { title = 'DRAW!'; color = '#ffd76b'; icon = '🤝'; }

    txt(ctx, icon + ' ' + title, this.W / 2, 170, { size: 30, color, align: 'center', glow: 26, glowColor: color });

    // scores
    const sc = this.game.scores || [0, 0];
    txt(ctx, `PLAYER 1 — ${padScore(sc[0])}`, this.W / 2, 240, { size: 12, color: '#7fc4ff', align: 'center' });
    if (this.mode === 2) txt(ctx, `PLAYER 2 — ${padScore(sc[1])}`, this.W / 2, 272, { size: 12, color: '#ff8d99', align: 'center' });

    const opts = ['▶ PLAY AGAIN', '☰ BACK TO MENU'];
    opts.forEach((o, i) => {
      const sel = this._overSel === i;
      txt(ctx, (sel ? '▸ ' : '') + o, this.W / 2, 350 + i * 44, {
        size: 14, color: sel ? '#ffffff' : '#6f93b8', align: 'center', glow: sel ? 14 : 0
      });
    });
    txt(ctx, '↑ ↓ SELECT · ENTER CONFIRM', this.W / 2, 470, { size: 8, color: '#5c7a9c', align: 'center' });
    ctx.restore();
  }
}

/* small helper for blinking text */
function now2() { return performance.now() / 260; }

window.Game = Game;
window.GameHost = GameHost;
window.GAME_W = GAME_W;
window.GAME_H = GAME_H;
window.clamp = clamp; window.lerp = lerp; window.rnd = rnd; window.rndInt = rndInt;
window.pick = pick; window.chance = chance; window.aabb = aabb; window.dist2 = dist2;
window.makeRNG = makeRNG; window.rr = rr; window.txt = txt; window.padScore = padScore;
window.drawDude = drawDude;
