// Player-centered, heading-up minimap. Rotate *the world*, not the player arrow.
// Drawing shares camp coordinates with 3D; no DOM rotate transforms are needed.
import {CAMP,BUILDINGS,FEATURES} from '../map/camp.js?v=050';
const canvas=document.getElementById('miniCanvas');
const ctx=canvas?.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const w=canvas?.width||224,h=canvas?.height||224;
const center={x:w/2,y:h/2};
const worldPerRadius=18.5;  // approximately 37 world units across radar diameter
const scale=(w*.48)/worldPerRadius;
function transform(x,z,player,ang){
 const dx=x-player.x,dz=z-player.z,c=Math.cos(ang),s=Math.sin(ang);
 return {x:center.x+(dx*c-dz*s)*scale, y:center.y-(dx*s+dz*c)*scale};
}
function rect(x,z,rw,rd,color,player,ang){
 const corners=[[-rw/2,-rd/2],[rw/2,-rd/2],[rw/2,rd/2],[-rw/2,rd/2]];
 ctx.fillStyle=color;ctx.beginPath();
 corners.forEach(([dx,dz],i)=>{const t=transform(x+dx,z+dz,player,ang);i?ctx.lineTo(t.x,t.y):ctx.moveTo(t.x,t.y)});
 ctx.closePath();ctx.fill();
}
function circle(x,z,r,color,player,ang){
 const pt=transform(x,z,player,ang);
 ctx.beginPath();ctx.arc(pt.x,pt.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
}
export function drawMinimap(player,enemy,enemyDead=false,heading=0){
 if(!ctx||!Number.isFinite(heading)||!Number.isFinite(player.x)||!Number.isFinite(player.z))return;
 const angle=heading;
 ctx.clearRect(0,0,w,h);
 ctx.save();
 // Radar must not paint outside its circular silhouette.
 ctx.beginPath();ctx.arc(center.x,center.y,w*.485,0,Math.PI*2);ctx.clip();
 ctx.fillStyle='#aec4a2';ctx.fillRect(0,0,w,h);
 // world floor, roads, important areas, buildings, markers all rotate with character.
 rect(0,0,CAMP.width,CAMP.depth,'#b1c6a5',player,angle);
 for(const [x,z,rw,rd] of [[0,0,3.9,49],[0,2,57,3.65],[0,-11.4,55,3.55],[0,11.65,55,3.4],[-17,0,3.2,45],[15.1,0,3.2,44],[-28.4,-4.2,2,19]])rect(x,z,rw,rd,'#efe4c9',player,angle);
 rect(0,1,13.9,9.5,'#dfd2b1',player,angle);
 rect(21,14.3,18.1,15.4,'#a7b991',player,angle);
 rect(23,-17.8,14.6,8,'#b9b29b',player,angle);
 rect(22,.1,12.1,7.9,'#b0b8a0',player,angle);
 for(const b of BUILDINGS)rect(b.x,b.z,b.w,b.d,'#536e5a',player,angle);
 for(const f of FEATURES)circle(f.x,f.z,3.2,f.color,player,angle);
 if(!enemyDead&&enemy) {circle(enemy.x,enemy.z,5,'#cf5752',player,angle);const e=transform(enemy.x,enemy.z,player,angle);ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(e.x,e.y,5,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
 // Fixed north indicator shows the player's bearing without rotating the avatar icon.
 // Arrow always points to screen top; the camp rotates around it.
 ctx.save();ctx.translate(center.x,center.y);
 ctx.shadowColor='#142b24a8';ctx.shadowBlur=5;ctx.shadowOffsetY=2;
 ctx.fillStyle='#ffffff';ctx.strokeStyle='#274a3c';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(0,-13);ctx.lineTo(8,9);ctx.lineTo(0,5);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.restore();
 ctx.beginPath();ctx.arc(center.x,center.y,w*.48,0,Math.PI*2);ctx.lineWidth=3;ctx.strokeStyle='#f8f5d6';ctx.stroke();
}
