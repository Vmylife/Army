// Army v0.10.6: keep the approved 3D camp; introduce choreographed NPC routines.
import {CampBuildings,BUILDING_MODELS} from './buildings/buildingRenderer.js?v=093';
import {CampProps,PROP_MODELS} from './props/propRenderer.js?v=092';
import {loadGlb} from './core/glb.js?v=060';
import {ArmyRenderer} from './core/renderer.js?v=092';
import {RigAnimator} from './characters/rigAnimator.js?v=084';
import {RifleRenderer} from './battle/rifleRenderer.js?v=087';
import {createRangeAudio} from './battle/rangeTraining.js?v=084';
import {CAMP} from './map/camp.js?v=093';
import {moveWithPropCollision as moveWithCollision} from './map/propCollision105.js?v=105';
import {drawMinimap} from './ui/minimap.js?v=093';
import {initWorldMap} from './ui/worldMap.js?v=093';
import {setupInput} from './ui/input.js?v=062';
import {options} from './systems/settings.js?v=060';
import {createCampNPCs,updateCampNPCs} from './systems/npcLife106.js?v=106';

const $=id=>document.getElementById(id);
const debug=new URLSearchParams(location.search).has('debug');
const worldMap=initWorldMap();
function status(message){const el=$('notice');el.textContent=message;el.hidden=!message}
async function stage(promise,what,ms=120000){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(what+' 載入逾時，請確認網路和檔案路徑')),ms)})])}finally{clearTimeout(timer)}}
function errorMessage(message){status('');$('errorText').textContent=message;$('fatal').hidden=false;window.armyLoadFailure?.(new Error(message));}
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
const modelUrl='./assets/characters/cadet/cadet-green.glb?v=077';

async function boot(){
 let step='初始化軍營';
 try{
  const countTotal=1+BUILDING_MODELS.length+PROP_MODELS.length+1;
  let completed=0;
  const progress=message=>window.armySetLoading?.(completed,countTotal,message);
  const done=message=>{completed++;progress(message)};
  progress('建立地圖與渲染器…');
  const renderer=new ArmyRenderer($('world'));
  step='下載主角 GLB';progress('載入阿兵哥模型…');
  const heroGlb=await stage(loadGlb(modelUrl),'主角模型');
  step='建立主角貼圖';await stage(renderer.addModel('recruit',heroGlb),'主角貼圖');done('阿兵哥已就位');
  const rifleRenderer=new RifleRenderer(renderer.gl);
  const rifleReady=(async()=>{
    const glb=await stage(loadGlb('./assets/weapons/rifle.glb?v=084'),'步槍模型');
    await stage(rifleRenderer.addModel(glb),'建立步槍');done('武器載入完成');
  })();
  const playRangeShot=createRangeAudio();
  const buildings=new CampBuildings(renderer.gl);
  const buildingReady=Promise.all(BUILDING_MODELS.map(async model=>{
    const glb=await stage(loadGlb(model.url),'建築 '+model.id,120000);
    await stage(buildings.add(model.id,glb),'建立建築 '+model.id,120000);
    done('正在建立建築與地圖…');
  }));
  const props=new CampProps(renderer.gl);
  const propsReady=Promise.all(PROP_MODELS.map(async model=>{
    const glb=await stage(loadGlb(model.url),'道具 '+model.id,120000);
    await stage(props.add(model.id,glb),'建立道具 '+model.id,120000);
    done('正在配置營區道具…');
  }));
  step='等待所有模型完成';
  await stage(Promise.all([buildingReady,propsReady,rifleReady]),'完整軍營載入',180000);
  progress('模型已載入，正在準備第一個畫面…');

  step='建立主角骨架';const player={pos:{...CAMP.spawn},angle:0,anim:new RigAnimator(heroGlb)};
  player.anim.setClip('Idle');player.anim.evaluate(0);
  const npcs=createCampNPCs(heroGlb);
  let camYaw=options.cameraYaw,camPitch=options.cameraPitch;
  const minZoom=options.zoom,maxZoom=minZoom*2;
  let cameraZoom=minZoom,targetZoom=minZoom;
  const input=setupInput($('world'),
    (dx,dy)=>{if(!worldMap.isOpen()){camYaw+=dx;camPitch=Math.max(.32,Math.min(1.12,camPitch+dy))}},
    ratio=>{if(!worldMap.isOpen()&&Number.isFinite(ratio)&&ratio>0)targetZoom=Math.max(minZoom,Math.min(maxZoom,targetZoom*ratio))}
  );
  let last=performance.now(),lastMap=0,lastDebug=0;
  let fpsFrames=0,fpsSince=last,measuredFps=0;
  let mapYaw=camYaw,mapFacing=Math.PI-player.angle+mapYaw;
  status('');
  let audition=null,entered=false;
  if(debug){
    const lab=document.createElement('div');lab.id='animationLab';
    lab.style.cssText='position:fixed;bottom:calc(env(safe-area-inset-bottom) + 22px);right:12px;z-index:70;background:#fbf7e8eb;border-radius:12px;padding:8px;color:#264b3f;font:13px system-ui;max-width:47vw';
    const sel=document.createElement('select');sel.setAttribute('aria-label','角色動畫測試');
    sel.style.cssText='max-width:100%;font:12px system-ui;';
    for(const name of Object.keys(player.anim.clips)){
      const opt=document.createElement('option');opt.value=name;opt.textContent=({Idle:'待機',Walking:'走路',Running:'跑步',RunFast:'衝刺',Knock_Down:'擊倒',Victory_Cheer:'歡呼',push_up:'伏地挺身',situps:'仰臥起坐',Punch_Combo_1:'連續拳擊',Chair_Sit_Idle_M:'坐著',Climb_Up_Rope:'爬繩',Sleep_Normally:'睡覺',Sit_and_Doze_Off:'打瞌睡',Pull_Radish:'拔蘿蔔'})[name]||name;sel.appendChild(opt);
    }
    sel.value='Idle';sel.addEventListener('change',()=>{audition=sel.value;player.anim.setClip(audition,{restart:true})});lab.appendChild(sel);document.body.appendChild(lab);
  }
  function tick(now){
   try{
    const dt=entered?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
    if(debug){fpsFrames++;if(now-fpsSince>=1000){measuredFps=Math.round(fpsFrames*1000/(now-fpsSince));fpsFrames=0;fpsSince=now;}}
    const stick=worldMap.isOpen()?{x:0,y:0,magnitude:0}:input(),m=movement(stick.magnitude);
    cameraZoom+=(targetZoom-cameraZoom)*Math.min(1,dt*12);
    if(m.speed>0){
     const dx=stick.x/(stick.magnitude||1),dy=stick.y/(stick.magnitude||1);
     const c=Math.cos(camYaw),s=Math.sin(camYaw),mx=dx*c-dy*s,mz=-dx*s-dy*c;
     const before=player.pos;
     player.pos=moveWithCollision(player.pos,mx*dt*m.speed,mz*dt*m.speed);
     if(Math.hypot(player.pos.x-before.x,player.pos.z-before.z)>1e-5){face(player,mx,mz);mapYaw=camYaw;}
    }
    if(m.speed>0)audition=null;
    if(audition&&player.anim.clip!==audition)player.anim.setClip(audition);
    else if(!audition&&player.anim.clip!==m.clip)player.anim.setClip(m.clip);
    player.anim.speed=m.rate;player.anim.evaluate(dt);
    updateCampNPCs(npcs,dt,now,player.pos);
    renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom:cameraZoom});renderer.startFrame(player.pos);
    buildings.draw(renderer.vp,player.pos);
    props.draw(renderer.vp,player.pos);
    renderer.drawActor('recruit',player);
    for(const npc of npcs){
      const distance=Math.hypot(npc.pos.x-player.pos.x,npc.pos.z-player.pos.z);
      if(npc.shotPending){npc.shotPending=false;playRangeShot(distance)}
      if(renderer.isActorVisible(npc.pos)){
       npc.anim.evaluate(dt);renderer.drawActor('recruit',npc);
       if(npc.home.job==='shoot')rifleRenderer.draw(renderer.vp,npc,now);
      }
    }
    mapFacing=Math.PI-player.angle+mapYaw;
    if(now-lastMap>=16){
      if(!worldMap.isOpen())drawMinimap(player.pos,null,false,mapFacing,mapYaw);
      worldMap.update(player.pos,null,player.angle);lastMap=now;
    }
    if(debug&&now-lastDebug>150){$('debug').hidden=false;$('debug').textContent=`fps: ${measuredFps}\nmode: ${m.clip}\npos: ${player.pos.x.toFixed(2)},${player.pos.z.toFixed(2)}\ninput: ${stick.magnitude.toFixed(2)}\nzoom: ${cameraZoom.toFixed(2)}\nrenderer: webgl2`;lastDebug=now}
    // First frame (including ground + ALL models) must complete before reveal.
    if(!entered){entered=true;window.armyLoadComplete?.();last=now;}
    requestAnimationFrame(tick);
   }catch(error){console.error('遊戲迴圈錯誤',error);errorMessage('遊戲迴圈：'+String(error.stack||error));}
  }
  requestAnimationFrame(tick);
 }catch(error){console.error('Army 啟動階段',step,error);errorMessage(step+'：'+String(error.message||error));}
}
boot();
