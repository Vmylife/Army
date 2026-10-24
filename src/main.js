import {loadGlb} from './core/glb.js';
import {ArmyRenderer} from './core/renderer.js?v=050';
import {RigAnimator} from './characters/rigAnimator.js?v=041';
import {CAMP,moveWithCollision} from './map/camp.js?v=050';
import {drawMinimap} from './ui/minimap.js?v=051';
import {setupInput} from './ui/input.js?v=051';
import {options} from './systems/settings.js?v=051';
const $=id=>document.getElementById(id);
const notice=(s)=>{const el=$('notice');if(!s){el.hidden=true;return;}el.textContent=s;el.hidden=false};
function setDirection(actor,x,z){
 const want=Math.atan2(x,z),diff=Math.atan2(Math.sin(want-actor.angle),Math.cos(want-actor.angle));
 actor.angle+=diff*.21;
}
function motion(strength,lastMode){
 if(strength<options.walkThreshold)return {mode:'Idle',speed:0,animationSpeed:1};
 // Small hysteresis to avoid flicker when a thumb rests exactly on a threshold.
 const runCut=lastMode==='Running'||lastMode==='RunFast'?options.runThreshold-.045:options.runThreshold+.025;
 const sprintCut=lastMode==='RunFast'?options.sprintThreshold-.045:options.sprintThreshold+.025;
 const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
 if(strength<runCut){
  const t=(strength-options.walkThreshold)/(options.runThreshold-options.walkThreshold);
  return {mode:'Walking',speed:lerp(1.9,options.moveSpeed,t),animationSpeed:lerp(.95,1.62,t)};
 }
 if(strength<sprintCut){
  const t=(strength-options.runThreshold)/(options.sprintThreshold-options.runThreshold);
  return {mode:'Running',speed:lerp(options.moveSpeed,options.runSpeed,t),animationSpeed:lerp(1.08,1.42,t)};
 }
 const t=(strength-options.sprintThreshold)/(1-options.sprintThreshold);
 return {mode:'RunFast',speed:lerp(options.runSpeed,options.sprintSpeed,t),animationSpeed:lerp(1.25,1.5,t)};
}
async function boot(){
 try{
  const renderer=new ArmyRenderer($('world'));
  notice('載入阿兵哥…');
  const hero=await loadGlb('./assets/characters/player/recruit-mixamo.glb');
  await renderer.addModel('recruit',hero);
  notice('載入軍營與紅隊…');
  const foeGltf=await loadGlb('./assets/characters/enemy/enemy-red-mixamo.glb');
  await renderer.addModel('red',foeGltf);
  const player={pos:{...CAMP.spawn},angle:0,anim:new RigAnimator(hero)};
  const foe={pos:{...CAMP.enemySpawn},angle:Math.PI,anim:new RigAnimator(foeGltf)};
  const enemyIdle=foe.anim.hasClip('Idle')?'Idle':'Casual_Walk';
  foe.anim.setClip(enemyIdle);
  let camYaw=.66,camPitch=.69,zoom=options.zoom;
  const input=setupInput($('world'),(dx,dy)=>{camYaw+=dx;camPitch=Math.max(.32,Math.min(1.14,camPitch+dy));});
  notice('');
  let last=performance.now(),foePhase=0,lastMapFrame=0,lastMode='Idle';
  function loop(now){
   const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;
   const dir=input();const strength=dir.magnitude;
   if(player.anim.clip==='BeHit_FlyUp'&&player.anim.finished())player.anim.setClip('Idle');
   if(player.anim.clip==='Arise'&&player.anim.finished())player.anim.setClip('Idle');
   if(player.anim.clip==='Boxing_Practice'&&player.anim.finished())player.anim.setClip('Idle');
   if(player.anim.clip!=='Dead' && player.anim.clip!=='BeHit_FlyUp'){
    const m=motion(strength,lastMode);
    if(m.speed>0){
     const c=Math.cos(camYaw),s=Math.sin(camYaw);
     const dx=dir.x/(strength||1),dy=dir.y/(strength||1);
     const mx=dx*c-dy*s,mz=-dx*s-dy*c;
     player.pos=moveWithCollision(player.pos,mx*dt*m.speed,mz*dt*m.speed);
     setDirection(player,mx,mz);
    }
    if(player.anim.clip!==m.mode)player.anim.setClip(m.mode);
    player.anim.speed=m.animationSpeed;
    lastMode=m.mode;
   }
   player.anim.evaluate(dt);
   if(foe.anim.clip==='Casual_Walk'){
    foePhase+=dt*.34;
    const tx=CAMP.enemySpawn.x+Math.cos(foePhase)*.9-.9;
    const tz=CAMP.enemySpawn.z+Math.sin(foePhase)*.7;
    const dx=tx-foe.pos.x,dz=tz-foe.pos.z;
    foe.pos.x+=dx*Math.min(1,dt*1.5);foe.pos.z+=dz*Math.min(1,dt*1.5);
    if(Math.hypot(dx,dz)>.015)setDirection(foe,dx,dz);
   }
   foe.anim.evaluate(dt);
   renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom});
   renderer.startFrame(player.pos);
   renderer.drawActor('recruit',player);
   renderer.drawActor('red',foe);
   if(now-lastMapFrame>250){lastMapFrame=now;drawMinimap(player.pos,foe.pos,false)}
   requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
 }catch(error){
  console.error(error);notice('');
  const el=$('fatal');el.hidden=false;
  el.innerHTML='<b>軍營載入失敗</b>'+String(error.message||error)+'<p>請保留原本模型及資料夾結構，並使用 GitHub Pages 開啟。</p>';
 }
}
boot();
