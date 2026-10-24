import {CAMP,BUILDINGS,FEATURES} from '../map/camp.js?v=060';
const canvas=document.getElementById('miniCanvas'),ctx=canvas?.getContext('2d');
const W=canvas?.width||224,H=canvas?.height||224,CX=W/2,CY=H/2,S=(W*.47)/17;
function xy(x,z,player,angle){const dx=x-player.x,dz=z-player.z,c=Math.cos(angle),s=Math.sin(angle);return [CX+(dx*c-dz*s)*S,CY-(dx*s+dz*c)*S]}
function rect(x,z,w,d,color,p,a){const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];ctx.beginPath();corners.forEach(([dx,dz],i)=>{const [xx,yy]=xy(x+dx,z+dz,p,a);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});ctx.closePath();ctx.fillStyle=color;ctx.fill()}
function dot(x,z,r,color,p,a){const [xx,yy]=xy(x,z,p,a);ctx.beginPath();ctx.arc(xx,yy,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
export function drawMinimap(player,enemy=null,dead=false,heading=0){
 if(!ctx||![player.x,player.z,heading].every(Number.isFinite))return;
 ctx.clearRect(0,0,W,H);ctx.save();ctx.beginPath();ctx.arc(CX,CY,W*.49,0,Math.PI*2);ctx.clip();ctx.fillStyle='#aac29f';ctx.fillRect(0,0,W,H);
 rect(0,0,CAMP.width,CAMP.depth,'#afc6a4',player,heading);
 for(const [x,z,w,d] of [[0,0,3.9,49],[0,2,57,3.65],[0,-11.4,55,3.55],[0,11.65,55,3.4],[-17,0,3.2,45],[15.1,0,3.2,44]])rect(x,z,w,d,'#eee4ca',player,heading);
 rect(0,1,13.9,9.5,'#d7c9a7',player,heading);
 for(const b of BUILDINGS)rect(b.x,b.z,b.w,b.d,'#506d58',player,heading);
 for(const f of FEATURES)dot(f.x,f.z,2.3,f.color,player,heading);
 if(enemy&&!dead)dot(enemy.x,enemy.z,5,'#d85f59',player,heading);
 ctx.restore();ctx.save();ctx.translate(CX,CY);ctx.shadowColor='#23413699';ctx.shadowBlur=5;ctx.fillStyle='#fffefa';ctx.strokeStyle='#315d4d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(8,9);ctx.lineTo(0,4);ctx.lineTo(-8,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
