/* Единые векторные значки интерфейса в стиле XMB. */
const ICON_PATHS = {
  games:'<rect x="3" y="7" width="18" height="12" rx="3"/><path d="M8 11v4M6 13h4M16 12h.01M18 15h.01"/>',
  friends:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.2 2.5-5 6-5s6 1.8 6 5M16 5.5a3 3 0 0 1 0 5.8M17 15c2.5.4 4 2 4 4"/>',
  recent:'<path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.9l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.6-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.6.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.9Z"/>',
  mushroom:'<path d="M3 11a9 9 0 0 1 18 0H3Z"/><path d="M8 11v7a4 4 0 0 0 8 0v-7M8 6h.01M15 5h.01"/>',
  tank:'<path d="M4 10h16v8H4zM7 7h10v3H7zM12 3v7M2 18h20"/><circle cx="8" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m12 2 0 5m10 5h-5"/>',
  shield:'<path d="M12 2 20 5v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z"/><path d="m8 12 2.5 2.5L16 9"/>',
  fist:'<path d="M7 11V6a2 2 0 0 1 4 0v4-5a2 2 0 0 1 4 0v5-3a2 2 0 0 1 4 0v7c0 5-3 8-8 8H9c-3 0-5-2-6-5l-1-3a2 2 0 0 1 4-1l1 2Z"/>',
  skull:'<path d="M12 3a8 8 0 0 0-5 14v3h10v-3a8 8 0 0 0-5-14Z"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M10 16h4M10 20v-3m4 3v-3"/>',
  frog:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M4 13c0-2 3-3 8-3s8 1 8 3v3a8 8 0 0 1-16 0v-3Z"/><path d="M9 15h.01M15 15h.01"/>',
  spaceship:'<path d="m12 2 5 8-1 8-4-2-4 2-1-8 5-8Z"/><path d="m8 12-5 4 1 4 6-3m6-5 5 4-1 4-6-3"/>',
  alien:'<path d="M12 3c-5 0-8 4-8 9s3 9 8 9 8-4 8-9-3-9-8-9Z"/><path d="m7 11 4 2-4 2m10-4-4 2 4 2"/>',
  blocks:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  snake:'<path d="M4 7h8a3 3 0 1 1-3 3v4a3 3 0 1 0 3 3h8"/><circle cx="18" cy="17" r="1"/>',
  paddle:'<path d="M4 4v16M20 4v16M12 10v4M4 12h16"/>',
  bricks:'<path d="M3 4h8v5H3zM13 4h8v5h-8zM3 11h8v5H3zM13 11h8v5h-8zM9 19h6"/>',
  bomb:'<circle cx="12" cy="14" r="7"/><path d="m16 7 3-3m-4 1 3 3"/>',
  speed:'<path d="m13 2-3 9h7l-6 11 2-9H6l7-11Z"/>',
  sword:'<path d="m14 4 6-2-2 6-11 11-4-4L14 4Z"/><path d="m5 15 4 4m-6 3 5-5"/>',
  crosshair:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
  pacman:'<path d="M20 12a8 8 0 1 1-8-8v8l6 4Z"/><circle cx="14" cy="8" r="1"/>',
  castle:'<path d="M3 21V8h4V4h4v4h2V4h4v4h4v13Z"/><path d="M9 21v-6h6v6M6 12h.01M18 12h.01"/>',
  volume:'<path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M17 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12"/>',
  music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  sound:'<path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M17 9a5 5 0 0 1 0 6"/>',
  fullscreen:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  trash:'<path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-5 3-7 8-7s8 2 8 7"/>',
  gamepad:'<rect x="3" y="7" width="18" height="12" rx="3"/><path d="M8 11v4M6 13h4M16 12h.01M18 15h.01"/>'
};
function iconSvg(name, size=32) {
  const path=ICON_PATHS[name]||ICON_PATHS.gamepad;
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
const ICON_IMAGES = {};
function drawGameIcon(ctx,name,x,y,size) {
  if (!ICON_IMAGES[name]) {
    const svg=iconSvg(name,128).replace('class="ui-icon"','').replace('width="128" height="128"','width="128" height="128"');
    const img=new Image(); img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg); ICON_IMAGES[name]=img;
  }
  const img=ICON_IMAGES[name];
  if (img.complete && img.naturalWidth) { ctx.save(); ctx.shadowColor='rgba(100,190,255,.8)'; ctx.shadowBlur=22; ctx.drawImage(img,x-size/2,y-size/2,size,size); ctx.restore(); }
}
window.iconSvg=iconSvg;
window.drawGameIcon=drawGameIcon;