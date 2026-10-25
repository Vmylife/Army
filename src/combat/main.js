// Army v0.11.0: separate autoplay survival battle. Camp/index.html remain unchanged.
import {ArmyRenderer} from '../core/renderer.js?v=092';
import {RigAnimator} from '../characters/rigAnimator.js?v=084';
import {RifleRenderer} from '../battle/rifleRenderer.js?v=087';
import {loadGlb} from '../core/glb.js?v=060';
import {applyArena} from './arena.js?v=0110';
import {BattleSimulation,MODES} from './logic.js?v=0110';
import {BattleEffects} from './effects.js?v=0110';

const $=id=>document.getElementById(id);
const state={mode:'normal',playing:false,loading:false,loaded:false,speed:1,sound:false,renderer:null,rifle:null,glb:null,sim:null,effects:null,raf:0,last:0,hudAt:0,zoom:33,yaw:.62,pitch:1.10,drag:null,audio:null,lastBeep:0};
// Lower the pixel ratio for low- and mid-range phones. Native camp settings unaffected.
if(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||innerWidth<760)window.armyEco=true;
const show=(name)=>{for(const key of ['menu','loading','end','fatal'])$(key).hidden=name!==key};
const updateProgress=(pct,what)=>{$('loadBar').style.width=`${Math.round(pct)}%`;$('loadPercent').textContent=`${Math.round(pct)}%`;$('loadMsg').textContent=what};
for(const btn of document.querySelectorAll('[data-mode]'))btn.addEventListener('click',()=>{
 state.mode=btn.dataset.mode;for(const b of document.querySelectorAll('[data-mode]')){const on=b.dataset.mode===state.mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));}
});
function beep(){if(!state.sound)return;const now=performance.now();if(now-state.lastBeep<90)return;state.lastBeep=now;
 try{const ctx=state.audio||(state.audio=new (window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume().catch(()=>{});
  const o=ctx.createOscillator(),gain=ctx.createGain();o.type='triangle';o.frequency.setValueAtTime(155,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(75,ctx.currentTime+.065);gain.gain.setValueAtTime(.034,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.075);o.connect(gain);gain.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.08);
 }catch(_){state.sound=false;$('sound').textContent='音效 關'}
}
async function loadResources(){
 state.loading=true;show('loading');updateProgress(2,'初始化 WebGL…');
 const renderer=new ArmyRenderer($('battle3d'));applyArena(renderer);state.renderer=renderer;state.effects=new BattleEffects($('effects'));
 state.rifle=new RifleRenderer(renderer.gl);
 updateProgress(13,'下載現有士兵模型與步槍…');
 const [glb,weapon]=await Promise.all([
  loadGlb('./assets/characters/cadet/cadet-green.glb?v=077'),
  loadGlb('./assets/weapons/rifle.glb?v=084')
 ]);
 state.glb=glb;updateProgress(51,'建立綠色阿兵哥…');
 await renderer.addModel('hero',glb);
 updateProgress(72,'建立紅色敵人士兵…');
 await renderer.addModel('enemy',glb,{textureUrl:'./assets/characters/cadet/cadet-red-texture.jpg'});
 updateProgress(90,'組裝步槍、戰場與動畫…');
 state.rifle.addModel(weapon);
 state.loaded=true;state.loading=false;
 updateProgress(100,'戰場準備完成');
}
function setupSimulation(){state.sim=new BattleSimulation(state.mode,()=>new RigAnimator(state.glb));state.zoom=33;state.yaw=.62;state.pitch=1.10;
 state.sim.onShot=team=>{if(team==='player')beep()};
 state.sim.onEnd=result=>{state.playing=false;$('endTitle').textContent=result==='生存成功'?'成功存活！':'士兵陣亡';
  const s=state.sim;$('endSummary').textContent=`${MODES[state.mode].name}｜存活 ${formatTime(s.time)}｜擊殺 ${s.kills} 名敵軍｜命中 ${s.hits} / ${s.shots} 發`;
  $('end').hidden=false;};
 state.speed=1;$('speed').textContent='速度 1×';$('modeTag').textContent=MODES[state.mode].name;
}
function formatTime(t){const n=Math.max(0,Math.floor(t));return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`}
function paintHUD(){const sim=state.sim,hero=sim.player;if(!sim)return;
 $('hpfill').style.width=`${Math.min(100,hero.hp/hero.maxHp*100)}%`;
 $('hptext').textContent=`${Math.ceil(hero.hp)} / ${hero.maxHp}`;
 $('kills').textContent=String(sim.kills);$('wave').textContent=String(sim.wave);$('timer').textContent=formatTime(sim.time);
}
function drawFrame(now){const {renderer,sim,rifle,effects}=state;if(!renderer||!sim)return;
 renderer.setCamera({yaw:state.yaw,pitch:state.pitch,zoom:state.zoom});
 renderer.startFrame(sim.player.pos);
 // In this first version, obstacles belong to the arena's single pre-merged static mesh.
 for(const actor of [sim.player,...sim.enemies]){
  if(actor.dead&&sim.time-actor.deadAt>1.4)continue;
  if(!renderer.isActorVisible(actor.pos))continue;
  renderer.drawActor(actor.type==='player'?'hero':'enemy',actor);
  if(!actor.dead)rifle.draw(renderer.vp,actor,sim.time*1000);
 }
 effects.draw(sim,renderer.vp);
 if(now-state.hudAt>=95){paintHUD();state.hudAt=now;}
}
function frame(now){
 try{
  const dt=Math.min(.045,Math.max(0,(now-state.last)/1000));state.last=now;
  if(state.playing){for(let i=0;i<state.speed;i++)state.sim.update(dt);}
  if(state.playing||state.sim)drawFrame(now);
 }catch(e){state.playing=false;showError(e);return}
 state.raf=requestAnimationFrame(frame);
}
function startBattle(){state.playing=true;state.hudAt=0;setupSimulation();$('hud').hidden=false;
 for(const key of ['menu','loading','end','fatal'])$(key).hidden=true;
 if(!state.raf){state.last=performance.now();state.raf=requestAnimationFrame(frame)}
}
function showError(e){console.error('戰鬥實驗場',e);$('errorText').textContent=String(e?.message||e);$('fatal').hidden=false;$('loading').hidden=true;state.loading=false}
$('start').addEventListener('click',async()=>{
 if(state.loading)return;
 try{if(!state.loaded)await loadResources();startBattle()}catch(e){showError(e)}
});
$('retry').addEventListener('click',()=>location.reload());
$('again').addEventListener('click',()=>{startBattle()});
$('backMenu').addEventListener('click',()=>{state.playing=false;$('end').hidden=true;$('menu').hidden=false;$('hud').hidden=true});
$('speed').addEventListener('click',()=>{state.speed=state.speed===1?2:1;$('speed').textContent=`速度 ${state.speed}×`});
$('zoomOut').addEventListener('click',()=>state.zoom=Math.min(56,state.zoom+5));
$('zoomIn').addEventListener('click',()=>state.zoom=Math.max(19,state.zoom-5));
$('sound').addEventListener('click',()=>{state.sound=!state.sound;$('sound').textContent=state.sound?'音效 開':'音效 關';if(state.sound)beep()});
$('battle3d').addEventListener('wheel',e=>{e.preventDefault();state.zoom=Math.max(19,Math.min(56,state.zoom+Math.sign(e.deltaY)*2))},{passive:false});
$('battle3d').addEventListener('pointerdown',e=>{state.drag={id:e.pointerId,x:e.clientX,y:e.clientY};$('battle3d').setPointerCapture(e.pointerId)});
$('battle3d').addEventListener('pointermove',e=>{const d=state.drag;if(!d||e.pointerId!==d.id)return;
 const dx=e.clientX-d.x,dy=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;
 state.yaw+=dx*.007;state.pitch=Math.max(.55,Math.min(1.35,state.pitch+dy*.005));
});
for(const name of ['pointerup','pointercancel'])$('battle3d').addEventListener(name,()=>state.drag=null);
show('menu');
