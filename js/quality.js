/* ============================================================
   Quality layer — small UX and accessibility improvements
   ============================================================ */
(() => {
  'use strict';

  const labelInteractiveElements = () => {
    document.querySelectorAll('.cat-item').forEach((el, i) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      const label = el.querySelector('.cat-name')?.textContent?.trim();
      if (label) el.setAttribute('aria-label', label);
    });
    document.querySelectorAll('.tile').forEach((el, i) => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      const label = el.querySelector('.tile-name')?.textContent?.trim();
      if (label) el.setAttribute('aria-label', label + ', game ' + (i + 1));
    });
    document.querySelectorAll('.mode-opt, .set-row').forEach(el => {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
    });
  };

  const installKeyboardActivation = () => {
    document.addEventListener('keydown', event => {
      if (event.repeat || (event.code !== 'Enter' && event.code !== 'Space')) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches('.cat-item, .tile, .mode-opt, .set-row')) return;
      event.preventDefault();
      target.click();
    });
  };

  const installCanvasFallback = () => {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Игровое поле RETROBOX·40. Управление отображается на экране игры.');
    if (!canvas.getContext || !canvas.getContext('2d')) {
      const frame = canvas.closest('.game-frame');
      if (frame) frame.textContent = 'Ваш браузер не поддерживает Canvas 2D. Обновите браузер или откройте игру в другом.';
    }
  };

  const observeDynamicTiles = () => {
    const targets = ['catRail', 'carousel', 'modeOptions', 'settingsPanel'];
    const observer = new MutationObserver(labelInteractiveElements);
    targets.map(id => document.getElementById(id)).filter(Boolean)
      .forEach(el => observer.observe(el, { childList: true, subtree: true }));
    labelInteractiveElements();
  };

  document.addEventListener('DOMContentLoaded', () => {
    installKeyboardActivation();
    installCanvasFallback();
    observeDynamicTiles();
  }, { once: true });
})();
