import {loadGlb} from './core/glb.js';
import {ArmyRenderer} from './core/renderer.js?v=041';
import {RigAnimator} from './characters/rigAnimator.js?v=041';
import {CAMP,FEATURES,clampPos} from './map/camp.js';
import {setupInput,setupAnimationButtons} from './ui/input.js';
import {createEncounter} from './battle/encounter.js';
import {options} from './systems/settings.js';
const $=id=>document.getElementById(id);
const banner=(s,duration=2600)=>{const notice=$('notice');notice.textContent=s;notice.hidden=false;clearTimeout(banner.timer);if(duration)banner.timer=setTimeout(()=>notice.hidden=true,duration)};
function distance(a,b){return Math.hypot(a.x-b.x,a.z-b.z)}
function setDirection(actor,x,z){const want=Math.atan2(x,z),diff=Math.atan2(Math.sin(want-actor.angle),Math.cos(want-actor.angle));actor.angle+=diff*.21}
function inBuilding(p){return (p.x>-6.75&&p.x<-2.25&&p.z>-5.42&&p.z<-2.34)||(p.x>-7.5&&p.x<-2.75&&p.z>4.22&&p.z<6.72)}
const actions={locomotion:new Set(['Walking','Running','Casual_Walk','RunFast','Run_03']),oneShots:new Set(['BeHit_FlyUp','Dead','Arise','Boxing_Practice'])};
async function boot(){let renderer;try{
 const canvas=$('world');renderer=new ArmyRenderer(canvas);
 banner('載入主角模型…',0);const glb=await loadGlb('./assets/characters/player/recruit-mixamo.glb');await renderer.addModel('recruit',glb);
 banner('載入紅色敵軍…',0);const foeGltf=await loadGlb('./assets/characters/enemy/enemy-red-mixamo.glb');await renderer.addModel('red',foeGltf);
 const player={pos:{...CAMP.spawn},angle:0,anim:new RigAnimator(glb)};
 const foe={pos:{...CAMP.enemySpawn},angle:3.14,anim:new RigAnimator(foeGltf)};
 foe.anim.setClip('Casual_Walk');const encounter=createEncounter(foe);
 const select=setupAnimationButtons(clip=>{
   if(clip==='Walking'||clip==='Casual_Walk'||clip==='Running'||clip==='RunFast'){options.playerMode=clip;player.anim.setClip(clip);return}
   player.anim.setClip(clip,{restart:true});banner({Dead:'倒地測試：點「起身」恢復',Arise:'起身測試',BeHit_FlyUp:'受擊測試',Boxing_Practice:'拳擊測試'}[clip]||clip,1500);
 });
 select('Walking');
 let zoom=9,camYaw=.66,camPitch=.62;
 const input=setupInput(canvas,(dx,dy)=>{camYaw+=dx;camPitch=Math.max(.32,Math.min(1.14,camPitch+dy));},()=>{camYaw=.66;camPitch=.62;zoom=9;banner('鏡頭已復位',1300)});
 document.querySelector('#attack').onclick=()=>{
  player.anim.setClip('Boxing_Practice',{restart:true});const hit=encounter.poke(player,distance(player.pos,foe.pos));banner(hit.message,1750);
 };
 document.querySelector('#resetEnemy').onclick=()=>banner(encounter.reset().message,1250);
 document.querySelector('#ecoview').addEventListener('change',e=>{options.eco=e.target.checked;window.armyEco=options.eco;banner(options.eco?'省電模式：降低畫面解析度':'恢復標準畫質',1400)});
 banner('✅ 進入軍營！左下搖桿走路',2200);
 let last=performance.now(),fpsAt=last,frames=0,foePhase=0,lastLoc='',lastMoving=false,lastFrame=0;
 function loop(now){const dt=Math.min(.045,(now-last)/1000);last=now;const dir=input(),mag=Math.hypot(dir.x,dir.y);
  if(player.anim.clip==='BeHit_FlyUp'&&player.anim.finished())player.anim.setClip('Idle');
  if(player.anim.clip==='Boxing_Practice'&&player.anim.finished())player.anim.setClip('Idle');
  if(player.anim.clip==='Arise'&&player.anim.finished())player.anim.setClip('Idle');
  if(mag>.1&&player.anim.clip!=='Dead'&&player.anim.clip!=='BeHit_FlyUp'){
    const mode=options.playerMode,speed=(mode==='Running'||mode==='RunFast'?options.runSpeed:options.moveSpeed),c=Math.cos(camYaw),s=Math.sin(camYaw);
    // Camera-relative controls; correct character forward is model-local +Z.
    const mx=dir.x*c-dir.y*s,mz=-dir.x*s-dir.y*c;
    const next=clampPos({x:player.pos.x+mx*dt*speed,z:player.pos.z+mz*dt*speed});
    if(!inBuilding(next))player.pos=next;
    setDirection(player,mx,mz);if(player.anim.clip!==mode)player.anim.setClip(mode);
    lastMoving=true;
  }else if(lastMoving){lastMoving=false;if(actions.locomotion.has(player.anim.clip))player.anim.setClip('Idle');}
  player.anim.evaluate(dt);
  if(!encounter.dead){
   if(foe.anim.clip==='BeHit_FlyUp'&&foe.anim.finished())foe.anim.setClip('Casual_Walk');
   if(foe.anim.clip==='Arise'&&foe.anim.finished())foe.anim.setClip('Casual_Walk');
   if(foe.anim.clip==='Casual_Walk'){
    foePhase+=dt*.34;const tx=CAMP.enemySpawn.x+Math.cos(foePhase)*.9-.9,tz=CAMP.enemySpawn.z+Math.sin(foePhase)*.7;const dx=tx-foe.pos.x,dz=tz-foe.pos.z;foe.pos.x+=dx*Math.min(1,dt*1.5);foe.pos.z+=dz*Math.min(1,dt*1.5);if(Math.hypot(dx,dz)>.015)setDirection(foe,dx,dz);
   }
  }
  foe.anim.evaluate(dt);
  renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom});renderer.startFrame(player.pos);renderer.drawActor('recruit',player);renderer.drawActor('red',foe);
  if(now-lastFrame>220){lastFrame=now;let near=FEATURES.reduce((best,f)=>{const d=distance(player.pos,f);return d<best.d?{d,loc:f.label}:best},{d:1e9,loc:''});const text=near.d<2.5?'📍 '+near.loc:'📍 新訓中心 · 軍營道路';if(text!==lastLoc){$('label').textContent=text;lastLoc=text}$('enemyStatus').textContent=encounter.dead?'🔴 紅隊菜兵 · 已倒地':`🔴 紅隊菜兵 · HP ${3-encounter.hits}/3 · 距離 ${distance(player.pos,foe.pos).toFixed(1)}m`;$('state').textContent=player.anim.clip;}
  frames++;if(now-fpsAt>=1000){$('fps').textContent=`${Math.round(frames*1000/(now-fpsAt))} FPS`;fpsAt=now;frames=0}requestAnimationFrame(loop)
 }
 requestAnimationFrame(loop);
}catch(error){console.error(error);$('notice').hidden=true;$('fatal').hidden=false;$('fatal').innerHTML='<b>模型載入失敗</b>'+String(error.message||error)+'<p>請上傳整個 ZIP 內的資料夾結構，不能只上傳 HTML。Chrome / Safari 均須透過 GitHub Pages 或 HTTP 開啟。</p>';}}
boot();
