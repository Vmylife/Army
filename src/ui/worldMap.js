// Full-camp north-up map. UI-only: never changes player position or the WebGL scene.
import {CAMP,BUILDINGS,FEATURES} from '../map/camp.js?v=060';
const ROADS=[[0,0,3.9,49],[0,2,57,3.65],[0,-11.4,55,3.55],[0,11.65,55,3.4],[-17,0,3.2,45],[15.1,0,3.2,44],[-28.4,-4.2,2,19]];

function roundBox(ctx,x,y,w,h,r){
 const rad=Math.min(r,w/2,h/2);
 ctx.beginPath();ctx.moveTo(x+rad,y);ctx.arcTo(x+w,y,x+w,y+h,rad);
 ctx.arcTo(x+w,y+h,x,y+h,rad);ctx.arcTo(x,y+h,x,y,rad);
 ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();
}
function playerMarker(ctx,x,y,heading){
 ctx.save();ctx.translate(x,y);ctx.rotate(heading);
 ctx.fillStyle='rgba(35,140,244,.23)';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,36,-Math.PI/2-.47,-Math.PI/2+.47);ctx.closePath();ctx.fill();
 ctx.shadowColor='#205b97aa';ctx.shadowBlur=6;
 ctx.fillStyle='#147cf4';ctx.strokeStyle='white';ctx.lineWidth=3.3;
 ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(8,-3);ctx.lineTo(0,-6);ctx.lineTo(-8,-3);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.arc(0,0,6.5,0,2*Math.PI);ctx.fill();ctx.stroke();
 ctx.restore();
}
function render(canvas,player,enemy,heading){
 const c=canvas.getContext('2d');if(!c)return;
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);
 c.fillStyle='#b7cda9';c.fillRect(0,0,w,h);
 const scale=Math.min((w-24)/(CAMP.width+2),(h-26)/(CAMP.depth+2));
 const px=x=>w/2+x*scale,py=z=>h/2-z*scale;
 const rect=(x,z,rw,rd,fill)=>{c.fillStyle=fill;c.fillRect(px(x-rw/2),py(z+rd/2),rw*scale,rd*scale)};
 const point=(x,z,r,fill)=>{c.beginPath();c.arc(px(x),py(z),r,0,2*Math.PI);c.fillStyle=fill;c.fill()};
 // Display the world outline, paths, facilities and buildings at their true locations.
 rect(0,0,CAMP.width,CAMP.depth,'#a9c49d');
 for(const [x,z,rw,rd] of ROADS)rect(x,z,rw,rd,'#eae0c5');
 rect(0,1,13.9,9.5,'#d8c9a9');
 rect(21,14.3,18.1,15.4,'#9cbd8c');
 rect(23,-17.8,14.6,8,'#c4bb96');
 rect(22,.1,12.1,7.9,'#acb5a3');
 for(const b of BUILDINGS){
  rect(b.x,b.z,b.w,b.d,'#516e5b');
  c.fillStyle='#e9f1df';c.font=`600 ${Math.max(9,Math.min(12,scale*1.5))}px system-ui,sans-serif`;
  c.textAlign='center';c.textBaseline='middle';
  if(scale>6.8){const label=b.label.replace('辦公室','').replace('寢室','');c.fillText(label,px(b.x),py(b.z),b.w*scale-4)}
 }
 // Marker labels are located near each feature. Collision avoidance keeps this readable on phones.
 const placed=[];const fontSize=Math.min(12,Math.max(10,scale*1.55));
 c.font=`600 ${fontSize}px system-ui, sans-serif`;
 for(const feature of FEATURES){
  const x=px(feature.x),y=py(feature.z),radius=Math.max(3,Math.min(5,scale*.65));
  point(feature.x,feature.z,radius,feature.color);
  c.strokeStyle='#fffaf0';c.lineWidth=1.6;c.beginPath();c.arc(x,y,radius,0,2*Math.PI);c.stroke();
  let name=feature.short||feature.label;
  const width=c.measureText(name).width+10,height=fontSize+7;
  const offsets=[[9,-height-2],[9,4],[-width-9,-height-2],[-width-9,4],[0,-height-10],[0,9]];
  let label=null;
  for(const [ox,oy] of offsets){let lx=x+ox,ly=y+oy;
   if(lx<3||lx+width>w-3||ly<3||ly+height>h-3)continue;
   if(placed.every(p=>lx+width+3<p.x||lx>p.x+p.w+3||ly+height+2<p.y||ly>p.y+p.h+2)){
    label={x:lx,y:ly,w:width,h:height};break;
   }
  }
  if(!label)continue;
  placed.push(label);
  c.fillStyle='rgba(255,253,239,.91)';roundBox(c,label.x,label.y,label.w,label.h,4);c.fill();
  c.fillStyle='#315747';c.textAlign='left';c.textBaseline='middle';c.fillText(name,label.x+5,label.y+label.h/2);
 }
 if(enemy){point(enemy.x,enemy.z,6,'#d95954');c.beginPath();c.arc(px(enemy.x),py(enemy.z),6,0,2*Math.PI);c.lineWidth=2;c.strokeStyle='#fff';c.stroke()}
 playerMarker(c,px(player.x),py(player.z),heading);
 c.font='700 14px system-ui,sans-serif';c.textBaseline='top';c.textAlign='center';
 c.fillStyle='#345a49';c.fillText('N',w/2,9);
 c.strokeStyle='#446c56';c.lineWidth=1.5;c.strokeRect(px(-CAMP.width/2),py(CAMP.depth/2),CAMP.width*scale,CAMP.depth*scale);
}

export function initWorldMap(){
 const small=document.getElementById('minimap');
 const dialog=document.getElementById('worldMap');
 const close=document.getElementById('closeWorldMap');
 const canvas=document.getElementById('worldMapCanvas');
 const places=document.getElementById('worldMapPlaceList');
 // Static area legend; each marker corresponds to a real camp feature coordinate.
 if(places){for(const f of FEATURES){
  const item=document.createElement('div');item.className='world-map-place';
  const marker=document.createElement('i');marker.style.setProperty('--dot-color',f.color);
  const label=document.createElement('span');label.textContent=f.label;
  item.append(marker,label);places.appendChild(item);
 }}
 let location={...CAMP.spawn},enemy=null,heading=0;
 const isOpen=()=>!dialog.hidden;
 const paint=()=>{if(isOpen())render(canvas,location,enemy,heading)};
 const open=()=>{
  if(isOpen())return;
  window.dispatchEvent(new Event('army-map-open'));
  dialog.hidden=false;small.setAttribute('aria-expanded','true');
  requestAnimationFrame(paint);close.focus({preventScroll:true});
 };
 const hide=()=>{
  if(!isOpen())return;
  dialog.hidden=true;small.setAttribute('aria-expanded','false');small.focus({preventScroll:true});
 };
 small.setAttribute('aria-expanded','false');small.addEventListener('click',open);
 close.addEventListener('click',hide);
 dialog.addEventListener('click',e=>{if(e.target===dialog)hide()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.preventDefault();hide()}});
 window.addEventListener('resize',paint);
 return {isOpen,update(pos,foe,angle){location={...pos};enemy=foe?{...foe}:null;heading=angle;if(isOpen())paint()},open,close:hide};
}
