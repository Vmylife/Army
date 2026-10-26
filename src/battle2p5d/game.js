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
$('startButton').addEventListener('click',()=>{ show('loadingScreen'); requestAnimationFrame(()=>requestAnimationFrame(()=>resetGame()));});
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
  const box = joyRegion.getBoundingClientRect();
  const cx = box.left + 69, cy = box.top + 69;
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
  S.time = 0; S.kills = 0; S.wave = 1; S.enemies = []; S.bullets = []; S.effects = []; S.grenades = [];
  S.spawnTimer = 1.3;
  const m = MODE[S.type];
  S.player = { x:0, y:0, r:22, hp:m.hp, maxHp:m.hp, aim:-Math.PI/2, moveAim:-Math.PI/2, anim:0, shotCD:.3, shotFlash:0, dashLeft:0, dashCooldown:0, invuln:0, grenadeCD:m.grenadeCD * .55, burstCD:m.burstCD, alive:true };
  for(let i=0;i<6;i++) spawnEnemy(true);
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
  if(len > 1e-3){ x /= len; y /= len; }
  return { x, y, len };
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
  const p=S.player; const side = Math.floor(Math.random()*4); const half=S.mapHalf-40; let x=0,y=0;
  if(side===0){ x = rand(-half, half); y = -half; }
  else if(side===1){ x = half; y = rand(-half, half); }
  else if(side===2){ x = rand(-half, half); y = half; }
  else { x = -half; y = rand(-half, half); }
  if(first){ x = rand(-380,380); y = rand(-340,340); if(hypot(x-p.x,y-p.y)<280){ x += 330; y += 220; }}
  const waveMul = 1 + Math.min(1.2, S.time / 145);
  const t = S.time > 35 && Math.random() < .12 ? 'heavy' : S.time > 18 && Math.random() < .18 ? 'ranger' : 'grunt';
  const stat = t === 'grunt' ? {hp:58,speed:72,r:20,damage:12,shoot:.9,range:0}
            : t === 'heavy' ? {hp:160,speed:48,r:25,damage:21,shoot:1.2,range:0}
            : {hp:72,speed:58,r:20,damage:10,shoot:1.55,range:250};
  S.enemies.push({type:t, x, y, r:stat.r, hp:stat.hp*waveMul, maxHp:stat.hp*waveMul, speed:stat.speed*(1+Math.min(.25,S.time/220)), damage:stat.damage, fireCD:rand(.25,1.2), atkCD:rand(.2,.8), aim:0, anim:Math.random()*6, hit:0, shotFlash:0});
}

function fireBullet(from, target, side, damage, speed=720, critChance=0){
  const dx = target.x - from.x, dy = target.y - from.y, len = hypot(dx,dy) || 1;
  let angle = Math.atan2(dy, dx);
  const spread = side==='hero' ? rand(-.05,.05) : rand(-.08,.08);
  angle += spread;
  const vx = Math.cos(angle) * speed, vy = Math.sin(angle) * speed;
  const crit = side==='hero' && Math.random() < critChance;
  S.bullets.push({ x:from.x, y:from.y, px:from.x, py:from.y, vx, vy, side, damage:crit? damage*1.6 : damage, ttl:1.1, crit });
}
function flashText(x,y,text,col='#fff6c9'){ S.effects.push({type:'text', x, y, text, col, ttl:.55, life:.55}); }
function ring(x,y,r,col){ S.effects.push({type:'ring', x,y,r,col, ttl:.35, life:.35}); }
function burst(x,y,type='hit',ttl=.25,r=10){ S.effects.push({type, x,y, ttl, life:ttl, r}); }

function damageEnemy(e, dmg){
  e.hp -= dmg; e.hit = .14; burst(e.x,e.y,'hit',.22, 12); beep('hit');
  if(e.hp <= 0){
    const idx = S.enemies.indexOf(e); if(idx>=0) S.enemies.splice(idx,1);
    S.kills++; burst(e.x,e.y,'death',.42, 18); flashText(e.x,e.y, Math.round(dmg), '#ffe5b1');
    if(S.kills % 12 === 0) msg('人物感覺對了嗎？繼續看看。', 1.0);
  }
}
function damagePlayer(dmg){
  const p=S.player; if(p.invuln>0 || S.phase!=='running') return;
  p.hp -= dmg; p.invuln = .32; burst(p.x,p.y,'hurt',.25, 14); beep('hurt');
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
  if(target){
    const angle = Math.atan2(target.y-p.y, target.x-p.x);
    const diff = Math.atan2(Math.sin(angle-p.aim), Math.cos(angle-p.aim));
    p.aim += diff * Math.min(1, dt*12);
    if(p.shotCD <= 0){
      p.shotCD = MODE[S.type].fireRate; p.shotFlash = .55; fireBullet({x:p.x,y:p.y}, target, 'hero', MODE[S.type].damage, 740, S.type==='hero' ? .24 : .08); burst(p.x,p.y,'muzzle',.09, 12); beep('fire');
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
    const amount = 2 + (S.type==='hero'?1:0) + (S.wave>4 && Math.random()<.45 ? 1 : 0);
    for(let i=0;i<amount && S.enemies.length<60;i++) spawnEnemy(false);
    S.spawnTimer = Math.max(.65, 1.6 - S.time * .007) * rand(.85,1.12);
  }

  for(let i=S.enemies.length-1;i>=0;i--){
    const e=S.enemies[i]; e.anim += dt*3.1; e.fireCD -= dt; e.atkCD -= dt; e.shotFlash = Math.max(0,e.shotFlash-dt*4); e.hit = Math.max(0,e.hit-dt);
    const dx=p.x-e.x, dy=p.y-e.y, d=hypot(dx,dy)||1; e.aim = Math.atan2(dy,dx);
    if(e.type==='ranger'){
      if(d > 220) moveActor(e, dx/d * e.speed * dt, dy/d * e.speed * dt);
      else if(d < 145) moveActor(e, -dx/d * e.speed * .7 * dt, -dy/d * e.speed * .7 * dt);
      if(d < 300 && e.fireCD <= 0 && !lineBlocked(e.x,e.y,p.x,p.y)){
        e.fireCD = 1.9; e.shotFlash = .55; fireBullet({x:e.x,y:e.y}, p, 'enemy', e.damage, 520, 0); burst(e.x,e.y,'muzzle',.08, 10);
      }
    } else {
      if(d > e.r + p.r + 2){ const side = Math.sin(S.time*1.2 + i) * .15; moveActor(e, Math.cos(e.aim+side)*e.speed*dt, Math.sin(e.aim+side)*e.speed*dt); }
      if(d < e.r + p.r + 2 && e.atkCD <= 0){ e.atkCD = e.type==='heavy'?1.15:.92; damagePlayer(e.damage); }
    }
  }

  for(let i=S.bullets.length-1;i>=0;i--){
    const b=S.bullets[i]; b.ttl -= dt; b.px = b.x; b.py = b.y; b.x += b.vx*dt; b.y += b.vy*dt;
    let hit = false;
    if(b.ttl <= 0){ S.bullets.splice(i,1); continue; }
    for(const o of S.obstacles){ if(segmentRect(b.px,b.py,b.x,b.y,o.x-o.w/2,o.y-o.h/2,o.x+o.w/2,o.y+o.h/2)){ burst(b.x,b.y,'dust',.18,8); hit = true; break; } }
    if(!hit && b.side==='hero'){
      for(const e of S.enemies){ if(segmentCircle(b.px,b.py,b.x,b.y,e.x,e.y,e.r+2)){ damageEnemy(e,b.damage); hit = true; break; } }
    } else if(!hit && b.side==='enemy' && segmentCircle(b.px,b.py,b.x,b.y,p.x,p.y,p.r+2)){ damagePlayer(b.damage); hit = true; }
    if(hit) S.bullets.splice(i,1);
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

function facingIndex(angle){
  const a = (angle + TAU + Math.PI/8) % TAU;
  return Math.floor(a / (Math.PI/4)) % 8; // 0:E,1:SE,2:S,3:SW,4:W,5:NW,6:N,7:NE
}
function drawCharacter(actor, team='hero', shadow=true){
  const pos = project(actor.x, actor.y, 0);
  const scale = S.scale * (team==='hero' ? 1.02 : (actor.type==='heavy' ? 1.06 : 1));
  const bob = Math.sin(actor.anim * 8) * 3 * scale;
  if(shadow) screenEllipse(pos.x, pos.y + 24*scale, 18*scale, 8*scale, '#33493544');

  const facing = facingIndex(actor.aim);
  const ally = team === 'hero';
  const base = ally ? { coat:'#567b53', cloth:'#7ea46c', dark:'#35523f', helmet:'#446348', skin:'#ead5ac', gun:'#313d36', trim:'#d6be89'}
                    : actor.type==='heavy' ? { coat:'#9f6459', cloth:'#c48b7d', dark:'#623d36', helmet:'#824e46', skin:'#e2b395', gun:'#342f2f', trim:'#dfb08b'}
                      : { coat:'#b66c5f', cloth:'#d79484', dark:'#6f4740', helmet:'#97584d', skin:'#e5b395', gun:'#342f2f', trim:'#dfb08b'};

  ctx.save(); ctx.translate(pos.x, pos.y - 16*scale + bob);

  // body proportions: larger, visible face, more like a character than a marker.
  const front = [1,2,3].includes(facing); // SE,S,SW toward viewer
  const back  = [5,6,7].includes(facing);
  const sideR = facing===0 || facing===1 || facing===7;
  const sideL = facing===3 || facing===4 || facing===5;
  const dirX = sideR ? 1 : sideL ? -1 : 0;

  // legs
  rr(-11*scale, 18*scale + Math.sin(actor.anim*8)*2*scale, 9*scale, 19*scale, 4*scale, base.dark);
  rr(2*scale, 18*scale - Math.sin(actor.anim*8)*2*scale, 9*scale, 19*scale, 4*scale, base.dark);
  rr(-13*scale, 33*scale + Math.sin(actor.anim*8)*2*scale, 13*scale, 6*scale, 3*scale, '#272625');
  rr(2*scale, 33*scale - Math.sin(actor.anim*8)*2*scale, 13*scale, 6*scale, 3*scale, '#272625');

  // torso
  rr(-16*scale, -2*scale, 32*scale, 28*scale, 10*scale, base.coat);
  rr(-11*scale, 3*scale, 22*scale, 15*scale, 6*scale, base.cloth);
  line2(0,-2*scale,0,24*scale, ally ? '#3a5c46' : '#825146', 2*scale);
  rr(-4*scale, 10*scale, 8*scale, 8*scale, 2*scale, base.trim);

  // arms and gun based on facing
  const armY = 4*scale;
  if(front){
    rr(-20*scale, armY, 11*scale, 8*scale, 4*scale, base.coat);
    rr(9*scale, armY+1*scale, 12*scale, 8*scale, 4*scale, base.coat);
    rr(6*scale, 6*scale, 28*scale, 7*scale, 2*scale, base.gun);
    rr(20*scale, 5*scale, 18*scale, 4*scale, 2*scale, '#222c27');
    rr(2*scale, 2*scale, 8*scale, 10*scale, 2*scale, '#5b6d57');
    screenEllipse(31*scale, 9*scale, 4*scale, 4*scale, base.skin);
  } else if(back){
    rr(-21*scale, armY, 12*scale, 8*scale, 4*scale, base.coat);
    rr(9*scale, armY, 12*scale, 8*scale, 4*scale, base.coat);
    rr(2*scale, 8*scale, 28*scale, 7*scale, 2*scale, base.gun);
    rr(16*scale, 7*scale, 18*scale, 4*scale, 2*scale, '#222c27');
  } else if(sideR){
    rr(-7*scale, armY+1*scale, 10*scale, 8*scale, 4*scale, base.coat);
    rr(10*scale, armY-2*scale, 10*scale, 8*scale, 4*scale, base.coat);
    rr(6*scale, 4*scale, 33*scale, 7*scale, 2*scale, base.gun);
    rr(25*scale, 3*scale, 20*scale, 4*scale, 2*scale, '#222c27');
    screenEllipse(18*scale, 6*scale, 4*scale, 4*scale, base.skin);
  } else {
    rr(-19*scale, armY-2*scale, 10*scale, 8*scale, 4*scale, base.coat);
    rr(-2*scale, armY+1*scale, 10*scale, 8*scale, 4*scale, base.coat);
    rr(-39*scale, 4*scale, 33*scale, 7*scale, 2*scale, base.gun);
    rr(-45*scale, 3*scale, 20*scale, 4*scale, 2*scale, '#222c27');
    screenEllipse(-18*scale, 6*scale, 4*scale, 4*scale, base.skin);
  }

  // head
  screenEllipse(0, -11*scale, 15*scale, 16*scale, base.skin);
  // face details
  if(front){
    screenEllipse(-5*scale, -12*scale, 2.2*scale, 2.2*scale, '#221b19');
    screenEllipse(5*scale, -12*scale, 2.2*scale, 2.2*scale, '#221b19');
    line2(-2*scale,-5*scale,2*scale,-5*scale,'#9f7463',1.1*scale);
  } else if(sideR){
    screenEllipse(5*scale, -12*scale, 2.2*scale, 2.2*scale, '#221b19');
    line2(7*scale,-9*scale,10*scale,-8*scale,'#9f7463',1.0*scale);
  } else if(sideL){
    screenEllipse(-5*scale, -12*scale, 2.2*scale, 2.2*scale, '#221b19');
    line2(-10*scale,-8*scale,-7*scale,-9*scale,'#9f7463',1.0*scale);
  }
  // helmet
  screenEllipse(0,-15*scale, 17*scale, 11*scale, base.helmet);
  rr(-15*scale,-15*scale,30*scale,8*scale,4*scale,base.helmet);
  if(ally){ screenEllipse(0,-13*scale, 3*scale, 3*scale, '#d4bc83'); }

  if(actor.shotFlash > 0){
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath();
    const fx = front||sideR ? 48*scale : -48*scale;
    const fy = front ? 8*scale : 7*scale;
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + (front||sideR? 14:-14)*scale, fy - 6*scale);
    ctx.lineTo(fx + (front||sideR? 10:-10)*scale, fy);
    ctx.lineTo(fx + (front||sideR? 14:-14)*scale, fy + 6*scale);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();

  // hp bar for enemies
  if(team==='enemy' && actor.hp < actor.maxHp){
    rr(pos.x-18*scale, pos.y-54*scale, 36*scale, 5*scale, 2*scale, 'rgba(84,44,39,.66)');
    rr(pos.x-18*scale, pos.y-54*scale, 36*scale * clamp(actor.hp/actor.maxHp,0,1), 5*scale, 2*scale, '#df9279');
  }
  if(team==='hero'){
    ctx.fillStyle='#fff6ce'; ctx.beginPath(); ctx.moveTo(pos.x,pos.y-62*scale); ctx.lineTo(pos.x-8*scale,pos.y-76*scale); ctx.lineTo(pos.x+8*scale,pos.y-76*scale); ctx.closePath(); ctx.fill();
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
function drawBullet(b){ const a=project(b.px,b.py,12), c=project(b.x,b.y,12); line2(a.x,a.y,c.x,c.y,b.side==='hero' ? '#ffef9e' : '#ff8d78', b.side==='hero' ? 3 : 3.6); screenEllipse(c.x,c.y,3,3,'#fff7db'); }

function renderEffects(){
  for(const e of S.effects){
    const alpha = clamp(e.life / e.ttl, 0, 1); const p=project(e.x,e.y,18);
    ctx.save(); ctx.globalAlpha = alpha;
    if(e.type==='text'){ ctx.fillStyle=e.col||'#fff'; ctx.font=`bold ${16*S.scale}px sans-serif`; ctx.textAlign='center'; ctx.fillText(e.text,p.x,p.y - 24*(1-alpha)); }
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
  for(const o of S.obstacles) drawList.push({sort:o.x+o.y+1000, fn:()=>drawObstacle(o)});
  for(const g of S.grenades) drawList.push({sort:g.x+g.y+1300, fn:()=>drawGrenade(g)});
  for(const b of S.bullets) drawList.push({sort:b.y+b.x+1600, fn:()=>drawBullet(b)});
  for(const e of S.enemies) drawList.push({sort:e.x+e.y+2000, fn:()=>drawCharacter(e,'enemy')});
  if(S.player) drawList.push({sort:S.player.x+S.player.y+2001, fn:()=>{ if(S.player.invuln<=0 || Math.floor(S.time*20)%2===0) drawCharacter(S.player,'hero'); }});
  drawList.sort((a,b)=>a.sort-b.sort);
  for(const item of drawList) item.fn();
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
