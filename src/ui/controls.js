import {CLIP_LABELS} from '../characters/animationPlayer.js';
export function setupControls(player,{onMove=()=>{}}={}){
 const bar=document.querySelector('#actions');let active='Idle';
 const clips=['Idle','Walk','Salute','RifleIdle','RifleWalk','Run','Hit','Death','LookAround'];
 for(const clip of clips){const b=document.createElement('button');b.type='button';b.className='action'+(clip==='Idle'?' active':'');b.textContent=CLIP_LABELS[clip];b.dataset.clip=clip;
  b.addEventListener('click',()=>{player.setClip(clip);active=clip;bar.querySelectorAll('button').forEach(el=>el.classList.toggle('active',el===b));document.querySelector('#clipTitle').textContent=CLIP_LABELS[clip];});bar.append(b);}
 const joystick=document.querySelector('#joystick'),thumb=document.querySelector('#stick');let pointer=null;
 const update=(e)=>{const r=joystick.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),rad=r.width*.34,scale=Math.min(1,rad/(Math.hypot(dx,dy)||1));const x=dx*scale,y=dy*scale;thumb.style.transform=`translate(${x}px,${y}px)`;onMove({x:x/rad,y:-y/rad});};
 joystick.addEventListener('pointerdown',e=>{pointer=e.pointerId;joystick.setPointerCapture(pointer);update(e)});
 joystick.addEventListener('pointermove',e=>{if(pointer===e.pointerId)update(e)});
 const end=e=>{if(pointer===e.pointerId){pointer=null;thumb.style.transform='translate(0,0)';onMove({x:0,y:0});}};
 joystick.addEventListener('pointerup',end);joystick.addEventListener('pointercancel',end);
 return {get selected(){return active}};
}
