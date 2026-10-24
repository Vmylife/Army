// Floating analog joystick: upper screen controls the camera, lower screen moves.
// No persistent HUD or fixed joystick hot spot. Every gesture starts at zero.
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
export function setupInput(canvas,onCamera){
  const base=document.getElementById('floatingStick');
  const thumb=document.getElementById('stickThumb');
  const current={x:0,y:0,magnitude:0};
  const RADIUS=60;
  let movement=null,camera=null;
  const pressed=new Set();
  const updateVisual=()=>{
    base.classList.toggle('walk',current.magnitude>0.08 && current.magnitude<0.43);
    base.classList.toggle('run',current.magnitude>=0.43 && current.magnitude<0.75);
    base.classList.toggle('sprint',current.magnitude>=0.75);
    thumb.style.transform=`translate3d(${(current.x*RADIUS).toFixed(1)}px,${(-current.y*RADIUS).toFixed(1)}px,0)`;
  };
  const stop=()=>{
    movement=null;
    current.x=0;current.y=0;current.magnitude=0;
    base.classList.remove('active','walk','run','sprint');
    thumb.style.transform='translate3d(0,0,0)';
  };
  const updateMovement=e=>{
    if(!movement || movement.id!==e.pointerId)return;
    const dx=e.clientX-movement.x,dy=e.clientY-movement.y;
    const length=Math.hypot(dx,dy),scale=length?Math.min(length,RADIUS)/length:0;
    current.x=dx*scale/RADIUS;
    current.y=-dy*scale/RADIUS;
    current.magnitude=Math.min(1,length/RADIUS);
    updateVisual();
  };
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    if(movement||camera)return;
    e.preventDefault();
    try{canvas.setPointerCapture(e.pointerId)}catch(_){/* older mobile browser */}
    // Any touch starting in the lower 60% invokes movement; the top 40% rotates view.
    if(e.clientY>=window.innerHeight*.4){
      movement={id:e.pointerId,x:e.clientX,y:e.clientY};
      // Keep the visual in the safe play area without shifting its touch origin.
      base.style.left=`${clamp(e.clientX,72,Math.max(72,window.innerWidth-72))}px`;
      base.style.top=`${clamp(e.clientY,74,Math.max(74,window.innerHeight-84))}px`;
      base.classList.add('active');
      updateMovement(e);
    }else camera={id:e.pointerId,x:e.clientX,y:e.clientY};
  });
  canvas.addEventListener('pointermove',e=>{
    if(movement?.id===e.pointerId){e.preventDefault();updateMovement(e);return}
    if(camera?.id===e.pointerId){e.preventDefault();onCamera((e.clientX-camera.x)*.008,(e.clientY-camera.y)*.006);camera.x=e.clientX;camera.y=e.clientY}
  });
  const release=e=>{
    if(movement?.id===e.pointerId)stop();
    if(camera?.id===e.pointerId)camera=null;
    if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener('pointerup',release);
  canvas.addEventListener('pointercancel',release);
  canvas.addEventListener('lostpointercapture',e=>{
    if(movement?.id===e.pointerId)stop();
    if(camera?.id===e.pointerId)camera=null;
  });
  window.addEventListener('blur',()=>{stop();camera=null;pressed.clear()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();camera=null;pressed.clear()}});
  window.addEventListener('keydown',e=>{
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','AltLeft','AltRight'].includes(e.code)){
      if(e.code.startsWith('Arrow'))e.preventDefault();pressed.add(e.code);
    }
  });
  window.addEventListener('keyup',e=>pressed.delete(e.code));
  return ()=>{
    let x=current.x,y=current.y;
    const kx=Number(pressed.has('KeyD')||pressed.has('ArrowRight'))-Number(pressed.has('KeyA')||pressed.has('ArrowLeft'));
    const ky=Number(pressed.has('KeyW')||pressed.has('ArrowUp'))-Number(pressed.has('KeyS')||pressed.has('ArrowDown'));
    const activeKeys=kx!==0||ky!==0;
    if(activeKeys){
      const klen=Math.hypot(kx,ky);x=kx/klen;y=ky/klen;
      // Desktop keyboard: Alt=walking, WASD=running, Shift=sprinting.
      return {x,y,magnitude:(pressed.has('ShiftLeft')||pressed.has('ShiftRight'))?1:((pressed.has('AltLeft')||pressed.has('AltRight'))?0.28:0.6)};
    }
    return {x,y,magnitude:current.magnitude};
  };
}
