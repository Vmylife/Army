// Tiny WebGL2 3-D bullet streaks, rendered in the SAME scene and view-projection as ArmyRenderer.
const VS=`#version 300 es
precision highp float; layout(location=0) in vec3 p; layout(location=1) in vec4 c;
uniform mat4 uVP;out vec4 vC;
void main(){gl_Position=uVP*vec4(p,1.);vC=c;}`;
const FS=`#version 300 es
precision mediump float;in vec4 vC;out vec4 frag;void main(){frag=vC;}`;
function makeShader(gl,t,source){const s=gl.createShader(t);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('彈道著色器 '+gl.getShaderInfoLog(s));return s}
export class BulletTracers{
 constructor(gl){this.gl=gl;this.shots=[];this.program=gl.createProgram();gl.attachShader(this.program,makeShader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(this.program,makeShader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(this.program);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('彈道著色器連結失敗');this.vp=gl.getUniformLocation(this.program,'uVP');this.vao=gl.createVertexArray();this.buffer=gl.createBuffer();gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);gl.bindVertexArray(null)}
 fire(from,to,now,enemy=false){this.shots.push({from:{...from},to:{...to},start:now,enemy});if(this.shots.length>70)this.shots.shift()}
 draw(vp,now){const gl=this.gl,vert=[];
  this.shots=this.shots.filter(q=>now-q.start<420);
  for(const q of this.shots){const dx=q.to.x-q.from.x,dz=q.to.z-q.from.z,dist=Math.hypot(dx,dz)||1;
   const alpha=Math.max(0,1-(now-q.start)/420),head=Math.min(1,(now-q.start)/(Math.max(65,dist*19))),tail=Math.max(0,head-Math.min(.15,1.65/dist));
   if(head<=0)continue;
   const sx=q.from.x+dx*tail,sz=q.from.z+dz*tail,ex=q.from.x+dx*head,ez=q.from.z+dz*head;
   const offx=-dz/dist*.044,offz=dx/dist*.044;
   const y0=q.from.y??1.05,y1=q.to.y??1.08,sy=y0+(y1-y0)*tail,ey=y0+(y1-y0)*head;
   const col=q.enemy?[1,.39,.22,alpha*.88]:[1,.91,.44,alpha];
   function vertex(x,y,z,a){vert.push(x,y,z,col[0],col[1],col[2],a)}
   vertex(sx+offx,sy,sz+offz,col[3]*.4);vertex(ex+offx,ey,ez+offz,col[3]);vertex(ex-offx,ey,ez-offz,col[3]);
   vertex(sx+offx,sy,sz+offz,col[3]*.4);vertex(ex-offx,ey,ez-offz,col[3]);vertex(sx-offx,sy,sz-offz,col[3]*.4);
  }
  if(!vert.length)return;
  gl.useProgram(this.program);gl.uniformMatrix4fv(this.vp,false,vp);gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vert),gl.DYNAMIC_DRAW);
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,0,vert.length/7);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
 }
}
