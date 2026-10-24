// Army v0.7 - full map and list share the real camp coordinates with the 3D map.
import {CAMP,FEATURES} from '../map/camp.js?v=070';
import {drawCampMap} from '../map/mapDrawing.js?v=071';
function render(canvas,player,enemy,heading){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),dpr=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 drawCampMap(ctx,{width:w,height:h,player,enemy,heading,mini:false});
}
export function initWorldMap(){
 const small=document.getElementById('minimap'),dialog=document.getElementById('worldMap');
 const close=document.getElementById('closeWorldMap'),canvas=document.getElementById('worldMapCanvas'),places=document.getElementById('worldMapPlaceList');
 for(const f of FEATURES){const item=document.createElement('div');item.className='world-map-place';
 const color=document.createElement('i');color.style.setProperty('--dot-color',f.color);
 const label=document.createElement('span');label.textContent=f.label;item.append(color,label);places.appendChild(item)}
 let player={...CAMP.spawn},enemy=null,heading=0;
 const isOpen=()=>!dialog.hidden;
 const paint=()=>{if(isOpen())render(canvas,player,enemy,heading)};
 const open=()=>{if(isOpen())return;window.dispatchEvent(new Event('army-map-open'));dialog.hidden=false;small.setAttribute('aria-expanded','true');requestAnimationFrame(paint);close.focus({preventScroll:true})};
 const hide=()=>{if(!isOpen())return;dialog.hidden=true;small.setAttribute('aria-expanded','false');small.focus({preventScroll:true})};
 small.setAttribute('aria-expanded','false');small.addEventListener('click',open);close.addEventListener('click',hide);
 dialog.addEventListener('click',e=>{if(e.target===dialog)hide()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.preventDefault();hide()}});
 window.addEventListener('resize',paint);
 return {isOpen,update(pos,foe,angle){player={...pos};enemy=foe?{...foe}:null;heading=angle;if(isOpen())paint()},open,close:hide};
}
