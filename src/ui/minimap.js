// 北方固定朝上的軍營小地圖：地圖只平移，只有角色的方向標記會旋轉。
// Keep world axes fixed (world +Z at top), and center the player every frame.
import {CAMP,BUILDINGS,FEATURES} from '../map/camp.js?v=060';
const canvas=document.getElementById('miniCanvas'),ctx=canvas?.getContext('2d');
const W=canvas?.width||224,H=canvas?.height||224,CX=W/2,CY=H/2,S=(W*.47)/17;
function xy(x,z,player){return [CX+(x-player.x)*S,CY-(z-player.z)*S]}
function rect(x,z,w,d,color,p){
 const corners=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]];
 ctx.beginPath();corners.forEach(([dx,dz],i)=>{const [xx,yy]=xy(x+dx,z+dz,p);i?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)});
 ctx.closePath();ctx.fillStyle=color;ctx.fill();
}
function dot(x,z,r,color,p){const [xx,yy]=xy(x,z,p);ctx.beginPath();ctx.arc(xx,yy,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
export function drawMinimap(player,enemy=null,dead=false,heading=0){
 if(!ctx||![player.x,player.z,heading].every(Number.isFinite))return;
 ctx.clearRect(0,0,W,H);
 ctx.save();ctx.beginPath();ctx.arc(CX,CY,W*.49,0,Math.PI*2);ctx.clip();
 ctx.fillStyle='#aac29f';ctx.fillRect(0,0,W,H);
 rect(0,0,CAMP.width,CAMP.depth,'#afc6a4',player);
 for(const [x,z,w,d] of [[0,0,3.9,49],[0,2,57,3.65],[0,-11.4,55,3.55],[0,11.65,55,3.4],[-17,0,3.2,45],[15.1,0,3.2,44]])rect(x,z,w,d,'#eee4ca',player);
 rect(0,1,13.9,9.5,'#d7c9a7',player);
 for(const b of BUILDINGS)rect(b.x,b.z,b.w,b.d,'#506d58',player);
 for(const f of FEATURES)dot(f.x,f.z,2.3,f.color,player);
 if(enemy&&!dead)dot(enemy.x,enemy.z,5,'#d85f59',player);
 ctx.restore();
 // Google Maps-style player locator. Only this marker turns with the soldier.
 // heading=0: world +Z (up on map), PI/2: world +X (right on map).
 ctx.save();ctx.translate(CX,CY);ctx.rotate(heading);
 // Pale blue field-of-view cone behind the player dot.
 ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,32,-Math.PI/2-.40,-Math.PI/2+.40);ctx.closePath();
 ctx.fillStyle='rgba(56,148,245,.24)';ctx.fill();
 // Orientation arrow protrudes ahead of the blue location dot.
 ctx.beginPath();ctx.moveTo(0,-19);ctx.lineTo(7,-5);ctx.lineTo(0,-7);ctx.lineTo(-7,-5);ctx.closePath();
 ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#fff';ctx.stroke();ctx.fillStyle='#1679ea';ctx.fill();
 ctx.beginPath();ctx.arc(0,0,7.3,0,Math.PI*2);
 ctx.fillStyle='#1679ea';ctx.fill();ctx.lineWidth=2.8;ctx.strokeStyle='#fff';ctx.stroke();
 ctx.restore();
 // Small static N makes the fixed north-up orientation obvious.
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 11px system-ui, sans-serif';
 ctx.lineWidth=2;ctx.strokeStyle='#eaf4dd';ctx.fillStyle='#315e4c';ctx.strokeText('N',CX,13);ctx.fillText('N',CX,13);ctx.restore();
}
