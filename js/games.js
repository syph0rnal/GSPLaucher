const GameLibrary=(()=>{'use strict';
const W=960,H=540;
let language='ru';const tr=(ru,en)=>language==='ru'?ru:en;
const palette={bg:'#07182b',grid:'rgba(151,207,244,.09)',ice:'#dff4ff',blue:'#62c4ff',cyan:'#80f0e8',pink:'#ff83c5',gold:'#ffd477',red:'#ff7788',muted:'#82a9c8'};
function create(id,canvas,onScore,onEnd,onSound){const ctx=canvas.getContext('2d');let raf=0,last=0,paused=false,dead=false,score=0,game={};const keys={};const setScore=n=>{const previous=score;score=Math.max(0,Math.floor(n));onScore(score);if(score>previous)onSound?.()};function base(){ctx.fillStyle=palette.bg;ctx.fillRect(0,0,W,H);ctx.strokeStyle=palette.grid;ctx.lineWidth=1;for(let x=0;x<=W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<=H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.fillStyle='rgba(150,215,255,.55)';ctx.font='12px Inter';ctx.fillText('GSP ARCADE SYSTEM',28,28)}
function text(t,x,y,size=18,color=palette.ice,align='left'){ctx.fillStyle=color;ctx.font='600 '+size+'px Inter';ctx.textAlign=align;ctx.fillText(t,x,y);ctx.textAlign='left'}
function rect(x,y,w,h,color,r=5){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
function line(x1,y1,x2,y2,color=palette.grid){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function finish(result){if(dead)return;dead=true;onEnd(result)}
function loop(t){if(dead||paused)return;const dt=Math.min((t-last)/1000||0,.035);last=t;game.update(dt);if(dead||paused)return;game.draw();raf=requestAnimationFrame(loop)}
const canvasHandlers=[];function listenCanvas(type,handler,options){canvas.addEventListener(type,handler,options);canvasHandlers.push([type,handler,options])}
const api={start(){cancelAnimationFrame(raf);dead=false;paused=false;last=performance.now();game.init();if(!dead&&!paused)raf=requestAnimationFrame(loop)},setPaused(v){paused=v;if(v)cancelAnimationFrame(raf);else if(!dead){cancelAnimationFrame(raf);last=performance.now();raf=requestAnimationFrame(loop)}},key(e){game.key?.(e)},keyUp(e){game.keyUp?.(e)},destroy(){dead=true;paused=true;cancelAnimationFrame(raf);window.removeEventListener('keydown',globalKey);window.removeEventListener('keyup',globalUp);canvasHandlers.forEach(([type,handler,options])=>canvas.removeEventListener(type,handler,options));canvasHandlers.length=0}};
const globalKey=e=>{keys[e.code]=true};const globalUp=e=>{keys[e.code]=false};window.addEventListener('keydown',globalKey);window.addEventListener('keyup',globalUp);
if(id==='snake'){let body,dir,next,food,timer;game={init(){body=[{x:12,y:10},{x:11,y:10},{x:10,y:10}];dir={x:1,y:0};next={...dir};food={x:18,y:10};timer=0;setScore(0)},key(e){const d={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[e.code];if(d&&!(d[0]===-dir.x&&d[1]===-dir.y))next={x:d[0],y:d[1]}},update(dt){timer+=dt;if(timer<.105)return;timer=0;dir=next;const h={x:body[0].x+dir.x,y:body[0].y+dir.y};const eating=h.x===food.x&&h.y===food.y;const collisionBody=eating?body:body.slice(0,-1);if(h.x<0||h.x>=24||h.y<0||h.y>=13||collisionBody.some(p=>p.x===h.x&&p.y===h.y)){finish();return}body.unshift(h);if(eating){setScore(score+10);do{food={x:Math.floor(Math.random()*24),y:Math.floor(Math.random()*13)}}while(body.some(p=>p.x===food.x&&p.y===food.y))}else body.pop()},draw(){base();const cw=36,ch=36;body.forEach((p,i)=>rect(48+p.x*cw,42+p.y*ch,cw-3,ch-3,i?'#39a9d9':'#c9f4ff',7));circle(48+food.x*cw+16,42+food.y*ch+16,10,palette.gold);text(tr('СОБРАНО: ','COLLECTED: ')+score/10,900,28,12,palette.ice,'right')}}}
else if(id==='pong'){let p,b,vel,points,ai,aiPoints;game={init(){p=H/2;b={x:W/2,y:H/2,vx:300,vy:170};vel=0;points=0;ai=H/2;aiPoints=0;setScore(0)},key(e){if(['ArrowUp','KeyW'].includes(e.code))vel=-1;if(['ArrowDown','KeyS'].includes(e.code))vel=1},keyUp(e){if(['ArrowUp','KeyW','ArrowDown','KeyS'].includes(e.code))vel=0},update(dt){p+=vel*380*dt;p=Math.max(60,Math.min(H-60,p));ai+=(b.y-ai)*Math.min(1,dt*4.3);b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y<16||b.y>H-16)b.vy*=-1;if(b.vx<0&&b.x<72&&Math.abs(b.y-p)<65){b.vx=Math.abs(b.vx)*1.06;b.vy+=(b.y-p)*2.4}if(b.vx>0&&b.x>W-72&&Math.abs(b.y-ai)<62){b.vx=-Math.abs(b.vx)*1.02;b.vy+=(b.y-ai)*1.8}if(b.x<0){aiPoints++;if(aiPoints>=7){game.draw();finish('lose');return}b={x:W/2,y:H/2,vx:300,vy:(Math.random()-.5)*260}}if(b.x>W){points++;b={x:W/2,y:H/2,vx:-300,vy:(Math.random()-.5)*260};setScore(points);if(points>=7)finish('win')}},draw(){base();for(let y=12;y<H;y+=28)rect(W/2-2,y,4,15,'rgba(195,230,255,.25)',2);rect(48,p-48,13,96,palette.cyan,6);rect(W-61,ai-44,13,88,palette.blue,6);circle(b.x,b.y,11,palette.ice);text(tr('ТВОЙ СЧЁТ ','YOUR SCORE ')+points,48,28,12);text(tr('СОПЕРНИК: ','CPU: ')+aiPoints,W/2,28,12,palette.ice,'center');text(tr('ДО 7 ОЧКОВ','FIRST TO 7'),W-48,28,12,palette.muted,'right')}}}
else if(id==='breakout'){let paddle,ball,bricks,lives;game={init(){paddle=W/2;ball={x:W/2,y:H-90,vx:230,vy:-280};lives=3;bricks=[];for(let r=0;r<5;r++)for(let c=0;c<11;c++)bricks.push({x:100+c*70,y:80+r*34,w:58,h:20,on:true,color:[palette.cyan,palette.blue,palette.pink,palette.gold,'#8fa8ff'][r]});setScore(0)},key(e){if(e.code==='ArrowLeft'||e.code==='KeyA')paddle-=45;if(e.code==='ArrowRight'||e.code==='KeyD')paddle+=45;paddle=Math.max(65,Math.min(W-65,paddle))},update(dt){paddle=Math.max(65,Math.min(W-65,paddle));ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;if(ball.x<12||ball.x>W-12)ball.vx*=-1;if(ball.y<12)ball.vy=Math.abs(ball.vy);if(ball.y>H-35&&ball.x>paddle-68&&ball.x<paddle+68&&ball.vy>0){ball.vy=-Math.abs(ball.vy);ball.vx+=(ball.x-paddle)*2.1}for(const b of bricks)if(b.on&&ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.on=false;ball.vy*=-1;setScore(score+10);break}if(!bricks.some(b=>b.on)){finish('win');return}if(ball.y>H+10){lives--;if(!lives)finish();ball={x:paddle,y:H-90,vx:220,vy:-270}}},draw(){base();bricks.forEach(b=>{if(b.on)rect(b.x,b.y,b.w,b.h,b.color,4)});rect(paddle-62,H-28,124,12,palette.ice,6);circle(ball.x,ball.y,9,palette.gold);text(tr('ЖИЗНИ: ','LIVES: ')+lives,900,28,12,palette.ice,'right')}}}
else if(id==='invaders'){let x=W/2,shots=[],foes=[],cool=0,dir=1,lives;game={init(){x=W/2;shots=[];foes=[];cool=0;dir=1;lives=3;for(let r=0;r<4;r++)for(let c=0;c<9;c++)foes.push({x:180+c*68,y:80+r*52,on:true});setScore(0)},key(e){if(e.code==='ArrowLeft'||e.code==='KeyA')x-=26;if(e.code==='ArrowRight'||e.code==='KeyD')x+=26;if(e.code==='Space'&&cool<=0){shots.push({x,y:H-78});cool=.24}x=Math.max(40,Math.min(W-40,x))},update(dt){cool-=dt;if(foes.some(f=>f.on&&(f.x+dir*35*dt>W-45||f.x+dir*35*dt<45))){dir*=-1;foes.forEach(f=>{if(f.on)f.y+=14})}foes.forEach(f=>{if(f.on)f.x+=dir*35*dt});if(foes.some(f=>f.on&&f.y>H-145)){finish()}shots.forEach(s=>s.y-=480*dt);shots=shots.filter(s=>s.y>0);for(const s of shots)for(const f of foes)if(f.on&&Math.abs(s.x-f.x)<23&&Math.abs(s.y-f.y)<19){f.on=false;s.y=-10;setScore(score+20);break}if(!foes.some(f=>f.on))finish('win')},draw(){base();foes.forEach(f=>{if(f.on){rect(f.x-17,f.y-12,34,24,palette.blue,7);circle(f.x-7,f.y,3,palette.ice);circle(f.x+7,f.y,3,palette.ice)}});shots.forEach(s=>rect(s.x-3,s.y-12,6,20,palette.gold,3));rect(x-25,H-72,50,25,palette.cyan,8);text(tr('ЦЕЛЕЙ: ','TARGETS: ')+foes.filter(f=>f.on).length,900,28,12,palette.ice,'right')}}}
else if(id==='runner'){let y=H-90,vy=0,obstacles=[],clock=0,speed=320,ground=H-55,distance=0;game={init(){y=ground-36;vy=0;obstacles=[];clock=0;speed=320;distance=0;setScore(0)},key(e){if((e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')&&y>=ground-37)vy=-600},update(dt){clock+=dt;speed+=dt*5;distance+=dt*10;setScore(distance);if(clock>1.2){clock=0;obstacles.push({x:W+30,w:24+Math.random()*28,h:35+Math.random()*45})}vy+=1450*dt;y+=vy*dt;if(y>ground-36){y=ground-36;vy=0}obstacles.forEach(o=>o.x-=speed*dt);obstacles=obstacles.filter(o=>o.x>-60);if(obstacles.some(o=>o.x<105&&o.x+o.w>62&&y+36>ground-o.h))finish()},draw(){base();line(0,ground,W,ground,'rgba(170,220,255,.5)');rect(65,y,38,36,palette.cyan,7);circle(94,y+10,3,palette.bg);obstacles.forEach(o=>rect(o.x,ground-o.h,o.w,o.h,palette.pink,4));text(tr('ДИСТАНЦИЯ ','DISTANCE ')+Math.floor(score),900,28,12,palette.ice,'right')}}}
else if(id==='tetris'){let board,piece,fall,lines=0;const shapes=[[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]],colors=[palette.cyan,palette.gold,palette.pink,palette.blue,'#a7a2ff','#72e2a8','#ff9b70'];function spawn(){const i=Math.floor(Math.random()*shapes.length);piece={m:shapes[i].map(r=>r.slice()),x:3,y:0,c:colors[i]};if(hit(piece.x,piece.y,piece.m))finish()}function hit(x,y,m){return m.some((r,dy)=>r.some((v,dx)=>v&&(x+dx<0||x+dx>=10||y+dy>=20||(y+dy>=0&&board[y+dy][x+dx]))))}function lock(){piece.m.forEach((r,dy)=>r.forEach((v,dx)=>{if(v&&piece.y+dy>=0)board[piece.y+dy][piece.x+dx]=piece.c}));let n=0;board=board.filter(row=>{if(row.every(Boolean)){n++;return false}return true});while(board.length<20)board.unshift(Array(10).fill(0));if(n){lines+=n;setScore(score+[0,100,300,500,800][n])}spawn()}game={init(){board=Array.from({length:20},()=>Array(10).fill(0));fall=0;lines=0;setScore(0);spawn()},key(e){if(e.code==='ArrowLeft'&&!hit(piece.x-1,piece.y,piece.m))piece.x--;if(e.code==='ArrowRight'&&!hit(piece.x+1,piece.y,piece.m))piece.x++;if(e.code==='ArrowDown'){if(!hit(piece.x,piece.y+1,piece.m))piece.y++;else lock()}if(e.code==='ArrowUp'){const m=piece.m[0].map((_,i)=>piece.m.map(r=>r[i]).reverse());if(!hit(piece.x,piece.y,m))piece.m=m}if(e.code==='Space'){while(!hit(piece.x,piece.y+1,piece.m))piece.y++;lock()}},update(dt){fall+=dt;if(fall>.55){fall=0;if(!hit(piece.x,piece.y+1,piece.m))piece.y++;else lock()}},draw(){base();const ox=300,oy=40,s=24;rect(ox-3,oy-3,10*s+6,20*s+6,'rgba(160,213,248,.08)',5);board.forEach((r,y)=>r.forEach((v,x)=>{if(v)rect(ox+x*s,oy+y*s,s-2,s-2,v,3)}));piece.m.forEach((r,y)=>r.forEach((v,x)=>{if(v)rect(ox+(piece.x+x)*s,oy+(piece.y+y)*s,s-2,s-2,piece.c,3)}));text(tr('ЛИНИИ: ','LINES: ')+lines,620,95,16);text(tr('← → ДВИЖЕНИЕ','← → MOVE'),620,140,12,palette.muted);text(tr('↑ ПОВОРОТ','↑ ROTATE'),620,165,12,palette.muted);text(tr('SPACE — МГНОВЕННОЕ ПАДЕНИЕ','SPACE — HARD DROP'),620,190,12,palette.muted)}}}
else if(id==='merge'){let board;function add(){const a=[];board.forEach((r,y)=>r.forEach((v,x)=>{if(!v)a.push([x,y])}));if(a.length){const [x,y]=a[Math.floor(Math.random()*a.length)];board[y][x]=Math.random()<.9?2:4}}function shift(d){let changed=false;for(let i=0;i<4;i++){let vals=[];for(let j=0;j<4;j++){let x=d==='left'?j:d==='right'?3-j:i,y=d==='up'?j:d==='down'?3-j:i;vals.push(board[y][x])}let a=vals.filter(Boolean);for(let j=0;j<a.length-1;j++)if(a[j]===a[j+1]){a[j]*=2;setScore(score+a[j]);a.splice(j+1,1)}while(a.length<4)a.push(0);for(let j=0;j<4;j++){let x=d==='left'?j:d==='right'?3-j:i,y=d==='up'?j:d==='down'?3-j:i;if(board[y][x]!==a[j])changed=true;board[y][x]=a[j]}}if(changed){add();if(board.flat().some(v=>v>=2048)){finish('win');return}const canMove=board.some((r,y)=>r.some((v,x)=>v===0||(x<3&&v===r[x+1])||(y<3&&v===board[y+1][x])));if(!canMove)finish()}}game={init(){board=Array.from({length:4},()=>Array(4).fill(0));setScore(0);add();add()},key(e){const d={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down'}[e.code];if(d)shift(d)},update(){},draw(){base();const s=102,ox=276,oy=55;board.forEach((r,y)=>r.forEach((v,x)=>{const colors={2:'#d8edff',4:'#a8dcf5',8:'#78c9e9',16:'#59b5df',32:'#ffbd89',64:'#ff9c9c',128:'#eaa4d9',256:'#bdadff',512:'#8dcbff',1024:'#76e4c5',2048:'#ffdf83'};rect(ox+x*110,oy+y*110,s,s,v?(colors[v]||'#f5a1c4'):'rgba(188,224,250,.12)',8);if(v)text(String(v),ox+x*110+s/2,oy+y*110+62,v>=100?25:31,'#08223b','center')}));text(tr('ЦЕЛЬ — 2048','GOAL — 2048'),760,100,15);text(tr('ЛУЧШЕЕ СЛИЯНИЕ','BEST MERGE'),760,140,11,palette.muted)}}}
else if(id==='mines'){
let cells,over=false,flags=0,placed=false;const cols=10,rows=8,mines=12;
function placeMines(safeX,safeY){
let n=0;
while(n<mines){
const x=Math.floor(Math.random()*cols),y=Math.floor(Math.random()*rows);
if(Math.abs(x-safeX)<=1&&Math.abs(y-safeY)<=1)continue;
if(!cells[y][x].mine){cells[y][x].mine=true;n++}
}
cells.forEach((r,y)=>r.forEach((c,x)=>{
for(let yy=Math.max(0,y-1);yy<=Math.min(rows-1,y+1);yy++)
for(let xx=Math.max(0,x-1);xx<=Math.min(cols-1,x+1);xx++)
if(cells[yy][xx].mine)c.n++
}));
placed=true
}
function open(x,y){
if(over)return;
const c=cells[y][x];
if(c.open||c.flag||over)return;
if(!placed)placeMines(x,y);
c.open=true;
if(c.mine){over=true;finish();return}
if(!c.n){
for(let yy=Math.max(0,y-1);yy<=Math.min(rows-1,y+1);yy++)
for(let xx=Math.max(0,x-1);xx<=Math.min(cols-1,x+1);xx++)
if(!cells[yy][xx].open)open(xx,yy)
}
if(cells.flat().filter(v=>!v.mine&&v.open).length===cols*rows-mines){over=true;finish('win')}
}
function init(){
cells=Array.from({length:rows},()=>Array.from({length:cols},()=>({mine:false,n:0,open:false,flag:false})));
over=false;flags=0;placed=false
}
game={
init(){init();setScore(0)},
key(){},
click(e){
const r=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*H),cx=Math.floor((x-180)/60),cy=Math.floor((y-30)/60);
if(cx<0||cx>=cols||cy<0||cy>=rows)return;
const c=cells[cy][cx];
if(e.button===2){if(!c.open){c.flag=!c.flag;flags+=c.flag?1:-1}return}
open(cx,cy)
},
update(){},
draw(){
base();const ox=180,oy=30,s=60;
cells.forEach((r,y)=>r.forEach((c,x)=>{
const px=ox+x*s,py=oy+y*s;
rect(px+2,py+2,s-4,s-4,c.open?'rgba(174,221,250,.17)':'rgba(174,221,250,.07)',5);
if(c.flag)text('⚑',px+30,py+39,24,palette.gold,'center');
else if(over&&c.mine)text('✹',px+30,py+40,25,palette.red,'center');
else if(c.open&&c.n)text(String(c.n),px+30,py+40,22,[palette.blue,palette.cyan,palette.gold,palette.pink][(c.n-1)%4],'center')
}));
text(tr('ФЛАГИ: ','FLAGS: ')+flags,850,35,13,palette.ice,'right');
text(tr('ПКМ — ПОСТАВИТЬ ФЛАГ','RIGHT CLICK — PLACE FLAG'),480,535,11,palette.muted,'center')
}
};
listenCanvas('contextmenu',e=>e.preventDefault());
listenCanvas('pointerdown',e=>{if(id==='mines'&&!paused&&!dead){game.click(e);game.draw()}})
}
else if(id==='circuit'){
const N=1,E=2,S=4,WEST=8,rows=5,cols=5,cell=74,ox=295,oy=66;
const definitions=[
{r:2,c:0,mask:WEST|N,rotation:1},{r:1,c:0,mask:S|E,rotation:3},
{r:1,c:1,mask:WEST|E,rotation:1},{r:1,c:2,mask:WEST|E,rotation:3},
{r:1,c:3,mask:WEST|S,rotation:1},{r:2,c:3,mask:N|S,rotation:3},
{r:3,c:3,mask:N|WEST,rotation:1},{r:3,c:2,mask:E|WEST,rotation:3},
{r:3,c:1,mask:E|S,rotation:1},{r:4,c:1,mask:N|E,rotation:3},
{r:4,c:2,mask:WEST|E,rotation:1},{r:4,c:3,mask:WEST|E,rotation:3},
{r:4,c:4,mask:WEST|S,rotation:1}
];
let pieces=[],cursor={r:2,c:0},moves=0,solved=false;const initial=definitions.map(p=>p.rotation);
function rotateMask(mask,n){for(let i=0;i<n%4;i++)mask=((mask&N)<<1)|((mask&E)<<1)|((mask&S)<<1)|((mask&WEST)>>3);return mask}
function at(r,c){return pieces.find(p=>p.r===r&&p.c===c)}
function hasRoute(){const start=at(2,0);if(!start||!(start.mask&WEST))return false;const dirs=[{dr:-1,dc:0,bit:N,op:S},{dr:0,dc:1,bit:E,op:WEST},{dr:1,dc:0,bit:S,op:N},{dr:0,dc:-1,bit:WEST,op:E}],queue=[start],seen=new Set(['2:0']);while(queue.length){const p=queue.shift();if(p.r===4&&p.c===4&&(p.mask&S))return true;for(const d of dirs){if(!(p.mask&d.bit))continue;const r=p.r+d.dr,c=p.c+d.dc;if(r<0||r>=rows||c<0||c>=cols)continue;const next=at(r,c),key=r+':'+c;if(next&&(next.mask&d.op)&&!seen.has(key)){seen.add(key);queue.push(next)}}}return false}
function resetPuzzle(){pieces=definitions.map((p,i)=>({...p,rotation:initial[i],mask:rotateMask(p.mask,initial[i])}));cursor={r:2,c:0};moves=0;solved=false;setScore(1000);game.draw()}
function rotateSelected(){if(solved)return;const p=at(cursor.r,cursor.c);if(!p)return;p.rotation=(p.rotation+1)%4;p.mask=rotateMask(p.mask,1);moves++;setScore(Math.max(0,1000-moves*20));onSound?.();if(hasRoute()){solved=true;setScore(1500+Math.max(0,300-moves*10));game.draw();finish('win')}}
function drawPipe(p){const cx=ox+p.c*cell+cell/2,cy=oy+p.r*cell+cell/2,reach=cell*.34;ctx.strokeStyle=solved?palette.cyan:palette.blue;ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();if(p.mask&N){ctx.moveTo(cx,cy);ctx.lineTo(cx,cy-reach)}if(p.mask&E){ctx.moveTo(cx,cy);ctx.lineTo(cx+reach,cy)}if(p.mask&S){ctx.moveTo(cx,cy);ctx.lineTo(cx,cy+reach)}if(p.mask&WEST){ctx.moveTo(cx,cy);ctx.lineTo(cx-reach,cy)}ctx.stroke();circle(cx,cy,7,palette.ice);ctx.lineCap='butt'}
game={init(){resetPuzzle()},key(e){if(solved)return;if(e.code==='ArrowUp'||e.code==='KeyW')cursor.r=Math.max(0,cursor.r-1);else if(e.code==='ArrowDown'||e.code==='KeyS')cursor.r=Math.min(rows-1,cursor.r+1);else if(e.code==='ArrowLeft'||e.code==='KeyA')cursor.c=Math.max(0,cursor.c-1);else if(e.code==='ArrowRight'||e.code==='KeyD')cursor.c=Math.min(cols-1,cursor.c+1);else if(e.code==='Enter'||e.code==='Space')rotateSelected();else if(e.code==='KeyR'){resetPuzzle();return}game.draw()},update(){},draw(){base();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=ox+c*cell,y=oy+r*cell;rect(x+3,y+3,cell-6,cell-6,'rgba(174,221,250,.055)',8);ctx.strokeStyle='rgba(174,221,250,.11)';ctx.lineWidth=1;ctx.strokeRect(x+3,y+3,cell-6,cell-6)}pieces.forEach(drawPipe);const sx=ox-35,sy=oy+2*cell+cell/2,tx=ox+4*cell+cell/2,ty=oy+5*cell+28;line(sx+6,sy,ox+8,sy,palette.gold);circle(sx,sy,8,palette.gold);line(tx,oy+5*cell-2,tx,ty-12,palette.cyan);circle(tx,ty,8,palette.cyan);text(tr('ВХОД','INPUT'),sx,sy-18,11,palette.gold,'center');text(tr('ВЫХОД','OUTPUT'),tx,ty+24,11,palette.cyan,'center');const selected=at(cursor.r,cursor.c);if(selected){const x=ox+cursor.c*cell,y=oy+cursor.r*cell;ctx.strokeStyle=palette.ice;ctx.lineWidth=2;ctx.strokeRect(x+5,y+5,cell-10,cell-10)}text(tr('ПОВОРОТЫ: ','ROTATIONS: ')+moves,ox,oy+rows*cell+54,14,palette.ice);text(tr('СОЕДИНИТЕ ВХОД С ВЫХОДОМ','CONNECT INPUT TO OUTPUT'),ox+cols*cell,oy+rows*cell+54,12,palette.muted,'right');text(tr('ENTER / SPACE — ПОВОРОТ · R — СБРОС','ENTER / SPACE — ROTATE · R — RESET'),W/2,H-20,11,palette.muted,'center')}};
listenCanvas('pointerdown',e=>{if(paused||dead||solved)return;const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*W,y=(e.clientY-box.top)/box.height*H,c=Math.floor((x-ox)/cell),r=Math.floor((y-oy)/cell);if(r<0||r>=rows||c<0||c>=cols||!at(r,c))return;if(cursor.r===r&&cursor.c===c)rotateSelected();else{cursor={r,c};onSound?.()}game.draw()})
}
else if(id==='memory'){
const colors=['#2b8dbd','#8b68c8','#c47b43','#319b83'],bright=['#66d5ff','#c0a0ff','#ffc17f','#80edc5'];
const x0=322,y0=128,size=140,gap=22;
let sequence=[],phase='show',showIndex=0,clock=0,inputIndex=0,cursor=0,level=1,flash=-1,flashTimer=0;
function beginNext(){sequence.push(Math.floor(Math.random()*4));phase='show';showIndex=0;clock=0;inputIndex=0;flash=-1}
function selectPanel(index){if(phase!=='input'||dead||paused)return;cursor=index;flash=index;flashTimer=.18;if(index!==sequence[inputIndex]){phase='wrong';finish();return}inputIndex++;onSound?.();if(inputIndex>=sequence.length){setScore(score+level*100);level++;phase='between';clock=0}}
game={
init(){sequence=[Math.floor(Math.random()*4),Math.floor(Math.random()*4),Math.floor(Math.random()*4)];phase='show';showIndex=0;clock=0;inputIndex=0;cursor=0;level=1;flash=-1;flashTimer=0;setScore(0)},
key(e){
if(phase==='input'){
if(e.code==='ArrowLeft'||e.code==='KeyA')cursor=cursor%2===1?cursor-1:cursor;
else if(e.code==='ArrowRight'||e.code==='KeyD')cursor=cursor%2===0?cursor+1:cursor;
else if(e.code==='ArrowUp'||e.code==='KeyW')cursor=cursor>=2?cursor-2:cursor;
else if(e.code==='ArrowDown'||e.code==='KeyS')cursor=cursor<2?cursor+2:cursor;
else if(e.code==='Enter'||e.code==='Space')selectPanel(cursor);
}else if(phase==='between'&&(e.code==='Enter'||e.code==='Space'))beginNext();
game.draw()
},
update(dt){
if(flashTimer>0){flashTimer-=dt;if(flashTimer<=0)flash=-1}
if(phase==='show'){clock+=dt;if(clock>=.62){clock-=.62;showIndex++;if(showIndex>=sequence.length){phase='input';showIndex=-1;inputIndex=0}}}
else if(phase==='between'){clock+=dt;if(clock>=.85)beginNext()}
},
draw(){
base();text('MEMORY PULSE',W/2,78,16,palette.ice,'center');
for(let i=0;i<4;i++){
const x=x0+(i%2)*(size+gap),y=y0+Math.floor(i/2)*(size+gap);
const active=(phase==='show'&&showIndex>=0&&clock<.36&&sequence[showIndex]===i)||(flash===i&&flashTimer>0);
rect(x,y,size,size,active?bright[i]:colors[i],13);
text(String(i+1),x+size/2,y+size/2+10,34,active?'#07182b':palette.ice,'center');
if(phase==='input'&&cursor===i){ctx.strokeStyle=palette.ice;ctx.lineWidth=3;ctx.strokeRect(x+4,y+4,size-8,size-8)}
}
const status=phase==='show'?tr('ЗАПОМНИТЕ ПОСЛЕДОВАТЕЛЬНОСТЬ','MEMORIZE THE SEQUENCE'):phase==='input'?tr('ПОВТОРИТЕ ПОСЛЕДОВАТЕЛЬНОСТЬ','REPEAT THE SEQUENCE'):phase==='between'?tr('РАУНД ПРОЙДЕН','ROUND COMPLETE'):tr('ОШИБКА','MISTAKE');
text(status,W/2,478,15,palette.cyan,'center');
text(tr('УРОВЕНЬ: ','LEVEL: ')+level+'   '+tr('ШАГ: ','STEP: ')+(phase==='input'?inputIndex+'/'+sequence.length:'—'),W/2,508,12,palette.muted,'center');
text(tr('СТРЕЛКИ — ВЫБОР · ENTER — ПОДТВЕРДИТЬ','ARROWS — SELECT · ENTER — CONFIRM'),W/2,532,10,palette.muted,'center')
}
};
listenCanvas('pointerdown',e=>{
if(phase!=='input'||paused||dead)return;
const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*W,y=(e.clientY-box.top)/box.height*H;
const c=Math.floor((x-x0)/(size+gap)),r=Math.floor((y-y0)/(size+gap));
if(c<0||c>1||r<0||r>1)return;
const px=x0+c*(size+gap),py=y0+r*(size+gap);
if(x>px+size||y>py+size)return;
selectPanel(r*2+c);game.draw()
})
}
else if(id==='astro'){
let ship,shots,rocks,crystals,rockTimer,crystalTimer,fireCooldown,elapsed,lives,invuln;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function spawnRock(){const r=14+Math.random()*15;rocks.push({x:30+Math.random()*(W-60),y:-r,vx:(Math.random()-.5)*110,vy:72+Math.random()*78,r,dead:false})}
function spawnCrystal(){crystals.push({x:35+Math.random()*(W-70),y:-18,vx:(Math.random()-.5)*32,vy:48+Math.random()*30,r:9,phase:Math.random()*6,dead:false})}
game={
init(){ship={x:W/2,y:H-112,vx:0,vy:0,angle:-Math.PI/2};shots=[];rocks=[];crystals=[];rockTimer=.35;crystalTimer=2.2;fireCooldown=0;elapsed=0;lives=3;invuln=0;Object.keys(keys).forEach(k=>keys[k]=false);setScore(0)},
key(e){if(e.code==='Space')e.preventDefault?.()},
update(dt){
elapsed+=dt;invuln=Math.max(0,invuln-dt);fireCooldown=Math.max(0,fireCooldown-dt);
const turn=(keys.ArrowLeft||keys.KeyA?-1:0)+(keys.ArrowRight||keys.KeyD?1:0);ship.angle+=turn*3.35*dt;
if(keys.ArrowUp||keys.KeyW){ship.vx+=Math.cos(ship.angle)*235*dt;ship.vy+=Math.sin(ship.angle)*235*dt}
const damping=Math.pow(.988,dt*60);ship.vx*=damping;ship.vy*=damping;
const speed=Math.hypot(ship.vx,ship.vy);if(speed>310){ship.vx=ship.vx/speed*310;ship.vy=ship.vy/speed*310}
ship.x=(ship.x+ship.vx*dt+W)%W;ship.y=Math.max(48,Math.min(H-32,ship.y+ship.vy*dt));
if(keys.Space&&fireCooldown<=0){shots.push({x:ship.x+Math.cos(ship.angle)*19,y:ship.y+Math.sin(ship.angle)*19,vx:ship.vx+Math.cos(ship.angle)*520,vy:ship.vy+Math.sin(ship.angle)*520,life:1.35});fireCooldown=.22;onSound?.()}
rockTimer-=dt;if(rockTimer<=0){spawnRock();rockTimer=Math.max(.55,1.38-elapsed*.009)}
crystalTimer-=dt;if(crystalTimer<=0){spawnCrystal();crystalTimer=4.1+Math.random()*1.2}
shots.forEach(s=>{s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt});
rocks.forEach(r=>{r.x+=r.vx*dt;r.y+=r.vy*dt;if(r.x< -r.r)r.x=W+r.r;if(r.x>W+r.r)r.x=-r.r});
crystals.forEach(c=>{c.x+=c.vx*dt;c.y+=c.vy*dt;c.phase+=dt*3});
for(const shot of shots){if(shot.life<=0)continue;for(const rock of rocks){if(!rock.dead&&distance(shot,rock)<rock.r+4){shot.life=0;rock.dead=true;setScore(score+25);break}}}
for(const crystal of crystals){if(!crystal.dead&&distance(ship,crystal)<crystal.r+17){crystal.dead=true;setScore(score+100)}}
if(invuln<=0){for(const rock of rocks){if(!rock.dead&&distance(ship,rock)<rock.r+13){lives--;invuln=1.45;ship.x=W/2;ship.y=H-112;ship.vx=0;ship.vy=0;if(lives<=0)finish('lose');break}}}
shots=shots.filter(s=>s.life>0&&s.x>-20&&s.x<W+20&&s.y>-30&&s.y<H+30);
rocks=rocks.filter(r=>!r.dead&&r.y<H+r.r+10);crystals=crystals.filter(c=>!c.dead&&c.y<H+25)
},
draw(){
base();for(let i=0;i<48;i++)circle((i*197)%W,(i*83)%H,1,i%3?'rgba(177,220,255,.28)':'rgba(128,240,232,.45)');
crystals.forEach(c=>{ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.phase*.35);ctx.beginPath();ctx.moveTo(0,-c.r);ctx.lineTo(c.r*.72,0);ctx.lineTo(0,c.r);ctx.lineTo(-c.r*.72,0);ctx.closePath();ctx.fillStyle=palette.cyan;ctx.fill();ctx.strokeStyle=palette.ice;ctx.lineWidth=2;ctx.stroke();ctx.restore()});
rocks.forEach(r=>{ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.fillStyle='rgba(113,145,177,.28)';ctx.fill();ctx.strokeStyle=palette.muted;ctx.lineWidth=2;ctx.stroke();line(r.x-r.r*.35,r.y-r.r*.15,r.x+r.r*.22,r.y+r.r*.2,'rgba(220,240,255,.28)')});
shots.forEach(s=>{ctx.save();ctx.globalAlpha=Math.max(.25,s.life);rect(s.x-2,s.y-8,4,16,palette.gold,2);ctx.restore()});
if(invuln<=0||Math.floor(invuln*12)%2===0){ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(-13,-11);ctx.lineTo(-7,0);ctx.lineTo(-13,11);ctx.closePath();ctx.fillStyle=palette.ice;ctx.fill();ctx.strokeStyle=palette.cyan;ctx.lineWidth=2;ctx.stroke();if(keys.ArrowUp||keys.KeyW){ctx.beginPath();ctx.moveTo(-9,-5);ctx.lineTo(-23,0);ctx.lineTo(-9,5);ctx.closePath();ctx.fillStyle=palette.pink;ctx.fill()}ctx.restore()}
text(tr('ЖИЗНИ: ','LIVES: ')+lives,40,52,13,palette.ice);text(tr('АСТЕРОИДЫ: ','ASTEROIDS: ')+rocks.length,480,52,13,palette.muted,'center');text(tr('КРИСТАЛЛЫ +100 · КАМНИ +25','CRYSTALS +100 · ASTEROIDS +25'),920,52,11,palette.cyan,'right');text(tr('A / D — ПОВОРОТ · W — УСКОРЕНИЕ · SPACE — ОГОНЬ','A / D — TURN · W — THRUST · SPACE — FIRE'),W/2,H-16,11,palette.muted,'center')
}
};
}

else if(id==='echo'){
const maze=[
"###############",
"#.....#.......#",
"#.###.#.###.#.#",
"#...#...#...#.#",
"###.###.#.###.#",
"#...#...#.....#",
"#.###.#####.###",
"#.............#",
"###############"
];
const cols=15,rows=9,cell=48,ox=(W-cols*cell)/2,oy=(H-rows*cell)/2;
const exit={x:13,y:7};
let player,shards,pulseTimer,pulseCooldown;
function resetMaze(){
player={x:1,y:1};
shards=[{x:5,y:1,active:true},{x:11,y:3,active:true},{x:7,y:5,active:true}];
pulseTimer=0;pulseCooldown=0;
setScore(0)
}
function visibleTile(x,y){
const distance=Math.abs(x-player.x)+Math.abs(y-player.y);
return distance<=1||(pulseTimer>0&&distance<=5)
}
game={
init(){resetMaze()},
key(e){
if(e.repeat)return;
if(e.code==='KeyR'){resetMaze();game.draw();return}
if(e.code==='Space'){
if(pulseCooldown<=0){pulseTimer=2.6;pulseCooldown=1.4;onSound?.()}
game.draw();return
}
const direction={
ArrowUp:[0,-1],KeyW:[0,-1],
ArrowDown:[0,1],KeyS:[0,1],
ArrowLeft:[-1,0],KeyA:[-1,0],
ArrowRight:[1,0],KeyD:[1,0]
}[e.code];
if(!direction)return;
const nx=player.x+direction[0],ny=player.y+direction[1];
if(maze[ny]?.[nx]==='#')return;
player={x:nx,y:ny};
for(const shard of shards){
if(shard.active&&shard.x===player.x&&shard.y===player.y){
shard.active=false;setScore(score+100);onSound?.()
}
}
if(shards.every(shard=>!shard.active)&&player.x===exit.x&&player.y===exit.y){
setScore(score+200);finish('win')
}
game.draw()
},
update(dt){
pulseTimer=Math.max(0,pulseTimer-dt);
pulseCooldown=Math.max(0,pulseCooldown-dt)
},
draw(){
base();
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
const px=ox+x*cell,py=oy+y*cell,shown=visibleTile(x,y);
if(!shown){rect(px+1,py+1,cell-2,cell-2,'rgba(1,8,18,.96)',2);continue}
if(maze[y][x]==='#'){
rect(px+2,py+2,cell-4,cell-4,'rgba(86,153,202,.28)',5);
ctx.strokeStyle='rgba(166,218,250,.25)';ctx.strokeRect(px+3,py+3,cell-6,cell-6)
}else rect(px+2,py+2,cell-4,cell-4,'rgba(24,75,111,.18)',4)
}
for(const shard of shards){
if(shard.active&&visibleTile(shard.x,shard.y)){
circle(ox+shard.x*cell+cell/2,oy+shard.y*cell+cell/2,10,palette.gold);
circle(ox+shard.x*cell+cell/2,oy+shard.y*cell+cell/2,4,palette.ice)
}
}
if(visibleTile(exit.x,exit.y)){
const unlocked=shards.every(shard=>!shard.active);
rect(ox+exit.x*cell+8,oy+exit.y*cell+8,cell-16,cell-16,unlocked?palette.cyan:'rgba(130,169,200,.4)',5);
text('EXIT',ox+exit.x*cell+cell/2,oy+exit.y*cell+cell/2+4,10,palette.bg,'center')
}
const cx=ox+player.x*cell+cell/2,cy=oy+player.y*cell+cell/2;
if(pulseTimer>0){
ctx.beginPath();ctx.arc(cx,cy,cell*(5.4-pulseTimer*.6),0,Math.PI*2);
ctx.strokeStyle='rgba(128,240,232,.55)';ctx.lineWidth=3;ctx.stroke()
}
circle(cx,cy,12,palette.ice);circle(cx+4,cy-3,3,palette.bg);
text(tr('ОСКОЛКИ: ','SHARDS: ')+shards.filter(shard=>!shard.active).length+'/3',40,42,14,palette.gold);
text(tr('ИМПУЛЬС: ','PULSE: ')+(pulseCooldown<=0?tr('ГОТОВ','READY'):tr('ЗАРЯДКА','CHARGING')),920,42,13,palette.cyan,'right');
text(tr('СТРЕЛКИ / WASD — ДВИЖЕНИЕ · SPACE — ЭХО-ИМПУЛЬС · R — СБРОС','ARROWS / WASD — MOVE · SPACE — ECHO PULSE · R — RESET'),W/2,H-18,11,palette.muted,'center')
}
};
}
else if(id==='gravity'){
const playerW=28,playerH=34;
const surfaces=[
{x:0,y:480,w:W,h:60},
{x:0,y:0,w:W,h:60},
{x:205,y:370,w:145,h:14},
{x:420,y:260,w:150,h:14},
{x:670,y:370,w:145,h:14}
];
let player,gravity,cores,grounded,flipCooldown;
function resetLevel(){
player={x:70,y:446,vy:0};
gravity=1;grounded=true;flipCooldown=0;
cores=[{x:250,y:463,active:true},{x:620,y:77,active:true},{x:845,y:463,active:true}];
setScore(0)
}
game={
init(){resetLevel()},
key(e){
if((e.code==='Space'||e.code==='ArrowUp'||e.code==='KeyW')&&!e.repeat){
if(grounded){player.vy=-gravity*470;grounded=false;onSound?.()}
}else if((e.code==='KeyQ'||e.code==='KeyE')&&!e.repeat&&flipCooldown<=0){
gravity*=-1;player.vy=0;grounded=false;flipCooldown=.18;onSound?.()
}else if(e.code==='KeyR'){resetLevel();game.draw()}
},
update(dt){
flipCooldown=Math.max(0,flipCooldown-dt);
const direction=(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
player.x=Math.max(18,Math.min(W-playerW-18,player.x+direction*300*dt));
const oldY=player.y;
player.vy+=gravity*980*dt;
const nextY=oldY+player.vy*dt;
grounded=false;
let landing=null;
if(gravity>0){
for(const surface of surfaces){
if(oldY+playerH<=surface.y&&nextY+playerH>=surface.y&&player.x+playerW>surface.x&&player.x<surface.x+surface.w){
if(!landing||surface.y<landing.y)landing=surface
}
}
if(landing){player.y=landing.y-playerH;player.vy=0;grounded=true}else player.y=nextY
}else{
for(const surface of surfaces){
const bottom=surface.y+surface.h;
if(oldY>=bottom&&nextY<=bottom&&player.x+playerW>surface.x&&player.x<surface.x+surface.w){
if(!landing||bottom>landing.y+landing.h)landing=surface
}
}
if(landing){player.y=landing.y+landing.h;player.vy=0;grounded=true}else player.y=nextY
}
player.y=Math.max(60,Math.min(H-playerH-60,player.y));
const cx=player.x+playerW/2,cy=player.y+playerH/2;
for(const core of cores){
if(core.active&&Math.hypot(cx-core.x,cy-core.y)<25){core.active=false;setScore(score+100)}
}
if(cores.every(core=>!core.active)&&player.x+playerW>=900)finish('win')
},
draw(){
base();
surfaces.forEach((surface,i)=>{
rect(surface.x,surface.y,surface.w,surface.h,i<2?'rgba(112,197,244,.28)':'rgba(96,177,229,.20)',5);
line(surface.x,surface.y,surface.x+surface.w,surface.y,palette.ice)
});
cores.forEach(core=>{if(core.active){circle(core.x,core.y,13,palette.gold);circle(core.x,core.y,5,palette.ice)}});
const unlocked=cores.every(core=>!core.active);
rect(900,205,12,130,unlocked?palette.cyan:'rgba(130,169,200,.35)',5);
text(unlocked?tr('ВЫХОД ОТКРЫТ','EXIT OPEN'):tr('СОБЕРИТЕ 3 ЯДРА','COLLECT 3 CORES'),W/2,42,14,unlocked?palette.cyan:palette.muted,'center');
rect(player.x,player.y,playerW,playerH,palette.ice,7);
circle(player.x+19,player.y+10,3,palette.bg);
text(tr('ГРАВИТАЦИЯ: ','GRAVITY: ')+(gravity>0?tr('ВНИЗ','DOWN'):tr('ВВЕРХ','UP')),40,82,13,palette.cyan);
text(tr('ЯДРА: ','CORES: ')+(3-cores.filter(core=>core.active).length)+'/3',920,82,13,palette.gold,'right');
text(tr('A / D — ДВИЖЕНИЕ · SPACE — ПРЫЖОК · Q / E — СМЕНА ГРАВИТАЦИИ · R — СБРОС','A / D — MOVE · SPACE — JUMP · Q / E — FLIP GRAVITY · R — RESET'),W/2,H-18,10,palette.muted,'center')
}
};
}
else if(id==='gridlock'){
const cell=68,ox=276,oy=65,cols=6,rows=6;
const initial=[
{id:'target',x:0,y:2,len:2,axis:'h',color:palette.pink},
{id:'H',x:1,y:0,len:2,axis:'h',color:palette.blue},
{id:'A',x:2,y:1,len:2,axis:'v',color:palette.cyan},
{id:'D',x:3,y:4,len:2,axis:'h',color:palette.gold},
{id:'B',x:4,y:1,len:3,axis:'v',color:'#8fa8ff'}
];
let cars=[],selected=null,cursor={x:0,y:0},moves=0;
function resetPuzzle(){
cars=initial.map(car=>({...car}));
selected=null;cursor={x:0,y:0};moves=0;setScore(500);game.draw()
}
function carAt(x,y){
return cars.find(car=>car.axis==='h'?y===car.y&&x>=car.x&&x<car.x+car.len:x===car.x&&y>=car.y&&y<car.y+car.len)
}
function canOccupy(car,nx,ny){
for(let i=0;i<car.len;i++){
const x=nx+(car.axis==='h'?i:0),y=ny+(car.axis==='v'?i:0);
if(x<0||x>=cols||y<0||y>=rows)return false;
for(const other of cars){
if(other===car)continue;
const occupied=other.axis==='h'?y===other.y&&x>=other.x&&x<other.x+other.len:x===other.x&&y>=other.y&&y<other.y+other.len;
if(occupied)return false
}
}
return true
}
function moveSelected(dx,dy){
const car=cars.find(item=>item.id===selected);if(!car)return;
if((car.axis==='h'&&dy!==0)||(car.axis==='v'&&dx!==0))return;
const nx=car.x+dx,ny=car.y+dy;
if(car.id==='target'&&dx>0&&nx===5){
car.x=5;moves++;setScore(score+500);game.draw();finish('win');return
}
if(!canOccupy(car,nx,ny))return;
car.x=nx;car.y=ny;cursor={x:car.x,y:car.y};moves++;setScore(Math.max(0,500-moves*10));onSound?.()
}
game={
init(){resetPuzzle()},
key(e){
if(e.code==='KeyR'){resetPuzzle();return}
const directions={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
if(e.code==='Enter'){
if(selected)selected=null;
else{const car=carAt(cursor.x,cursor.y);if(car)selected=car.id}
}else if(directions[e.code]){
const [dx,dy]=directions[e.code];
if(selected)moveSelected(dx,dy);
else{cursor.x=Math.max(0,Math.min(cols-1,cursor.x+dx));cursor.y=Math.max(0,Math.min(rows-1,cursor.y+dy))}
}
game.draw()
},
update(){},
draw(){
base();
rect(ox-5,oy-5,cols*cell+10,rows*cell+10,'rgba(150,205,244,.08)',8);
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
ctx.strokeStyle='rgba(174,221,250,.16)';ctx.lineWidth=1;ctx.strokeRect(ox+x*cell,oy+y*cell,cell,cell)
}
cars.forEach(car=>{
const x=ox+car.x*cell+5,y=oy+car.y*cell+5,w=(car.axis==='h'?car.len:1)*cell-10,h=(car.axis==='v'?car.len:1)*cell-10;
rect(x,y,w,h,car.color,9);
rect(x+(car.axis==='h'?12:8),y+(car.axis==='v'?12:8),w-(car.axis==='h'?24:16),h-(car.axis==='v'?24:16),'rgba(5,22,43,.3)',5);
text(car.id==='target'?'EXIT CAR':car.id,x+w/2,y+h/2+5,car.id==='target'?12:14,palette.bg,'center');
if(selected===car.id){ctx.strokeStyle=palette.ice;ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,w-4,h-4)}
});
if(!selected){ctx.strokeStyle=palette.ice;ctx.lineWidth=2;ctx.strokeRect(ox+cursor.x*cell+3,oy+cursor.y*cell+3,cell-6,cell-6)}
line(ox+cols*cell,oy+2*cell+cell/2,ox+cols*cell+28,oy+2*cell+cell/2,palette.cyan);
text('EXIT',ox+cols*cell+34,oy+2*cell+cell/2+5,11,palette.cyan);
text(tr('ХОДЫ: ','MOVES: ')+moves,ox,oy+rows*cell+30,13,palette.ice);
text(tr('ВЫБЕРИТЕ МАШИНУ И ОСВОБОДИТЕ КРАСНУЮ','SELECT CARS AND CLEAR THE RED CAR'),W/2,oy+rows*cell+54,11,palette.muted,'center');
text(tr('СТРЕЛКИ — ВЫБОР / ДВИЖЕНИЕ · ENTER — ВЗЯТЬ / ОТПУСТИТЬ · R — СБРОС','ARROWS — SELECT / MOVE · ENTER — PICK / DROP · R — RESET'),W/2,H-16,10,palette.muted,'center')
}
};
listenCanvas('pointerdown',e=>{
if(paused||dead)return;
const box=canvas.getBoundingClientRect(),x=Math.floor((e.clientX-box.left)/box.width*W),y=Math.floor((e.clientY-box.top)/box.height*H);
const cx=Math.floor((x-ox)/cell),cy=Math.floor((y-oy)/cell);
if(cx<0||cx>=cols||cy<0||cy>=rows)return;
cursor={x:cx,y:cy};const car=carAt(cx,cy);selected=car?car.id:null;game.draw()
})
}

else if(id==='siege'){
const cols=16,rows=7,cell=52,left=64,top=70,cost=50,range=170;
const path=[
{x:left+cell*.5,y:top+cell*1.5},
{x:left+cell*15.5,y:top+cell*1.5},
{x:left+cell*15.5,y:top+cell*5.5},
{x:left+cell*.5,y:top+cell*5.5},
{x:left-22,y:top+cell*5.5}
];
let turrets=[],enemies=[],bullets=[],cursor={col:2,row:0},credits=300,lives=10,wave=1,spawned=0,spawnTimer=3.5;
const waveSize=5;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function isPathCell(col,row){return row===1||row===5||(col===15&&row>=1&&row<=5)}
function cellCenter(col,row){return{x:left+cell*(col+.5),y:top+cell*(row+.5)}}
function resetDefense(){
turrets=[];enemies=[];bullets=[];cursor={col:2,row:0};credits=300;lives=10;wave=1;spawned=0;spawnTimer=3.5;setScore(0);game.draw()
}
function placeTurret(col,row){
if(col<0||col>=cols||row<0||row>=rows||isPathCell(col,row)||credits<cost)return false;
if(turrets.some(t=>t.col===col&&t.row===row))return false;
const p=cellCenter(col,row);turrets.push({col,row,x:p.x,y:p.y,cooldown:.12});credits-=cost;onSound?.();game.draw();return true
}
function spawnEnemy(){
enemies.push({x:path[0].x,y:path[0].y,segment:0,progress:0,total:0,hp:wave,maxHp:wave,speed:145+wave*25,r:10,dead:false});
spawned++
}
function moveEnemy(enemy,dt){
let remaining=enemy.speed*dt;
while(remaining>0&&enemy.segment<path.length-1){
const a=path[enemy.segment],b=path[enemy.segment+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
const step=Math.min(remaining,len-enemy.progress);
enemy.progress+=step;enemy.total+=step;remaining-=step;
enemy.x=a.x+dx/len*enemy.progress;enemy.y=a.y+dy/len*enemy.progress;
if(enemy.progress>=len){enemy.segment++;enemy.progress=0}
}
if(enemy.segment>=path.length-1){enemy.dead=true;lives--}
}
function updateTurrets(dt){
for(const turret of turrets){
turret.cooldown=Math.max(0,turret.cooldown-dt);
if(turret.cooldown>0)continue;
let target=null,best=-1;
for(const enemy of enemies){
if(enemy.dead||distance(turret,enemy)>range)continue;
if(enemy.total>best){best=enemy.total;target=enemy}
}
if(target){bullets.push({x:turret.x,y:turret.y,target,speed:520,dead:false});turret.cooldown=.48}
}
}
function updateBullets(dt){
for(const bullet of bullets){
if(bullet.dead)continue;
if(bullet.target.dead){bullet.dead=true;continue}
const dx=bullet.target.x-bullet.x,dy=bullet.target.y-bullet.y,d=Math.hypot(dx,dy),step=bullet.speed*dt;
if(d<=step+bullet.target.r){
bullet.target.hp--;bullet.dead=true;
if(bullet.target.hp<=0&&!bullet.target.dead){
bullet.target.dead=true;credits+=15;setScore(score+20)
}
}else if(d>0){bullet.x+=dx/d*step;bullet.y+=dy/d*step}
}
bullets=bullets.filter(b=>!b.dead);
}
game={
init(){resetDefense()},
key(e){
if(e.code==='KeyR'){resetDefense();return}
const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[e.code];
if(delta){cursor.col=Math.max(0,Math.min(cols-1,cursor.col+delta[0]));cursor.row=Math.max(0,Math.min(rows-1,cursor.row+delta[1]));game.draw()}
else if(e.code==='Enter')placeTurret(cursor.col,cursor.row)
},
update(dt){
if(spawned<waveSize){spawnTimer-=dt;if(spawnTimer<=0){spawnEnemy();spawnTimer=.82}}
for(const enemy of enemies)if(!enemy.dead)moveEnemy(enemy,dt);
enemies=enemies.filter(enemy=>!enemy.dead);
if(lives<=0){finish('lose');return}
updateTurrets(dt);updateBullets(dt);
if(spawned>=waveSize&&enemies.length===0&&bullets.length===0){
if(wave>=3){setScore(score+200);finish('win');return}
wave++;spawned=0;spawnTimer=1.8;setScore(score+50)
}
},
draw(){
base();
for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
const x=left+col*cell,y=top+row*cell;
ctx.strokeStyle='rgba(174,221,250,.13)';ctx.lineWidth=1;ctx.strokeRect(x,y,cell,cell)
}
ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);
ctx.lineWidth=27;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='rgba(61,127,177,.36)';ctx.stroke();
ctx.beginPath();ctx.moveTo(path[0].x,path[0].y);for(let i=1;i<path.length;i++)ctx.lineTo(path[i].x,path[i].y);
ctx.lineWidth=3;ctx.strokeStyle='rgba(128,240,232,.62)';ctx.stroke();
turrets.forEach(t=>{
circle(t.x,t.y,17,'rgba(98,196,255,.25)');circle(t.x,t.y,11,palette.blue);circle(t.x,t.y,4,palette.ice);
ctx.strokeStyle=palette.cyan;ctx.lineWidth=2;ctx.strokeRect(t.x-15,t.y-15,30,30)
});
enemies.forEach(enemy=>{
circle(enemy.x,enemy.y,enemy.r,palette.red);circle(enemy.x-3,enemy.y-3,2,palette.ice);
rect(enemy.x-12,enemy.y-17,24,4,'rgba(255,255,255,.2)',2);
rect(enemy.x-12,enemy.y-17,24*(enemy.hp/enemy.maxHp),4,palette.gold,2)
});
bullets.forEach(b=>circle(b.x,b.y,4,palette.gold));
const p=cellCenter(cursor.col,cursor.row);
ctx.strokeStyle=isPathCell(cursor.col,cursor.row)?palette.red:palette.ice;ctx.lineWidth=2;ctx.strokeRect(p.x-cell/2+3,p.y-cell/2+3,cell-6,cell-6);
text(tr('ВОЛНА: ','WAVE: ')+wave+'/3',40,38,14,palette.ice);
text(tr('ЯДРО: ','CORE: ')+lives,480,38,14,palette.gold,'center');
text(tr('КРЕДИТЫ: ','CREDITS: ')+credits,920,38,14,palette.cyan,'right');
text(tr('ТУРЕЛЬ: ','TURRET: ')+cost,40,490,12,palette.muted);
text(tr('СТРЕЛКИ — ВЫБОР · ENTER / КЛИК — ПОСТАВИТЬ · R — СБРОС','ARROWS — SELECT · ENTER / CLICK — BUILD · R — RESET'),W/2,H-16,11,palette.muted,'center')
}
};
listenCanvas('pointerdown',e=>{
if(paused||dead)return;
const box=canvas.getBoundingClientRect(),x=(e.clientX-box.left)/box.width*W,y=(e.clientY-box.top)/box.height*H;
const col=Math.floor((x-left)/cell),row=Math.floor((y-top)/cell);
if(col<0||col>=cols||row<0||row>=rows)return;
cursor={col,row};placeTurret(col,row)
})
}

else{game={init(){setScore(0)},update(){},draw(){base();text(tr('ИГРА НЕ НАЙДЕНА','GAME NOT FOUND'),W/2,H/2,24,palette.ice,'center')}}}
return api}
return{create,setLanguage(value){language=value==='en'?'en':'ru'}}
})();