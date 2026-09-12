/* ============================================================
   Input — dual-player keyboard system
   P1: WASD + Space (action) + Left Shift (secondary)
   P2: Arrows + Enter (action) + Right Shift (secondary)
   ============================================================ */
const P1_MAP = {
  up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'],
  action: ['Space'], secondary: ['ShiftLeft']
};
const P2_MAP = {
  up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
  action: ['Enter', 'NumpadEnter'], secondary: ['ShiftRight']
};

const PREVENT_CODES = new Set([
  'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Enter', 'NumpadEnter', 'KeyW', 'KeyA', 'KeyS', 'KeyD'
]);

class Input {
  constructor() {
    this.keys = new Set();       // currently held
    this.edge = new Set();       // pressed since last frame
    this.p1 = this._makePlayer(P1_MAP);
    this.p2 = this._makePlayer(P2_MAP);

    window.addEventListener('keydown', e => {
      if (PREVENT_CODES.has(e.code)) e.preventDefault();
      if (!e.repeat) this.edge.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.edge.clear(); });
  }

  _makePlayer(map) {
    const self = this;
    const read = codes => codes.some(c => self.keys.has(c));
    const readEdge = codes => codes.some(c => self._snapshot && self._snapshot.has(c));
    return {
      get up()   { return read(map.up); },
      get down() { return read(map.down); },
      get left() { return read(map.left); },
      get right(){ return read(map.right); },
      get action()   { return read(map.action); },
      get secondary(){ return read(map.secondary); },
      get upPressed()   { return readEdge(map.up); },
      get downPressed() { return readEdge(map.down); },
      get leftPressed() { return readEdge(map.left); },
      get rightPressed(){ return readEdge(map.right); },
      get actionPressed()   { return readEdge(map.action); },
      get secondaryPressed(){ return readEdge(map.secondary); },
      _map: map
    };
  }

  /* call at the START of each frame: snapshot edges, then clear */
  beginFrame() {
    this._snapshot = new Set(this.edge);
    this.edge.clear();
  }

  anyPressed(codes) { return codes.some(c => this._snapshot && this._snapshot.has(c)); }

  /* used by menus (event-driven) */
  onEdge(codes) { return codes; }
}

window.Input = Input;
window.P1_MAP = P1_MAP;
window.P2_MAP = P2_MAP;
