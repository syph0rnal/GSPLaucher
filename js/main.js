/* ============================================================
   main.js — app orchestration: boot → loading → menu → game
   ============================================================ */
class App {
  constructor() {
    this.audio = new AudioEngine();
    this.audio.initTrack('music/fone.mp3');
    this.settings = Store.getSettings();
    this.audio.setVolume(this.settings.volume);
    this.audio.setSfx(this.settings.sfx);
    this.audio.setMusic(this.settings.music);

    this.input = new Input();
    this.menu = null;
    this.host = null;
    this.currentGame = null;

    this.screens = {
      boot: document.getElementById('bootScreen'),
      loading: document.getElementById('loadingScreen'),
      menu: document.getElementById('menuScreen'),
      mode: document.getElementById('modeScreen'),
      gameLoading: document.getElementById('gameLoading'),
      game: document.getElementById('gameScreen')
    };

    this._bindGlobalKeys();
    this._initLoadingParticles();
    this._boot();
  }

  show(name) {
    Object.entries(this.screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  }

  /* ============ BOOT ============ */
  _boot() {
    const onWake = () => {
      window.removeEventListener('keydown', onWake);
      window.removeEventListener('pointerdown', onWake);
      this.audio.unlock();
      this.audio.boot();
      this.show('loading');
      this._runLoading();
    };
    window.addEventListener('keydown', onWake);
    window.addEventListener('pointerdown', onWake);
  }

  _runLoading() {
    const fill = document.getElementById('loadFill');
    const pct = document.getElementById('loadPct');
    let p = 0;
    const timer = setInterval(() => {
      p += rnd(2, 7);
      if (p >= 100) {
        p = 100;
        clearInterval(timer);
        setTimeout(() => this._enterMenu(), 450);
      }
      fill.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
    }, 90);
  }

  _enterMenu() {
    this.audio.startMusic();
    this.show('menu');
    if (!this.menu) {
      this.menu = new Menu(this);
      this.host = new GameHost(document.getElementById('gameCanvas'), {
        audio: this.audio,
        input: this.input,
        onExit: () => this._exitToMenu()
      });
    }
  }

  _exitToMenu() {
    this.show('menu');
    this.audio.startMusic();
  }

  /* ============ GAME SELECTION FLOW ============ */
  selectGame(def) {
    this.currentGame = def;
    Store.pushRecent(def.id);
    this.audio.start();
    this.audio.stopMusic();
    // mode select screen
    const modeOptions = document.getElementById('modeOptions');
    document.getElementById('modeIcon').textContent = def.icon;
    document.getElementById('modeGameName').textContent = def.name;
    modeOptions.innerHTML = '';
    this._modeIdx = 0;
    const opts = [
      { label: '👤 1 PLAYER', mode: 1, enabled: true },
      { label: def.twoP ? '👥 2 PLAYERS' : '👤 1 PLAYER ONLY', mode: 2, enabled: def.twoP }
    ];
    opts.forEach((o, i) => {
      const div = document.createElement('div');
      div.className = 'mode-opt' + (i === 0 ? ' sel' : '') + (o.enabled ? '' : ' disabled');
      div.innerHTML = `<span>${o.label}</span>`;
      div.addEventListener('click', () => {
        if (!o.enabled) { this.audio.blip(160); return; }
        this._modeIdx = i;
        this._refreshModeOptions(opts);
        this._launchSelected(o.mode);
      });
      modeOptions.appendChild(div);
    });
    this._modeOpts = opts;
    this.show('mode');
  }

  _refreshModeOptions(opts) {
    document.querySelectorAll('#modeOptions .mode-opt').forEach((el, i) => {
      el.classList.toggle('sel', i === this._modeIdx);
    });
  }

  _launchSelected(mode) {
    const def = this.currentGame;
    // game loading screen
    document.getElementById('glIcon').textContent = def.icon;
    document.getElementById('glName').textContent = def.name;
    this.show('gameLoading');
    const fill = document.getElementById('glFill');
    let p = 0;
    if (this._glTimer) clearInterval(this._glTimer);
    this._glTimer = setInterval(() => {
      p += rnd(6, 16);
      if (p >= 100) {
        p = 100;
        clearInterval(this._glTimer);
        this._glTimer = null;
        setTimeout(() => {
          this.show('game');
          this.host.start(def, mode);
        }, 350);
      }
      fill.style.width = p + '%';
    }, 70);
  }

  /* ============ GLOBAL KEYS ============ */
  _bindGlobalKeys() {
    window.addEventListener('keydown', (e) => {
      const active = Object.entries(this.screens).find(([, el]) => el.classList.contains('active'));
      if (!active) return;
      const [name] = active;

      if (name === 'menu' && this.menu) {
        const cat = this.menu.cat;
        if (cat === 3) {
          // settings: up/down move, left/right adjust value
          if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); this.menu.move(-1); }
          else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); this.menu.move(1); }
          else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.menu.adjust(-1); }
          else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.menu.adjust(1); }
          else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); this.menu.activate(); }
          else if (e.code === 'Escape') this.menu.back();
        } else {
          if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); this.menu.move(-1); }
          else if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); this.menu.move(1); }
          else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') { e.preventDefault(); this.menu.activate(); }
          else if (e.code === 'Escape') this.menu.back();
        }
      } else if (name === 'mode') {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') {
          e.preventDefault();
          this._modeIdx = (this._modeIdx + this._modeOpts.length - 1) % this._modeOpts.length;
          if (!this._modeOpts[this._modeIdx].enabled) this._modeIdx = 0;
          this._refreshModeOptions(); this.audio.navigate();
        } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
          e.preventDefault();
          this._modeIdx = (this._modeIdx + 1) % this._modeOpts.length;
          if (!this._modeOpts[this._modeIdx].enabled) this._modeIdx = 0;
          this._refreshModeOptions(); this.audio.navigate();
        } else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
          e.preventDefault();
          const o = this._modeOpts[this._modeIdx];
          if (o.enabled) this._launchSelected(o.mode);
          else this.audio.blip(160);
        } else if (e.code === 'Escape') {
          this.audio.back();
          this.show('menu');
          this.audio.startMusic();
        }
      } else if (name === 'gameLoading') {
        if (e.code === 'Escape') {
          clearInterval(this._glTimer);
          this.show('menu');
          this.audio.startMusic();
        }
      }
    });
  }

  /* ============ loading particles ============ */
  _initLoadingParticles() {
    const canvas = document.getElementById('loadParticles');
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = innerWidth; canvas.height = innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const parts = [];
    for (let i = 0; i < 70; i++) {
      parts.push({
        x: rnd(innerWidth), y: rnd(innerHeight),
        vx: rnd(-18, 18), vy: rnd(-34, -8),
        s: rnd(1, 3.2), a: rnd(0.15, 0.7)
      });
    }
    const loop = () => {
      requestAnimationFrame(loop);
      if (!this.screens.loading.classList.contains('active')) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += p.vx * 0.016; p.y += p.vy * 0.016;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = rnd(canvas.width); }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        ctx.globalAlpha = p.a;
        ctx.fillStyle = '#8fd0ff';
        ctx.shadowColor = '#4fa8ff';
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };
    loop();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
