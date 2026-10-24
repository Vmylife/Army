import {CAMP,BUILDINGS,FEATURES} from '../map/camp.js?v=050';
const canvas=document.getElementById('miniCanvas');
const box=document.getElementById('minimap');
const toggle=document.getElementById('mapToggle');
const ctx=canvas?.getContext('2d');
let hidden=false;
toggle?.addEventListener('click',()=>{hidden=!hidden;box?.classList.toggle('collapsed',hidden);toggle.textContent=hidden?'展開':'收合'});
function px(x){return (x-CAMP.bounds.left)/(CAMP.bounds.right-CAMP.bounds.left)*canvas.width}
function py(z){return (z-CAMP.bounds.top)/(CAMP.bounds.bottom-CAMP.bounds.top)*canvas.height}
function square(x,z,w,d,color){ctx.fillStyle=color;ctx.fillRect(px(x-w/2),py(z-d/2),px(x+w/2)-px(x-w/2),py(z+d/2)-py(z-d/2))}
export function drawMinimap(player,enemy,enemyDead=false){
 if(!ctx||hidden)return;
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#b7c7a8';ctx.fillRect(0,0,w,h);
 // The map and the WebGL world share the same coordinate data.
 for(const [x,z,ww,dd] of [[0,0,3.9,49],[0,2,57,3.65],[0,-11.4,55,3.55],[0,11.65,55,3.4],[-17,0,3.2,45],[15.1,0,3.2,44],[-28.4,-4.2,2,19]])square(x,z,ww,dd,'#f5e8cb');
 square(0,1,13.9,9.5,'#e5d5b8');square(21,14.3,18.1,15.4,'#b0b990');square(23,-17.8,14.6,8,'#c6c29d');square(22,.1,12.1,7.9,'#bbc3a0');
 for(const b of BUILDINGS)square(b.x,b.z,b.w,b.d,'#536f61');
 for(const f of FEATURES){ctx.fillStyle=f.color;ctx.beginPath();ctx.arc(px(f.x),py(f.z),3.3,0,Math.PI*2);ctx.fill();}
 if(!enemyDead){ctx.fillStyle='#b84449';ctx.beginPath();ctx.arc(px(enemy.x),py(enemy.z),5.0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='white';ctx.lineWidth=1;ctx.stroke()}
 ctx.fillStyle='#223f42';ctx.beginPath();ctx.arc(px(player.x),py(player.z),6.4,0,Math.PI*2);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
 ctx.fillStyle='#254836';ctx.font='bold 12px system-ui';ctx.fillText('N',w-15,16);
}
