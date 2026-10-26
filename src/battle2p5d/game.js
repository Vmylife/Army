const $ = id => document.getElementById(id);
const canvas = $('battleCanvas');
const ctx = canvas.getContext('2d', { alpha: false });
if (!ctx) throw new Error('Canvas 2D unavailable');

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const hypot = Math.hypot;
const formatTime = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

// v0.13.4: keep original character artwork; add alpha PNG muzzle flashes and hit sprites.
const SPRITE_URLS = {
  heroLow: './src/battle2p5d/assets/hero_low.png?v=0133',
  heroAim: './src/battle2p5d/assets/hero_aim.png?v=0133',
  enemyAim: './src/battle2p5d/assets/enemy_aim.png?v=0133',
  muzzle1: './src/battle2p5d/assets/hero_muzzle_01.png?v=0134',
  muzzle2: './src/battle2p5d/assets/hero_muzzle_02.png?v=0134',
  muzzle3: './src/battle2p5d/assets/hero_muzzle_03.png?v=0134',
  muzzle4: './src/battle2p5d/assets/hero_muzzle_04.png?v=0134',
  sparkSoldier1: './src/battle2p5d/assets/hit_soldier_01.png?v=0134',
  sparkSoldier2: './src/battle2p5d/assets/hit_soldier_02.png?v=0134',
  sparkSoldier3: './src/battle2p5d/assets/hit_soldier_03.png?v=0134',
  sparkCover1: './src/battle2p5d/assets/hit_cover_01.png?v=0134',
  sparkCover2: './src/battle2p5d/assets/hit_cover_02.png?v=0134',
  sparkCover3: './src/battle2p5d/assets/hit_cover_03.png?v=0134', 
};
const SPRITES = {};
let spritesLoading = null;
function ensureSprites(){
  if(!spritesLoading){
    spritesLoading = Promise.all(Object.entries(SPRITE_URLS).map(([name,url])=>new Promise((resolve,reject)=>{
      const im = new Image();
      im.onload = ()=>{ if(im.naturalWidth<1) reject(new Error(name+' 空圖片')); else {SPRITES[name]=im; resolve();} };
      im.onerror = ()=>reject(new Error(name+' 圖片載入失敗：'+url));
      im.src = url;
    }))).catch(err=>{spritesLoading=null;throw err;});
  }
  return spritesLoading;
}


const MODE = {
  normal: { name: '普通士兵', hp: 180, speed: 150, dashSpeed: 420, dashCooldown: 2.7, fireRate: 0.62, range: 260, damage: 24, grenadeCD: 22, grenadeDamage: 90, grenadeRadius: 86, burstCD: 0 },
  hero: { name: '超級士兵', hp: 340, speed: 210, dashSpeed: 560, dashCooldown: 1.5, fireRate: 0.18, range: 320, damage: 36, grenadeCD: 8.5, grenadeDamage: 160, grenadeRadius: 126, burstCD: 12 }
};

const S = {
  phase: 'menu',
  type: 'normal',
  time: 0,
  last: 0,
  w: 0, h: 0, dpr: 1,
  camera: { x: 0, y: 0 },
  scale: 1,
  isoX: 0.64,
  isoY: 0.35,
  kills: 0,
  wave: 1,
  player: null,
  enemies: [],
  bullets: [],
  trailGhosts: [],
  effects: [],
  grenades: [],
  obstacles: [],
  spawnTimer: 0,
  noticeUntil: 0,
  mapHalf: 980,
};

const input = { keys: new Set(), joyId: null, joyX: 0, joyY: 0, dashQueued: false };
const joyThumb = $('joyThumb');
const joyRegion = $('joyRegion');
let audioCtx = null;

function beep(type='fire') {
  try {
    audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const map = {
      fire:[150,.03,.03,'square'],
      hit:[120,.06,.03,'sawtooth'],
      hurt:[85,.11,.07,'triangle'],
      blast:[56,.20,.09,'sawtooth'],
      dash:[260,.06,.03,'triangle'],
      chime:[440,.18,.04,'sine']
    };
    const [freq,dur,vol,wave] = map[type] || map.fire;
    osc.type = wave; osc.frequency.setValueAtTime(freq,t); osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq*.7), t+dur);
    gain.gain.setValueAtTime(vol,t); gain.gain.exponentialRampToValueAtTime(.0001, t+dur);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(t); osc.stop(t + dur + .02);
  } catch {}
}

function show(id) {
  for (const k of ['startScreen','pauseScreen','endScreen','loadingScreen']) $(k).hidden = k !== id;
}
function setHUD(on){ $('hud').hidden=!on; $('controls').hidden=!on; }
function setMode(mode){
  S.type = mode;
  $('modeNormal').classList.toggle('selected', mode === 'normal');
  $('modeHero').classList.toggle('selected', mode === 'hero');
  $('modeNormal').setAttribute('aria-pressed', String(mode === 'normal'));
  $('modeHero').setAttribute('aria-pressed', String(mode === 'hero'));
}
function msg(text, sec=1.4){ const el = $('floatMsg'); el.textContent = text; el.style.opacity = '1'; S.noticeUntil = S.time + sec; }
function clearInput(){ input.keys.clear(); input.joyId = null; input.joyX = 0; input.joyY = 0; input.dashQueued = false; joyThumb.style.transform = 'translate(-50%,-50%)'; }
function showMenu(){ S.phase = 'menu'; setHUD(false); show('startScreen'); clearInput(); }
function pause(){ if(S.phase!=='running') return; S.phase='paused'; clearInput(); show('pauseScreen'); }
function resume(){ if(S.phase!=='paused') return; S.phase='running'; show(''); S.last = performance.now(); }

$('modeNormal').addEventListener('click',()=>setMode('normal'));
$('modeHero').addEventListener('click',()=>setMode('hero'));
$('startButton').addEventListener('click',async()=>{
  show('loadingScreen');
  try{
    await ensureSprites();
    // Allow loading overlay to paint, then reveal the fully prepared battlefield.
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    resetGame();
  }catch(err){
    console.error('2.5D sprite load failed',err);
    S.phase='menu'; setHUD(false); show('startScreen');
    $('startButton').textContent='素材載入失敗，點此重試';
    alert('人物圖片載入失敗，請確認 ZIP 裡的 src/battle2p5d/assets/ 三張 PNG 都已上傳。\n'+err.message);
  }
});
$('pauseButton').addEventListener('click', pause);
$('resumeButton').addEventListener('click', resume);
$('retryButton').addEventListener('click', resetGame);
$('pauseMenuButton').addEventListener('click', showMenu);
$('endMenuButton').addEventListener('click', showMenu);
window.addEventListener('blur',()=>{ if(S.phase==='running') pause(); });
document.addEventListener('visibilitychange',()=>{ if(document.hidden && S.phase==='running') pause(); });

window.addEventListener('keydown', e => {
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape') { if (S.phase === 'running') pause(); else if (S.phase === 'paused') resume(); }
  if (e.code === 'Space') input.dashQueued = true;
  input.keys.add(e.code);
});
window.addEventListener('keyup', e => input.keys.delete(e.code));

function updateJoy(e){
  const box = $('joystick').getBoundingClientRect();
  const cx = box.left + box.width/2, cy = box.top + box.height/2;
  const dx = e.clientX - cx, dy = e.clientY - cy;
  const d = Math.max(1, hypot(dx, dy));
  const dist = Math.min(43, d);
  input.joyX = dx / d * dist / 43;
  input.joyY = dy / d * dist / 43;
  joyThumb.style.transform = `translate(calc(-50% + ${dx / d * dist}px), calc(-50% + ${dy / d * dist}px))`;
}
joyRegion.addEventListener('pointerdown', e => { if(S.phase!=='running' || input.joyId!==null) return; e.preventDefault(); input.joyId = e.pointerId; try{joyRegion.setPointerCapture(e.pointerId);}catch{} updateJoy(e); });
joyRegion.addEventListener('pointermove', e => { if(input.joyId===e.pointerId){ e.preventDefault(); updateJoy(e); }});
for (const type of ['pointerup','pointercancel','lostpointercapture']) joyRegion.addEventListener(type, e => { if(input.joyId===e.pointerId){ input.joyId = null; input.joyX = 0; input.joyY = 0; joyThumb.style.transform='translate(-50%,-50%)'; }});
$('dashButton').addEventListener('pointerdown', e => { e.preventDefault(); input.dashQueued = true; });
$('dashButton').addEventListener('click', ()=> input.dashQueued = true);

function buildWorld(){
  S.obstacles = [
    {type:'sandbag', x:-240, y:-115, w:120, h:50, z:18},
    {type:'crate', x:-120, y:40, w:74, h:74, z:42},
    {type:'crate', x:-30, y:92, w:74, h:74, z:42},
    {type:'sandbag', x:140, y:-8, w:124, h:48, z:18},
    {type:'crate', x:315, y:-148, w:74, h:74, z:42},
    {type:'sandbag', x:390, y:48, w:118, h:48, z:18},
    {type:'crate', x:145, y:235, w:74, h:74, z:42},
    {type:'sandbag', x:-340, y:230, w:118, h:48, z:18},
    {type:'crate', x:-420, y:40, w:74, h:74, z:42},
    {type:'sandbag', x:-12, y:-260, w:118, h:48, z:18},
    {type:'crate', x:510, y:242, w:74, h:74, z:42},
    {type:'sandbag', x:0, y:360, w:140, h:48, z:18},
  ];
}

function resetGame(){
  clearInput();
  buildWorld();
  S.time = 0; S.kills = 0; S.wave = 1; S.enemies = []; S.bullets = []; S.trailGhosts = []; S.effects = []; S.grenades = [];
  S.spawnTimer = 1.3;
  const m = MODE[S.type];
  S.player = { x:0, y:0, face:1, r:22, hp:m.hp, maxHp:m.hp, aim:-Math.PI/2, moveAim:-Math.PI/2, anim:0, shotCD:.3, shotFlash:0, dashLeft:0, dashCooldown:0, invuln:0, grenadeCD:m.grenadeCD * .55, burstCD:m.burstCD, alive:true };
  for(let i=0;i<17;i++) spawnEnemy(true);
  S.camera.x = 0; S.camera.y = 0;
  setHUD(true); show(''); S.phase='running'; S.last = performance.now();
  $('modeLabel').textContent = m.name; $('waveText').textContent = '第 1 波'; $('skillText').textContent = S.type==='hero' ? '高速射擊 · 手榴彈' : '基本步槍';
  msg('這版重點：看阿兵哥的人物感！', 1.7);
  hudUpdate();
}

function finish(dead=false){
  S.phase = 'ended'; setHUD(false);
  $('endEyebrow').textContent = dead ? 'SOLDIER DOWN' : 'TEST COMPLETE';
  $('endTitle').textContent = dead ? '士兵失去戰鬥能力' : '測試結束';
  $('endDescription').textContent = dead ? '這次主要看人物和操作感，之後再慢慢加完整內容。' : '這版是人物戰鬥感測試，不是正式數值版。';
  $('endKills').textContent = S.kills; $('endTime').textContent = formatTime(S.time); $('endWave').textContent = S.wave;
  show('endScreen');
}

function hudUpdate(){
  const p=S.player; if(!p) return;
  $('timeText').textContent = formatTime(S.time);
  $('killText').textContent = S.kills;
  $('waveText').textContent = `第 ${S.wave} 波`;
  $('hpFill').style.width = `${100 * p.hp / p.maxHp}%`;
  $('hpText').textContent = `${Math.ceil(p.hp)}/${p.maxHp}`;
  $('dashButton').disabled = p.dashCooldown > .05;
  $('dashLabel').textContent = p.dashCooldown > .05 ? `${p.dashCooldown.toFixed(1)}s` : '閃避';
}

function joystickMove(){
  let x = input.joyX, y = input.joyY;
  const k = input.keys;
  const kx = Number(k.has('KeyD') || k.has('ArrowRight')) - Number(k.has('KeyA') || k.has('ArrowLeft'));
  const ky = Number(k.has('KeyS') || k.has('ArrowDown')) - Number(k.has('KeyW') || k.has('ArrowUp'));
  if(kx || ky){ const len = hypot(kx, ky) || 1; x = kx / len; y = ky / len; }
  const len = Math.min(1, hypot(x, y));
  if(len > 1e-3){
    // Inverse isometric projection: joystick UP means SCREEN UP, not world -Y/diagonal.
    const wx=(x/S.isoX + y/S.isoY)*.5;
    const wy=(y/S.isoY - x/S.isoX)*.5;
    const magnitude=hypot(wx,wy)||1;
    return {x:wx/magnitude,y:wy/magnitude,len};
  }
  return {x:0,y:0,len:0};
}

function circleRectCollide(x, y, r, o){
  const nx = clamp(x, o.x - o.w/2, o.x + o.w/2);
  const ny = clamp(y, o.y - o.h/2, o.y + o.h/2);
  const dx = x - nx, dy = y - ny;
  return dx*dx + dy*dy < r*r;
}
function canMove(x, y, r){
  if(Math.abs(x) > S.mapHalf || Math.abs(y) > S.mapHalf) return false;
  for(const o of S.obstacles){ if(circleRectCollide(x,y,r,o)) return false; }
  return true;
}
function moveActor(a, dx, dy){
  const nx = a.x + dx, ny = a.y + dy;
  if(canMove(nx, ny, a.r)){ a.x = nx; a.y = ny; return; }
  if(canMove(nx, a.y, a.r)) a.x = nx;
  if(canMove(a.x, ny, a.r)) a.y = ny;
}

function lineBlocked(ax, ay, bx, by){
  for(const o of S.obstacles){
    if(segmentRect(ax, ay, bx, by, o.x-o.w/2, o.y-o.h/2, o.x+o.w/2, o.y+o.h/2)) return true;
  }
  return false;
}
function segmentCircle(x1,y1,x2,y2,cx,cy,r){ const dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy||1; const t=clamp(((cx-x1)*dx+(cy-y1)*dy)/l2,0,1); return (x1+dx*t-cx)**2 + (y1+dy*t-cy)**2 <= r*r; }
function segmentRect(x1,y1,x2,y2,minx,miny,maxx,maxy){
  let tmin = 0, tmax = 1; const dx = x2 - x1, dy = y2 - y1;
  for(const [p, d, lo, hi] of [[x1,dx,minx,maxx],[y1,dy,miny,maxy]]){
    if(Math.abs(d) < 1e-7){ if(p < lo || p > hi) return false; }
    else {
      const t1=(lo-p)/d, t2=(hi-p)/d; const a=Math.min(t1,t2), b=Math.max(t1,t2); tmin=Math.max(tmin,a); tmax=Math.min(tmax,b); if(tmin > tmax) return false;
    }
  }
  return true;
}

function nearestEnemy(range){
  const p = S.player; let best=null, min = range * range;
  for(const e of S.enemies){ const dx=e.x-p.x, dy=e.y-p.y, d=dx*dx+dy*dy; if(d < min && !lineBlocked(p.x,p.y,e.x,e.y)){ min=d; best=e; } }
  return best;
}

function spawnEnemy(first=false){
  const p=S.player; let x=0,y=0;
  // Spawn around the current camera, not at distant map corners: enemies visibly surround the player.
  for(let attempt=0;attempt<12;attempt++){
    const angle=rand(0,TAU), distance=first ? rand(170,365) : rand(330,560);
    x=clamp(p.x+Math.cos(angle)*distance,-S.mapHalf+35,S.mapHalf-35);
    y=clamp(p.y+Math.sin(angle)*distance,-S.mapHalf+35,S.mapHalf-35);
    if(canMove(x,y,22) && hypot(x-p.x,y-p.y)>115) break;
  }
  const waveMul=1+Math.min(1.0,S.time/160);
  const t=S.time>35&&Math.random()<.12?'heavy':S.time>12&&Math.random()<.25?'ranger':'grunt';
  const stat=t==='grunt' ? {hp:48,speed:65,r:18,damage:5}
            : t==='heavy' ? {hp:145,speed:47,r:23,damage:15}
            : {hp:62,speed:58,r:18,damage:7};
  S.enemies.push({type:t,x,y,r:stat.r,hp:stat.hp*waveMul,maxHp:stat.hp*waveMul,
    speed:stat.speed*(1+Math.min(.22,S.time/260)),damage:stat.damage,
    fireCD:rand(.7,3.3),atkCD:rand(.3,1.2),aim:0,anim:Math.random()*6,hit:0,shotFlash:0,face:1});
}

// Convert an on-screen barrel/torso position back into the isometric combat plane.
// Projectiles advance in world coordinates; only VFX is drawn in screen coordinates.
function unprojectScreen(sx, sy, z=12){
  const u=(sx-S.w*.5)/(S.isoX*S.scale);
  const v=(sy-S.h*.5+z*S.scale)/(S.isoY*S.scale);
  return {x:S.camera.x+(u+v)*.5, y:S.camera.y+(v-u)*.5};
}
function actorBodyPoint(a, team){
  const rect=spriteRect(a,team);
  if(!rect)return {x:a.x,y:a.y};
  // The transparent illustration is anchored at the feet: target its torso, not the feet.
  return unprojectScreen(rect.at.x,rect.y+rect.h*.55,12);
}
function fireBullet(from,target,side,damage,speed=650,critChance=0){
  const team=side==='hero'?'hero':'enemy';
  const m=spriteMuzzle(from,team);
  const start=unprojectScreen(m.x,m.y,12);
  const end=actorBodyPoint(target,side==='hero'?'enemy':'hero');
  const dx=end.x-start.x,dy=end.y-start.y;
  const spread=side==='hero'?rand(-.028,.028):rand(-.07,.07);
  const angle=Math.atan2(dy,dx)+spread;
  const crit=side==='hero'&&Math.random()<critChance;
  const bullet={x:start.x,y:start.y,px:start.x,py:start.y,
    vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,
    side,damage:crit?damage*1.6:damage,ttl:1.25,crit,age:0,
    trail:[{x:start.x,y:start.y}]};
  S.bullets.push(bullet);
  from.flashVariant=Math.floor(Math.random()*4)+1;
  // Cap for rare high-entity scenes so effect workload remains bounded on phones.
  if(S.bullets.length>135)S.bullets.splice(0,S.bullets.length-135);
}
// Returns first intersection fraction in [0,1], or null (nearest visible impact).
function impactCircleT(ax,ay,bx,by,cx,cy,r){
  const dx=bx-ax,dy=by-ay, fx=ax-cx,fy=ay-cy;
  const A=dx*dx+dy*dy; if(A<1e-9)return null;
  const C=fx*fx+fy*fy-r*r;
  if(C<=0)return 0;
  const B=2*(fx*dx+fy*dy);const disc=B*B-4*A*C;
  if(disc<0)return null;
  const t=(-B-Math.sqrt(disc))/(2*A);
  return t>=0&&t<=1?t:null;
}
function impactRectT(ax,ay,bx,by,o){
  const bounds=[[ax,bx-ax,o.x-o.w*.5,o.x+o.w*.5],
                [ay,by-ay,o.y-o.h*.5,o.y+o.h*.5]];
  let t0=0,t1=1;
  for(const [p,d,lo,hi] of bounds){
    if(Math.abs(d)<1e-9){if(p<lo||p>hi)return null;}
    else{let a=(lo-p)/d,b=(hi-p)/d;if(a>b)[a,b]=[b,a];
      t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return null;}
  }
  return t0;
}
function addImpact(kind,x,y){
  // Two different, three-frame PNG animations. Sprite not used as a projectile.
  S.effects.push({type:kind==='cover'?'coverSpark':'soldierSpark',x,y,z:12,ttl:.138,life:.138});
  if(S.effects.length>90)S.effects.splice(0,S.effects.length-90);
}
function retireBullet(i,b,keepTrail=true){
  if(keepTrail&&b.trail.length>1){
    S.trailGhosts.push({side:b.side,trail:b.trail.map(p=>({x:p.x,y:p.y})),life:.105,ttl:.105});
    if(S.trailGhosts.length>32)S.trailGhosts.shift();
  }
  S.bullets.splice(i,1);
}
function flashText(x,y,text,col='#fff6c9'){ S.effects.push({type:'text', x, y, text, col, ttl:.55, life:.55}); }
function ring(x,y,r,col){ S.effects.push({type:'ring', x,y,r,col, ttl:.35, life:.35}); }
function burst(x,y,type='hit',ttl=.25,r=10){ S.effects.push({type, x,y, ttl, life:ttl, r}); }

function damageEnemy(e, dmg){
  e.hp -= dmg; e.hit = .14; {const hit=actorBodyPoint(e,'enemy');addImpact('soldier',hit.x,hit.y);} beep('hit');
  if(e.hp <= 0){
    const idx = S.enemies.indexOf(e); if(idx>=0) S.enemies.splice(idx,1);
    S.kills++; burst(e.x,e.y,'death',.42, 18); flashText(e.x,e.y, Math.round(dmg), '#ffe5b1');
    if(S.kills % 12 === 0) msg('人物感覺對了嗎？繼續看看。', 1.0);
  }
}
function damagePlayer(dmg){
  const p=S.player; if(p.invuln>0 || S.phase!=='running') return;
  p.hp -= dmg; p.invuln = .32; {const hit=actorBodyPoint(p,'hero');addImpact('soldier',hit.x,hit.y);} beep('hurt');
  if(p.hp <= 0){ p.hp = 0; p.alive = false; finish(true); }
}
function throwGrenade(){
  const p = S.player; if(S.enemies.length===0) return;
  let best = null, bestScore = -1;
  for(const e of S.enemies){ let score = 0; for(const k of S.enemies){ if(hypot(k.x-e.x,k.y-e.y)<120) score++; } if(score > bestScore){ bestScore = score; best = e; }}
  if(!best) return;
  const m=MODE[S.type];
  S.grenades.push({x:p.x,y:p.y,tx:best.x,ty:best.y,time:0,duration:.65,radius:m.grenadeRadius,damage:m.grenadeDamage});
  p.grenadeCD = m.grenadeCD; msg('手榴彈！', .7);
}

function update(dt){
  const p = S.player; if(!p || !p.alive) return;
  S.time += dt;
  if(S.noticeUntil && S.time > S.noticeUntil) $('floatMsg').style.opacity = '0';
  p.shotCD = Math.max(0,p.shotCD-dt); p.shotFlash = Math.max(0,p.shotFlash-dt*5); p.dashCooldown = Math.max(0,p.dashCooldown-dt); p.invuln = Math.max(0,p.invuln-dt); p.grenadeCD -= dt; if(S.type==='hero') p.burstCD -= dt;
  const move = joystickMove();
  if(move.len > .06){ p.moveAim = Math.atan2(move.y, move.x); p.anim += dt * (3.7 + move.len*4.1); }
  else p.anim += dt * 1.1;
  let speed = MODE[S.type].speed;
  if(input.dashQueued && p.dashCooldown <= 0 && move.len > .05){
    p.dashLeft = .12; p.dashCooldown = MODE[S.type].dashCooldown; beep('dash'); burst(p.x,p.y,'dash',.18, 22); input.dashQueued = false;
  }
  if(p.dashLeft > 0){ p.dashLeft -= dt; speed = MODE[S.type].dashSpeed; }
  if(move.len > .04) moveActor(p, move.x * speed * dt, move.y * speed * dt);

  const target = nearestEnemy(MODE[S.type].range);
  p.autoTarget = target;
  if(target){
    const angle = Math.atan2(target.y-p.y, target.x-p.x);
    const diff = Math.atan2(Math.sin(angle-p.aim), Math.cos(angle-p.aim));
    p.aim += diff * Math.min(1, dt*12);
    if(p.shotCD <= 0){
      p.shotCD = MODE[S.type].fireRate; p.shotFlash = .55; fireBullet(p, target, 'hero', MODE[S.type].damage, 680, S.type==='hero' ? .24 : .08); beep('fire');
    }
  } else if(move.len > .08) {
    const diff = Math.atan2(Math.sin(p.moveAim-p.aim), Math.cos(p.moveAim-p.aim));
    p.aim += diff * Math.min(1, dt*6);
  }

  if(p.grenadeCD <= 0) throwGrenade();
  const newWave = 1 + Math.floor(S.time / 24);
  if(newWave !== S.wave){ S.wave = newWave; msg(`第 ${S.wave} 波敵軍逼近！`,1.5); beep('blast'); }
  S.spawnTimer -= dt;
  if(S.spawnTimer <= 0){
    const amount = 3 + (S.type==='hero'?1:0) + (S.wave>=3?1:0) + (S.wave>=5?1:0);
    const cap = S.w<650 ? 55 : 78;
    for(let i=0;i<amount && S.enemies.length<cap;i++) spawnEnemy(false);
    S.spawnTimer = Math.max(.66, 1.42 - S.time*.0045)*rand(.88,1.12);
  }

  for(let i=S.enemies.length-1;i>=0;i--){
    const e=S.enemies[i]; e.anim += dt*3.1; e.fireCD -= dt; e.atkCD -= dt; e.shotFlash = Math.max(0,e.shotFlash-dt*4); e.hit = Math.max(0,e.hit-dt);
    const dx=p.x-e.x, dy=p.y-e.y, d=hypot(dx,dy)||1; e.aim = Math.atan2(dy,dx);
    if(e.type==='ranger'){
      if(d > 220) moveActor(e, dx/d * e.speed * dt, dy/d * e.speed * dt);
      else if(d < 145) moveActor(e, -dx/d * e.speed * .7 * dt, -dy/d * e.speed * .7 * dt);
      if(d < 310 && e.fireCD <= 0 && !lineBlocked(e.x,e.y,p.x,p.y)){
        e.fireCD = rand(2.1,2.9); e.shotFlash = .24;
        fireBullet(e,p,'enemy',e.damage,520,0); beep('fire');
      }
    } else {
      if(d > (e.type==='heavy'?e.r+p.r+7:125)){
        const side=Math.sin(S.time*1.2+i)*.16;
        moveActor(e,Math.cos(e.aim+side)*e.speed*dt,Math.sin(e.aim+side)*e.speed*dt);
      }
      // Red riflemen also occasionally shoot; melee pressure remains from heavy soldiers.
      if(e.type==='grunt' && d<245 && e.fireCD<=0 && !lineBlocked(e.x,e.y,p.x,p.y)){
        e.fireCD=rand(3.0,4.0); e.shotFlash=.24;
        fireBullet(e,p,'enemy',e.damage,470,0);
      }
      if(e.type==='heavy' && d<e.r+p.r+4 && e.atkCD<=0){e.atkCD=1.35;damagePlayer(e.damage);}
    }
  }

  // Animated projectiles: actual world-space movement, swept collisions, 0.17 s history.
  // All effects remain independent of the PNG artwork, enabling visible left/right shots.
  for(let i=S.bullets.length-1;i>=0;i--){
    const b=S.bullets[i]; b.ttl-=dt;b.age+=dt;
    b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;
    let hitT=1,hitObject=null,hitType=null;
    for(const o of S.obstacles){
      const t=impactRectT(b.px,b.py,b.x,b.y,o);
      if(t!==null&&t<hitT){hitT=t;hitObject=o;hitType='cover';}
    }
    if(b.side==='hero'){
      for(const e of S.enemies){
        const a=actorBodyPoint(e,'enemy');
        const t=impactCircleT(b.px,b.py,b.x,b.y,a.x,a.y,e.r+9);
        if(t!==null&&t<hitT){hitT=t;hitObject=e;hitType='enemy';}
      }
    }else{
      const a=actorBodyPoint(p,'hero');
      const t=impactCircleT(b.px,b.py,b.x,b.y,a.x,a.y,p.r+7);
      if(t!==null&&t<hitT){hitT=t;hitObject=p;hitType='hero';}
    }
    if(hitObject){
      b.x=b.px+(b.x-b.px)*hitT;
      b.y=b.py+(b.y-b.py)*hitT;
    }
    b.trail.unshift({x:b.x,y:b.y});
    // Distance-limited trail: enough to read on a 393px phone but not a laser beam.
    while(b.trail.length>10)b.trail.pop();
    const head=b.trail[0];
    while(b.trail.length>2&&hypot(head.x-b.trail[b.trail.length-1].x,head.y-b.trail[b.trail.length-1].y)>170)b.trail.pop();
    if(hitObject){
      if(hitType==='cover')addImpact('cover',b.x,b.y);
      else if(hitType==='enemy')damageEnemy(hitObject,b.damage);
      else if(hitType==='hero')damagePlayer(b.damage);
      retireBullet(i,b,true);
    }else if(b.ttl<=0||Math.abs(b.x)>S.mapHalf+150||Math.abs(b.y)>S.mapHalf+150){
      retireBullet(i,b,false);
    }
  }
  for(let i=S.trailGhosts.length-1;i>=0;i--){
    S.trailGhosts[i].life-=dt;
    if(S.trailGhosts[i].life<=0)S.trailGhosts.splice(i,1);
  }

  for(let i=S.grenades.length-1;i>=0;i--){
    const g=S.grenades[i]; g.time += dt;
    if(g.time >= g.duration){
      S.grenades.splice(i,1); ring(g.tx,g.ty,g.radius,'#ffe5a4'); burst(g.tx,g.ty,'blast',.38, 26); beep('blast');
      for(const e of [...S.enemies]){ const d = hypot(e.x-g.tx,e.y-g.ty); if(d < g.radius + e.r){ damageEnemy(e, g.damage * (1 - .32 * d / g.radius)); } }
    }
  }

  for(let i=S.effects.length-1;i>=0;i--){ const e=S.effects[i]; e.life -= dt; if(e.life<=0) S.effects.splice(i,1); }
  S.camera.x += (p.x - S.camera.x) * Math.min(1, dt*5.5);
  S.camera.y += (p.y - S.camera.y) * Math.min(1, dt*5.5);
  hudUpdate();
}

function resize(){
  const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
  S.w = w; S.h = h; S.dpr = Math.min(2, window.devicePixelRatio||1); canvas.width = Math.floor(w*S.dpr); canvas.height = Math.floor(h*S.dpr);
  S.scale = Math.min(1.04, Math.max(.72, Math.min(w/430, h/820) * .96));
}
window.addEventListener('resize', resize); resize();

function project(wx, wy, z=0){
  const dx = (wx - S.camera.x), dy = (wy - S.camera.y);
  return {
    x: S.w/2 + (dx - dy) * S.isoX * S.scale,
    y: S.h/2 + (dx + dy) * S.isoY * S.scale - z * S.scale
  };
}
function screenEllipse(x,y,rx,ry,color,a=1){ ctx.save(); ctx.globalAlpha=a; ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,TAU); ctx.fill(); ctx.restore(); }
function line2(x1,y1,x2,y2,color,w=1,a=1){ ctx.save(); ctx.globalAlpha=a; ctx.strokeStyle=color; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.restore(); }
function poly(pts, fill){ ctx.fillStyle=fill; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x,pts[i].y); ctx.closePath(); ctx.fill(); }
function rr(x,y,w,h,r,fill,stroke=''){ ctx.fillStyle=fill; ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); if(stroke){ ctx.strokeStyle=stroke; ctx.lineWidth=1.5; ctx.stroke(); }}

function drawGround(){
  ctx.fillStyle='#9cb08e'; ctx.fillRect(0,0,S.w,S.h);
  // Sky / horizon feel
  const hg = ctx.createLinearGradient(0,0,0,S.h*.4); hg.addColorStop(0,'#b9d0dc'); hg.addColorStop(1,'rgba(185,208,220,0)'); ctx.fillStyle=hg; ctx.fillRect(0,0,S.w,S.h*.42);

  // Large ground diamond
  const half = S.mapHalf;
  const p1 = project(-half,-half,0), p2 = project(half,-half,0), p3 = project(half,half,0), p4 = project(-half,half,0);
  poly([p1,p2,p3,p4], '#a8bb99');

  // Main road strips
  const roads = [
    [[-half,-100],[half,-100],[half,100],[-half,100]],
    [[-100,-half],[100,-half],[100,half],[-100,half]],
    [[-560,250],[-170,250],[-170,410],[-560,410]],
    [[230,-430],[540,-430],[540,-210],[230,-210]],
  ];
  for(const path of roads){
    poly(path.map(([x,y])=>project(x,y,1)), '#d9d2bc');
    // center edge line
    for(let i=0;i<path.length;i++){
      const a = path[i], b = path[(i+1)%path.length];
      const pa=project(a[0],a[1],1), pb=project(b[0],b[1],1); line2(pa.x,pa.y,pb.x,pb.y,'#b4af9d',1.2);
    }
  }

  // grass tufts
  for(let i=0;i<120;i++){
    const gx = ((i*149)%1800)-900, gy = ((i*237)%1600)-800; const p=project(gx,gy,0); if(p.x<-40||p.x>S.w+40||p.y<-40||p.y>S.h+40) continue;
    line2(p.x,p.y,p.x-2*S.scale,p.y-7*S.scale,'#759267',1); line2(p.x,p.y,p.x+2*S.scale,p.y-6*S.scale,'#6e8960',1);
  }
}

function drawCrate(o){
  const x=o.x, y=o.y, w=o.w, h=o.h, z=o.z;
  const top=[project(x-w/2,y-h/2,z),project(x+w/2,y-h/2,z),project(x+w/2,y+h/2,z),project(x-w/2,y+h/2,z)];
  const f1=[project(x-w/2,y+h/2,0),project(x+w/2,y+h/2,0),project(x+w/2,y+h/2,z),project(x-w/2,y+h/2,z)];
  const f2=[project(x+w/2,y-h/2,0),project(x+w/2,y+h/2,0),project(x+w/2,y+h/2,z),project(x+w/2,y-h/2,z)];
  poly(f1,'#866e4f'); poly(f2,'#765f45'); poly(top,'#b9976d');
  line2(top[0].x,top[0].y,top[2].x,top[2].y,'#8a7251',1.6); line2(top[1].x,top[1].y,top[3].x,top[3].y,'#8a7251',1.6);
}
function drawSandbag(o){
  const p=project(o.x,o.y,o.z*.35); const rx=o.w*.34*S.isoX*S.scale, ry=o.h*.18*S.isoY*S.scale + 6; screenEllipse(p.x,p.y+10*S.scale,rx*1.15,ry*1.2,'#4b5a4360');
  for(let row=0;row<2;row++) for(let i=0;i<3;i++){
    const ox = o.x + (i-1)*o.w*.22 + (row?o.w*.08:0), oy = o.y + (row?6:-6); const q=project(ox,oy,o.z*.26 + row*5);
    rr(q.x-18*S.scale,q.y-8*S.scale,36*S.scale,16*S.scale,8*S.scale,'#b4a183','#94856f');
  }
}
function drawObstacle(o){ if(o.type==='crate') drawCrate(o); else drawSandbag(o); }

// Character art is a REAL full-body PNG. Both factions face right in the source art;
// left-facing frames are mirrored around the footprint, not independently generated.
function facingRight(actor){
  const dx=Math.cos(actor.aim)-Math.sin(actor.aim);
  if(Math.abs(dx)>.035) actor.face=dx>=0?1:-1;
  return actor.face||1;
}
function spriteRect(actor,team='hero'){
  const allied=team==='hero';
  const aiming=!allied||!!actor.autoTarget;
  const key=allied ? (aiming?'heroAim':'heroLow') : 'enemyAim';
  const img=SPRITES[key];
  if(!img)return null;
  const h=(allied?123:actor.type==='heavy'?99:83)*S.scale;
  const w=img.naturalWidth/img.naturalHeight*h;
  const at=project(actor.x,actor.y,0);
  const bob=(Math.sin(actor.anim*8)*1.6)*S.scale;
  const face=facingRight(actor);
  return {img,key,at,face,w,h,x:at.x-w*.49,y:at.y-h+15*S.scale+bob};
}
function spriteMuzzle(actor,team){
  const rect=spriteRect(actor,team);if(!rect)return project(actor.x,actor.y,12);
  // The muzzle is normalized to the right-facing cropped artwork.
  const u=rect.key==='heroLow'?.92:.965;
  const v=rect.key==='heroLow'?.78:.365;
  const x=rect.at.x+rect.face*(u-.49)*rect.w;
  return {x,y:rect.y+v*rect.h};
}
function drawCharacter(actor,team='hero'){
  const rect=spriteRect(actor,team);if(!rect)return;
  const {at,face,w,h,x,y,img}=rect;
  if(x>S.w+110||x+w<-110||y>S.h+90||y+h<-110)return;
  // Small runtime contact shadow only; the original art's white background is removed.
  screenEllipse(at.x,at.y+12*S.scale,19*S.scale,6*S.scale,'rgba(48,66,45,.23)');
  ctx.save();
  if(actor.hit>0){ctx.globalAlpha=.82;}
  if(face<0){
    ctx.translate(at.x,0);ctx.scale(-1,1);ctx.translate(-at.x,0);
  }
  // Keep both hero frames the same foot baseline and body height; slight bob while running.
  ctx.drawImage(img,x,y,w,h);
  ctx.restore();
  if(actor.shotFlash>0){
    const m=spriteMuzzle(actor,team);
    if(team==='hero'&&SPRITES.muzzle1){
      const variant=actor.flashVariant||1;
      const img=SPRITES['muzzle'+variant]||SPRITES.muzzle1;
      // Randomize flash frames, keep the white-hot left root glued to the barrel.
      const phase=clamp(actor.shotFlash/.55,0,1);
      const flashW=(42+variant*1.6)*S.scale;
      const flashH=flashW*img.naturalHeight/img.naturalWidth;
      ctx.save();ctx.globalAlpha=Math.min(1,phase*2.4);
      ctx.translate(m.x,m.y);ctx.scale(face,1);
      ctx.drawImage(img,-7*S.scale,-flashH*.5,flashW,flashH);
      ctx.restore();
    }else{
      // Enemy rifle fire keeps a deliberately subtler procedural flash.
      const s=S.scale*.6;
      ctx.save();ctx.translate(m.x,m.y);ctx.scale(face,1);
      ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16*s,-5*s);ctx.lineTo(23*s,0);ctx.lineTo(16*s,5*s);ctx.closePath();ctx.fill();ctx.restore();
    }
  }
  if(team==='enemy' && actor.hp<actor.maxHp){
    rr(at.x-20*S.scale,y-7*S.scale,40*S.scale,4*S.scale,2*S.scale,'rgba(84,44,39,.7)');
    rr(at.x-20*S.scale,y-7*S.scale,40*S.scale*clamp(actor.hp/actor.maxHp,0,1),4*S.scale,2*S.scale,'#e09a7b');
  }
  if(team==='hero'){
    ctx.fillStyle='#fff3ad';ctx.beginPath();
    const top=y-12*S.scale;
    ctx.moveTo(at.x,top+9*S.scale);ctx.lineTo(at.x-7*S.scale,top);ctx.lineTo(at.x+7*S.scale,top);ctx.closePath();ctx.fill();
  }
}

function drawGrenade(g){
  const t = clamp(g.time/g.duration,0,1);
  const x = lerp(g.x,g.tx,t), y = lerp(g.y,g.ty,t); const lift = Math.sin(Math.PI*t)*70;
  const p=project(x,y,lift);
  const ground = project(g.tx,g.ty,0);
  ctx.setLineDash([6,5]); line2(ground.x-2,ground.y,ground.x+2,ground.y,'rgba(255,242,193,.5)',1.4);
  ctx.beginPath(); ctx.strokeStyle='rgba(255,242,193,.42)'; ctx.lineWidth=1.2; ctx.ellipse(ground.x,ground.y+12*S.scale,g.radius*.42*S.scale,g.radius*.22*S.scale,0,0,TAU); ctx.stroke(); ctx.setLineDash([]);
  screenEllipse(p.x,p.y+4*S.scale, 7*S.scale, 3*S.scale, 'rgba(42,56,42,.32)');
  screenEllipse(p.x,p.y, 6*S.scale, 6*S.scale, '#4d6448'); rr(p.x+3*S.scale,p.y-8*S.scale,3*S.scale,5*S.scale,1*S.scale,'#d5cfac');
}
function renderTrail(trail,side,alpha=1){
  if(!trail.length)return;
  const newest=project(trail[0].x,trail[0].y,12);
  if(newest.x<-110||newest.y<-110||newest.x>S.w+110||newest.y>S.h+110)return;
  if(trail.length>=2){
    const oldest=project(trail[trail.length-1].x,trail[trail.length-1].y,12);
    const grad=ctx.createLinearGradient(oldest.x,oldest.y,newest.x,newest.y);
    if(side==='hero'){
      grad.addColorStop(0,'rgba(255,182,42,0)');
      grad.addColorStop(.48,'rgba(255,197,66,.63)');
      grad.addColorStop(1,'rgba(255,251,203,1)');
    }else{
      grad.addColorStop(0,'rgba(239,87,55,0)');
      grad.addColorStop(.55,'rgba(244,124,69,.6)');
      grad.addColorStop(1,'rgba(255,218,163,1)');
    }
    ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(oldest.x,oldest.y);
    for(let i=trail.length-2;i>=0;i--){const p=project(trail[i].x,trail[i].y,12);ctx.lineTo(p.x,p.y);}
    ctx.strokeStyle=side==='hero'?'rgba(255,198,46,.20)':'rgba(255,112,64,.15)';
    ctx.lineWidth=(side==='hero'?10:8)*S.scale;ctx.stroke();
    ctx.strokeStyle=grad;ctx.lineWidth=(side==='hero'?4.1:3.2)*S.scale;ctx.stroke();
    ctx.restore();
  }
  ctx.save();ctx.globalAlpha=alpha;
  const r=(side==='hero'?4.4:3.4)*S.scale;
  screenEllipse(newest.x,newest.y,r*1.8,r*1.8,side==='hero'?'#ffc757':'#ff895c',.27*alpha);
  screenEllipse(newest.x,newest.y,r,r,side==='hero'?'#fff5ba':'#ffca96',.97*alpha);
  screenEllipse(newest.x,newest.y,r*.45,r*.45,'#ffffff',alpha);
  ctx.restore();
}
function renderAllTracers(){
  // Draw ON TOP of sprites: the old sorted-world layer hid yellow player bullets.
  for(const ghost of S.trailGhosts)renderTrail(ghost.trail,ghost.side,ghost.life/ghost.ttl*.80);
  for(const bullet of S.bullets)renderTrail(bullet.trail,bullet.side,1);
}

function renderEffects(){
  for(const e of S.effects){
    const alpha = clamp(e.life / e.ttl, 0, 1); const p=project(e.x,e.y,18);
    ctx.save(); ctx.globalAlpha = alpha;
    if(e.type==='soldierSpark'||e.type==='coverSpark'){
      const prefix=e.type==='coverSpark'?'sparkCover':'sparkSoldier';
      const frame=Math.min(3,Math.floor((e.ttl-e.life)/.046)+1);
      const img=SPRITES[prefix+frame];
      if(img){
        const size=(e.type==='coverSpark'?45:39)*S.scale;
        ctx.drawImage(img,p.x-size*.5,p.y-size*.5,size,size);
      }else{
        screenEllipse(p.x,p.y,5*S.scale,5*S.scale,'#ffe6a2');
      }
    }
    else if(e.type==='text'){ ctx.fillStyle=e.col||'#fff'; ctx.font=`bold ${16*S.scale}px sans-serif`; ctx.textAlign='center'; ctx.fillText(e.text,p.x,p.y - 24*(1-alpha)); }
    else if(e.type==='ring'){ ctx.strokeStyle=e.col||'#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.ellipse(p.x,p.y+14*S.scale,e.r*.5*S.scale*(1.3-alpha*.6),e.r*.26*S.scale*(1.3-alpha*.6),0,0,TAU); ctx.stroke(); }
    else if(e.type==='dash'){ screenEllipse(p.x,p.y+6*S.scale,26*S.scale*alpha,12*S.scale*alpha,'#fbf2d4',alpha); }
    else { const color={hit:'#f4d59b', muzzle:'#fff0b1', hurt:'#c7685b', blast:'#f8c86a', dust:'#d8c0a0', death:'#cb786b'}[e.type]||'#fff'; screenEllipse(p.x,p.y, e.r*(.45+(1-alpha))*.6*S.scale, e.r*(.45+(1-alpha))*.4*S.scale, color, alpha); }
    ctx.restore();
  }
}

function render(){
  ctx.setTransform(S.dpr,0,0,S.dpr,0,0); ctx.clearRect(0,0,S.w,S.h);
  drawGround();

  const drawList = [];
  for(const o of S.obstacles) drawList.push({sort:o.x+o.y, fn:()=>drawObstacle(o)});
  for(const g of S.grenades) drawList.push({sort:g.x+g.y+1, fn:()=>drawGrenade(g)});
  for(const e of S.enemies) drawList.push({sort:e.x+e.y+3, fn:()=>drawCharacter(e,'enemy')});
  if(S.player) drawList.push({sort:S.player.x+S.player.y+4, fn:()=>{ if(S.player.invuln<=0 || Math.floor(S.time*20)%2===0) drawCharacter(S.player,'hero'); }});
  drawList.sort((a,b)=>a.sort-b.sort);
  for(const item of drawList) item.fn();
  renderAllTracers();
  renderEffects();
}

function frame(now){
  const dt = Math.min(.036, Math.max(0,(now-(S.last||now))/1000)); S.last = now;
  if(S.phase==='running') update(dt);
  if(S.phase==='running' || S.phase==='paused' || S.phase==='ended') render();
  requestAnimationFrame(frame);
}

showMenu();
requestAnimationFrame(frame);
window.__armyBattle2p5D = { state:S, resetGame };
