// Army v0.7.5 - 3K / 5K / 10K model comparison.
// Loads after the player starts. Failure is isolated; never blocks the game.
import {loadGlb} from '../core/glb.js?v=060';
import {RigAnimator} from '../characters/rigAnimator.js?v=060';
const MODE=['Idle','Walking','Running'];
const specs=[
 {key:'3k',title:'3,000 面',x:-1.1,z:-16.3,url:'./assets/characters/lod/soldier_3k.glb'},
 {key:'5k',title:'5,000 面',x:.5,z:-17.3,url:'./assets/characters/lod/soldier_5k.glb'},
 {key:'10k',title:'10,000 面',x:2.1,z:-18.3,url:'./assets/characters/lod/soldier_10k.glb'}
];
export function createLodShowcase(renderer){
 const actors=[];
 let modeIndex=0;
 const style=document.createElement('style');
 style.textContent=`
 .army-lod-label{position:fixed;z-index:4;pointer-events:none;white-space:nowrap;
 background:rgba(246,245,223,.91);color:#294936;border:1px solid rgba(68,95,67,.25);
 border-radius:999px;padding:4px 9px;font-size:12px;font-weight:800;line-height:1.3;
 box-shadow:0 2px 10px rgba(19,40,25,.15);transform:translate(-50%,-100%);
 user-select:none;-webkit-user-select:none}
 .army-lod-action{position:fixed;z-index:5;bottom:max(calc(env(safe-area-inset-bottom) + 20px),30px);
 left:50%;transform:translateX(-50%);border-radius:999px;border:1px solid #c5d3bd;
 padding:10px 18px;background:#fbf9e9;color:#2a5038;font-weight:800;font-size:14px;
 box-shadow:0 3px 16px #233a352e;-webkit-touch-callout:none;touch-action:manipulation}
 `;
 document.head.append(style);
 const action=document.createElement('button');action.className='army-lod-action';action.type='button';
 action.textContent='動作對比：站立';action.hidden=true;
 action.addEventListener('click',()=>{
  modeIndex=(modeIndex+1)%MODE.length;
  const clip=MODE[modeIndex];
  for(const a of actors)a.anim.setClip(clip);
  action.textContent='動作對比：'+(['站立','走路','跑步'][modeIndex]);
 });
 document.body.append(action);
 async function load(){
  for(const spec of specs){
   try{
    const glb=await loadGlb(spec.url);
    await renderer.addModel('lod_'+spec.key,glb);
    const actor={pos:{x:spec.x,z:spec.z},angle:Math.PI,anim:new RigAnimator(glb),asset:'lod_'+spec.key};
    actor.anim.setClip(MODE[modeIndex]);actor.anim.evaluate(0);
    const label=document.createElement('div');label.className='army-lod-label';
    label.textContent=spec.title;label.hidden=true;
    document.body.append(label);
    actors.push({...actor,label});
   }catch(e){console.warn('LOD 測試兵載入失敗 '+spec.key,e)}
  }
 }
 function display(a){
  const m=renderer.vp,px=a.pos.x,py=2.05,pz=a.pos.z;
  const x=m[0]*px+m[4]*py+m[8]*pz+m[12],y=m[1]*px+m[5]*py+m[9]*pz+m[13];
  const w=m[3]*px+m[7]*py+m[11]*pz+m[15];
  if(w<=.12||Math.abs(x/w)>1.1||Math.abs(y/w)>1.1){a.label.hidden=true;return}
  const r=renderer.canvas.getBoundingClientRect();
  a.label.hidden=false;a.label.style.left=(r.left+(x/w+1)*.5*r.width)+'px';
  a.label.style.top=(r.top+(1-y/w)*.5*r.height)+'px';
 }
 function draw(dt,hero){
  const nearby=Math.hypot(hero.x,hero.z+17.3)<13;
  action.hidden=!nearby||!actors.length;
  for(const a of actors){
   a.anim.evaluate(dt);
   renderer.drawActor(a.asset,a);
   if(!nearby){a.label.hidden=true;continue}display(a);
  }
 }
 return {load,draw};
}
