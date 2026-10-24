// Floating analog stick: touch the lower screen to move. Upper screen pans camera.
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
export function setupInput(canvas,onCamera){
 const stick=document.getElementById('floatingStick'),thumb=document.getElementById('stickThumb');
 const state={x:0,y:0,magnitude:0},keys=new Set(),R=60;
 let moving=null,viewing=null;
 const update=e=>{
  if(!moving||e.pointerId!==moving.id)return;
  const dx=e.clientX-moving.x,dy=e.clientY-moving.y,d=Math.hypot(dx,dy),r=Math.min(d,R);
  state.x=d>0?dx/d*r/R:0;
  state.y=d>0?-dy/d*r/R:0;
  state.magnitude=r/R;
  thumb.style.transform=`translate3d(${(state.x*R).toFixed(1)}px,${(-state.y*R).toFixed(1)}px,0)`;
  stick.classList.toggle('run',state.magnitude>=.42&&state.magnitude<.75);
  stick.classList.toggle('sprint',state.magnitude>=.75);
 };
 const stop=()=>{moving=null;state.x=0;state.y=0;state.magnitude=0;stick.classList.remove('active','run','sprint');thumb.style.transform='translate3d(0,0,0)'};
 canvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();
  try{canvas.setPointerCapture(e.pointerId)}catch{}
  if(e.clientY>=window.innerHeight*.41&&!moving){
   moving={id:e.pointerId,x:e.clientX,y:e.clientY};
   stick.style.left=clamp(e.clientX,70,window.innerWidth-70)+'px';
   stick.style.top=clamp(e.clientY,70,window.innerHeight-80)+'px';
   stick.classList.add('active');update(e);
  }else if(e.clientY<window.innerHeight*.41&&!viewing){viewing={id:e.pointerId,x:e.clientX,y:e.clientY}}
 },{passive:false});
 canvas.addEventListener('pointermove',e=>{
  if(moving?.id===e.pointerId){e.preventDefault();update(e)}
  else if(viewing?.id===e.pointerId){e.preventDefault();onCamera((e.clientX-viewing.x)*.008,(e.clientY-viewing.y)*.006);viewing.x=e.clientX;viewing.y=e.clientY}
 },{passive:false});
 const release=e=>{if(moving?.id===e.pointerId)stop();if(viewing?.id===e.pointerId)viewing=null;try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId)}catch{}};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,release);
 window.addEventListener('blur',()=>{stop();viewing=null;keys.clear()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();viewing=null;keys.clear()}});
 window.addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','AltLeft','AltRight'].includes(e.code)){keys.add(e.code);if(e.code.startsWith('Arrow'))e.preventDefault()}});
 window.addEventListener('keyup',e=>keys.delete(e.code));
 return ()=>{
  const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const y=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  if(x||y){const length=Math.hypot(x,y);return {x:x/length,y:y/length,magnitude:(keys.has('ShiftLeft')||keys.has('ShiftRight'))?1:((keys.has('AltLeft')||keys.has('AltRight'))?.26:.6)}}
  return {...state};
 };
}
