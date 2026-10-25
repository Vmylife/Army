// v0.11.1: ORIGINAL camp movement, renderer, controls, animation and map;
// battle is exclusively new game logic around those unchanged systems.
import {CampBuildings,BUILDING_MODELS} from '../buildings/buildingRenderer.js?v=093';
import {CampProps,PROP_MODELS} from '../props/propRenderer.js?v=092';
import {loadGlb} from '../core/glb.js?v=060';
import {ArmyRenderer} from '../core/renderer.js?v=092';
import {RigAnimator} from '../characters/rigAnimator.js?v=084';
import {RifleRenderer} from './rifleRenderer.js?v=087';
import {CAMP,BUILDINGS,PROPS,insidePerimeter,collides} from '../map/camp.js?v=093';
import {moveWithPropCollision as moveWithCollision,footCollides} from '../map/propCollision105.js?v=105';
import {drawMinimap} from '../ui/minimap.js?v=093';
import {initWorldMap} from '../ui/worldMap.js?v=093';
import {setupInput} from '../ui/input.js?v=062';
import {options} from '../systems/settings.js?v=060';
import {BulletTracers} from './tracers111.js?v=111';
import {nearestEnemy,visibleShot} from './campBattleLogic111.js?v=111';

const $=id=>document.getElementById(id);
const mode=window.armyBattleMode?.()||'normal';
const cfg=mode==='elite'
 ?{label:'超級士兵',hp:340,damage:65,range:19,fire:235,move:1.23,cap:25,spawn:1250}
 :{label:'普通士兵',hp:175,damage:29,range:11.5,fire:910,move:.75,cap:16,spawn:1850};
const GAME_MS=180000;
const map=initWorldMap();
// Battle-only extension of the SAME camp movement: original sliding and collision
// within the perimeter, with no invisible barrier where the west/south fence was removed.
function moveInBattle(pos,dx,dz){
 const standard=moveWithCollision(pos,dx,dz);
 const goal={x:pos.x+dx,z:pos.z+dz};
 if(insidePerimeter(goal)&&insidePerimeter(pos))return standard;
 const allowed=p=>{
  if(p.x< -47.7||p.x>46||p.z< -23.7||p.z>27.3)return false;
  const openWest=p.x< -42&&p.z> -21.8&&p.z<15.5;
  const openSouth=p.z< -18.8&&p.x> -44&&p.x<36;
  return insidePerimeter(p)||openWest||openSouth;
 };
 // Only let the override operate in the opened boundary strips.
 if(!allowed(pos)||!allowed(goal))return standard;
 const step=(p,axis)=>{
  const c=axis==='x'?{x:p.x+dx,z:p.z}:{x:p.x,z:p.z+dz};
  return allowed(c)&&!collides(c,.27)&&!footCollides(c,.25)?c:p;
 };
 const a=step(step(pos,'x'),'z'),b=step(step(pos,'z'),'x');
 const d=q=>(q.x-goal.x)**2+(q.z-goal.z)**2;
 const extra=d(a)<d(b)?a:b;
 return d(extra)<d(standard)?extra:standard;
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const stage=async(p,label,ms=150000)=>{
 let tid;try{return await Promise.race([p,new Promise((_,reject)=>{tid=setTimeout(()=>reject(new Error(label+' 載入逾時')),ms)})])}finally{clearTimeout(tid)};
};
let total=1+BUILDING_MODELS.length+PROP_MODELS.length+2,completed=0;
const progress=msg=>window.armySetLoading?.(completed,total,msg);
const loaded=msg=>{completed++;progress(msg)};
function movement(mag){
 // Intentionally identical response curve to the original camp, except the chosen combat stat multiplier.
 mag=Number.isFinite(mag)?clamp(mag,0,1):0;
 if(mag<options.walkThreshold)return {clip:'Idle',speed:0,rate:1};
 const lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1);
 if(mag<options.runThreshold)return {clip:'Walking',speed:lerp(1.8,options.moveSpeed,(mag-options.walkThreshold)/(options.runThreshold-options.walkThreshold)),rate:lerp(.9,1.65,mag/options.runThreshold)};
 if(mag<options.sprintThreshold)return {clip:'Running',speed:lerp(options.moveSpeed,options.runSpeed,(mag-options.runThreshold)/(options.sprintThreshold-options.runThreshold)),rate:lerp(1.1,1.42,mag)};
 return {clip:'RunFast',speed:lerp(options.runSpeed,options.sprintSpeed,(mag-options.sprintThreshold)/(1-options.sprintThreshold)),rate:lerp(1.3,1.56,mag)};
}
function turn(actor,dx,dz,rate){const dest=Math.atan2(dx,dz),dif=Math.atan2(Math.sin(dest-actor.angle),Math.cos(dest-actor.angle));actor.angle+=dif*rate}
function formatTime(ms){const sec=Math.floor(ms/1000);return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`}
const sound=(()=>{let ctx=null,last=0;
 return(now,foe=false)=>{
  // Only short, restrained reports, to avoid 20 overlapping loud shots on mobile.
  if(now-last<(foe?240:90))return;last=now;
  try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx??=new AC();if(ctx.state==='suspended')ctx.resume().catch(()=>{});
   const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(foe?112:151,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(foe?65:76,ctx.currentTime+.065);
   gain.gain.setValueAtTime(.023,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.085);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.09);
  }catch(_e){}
 };
})();
async function boot(){
 let step='建立軍營';
 try{
  progress('建立原版軍營與攝影機…');
  const renderer=new ArmyRenderer($('world'));
  const gl=renderer.gl;
  const soldier=await stage(loadGlb('./assets/characters/cadet/cadet-green.glb?v=077'),'士兵模型');
  step='建立綠軍模型';await stage(renderer.addModel('green',soldier),'主角貼圖');loaded('主角就位');
  step='建立紅軍模型';await stage(renderer.addModel('red',soldier,{textureUrl:'./assets/characters/cadet/cadet-red-texture.jpg?v=077'}),'紅軍貼圖');loaded('敵軍就位');
  const rifle=new RifleRenderer(gl),rifleReady=(async()=>{const g=await stage(loadGlb('./assets/weapons/rifle.glb?v=084'),'步槍');rifle.addModel(g);loaded('武器就位')})();
  const buildings=new CampBuildings(gl),props=new CampProps(gl);
  const buildingReady=Promise.all(BUILDING_MODELS.map(async m=>{const g=await stage(loadGlb(m.url),'建築 '+m.id);await stage(buildings.add(m.id,g),'建築 '+m.id);loaded('建立軍營建築…')}));
  const propsReady=Promise.all(PROP_MODELS.map(async m=>{const g=await stage(loadGlb(m.url),'道具 '+m.id);await stage(props.add(m.id,g),'道具 '+m.id);loaded('放置軍營物件…')}));
  step='載入全部地圖模型';await stage(Promise.all([buildingReady,propsReady,rifleReady]),'完整軍營',180000);
  const effects=new BulletTracers(gl);
  const player={pos:{x:9.6,z:-8.3},angle:0,hp:cfg.hp,anim:new RigAnimator(soldier),shotUntil:0,nextShot:0};
  player.anim.setClip('Idle');player.anim.evaluate(0);
  const foes=[];let spawnSerial=0,kills=0,active=true,nextSpawn=0,elapsed=0,entered=false,last=performance.now(),lastMap=0;
  let camYaw=options.cameraYaw,camPitch=options.cameraPitch;
  const minZoom=options.zoom,maxZoom=minZoom*2;
  let cameraZoom=minZoom,targetZoom=minZoom,mapYaw=camYaw;
  const input=setupInput($('world'),
   (dx,dy)=>{if(!map.isOpen()){camYaw+=dx;camPitch=clamp(camPitch+dy,.32,1.12)}},
   ratio=>{if(!map.isOpen()&&Number.isFinite(ratio)&&ratio>0)targetZoom=clamp(targetZoom*ratio,minZoom,maxZoom)});
  $('battleMode').textContent=cfg.label;
  $('battleAgain').addEventListener('click',()=>location.reload());
  function spawn(){
   // SOUTH = gate-side border, WEST = barracks-side border. Both faces lost their fences in battle only.
   const s=spawnSerial++,west=(s%3===0);
   let pos=west?{x:-47.1,z:-14+((s*17)%19)}:{x:-36+((s*23)%51),z:-21.7};
   // This is deliberately just OUTSIDE the original boundary, inside the playable grass mesh.
   // moveInBattle() permits incoming units through the opened edges.
   const anim=new RigAnimator(soldier);anim.setClip('Running');anim.rifleAim=.6;anim.evaluate(0);
   foes.push({id:s,pos,angle:0,anim,hp:mode==='elite'?39:38,shotUntil:0,nextShot:1000+(s%5)*280,deadAt:0,stuck:0,side:s%2?1:-1});
  }
  function shoot(shooter,target,now,enemy=false){
   shooter.shotUntil=now+95;
   const dirx=target.pos.x-shooter.pos.x,dirz=target.pos.z-shooter.pos.z;
   const dist=Math.hypot(dirx,dirz)||1;
   // Tracer originates near rifle muzzle, continues in the original 3D scene.
   effects.fire({x:shooter.pos.x+dirx/dist*.40,y:1.04,z:shooter.pos.z+dirz/dist*.40},
    {x:target.pos.x,y:1.08,z:target.pos.z},now,enemy);
   sound(now,enemy);
   const hit=Math.random()<(enemy?.34:mode==='elite'?.97:.84);
   if(!hit)return;
   target.hp=Math.max(0,target.hp-(enemy?(mode==='elite'?2.8:3.8):cfg.damage));
   if(target.hp<=0){
    target.deadAt=now;target.anim.setClip(target.anim.hasClip('Dead')?'Dead':'Knock_Down',{restart:true});target.anim.rifleAim=0;
    if(!enemy)kills++;
   }
  }
  function finish(win){if(!active)return;active=false;
   player.anim.rifleAim=0;
   $('battleResult').hidden=false;
   $('battleEndTitle').textContent=win?'軍營守住了！':'戰鬥結束';
   $('battleEndText').textContent=`${cfg.label}\n存活時間：${formatTime(elapsed)}\n擊倒敵軍：${kills} 人\n${win?'成功撐過三分鐘的敵軍攻勢。':'再試著利用道路、建築與掩體移動。'}`;
  }
  function tick(now){
   try{
    const frameDt=entered?Math.min(.05,Math.max(0,(now-last)/1000)):0;
    const dt=active&&!map.isOpen()?frameDt:0;last=now;
    if(active&&entered&&!map.isOpen())elapsed+=dt*1000;
    const stick=active&&!map.isOpen()?input():{x:0,y:0,magnitude:0};
    const m=movement(stick.magnitude),spd=m.speed*cfg.move;
    cameraZoom+=(targetZoom-cameraZoom)*Math.min(1,dt*12);
    let moving=false,mx=0,mz=0;
    if(spd>0&&active){
     const dx=stick.x/(stick.magnitude||1),dy=stick.y/(stick.magnitude||1),c=Math.cos(camYaw),s=Math.sin(camYaw);
     mx=dx*c-dy*s;mz=-dx*s-dy*c;
     const next=moveInBattle(player.pos,mx*dt*spd,mz*dt*spd);
     moving=Math.hypot(next.x-player.pos.x,next.z-player.pos.z)>1e-5;
     player.pos=next;
     if(moving){turn(player,mx,mz,.22);mapYaw=camYaw}
    }
    if(entered&&active&&!map.isOpen()){
     // Hero shoots automatically; player retains total control of where to walk.
     const target=nearestEnemy(player,foes,cfg.range,BUILDINGS,PROPS);
     player.anim.rifleAim+=((target?.98:.70)-player.anim.rifleAim)*Math.min(1,dt*14);
     if(target&&now>=player.nextShot){
      const dx=target.pos.x-player.pos.x,dz=target.pos.z-player.pos.z;
      // Gentle target-facing, without changing the original world-relative joystick mapping.
      turn(player,dx,dz,moving?.28:.48);
      shoot(player,target,now);player.nextShot=now+cfg.fire;
     }
     if(elapsed>=GAME_MS)finish(true);
     if(now>=nextSpawn && elapsed<GAME_MS){
      const cap=cfg.cap,alive=foes.filter(e=>e.hp>0).length;
      if(alive<cap){spawn();if(elapsed>13000&&Math.random()<.24&&alive+1<cap)spawn()}
      nextSpawn=now+Math.max(720,cfg.spawn-elapsed/600);
     }
     // Enemies arrive from the opened sides, approach the hero, then take shots.
     for(const e of foes){if(e.hp<=0)continue;
      const dx=player.pos.x-e.pos.x,dz=player.pos.z-e.pos.z,dist=Math.hypot(dx,dz)||1;
      const nx=dx/dist,nz=dz/dist;
      const engage=dist<9.8;
      e.anim.rifleAim+=((engage?.99:.70)-e.anim.rifleAim)*Math.min(1,dt*6);
      const wanted=engage?2.0:2.75;
      if(dist>wanted){
       const speed=(engage?1.7:2.4)*dt;
       let moved=moveInBattle(e.pos,nx*speed,nz*speed);
       if(Math.hypot(moved.x-e.pos.x,moved.z-e.pos.z)<1e-4){
        // Slide around blocked routes; alternate left / right to prevent clumping.
        const side=e.side*(Math.cos(elapsed*.0013+e.id)*.5+.7);
        moved=moveInBattle(e.pos,(nx-nz*side)*speed,(nz+nx*side)*speed);
        e.stuck+=dt;
        if(e.stuck>2.5){e.side*=-1;e.stuck=0}
       }else e.stuck=0;
       e.pos=moved;
      }
      turn(e,dx,dz,Math.min(1,dt*6));
      if(engage&&now>=e.nextShot&&visibleShot(e.pos,player.pos,BUILDINGS,PROPS)){
       shoot(e,player,now,true);e.nextShot=now+1600+(e.id%6)*180;
       if(player.hp<=0){player.anim.setClip(player.anim.hasClip('Dead')?'Dead':'Knock_Down',{restart:true});finish(false)}
      }
      if(e.hp>0){const clip=dist>9.8?'Running':dist>2.0?'Walking':'Idle';if(e.anim.clip!==clip)e.anim.setClip(clip);e.anim.speed=engage?.9:1.1}
     }
     for(let i=foes.length-1;i>=0;i--)if(foes[i].hp<=0&&now-foes[i].deadAt>1800)foes.splice(i,1);
    }
    const clip=m.clip;
    if(player.hp>0&&player.anim.clip!==clip)player.anim.setClip(clip);
    player.anim.speed=m.rate*cfg.move;player.anim.evaluate(frameDt);
    renderer.setCamera({yaw:camYaw,pitch:camPitch,zoom:cameraZoom});renderer.startFrame(player.pos);
    buildings.draw(renderer.vp,player.pos);props.draw(renderer.vp,player.pos);
    renderer.drawActor('green',player);rifle.draw(renderer.vp,player,now);
    for(const e of foes){if(renderer.isActorVisible(e.pos)){
     e.anim.evaluate(frameDt);renderer.drawActor('red',e);
     if(e.hp>0)rifle.draw(renderer.vp,e,now);
    }}
    effects.draw(renderer.vp,now);
    if(now-lastMap>=30){if(!map.isOpen())drawMinimap(player.pos,null,false,Math.PI-player.angle+mapYaw,mapYaw);map.update(player.pos,null,player.angle);lastMap=now}
    if(entered){
     $('battleKills').textContent=kills;
     $('battleEnemies').textContent=foes.filter(e=>e.hp>0).length;
     $('battleHp').textContent=`生命 ${Math.ceil(player.hp)} / ${cfg.hp}`;
     $('battleHpBar').style.width=(100*player.hp/cfg.hp)+'%';
     $('battleTimer').textContent=formatTime(elapsed);
     $('battleNotice').textContent=elapsed<12000?'紅軍正從營舍側與哨口側入侵':`距離守住軍營還剩 ${formatTime(Math.max(0,GAME_MS-elapsed))}`;
    }
    if(!entered){entered=true;last=now;window.armyLoadComplete?.()}
    requestAnimationFrame(tick);
   }catch(error){console.error('戰鬥迴圈錯誤',error);$('errorText').textContent='戰鬥迴圈：'+String(error.stack||error);$('fatal').hidden=false;}
  }
  // An initial marching group from both sides, while the player is already armed.
  for(let i=0;i<6;i++)spawn();
  progress('準備完整軍營第一幀…');
  requestAnimationFrame(tick);
 }catch(e){console.error('軍營保衛戰啟動錯誤',step,e);window.armyLoadFailure?.(new Error(step+'：'+String(e.message||e)))}
}
boot();
