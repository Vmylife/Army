// Army v0.10.6 — practical camp life routines for the already-present 14 NPCs.
// No random walk / no new models. Uses existing green cadet, rig clips,
// same building+prop collision as the player, and the approved v0.10.5 layout.
import {RigAnimator} from '../characters/rigAnimator.js?v=084';
import {updateRangeShooter} from '../battle/rangeTraining.js?v=084';
import {moveWithPropCollision} from '../map/propCollision105.js?v=105';

const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const W=(x,z)=>({x,z});

// These points are WORLD coordinates from the finalized v0.10.3 / v0.10.5 camp:
// track -21,-1; assembly 15,-8.2; barracks entrance -37,1.65;
// gym 20,-16; target line z=16.8; canteen entrance 33.4,-2.6.
const RUN={cx:-21.4,cz:-1.9,rx:5.7,rz:8.0,rate:.245};
const assemblySlots=[W(13.5,-8.2),W(15.4,-8.2),W(17.3,-8.2)];
const relaxSlots=[W(13.4,-5.9),W(15.4,-6.0),W(17.5,-5.9)];
const chatNear=[W(-35.0,3.8),W(-32.7,3.8)];
const chatFar=[W(-35.0,6.1),W(-32.7,6.1)];
const gymSlots=[W(17.3,-14.6),W(22.4,-14.6)];
const CANTEEN_ROUTE=[W(0,-13.2),W(0,-10.0),W(0,-6.8),W(0,-3.4),W(7.0,-3.4),W(17.0,-3.4),W(26.7,-3.4),W(29.2,-3.2),W(32.9,-2.7)];
const RANGE_SLOTS=[W(5.5,16.8),W(12.3,16.8)];

function trackPoint(angle){return W(RUN.cx+Math.cos(angle)*RUN.rx,RUN.cz+Math.sin(angle)*RUN.rz);}
function chooseClip(a,names){for(const name of names)if(a.hasClip(name))return name;return 'Idle';}
function setPose(n,clip,speed=1){if(n.anim.clip!==clip)n.anim.setClip(clip);n.anim.speed=speed;}
function turnToward(n,x,z,dt){
 const theta=Math.atan2(x,z);
 const delta=Math.atan2(Math.sin(theta-n.angle),Math.cos(theta-n.angle));
 n.angle+=delta*(1-Math.exp(-12*dt));
}
function lookAt(n,p,dt){const dx=p.x-n.pos.x,dz=p.z-n.pos.z;if(Math.hypot(dx,dz)>.1)turnToward(n,dx,dz,dt);}
function rest(n,clip='Idle',direction=null,dt=0){
 n.state='pause';setPose(n,clip);
 if(direction!==null){const delta=Math.atan2(Math.sin(direction-n.angle),Math.cos(direction-n.angle));n.angle+=delta*(1-Math.exp(-8*dt));}
}
function moveTo(n,target,dt,speed=1.4,clip='Walking'){
 const dx=target.x-n.pos.x,dz=target.z-n.pos.z,d=Math.hypot(dx,dz);
 if(d<.14){n.stuck=0;n.detour=0;return true;}
 const vx=dx/d,vz=dz/d,step=Math.min(d,speed*dt),was=n.pos;
 let next=moveWithPropCollision(was,vx*step,vz*step);
 let advanced=Math.hypot(next.x-was.x,next.z-was.z);
 if(advanced<step*.16){
  n.stuck+=dt;
  // Follow the edge of an obstacle instead of running against an invisible wall.
  // Alternate sides if the first edge is closed. No teleporting through props.
  const side=(Math.floor(n.stuck/1.8)%2===0?1:-1);
  const sidestep=moveWithPropCollision(was,-vz*step*side,vx*step*side);
  const sideDistance=Math.hypot(sidestep.x-was.x,sidestep.z-was.z);
  if(sideDistance>advanced){next=sidestep;advanced=sideDistance;}
 } else n.stuck=Math.max(0,n.stuck-dt*3);
 if(advanced>.0001){n.pos=next;turnToward(n,next.x-was.x,next.z-was.z,dt);n.state='move';setPose(n,clip,clip==='Running'?1.15:1);}
 else {n.state='pause';setPose(n,'Idle');}
 return dist(n.pos,target)<.18;
}

// Each member runs the SAME oval, following the leader with small phase offsets.
function updateRunner(n,dt){
 n.timer+=dt;
 const takingBreak=n.timer%86>=69;
 if(takingBreak){rest(n,'Idle',null,dt);n.activity='操場休息';return;}
 n.phase+=RUN.rate*dt;
 const destination=trackPoint(n.phase+.16);
 moveTo(n,destination,dt,2.06,'Running');
 n.activity='操場跑圈';
}
function updateAssembly(n,dt){
 n.timer+=dt;
 const t=n.timer%69;
 const gather=t<38||t>=56;
 const slot=gather?assemblySlots[n.slot]:relaxSlots[n.slot];
 const arrived=moveTo(n,slot,dt,gather?1.6:1.13,'Walking');
 if(arrived){
  // Face the same direction when lined up; otherwise turn toward teammates.
  rest(n,'Idle',gather? -Math.PI/2 : Math.PI,dt);
 }
 n.activity=gather?(arrived?'集合列隊':'前往集合'):(arrived?'解散休息':'解散移動');
}
function updateChat(n,partner,dt){
 n.timer+=dt;
 const t=n.timer%64;
 const position=t>=27&&t<49?chatFar[n.slot]:chatNear[n.slot];
 const arrived=moveTo(n,position,dt,1.1,'Walking');
 if(arrived){
  rest(n,'Idle');
  // Face the other recruit while talking, not an arbitrary road direction.
  if(partner)lookAt(n,partner.pos,dt);
 }
 n.activity=arrived?'同梯聊天':'去找同梯';
}
function updateGym(n,dt){
 n.timer+=dt;
 const t=(n.timer+n.slot*7)%39;
 const target=t>=29?W(gymSlots[n.slot].x+1.0,gymSlots[n.slot].z+1.0):gymSlots[n.slot];
 const arrived=moveTo(n,target,dt,1.0,'Walking');
 if(!arrived){n.activity='前往訓練';return;}
 if(t<21){
  const clips=n.slot===0?['push_up','Push_Up','Idle']:['situps','Situps','Idle'];
  setPose(n,chooseClip(n.anim,clips),1.0);
  n.state='train';n.activity=n.slot===0?'伏地挺身':'仰臥起坐';
 }else{rest(n,'Idle',null,dt);n.activity='體能休息';}
}
function updateCourier(n,dt){
 const path=n.reverse?[...CANTEEN_ROUTE].reverse():CANTEEN_ROUTE;
 if(n.wait>0){
  n.wait-=dt;rest(n,'Idle',null,dt);
  n.activity=n.reverse?'餐廳門口等待':'哨口待命';
  if(n.wait<=0){n.reverse=!n.reverse;n.wp=1;}
  return;
 }
 const target=path[Math.min(n.wp,path.length-1)];
 const reached=moveTo(n,target,dt,1.55,'Walking');
 n.activity=n.reverse?'返回哨口':'前往餐廳';
 if(reached){
  if(n.wp>=path.length-1){n.wait=n.reverse?8:11;n.wp=0;}
  else n.wp++;
 }else if(n.stuck>5.5){
  // In the event of an edited object blocking a waypoint, skip it only if
  // the following waypoint is closer. Never teleport or force through walls.
  const following=path[Math.min(n.wp+1,path.length-1)];
  if(dist(n.pos,following)+.5<dist(n.pos,target)&&n.wp<path.length-1)n.wp++;
  n.stuck=1;
 }
}

export function createCampNPCs(glb){
 const npcs=[];
 for(let id=0;id<14;id++){
  const anim=new RigAnimator(glb);anim.setClip('Idle');anim.evaluate(0);
  let job,slot=0,pos;
  if(id<4){job='run';slot=id;pos=trackPoint(.20-id*.24);}
  else if(id<7){job='assembly';slot=id-4;pos=W(8.5+slot*.85,-8.2);}
  else if(id<9){job='chat';slot=id-7;pos=W(chatNear[slot].x+slot*.15,chatNear[slot].z);}
  else if(id<11){job='train';slot=id-9;pos=W(gymSlots[slot].x+.65,gymSlots[slot].z+1.15);}
  else if(id<13){job='shoot';slot=id-11;pos={...RANGE_SLOTS[slot]};}
  else{job='courier';pos={...CANTEEN_ROUTE[0]};}
  // home.job is kept because the existing 3D renderer adds rifles to shooters.
  npcs.push({pos,angle:0,anim,home:{job,x:pos.x,z:pos.z},slot,id,
   state:'pause',activity:'',timer:id<7?0:slot*.35,phase:.20-id*.24,seed:id*19+7,
   stuck:0,wait:0,wp:1,reverse:false,shotPending:false});
 }
 return npcs;
}

export function updateCampNPCs(npcs,dt,now,playerPos){
 // dt is seconds; advance movement every frame, not only at think intervals.
 if(!Number.isFinite(dt)||dt<0)return;
 dt=clamp(dt,0,.05);
 for(const n of npcs){
  switch(n.home.job){
   case 'run':updateRunner(n,dt);break;
   case 'assembly':updateAssembly(n,dt);break;
   case 'chat':updateChat(n,npcs[n.slot===0?8:7],dt);break;
   case 'train':updateGym(n,dt);break;
   case 'courier':updateCourier(n,dt);break;
   case 'shoot':updateRangeShooter(n,now);n.activity='靶場射擊';break;
  }
 }
}

export const NPC_LIFE_VERSION='0.10.6';
