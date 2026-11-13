(()=>{'use strict';
const $=id=>document.getElementById(id);
const catalog=[
{id:'snake',name:'Змейка',icon:'◉',genre:'АРКАДА',desc:'Собирайте энергию, растите и не врезайтесь в собственный хвост.',keys:'СТРЕЛКИ / WASD — ДВИЖЕНИЕ',players:'1 ИГРОК'},
{id:'pong',name:'Pong: Дуэль',icon:'▥',genre:'СПОРТ',desc:'Классическая дуэль с компьютерным соперником. Не пропускайте мяч.',keys:'W / S ИЛИ ↑ / ↓ — РАКЕТКА',players:'1 ИГРОК'},
{id:'breakout',name:'Neon Breaker',icon:'▤',genre:'АРКАДА',desc:'Разрушайте блоки, удерживая мяч в игре. Три жизни на прохождение.',keys:'← → ИЛИ A / D — ПЛАТФОРМА',players:'1 ИГРОК'},
{id:'invaders',name:'Space Defense',icon:'✧',genre:'ШУТЕР',desc:'Защищайте сектор от волн вражеских кораблей.',keys:'← → — ДВИЖЕНИЕ · SPACE — ОГОНЬ',players:'1 ИГРОК'},
{id:'runner',name:'Neon Runner',icon:'⌁',genre:'РАННЕР',desc:'Перепрыгивайте препятствия и продержитесь как можно дольше.',keys:'SPACE / ↑ — ПРЫЖОК',players:'1 ИГРОК'},
{id:'tetris',name:'Block System',icon:'▦',genre:'ГОЛОВОЛОМКА',desc:'Собирайте полные линии из падающих блоков.',keys:'← → — ДВИЖЕНИЕ · ↑ — ПОВОРОТ · ↓ — УСКОРИТЬ',players:'1 ИГРОК'},
{id:'merge',name:'2048',icon:'▧',genre:'ЛОГИКА',desc:'Объединяйте одинаковые плитки и соберите 2048.',keys:'СТРЕЛКИ / WASD — СДВИГ ПОЛЯ',players:'1 ИГРОК'},
{id:'mines',name:'Сапёр',icon:'▩',genre:'ЛОГИКА',desc:'Откройте безопасные клетки и отметьте все мины.',keys:'КЛИК — ОТКРЫТЬ · ПКМ — ФЛАГ',players:'1 ИГРОК'}
];
const categories=[{id:'all',label:'ИГРЫ',icon:'▦'},{id:'arcade',label:'АРКАДЫ',icon:'◈'},{id:'logic',label:'ЛОГИКА',icon:'◇'},{id:'settings',label:'НАСТРОЙКИ',icon:'⚙'}];
const state={cat:0,index:0,list:catalog,screen:'boot',paused:false,over:false,settings:{sound:true,language:'ru'},game:null};
const en={categories:{all:'GAMES',arcade:'ARCADES',logic:'PUZZLES',settings:'SETTINGS'},games:{
snake:{name:'Snake',genre:'ARCADE',desc:'Collect energy, grow longer and avoid your own tail.',keys:'ARROWS / WASD — MOVE',players:'1 PLAYER'},
pong:{name:'Pong: Duel',genre:'SPORTS',desc:'A classic duel against the computer. Do not let the ball pass.',keys:'W / S OR ↑ / ↓ — PADDLE',players:'1 PLAYER'},
breakout:{name:'Neon Breaker',genre:'ARCADE',desc:'Break the blocks and keep the ball in play. You have three lives.',keys:'← → OR A / D — PADDLE',players:'1 PLAYER'},
invaders:{name:'Space Defense',genre:'SHOOTER',desc:'Defend the sector from waves of enemy ships.',keys:'← → — MOVE · SPACE — FIRE',players:'1 PLAYER'},
runner:{name:'Neon Runner',genre:'RUNNER',desc:'Jump over obstacles and survive for as long as possible.',keys:'SPACE / ↑ — JUMP',players:'1 PLAYER'},
tetris:{name:'Block System',genre:'PUZZLE',desc:'Complete full lines with falling blocks.',keys:'← → — MOVE · ↑ — ROTATE · ↓ — SOFT DROP',players:'1 PLAYER'},
merge:{name:'2048',genre:'LOGIC',desc:'Merge matching tiles and create the 2048 tile.',keys:'ARROWS / WASD — MOVE TILES',players:'1 PLAYER'},
mines:{name:'Minesweeper',genre:'LOGIC',desc:'Reveal safe cells and mark every mine.',keys:'CLICK — REVEAL · RIGHT CLICK — FLAG',players:'1 PLAYER'}
}};
const tr=(ru,english)=>state.settings.language==='ru'?ru:english;
const gameInfo=g=>state.settings.language==='ru'?g:{...g,...en.games[g.id]};
function applyLanguage(){
GameLibrary.setLanguage?.(state.settings.language);
$('bootPrompt').textContent=tr('НАЖМИТЕ ЛЮБУЮ КЛАВИШУ ДЛЯ ВКЛЮЧЕНИЯ','PRESS ANY KEY TO POWER ON');
$('homeFooterLeft').innerHTML=tr('<span class="keycap">←</span> <span class="keycap">→</span> КАТЕГОРИЯ <span class="keycap">↑</span> <span class="keycap">↓</span> ВЫБОР','<span class="keycap">←</span> <span class="keycap">→</span> CATEGORY <span class="keycap">↑</span> <span class="keycap">↓</span> SELECT');
$('homeFooterRight').innerHTML=tr('<span class="keycap">ENTER</span> ОТКРЫТЬ <span class="keycap">ESC</span> НАЗАД','<span class="keycap">ENTER</span> OPEN <span class="keycap">ESC</span> BACK');
$('back').textContent=tr('← В МЕНЮ','← BACK TO MENU');
$('gameFooterHint').textContent=tr('ESC — МЕНЮ · P — ПАУЗА','ESC — MENU · P — PAUSE');
$('pause').textContent=state.paused?tr('ПРОДОЛЖИТЬ','RESUME'):tr('ПАУЗА','PAUSE');
$('statusLabel').textContent=tr('СИСТЕМА ГОТОВА','SYSTEM READY');
}
const audio={
ctx:null,master:null,music:null,started:false,
beep(f=440,d=.06){if(!state.settings.sound)return;try{this.ensure();const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f,this.ctx.currentTime);g.gain.setValueAtTime(.035,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+d);o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+d)}catch{}},
ensure(){if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.7;this.master.connect(this.ctx.destination)}if(!this.music){this.music=new Audio('music/fone.mp3');this.music.loop=true;this.music.preload='auto';this.music.volume=.24}if(this.ctx.state==='suspended')this.ctx.resume()},
startMusic(){if(!state.settings.sound)return;try{this.ensure();this.started=true;const p=this.music.play();p?.catch?.(()=>{})}catch{}},
sync(){if(!this.music)return;if(state.settings.sound&&this.started){try{const p=this.music.play();p?.catch?.(()=>{})}catch{}}else this.music.pause()},
intro(){if(!state.settings.sound)return;try{this.ensure();const t=this.ctx.currentTime,notes=[261.63,329.63,392,523.25,659.25];notes.forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='sine';o.frequency.setValueAtTime(f,t+i*.19);g.gain.setValueAtTime(.0001,t+i*.19);g.gain.exponentialRampToValueAtTime(.11,t+i*.19+.035);g.gain.exponentialRampToValueAtTime(.0001,t+i*.19+.62);o.connect(g);g.connect(this.master);o.start(t+i*.19);o.stop(t+i*.19+.65)});const pad=this.ctx.createOscillator(),pg=this.ctx.createGain();pad.type='triangle';pad.frequency.value=65.41;pg.gain.setValueAtTime(.0001,t);pg.gain.exponentialRampToValueAtTime(.045,t+.35);pg.gain.exponentialRampToValueAtTime(.0001,t+2.2);pad.connect(pg);pg.connect(this.master);pad.start(t);pad.stop(t+2.25)}catch{}}
}
function visible(id,on){$(id).classList.toggle('hidden',!on)}
function listFor(){const id=categories[state.cat].id;if(id==='arcade')return catalog.filter(g=>['АРКАДА','ШУТЕР','РАННЕР','СПОРТ'].includes(g.genre));if(id==='logic')return catalog.filter(g=>g.genre==='ЛОГИКА');return catalog}
function render(){const c=$('categories');c.innerHTML='';categories.forEach((v,i)=>{const b=document.createElement('button');b.className='category'+(i===state.cat?' active':'');b.innerHTML='<span class="glyph">'+v.icon+'</span><span class="label">'+tr(v.label,en.categories[v.id])+'</span>';b.onclick=()=>setCat(i);c.append(b)});const games=$('gameList');games.innerHTML='';if(categories[state.cat].id==='settings'){renderSettings();return}state.list=listFor();state.index=Math.min(state.index,state.list.length-1);state.list.forEach((g,i)=>{const b=document.createElement('button');b.className='game-row'+(i===state.index?' active':'');const d=gameInfo(g);b.innerHTML='<span class="row-icon">'+g.icon+'</span><span class="row-name">'+d.name+'</span><span class="row-index">'+String(i+1).padStart(2,'0')+'</span>';b.onclick=()=>{if(i===state.index)launch();else{state.index=i;audio.beep(510);render()}};games.append(b)});const g=state.list[state.index];$('launch').disabled=false;if(g){const d=gameInfo(g);$('cover').textContent=g.icon;$('detailKicker').textContent=d.genre+' · '+d.players;$('detailName').textContent=d.name;$('detailDescription').textContent=d.desc;$('detailMeta').textContent='GSPLAUCHER ORIGINAL ARCADE';$('launch').textContent=tr('ЗАПУСТИТЬ  ↗','LAUNCH  ↗');$('launch').onclick=launch}}
function settingOptions(){return [
{name:tr('Звук и музыка','Sound & music'),value:()=>state.settings.sound?tr('ВКЛ','ON'):tr('ВЫКЛ','OFF'),act:()=>state.settings.sound=!state.settings.sound},
{name:tr('Язык интерфейса','Interface language'),value:()=>state.settings.language==='ru'?tr('РУССКИЙ','RUSSIAN'):'ENGLISH',act:()=>state.settings.language=state.settings.language==='ru'?'en':'ru'},
{name:tr('Сбросить настройки','Reset settings'),value:()=>tr('ПО УМОЛЧАНИЮ','DEFAULT'),act:()=>{state.settings={sound:true,language:'ru'}}}
]}
function activateSetting(i){const option=settingOptions()[i];if(!option)return;option.act();applyLanguage();audio.sync();audio.beep(620);render()}
function renderSettings(){$('launch').disabled=true;const games=$('gameList');games.innerHTML='';$('cover').textContent='⚙';$('detailKicker').textContent=tr('СИСТЕМА','SYSTEM');$('detailName').textContent=tr('Настройки','Settings');$('detailDescription').textContent=tr('Параметры интерфейса и звукового сопровождения.','Interface and audio preferences.');$('detailMeta').textContent='';settingOptions().forEach((opt,i)=>{const b=document.createElement('button');b.className='game-row'+(i===state.index?' active':'');b.innerHTML='<span class="row-icon">'+(i===0?'♪':i===1?'文':'↺')+'</span><span class="row-name">'+opt.name+'</span><span class="row-index">'+opt.value()+'</span>';b.onclick=()=>{state.index=i;activateSetting(i)};games.append(b)})}
function setCat(i){state.cat=(i+categories.length)%categories.length;state.index=0;audio.beep(380);render()}
function move(d){if(categories[state.cat].id==='settings'){state.index=(state.index+d+settingOptions().length)%settingOptions().length;render();return}state.index=(state.index+d+state.list.length)%state.list.length;audio.beep(500);render()}
function launch(){const def=state.list[state.index];if(!def)return;const d=gameInfo(def);audio.beep(740);$('gameTitle').textContent=d.name.toUpperCase();$('gameSubtitle').textContent=d.genre+' · GSPLAUCHER ARCADE';$('controlsText').textContent=d.keys;$('score').textContent=tr('СЧЁТ: ','SCORE: ')+0;visible('home',false);visible('game',true);state.screen='game';state.paused=false;state.over=false;visible('gameOverlay',false);$('pause').textContent=tr('ПАУЗА','PAUSE');const canvas=$('canvas');state.game=GameLibrary.create(def.id,canvas,(score)=>$('score').textContent=tr('СЧЁТ: ','SCORE: ')+score,()=>endGame(),()=>audio.beep(880,.045));state.game.start()}
function pause(){if(!state.game||state.screen!=='game'||state.over)return;state.paused=!state.paused;state.game.setPaused(state.paused);$('overlayTitle').textContent=tr('ПАУЗА','PAUSED');$('overlayText').textContent=tr('Игра приостановлена','Game paused');$('resume').textContent=tr('ПРОДОЛЖИТЬ','RESUME');visible('gameOverlay',state.paused);$('pause').textContent=state.paused?tr('ПРОДОЛЖИТЬ','RESUME'):tr('ПАУЗА','PAUSE');audio.beep(state.paused?420:620)}
function endGame(){state.paused=true;state.game?.setPaused(true);$('overlayTitle').textContent=tr('ИГРА ОКОНЧЕНА','GAME OVER');$('overlayText').textContent=tr('Партия завершена. Итоговый счёт: ','Game finished. Final score: ')+$('score').textContent.replace(tr('СЧЁТ: ','SCORE: '),'');$('resume').textContent=tr('В МЕНЮ','BACK TO MENU');$('restart').classList.remove('hidden');state.over=true;audio.beep(180,.28);visible('gameOverlay',true)}
window.addEventListener('keyup',e=>{if(state.screen==='game')state.game?.keyUp(e)});
function back(){if(state.screen==='game'){state.game?.destroy();state.game=null;visible('game',false);visible('home',true);state.screen='home';state.paused=false;state.over=false;$('restart').classList.add('hidden');render();audio.beep(300)}}
function restart(){if(!state.game)return;state.game.start();state.paused=false;state.over=false;$('pause').textContent=tr('ПАУЗА','PAUSE');$('restart').classList.add('hidden');$('overlayTitle').textContent=tr('ПАУЗА','PAUSED');visible('gameOverlay',false);$('score').textContent=tr('СЧЁТ: ','SCORE: ')+0;audio.beep(620)}
$('launch').onclick=launch;$('back').onclick=back;$('pause').onclick=pause;$('restart').onclick=restart;$('resume').onclick=()=>{if(state.over){back();return}pause()};
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(state.screen==='boot'){start();return}if(state.screen==='game'){if(e.code==='Escape'){back();return}if(e.code==='KeyP'){pause();return}if(!state.paused)state.game?.key(e);return}if(state.screen==='home'){if(e.code==='ArrowLeft'){setCat(state.cat-1)}else if(e.code==='ArrowRight'){setCat(state.cat+1)}else if(e.code==='ArrowUp'){move(-1)}else if(e.code==='ArrowDown'){move(1)}else if(e.code==='Enter'||e.code==='Space'){if(categories[state.cat].id==='settings')activateSetting(state.index);else launch()}else if(e.code==='Escape'){setCat(0)} }});
function start(){if(state.screen!=='boot')return;audio.ensure();audio.intro();audio.startMusic();state.screen='home';visible('boot',false);visible('home',true);applyLanguage();render()}
$('boot').addEventListener('pointerdown',start);window.addEventListener('pointerdown',()=>{if(audio.ctx?.state==='suspended')audio.ctx.resume()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.screen==='game'&&!state.paused&&!state.over)pause()});function clock(){const d=new Date();$('clock').textContent=d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}clock();setInterval(clock,15000);
})();