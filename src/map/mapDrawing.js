// Army v0.7.2 — ONE cartographic renderer shared by radar and full-camp map.
// Coordinates and colors come from camp.js. The world stays north-up.
import {CAMP,PERIMETER,ZONES,BUILDINGS,FEATURES} from './camp.js?v=072';
import {ROAD_EDGE_SHAPES,ROAD_FILL_SHAPES} from './roadMesh.js?v=071';
const PAL={barracks:'#88b38e',office:'#85b1cf',ammo:'#d29b96',chem:'#93b7b1',shop:'#c4bc69',canteen:'#e6c16c',wash:'#a5d6d8',medic:'#f5d3b3',armory:'#dec17d',visitor:'#a6c5e0',guard:'#afc3a5'};
function playerIcon(ctx,x,y,heading,scale=1){
 ctx.save();ctx.translate(x,y);ctx.rotate(heading);
 ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,27*scale,-Math.PI/2-.48,-Math.PI/2+.48);ctx.closePath();ctx.fillStyle='rgba(44,150,250,.22)';ctx.fill();
 ctx.beginPath();ctx.moveTo(0,-14*scale);ctx.lineTo(6.8*scale,-3*scale);ctx.lineTo(0,-6*scale);ctx.lineTo(-6.8*scale,-3*scale);ctx.closePath();ctx.fillStyle='#137ef1';ctx.strokeStyle='#fff';ctx.lineWidth=2.5*scale;ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.arc(0,0,6.8*scale,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
}
// The minimap is always player-centered: the icon stays at the center.
export function drawCampMap(ctx,{width,height,player,enemy=null,heading=0,mini=false}){
 if(!ctx||!player||![player.x,player.z,heading].every(Number.isFinite))return;
 const scale=mini?width/36.8:Math.min((width-18)/(CAMP.width+3),(height-20)/(CAMP.depth+5));
 const center=mini?player:{x:0,z:0};
 const px=x=>width/2+(x-center.x)*scale,py=z=>height/2-(z-center.z)*scale;
 const poly=(pts,fill,stroke,sw=1)=>{ctx.beginPath();pts.forEach(([x,z],i)=>i?ctx.lineTo(px(x),py(z)):ctx.moveTo(px(x),py(z)));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=sw;ctx.stroke()}};
 const rect=(x,z,w,d,color,border)=>{
  const a=px(x-w/2),b=py(z+d/2);
  ctx.fillStyle=color;ctx.fillRect(a,b,w*scale,d*scale);
  if(border){ctx.strokeStyle=border;ctx.lineWidth=1;ctx.strokeRect(a,b,w*scale,d*scale)}
 };
 const dot=(x,z,r,c)=>{ctx.beginPath();ctx.arc(px(x),py(z),r,0,2*Math.PI);ctx.fillStyle=c;ctx.fill()};
 ctx.clearRect(0,0,width,height);
 ctx.save();
 if(mini){ctx.beginPath();ctx.arc(width/2,height/2,width*.487,0,Math.PI*2);ctx.clip()}
 ctx.fillStyle='#e9e6d6';ctx.fillRect(0,0,width,height);
 poly(PERIMETER,'#aec79d','#435c4c',Math.max(1.1,scale*.24));
 // Foothills on the northern boundary are part of the plan.
 ctx.beginPath();ctx.moveTo(px(-13),py(25));ctx.bezierCurveTo(px(-4),py(28),px(3),py(25),px(10),py(27));ctx.lineTo(px(21),py(24));ctx.strokeStyle='#799477';ctx.lineWidth=mini?1.5:2;ctx.stroke();
 // Drill field, shooting range and combat training are outdoor colored zones.
 for(const z of ZONES){ctx.fillStyle=z.color;ctx.strokeStyle='#7b846c';ctx.lineWidth=Math.max(.8,scale*.13);
  if(z.kind==='ellipse'){ctx.beginPath();ctx.ellipse(px(z.x),py(z.z),z.w/2*scale,z.d/2*scale,0,0,Math.PI*2);ctx.fill();ctx.stroke()}
  else if(z.kind==='rect')rect(z.x,z.z,z.w,z.d,z.color,'#9c9379');
  else if(z.kind==='poly')poly(z.points,z.color,null)
 }
 // Pre-merged continuous roads: no overlapping circles or disconnected-looking seams.
 const paintRoadShapes=(polygons,color)=>{
  ctx.beginPath();
  for(const polygon of polygons)for(const ring of polygon)ring.forEach(([x,z],i)=>i?ctx.lineTo(px(x),py(z)):ctx.moveTo(px(x),py(z)));
  ctx.fillStyle=color;ctx.fill('evenodd');
 };
 paintRoadShapes(ROAD_EDGE_SHAPES,'#aaa28f');
 paintRoadShapes(ROAD_FILL_SHAPES,'#eee6d2');
 // Rifle targets and obstacle tracks have meaningful landmarks in the map too.
 for(let k=0;k<6;k++)rect(2.1+k*3.4,22.0,.9,.45,'#4e5f53');
 for(let k=0;k<5;k++){
  const y=py(8.1+k*.71);ctx.beginPath();ctx.moveTo(px(1),y);ctx.lineTo(px(22.4),y);ctx.strokeStyle='#fff9dd';ctx.lineWidth=Math.max(.7,scale*.06);ctx.stroke();
 }
 rect(-21,6.8,2.5,2,'#ae683c'); // command stand
 // Distinct buildings, outlines, simple rooftop details.
 for(const b of BUILDINGS){const color=PAL[b.kind]||'#789e82';rect(b.x,b.z,b.w,b.d,color,'#4c6254');
  if(b.kind==='medic'&&!mini){ctx.strokeStyle='#c84845';ctx.lineWidth=Math.max(2,scale*.5);ctx.beginPath();ctx.moveTo(px(b.x)-6,py(b.z));ctx.lineTo(px(b.x)+6,py(b.z));ctx.moveTo(px(b.x),py(b.z)-6);ctx.lineTo(px(b.x),py(b.z)+6);ctx.stroke()}
  if(b.kind==='barracks'){ctx.fillStyle='#f4ebd5';ctx.fillRect(px(b.x+b.w/2)-.3,py(b.z+b.d/2)+1,Math.max(1,scale*.22),b.d*scale-2)}
  if(b.kind==='canteen'&&!mini){ctx.fillStyle='#b98d4c';ctx.fillRect(px(b.x-b.w/2)-2,py(b.z+b.d/2),2,b.d*scale)}
 }
 // Features mark access points outside building colliders; all can be reached on foot.
 for(const f of FEATURES)dot(f.x,f.z,mini?2.3:Math.max(2.6,scale*.36),f.color);
 if(!mini){
  // Centered primary labels, with surrounding detail available in the list below.
  const names=[['營舍',-39,-3],['大操場',-21,1],['投擲場',-21,-11],['中山室',-20,15],['靶場',11,20],['500公尺障礙場',12,10],['單戰場',12,4],['連隊集合場',15,-8],['毒氣室',23,3],['營站',34,7.6],['餐廳',37,-2.6],['洗碗區',43,-4],['醫務所',31.5,-12.3],['軍械室',7,-16.2],['會客室',-5,-15.8],['體能場',20,-16.2]];
  for(const [name,x,z] of names){const size=Math.max(8,Math.min(12,scale*1.42));ctx.font=`700 ${size}px system-ui,"PingFang TC",sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=2.9;ctx.strokeStyle='#fff9e9';ctx.strokeText(name,px(x),py(z));ctx.fillStyle='#344c3b';ctx.fillText(name,px(x),py(z))}
 }
 if(enemy){dot(enemy.x,enemy.z,mini?4.3:5,'#d45457');ctx.strokeStyle='#fff';ctx.lineWidth=1.6;ctx.beginPath();ctx.arc(px(enemy.x),py(enemy.z),mini?4.3:5,0,Math.PI*2);ctx.stroke()}
 playerIcon(ctx,px(player.x),py(player.z),heading,mini?1:.95);
 if(!mini){ctx.fillStyle='#2f5c42';ctx.textAlign='center';ctx.textBaseline='top';ctx.font='bold 13px system-ui';ctx.fillText('N ↑',width/2,5)}
 ctx.restore();
}
