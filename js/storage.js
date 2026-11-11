/* ============================================================
   Storage — validated localStorage helpers (settings, recent games)
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
    try { localStorage.setItem('rg40_' + key, JSON.stringify(val)); return true; }
    catch (e) { return false; }
  },

  getSettings() {
    const saved = this.get('settings', {});
    const source = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    const volume = Number(source.volume);
    return {
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.7,
      music: typeof source.music === 'boolean' ? source.music : true,
      sfx: typeof source.sfx === 'boolean' ? source.sfx : true,
      language: source.language === 'en' ? 'en' : 'ru'
    };
  },

  saveSettings(settings) {
    const volume = Number(settings?.volume);
    return this.set('settings', {
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.7,
      music: settings?.music !== false,
      sfx: settings?.sfx !== false,
      language: settings?.language === 'en' ? 'en' : 'ru'
    });
  },

  getRecent() {
    const recent = this.get('recent', []);
    return Array.isArray(recent)
      ? recent.filter(id => typeof id === 'string').slice(0, 8)
      : [];
  },

  pushRecent(gameId) {
    if (typeof gameId !== 'string' || !gameId) return this.getRecent();
    const recent = this.getRecent().filter(id => id !== gameId);
    recent.unshift(gameId);
    const next = recent.slice(0, 8);
    this.set('recent', next);
    return next;
  },

  clearRecent() { this.set('recent', []); },

  resetAll() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rg40_')) keys.push(key);
      }
      keys.forEach(key => localStorage.removeItem(key));
    } catch (e) { /* storage may be disabled by the browser */ }
  }
};
window.Store = Store;
