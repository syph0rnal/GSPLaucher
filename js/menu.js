/* ============================================================
   menu.js — XMB-style main menu: carousel, categories, settings
   ============================================================ */
const CATS = [
  { id: 'games',   icon: '🎮', name: 'RETRO GAMES',      sub: '40 BUILT-IN CLASSICS' },
  { id: 'friends', icon: '👥', name: 'PLAY WITH FRIEND', sub: '2 PLAYER GAMES' },
  { id: 'recent',  icon: '🕹️', name: 'RECENTLY PLAYED',  sub: 'YOUR LAST SESSIONS' },
  { id: 'settings',icon: '⚙️', name: 'SETTINGS',         sub: 'CONSOLE CONFIGURATION' }
];

class Menu {
  constructor(app) {
    this.app = app;
    this.cat = 0;
    this.idx = 0;              // index within current list
    this.list = [];            // current game list
    this.settingsOpen = false;
    this.setIdx = 0;
    this._buildCatRail();
    this._buildCarousel();
    this.el = {
      title: document.getElementById('menuTitle'),
      subtitle: document.getElementById('menuSubtitle'),
      clock: document.getElementById('menuClock'),
      infoPanel: document.getElementById('infoPanel'),
      infoIcon: document.getElementById('infoIcon'),
      infoName: document.getElementById('infoName'),
      infoGenre: document.getElementById('infoGenre'),
      infoDesc: document.getElementById('infoDesc'),
      infoBadge: document.getElementById('infoBadge'),
      playBtn: document.getElementById('playBtn'),
      hintCount: document.getElementById('hintCount'),
      carousel: document.getElementById('carousel'),
      settingsPanel: document.getElementById('settingsPanel'),
      catRail: document.getElementById('catRail')
    };
    this.el.playBtn.addEventListener('click', () => this._confirm());
    this._clockTick();
    setInterval(() => this._clockTick(), 15000);
    this._applyCat(0, true);
  }

  _clockTick() {
    const d = new Date();
    this.el.clock.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  _buildCatRail() {
    const rail = document.getElementById('catRail');
    rail.innerHTML = '';
    CATS.forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'cat-item' + (i === 0 ? ' sel' : '');
      div.innerHTML = `<span class="cat-ico">${c.icon}</span><span class="cat-name">${c.name}</span>`;
      div.addEventListener('click', () => { this.app.audio.navigate(); this._applyCat(i); });
      rail.appendChild(div);
    });
  }

  _buildCarousel() {
    const car = document.getElementById('carousel');
    car.innerHTML = '';
    this.tileEls = [];
  }

  currentList() { return this.list; }

  _listForCat(catId) {
    if (catId === 'games') return GAMES.slice();
    if (catId === 'friends') return GAMES.filter(g => g.twoP);
    if (catId === 'recent') {
      const ids = Store.getRecent();
      return ids.map(id => GAMES.find(g => g.id === id)).filter(Boolean);
    }
    return [];
  }

  _applyCat(catIdx, silent) {
    this.cat = catIdx;
    this.settingsOpen = false;
    this.el.settingsPanel.classList.add('hidden');
    const c = CATS[catIdx];
    this.el.title.textContent = c.name;
    this.el.subtitle.textContent = c.sub;
    document.querySelectorAll('.cat-item').forEach((el, i) => el.classList.toggle('sel', i === catIdx));
    this.list = this._listForCat(c.id);
    this.idx = 0;
    if (!silent) this.app.audio.select();
    if (c.id === 'settings') {
      this._showSettings();
      this._setInfo(null);
    } else if (this.list.length === 0) {
      this._setInfo(null);
      this._renderTiles();
    } else {
      this._renderTiles();
      this._setInfo(this.list[0]);
    }
  }

  _renderTiles() {
    const car = this.el.carousel;
    car.innerHTML = '';
    this.tileEls = [];
    const list = this.list;
    list.forEach((g, i) => {
      const [r, gg, b] = g.color;
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.style.setProperty('--tc1', `rgb(${r},${gg},${b})`);
      tile.style.setProperty('--tc2', `rgb(${Math.floor(r * 0.35)},${Math.floor(gg * 0.35)},${Math.floor(b * 0.45)})`);
      tile.style.setProperty('--tg', `rgba(${r},${gg},${b},.55)`);
      tile.innerHTML = `
        <div class="tile-shine"></div>
        <div class="tile-emoji">${g.icon}</div>
        <div class="tile-num">${String(i + 1).padStart(2, '0')}</div>
        ${g.twoP ? '<div class="tile-2p">👥 2P</div>' : ''}
        <div class="tile-name">${g.name}</div>`;
      tile.addEventListener('click', () => {
        if (this.idx === i) this._confirm();
        else { this.idx = i; this.app.audio.navigate(); this._refresh(false); }
      });
      car.appendChild(tile);
      this.tileEls.push(tile);
    });
    this._refresh(true);
  }

  _refresh(instant) {
    const list = this.list;
    this.tileEls.forEach((el, i) => {
      const off = i - this.idx;
      const abs = Math.abs(off);
      const sel = off === 0;
      el.classList.toggle('sel', sel);
      el.classList.toggle('dim', !sel && abs < 4);
      if (abs > 4) { el.style.opacity = '0'; el.style.transform = `translate(${Math.sign(off) * 620}px,-50%) scale(.5)`; el.style.zIndex = 0; return; }
      el.style.opacity = abs > 3 ? '0' : sel ? '1' : String(0.85 - abs * 0.18);
      el.style.zIndex = String(100 - abs);
      const x = off * 165;
      const scale = sel ? 1.35 : Math.max(0.55, 1 - abs * 0.14);
      const y = sel ? -50 : -50 + Math.min(abs * 9, 26);
      el.style.transform = `translate(calc(-50% + ${x}px), ${y}%) scale(${scale}) rotateY(${off * -12}deg)`;
    });
    if (list.length) this._setInfo(list[this.idx]);
    this.el.hintCount.textContent = list.length ? `${this.idx + 1} / ${list.length}  ·  ${CATS[this.cat].name}` : CATS[this.cat].name;
  }

  _setInfo(g) {
    const el = this.el;
    if (!g) {
      el.infoIcon.textContent = '—';
      el.infoName.textContent = CATS[this.cat].name;
      el.infoGenre.textContent = CATS[this.cat].sub;
      el.infoDesc.textContent = this.cat === 3 ? 'Adjust console settings below.' : (this.cat === 2 ? 'No games played yet. Launch something!' : 'No games in this category.');
      el.infoBadge.textContent = '';
      el.infoBadge.style.display = 'none';
      el.playBtn.style.display = 'none';
      el.infoPanel.style.setProperty('--tc1', '#16407e');
      el.infoPanel.style.setProperty('--tc2', '#0a1c3e');
      el.infoPanel.style.setProperty('--tg', 'rgba(79,216,255,.35)');
      return;
    }
    const [r, gg, b] = g.color;
    el.infoIcon.textContent = g.icon;
    el.infoName.textContent = g.name;
    el.infoGenre.textContent = g.genre;
    el.infoDesc.textContent = g.desc;
    el.infoBadge.style.display = '';
    if (g.twoP) {
      el.infoBadge.textContent = '👥 2 PLAYERS';
      el.infoBadge.classList.remove('solo');
    } else {
      el.infoBadge.textContent = '👤 1 PLAYER';
      el.infoBadge.classList.add('solo');
    }
    el.playBtn.style.display = '';
    el.infoPanel.style.setProperty('--tc1', `rgb(${r},${gg},${b})`);
    el.infoPanel.style.setProperty('--tc2', `rgb(${Math.floor(r * 0.3)},${Math.floor(gg * 0.3)},${Math.floor(b * 0.4)})`);
    el.infoPanel.style.setProperty('--tg', `rgba(${r},${gg},${b},.5)`);
    // ambient bg tint
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${gg},${b},.28)`);
    document.querySelector('.blob-3').style.background = `radial-gradient(circle, rgba(${r},${gg},${b},.3), transparent 65%)`;
  }

  /* ---------- settings ---------- */
  _showSettings() {
    const s = this.app.settings;
    const panel = this.el.settingsPanel;
    panel.classList.remove('hidden');
    panel.innerHTML = `
      <div class="set-title">⚙️ SETTINGS</div>
      <div id="setRows"></div>`;
    const rows = panel.querySelector('#setRows');
    this._setRowsDef = [
      { name: '🔊 VOLUME', get: () => Math.round(s.volume * 100) + '%', left: () => this._vol(-0.1), right: () => this._vol(0.1) },
      { name: '🎵 MUSIC', get: () => s.music ? 'ON' : 'OFF', toggle: () => this._music() },
      { name: '🔔 UI SOUNDS', get: () => s.sfx ? 'ON' : 'OFF', toggle: () => this._sfx() },
      { name: '⛶ FULLSCREEN', get: () => document.fullscreenElement ? 'ON' : 'OFF', toggle: () => this._fullscreen() },
      { name: '🎮 CONTROLS: P1 WASD+SPACE/SHIFT · P2 ARROWS+ENTER/R-SHIFT', get: () => 'INFO', toggle: null },
      { name: '🗑️ RESET SAVED DATA', get: () => 'RESET', danger: true, toggle: () => this._reset() }
    ];
    this.setIdx = clamp(this.setIdx, 0, this._setRowsDef.length - 1);
    this._renderSettings();
  }

  _renderSettings() {
    const rows = this.el.settingsPanel.querySelector('#setRows');
    rows.innerHTML = '';
    this._setRowsDef.forEach((d, i) => {
      const div = document.createElement('div');
      div.className = 'set-row' + (i === this.setIdx ? ' sel' : '') + (d.danger ? ' danger' : '');
      div.innerHTML = `<span class="set-name">${d.name}</span><span class="set-val">${d.get()}</span>`;
      div.addEventListener('click', () => { this.setIdx = i; this._renderSettings(); if (d.toggle) d.toggle(); });
      rows.appendChild(div);
    });
  }

  _saveSettings() {
    Store.saveSettings(this.app.settings);
    const a = this.app.audio;
    a.setVolume(this.app.settings.volume);
    a.setMusic(this.app.settings.music);
    a.setSfx(this.app.settings.sfx);
  }
  _vol(d) {
    this.app.settings.volume = clamp(Math.round((this.app.settings.volume + d) * 10) / 10, 0, 1);
    this._saveSettings(); this._renderSettings(); this.app.audio.blip(600);
  }
  _music() {
    this.app.settings.music = !this.app.settings.music;
    this._saveSettings(); this._renderSettings();
    if (this.app.settings.music) this.app.audio.startMusic();
  }
  _sfx() {
    this.app.settings.sfx = !this.app.settings.sfx;
    this._saveSettings(); this._renderSettings();
  }
  _fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
    setTimeout(() => this._renderSettings(), 300);
  }
  _reset() {
    Store.resetAll();
    this.app.settings = Store.getSettings();
    this._saveSettings();
    Store.clearRecent();
    this._applyCat(3, true);
    this.app.audio.back();
  }

  /* ---------- navigation ---------- */
  move(dir) {
    if (this.cat === 3) {
      // settings navigation
      if (dir > 0) this.setIdx = (this.setIdx + 1) % this._setRowsDef.length;
      else this.setIdx = (this.setIdx - 1 + this._setRowsDef.length) % this._setRowsDef.length;
      this._renderSettings();
      this.app.audio.navigate();
      return;
    }
    if (!this.list.length) return;
    this.idx = (this.idx + dir + this.list.length) % this.list.length;
    this.app.audio.navigate();
    this._refresh();
  }

  adjust(dir) {
    if (this.cat === 3) {
      const d = this._setRowsDef[this.setIdx];
      if (!d) return;
      if (d.left && dir < 0) d.left();
      else if (d.right && dir > 0) d.right();
      else if (d.toggle) d.toggle();
    }
  }

  activate() {
    if (this.cat === 3) {
      const d = this._setRowsDef[this.setIdx];
      if (d && d.toggle) { d.toggle(); this.app.audio.select(); }
      return;
    }
    this._confirm();
  }

  back() {
    if (this.cat !== 0) { this._applyCat(0); }
  }

  _confirm() {
    if (this.cat === 3) return this.activate();
    if (!this.list.length) return;
    const g = this.list[this.idx];
    this.app.selectGame(g);
  }
}

window.Menu = Menu;
window.CATS = CATS;
