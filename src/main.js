import {loadGlb} from './core/glb.js?v=060';
import {ArmyRenderer} from './core/renderer.js?v=072';
import {RigAnimator} from './characters/rigAnimator.js?v=060';
import {CAMP,moveWithCollision} from './map/camp.js?v=072';
import {drawMinimap} from './ui/minimap.js?v=076';
import {initWorldMap} from './ui/worldMap.js?v=076';
import {setupInput} from './ui/input.js?v=062';
import {createLodShowcase} from './ui/lodShowcase.js?v=075';
import {options} from './systems/settings.js?v=060';

const $=id=>document.getElementById(id);
const debug=new URLSearchParams(location.search).has('debug');
const worldMap=initWorldMap();
function status(message){const el=$('notice');el.textContent=message;el.hidden=!message}
async function stage(promise,what,ms=90000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(what+' 載入逾時，請確認網路和檔案路徑')),ms)})])}finally{clearTimeout(timer)}}
function errorMessage(message){status('');$('errorText').textContent=message;$('fatal').hidden=false}
$('retry').addEventListener('click',()=>location.reload());
function face(actor,x,z){const desired=Math.atan2(x,z);const delta=Math.atan2(Math.sin(desired-actor.angle),Math.cos(desired-actor.angle));actor.angle+=delta*.22}
function movement(mag){
 mag=Number.isFinite(mag)?Math.max(0,Math.min(1,mag)):0;
 if(mag<options.walkThreshold)return {clip:'Idle',speed:0,rate:1};
 const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
 if(mag<options.runThreshold)return {clip:'Walking',speed:lerp(1.8,options.moveSpeed,(mag-options.walkThreshold)/(options.runThreshold-options.walkThreshold)),rate:lerp(.9,1.65,mag/options.runThreshold)};
 if(mag<options.sprintThreshold)return {clip:'Running',speed:lerp(options.moveSpeed,options.runSpeed,(mag-options.runThreshold)/(options.sprintThreshold-options.runThreshold)),rate:lerp(1.1,1.42,mag)};
 return {clip:'RunFast',speed:lerp(options.runSpeed,options.sprintSpeed,(mag-options.sprintThreshold)/(1-options.sprintThreshold)),rate:lerp(1.3,1.56,mag)};
}
const modelUrl='./assets/characters/player/recruit-mixamo.glb';
async function boot(){
 let step='準備 WebGL';
 try{
  const renderer=new ArmyRenderer($('world'));
  step='下載主角 GLB';status('載入阿兵哥…');
  const heroGlb=await stage(loadGlb(modelUrl),'主角模型');
  step='建立主角貼圖';await stage(renderer.addModel('recruit',heroGlb),'主角貼圖');
  step='建立主角骨架';const player={pos:{...CAMP.spawn},angle:0,anim:new RigAnimator(heroGlb)};
  player.anim.setClip('Idle');player.anim.evaluate(0);
  let foe=null;
  const lodShowcase=createLodShowcase(renderer);
  let camYaw=options.cameraYaw,camPitch=options.cameraPitch;
  // Existing camera distance is the nearest zoom. Pinch/wheel may only zoom out to 2x.
  const minZoom=options.zoom,maxZoom=minZoom*2;
  let cameraZoom=minZoom,targetZoom=minZoom;
  const input=setupInput($('world'),
    (dx,dy)=>{if(!worldMap.isOpen()){camYaw+=dx;camPitch=Math.max(.32,Math.min(1.12,camPitch+dy))}},
    ratio=>{if(!worldMap.isOpen()&&Number.isFinite(ratio)&&ratio>0)targetZoom=Math.max(minZoom,Math.min(maxZoom,targetZoom*ratio))}
  );
  let last=performance.now(),lastMap=0,lastDebug=0,foePhase=0;
  // Both maps use the SAME camera-aligned projection. Keep the map heading
  // stable while stationary; rotating only the camera never rotates the soldier arrow.
  let mapYaw=camYaw;
  let mapFacing=Math.PI-player.angle+mapYaw;
  status('');
  // The world starts as soon as the protagonist loads, without waiting for the enemy.
  function tick(now){
   try{
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    const stick=worldMap.isOpen()?{x:0,y:0,magnitude:0}:input(),m=movement(stick.magnitude);
    cameraZoom+=(targetZoom-cameraZoom)*Math.min(1,dt*12);
    if(m.speed>0){
     const dx=stick.x/(stick.magnitude||1),dy=stick.y/(stick.magnitude||1);
     const c=Math.cos(camYaw),s=Math.sin(camYaw);
     const mx=dx*c-dy*s,mz=-dx*s-dy*c;
     const before=player.pos;
     player.pos=moveWithCollision(player.pos,mx*dt*m.speed,mz*dt*m.speed);
     if(Math.hypot(player.pos.x-before.x,player.pos.z-before.z)>1e-5){
      face(player,mx,mz);mapYaw=camYaw;
     }
    }
    if(player.anim.clip!==m.clip)player.anim.setClip(m.clip);
    player.anim.speed=m.rate;player.anim.evaluate(dt);
    if(foe){
     foePhase+=dt*.34;
     const tx=CAMP.enemySpawn.x+Math.cos(foePhase)*.9-.9,tz=CAMP.enemySpawn.z+Math.sin(foePhase)*.7;
     const dx=tx-foe.pos.x,dz=tz-foe.pos.z;
     foe.pos.x+=dx*Math.min(1,dt*1.5);foe.pos.z+=dz*Math.min(1,dt*1.5);
     if(Math.hypot(dx,dz)>.015)face(foe,dx,dz);
     foe.anim.evaluate(dt);
    }
    renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom:cameraZoom});renderer.startFrame(player.pos);
    renderer.drawActor('recruit',player);
    if(foe)renderer.drawActor('red',foe);
    lodShowcase.draw(dt,player.pos);
    mapFacing=Math.PI-player.angle+mapYaw;
    // 60 Hz radar refresh (previously 10 Hz). World-map preview refreshes only while open.
    if(now-lastMap>=16){
      if(!worldMap.isOpen())drawMinimap(player.pos,foe?.pos||null,false,mapFacing,mapYaw);
      worldMap.update(player.pos,foe?.pos||null,player.angle);
      lastMap=now;
    }
    if(debug&&now-lastDebug>150){$('debug').hidden=false;$('debug').textContent=`mode: ${m.clip}\npos: ${player.pos.x.toFixed(2)},${player.pos.z.toFixed(2)}\ninput: ${stick.magnitude.toFixed(2)}\nzoom: ${cameraZoom.toFixed(2)}\nrenderer: webgl2`;lastDebug=now}
    requestAnimationFrame(tick);
   }catch(error){console.error('遊戲迴圈錯誤',error);errorMessage('遊戲迴圈：'+String(error.stack||error));}
  }
  requestAnimationFrame(tick);
  // An optional enemy never prevents joystick/game initialization.
  try{
   const glb=await loadGlb('./assets/characters/enemy/enemy-red-mixamo.glb');
   await renderer.addModel('red',glb);
   foe={pos:{...CAMP.enemySpawn},angle:Math.PI,anim:new RigAnimator(glb)};
   foe.anim.setClip('Casual_Walk');foe.anim.evaluate(0);
  }catch(error){console.warn('敵人載入失敗，主角仍可遊玩',error)}
  void lodShowcase.load();
 }catch(error){console.error('Army 啟動階段',step,error);errorMessage(step+'：'+String(error.message||error))}
}
boot();
