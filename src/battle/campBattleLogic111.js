// Shared collision/LOS helpers; preserve original camp collision instead of introducing new arena geometry.
export function rayHitsBox(ax,az,bx,bz,cx,cz,hx,hz,yaw=0){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 const tx=ax-cx,tz=az-cz,ux=bx-cx,uz=bz-cz;
 const x0=tx*c-tz*s,z0=tx*s+tz*c,x1=ux*c-uz*s,z1=ux*s+uz*c;
 let enter=0,leave=1;
 for(const [p,d,h] of [[x0,x1-x0,hx],[z0,z1-z0,hz]]){
  if(Math.abs(d)<1e-7){if(Math.abs(p)>h)return false;continue}
  const t1=(-h-p)/d,t2=(h-p)/d;
  enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));if(enter>leave)return false;
 }
 return leave>=0&&enter<=1;
}
export function visibleShot(start,end,buildings,props){
 for(const b of buildings){if(rayHitsBox(start.x,start.z,end.x,end.z,b.x,b.z,b.w*.47,b.d*.47,0))return false}
 for(const p of props){
  let hx,hz;
  switch(p.type){
   case 'crate':case 'grenadeCrate':hx=.36;hz=.34;break;
   case 'sandbag':hx=.49;hz=.23;break;
   case 'podium':hx=1.04;hz=.65;break;
   default:continue;
  }
  if(rayHitsBox(start.x,start.z,end.x,end.z,p.x,p.z,hx,hz,p.yaw||0))return false;
 }
 return true;
}
export function nearestEnemy(player,enemies,range,buildings,props){
 let best=null,bestD=range*range;
 for(const e of enemies){if(e.hp<=0)continue;const dx=e.pos.x-player.pos.x,dz=e.pos.z-player.pos.z,d=dx*dx+dz*dz;
  if(d<bestD && visibleShot(player.pos,e.pos,buildings,props)){best=e;bestD=d}
 }
 return best;
}
