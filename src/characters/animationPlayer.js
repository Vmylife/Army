import {trs,mul,I} from '../core/math.js';
const LOOP=new Set(['Idle','Walk','LookAround','RifleIdle','RifleWalk','Run']);
function sample(track,t){const {times,vals,width:n}=track;
 if(t<=times[0])return [...vals.subarray(0,n)];
 if(t>=times[times.length-1])return [...vals.subarray(vals.length-n)];
 let lo=0,hi=times.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(times[m]<t)lo=m;else hi=m;}
 const f=(t-times[lo])/(times[hi]-times[lo]);let out=Array.from({length:n},(_,k)=>vals[lo*n+k]*(1-f)+vals[hi*n+k]*f);
 if(n===4){const L=Math.hypot(...out)||1;out=out.map(v=>v/L);}return out;
}
export class AnimationPlayer {
 constructor(model){this.json=model.json;this.read=model.read;this.nodes=model.json.nodes;this.skeleton=model.json.skins[0];this.joints=this.skeleton.joints;this.bind=model.read(this.skeleton.inverseBindMatrices);this.parents=new Map();for(let i=0;i<this.nodes.length;i++)for(const c of this.nodes[i].children||[])this.parents.set(c,i);
  this.tracks=new Map();for(const a of model.json.animations||[]){let duration=0,tracks=new Map();for(const c of a.channels){const sm=a.samplers[c.sampler],times=model.read(sm.input),vals=model.read(sm.output);duration=Math.max(duration,times[times.length-1]);tracks.set(`${c.target.node}:${c.target.path}`,{times,vals,width:c.target.path==='rotation'?4:3});}this.tracks.set(a.name,{duration,tracks});}
  this.clip='Idle';this.time=0;this.speed=1;this.matrices=new Map();this.bones=new Float32Array(24*16);
 }
 setClip(name){if(!this.tracks.has(name))throw Error(`不存在動作 ${name}`);if(this.clip!==name){this.clip=name;this.time=0;}}
 play(dt){const data=this.tracks.get(this.clip),loop=LOOP.has(this.clip);this.time+=Math.min(.05,dt)*this.speed;const at=loop?this.time%data.duration:Math.min(this.time,data.duration);
  this.matrices.clear();for(const joint of this.joints){const n=this.nodes[joint],T=data.tracks,p=T.has(`${joint}:translation`)?sample(T.get(`${joint}:translation`),at):n.translation||[0,0,0],q=T.has(`${joint}:rotation`)?sample(T.get(`${joint}:rotation`),at):n.rotation||[0,0,0,1];const local=trs(p,q),par=this.parents.get(joint);this.matrices.set(joint,par!==undefined&&this.matrices.has(par)?mul(this.matrices.get(par),local):local);}
  for(let i=0;i<24;i++)this.bones.set(I,i*16);for(let i=0;i<this.joints.length;i++)this.bones.set(mul(this.matrices.get(this.joints[i]),this.bind.subarray(i*16,i*16+16)),i*16);
  return {bones:this.bones,playing:this.clip,ended:!loop&&this.time>=data.duration};
 }
 getJoint(name){const ix=this.nodes.findIndex(n=>n.name===name);return this.matrices.get(ix)||I;}
}
export const CLIP_LABELS={Idle:'站立待機',Walk:'一般走路',Salute:'敬禮',RifleIdle:'拿槍待機',RifleWalk:'持槍走路',Run:'跑步',Hit:'受擊',Death:'倒地',LookAround:'左右張望'};
