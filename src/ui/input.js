export function setupInput(canvas,onCamera,reset){const joy=document.querySelector('#joy'),nub=document.querySelector('#nub'),current={x:0,y:0};let joyPointer=null,drag=null;
 const change=e=>{const r=joy.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,cap=r.width*.31,s=Math.min(1,cap/(Math.hypot(x,y)||1)),a=x*s,b=y*s;current.x=a/cap;current.y=-b/cap;nub.style.transform=`translate(${a}px,${b}px)`};
 joy.addEventListener('pointerdown',e=>{e.preventDefault();joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);change(e)});
 joy.addEventListener('pointermove',e=>{if(joyPointer===e.pointerId)change(e)});
 const release=e=>{if(joyPointer!==e.pointerId)return;joyPointer=null;current.x=0;current.y=0;nub.style.transform='translate(0,0)'};
 joy.addEventListener('pointerup',release);joy.addEventListener('pointercancel',release);window.addEventListener('blur',()=>{current.x=0;current.y=0;nub.style.transform='translate(0,0)'});
 canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;onCamera((e.clientX-drag.x)*.008,(e.clientY-drag.y)*.006);drag.x=e.clientX;drag.y=e.clientY});
 canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
 const pressed=new Set();window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();pressed.add(e.code)}});window.addEventListener('keyup',e=>pressed.delete(e.code));
 document.querySelector('#resetCamera').addEventListener('click',reset);
 return()=>{const x=current.x+(pressed.has('KeyD')||pressed.has('ArrowRight')?1:0)-(pressed.has('KeyA')||pressed.has('ArrowLeft')?1:0),y=current.y+(pressed.has('KeyW')||pressed.has('ArrowUp')?1:0)-(pressed.has('KeyS')||pressed.has('ArrowDown')?1:0);const mag=Math.hypot(x,y);return mag>1?{x:x/mag,y:y/mag}:{x,y}};
}
export function setupAnimationButtons(onClip){const bar=document.querySelector('#moves');const choices=[['正常走路','Walking'],['跑步','Running'],['慢慢走','Casual_Walk'],['衝刺','RunFast'],['受擊','BeHit_FlyUp'],['倒地','Dead'],['起身','Arise'],['拳擊','Boxing_Practice']];
 for(const [label,clip]of choices){const b=document.createElement('button');b.textContent=label;b.dataset.clip=clip;b.addEventListener('click',()=>{bar.querySelectorAll('button').forEach(el=>el.classList.toggle('active',el===b));onClip(clip)});bar.appendChild(b)}
 return clip=>{bar.querySelectorAll('button').forEach(el=>el.classList.toggle('active',el.dataset.clip===clip))}
}
