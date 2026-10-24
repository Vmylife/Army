// Demo-only toy rifle geometry, rendered with the soldier for RifleIdle/RifleWalk.
// Later replace independently with a proper weapon GLB; no edits to the soldier mesh needed.
export function weaponMesh(){const vertices=[],colors=[];
 function box(cx,cy,cz,w,h,d,color){const [r,g,b]=color,x=cx-w/2,y=cy-h/2,z=cz-d/2,X=cx+w/2,Y=cy+h/2,Z=cz+d/2;
 const faces=[[x,y,z,X,y,z,X,Y,z,x,Y,z],[X,y,Z,x,y,Z,x,Y,Z,X,Y,Z],[x,y,Z,x,y,z,x,Y,z,x,Y,Z],[X,y,z,X,y,Z,X,Y,Z,X,Y,z],[x,Y,z,X,Y,z,X,Y,Z,x,Y,Z],[x,y,Z,X,y,Z,X,y,z,x,y,z]];
 for(const f of faces){const points=[[f[0],f[1],f[2]],[f[3],f[4],f[5]],[f[6],f[7],f[8]],[f[0],f[1],f[2]],[f[6],f[7],f[8]],[f[9],f[10],f[11]]];for(const p of points){vertices.push(...p);colors.push(r,g,b);}} }
 const metal=[.22,.27,.26],dark=[.14,.19,.19],wood=[.48,.34,.23],gold=[.65,.56,.39];
 box(0,0,0,.29,.085,.10,metal);box(-.28,.005,0,.31,.034,.037,dark);box(-.48,.006,0,.10,.048,.05,metal);
 box(.23,-.01,0,.21,.11,.08,wood);box(.37,-.02,0,.04,.15,.1,dark);
 box(.055,-.106,0,.085,.15,.074,metal);box(-.07,-.077,0,.058,.1,.067,dark);box(-.02,.066,0,.03,.065,.03,gold);box(-.4,.035,0,.08,.025,.055,wood);
 return {positions:new Float32Array(vertices),colors:new Float32Array(colors),vertexCount:vertices.length/3};
}
