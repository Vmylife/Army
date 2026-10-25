// Army Battle v0.11.0 — lightweight low-poly open arena, no camp files modified.
export const FIELD_RADIUS=33;
export const COVERS=[
 {x:-10.5,z:7.1,w:4.7,d:1.45,h:1.25,type:'sand'},
 {x:11.7,z:8.5,w:3.5,d:1.35,h:1.15,type:'sand'},
 {x:-12.4,z:-8.7,w:3.3,d:1.7,h:1.6,type:'crate'},
 {x:10.3,z:-10.2,w:4.3,d:1.45,h:1.3,type:'sand'},
 {x:1.2,z:14.8,w:2.25,d:2.3,h:1.6,type:'crate'},
 {x:-1.0,z:-15.3,w:2.5,d:1.8,h:1.45,type:'crate'},
 {x:-18.7,z:2.0,w:1.65,d:3.1,h:1.4,type:'barrel'},
 {x:19.4,z:-1.8,w:1.7,d:3.1,h:1.4,type:'barrel'},
 {x:21.4,z:18.1,w:2.6,d:2.0,h:1.25,type:'crate'},
 {x:-22.0,z:-18.1,w:2.8,d:1.8,h:1.25,type:'sand'},
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function hitCover(x,z,r=.42){
 for(const c of COVERS){let dx=Math.max(Math.abs(x-c.x)-c.w*.5,0),dz=Math.max(Math.abs(z-c.z)-c.d*.5,0);if(dx*dx+dz*dz<r*r)return c}
 return null;
}
export function moveInArena(pos,dx,dz,r=.38){
 const valid=(x,z)=>Math.hypot(x,z)<FIELD_RADIUS-r-1.0&&!hitCover(x,z,r);
 let x=pos.x,z=pos.z;
 if(valid(x+dx,z+dz))return{x:x+dx,z:z+dz};
 if(valid(x+dx,z))x+=dx;
 if(valid(x,z+dz))z+=dz;
 return{x,z};
}
// World-space line/rect intersection. Use independently from movement collision.
export function firstCoverHit(ax,az,bx,bz,pad=.05){
 let best=Infinity,result=null;
 for(const c of COVERS){
  let minx=c.x-c.w*.5-pad,maxx=c.x+c.w*.5+pad,minz=c.z-c.d*.5-pad,maxz=c.z+c.d*.5+pad;
  const dx=bx-ax,dz=bz-az;let t0=0,t1=1;
  for(const [start,delta,lo,hi] of [[ax,dx,minx,maxx],[az,dz,minz,maxz]]){
   if(Math.abs(delta)<1e-8){if(start<lo||start>hi){t0=2;break}}
   else{let a=(lo-start)/delta,b=(hi-start)/delta;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)break}
  }
  if(t0<=t1&&t0>=0&&t0<best){best=t0;result=c;}
 }
 return result?{t:best,cover:result,x:ax+(bx-ax)*best,z:az+(bz-az)*best}:null;
}
function maker(){const v=[],c=[],n=[];let count=0;
 function tri(a,b,d,color){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=d[0]-a[0],vy=d[1]-a[1],vz=d[2]-a[2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz)||1;for(const p of [a,b,d]){v.push(...p);c.push(...color);n.push(nx/l,ny/l,nz/l)}count++}
 const quad=(a,b,d,e,col)=>{tri(a,b,d,col);tri(a,d,e,col)};
 function rect(x,z,w,d,y,col){const a=x-w/2,b=x+w/2,t=z-d/2,s=z+d/2;quad([a,y,t],[a,y,s],[b,y,s],[b,y,t],col)}
 function box(x,z,w,d,h,col){const y0=.018,y1=y0+h,x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2;
  rect(x,z,w,d,y1,col);
  quad([x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],col.map(q=>q*.87));
  quad([x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[x0,y0,z1],col.map(q=>q*.70));
  quad([x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],col.map(q=>q*.80));
  quad([x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[x0,y0,z0],col.map(q=>q*.91));
 }
 return{rect,box,out:()=>({verts:new Float32Array(v),cols:new Float32Array(c),norms:new Float32Array(n),count:v.length/3,triangles:count})};
}
export function makeArenaEnvironment(){const g=maker();let seed=7271;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 // Deliberately many small variations in a SINGLE WebGL draw call.
 const step=4.0;for(let x=-36;x<36;x+=step)for(let z=-36;z<36;z+=step){const f=(random()-.5)*.065;g.rect(x+step*.5,z+step*.5,step+.006,step+.006,-.012,[.62+f,.72+f,.55+f*.72]);}
 // Faint dust patches: preserve uncluttered movement/readable tracers.
 for(let i=0;i<90;i++){const x=(random()-.5)*65,z=(random()-.5)*65,r=.14+random()*.23;
  if(Math.hypot(x,z)>31||hitCover(x,z,.5))continue;
  g.rect(x,z,r*2,r*1.2,-.003,[.66,.70,.55]);}
 // Arena training lane hints (decorative, no physical wall).
 const edge=[.48,.59,.43];
 for(let i=0;i<4;i++){g.rect((i-1.5)*12,-31,8,.19,.008,edge);g.rect((i-1.5)*12,31,8,.19,.008,edge);}
 for(const cover of COVERS){let {x,z,w,d,h,type}=cover;
  if(type==='crate'){
   g.box(x,z,w,d,h,[.59,.45,.29]);
   g.rect(x,z,w*.89,.09,h+.021,[.40,.29,.20]);
  }else if(type==='sand'){
   g.box(x,z,w,d,h,[.74,.67,.48]);
   g.rect(x,z,w*.95,d*.23,h+.025,[.83,.76,.57]);
  }else{
   for(let k=-1;k<=1;k++){g.box(x,z+k*d/3,w*.8,d*.27,h,[.40+k*.025,.45,.41]);}
  }
 }
 return g.out();}
export function applyArena(renderer){const gl=renderer.gl,world=makeArenaEnvironment();const vao=gl.createVertexArray();gl.bindVertexArray(vao);
 for(const [i,buf,size] of [[0,world.verts,3],[1,world.cols,3],[2,world.norms,3]]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,buf,gl.STATIC_DRAW);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,0,0)}
 gl.bindVertexArray(null);gl.deleteVertexArray(renderer.flatVAO);renderer.flatVAO=vao;renderer.environment=world;return world;
}
