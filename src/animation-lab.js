import {loadGlb} from './core/glb.js';
import {SoldierRenderer} from './core/renderer.js';
import {AnimationPlayer} from './characters/animationPlayer.js';
import {setupControls} from './ui/controls.js';
import {clampToMap} from './map/trainingGround.js';
async function boot(){const err=document.querySelector('#error'),progress=document.querySelector('#progress'),canvas=document.querySelector('#scene');let renderer;
 try{renderer=new SoldierRenderer(canvas);progress.textContent='讀取阿兵哥模型與動畫…';const model=await loadGlb('./assets/characters/recruit/recruit-batch1.glb');await renderer.setModel(model);const player=new AnimationPlayer(model);let desired={x:0,y:0},drag=null;
  setupControls(player,{onMove:v=>{desired=v}});
  canvas.addEventListener('pointerdown',e=>{drag={pointer:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;renderer.yaw+=(e.clientX-drag.x)*.008;renderer.pitch=Math.max(-.1,Math.min(.6,renderer.pitch+(e.clientY-drag.y)*.004));drag.x=e.clientX;drag.y=e.clientY;});canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
  let last=performance.now(),fpsT=0,frames=0;progress.style.display='none';
  function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;
   const inputPower=Math.min(1,Math.hypot(desired.x,desired.y));
   if(inputPower>.08&&player.clip!=='Death'&&player.clip!=='Hit'){
    if(!['Walk','RifleWalk','Run'].includes(player.clip))player.setClip('Walk');
    const v=player.clip==='Run'?1.95:1.05;const next=clampToMap(renderer.worldPos.x+desired.x*dt*v,renderer.worldPos.z-desired.y*dt*v);Object.assign(renderer.worldPos,next);
    renderer.direction=Math.atan2(-desired.x,-desired.y);
   } else if(inputPower<=.08&&['Walk','RifleWalk','Run'].includes(player.clip)&&document.querySelector('#autoIdle').checked){player.setClip(player.clip==='RifleWalk'?'RifleIdle':'Idle');}
   player.play(dt);renderer.render(player);frames++;fpsT+=dt;if(fpsT>1){document.querySelector('#fps').textContent=`${Math.round(frames/fpsT)} FPS`;fpsT=0;frames=0;}
   requestAnimationFrame(loop);
  }requestAnimationFrame(loop);
 }catch(e){console.error(e);progress.style.display='none';err.style.display='block';err.textContent='載入失敗：'+e.message+'。請確認整個資料夾已上傳到 GitHub Pages，或在本機透過 HTTP 伺服器開啟。';}}
boot();
