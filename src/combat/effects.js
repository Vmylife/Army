// Lightweight 2D overlay projected from 3D world: no projectile geometry draw calls.
export class BattleEffects{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.width=0;this.height=0;}
 resize(){const canvas=this.canvas,w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight),ratio=Math.min(devicePixelRatio||1,2);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
  const ctx=this.ctx;ctx.setTransform(ratio,0,0,ratio,0,0);this.width=w;this.height=h;
 }
 project(vp,x,y,z){const m=vp,w=m[3]*x+m[7]*y+m[11]*z+m[15];if(w<=.01)return null;
  const sx=(m[0]*x+m[4]*y+m[8]*z+m[12])/w,sy=(m[1]*x+m[5]*y+m[9]*z+m[13])/w;
  return{x:(sx*.5+.5)*this.width,y:(1-(sy*.5+.5))*this.height};
 }
 draw(sim,vp){this.resize();const ctx=this.ctx;ctx.clearRect(0,0,this.width,this.height);
  for(const bullet of sim.tracers){const p=this.project(vp,bullet.ax,1.03,bullet.az),q=this.project(vp,bullet.bx,1.03,bullet.bz);if(!p||!q)continue;
   const fade=Math.min(1,bullet.ttl/.06),color=bullet.team==='player'?'255,245,145':'255,112,93';
   const t=1-bullet.ttl/bullet.life,a=Math.max(0,t-.36);
   const sx=p.x+(q.x-p.x)*a,sy=p.y+(q.y-p.y)*a,ex=p.x+(q.x-p.x)*t,ey=p.y+(q.y-p.y)*t;
   ctx.lineCap='round';ctx.strokeStyle=`rgba(${color},${fade*.30})`;ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
   ctx.strokeStyle=`rgba(${color},${fade})`;ctx.lineWidth=2.7;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
   ctx.fillStyle=`rgba(255,251,223,${fade})`;ctx.beginPath();ctx.arc(ex,ey,2.8,0,Math.PI*2);ctx.fill();
  }
  for(const eff of sim.effects){const pt=this.project(vp,eff.x,.9,eff.z);if(!pt)continue;
   const t=1-eff.ttl/eff.life;ctx.strokeStyle=`rgba(${eff.hit?'255,110,102':'251,230,174'},${(1-t)*.72})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(pt.x,pt.y,2+t*11,0,Math.PI*2);ctx.stroke();
  }
  // Readable hero tracking ring, health bar, and lightweight red enemy indicators.
  const hero=sim.player,pt=this.project(vp,hero.pos.x,.015,hero.pos.z);
  if(pt){ctx.strokeStyle='rgba(255,249,173,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pt.x,pt.y,18,7,0,0,Math.PI*2);ctx.stroke();}
  for(const a of [hero,...sim.enemies]){if(a.dead)continue;
   const q=this.project(vp,a.pos.x,2.02,a.pos.z);if(!q)continue;
   const barW=a.type==='player'?36:24,hp=Math.max(0,a.hp/a.maxHp);
   ctx.fillStyle='rgba(18,25,22,.64)';ctx.fillRect(q.x-barW/2-1,q.y,barW+2,5);
   ctx.fillStyle=a.type==='player'?'#67cf7b':'#e36b63';ctx.fillRect(q.x-barW/2,q.y+1,barW*hp,3);
  }
 }
}
