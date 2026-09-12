/* ============================================================
   AudioEngine — all sounds synthesized with WebAudio (no assets)
   ============================================================ */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.volume = 0.7;
    this.sfxOn = true;
    this.musicOn = true;
    this._musicTimer = null;
    this._musicStep = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxOn ? 1 : 0;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.5 : 0;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
    if (this.track) this.track.volume = this._trackVolume();
  }
  setSfx(on) { this.sfxOn = on; if (this.sfxGain) this.sfxGain.gain.value = on ? 1 : 0; }
  setMusic(on) {
    this.musicOn = on;
    if (this.musicGain) this.musicGain.gain.value = on ? 0.5 : 0;
    if (this.track) this.track.volume = this._trackVolume();
    if (!on) this.stopMusic();
  }

  /* ---- low level helpers ---- */
  tone(freq, dur, { type = 'square', vol = 0.2, slide = 0, attack = 0.005, dest = null, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  noise(dur, { vol = 0.25, freq = 1000, q = 1, delay = 0 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain);
    src.start(t0);
  }

  /* ---- UI sounds ---- */
  navigate() { this.tone(660, 0.07, { type: 'square', vol: 0.12 }); this.tone(990, 0.05, { vol: 0.06, delay: 0.03 }); }
  select()   { this.tone(523, 0.09, { vol: 0.14 }); this.tone(784, 0.12, { vol: 0.14, delay: 0.07 }); }
  back()     { this.tone(440, 0.08, { vol: 0.12 }); this.tone(294, 0.12, { vol: 0.12, delay: 0.06 }); }
  start() {
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.16, { vol: 0.16, delay: i * 0.08 }));
    this.tone(1046, 0.35, { vol: 0.12, delay: 0.34, type: 'triangle' });
  }
  boot() {
    this.tone(110, 0.9, { type: 'sawtooth', vol: 0.1, slide: 220 });
    this.tone(440, 0.5, { type: 'triangle', vol: 0.08, delay: 0.35, slide: 440 });
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.4, { type: 'triangle', vol: 0.1, delay: 0.7 + i * 0.12 }));
  }
  pause()  { this.tone(587, 0.1, { vol: 0.13 }); this.tone(440, 0.14, { vol: 0.13, delay: 0.09 }); }
  win()    { [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', vol: 0.15, delay: i * 0.12 })); }
  lose()   { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, { type: 'sawtooth', vol: 0.12, delay: i * 0.16 })); }

  /* ---- game sfx ---- */
  jump()    { this.tone(300, 0.14, { type: 'square', vol: 0.1, slide: 340 }); }
  coin()    { this.tone(988, 0.07, { vol: 0.11 }); this.tone(1319, 0.16, { vol: 0.11, delay: 0.06 }); }
  shoot()   { this.tone(880, 0.07, { type: 'sawtooth', vol: 0.08, slide: -500 }); }
  hit()     { this.noise(0.12, { vol: 0.2, freq: 2400 }); }
  explode() { this.noise(0.4, { vol: 0.3, freq: 700 }); this.tone(90, 0.3, { type: 'sawtooth', vol: 0.14, slide: -50 }); }
  powerup() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.09, { type: 'square', vol: 0.1, delay: i * 0.05 })); }
  hurt()    { this.tone(220, 0.2, { type: 'sawtooth', vol: 0.14, slide: -120 }); }
  blip(f = 800) { this.tone(f, 0.05, { vol: 0.09 }); }

  /* ---- external music track (music/fone.mp3) with generative fallback ---- */
  initTrack(src) {
    try {
      this.track = new Audio(src);
      this.track.loop = true;
      this.track.addEventListener('error', () => { this.track = null; });
    } catch (e) { this.track = null; }
  }

  _trackVolume() {
    // quiet background music for the menu (max ~25% of master volume)
    return Math.min(0.25, this.volume * 0.28) * (this.musicOn ? 1 : 0);
  }

  startMusic() {
    if (this.track) {
      this.track.volume = this._trackVolume();
      if (this.track.paused) this.track.play().catch(() => {});
      return;
    }
    if (!this.ctx || this._musicTimer) return;
    const chords = [
      [220.0, 261.6, 329.6],  // Am
      [174.6, 220.0, 261.6],  // F
      [130.8, 164.8, 196.0],  // C
      [196.0, 246.9, 293.7],  // G
    ];
    const step = () => {
      if (!this.musicOn || !this.ctx) return;
      const bar = this._musicStep % 4;
      const chord = chords[bar];
      // pad
      chord.forEach(f => this.tone(f / 2, 2.4, { type: 'sawtooth', vol: 0.028, attack: 0.6, dest: this.musicGain }));
      // arp
      for (let i = 0; i < 8; i++) {
        const note = chord[i % 3] * (i % 7 === 6 ? 2 : 1);
        this.tone(note * 2, 0.16, { type: 'triangle', vol: 0.035, delay: i * 0.3, dest: this.musicGain });
      }
      this._musicStep++;
    };
    step();
    this._musicTimer = setInterval(step, 2400);
  }
  stopMusic() {
    if (this.track) { this.track.pause(); }
    if (this._musicTimer) { clearInterval(this._musicTimer); this._musicTimer = null; }
  }
}

window.AudioEngine = AudioEngine;
