import {I,mul,perspective,lookAt,translation,rotateY} from './math.js';
import {weaponMesh} from '../battle/weapon.js';
const SOLDIER_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 p;layout(location=1) in vec3 n;layout(location=2) in vec2 uv;
layout(location=3) in vec4 j;layout(location=4) in vec4 w;
uniform mat4 uVP;uniform mat4 uModel;uniform mat4 uBones[24];
out vec2 vUV;out vec3 vNormal;
void main(){ivec4 ji=ivec4(j+0.5);mat4 sk=uBones[ji.x]*w.x+uBones[ji.y]*w.y+uBones[ji.z]*w.z+uBones[ji.w]*w.w;
vec4 wp=uModel*sk*vec4(p,1.);gl_Position=uVP*wp;vNormal=normalize(mat3(uModel)*mat3(sk)*n);vUV=uv;}`;
const SOLDIER_FS=`#version 300 es
precision highp float;
in vec2 vUV;in vec3 vNormal;uniform sampler2D uTexture;out vec4 frag;
void main(){vec3 albedo=texture(uTexture,vUV).rgb;vec3 n=normalize(vNormal);float light=.75+.30*max(dot(n,normalize(vec3(-.5,1.2,-.9))),0.);frag=vec4(albedo*light,1.);}`;
const FLAT_VS=`#version 300 es
precision highp float;
layout(location=0) in vec3 p;layout(location=1) in vec3 c;
uniform mat4 uVP;uniform mat4 uModel;out vec3 color;
void main(){color=c;gl_Position=uVP*uModel*vec4(p,1.);}`;
const FLAT_FS=`#version 300 es
precision highp float;
in vec3 color;out vec4 frag;
void main(){frag=vec4(color,1.);}`;
function compile(gl,t,s){const sh=gl.createShader(t);gl.shaderSource(sh,s);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
function program(gl,v,f){const pr=gl.createProgram();gl.attachShader(pr,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(pr,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pr));return pr;}
function bindAttribute(gl,loc,arr,size,type){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,type,false,0,0);}
function floorGeo(){const v=[],c=[];function quad(p1,p2,p3,p4,col){for(const p of [p1,p2,p3,p1,p3,p4]){v.push(...p);c.push(...col)}}
 const green=[.66,.76,.62],sand=[.85,.81,.69],stripes=[.93,.91,.82],gravel=[.63,.73,.59];
 quad([-30,-.025,-30],[30,-.025,-30],[30,-.025,30],[-30,-.025,30],green);
 quad([-1.8,-.015,-30],[1.8,-.015,-30],[1.8,-.015,30],[-1.8,-.015,30],sand);
 for(let i=-30;i<=30;i+=2){quad([-1.8,-.011,i],[1.8,-.011,i],[1.8,-.011,i+.025],[-1.8,-.011,i+.025],stripes)}
 quad([-30,-.01,-1.8],[30,-.01,-1.8],[30,-.01,1.8],[-30,-.01,1.8],gravel);
 return {positions:new Float32Array(v),colors:new Float32Array(c),vertexCount:v.length/3};}
export class SoldierRenderer{
 constructor(canvas){this.canvas=canvas;const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true});if(!gl)throw Error('裝置不支援 WebGL2');this.gl=gl;this.pr=program(gl,SOLDIER_VS,SOLDIER_FS);this.flatPr=program(gl,FLAT_VS,FLAT_FS);this.model=null;this.texture=null;this.yaw=.24;this.pitch=.19;this.zoom=4.35;this.worldPos={x:0,z:0};this.direction=0;this.rifle=weaponMesh();this.floor=floorGeo();this.flatVAO=new Map();this.flatVAO.set('rifle',this.makeFlatVAO(this.rifle));this.flatVAO.set('floor',this.makeFlatVAO(this.floor));}
 makeFlatVAO(data){const gl=this.gl,vao=gl.createVertexArray();gl.bindVertexArray(vao);bindAttribute(gl,0,data.positions,3,gl.FLOAT);bindAttribute(gl,1,data.colors,3,gl.FLOAT);gl.bindVertexArray(null);return vao;}
 async setModel(model){this.model=model;const gl=this.gl,prim=model.json.meshes[0].primitives[0],vao=gl.createVertexArray();gl.bindVertexArray(vao);
  for(const [attr,loc,size] of [['POSITION',0,3],['NORMAL',1,3],['TEXCOORD_0',2,2],['JOINTS_0',3,4],['WEIGHTS_0',4,4]]){
   const ax=model.json.accessors[prim.attributes[attr]],arr=model.read(prim.attributes[attr]);bindAttribute(gl,loc,arr,size,ax.componentType);
  }
  const indAcc=model.json.accessors[prim.indices],inds=model.read(prim.indices);this.indType=indAcc.componentType;this.indCount=inds.length;
  const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,inds,gl.STATIC_DRAW);gl.bindVertexArray(null);this.vao=vao;
  const mat=model.json.materials[prim.material],tidx=mat.pbrMetallicRoughness.baseColorTexture.index,imIdx=model.json.textures[tidx].source;
  const url=URL.createObjectURL(model.imageFrom(imIdx)),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});}finally{URL.revokeObjectURL(url)}
  const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,img.width,img.height,0,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);this.texture=tex;
 }
 render(player){if(!this.model||!this.texture)return;const gl=this.gl,canvas=this.canvas,W=Math.round(canvas.clientWidth*Math.min(2,window.devicePixelRatio||1)),H=Math.round(canvas.clientHeight*Math.min(2,window.devicePixelRatio||1));if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;gl.viewport(0,0,W,H);}
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(.76,.83,.73,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  const portrait=W/H<1,dist=this.zoom*(portrait?1.08:1),cx=this.worldPos.x,cz=this.worldPos.z;const eye=[cx+Math.sin(this.yaw)*Math.cos(this.pitch)*dist,.95+Math.sin(this.pitch)*dist,cz+Math.cos(this.yaw)*Math.cos(this.pitch)*dist];
  const vp=mul(perspective(Math.PI/4,W/H,.1,150),lookAt(eye,[cx,.95,cz]));
  gl.useProgram(this.flatPr);gl.uniformMatrix4fv(gl.getUniformLocation(this.flatPr,'uVP'),false,vp);gl.uniformMatrix4fv(gl.getUniformLocation(this.flatPr,'uModel'),false,I);gl.bindVertexArray(this.flatVAO.get('floor'));gl.drawArrays(gl.TRIANGLES,0,this.floor.vertexCount);
  const modelMatrix=mul(translation(cx,.952,cz),rotateY(this.direction));gl.useProgram(this.pr);gl.uniformMatrix4fv(gl.getUniformLocation(this.pr,'uVP'),false,vp);gl.uniformMatrix4fv(gl.getUniformLocation(this.pr,'uModel'),false,modelMatrix);gl.uniformMatrix4fv(gl.getUniformLocation(this.pr,'uBones[0]'),false,player.bones);gl.uniform1i(gl.getUniformLocation(this.pr,'uTexture'),0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,this.indCount,this.indType,0);
  if(['RifleIdle','RifleWalk'].includes(player.clip)){
   // Toy rifle in chest-space, approximating a two-handed hold without changing the Meshy mesh.
   const chest=player.getJoint('Chest'),weaponTransform=mul(mul(modelMatrix,chest),translation(0,-.16,.28));
   gl.useProgram(this.flatPr);gl.uniformMatrix4fv(gl.getUniformLocation(this.flatPr,'uVP'),false,vp);gl.uniformMatrix4fv(gl.getUniformLocation(this.flatPr,'uModel'),false,weaponTransform);gl.bindVertexArray(this.flatVAO.get('rifle'));gl.drawArrays(gl.TRIANGLES,0,this.rifle.vertexCount);
  }
  gl.bindVertexArray(null);
 }
}
