// Only world mesh construction lives here. No movement, collision, animation or UI code.
// Solid objects used by collision are defined in camp.js (BUILDINGS).
import {CAMP,BUILDINGS} from './camp.js?v=050';
const C={grass:[.665,.754,.604],grass2:[.630,.727,.572],path:[.852,.820,.722],road:[.870,.856,.762],line:[.945,.928,.834],stone:[.747,.735,.665],wall:[.858,.846,.754],trim:[.677,.566,.452],wood:[.485,.383,.301],olive:[.404,.516,.411],olive2:[.470,.573,.435],mint:[.660,.786,.737],orange:[.745,.493,.368],tan:[.794,.701,.552],dark:[.351,.457,.381],gold:[.870,.716,.414]};
const palette={
 barracks:{wall:[.854,.865,.770],roof:[.380,.494,.408],trim:[.596,.652,.553]},
 bath:{wall:[.752,.833,.780],roof:[.424,.572,.567],trim:[.589,.686,.643]},
 stores:{wall:[.788,.776,.675],roof:[.408,.476,.403],trim:[.559,.537,.426]},
 canteen:{wall:[.892,.814,.663],roof:[.638,.448,.356],trim:[.690,.534,.410]},
 shop:{wall:[.891,.841,.738],roof:[.626,.552,.389],trim:[.747,.632,.419]},
 classroom:{wall:[.848,.842,.745],roof:[.410,.534,.458],trim:[.586,.661,.545]},
 medic:{wall:[.867,.878,.778],roof:[.547,.657,.546],trim:[.608,.683,.613]},
 command:{wall:[.824,.803,.706],roof:[.444,.476,.379],trim:[.568,.554,.459]},
};
function rng(seed){return ()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}}
export function makeEnvironment(){
 const v=[],colors=[],normals=[];let triangles=0;
 function tri(a,b,c,col){const U=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],V=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];let n=[U[1]*V[2]-U[2]*V[1],U[2]*V[0]-U[0]*V[2],U[0]*V[1]-U[1]*V[0]],len=Math.hypot(...n)||1;n=n.map(i=>i/len);for(const pt of [a,b,c]){v.push(...pt);colors.push(...col);normals.push(...n)}triangles++}
 function quad(a,b,c,d,col){tri(a,b,c,col);tri(a,c,d,col)}
 function cube(x,y,z,w,h,d,col){const a=x-w/2,b=x+w/2,l=z-d/2,r=z+d/2,lo=y,hi=y+h;
  quad([a,hi,l],[a,hi,r],[b,hi,r],[b,hi,l],col);quad([a,lo,r],[a,lo,l],[b,lo,l],[b,lo,r],col);
  quad([a,lo,l],[a,hi,l],[b,hi,l],[b,lo,l],col);quad([b,lo,r],[b,hi,r],[a,hi,r],[a,lo,r],col);
  quad([a,lo,r],[a,hi,r],[a,hi,l],[a,lo,l],col);quad([b,lo,l],[b,hi,l],[b,hi,r],[b,lo,r],col)}
 function roof(x,z,w,d,y,rise,col){const a=x-w/2,b=x+w/2,l=z-d/2,r=z+d/2,P=[x,y+rise,l],Q=[x,y+rise,r],A=[a,y,l],B=[b,y,l],D=[a,y,r],E=[b,y,r];quad(A,P,Q,D,col);quad(P,B,E,Q,col);tri(A,B,P,col);tri(D,Q,E,col)}
 function oct(x,y,z,rx,ry,rz,col){const top=[x,y+ry,z],bottom=[x,y-ry,z],ring=[];for(let k=0;k<8;k++){const a=k*Math.PI/4;ring.push([x+rx*Math.cos(a),y,z+rz*Math.sin(a)])}for(let k=0;k<8;k++){let j=(k+1)%8;tri(top,ring[k],ring[j],col);tri(bottom,ring[j],ring[k],col)}}
 function tree(x,z,k=1){cube(x,-.005,z,.20*k,.69*k,.20*k,C.wood);oct(x,.90*k,z,.75*k,.74*k,.73*k,C.olive2);oct(x,1.14*k,z,.56*k,.73*k,.56*k,[.577,.696,.501])}
 function bush(x,z,s=.32){oct(x,.18*s/.32,z,s,.21*s/.32,s,[.555,.686,.486])}
 function rect(x,z,w,d,col,y=.015,ht=.035){cube(x,y-ht,z,w,ht,d,col)}
 function roundedPad(x,z,w,d,col){rect(x,z,w,d,col,.025,.055);for(const [xx,zz] of [[x-w/2+.12,z-d/2+.12],[x+w/2-.12,z+d/2-.12]])cube(xx,.012,zz,.24,.04,.24,C.line)}
 function lamp(x,z){cube(x,.02,z,.11,1.82,.11,[.416,.473,.424]);cube(x,1.78,z,.38,.11,.31,[.907,.855,.648]);cube(x,1.93,z,.45,.13,.39,C.olive)}
 function bench(x,z,alongX=true){const w=alongX?1.10:.39,d=alongX?.39:1.10;cube(x,.22,z,w,.11,d,C.wood);for(const dx of [-.36,.36])cube(x+(alongX?dx:0),.02,z+(alongX?0:dx),.11,.22,.11,C.dark);cube(x,.42,z+(alongX?.16:0),w,.40,alongX?.10:d,C.wood)}
 function sign(x,z,w=1.15){cube(x-w*.3,0,z,.12,1.28,.12,C.wood);cube(x+w*.3,0,z,.12,1.28,.12,C.wood);cube(x,.79,z,w,.50,.13,[.834,.808,.681]);cube(x,.91,z,w*.69,.07,.14,C.olive)}
 function flowerbed(x,z){rect(x,z,2.8,.87,[.692,.614,.469],.08,.13);for(let j=0;j<4;j++){bush(x-1.00+j*.65,z,.28)}}
 const R=rng(260521);
 // World ground and playable perimeter: 62x52 (previously 19x18)
 cube(0,-.28,0,CAMP.width,.26,CAMP.depth,C.grass);
 for(let i=0;i<110;i++){let x=-29.2+R()*58.4,z=-24.2+R()*48.4;
  if(Math.abs(x)<3.3||Math.abs(z-2.0)<3.4||Math.abs(z+11.3)<2.2||Math.abs(z-11.6)<2.2)continue;
  rect(x,z,.30+R()*.7,.25+R()*.55,i%2?C.grass2:[.690,.774,.626],-.010,.013);
 }
 // Main circulation (road ribbons), all connected
 rect(0,0,3.9,49,C.road,.028,.064);
 rect(0,2.0,57,3.65,C.path,.034,.076);
 rect(0,-11.4,55,3.55,C.road,.026,.061);
 rect(0,11.65,55,3.4,C.path,.026,.061);
 rect(-17.0,0,3.2,45,C.road,.027,.062);
 rect(15.1,0,3.2,44,C.road,.027,.062);
 rect(-28.4,-4.2,2.0,19,C.path,.025,.058);
 // Courtyard and plazas
 roundedPad(0,1.0,13.9,9.5,C.road);
 roundedPad(-23,-11.65,12,2.1,C.path);
 roundedPad(-10,-11.65,10,2.1,C.path);
 roundedPad(-20.0,11.7,13,2.5,C.path);
 roundedPad(22,-11.65,15,2.1,C.path);
 roundedPad(2,14.0,15,2.5,C.path);
 // Courtyard grids: paving blocks
 for(let x=-6;x<=6;x+=1.5){rect(x,1,.027,9.0,[.741,.752,.674],.054,.014)}
 for(let z=-3;z<=5;z+=1.4){rect(0,z,13.3,.027,[.741,.752,.674],.054,.014)}
 // Buildings and their modular decorations
 for(const b of BUILDINGS){let p=palette[b.kind]||palette.barracks;
  cube(b.x,.04,b.z,b.w,b.h,b.d,p.wall);
  cube(b.x,b.h-.13,b.z,b.w+.30,.18,b.d+.30,p.trim);
  roof(b.x,b.z,b.w+.64,b.d+.54,b.h+.03,.67,p.roof);
  // Door/awning faces generally toward roads
  let faceZ=b.kind==='canteen'||b.kind==='shop'||b.kind==='medic'?0:1;
  if(['canteen','shop','medic'].includes(b.kind)){
    const sx=b.entry.x>b.x?1:-1;
    cube(b.x+sx*(b.w/2+.035),.09,b.z,.13,1.50,1.12,C.wood);
    cube(b.x+sx*(b.w/2+.22),1.50,b.z,.65,.16,1.75,p.roof);
    for(const z of [b.z-b.d*.28,b.z+b.d*.28])cube(b.x+sx*(b.w/2+.03),.89,z,.15,.75,.81,C.mint);
  }else{
    const fz=b.z+b.d/2+.04;
    cube(b.x,.055,fz,.96,1.47,.13,C.wood);
    cube(b.x,1.55,fz+.22,1.75,.17,.68,p.roof);
    for(let i=-2;i<=2;i++){if(i===0)continue;const xx=b.x+i*b.w/6.8;cube(xx,.92,fz,.75,.68,.085,C.mint);cube(xx,1.30,fz+.045,.81,.08,.11,C.trim)}
  }
  cube(b.x,.06,b.z-b.d/2-.07,b.w*.58,.15,.13,p.trim);
 }
 // Parade assembly stripes, flag base and rail
 for(let z=-1.8;z<=3.5;z+=1.28)rect(0,z,11.4,.055,C.line,.061,.013);
 cube(-5.4,.055,-2.65,1.3,.29,1.3,C.stone);cube(-5.4,.32,-2.65,.12,4.9,.12,[.75,.78,.73]);
 quad([-5.32,4.85,-2.58],[-3.5,4.85,-2.58],[-3.5,3.95,-2.58],[-5.32,3.95,-2.58],[.803,.400,.363]);
 cube(-5.38,.23,-2.4,2.45,.15,1.05,C.stone);
 for(const x of [-5,5]){flowerbed(x,5.5);lamp(x,7.2)}
 // Rear firing range: safety berm, lane dividers and signs
 roundedPad(23,-17.8,14.6,8.0,[.675,.689,.560]);
 cube(23,.02,-22.0,15.5,1.65,1.05,[.610,.632,.526]);
 for(let n=0;n<5;n++){const x=18.0+n*2.5;
  rect(x,-16.0,1.95,4.9,[.752,.717,.581],.069,.025);
  cube(x,.08,-19.25,.11,1.30,.11,C.wood);
  cube(x,1.24,-19.22,1.15,.96,.12,C.line);
  cube(x,1.37,-19.12,.66,.66,.03,C.orange);
  cube(x,1.50,-19.08,.33,.33,.02,C.line);
  cube(x,1.59,-19.05,.13,.13,.02,C.dark);
  cube(x,.12,-13.75,1.23,.20,.53,C.stone);
 }
 sign(16.0,-12.2,1.20);
 // Running oval (track around grassy center)
 roundedPad(21,14.3,18.1,15.4,[.698,.769,.620]);
 const ellipse=(radx,radz,y,color)=>{const k=70,w=.82;
 for(let i=0;i<k;i++){let a=i*2*Math.PI/k,b=(i+1)*2*Math.PI/k;
  let x1=21+Math.cos(a)*radx,z1=14.3+Math.sin(a)*radz,x2=21+Math.cos(b)*radx,z2=14.3+Math.sin(b)*radz;
  let ix1=21+Math.cos(a)*(radx-w),iz1=14.3+Math.sin(a)*(radz-w),ix2=21+Math.cos(b)*(radx-w),iz2=14.3+Math.sin(b)*(radz-w);
  quad([x1,y,z1],[x2,y,z2],[ix2,y,iz2],[ix1,y,iz1],color);
 }};
 ellipse(8.2,6.65,.058,[.707,.449,.375]);ellipse(7.25,5.73,.059,[.790,.575,.450]);
 // Field center & small running/fitness equipment
 rect(21,14.3,10,5.6,[.619,.737,.561],.053,.029);
 for(const x of [16.4,19.2,22,24.8]){cube(x,.07,14.4,.11,1.14,.11,C.olive);cube(x,.07,13.1,.11,1.14,.11,C.olive);cube(x,1.20,13.7,.10,.12,1.5,C.wood)}
 // Obstacle course, earth barriers and hurdles
 roundedPad(22,.1,12.1,7.9,[.700,.718,.579]);
 for(const x of [18,20.3,22.6,24.9]){cube(x,.08,-1.6,.15,.60,2.0,C.wood);cube(x,.72,-1.6,1.9,.12,.20,C.wood)}
 for(const [x,z] of [[18,2.3],[20.6,2.0],[23.2,2.5],[26,2.2]]){
  cube(x,.03,z,1.8,.31,.60,C.tan);cube(x,.33,z,1.6,.18,.60,[.740,.669,.527]);
 }
 for(const x of [17.5,26.7]){cube(x,.04,0,.26,2.0,.26,C.wood);cube(x,2.00,0,.14,.12,2.8,C.wood)}
 // Equipment crate stacks and ladders
 for(const [x,z] of [[10,-8.1],[12,-8.8],[-11,-1.4],[-27,7.9]]){
  cube(x,.04,z,1.4,.74,.8,C.olive);cube(x,.80,z,1.46,.13,.84,C.dark);
  cube(x-.33,.04,z+.10,.13,.75,.13,C.trim)
 }
 for(let i=0;i<4;i++)cube(-27+.6*i,.04,9.2,.44,.29,.5,C.wood);
 // Gate and perimeter fence, easy to see world's edge
 for(let x=-30;x<=30;x+=2.4){
  if(Math.abs(x)>3.3){cube(x,.0,-25.55,.10,1.14,.12,C.wood);cube(x,.0,25.55,.10,1.14,.12,C.wood)}
 }
 for(let z=-24.5;z<=24.5;z+=2.4){cube(-30.45,.0,z,.10,1.10,.10,C.wood);cube(30.45,.0,z,.10,1.10,.10,C.wood)}
 for(const z of [-25.50,25.5])for(const x0 of [-17.5,17.5])cube(x0,.73,z,25,.075,.09,C.wood);
 for(const x of [-30.45,30.45])cube(x,.73,0,.10,.075,49,C.wood);
 // Guard entrance
 for(const x of [-2.35,2.35])cube(x,.0,25.35,.65,3.25,.65,C.olive);
 cube(0,3.14,25.35,5.35,.66,.70,C.olive2);
 cube(27,.08,3.5,2.3,1.78,2.10,C.wall);roof(27,3.5,2.8,2.6,1.80,.68,C.olive);
 cube(27,.72,2.45,1.20,.68,.09,C.mint);
 // Trees as boundary lines, avoid highways and footprints
 const trees=[[-28,-22],[-26,-22],[-15,-22],[-3,-22],[4,-22],[29,-23],[-29,-13],[29,-9],[-29,0],[29,7],[-29,13],[-28,22],[-26,23],[-12,23],[0,24],[12,23],[29,23],[-3,-8],[4,-7],[8,6],[-5,7],[-11,7],[-25,10],[29,-4],[-19,-1],[-4,-20],[7,8]];
 for(const [x,z] of trees)tree(x,z,.80+R()*.35);
 for(const [x,z] of [[-27,-12],[-18,-12],[-4,-12],[4,-12],[13,-12],[25,-11],[-27,12],[-14,12],[12,12],[-15,2],[-15,-7],[12,2]])lamp(x,z);
 for(const [x,z] of [[-7,8],[-8,6],[-22,10],[7,6],[10,5],[-6,-10],[6,-10],[-18,21]])bench(x,z,true);
 for(const [x,z] of [[-6,-9],[4,-9],[14,-9],[-25,4],[0,20],[-25,21]])sign(x,z,1.2);
 for(let k=0;k<35;k++){let x=-29+R()*58,z=-24+R()*48;if(BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+1.5&&Math.abs(z-b.z)<b.d/2+1.5))continue;
  if(Math.abs(x)<2.5||Math.abs(z-2)<2.6||Math.abs(z+11.4)<2.6||Math.abs(z-11.65)<2.6)continue;
  bush(x,z,.20+R()*.24);
 }
 return {verts:new Float32Array(v),cols:new Float32Array(colors),norms:new Float32Array(normals),count:v.length/3,triangles};
}
