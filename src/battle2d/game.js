/* Army 2D field test v0.13.0 — standalone. Does not modify or import 3D camp. */
const $=id=>document.getElementById(id);
const canvas=$('battleCanvas');
const ctx=canvas.getContext('2d',{alpha:false});
if(!ctx){$('startButton').textContent='瀏覽器不支援 Canvas 2D';$('startButton').disabled=true;throw new Error('Canvas 2D unavailable');}
const TAU=Math.PI*2;
const rand=(lo,hi)=>lo+Math.random()*(hi-lo);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sqr=x=>x*x;
const d2=(a,b)=>sqr(a.x-b.x)+sqr(a.y-b.y);
const hypot=Math.hypot;
const lerp=(a,b,t)=>a+(b-a)*t;
const formatTime=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
const S={phase:'menu',type:'normal',time:0,last:0,frame:0,w:0,h:0,dpr:1,scale:1,kills:0,wave:1,
 player:null,enemies:[],bullets:[],effects:[],grenades:[],pickups:[],obstacles:[],decor:[],camera:{x:0,y:0},shake:0,hitFade:0,spawnTimer:0,enemySerial:0,noticeUntil:0,mode:'normal',screenX:0,screenY:0,pausedFrom:null};
const MODE={normal:{name:'普通士兵',hp:170,speed:147,dashSpeed:520,dashCooldown:3.4,fireRate:.63,range:225,damage:27,regen:0,grenadeCD:24,grenadeDamage:78,grenadeRadius:82,burstCD:0,crit:.09},
 hero:{name:'超級士兵',hp:350,speed:225,dashSpeed:720,dashCooldown:1.6,fireRate:.155,range:315,damage:43,regen:.38,grenadeCD:10.5,grenadeDamage:170,grenadeRadius:126,burstCD:12,crit:.26}};
const input={keys:new Set(),joyId:null,joyX:0,joyY:0,joyPointerX:0,joyPointerY:0,lastAngle:0,dashQueued:false};
const joy=$('joystick'),joyThumb=$('joyThumb'),joyRegion=$('joyRegion');
let audioCtx=null,muted=false;
function beep(type='fire'){
 if(muted)return;try{
  audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();
  const t=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();
  const sounds={fire:[125,.027,.033,'square'],hit:[120,.055,.024,'sawtooth'],hurt:[98,.09,.085,'triangle'],blast:[65,.22,.10,'sawtooth'],dash:[210,.055,.034,'triangle'],pickup:[440,.16,.05,'sine']};
  const [freq,duration,volume,wave]=sounds[type]||sounds.fire;
  osc.type=wave;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.67),t+duration);
  gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain);gain.connect(audioCtx.destination);osc.start(t);osc.stop(t+duration+.015);
 }catch{} }
function setMode(mode){S.type=mode;$('modeNormal').classList.toggle('selected',mode==='normal');$('modeHero').classList.toggle('selected',mode==='hero');$('modeNormal').setAttribute('aria-pressed',String(mode==='normal'));$('modeHero').setAttribute('aria-pressed',String(mode==='hero'));}
$('modeNormal').addEventListener('click',()=>setMode('normal'));
$('modeHero').addEventListener('click',()=>setMode('hero'));
function show(id){for(const item of ['startScreen','pauseScreen','endScreen','loadingScreen'])$(item).hidden=item!==id;}
function setHUD(on){$('hud').hidden=!on;$('controls').hidden=!on;}
function message(txt,secs=1.3){const el=$('floatMsg');el.textContent=txt;el.style.opacity='1';S.noticeUntil=S.time+secs;}
function clearInput(){input.keys.clear();input.joyX=0;input.joyY=0;input.joyId=null;input.dashQueued=false;joyThumb.style.transform='translate(-50%,-50%)';}
function deterministic(seed){let a=seed|0;return()=>{a=(a+0x6d2b79f5)|0;let x=Math.imul(a^(a>>>15),1|a);x^=x+Math.imul(x^(x>>>7),61|x);return ((x^(x>>>14))>>>0)/4294967296;};}
function buildWorld(){
 const random=deterministic(19870311),obstacles=[];
 // The map is intentionally wide/open. These clusters occupy roughly 15% of the action area.
 const clusters=[[-410,-270],[-145,-340],[235,-310],[450,-140],[-440,115],[365,270],[-175,330],[95,420],[-570,380],[610,385]];
 let id=0;
 for(const [cx,cy] of clusters){
  const n=2+Math.floor(random()*3);
  for(let j=0;j<n;j++){
   const x=cx+(random()-.5)*135,y=cy+(random()-.5)*100;
   if(hypot(x,y)<205)continue;
   const typ=random()<.55?'sandbag':'crate';
   const w=typ==='sandbag'?56+random()*32:34+random()*15;
   const h=typ==='sandbag'?25+random()*7:34+random()*11;
   obstacles.push({x,y,w,h,type:typ,id:id++});
  }
 }
 const decor=[];
 for(let i=0;i<1250;i++){
  const x=(random()-.5)*3500,y=(random()-.5)*3500;
  decor.push({x,y,type:random(),rot:random()*TAU,size:1+random()*4});
 }
 // Make terrain lively without tile textures or network downloads.
 const soil=[];
 for(let i=0;i<105;i++)soil.push({x:(random()-.5)*3600,y:(random()-.5)*3600,rx:26+random()*50,ry:11+random()*27,angle:random()*TAU});
 S.obstacles=obstacles;S.decor=decor;S.soil=soil;
}
function resetGame(){
 clearInput();const m=MODE[S.type];S.mode=S.type;S.time=0;S.kills=0;S.wave=1;S.shake=0;S.hitFade=0;S.spawnTimer=1.5;S.enemySerial=0;S.enemies=[];S.bullets=[];S.effects=[];S.grenades=[];S.pickups=[];
 S.player={x:0,y:0,hp:m.hp,maxHp:m.hp,r:14,aim:-Math.PI/2,moveAim:-Math.PI/2,run:0,dashLeft:0,dashCooldown:0,invuln:0,shotCD:.2,shotFlash:0,grenadeCD:m.grenadeCD*.6,burstCD:m.burstCD,alive:true};
 S.camera.x=0;S.camera.y=0;buildWorld();setHUD(true);show('');$('modeLabel').textContent=m.name;$('skillText').textContent=S.mode==='hero'?'高速射擊 · 手榴彈 · 掃射':'步槍 · 閃避 · 手榴彈';$('waveText').textContent='第 1 波';
 S.phase='running';message(S.mode==='hero'?'超級士兵，出擊！':'演訓開始，保持移動！',1.5);hudUpdate();
 for(let i=0;i<7;i++)spawnEnemy('grunt',true);
 S.last=performance.now();
}
function showMenu(){S.phase='menu';setHUD(false);show('startScreen');clearInput()}
function finish(){if(S.phase!=='running')return;S.phase='ended';setHUD(false);const win=S.time>=150;
 $('endEyebrow').textContent=win?'SURVIVED':'OPERATION ENDED';$('endTitle').textContent=win?'成功堅守戰場！':'士兵失去戰鬥能力';$('endDescription').textContent=win?'完成 150 秒生存測試，看看這次清掉了多少敵軍。':'本次戰鬥告一段落。強化訓練後再看看能不能撐更久。';$('endKills').textContent=S.kills;$('endTime').textContent=formatTime(S.time);$('endWave').textContent=S.wave;show('endScreen');}
function pause(){if(S.phase!=='running')return;S.phase='paused';clearInput();show('pauseScreen')}
function resume(){if(S.phase!=='paused')return;S.phase='running';show('');S.last=performance.now()}
$('startButton').addEventListener('click',()=>{show('loadingScreen');requestAnimationFrame(()=>requestAnimationFrame(()=>resetGame()))});
$('pauseButton').addEventListener('click',pause);$('resumeButton').addEventListener('click',resume);$('retryButton').addEventListener('click',resetGame);
$('pauseMenuButton').addEventListener('click',showMenu);$('endMenuButton').addEventListener('click',showMenu);
window.addEventListener('blur',()=>{if(S.phase==='running')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.phase==='running')pause()});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(S.phase==='running')pause();else if(S.phase==='paused')resume()};if(e.code==='Space')input.dashQueued=true;input.keys.add(e.code)});
window.addEventListener('keyup',e=>input.keys.delete(e.code));
const updateJoy=(e)=>{const box=joy.getBoundingClientRect(),cx=box.left+box.width/2,cy=box.top+box.height/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.max(1,hypot(dx,dy)),dist=Math.min(43,d);input.joyX=dx/d*dist/43;input.joyY=dy/d*dist/43;joyThumb.style.transform=`translate(calc(-50% + ${dx/d*dist}px),calc(-50% + ${dy/d*dist}px))`;};
joyRegion.addEventListener('pointerdown',e=>{if(S.phase!=='running'||input.joyId!==null)return;e.preventDefault();input.joyId=e.pointerId;try{joyRegion.setPointerCapture(e.pointerId)}catch{}updateJoy(e)});
joyRegion.addEventListener('pointermove',e=>{if(input.joyId===e.pointerId){e.preventDefault();updateJoy(e)}});
for(const type of ['pointerup','pointercancel','lostpointercapture'])joyRegion.addEventListener(type,e=>{if(input.joyId===e.pointerId){input.joyId=null;input.joyX=0;input.joyY=0;joyThumb.style.transform='translate(-50%,-50%)'}});
$('dashButton').addEventListener('pointerdown',e=>{e.preventDefault();input.dashQueued=true});$('dashButton').addEventListener('click',()=>{input.dashQueued=true});
function joystickMove(){
 let x=input.joyX,y=input.joyY;
 const k=input.keys;
 const kx=Number(k.has('KeyD')||k.has('ArrowRight'))-Number(k.has('KeyA')||k.has('ArrowLeft'));
 const ky=Number(k.has('KeyS')||k.has('ArrowDown'))-Number(k.has('KeyW')||k.has('ArrowUp'));
 if(kx||ky){const r=hypot(kx,ky);x=kx/r;y=ky/r}
 const len=hypot(x,y);if(len>1){x/=len;y/=len}return{x,y,len:Math.min(1,len)};
}
function collideRect(x,y,r,o){const nearX=clamp(x,o.x-o.w/2,o.x+o.w/2),nearY=clamp(y,o.y-o.h/2,o.y+o.h/2);return sqr(x-nearX)+sqr(y-nearY)<r*r;}
function canMove(x,y,r){if(Math.abs(x)>1580||Math.abs(y)>1580)return false;for(const o of S.obstacles){if(Math.abs(o.x-x)>80||Math.abs(o.y-y)>80)continue;if(collideRect(x,y,r,o))return false}return true;}
function moveActor(a,dx,dy){const nx=a.x+dx,ny=a.y+dy;if(canMove(nx,ny,a.r)){a.x=nx;a.y=ny;return}if(canMove(nx,a.y,a.r))a.x=nx;if(canMove(a.x,ny,a.r))a.y=ny;}
function spawnEnemy(forceType=null,first=false){
 const p=S.player,mult=1+Math.min(1.3,S.time/130);
 const angle=rand(0,TAU),dist=first?rand(210,320):rand(230,410);
 const type=forceType|| (S.time>40&&Math.random()<.12?'heavy':S.time>20&&Math.random()<.19?'ranger':'grunt');
 const stat=type==='grunt'?{hp:47,speed:80,r:13,damage:12,cd:.85}:{hp: type==='heavy'?165:62,speed:type==='heavy'?51:68,r:type==='heavy'?20:13,damage:type==='heavy'?23:10,cd:type==='heavy'?1.1:1.5};
 const en={id:++S.enemySerial,type,x:clamp(p.x+Math.cos(angle)*dist,-1560,1560),y:clamp(p.y+Math.sin(angle)*dist,-1560,1560),r:stat.r,hp:stat.hp*mult,maxHp:stat.hp*mult,speed:stat.speed*(1+Math.min(.30,S.time/500)),damage:stat.damage,atkCD:rand(.1,.8),fireCD:rand(.3,1.5),angle:angle+Math.PI,stun:0,walk:rand(0,7),hit:0};
 if(!canMove(en.x,en.y,en.r)){en.x=p.x+Math.cos(angle)*dist*.92;en.y=p.y+Math.sin(angle)*dist*.92;}
 S.enemies.push(en);
}
function nearestTarget(range){let best=null,min=sqr(range);for(const e of S.enemies){const d=d2(S.player,e);if(d<min){min=d;best=e;}}return best;}
function bullet(x,y,vx,vy,side,damage,range,crit=false){S.bullets.push({x,y,px:x,py:y,vx,vy,side,damage,ttl:range/hypot(vx,vy)+.06,r:side==='hero'?4:5,crit});}
function flash(x,y,kind='hit',n=4){for(let i=0;i<n;i++){const a=rand(0,TAU),speed=rand(25,170),life=rand(.12,.42);S.effects.push({type:kind,x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life,ttl:life,r:rand(1.5,4)})}}
function ring(x,y,r,col){S.effects.push({type:'ring',x,y,r,life:.32,ttl:.32,col})}
function fireAt(e){const p=S.player,m=MODE[S.mode],angle=Math.atan2(e.y-p.y,e.x-p.x);p.aim=angle;
 const spread=S.mode==='hero'?rand(-.028,.028):rand(-.075,.075),dir=angle+spread;
 const x=p.x+Math.cos(dir)*28,y=p.y+Math.sin(dir)*28;
 const crit=Math.random()<m.crit;
 bullet(x,y,Math.cos(dir)*1060,Math.sin(dir)*1060,'hero',m.damage*(crit?1.8:1),m.range,crit);
 p.shotFlash=.08;p.shotCD=m.fireRate*(S.mode==='hero'?rand(.90,1.09):rand(.90,1.16));
 if(Math.random()<.25)beep('fire');
 flash(x,y,'muzzle',2);
}
function throwGrenade(){const p=S.player,m=MODE[S.mode];const a=nearestTarget(m.range*1.15);if(!a)return;
 const dest={x:a.x+rand(-12,12),y:a.y+rand(-12,12)};
 S.grenades.push({x:p.x,y:p.y,tx:dest.x,ty:dest.y,time:0,duration:.73,damage:m.grenadeDamage,radius:m.grenadeRadius});p.grenadeCD=m.grenadeCD;message('手榴彈！',.7);
}
function killEnemy(e){if(e.hp>0)return;const idx=S.enemies.indexOf(e);if(idx<0)return;S.enemies.splice(idx,1);S.kills++;flash(e.x,e.y,'death',9);ring(e.x,e.y,25,'#ffdaad');if(Math.random()<.045){S.pickups.push({x:e.x,y:e.y,life:14,type:'medkit'})}if(S.kills%20===0)message(`擊退 ${S.kills} 人！`,1.2);}
function damageEnemy(e,damage,crit){if(e.hp<=0)return;e.hp-=damage;e.hit=.12;if(crit){S.effects.push({type:'text',x:e.x,y:e.y-25,text:'暴擊!',ttl:.55,life:.55})}if(e.hp<=0)killEnemy(e)}
function damagePlayer(amount){const p=S.player;if(p.invuln>0||p.dashLeft>0||!p.alive)return;p.hp=Math.max(0,p.hp-amount);p.invuln=.37;S.shake=Math.max(S.shake,3.5);S.hitFade=.3;beep('hurt');flash(p.x,p.y,'hurt',3);if(p.hp<=0){p.alive=false;finish()}}
function blockedSegment(x1,y1,x2,y2){const steps=Math.ceil(hypot(x2-x1,y2-y1)/15);for(let i=1;i<steps;i++){const t=i/steps,x=lerp(x1,x2,t),y=lerp(y1,y2,t);for(const o of S.obstacles){if(x>o.x-o.w/2&&x<o.x+o.w/2&&y>o.y-o.h/2&&y<o.y+o.h/2)return true}}return false}
function update(dt){
 S.time+=dt;if(S.time>=150){S.time=150;finish();return}
 const p=S.player,m=MODE[S.mode];p.run+=dt;p.dashCooldown=Math.max(0,p.dashCooldown-dt);p.invuln=Math.max(0,p.invuln-dt);p.shotCD-=dt;p.shotFlash=Math.max(0,p.shotFlash-dt);p.grenadeCD-=dt;p.burstCD-=dt;p.hp=Math.min(p.maxHp,p.hp+m.regen*dt);
 if(S.noticeUntil<S.time)$('floatMsg').style.opacity='0';
 const movement=joystickMove();if(movement.len>.12){p.moveAim=Math.atan2(movement.y,movement.x);input.lastAngle=p.moveAim;}
 if(input.dashQueued){input.dashQueued=false;if(p.dashCooldown<=0){p.dashLeft=.18;p.dashCooldown=m.dashCooldown;beep('dash');ring(p.x,p.y,17,'#f7f3dd');}}
 if(p.dashLeft>0){p.dashLeft-=dt;const a=input.lastAngle;moveActor(p,Math.cos(a)*m.dashSpeed*dt,Math.sin(a)*m.dashSpeed*dt);if(Math.random()<.78)S.effects.push({type:'dash',x:p.x,y:p.y,life:.21,ttl:.21});}
 else if(movement.len>.12){moveActor(p,movement.x*m.speed*dt,movement.y*m.speed*dt)}
 const target=nearestTarget(m.range);if(target){const angle=Math.atan2(target.y-p.y,target.x-p.x);const diff=Math.atan2(Math.sin(angle-p.aim),Math.cos(angle-p.aim));p.aim+=diff*Math.min(1,dt*14);if(p.shotCD<=0){fireAt(target)}}else if(movement.len>.12){const diff=Math.atan2(Math.sin(p.moveAim-p.aim),Math.cos(p.moveAim-p.aim));p.aim+=diff*Math.min(1,dt*4)}
 if(p.grenadeCD<=0)throwGrenade();
 if(S.mode==='hero'&&p.burstCD<=0&&S.enemies.length>7){
  p.burstCD=m.burstCD;ring(p.x,p.y,70,'#f5e1a2');message('戰術掃射！',.8);
  for(let k=0;k<14;k++){const a=(k/14)*TAU;bullet(p.x+Math.cos(a)*18,p.y+Math.sin(a)*18,Math.cos(a)*770,Math.sin(a)*770,'hero',24,200,false)}
  beep('blast');
 }
 const wave=1+Math.floor(S.time/25);if(wave!==S.wave){S.wave=wave;message(`第 ${wave} 波敵軍來襲！`,1.7);beep('blast')}
 S.spawnTimer-=dt;if(S.spawnTimer<=0){const amount=2+(S.mode==='hero'?1:0)+(S.wave>=3&&Math.random()<.45?1:0)+(S.wave>=5&&Math.random()<.3?1:0);for(let j=0;j<amount&&S.enemies.length<75;j++)spawnEnemy();S.spawnTimer=Math.max(.47,1.65-S.time*.007)*rand(.78,1.15)}
 for(let i=S.enemies.length-1;i>=0;i--){const e=S.enemies[i];if(!e)continue;e.atkCD-=dt;e.fireCD-=dt;e.hit=Math.max(0,e.hit-dt);e.walk+=dt;
  const dx=p.x-e.x,dy=p.y-e.y,d=hypot(dx,dy)||1;e.angle=Math.atan2(dy,dx);
  if(e.type==='ranger'){
   if(d>200){moveActor(e,dx/d*e.speed*dt,dy/d*e.speed*dt)}else if(d<125)moveActor(e,-dx/d*e.speed*.6*dt,-dy/d*e.speed*.6*dt);
   if(d<325&&e.fireCD<=0&&!blockedSegment(e.x,e.y,p.x,p.y)){
    e.fireCD=2.25;const a=Math.atan2(dy,dx)+rand(-.10,.10);bullet(e.x+Math.cos(a)*23,e.y+Math.sin(a)*23,Math.cos(a)*285,Math.sin(a)*285,'enemy',12,330);flash(e.x,e.y,'muzzle',2);
   }
  }else{
   if(d>e.r+p.r+4){
    const sw=Math.sin(e.id*2.4+S.time*.85)*.16;
    const a=Math.atan2(dy,dx)+sw;moveActor(e,Math.cos(a)*e.speed*dt,Math.sin(a)*e.speed*dt);
   }
   if(d<e.r+p.r+5&&e.atkCD<=0){e.atkCD=e.type==='heavy'?1.25:1.0;damagePlayer(e.damage)}
  }
 }
 // Bullet segment collision avoids tunnelling through enemies at high bullet speeds.
 for(let i=S.bullets.length-1;i>=0;i--){const b=S.bullets[i];b.ttl-=dt;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.ttl<=0){S.bullets.splice(i,1);continue}
  let hit=false;
  for(const o of S.obstacles){if(Math.abs(o.x-b.x)>100&&Math.abs(o.x-b.px)>100||Math.abs(o.y-b.y)>100&&Math.abs(o.y-b.py)>100)continue;
   if(segmentRect(b.px,b.py,b.x,b.y,o.x-o.w/2,o.y-o.h/2,o.x+o.w/2,o.y+o.h/2)){hit=true;flash(b.x,b.y,'dust',3);break}
  }
  if(!hit&&b.side==='hero'){
   for(const e of S.enemies){if(segmentCircle(b.px,b.py,b.x,b.y,e.x,e.y,e.r+3)){damageEnemy(e,b.damage,b.crit);hit=true;flash(e.x,e.y,'hit',3);break}}
  }else if(!hit&&b.side==='enemy'&&segmentCircle(b.px,b.py,b.x,b.y,p.x,p.y,p.r+3)){damagePlayer(b.damage);hit=true}
  if(hit)S.bullets.splice(i,1);
 }
 for(let i=S.grenades.length-1;i>=0;i--){const g=S.grenades[i];g.time+=dt;if(g.time>=g.duration){
   S.grenades.splice(i,1);beep('blast');S.shake=Math.max(S.shake,6);ring(g.tx,g.ty,g.radius,'#ffe7a5');for(let j=0;j<22;j++)flash(g.tx+rand(-30,30),g.ty+rand(-30,30),'blast',2);
   for(const e of [...S.enemies]){const d=hypot(e.x-g.tx,e.y-g.ty);if(d<g.radius+e.r)damageEnemy(e,g.damage*(1-.33*d/g.radius),false)}
  }}
 for(let i=S.pickups.length-1;i>=0;i--){const o=S.pickups[i];o.life-=dt;if(o.life<=0){S.pickups.splice(i,1);continue}if(d2(p,o)<sqr(p.r+17)){p.hp=Math.min(p.maxHp,p.hp+40);S.pickups.splice(i,1);beep('pickup');message('拾取急救包 +40 HP',.9)}}
 for(let i=S.effects.length-1;i>=0;i--){const e=S.effects[i];e.life-=dt;if(e.vx){e.x+=e.vx*dt;e.y+=e.vy*dt}if(e.life<=0)S.effects.splice(i,1)}
 S.hitFade=Math.max(0,S.hitFade-dt);S.shake=Math.max(0,S.shake-dt*14);
 S.camera.x+=(p.x-S.camera.x)*Math.min(1,dt*8);S.camera.y+=(p.y-S.camera.y)*Math.min(1,dt*8);
 hudUpdate();
}
function segmentCircle(x1,y1,x2,y2,cx,cy,r){const dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1,t=clamp(((cx-x1)*dx+(cy-y1)*dy)/l2,0,1);return sqr(x1+dx*t-cx)+sqr(y1+dy*t-cy)<=r*r}
function segmentRect(x1,y1,x2,y2,minx,miny,maxx,maxy){
 let tmin=0,tmax=1;
 const dx=x2-x1,dy=y2-y1;
 for(const [p,d,lo,hi] of [[x1,dx,minx,maxx],[y1,dy,miny,maxy]]){
  if(Math.abs(d)<1e-7){if(p<lo||p>hi)return false;}else{const t1=(lo-p)/d,t2=(hi-p)/d,a=Math.min(t1,t2),b=Math.max(t1,t2);tmin=Math.max(tmin,a);tmax=Math.min(tmax,b);if(tmin>tmax)return false}
 }return true;
}
function hudUpdate(){const p=S.player;if(!p)return;$('timeText').textContent=formatTime(S.time);$('killText').textContent=S.kills;$('waveText').textContent=`第 ${S.wave} 波`;$('hpFill').style.width=`${100*p.hp/p.maxHp}%`;$('hpText').textContent=`${Math.ceil(p.hp)}/${p.maxHp}`;$('dashButton').disabled=p.dashCooldown>.05;$('dashLabel').textContent=p.dashCooldown>.05?`${p.dashCooldown.toFixed(1)}s`:'閃避';$('damageShade').style.opacity=String(clamp(S.hitFade*.46,0,.15));}
function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);S.w=w;S.h=h;S.dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.floor(w*S.dpr);canvas.height=Math.floor(h*S.dpr);S.scale=Math.min(1.15,Math.max(.76,Math.min(w/430,h/820)*.96));}
window.addEventListener('resize',resize);resize();
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill()}
function rr(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function drawGround(){
 // Solid ground color is the same subdued-green family as the 3D military camp.
 ctx.fillStyle='#aabd9e';ctx.fillRect(-1900,-1900,3800,3800);
 // Some hard-packed military paths, not an endless checkerboard.
 ctx.save();ctx.rotate(-.19);ctx.fillStyle='#b7bca1';ctx.fillRect(-35,-1900,91,3800);ctx.fillStyle='#d8d2bb';ctx.fillRect(-21,-1900,62,3800);ctx.fillStyle='#c1bfa8';ctx.fillRect(-24,-1900,3,3800);ctx.fillRect(38,-1900,3,3800);ctx.restore();
 for(const d of S.soil){if(Math.abs(d.x-S.camera.x)>S.w*.8+90||Math.abs(d.y-S.camera.y)>S.h*.8+90)continue;ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.angle);ellipse(0,0,d.rx,d.ry,'#a3b29655');ellipse(-3,-2,d.rx*.55,d.ry*.6,'#b8b69a55');ctx.restore()}
 for(const d of S.decor){if(Math.abs(d.x-S.camera.x)>S.w*.9+30||Math.abs(d.y-S.camera.y)>S.h*.9+30)continue;
  if(d.type<.48){line(d.x-2,d.y,d.x,d.y-2*d.size,'#789b7786',.8);line(d.x,d.y,d.x+2,d.y-1.8*d.size,'#799b7770',.8)}
  else if(d.type<.82)ellipse(d.x,d.y,d.size*.7,d.size*.3,'#7e997662');
  else{ctx.fillStyle='#d4c6a278';ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.rot);ctx.fillRect(0,0,d.size*1.2,1.4);ctx.restore()}
 }
 // Scenic training-field details.
 for(const [x,y] of [[-630,-200],[575,-320],[-475,445]]){
  ellipse(x,y,50,16,'#748d7088');ellipse(x+4,y-4,40,9,'#8da17a');
 }
}
function drawObstacle(o){const {x,y,w,h,type}=o;
 ellipse(x+3,y+h*.42+4,w*.58,h*.33,'#405c4750');
 if(type==='crate'){
  rr(x-w/2,y-h/2,w,h,3,'#856c4d');rr(x-w/2+3,y-h/2+3,w-6,h-6,2,'#b3976b');
  line(x-w*.38,y-h*.32,x+w*.38,y+h*.32,'#92704c',3);line(x+w*.38,y-h*.32,x-w*.38,y+h*.32,'#92704c',3);
  ctx.strokeStyle='#dfc49a';ctx.lineWidth=1.4;ctx.strokeRect(x-w/2+4,y-h/2+4,w-8,h-8);
 }else{
  rr(x-w/2,y-h/2,w,h,12,'#77886a');rr(x-w/2+3,y-h/2+2,w-6,h-6,10,'#9aaa86');
  for(let j=1;j<=3;j++){const px=x-w/2+j*w/4;line(px,y-h/2+4,px-2,y+h/2-3,'#748a70',2)}
 }
}
function drawSoldier(x,y,angle,team,anim,kind='grunt',flash=0,hpRatio=1){
 const allied=team==='hero',big=kind==='heavy',scale=big?1.35:1;
 ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
 ellipse(2,13,17,8,'#34493646');
 const swing=Math.sin(anim*12)*3.4;
 // Face direction is always +X in local coordinates, not necessarily movement direction.
 rr(-14,-13+swing*.32,14,9,4,allied?'#344b3e':'#574642');
 rr(-14,4-swing*.32,14,9,4,allied?'#364e42':'#55413f');
 ellipse(-1,0,16,15,allied?'#375b44':kind==='heavy'?'#8a5549':'#9e5a4c');
 rr(-11,-12,17,24,7,allied?'#587b54':'#ae6659');
 rr(-7,-8,13,16,4,allied?'#7da36d':kind==='heavy'?'#aa8070':'#ca8f76');
 // Upper arms and hands follow the weapon aim.
 rr(4,-12,18,7,3,allied?'#60795a':'#b27c67');rr(3,6,18,7,3,allied?'#60795a':'#b27c67');
 ellipse(21,-8,4.2,4.2,allied?'#d1bd94':'#c69e7c');ellipse(21,9,4.2,4.2,allied?'#d1bd94':'#c69e7c');
 // The rifle is physically connected to the hands; no free-floating mesh.
 rr(8,-4,37,9,2,'#333f38');rr(27,-3,24,4,1,'#242f2c');rr(1,-8,12,6,1,'#5b6e54');
 rr(6,6,8,8,2,'#303c34');
 if(flash>0){ctx.fillStyle='#ffe9a5';ctx.beginPath();ctx.moveTo(49,0);ctx.lineTo(65,-10);ctx.lineTo(60,0);ctx.lineTo(65,10);ctx.closePath();ctx.fill()}
 // Visible helmet and visor.
 ellipse(0,-1,12.8,12,allied?'#2c553e':kind==='heavy'?'#664138':'#98473c');
 rr(4,-6,10,10,3,allied?'#668d56':'#bc7868');
 line(7,-10,7,8,allied?'#1f4738':'#743d35',2.5);
 if(allied){rr(-5,-16,17,3,2,'#e9d6a2');}
 ctx.restore();
 if(team==='enemy'&&hpRatio<.999){rr(x-19,y-34,38,4,2,'#5b2c27a8');rr(x-19,y-34,38*clamp(hpRatio,0,1),4,2,'#dd9078')}
}
function drawGrenade(g){const t=clamp(g.time/g.duration,0,1),x=lerp(g.x,g.tx,t),y=lerp(g.y,g.ty,t)-Math.sin(Math.PI*t)*52;
 ctx.strokeStyle='#5a674e50';ctx.setLineDash([5,6]);ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(g.tx,g.ty,g.radius,0,TAU);ctx.stroke();ctx.setLineDash([]);ellipse(x,y+6,7,3,'#243c3262');ellipse(x,y,6,6,'#455a42');rr(x+3,y-8,3,5,1,'#c5bf9b');}
function drawProjectile(b){const col=b.side==='hero'?'#ffef9d':'#fb8b70';line(b.px,b.py,b.x,b.y,col,b.side==='hero'?3.8:4);ellipse(b.x,b.y,b.side==='hero'?3:4,3,'#fff6d8')}
function render(){
 const {w,h,dpr}=S;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 // When menus show the background remains alive but static. For mobile draw only visible objects.
 const scale=S.scale;ctx.save();ctx.translate(w/2+(Math.random()-.5)*S.shake,h/2+(Math.random()-.5)*S.shake);ctx.scale(scale,scale);ctx.translate(-S.camera.x,-S.camera.y);
 drawGround();
 for(const o of S.obstacles){if(Math.abs(o.x-S.camera.x)<w/scale*.6+80&&Math.abs(o.y-S.camera.y)<h/scale*.6+80)drawObstacle(o)}
 for(const p of S.pickups){ellipse(p.x,p.y+7,14,5,'#1e442a47');rr(p.x-10,p.y-12,20,19,4,'#f1f0d8');rr(p.x-3,p.y-9,6,14,2,'#b85b54');rr(p.x-7,p.y-5,14,6,2,'#b85b54')}
 for(const g of S.grenades)drawGrenade(g);
 for(const b of S.bullets)drawProjectile(b);
 const visible=S.enemies.filter(e=>Math.abs(e.x-S.camera.x)<w/scale*.62+70&&Math.abs(e.y-S.camera.y)<h/scale*.62+70).sort((a,b)=>a.y-b.y);
 for(const e of visible)drawSoldier(e.x,e.y,e.angle,'enemy',e.walk,e.type,e.hit,e.hp/e.maxHp);
 if(S.player){const p=S.player;
  if(p.hp>0){if(p.invuln<=0||Math.floor(S.time*20)%2===0){drawSoldier(p.x,p.y,p.aim,'hero',p.run*(p.dashLeft>0?2:1),'grunt',p.shotFlash,p.hp/p.maxHp)}
   if(p.dashLeft>0){ringVisual(p.x,p.y,26,'#e6eac5',.28)}
   // small green selection arrow above main character helps distinguish in crowds.
   ctx.fillStyle='#fff8cb';ctx.beginPath();ctx.moveTo(p.x,p.y-34);ctx.lineTo(p.x-8,p.y-45);ctx.lineTo(p.x+8,p.y-45);ctx.closePath();ctx.fill();
  }
 }
 for(const e of S.effects){const alpha=clamp(e.life/e.ttl,0,1);ctx.globalAlpha=alpha;
  if(e.type==='text'){ctx.fillStyle='#fff6c5';ctx.font='bold 17px sans-serif';ctx.textAlign='center';ctx.fillText(e.text,e.x,e.y-20*(1-alpha));}
  else if(e.type==='ring'){ctx.strokeStyle=e.col;ctx.lineWidth=3+alpha*2;ctx.beginPath();ctx.arc(e.x,e.y,e.r*(.4+.6*(1-alpha)),0,TAU);ctx.stroke();}
  else if(e.type==='dash')ellipse(e.x,e.y,21,12,'#fcf3d1');
  else{const color={hit:'#f9d69e',muzzle:'#fff1b5',hurt:'#c75d4f',blast:'#f9c66c',dust:'#e1c5a2',death:'#cc796b'}[e.type]||'#fff';ellipse(e.x,e.y,e.r*(.6+alpha),e.r*(.6+alpha),color)}
  ctx.globalAlpha=1;
 }
 ctx.restore();
 // Direction hints only when needed; do not clutter the playfield.
 if(S.phase==='running'&&S.player){const cx=w/2,cy=h/2;
  const far=S.enemies.filter(e=>hypot((e.x-S.camera.x)*scale,(e.y-S.camera.y)*scale)>Math.min(w,h)*.65).slice(0,7);
  ctx.globalAlpha=.55;
  for(const e of far){const a=Math.atan2(e.y-S.camera.y,e.x-S.camera.x),r=Math.min(w,h)*.37;const x=clamp(cx+Math.cos(a)*r,17,w-17),y=clamp(cy+Math.sin(a)*r,140,h-80);
   ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#b45349';ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(-3,-6);ctx.lineTo(-3,6);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.globalAlpha=1;
 }
}
function ringVisual(x,y,r,col,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore()}
function frame(now){
 const dt=Math.min(.036,Math.max(0,(now-(S.last||now))/1000));S.last=now;
 if(S.phase==='running')update(dt);
 if(S.phase==='running'||S.phase==='paused'||S.phase==='ended')render();
 requestAnimationFrame(frame);
}
showMenu();requestAnimationFrame(frame);
// Exposed for deterministic browser smoke tests and debugging. Not a gameplay cheat UI.
window.__armyBattle2D={state:S,mode:MODE,reset:resetGame,pause,resume,finish,update,spawnEnemy,moveActor};
