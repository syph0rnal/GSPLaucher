/* ============================================================
   Storage — localStorage helpers (settings, recently played)
   ============================================================ */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('rg40_' + key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem('rg40_' + key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  },

  getSettings() {
    return Object.assign({ volume: 0.7, music: true, sfx: true }, this.get('settings', {}));
  },
  saveSettings(s) { this.set('settings', s); },

  getRecent() { return this.get('recent', []); },
  pushRecent(gameId) {
    let r = this.getRecent().filter(id => id !== gameId);
    r.unshift(gameId);
    r = r.slice(0, 8);
    this.set('recent', r);
    return r;
  },
  clearRecent() { this.set('recent', []); },

  resetAll() {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith('rg40_'))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  }
};
window.Store = Store;
