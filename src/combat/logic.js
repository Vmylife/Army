// Army Battle v0.11.0 — simple automatic survival combat. No military training stats yet.
import {COVERS,FIELD_RADIUS,moveInArena,firstCoverHit,hitCover} from './arena.js';
const PI2=Math.PI*2;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.pos.x-b.pos.x,a.pos.z-b.pos.z);
const toward=(actor,b)=>Math.atan2(b.pos.x-actor.pos.x,b.pos.z-actor.pos.z);
export const MODES={
 normal:{name:'普通士兵',hp:200,damage:43,interval:.37,accuracy:.77,range:23,speed:4.4,dodge:.13},
 elite:{name:'超強士兵',hp:560,damage:145,interval:.115,accuracy:.97,range:28,speed:6.8,dodge:.46}
};
const ENEMY={hp:68,damage:4,interval:1.55,accuracy:.47,range:22,speed:2.8,dodge:.02};
const COPY=o=>({...o});
function agent(type,id,x,z,stats){return{id,type,pos:{x,z},angle:0,hp:stats.hp,maxHp:stats.hp,stats:COPY(stats),ammo:18,clip:18,nextFire:0,reload:0,shotUntil:0,anim:null,dead:false,aiTick:0,strafe:Math.random()>.5?1:-1,strafetime:0,deadAt:0};}
export class BattleSimulation{
 constructor(mode='normal',createAnimator=()=>null){this.mode=mode;this.createAnimator=createAnimator;this.reset(mode)}
 reset(mode=this.mode){this.mode=mode;this.time=0;this.wave=1;this.kills=0;this.shots=0;this.hits=0;this.ended=false;this.result='';this.enemies=[];this.tracers=[];this.effects=[];this.seq=0;this.spawnBudget=0;this.spawnClock=0;this.player=agent('player','hero',0,0,MODES[mode]||MODES.normal);this.player.anim=this.createAnimator();this.player.anim?.setClip('Idle');this.player.anim?.evaluate(0);this.onKill=null;this.onShot=null;this.onEnd=null;this.spawnClock=0;}
 get aliveEnemies(){return this.enemies.filter(e=>!e.dead)}
 spawnEnemy(){let angle=Math.random()*PI2,rad=25+Math.random()*6;let x=Math.sin(angle)*rad,z=Math.cos(angle)*rad;
  if(hitCover(x,z,.6)){angle+=.33;x=Math.sin(angle)*rad;z=Math.cos(angle)*rad;}
  const e=agent('enemy',`enemy-${++this.seq}`,x,z,ENEMY);e.anim=this.createAnimator();e.anim?.setClip('Walking');e.anim?.evaluate(0);e.angle=toward(e,this.player);e.nextFire=.4+Math.random()*.7;this.enemies.push(e);
 }
 move(actor,dx,dz,dt){if(actor.dead)return false;const prev=actor.pos;actor.pos=moveInArena(prev,dx*dt,dz*dt);return Math.hypot(actor.pos.x-prev.x,actor.pos.z-prev.z)>.003}
 turn(actor,target,dt){const dir=toward(actor,target),delta=Math.atan2(Math.sin(dir-actor.angle),Math.cos(dir-actor.angle));actor.angle+=delta*Math.min(1,dt*13)}
 findCover(actor,threat){let best=null,score=-Infinity;for(const c of COVERS){const d=Math.hypot(actor.pos.x-c.x,actor.pos.z-c.z);if(d>17)continue;
  // The opposite side of the obstacle from the threat forms a plausible cover point.
  const vx=c.x-threat.pos.x,vz=c.z-threat.pos.z,vl=Math.hypot(vx,vz)||1;
  const px=c.x+vx/vl*(Math.max(c.w,c.d)*.5+.95),pz=c.z+vz/vl*(Math.max(c.w,c.d)*.5+.95);
  if(Math.hypot(px,pz)>FIELD_RADIUS-3||hitCover(px,pz,.38))continue;
  const candidate={x:px,z:pz};const closed=firstCoverHit(threat.pos.x,threat.pos.z,px,pz);
  const merit=(closed?10:0)-Math.hypot(actor.pos.x-px,actor.pos.z-pz)*.7;
  if(merit>score){score=merit;best=candidate;}
 }return best;}
 walkAndAnimate(actor,target,dt,hero=false){if(actor.dead)return;
  this.turn(actor,target,dt);
  const d=distance(actor,target),dx=(target.pos.x-actor.pos.x)/(d||1),dz=(target.pos.z-actor.pos.z)/(d||1);
  let vx=0,vz=0;
  const underPressure=actor.hp<actor.maxHp*.57;
  // Periodically change strafe direction to avoid a rigid circle.
  actor.strafetime-=dt;if(actor.strafetime<=0){actor.strafetime=1.1+Math.random()*2.5;actor.strafe*=-1;}
  if(hero){
   const cover=underPressure&&this.findCover(actor,target);
   if(cover&&Math.hypot(actor.pos.x-cover.x,actor.pos.z-cover.z)>.7){const q=Math.hypot(cover.x-actor.pos.x,cover.z-actor.pos.z)||1;vx=(cover.x-actor.pos.x)/q;vz=(cover.z-actor.pos.z)/q;}
   else{if(d<7.3){vx-=dx*.85;vz-=dz*.85;}else if(d>15){vx+=dx*.80;vz+=dz*.80;} vx+=-dz*actor.strafe*.65;vz+=dx*actor.strafe*.65;}
  }else{
   if(d>11){vx+=dx;vz+=dz;}else if(d<6.8){vx-=dx*.50;vz-=dz*.50;}
   vx+=-dz*actor.strafe*.22;vz+=dx*actor.strafe*.22;
  }
  const l=Math.hypot(vx,vz),s=hero?actor.stats.speed:actor.stats.speed*.80;
  const moved=l>.01&&this.move(actor,vx/l*s,vz/l*s,dt);
  const clip=moved?(hero?'Running':'Walking'):'Idle';
  if(actor.anim){if(actor.anim.clip!==clip)actor.anim.setClip(clip);actor.anim.rifleAim=hero?.94:.8;actor.anim.speed=hero?1.25:1;}
 }
 shoot(actor,target){if(actor.dead||target.dead)return;const range=distance(actor,target);if(range>actor.stats.range)return;
  if(actor.reload>0||actor.nextFire>0)return;
  if(actor.ammo<=0){actor.reload=actor.type==='player'?(this.mode==='elite'?.64:1.40):2.35;return;}
  actor.nextFire=actor.stats.interval*(.93+Math.random()*.15);actor.ammo--;this.shots+=actor.type==='player'?1:0;
  // Visible tracer. Accuracy is resolved separately from this flight visual.
  const hitRoll=Math.random()<actor.stats.accuracy, dodge=Math.random()<target.stats.dodge;
  const spread=hitRoll?.20:2.2;
  const jitter=(Math.random()-.5)*spread;
  const aimx=target.pos.x+jitter,aimz=target.pos.z+(Math.random()-.5)*spread;
  let bx=aimx,bz=aimz,impact=false,hit=false;
  const cover=firstCoverHit(actor.pos.x,actor.pos.z,aimx,aimz);
  if(cover){bx=cover.x;bz=cover.z;impact=true;}
  else if(hitRoll&&!dodge&&Math.hypot(aimx-target.pos.x,aimz-target.pos.z)<.52){hit=true;impact=true;}
  else{const d=Math.hypot(bx-actor.pos.x,bz-actor.pos.z)||1;bx=actor.pos.x+(bx-actor.pos.x)/d*Math.min(actor.stats.range,d+4);bz=actor.pos.z+(bz-actor.pos.z)/d*Math.min(actor.stats.range,d+4);}
  const dirx=Math.sin(actor.angle),dirz=Math.cos(actor.angle);
  this.tracers.push({ax:actor.pos.x+dirx*.72,az:actor.pos.z+dirz*.72,bx,bz,ttl:.18,life:.18,team:actor.type});
  if(impact)this.effects.push({x:bx,z:bz,life:.29,ttl:.29,hit});
  actor.shotUntil=this.time*1000+95;
  this.onShot?.(actor.type);
  if(hit){target.hp=Math.max(0,target.hp-actor.stats.damage);if(actor.type==='player')this.hits++;
   if(target.hp<=0){target.dead=true;target.deadAt=this.time;target.anim?.setClip(target.anim.hasClip('Dead')?'Dead':target.anim.hasClip('Knock_Down')?'Knock_Down':'Idle');if(target.anim)target.anim.rifleAim=0;
    if(target.type==='enemy'){this.kills++;this.onKill?.(this.kills);}else{this.finish('失敗');}
   }
  }
 }
 finish(text){if(this.ended)return;this.ended=true;this.result=text;this.onEnd?.(text);}
 update(dt){if(this.ended)return;dt=clamp(dt,0,.050);this.time+=dt;this.wave=Math.min(9,1+Math.floor(this.time/22));
  if(this.time>=150){this.finish('生存成功');return;}
  const maxAlive=Math.min(34,5+(this.wave-1)*5);
  this.spawnBudget+=dt*(1.25+this.wave*.65);
  // Remove old bodies after 4 seconds; allow new enemies, not unbounded GPU actors.
  this.enemies=this.enemies.filter(e=>!e.dead||this.time-e.deadAt<4);
  let alive=this.enemies.filter(e=>!e.dead).length;
  while(this.spawnBudget>=1&&alive<maxAlive){this.spawnBudget--;this.spawnEnemy();alive++;}
  this.spawnBudget=Math.min(this.spawnBudget,5);
  const list=this.enemies.filter(e=>!e.dead);
  const nearest=list.reduce((a,b)=>!a||distance(this.player,b)<distance(this.player,a)?b:a,null);
  const actors=[this.player,...this.enemies];
  for(const a of actors){if(a.dead){a.anim?.evaluate(dt);continue;}
   a.nextFire=Math.max(0,a.nextFire-dt);if(a.reload>0){a.reload=Math.max(0,a.reload-dt);if(a.reload===0)a.ammo=a.clip;}
   const target=a.type==='player'?nearest:this.player;
   if(target&&!target.dead){this.walkAndAnimate(a,target,dt,a.type==='player');
    // All enemies use line-of-sight. Avoid invisible bullets through barricades.
    this.shoot(a,target);
   }else if(a.anim){a.anim.rifleAim=.9;}
   a.anim?.evaluate(dt);
  }
  for(const t of this.tracers)t.ttl-=dt;this.tracers=this.tracers.filter(t=>t.ttl>0);
  for(const e of this.effects)e.ttl-=dt;this.effects=this.effects.filter(e=>e.ttl>0);
 }
}
