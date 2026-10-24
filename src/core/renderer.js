import {I,mul,perspective,lookAt,translation,rotateY} from './math.js';
const SKIN_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 p;layout(location=1) in vec3 n;layout(location=2) in vec2 uv;layout(location=3) in vec4 j;layout(location=4) in vec4 w;
uniform mat4 uVP,uModel;uniform mat4 uBones[44];
out vec2 vUV;out vec3 vN;out vec3 vPos;
void main(){ivec4 ji=ivec4(j+0.5);mat4 skin=uBones[ji.x]*w.x+uBones[ji.y]*w.y+uBones[ji.z]*w.z+uBones[ji.w]*w.w;vec4 wp=uModel*skin*vec4(p,1.0);gl_Position=uVP*wp;vUV=uv;vN=normalize(mat3(uModel)*mat3(skin)*n);vPos=wp.xyz;}`;
const SKIN_FS=`#version 300 es
precision mediump float;in vec2 vUV;in vec3 vN;in vec3 vPos;uniform sampler2D uTexture;out vec4 frag;
void main(){vec3 base=texture(uTexture,vUV).rgb;float sun=max(0.,dot(normalize(vN),normalize(vec3(-0.4,1.1,0.55))));float light=.78+.25*sun;frag=vec4(base*light,1.);}`;
const STATIC_VS=`#version 300 es
precision highp float;layout(location=0)in vec3 p;layout(location=1)in vec3 c;layout(location=2)in vec3 n;uniform mat4 uVP;out vec3 vColor;out vec3 vN;void main(){gl_Position=uVP*vec4(p,1.);vColor=c;vN=n;}`;
const STATIC_FS=`#version 300 es
precision mediump float;in vec3 vColor;in vec3 vN;out vec4 frag;void main(){float sun=max(0.,dot(normalize(vN),normalize(vec3(-.5,1.,.4))));frag=vec4(vColor*(.82+.22*sun),1.);}`;
function shader(gl,t,s){const a=gl.createShader(t);gl.shaderSource(a,s);gl.compileShader(a);if(!gl.getShaderParameter(a,gl.COMPILE_STATUS))throw Error('Shader：'+gl.getShaderInfoLog(a));return a}
function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Program：'+gl.getProgramInfoLog(p));return p}
function attrib(gl,ix,arr,size,type){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);gl.enableVertexAttribArray(ix);gl.vertexAttribPointer(ix,size,type,false,0,0)}
function makeEnvironment(){const verts=[],cols=[],norms=[];
 function tri(a,b,c,col){const ax=b[0]-a[0],ay=b[1]-a[1],az=b[2]-a[2],bx=c[0]-a[0],by=c[1]-a[1],bz=c[2]-a[2],N=[ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx];const ll=Math.hypot(...N)||1;const n=N.map(x=>x/ll);for(const p of [a,b,c]){verts.push(...p);cols.push(...col);norms.push(...n)}}
 function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
 function cube(x,y,z,w,h,d,col){const a=x-w/2,b=x+w/2,l=z-d/2,r=z+d/2,v=y,u=y+h;
 quad([a,u,l],[a,u,r],[b,u,r],[b,u,l],col);quad([a,v,r],[a,v,l],[b,v,l],[b,v,r],col);
 quad([a,v,l],[a,u,l],[b,u,l],[b,v,l],col);quad([b,v,r],[b,u,r],[a,u,r],[a,v,r],col);
 quad([a,v,r],[a,u,r],[a,u,l],[a,v,l],col);quad([b,v,l],[b,u,l],[b,u,r],[b,v,r],col)}
 function roof(x,z,w,d,y,h,col){const a=x-w/2,b=x+w/2,l=z-d/2,r=z+d/2;const E=[a,y,l],F=[b,y,l],G=[b,y,r],H=[a,y,r],peakL=[x,y+h,l],peakR=[x,y+h,r];quad(E,peakL,peakR,H,col);quad(peakL,F,G,peakR,col);tri(E,F,peakL,col);tri(H,peakR,G,col)}
 function trunk(x,z,h=.55){cube(x,0,z,.22,h,.22,[.55,.43,.32])}
 function canopy(x,y,z,rx,ry,rz,col){const top=[x,y+ry,z],bottom=[x,y-ry,z],points=[];for(let k=0;k<8;k++){const a=k*Math.PI/4;points.push([x+Math.cos(a)*rx,y,z+Math.sin(a)*rz])}for(let k=0;k<8;k++){const nxt=(k+1)%8;tri(top,points[k],points[nxt],col);tri(bottom,points[nxt],points[k],col)}}
 const GRASS=[.66,.76,.59],LIGHT=[.83,.80,.67],PATH=[.88,.85,.75],ROOF=[.42,.52,.44],WALL=[.86,.84,.75],TRIM=[.63,.53,.40],DARK=[.33,.46,.39],DOR=[.50,.41,.30];
 cube(0,-.14,0,20,.14,18,GRASS);cube(0,-.025,0,3.1,.04,15,PATH);cube(0,-.02,1.85,15,.04,2.2,PATH);
 // Training field + markings
 cube(5.4,-.018,3.95,5.8,.045,4.3,[.69,.75,.61]);for(let k=-2;k<=2;k++)cube(5.45+k*.9,.018,3.95,.025,.01,3.7,[.9,.88,.76]);
 // Barracks: left top
 cube(-4.5,0,-3.8,4.3,1.5,3.15,WALL);cube(-4.5,0,-2.2,4.8,.11,.6,TRIM);roof(-4.5,-3.8,4.7,3.5,1.47,.63,ROOF);
 cube(-3.4,.03,-2.17,.72,1.24,.11,DOR);for(let x of [-6,-5,-4])cube(x,.79,-2.16,.46,.55,.08,[.65,.82,.79]);
 cube(-3.35,-.01,-1.75,1.15,.12,.4,LIGHT);
 // Canteen right bottom
 cube(-5.15,0,5.45,4.7,1.45,2.65,[.92,.83,.67]);roof(-5.15,5.45,5,2.85,1.43,.55,[.62,.48,.36]);cube(-4.1,.01,4.10,.8,1.15,.08,DOR);
 // Range, targets
 cube(5.3,0,-4.8,6,.43,2.25,[.68,.63,.51]);cube(5.3,.36,-5.75,6,.82,.28,[.56,.60,.50]);
 for(const x of [3.8,5.3,6.8]){cube(x,.1,-4.2,.09,1.04,.10,DOR);cube(x,.95,-4.17,.66,.60,.07,[.94,.90,.78]);cube(x,.95,-4.125,.32,.32,.038,[.70,.35,.32]);cube(x,.95,-4.09,.13,.13,.027,[.98,.92,.8])}
 // Equipment, bench, flags
 cube(1.9,0,-2.2,1.13,.65,.68,[.56,.61,.46]);cube(1.9,.62,-2.2,1.17,.12,.72,[.45,.52,.40]);cube(-1.8,0,3.9,1.25,.44,.46,[.66,.54,.41]);
 cube(-.8,0,-1.7,.08,2.65,.08,[.72,.75,.68]);quad([-.76,2.45,-1.69],[.44,2.45,-1.69],[.44,1.83,-1.69],[-.76,1.83,-1.69],[.74,.35,.34]);
 for(const [x,z] of [[-7.5,-6],[-6,-.7],[-7.6,2],[0,-6.7],[7.7,1.0],[7.5,6],[-1.7,6.2]]){trunk(x,z);canopy(x,.83,z,.65,.75,.66,[.57,.70,.50]);canopy(x,.92,z,.36,.60,.45,[.66,.78,.56]);}
 for(const [x,z] of [[-2.3,.6],[2.45,2.5],[.95,-4.2]]){cube(x,0,z,.55,.42,.52,[.60,.65,.52]);cube(x,.39,z,.58,.07,.55,[.75,.73,.62])}
 return{verts:new Float32Array(verts),cols:new Float32Array(cols),norms:new Float32Array(norms),count:verts.length/3};
}
// Meshy hit / fall / stand-up clips contain negative root translations.
// Lift only these actions so their lowest sampled point never passes the floor.
const FLOOR_ACTIONS=new Set(['Dead','Arise','BeHit_FlyUp']);
function groundLift(asset,actor){
 const anim=actor.anim;
 if(!FLOOR_ACTIONS.has(anim.clip)&&!(anim.transition>0&&FLOOR_ACTIONS.has(anim.prevClip)))return 0;
 const bones=anim.bones;
 let low=Infinity;
 for(const sample of asset.sample){
  const [x,y,z]=sample.p;
  let yy=0;
  for(let i=0;i<4;i++){
   const weight=sample.w[i];if(weight<=0)continue;
   const base=sample.j[i]*16;
   yy+=weight*(bones[base+1]*x+bones[base+5]*y+bones[base+9]*z+bones[base+13]);
  }
  if(yy<low)low=yy;
 }
 return Number.isFinite(low)?Math.max(0,.015-low):0;
}
export class ArmyRenderer{
 constructor(canvas){this.canvas=canvas;const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,depth:true,powerPreference:'high-performance'});if(!gl)throw Error('這個瀏覽器不支援 WebGL2');this.gl=gl;this.p=program(gl,SKIN_VS,SKIN_FS);this.pFlat=program(gl,STATIC_VS,STATIC_FS);this.assets=new Map();this.environment=makeEnvironment();this.flatVAO=gl.createVertexArray();gl.bindVertexArray(this.flatVAO);attrib(gl,0,this.environment.verts,3,gl.FLOAT);attrib(gl,1,this.environment.cols,3,gl.FLOAT);attrib(gl,2,this.environment.norms,3,gl.FLOAT);gl.bindVertexArray(null);
 this.uniforms={vp:gl.getUniformLocation(this.p,'uVP'),model:gl.getUniformLocation(this.p,'uModel'),bones:gl.getUniformLocation(this.p,'uBones[0]'),tex:gl.getUniformLocation(this.p,'uTexture')};
 this.flatVP=gl.getUniformLocation(this.pFlat,'uVP');this.vp=I;this.cameraYaw=.67;this.cameraPitch=.60;this.cameraZoom=9;this.cameraTarget={x:0,z:0};this.size={w:0,h:0};
 }
 async addModel(name,gltf){const gl=this.gl,pr=gltf.json.meshes[0].primitives[0],vao=gl.createVertexArray();gl.bindVertexArray(vao);
  const map=[['POSITION',0,3],['NORMAL',1,3],['TEXCOORD_0',2,2],['JOINTS_0',3,4],['WEIGHTS_0',4,4]];
  for(const [k,loc,size] of map){const idx=pr.attributes[k],acc=gltf.json.accessors[idx];attrib(gl,loc,gltf.read(idx),size,acc.componentType)}
  const idxAcc=gltf.json.accessors[pr.indices],inds=gltf.read(pr.indices),buf=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,buf);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,inds,gl.STATIC_DRAW);gl.bindVertexArray(null);
  const material=gltf.json.materials[pr.material],tid=material.pbrMetallicRoughness.baseColorTexture.index,imgid=gltf.json.textures[tid].source,url=URL.createObjectURL(gltf.imageFrom(imgid));let image=new Image();try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url})}finally{URL.revokeObjectURL(url)}
  const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  
  // Small CPU sample for ground contact: correct Meshy clip-specific root offsets
  // without editing the supplied rig or animation curves.
  const positions=gltf.read(pr.attributes.POSITION), joints=gltf.read(pr.attributes.JOINTS_0),weights=gltf.read(pr.attributes.WEIGHTS_0);
  const total=positions.length/3,groundSamples=[];
  for(let i=0;i<total;i+=Math.max(1,Math.floor(total/420))){groundSamples.push(i)}
  const low=[...Array(total).keys()].sort((a,b)=>positions[a*3+1]-positions[b*3+1]).slice(0,32);groundSamples.push(...low);
  const sample=groundSamples.map(i=>({p:[positions[i*3],positions[i*3+1],positions[i*3+2]],j:[...joints.slice(i*4,i*4+4)],w:[...weights.slice(i*4,i*4+4)]}));
  this.assets.set(name,{vao,tex,count:inds.length,indexType:idxAcc.componentType,sample});
 }
 setCamera(opts){Object.assign(this,{cameraYaw:opts.yaw??this.cameraYaw,cameraPitch:opts.pitch??this.cameraPitch,cameraZoom:opts.zoom??this.cameraZoom})}
 startFrame(target){const gl=this.gl,canvas=this.canvas,ratio=Math.min(window.armyEco?1:1.65,window.devicePixelRatio||1),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
 gl.clearColor(.76,.84,.73,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
 const portrait=w/h<.94,dist=this.cameraZoom*(portrait?1.23:1),yaw=this.cameraYaw,pitch=this.cameraPitch;this.cameraTarget.x+=(target.x-this.cameraTarget.x)*.10;this.cameraTarget.z+=(target.z-this.cameraTarget.z)*.10;
 const ex=this.cameraTarget.x+Math.sin(yaw)*Math.cos(pitch)*dist,ey=.9+Math.sin(pitch)*dist,ez=this.cameraTarget.z+Math.cos(yaw)*Math.cos(pitch)*dist;
 this.vp=mul(perspective(portrait?Math.PI/3.7:Math.PI/4.15,w/h,.1,150),lookAt([ex,ey,ez],[this.cameraTarget.x,.65,this.cameraTarget.z]));
 gl.useProgram(this.pFlat);gl.uniformMatrix4fv(this.flatVP,false,this.vp);gl.bindVertexArray(this.flatVAO);gl.drawArrays(gl.TRIANGLES,0,this.environment.count);
 }
 drawActor(asset,actor){const gl=this.gl,a=this.assets.get(asset);if(!a)return;
 gl.useProgram(this.p);gl.uniformMatrix4fv(this.uniforms.vp,false,this.vp);gl.uniformMatrix4fv(this.uniforms.model,false,mul(translation(actor.pos.x,groundLift(a,actor),actor.pos.z),rotateY(actor.angle)));
 gl.uniformMatrix4fv(this.uniforms.bones,false,actor.anim.bones);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,a.tex);gl.uniform1i(this.uniforms.tex,0);gl.bindVertexArray(a.vao);gl.drawElements(gl.TRIANGLES,a.count,a.indexType,0);
 }
}
