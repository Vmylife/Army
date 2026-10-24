// Army v0.7 — colorful, low-poly army camp matching the 22.0 blueprint.
// All gameplay geometry is derived from camp.js, so the two maps stay in sync.
import {CAMP,PERIMETER,ZONES,BUILDINGS} from './camp.js?v=070';
import {ROAD_EDGE_TRIANGLES,ROAD_FILL_TRIANGLES} from './roadMesh.js?v=071';
const C={
 grass:[.674,.764,.615],lightGrass:[.716,.801,.661],road:[.863,.833,.740],roadEdge:[.736,.724,.650],
 path:[.915,.878,.779],wall:[.864,.855,.746],wood:[.557,.433,.333],gold:[.872,.713,.422],
 stone:[.742,.738,.682],dark:[.306,.391,.326],ink:[.285,.355,.328],olive:[.364,.490,.373],
 sand:[.798,.716,.584],tan:[.750,.629,.492],blue:[.483,.680,.740],red:[.820,.396,.346],
 redDark:[.590,.304,.281],cream:[.963,.910,.762],iron:[.493,.556,.524],white:[.925,.927,.828],
};
const P={
 barracks:{wall:[.850,.862,.737],roof:[.377,.484,.404],trim:[.616,.690,.585]},
 office:{wall:[.802,.857,.813],roof:[.406,.550,.685],trim:[.512,.668,.742]},
 ammo:{wall:[.789,.733,.675],roof:[.513,.398,.357],trim:[.622,.488,.430]},
 chem:{wall:[.741,.818,.797],roof:[.390,.488,.484],trim:[.525,.633,.608]},
 shop:{wall:[.897,.848,.661],roof:[.555,.666,.502],trim:[.885,.766,.421]},
 canteen:{wall:[.944,.861,.701],roof:[.715,.535,.359],trim:[.889,.701,.426]},
 wash:{wall:[.800,.887,.873],roof:[.458,.657,.680],trim:[.550,.740,.747]},
 medic:{wall:[.929,.929,.856],roof:[.516,.650,.532],trim:[.850,.430,.398]},
 armory:{wall:[.764,.747,.627],roof:[.443,.501,.406],trim:[.584,.553,.416]},
 visitor:{wall:[.851,.883,.831],roof:[.525,.654,.750],trim:[.669,.766,.806]},
 guard:{wall:[.895,.848,.735],roof:[.383,.523,.414],trim:[.576,.675,.514]},
};
export function makeEnvironment(){
 const verts=[],cols=[],norms=[];let triangles=0;
 function tri(a,b,c,col){const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]],n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],l=Math.hypot(...n)||1;for(const q of [a,b,c]){verts.push(...q);cols.push(...col);norms.push(n[0]/l,n[1]/l,n[2]/l)}triangles++}
 function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
 function box(x,y,z,w,h,d,col){const l=x-w/2,r=x+w/2,n=z-d/2,s=z+d/2,t=y+h;
  quad([l,t,n],[l,t,s],[r,t,s],[r,t,n],col);quad([l,y,s],[l,y,n],[r,y,n],[r,y,s],col);
  quad([l,y,n],[l,t,n],[r,t,n],[r,y,n],col);quad([r,y,s],[r,t,s],[l,t,s],[l,y,s],col);
  quad([l,y,s],[l,t,s],[l,t,n],[l,y,n],col);quad([r,y,n],[r,t,n],[r,t,s],[r,y,s],col);
 }
 function disk(x,z,rx,rz,y,col,n=24){for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
  tri([x,y,z],[x+Math.cos(b)*rx,y,z+Math.sin(b)*rz],[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz],col)}}
 function polyXZ(points,y,col){let cx=0,cz=0;for(const p of points){cx+=p[0];cz+=p[1]}cx/=points.length;cz/=points.length;
  for(let i=0;i<points.length;i++)tri([cx,y,cz],[points[(i+1)%points.length][0],y,points[(i+1)%points.length][1]],[points[i][0],y,points[i][1]],col)}
 function roadSurface(points,y,color){
  for(let i=0;i<points.length;i+=6){
   const a=[points[i],y,points[i+1]],b=[points[i+2],y,points[i+3]],c=[points[i+4],y,points[i+5]];
   const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
   if(normalY<0)tri(a,c,b,color);else tri(a,b,c,color);
  }
 }
 function segment(ax,az,bx,bz,width,y,col){const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz)||1,px=-dz/len*width/2,pz=dx/len*width/2;
  quad([ax+px,y,az+pz],[bx+px,y,bz+pz],[bx-px,y,bz-pz],[ax-px,y,az-pz],col)}
 function strip(points,width,y,col){for(let i=0;i<points.length-1;i++){const [a,b]=[points[i],points[i+1]];segment(a[0],a[1],b[0],b[1],width,y,col)}for(const p of points)disk(p[0],p[1],width/2,width/2,y+.001,col,12)}
 function ridged(x,z,w,d,y,rise,c){const a=x-w/2,b=x+w/2,n=z-d/2,s=z+d/2,qn=[x,y+rise,n],qs=[x,y+rise,s];
  quad([a,y,n],qn,qs,[a,y,s],c);quad(qn,[b,y,n],[b,y,s],qs,c);
  tri([a,y,n],[b,y,n],qn,c);tri([a,y,s],qs,[b,y,s],c)}
 function oct(x,y,z,rad,height,color){const pts=[];for(let i=0;i<8;i++){const a=i*Math.PI/4;pts.push([x+rad*Math.cos(a),y,z+rad*Math.sin(a)])}for(let i=0;i<8;i++)tri([x,y+height,z],pts[i],pts[(i+1)%8],color)}
 function tree(x,z,k=1){box(x,.04,z,.18*k,.68*k,.18*k,C.wood);oct(x,.73*k,z,.75*k,.95*k,[.384,.548,.408]);oct(x,1.02*k,z,.57*k,.83*k,[.520,.682,.463])}
 function flowerbed(x,z){box(x,.04,z,2.8,.20,.8,C.wood);for(let i=-2;i<=2;i++){oct(x+i*.53,.19,z,.29,.33,i%2?C.olive:C.lightGrass)}}
 function lamp(x,z){box(x,.02,z,.13,1.97,.13,C.iron);box(x,1.90,z,.4,.20,.38,C.cream);box(x,2.10,z,.48,.12,.47,C.olive)}
 function bench(x,z){box(x,.31,z,1.1,.11,.35,C.wood);box(x,.04,z-.13,.10,.35,.10,C.dark);box(x,.04,z+.13,.10,.35,.10,C.dark);box(x,.54,z+.17,1.12,.42,.11,C.wood)}
 function window(x,y,z,w=.7,h=.65,d=.09){box(x,y,z,w,h,d,C.blue);box(x,y+h*.56,z+.08,w+.06,.09,.10,C.cream)}
 function door(x,y,z,w=1.05,h=1.53,d=.14){box(x,y,z,w,h,d,C.wood);box(x+.32*w,y+h*.48,z+d*.8,.07,.09,.07,C.gold)}
 function cross(x,z,y,face='x'){
  if(face==='x'){box(x,y,z,.13,.90,.23,C.red);box(x,y+.31,z,.14,.24,.85,C.red)}
  else{box(x,y,z,.26,.85,.11,C.red);box(x,y+.30,z,.89,.24,.12,C.red)}
 }
 function banner(x,z,w,y,color){box(x,y,z,w,.48,.17,color);for(let i=0;i<3;i++)box(x-w*.24+i*w*.24,y+.20,z+.10,.12,.065,.06,C.cream)}
 function vending(x,z,red=false){box(x,.05,z,.69,1.52,.56,red?C.red:C.blue);box(x,.95,z+.30,.52,.50,.04,C.white);box(x,.29,z+.3,.46,.10,.04,C.dark)}
 function target(x,z){box(x,.03,z,.10,1.48,.12,C.wood);box(x,1.18,z,.92,.76,.15,C.cream);box(x,1.35,z+.10,.46,.42,.025,C.red);box(x,1.46,z+.14,.20,.20,.025,C.dark)}
 function sandbags(x,z){for(let a=0;a<3;a++)for(let b=0;b<2;b++)box(x+a*.44,.04+b*.25,z,.42,.23,.50,b?C.tan:C.sand)}
 function obstacles(x,z){for(let k=0;k<4;k++){const xx=x+k*2.45;box(xx-.75,.03,z,.13,1.30,.15,C.wood);box(xx+.75,.03,z,.13,1.30,.15,C.wood);box(xx,1.18,z,1.62,.11,.18,C.wood)}}
 function signage(x,z,color){box(x,.06,z,.12,1.48,.12,C.wood);box(x,1.12,z,1.85,.60,.15,color);box(x,1.38,z+.10,1.12,.08,.04,C.cream)}

 // Ground (continuous and fast to render). Fence traces the blueprint's perimeter.
 box(0,-.32,0,CAMP.width,.31,CAMP.depth,C.grass);
 for(let i=0;i<PERIMETER.length;i++){
  const a=PERIMETER[i],b=PERIMETER[(i+1)%PERIMETER.length];
  const dist=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!dist)continue;
  // Entrance has a break in the southern fence near x=0.
  if(a[1]<-20&&b[1]<-20&&((a[0]<0&&b[0]>0)||(a[0]>0&&b[0]<0))){
   const t=(0-a[0])/(b[0]-a[0]),cut1=[a[0]+(b[0]-a[0])*Math.max(0,t-.05),a[1]+(b[1]-a[1])*Math.max(0,t-.05)],cut2=[a[0]+(b[0]-a[0])*Math.min(1,t+.05),a[1]+(b[1]-a[1])*Math.min(1,t+.05)];
   for(const [p,q] of [[a,cut1],[cut2,b]]){const n=Math.max(1,Math.ceil(Math.hypot(q[0]-p[0],q[1]-p[1])/2));for(let t=0;t<=n;t++){let x=p[0]+(q[0]-p[0])*t/n,z=p[1]+(q[1]-p[1])*t/n;box(x,.04,z,.10,1.08,.10,C.wood)}}continue;
  }
  const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.max(1,Math.ceil(dist/2));
  for(let t=0;t<=n;t++){const px=a[0]+dx*t/n,pz=a[1]+dz*t/n;box(px,.04,pz,.10,1.1,.10,C.wood)}
  const cnt=Math.ceil(dist/3.5);for(let t=0;t<cnt;t++){let xx=a[0]+dx*(t+.5)/cnt,zz=a[1]+dz*(t+.5)/cnt;
   segment(xx-dx/cnt*.45,zz-dz/cnt*.45,xx+dx/cnt*.45,zz+dz/cnt*.45,.045,1.10,C.dark)}
 }
 // Ground zones get unique heights to prevent coincident polygons from flickering.
 // Especially the grenade throwing area overlaps the main drill field in plan view.
 for(const zone of ZONES){const color=hex(zone.color);
  if(zone.kind==='ellipse')disk(zone.x,zone.z,zone.w/2,zone.d/2,zone.id==='grenade'?.051:.034,color,70);
  else if(zone.kind==='rect')box(zone.x,.023,zone.z,zone.w,.038,zone.d,color);
  else if(zone.kind==='poly')polyXZ(zone.points,.037,color);
 }
 // Single seamless road mesh, not overlapping rounded caps at equal depths.
 // Roads cover zones where they meet, so all crossings visibly connect.
 roadSurface(ROAD_EDGE_TRIANGLES,.089,C.roadEdge);
 roadSurface(ROAD_FILL_TRIANGLES,.094,C.road);
 // Major training grounds and decorations.
 // Drill field oval marked with one neat border, without old crosshatched tiles.
 for(let i=0;i<64;i++){let a=i*2*Math.PI/64,b=(i+1)*2*Math.PI/64;segment(-20.8+Math.cos(a)*8.7,-2+Math.sin(a)*12.4,-20.8+Math.cos(b)*8.7,-2+Math.sin(b)*12.4,.18,.076,C.redDark)}
 box(-22,.05,7.0,2.0,.36,1.3,C.tan);box(-22,.42,7,.60,.23,.55,C.redDark);  // command platform
 for(let i=0;i<5;i++)box(-28.2,.05,-3.3+i*1.8,.36,.22,.72,C.wood); // instructors' stands
 sandbags(-20,-11.2);box(-19,.05,-10.0,1.4,.11,.15,C.wood);
 // 500 meter track with 5 parallel lanes and hurdles.
 for(let i=0;i<5;i++){segment(1.2,8+i*.72,22.6,8+i*.72,.075,.084,C.white)}
 obstacles(5.2,10.0);obstacles(14.1,10.0);
 // Rifle range with silhouette targets and firing platforms.
 for(let i=0;i<6;i++){const x=2.1+i*3.4;target(x,22.15);box(x,.052,16.8,2.20,.12,1.02,C.stone)}
 box(10.7,.05,24.4,22.5,.65,.7,C.olive); // dirt berm
 // Outdoor single-combat area: scattered sandbag cover and trenches.
 for(const [x,z] of [[4,3],[9,1],[16,5],[19,1]])sandbags(x,z);
 for(let i=0;i<4;i++)box(2.2+i*5.6,.03,6.7,2.3,.26,.65,C.tan);
 for(const [x,z] of [[-4,18],[21,8],[29,8],[28,-18],[-10,-18],[-38,10]])signage(x,z,C.olive);
 // Company assembly plaza, one parade canopy and markers.
 box(15,.026,-8.2,16.2,.027,4.8,C.sand);
 for(let i=0;i<3;i++)box(7.8,.05,-9.7+i*1.2,.11,.65,.11,C.iron);
 // Fitness park. Parallel bars and pull-up bars.
 for(let i=0;i<4;i++){const x=15.9+i*2.9;box(x-.82,.04,-17,.10,1.68,.10,C.iron);box(x+.82,.04,-17,.10,1.68,.10,C.iron);box(x,1.69,-17,1.75,.10,.10,C.iron)}
 // Static training items around the site.
 for(const [x,z] of [[-41,9],[-42,-15],[28,19],[29,-5],[33,-18]])flowerbed(x,z);
 for(const [x,z] of [[-34,8],[-12,8],[-7,-4],[5,-5],[28,-3],[31,2],[12,-20]])lamp(x,z);
 for(const [x,z] of [[-32,-16],[-1,8],[27,-19],[33,13]])bench(x,z);
 // Secondary landscaping, away from walkways.
 for(const [x,z,k] of [[-42,13,1],[-43,-17,1.1],[-37,17,.9],[-28,21,1.1],[-10,23,1.0],[5,24,1],[20,25,1], [26,21,.7],[40,10,.9], [41,-11,1],[-41,-19,.8],[-31,-19,1.0],[28,-20,.9]])tree(x,z,k);
 // A distant north ridgeline: low-poly foothill, not a Meshy model.
 for(const [x,z,r,h] of [[-11,26,2.3,2.1],[-1,27,2.9,2.4],[11,26,3.1,2.7],[18,26,2.2,1.9]])oct(x,.00,z,r,h,[.466,.598,.422]);
 // Gate mast, bilingual visual without texture fonts; detailed hut in BUILDINGS below.
 for(const x of [-2.9,2.9])box(x,.02,-21.9,.41,3.3,.4,C.olive);
 box(0,3.14,-21.9,6.55,.60,.55,C.olive);
 box(0,3.56,-21.9,3.1,.10,.12,C.gold);
 box(-.7,.05,-22.0,.14,4.1,.14,C.stone);
 box(-.18,3.72,-22.0,1.1,.65,.08,C.red);

 // Simple v0.6-style houses: clean solid walls, one roof, entrance and windows.
 // Detailed Meshy architecture can be added later without changing the camp layout.
 for(const b of BUILDINGS){
  const p=P[b.kind]||P.barracks;
  box(b.x,.035,b.z,b.w,b.h,b.d,p.wall);
  box(b.x,b.h-.07,b.z,b.w+.22,.15,b.d+.22,p.trim);
  // The same modest low-poly gable roof across all buildings.
  ridged(b.x,b.z,b.w+.48,b.d+.46,b.h+.08,.39,p.roof);
  const entry=b.entry||{x:b.x,z:b.z-b.d/2-1};
  const frontX=Math.abs(entry.x-b.x)>Math.abs(entry.z-b.z);
  if(frontX){
   const sign=entry.x>=b.x?1:-1,fx=b.x+sign*(b.w/2+.065);
   box(fx,.035,b.z,.13,1.52,.94,C.wood);
   for(let k=-2;k<=2;k++){
    if(k===0)continue;
    const z=b.z+(k/3)*b.d*.78;
    box(fx,.85,z,.15,.62,.61,C.blue);
   }
  }else{
   const sign=entry.z>=b.z?1:-1,fz=b.z+sign*(b.d/2+.065);
   box(b.x,.035,fz,1.00,1.53,.13,C.wood);
   for(let k=-2;k<=2;k++){
    if(k===0)continue;
    const x=b.x+(k/3)*b.w*.77;
    box(x,.87,fz,.64,.62,.15,C.blue);
   }
  }
 }
 // Flagship military atmosphere without expensive 3D mesh imports.

 return {verts:new Float32Array(verts),cols:new Float32Array(cols),norms:new Float32Array(norms),count:verts.length/3,triangles};
}
function hex(c){return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]}
