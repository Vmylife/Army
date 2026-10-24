import {loadGlb} from './core/glb.js?v=055';
import {ArmyRenderer} from './core/renderer.js?v=055';
import {RigAnimator} from './characters/rigAnimator.js?v=041';
import {CAMP,moveWithCollision} from './map/camp.js?v=050';
import {drawMinimap} from './ui/minimap.js?v=052';
import {setupInput} from './ui/input.js?v=054';
import {options} from './systems/settings.js?v=053';
const $=id=>document.getElementById(id);
const notice=s=>{const el=$('notice');if(!s){el.hidden=true;return;}el.textContent=s;el.hidden=false};
function errorPanel(title,error){
 console.error(title,error);
 notice('');const el=$('fatal');el.hidden=false;el.replaceChildren();
 const heading=document.createElement('b');heading.textContent=title;
 const details=document.createElement('p');details.style.whiteSpace='pre-wrap';
 details.textContent=String(error?.message||error);
 const retry=document.createElement('button');retry.type='button';retry.textContent='重新載入遊戲';retry.style.cssText='background:#466c55;color:white;border:0;border-radius:12px;padding:11px 16px;margin-top:10px';retry.addEventListener('click',()=>location.reload());
 el.append(heading,details,retry);
}
function setDirection(actor,x,z){
 const want=Math.atan2(x,z),diff=Math.atan2(Math.sin(want-actor.angle),Math.cos(want-actor.angle));
 actor.angle+=diff*.21;
}
function motion(strength,lastMode){
 strength=Number.isFinite(strength)?Math.max(0,Math.min(1,strength)):0;
 if(strength<options.walkThreshold)return {mode:'Idle',speed:0,animationSpeed:1};
 const runCut=(lastMode==='Running'||lastMode==='RunFast')?options.runThreshold-.045:options.runThreshold+.025;
 const sprintCut=lastMode==='RunFast'?options.sprintThreshold-.045:options.sprintThreshold+.025;
 const lerp=(a,b,t)=>a+(b-a)*Math.max(0,Math.min(1,t));
 if(strength<runCut){const t=(strength-options.walkThreshold)/(options.runThreshold-options.walkThreshold);return {mode:'Walking',speed:lerp(1.9,options.moveSpeed,t),animationSpeed:lerp(.95,1.62,t)}}
 if(strength<sprintCut){const t=(strength-options.runThreshold)/(options.sprintThreshold-options.runThreshold);return {mode:'Running',speed:lerp(options.moveSpeed,options.runSpeed,t),animationSpeed:lerp(1.08,1.42,t)}}
 const t=(strength-options.sprintThreshold)/(1-options.sprintThreshold);return {mode:'RunFast',speed:lerp(options.runSpeed,options.sprintSpeed,t),animationSpeed:lerp(1.25,1.5,t)};
}
async function boot(){
 let phase='初始化 3D';
 try{
  const canvas=$('world');const renderer=new ArmyRenderer(canvas);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();errorPanel('手機 3D 繪製中斷','Safari 已停止 WebGL，按「重新載入遊戲」恢復。')});
  phase='載入阿兵哥';notice('載入阿兵哥…');
  // Mobile uses the optimized but visually consistent 44-bone, 9-animation GLB.
  const isMobile=matchMedia('(pointer:coarse)').matches;
  const heroPaths=isMobile
   ? ['./assets/characters/player/recruit-mobile.glb','./assets/characters/player/recruit-mixamo.glb']
   : ['./assets/characters/player/recruit-mixamo.glb','./assets/characters/player/recruit-mobile.glb'];
  let hero;const failures=[];
  for(const path of heroPaths){
   try{hero=await loadGlb(path);await renderer.addModel('recruit',hero);break}
   catch(e){failures.push(path+': '+String(e?.message||e));console.warn('主角備援載入',path,e);hero=null}
  }
  if(!hero)throw Error(failures.join('\n'));
  const player={pos:{...CAMP.spawn},angle:0,anim:new RigAnimator(hero)};
  // The enemy is optional. A transient fetch/image error must NOT prevent play.
  let foe=null;phase='載入紅隊敵人';notice('載入紅隊敵人…');
  try{
   const red=await loadGlb('./assets/characters/enemy/enemy-red-mixamo.glb');
   await renderer.addModel('red',red);
   foe={pos:{...CAMP.enemySpawn},angle:Math.PI,anim:new RigAnimator(red)};
   foe.anim.setClip(foe.anim.hasClip('Idle')?'Idle':'Casual_Walk');
  }catch(e){console.warn('紅隊敵人暫時無法載入，軍營探索不受影響',e)}
  let camYaw=.66,camPitch=.82,zoom=8.4;
  const input=setupInput(canvas,(dx,dy)=>{camYaw+=dx;camPitch=Math.max(.32,Math.min(1.09,camPitch+dy))});
  notice('');
  let last=performance.now(),foePhase=0,lastMapFrame=0,lastMode='Idle',crashes=0,firstFrame=true;
  function loop(now){
   try{
    const dt=Math.min(.045,Math.max(0,(now-last)/1000));last=now;
    const dir=input(),strength=dir.magnitude;
    if(['BeHit_FlyUp','Arise','Boxing_Practice'].includes(player.anim.clip)&&player.anim.finished())player.anim.setClip('Idle');
    if(player.anim.clip!=='Dead'&&player.anim.clip!=='BeHit_FlyUp'){
     const m=motion(strength,lastMode);
     if(m.speed>0){
      const c=Math.cos(camYaw),s=Math.sin(camYaw),dx=dir.x/(strength||1),dy=dir.y/(strength||1);
      const mx=dx*c-dy*s,mz=-dx*s-dy*c;
      player.pos=moveWithCollision(player.pos,mx*dt*m.speed,mz*dt*m.speed);setDirection(player,mx,mz);
     }
     if(player.anim.clip!==m.mode)player.anim.setClip(m.mode);
     player.anim.speed=m.animationSpeed;lastMode=m.mode;
    }
    player.anim.evaluate(dt);
    if(foe){
     if(foe.anim.clip==='Casual_Walk'){
      foePhase+=dt*.34;
      const tx=CAMP.enemySpawn.x+Math.cos(foePhase)*.9-.9,tz=CAMP.enemySpawn.z+Math.sin(foePhase)*.7;
      const dx=tx-foe.pos.x,dz=tz-foe.pos.z;
      foe.pos.x+=dx*Math.min(1,dt*1.5);foe.pos.z+=dz*Math.min(1,dt*1.5);
      if(Math.hypot(dx,dz)>.015)setDirection(foe,dx,dz);
     }
     foe.anim.evaluate(dt);
    }
    renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom});renderer.startFrame(player.pos);
    renderer.drawActor('recruit',player);
    if(foe)renderer.drawActor('red',foe);
    if(firstFrame){firstFrame=false;const webglErr=renderer.gl.getError();if(webglErr!==renderer.gl.NO_ERROR)console.warn('WebGL 首幀繪製錯誤',webglErr)}
    if(now-lastMapFrame>70){lastMapFrame=now;drawMinimap(player.pos,foe?.pos||null,false,player.angle)}
    crashes=0;
   }catch(e){if(++crashes===1)errorPanel('軍營執行錯誤',e);if(crashes>20)return}
   requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
 }catch(e){errorPanel('軍營載入失敗（'+phase+'）',e)}
}
boot();
