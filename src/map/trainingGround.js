// Placeholder scene data; independent of combat and characters.
export const trainingGround={id:'recruit-yard',title:'新訓集合場',spawn:{x:0,z:0},bounds:{xmin:-3,xmax:3,zmin:-3,zmax:3},interactions:[{id:'officer',name:'長官好！',x:-1,z:-1.5},{id:'barracks',name:'折棉被',x:2,z:-1.2}]};
export function clampToMap(x,z,map=trainingGround){return {x:Math.max(map.bounds.xmin,Math.min(map.bounds.xmax,x)),z:Math.max(map.bounds.zmin,Math.min(map.bounds.zmax,z))};}
