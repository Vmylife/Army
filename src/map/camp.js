// Army v0.7 — single source of truth for 3D camp, collisions, minimap and full map.
// Coordinates: +X = east/right of reference plan, +Z = north/top.
export const CAMP = {
  width: 96, depth: 55,
  spawn: { x: 0, z: -19.4 },
  enemySpawn: { x: 17.6, z: -8.5 },
  bounds: { left: -47, right: 46, top: -24, bottom: 27 },
};

// Deliberately irregular perimeter matches the sloping north boundary and east annex.
export const PERIMETER = [
 [-45,-20],[-47,-9],[-47,5],[-43,15],[-32,19],[-12,26],
 [20,26],[25,24],[27,17],[32,13],[40,12],[44,9],[45,-10],
 [43,-14],[37,-14],[35,-20],[18,-21],[-44,-21]
];

// Roads and walkways share exactly the same coordinates in 3D and 2D maps.
// Each path is a joined polyline, with a width in game-world units.
export const ROADS = [
 {id:'gate-main', width:3.5, points:[[0,-23],[0,-17],[0,-10],[0,-3],[0,5],[0,13],[0,18]]},
 {id:'middle-east', width:3.6, points:[[0,-2],[12,-2],[25,-2],[32,-2],[41,-2]]},
 {id:'east-south', width:3.2, points:[[0,-12],[9,-12],[21,-12],[27,-12],[32,-12]]},
 {id:'north-road', width:2.9, points:[[-11,15],[-5,15],[5,15],[16,15],[27,15],[29,11]]},
 {id:'west-loop', width:3.0, points:[[-29,-18],[-35,-14],[-37,-5],[-36,7],[-31,13],[-24,15],[-14,16],[-10,13],[-10,-11],[-16,-17],[-29,-18]]},
 {id:'west-cross', width:3.1, points:[[-10,0],[-5,0],[0,0]]},
 {id:'company-east', width:2.6, points:[[0,-3],[8,-3],[25,-3],[29,-7],[29,-12]]},
 {id:'east-access', width:2.7, points:[[27,15],[28,5],[32,0],[32,-11]]},
 {id:'canteen-approach', width:2.9, points:[[32,-2],[33,2],[38,2]]},
 {id:'barrack-approach', width:2.7, points:[[-34,-8],[-39,-8]]},
 {id:'reception', width:2.4, points:[[-8,-12],[-4,-12],[0,-12]]},
];

export const ZONES = [
 {id:'drill',label:'大操場',kind:'ellipse',x:-20.8,z:-2.0,w:17.6,d:25.3,color:'#d3b08c'},
 {id:'grenade',label:'手榴彈投擲場',kind:'ellipse',x:-20.5,z:-11.0,w:8.5,d:6.9,color:'#a99b88'},
 {id:'range',label:'500公尺障礙場',kind:'rect',x:12,z:9.6,w:26.5,d:4.7,color:'#d2c39c'},
 {id:'target',label:'靶場',kind:'rect',x:10.6,z:20.0,w:22,d:6.6,color:'#b4bba0'},
 {id:'single',label:'單兵戰鬥教練場',kind:'rect',x:12,z:3.4,w:26,d:9.4,color:'#c1b18c'},
 {id:'assembly',label:'連隊集合場',kind:'rect',x:15,z:-8.2,w:19.5,d:6.9,color:'#d8bda0'},
 {id:'fitness',label:'單槓／體能訓練場',kind:'rect',x:20,z:-16.2,w:13.5,d:4.5,color:'#c4c49c'},
 {id:'smoke',label:'吸菸區',kind:'ellipse',x:-39,z:-18.1,w:7,d:4.8,color:'#95b093'},
 {id:'hill',label:'後山',kind:'poly',points:[[-12,26],[20,26],[24,24],[21,22],[-4,22]],color:'#8fa784'},
];

// Solid buildings only; pavilions & outdoor apparatus remain walkable.
export const BUILDINGS = [
 {id:'barracks', label:'營舍（連隊寢室）',x:-39.3,z:-3.1,w:8.5,d:19.2,h:2.8,kind:'barracks',entry:{x:-33.9,z:-3.1}},
 {id:'office',label:'中山室／辦公大樓',x:-20,z:14.8,w:13,d:4.7,h:3.35,kind:'office',entry:{x:-20,z:11.3}},
 {id:'ammo',label:'彈藥庫',x:22.4,z:20.1,w:5.1,d:5.1,h:2.45,kind:'ammo',entry:{x:22.4,z:16.8}},
 {id:'chem',label:'毒氣體驗室／核生化教室',x:23,z:3.2,w:6.7,d:7.1,h:2.8,kind:'chem',entry:{x:27.4,z:3.3}},
 {id:'store',label:'營站（福利社）',x:34,z:7.6,w:5.6,d:5.0,h:2.6,kind:'shop',entry:{x:34,z:4.0}},
 {id:'canteen',label:'餐廳（廚房）',x:37.3,z:-2.6,w:6.5,d:9.5,h:3.0,kind:'canteen',entry:{x:33.4,z:-2.6}},
 {id:'wash',label:'洗手／洗碗區',x:43.1,z:-4.1,w:2.8,d:5.4,h:1.55,kind:'wash',entry:{x:43.1,z:-8.0}},
 {id:'medic',label:'醫務所',x:31.5,z:-12.3,w:5.8,d:4.2,h:2.5,kind:'medic',entry:{x:28.0,z:-12.3}},
 {id:'armory',label:'軍械室',x:7.2,z:-16.2,w:6.1,d:5.1,h:2.35,kind:'armory',entry:{x:7.2,z:-12.6}},
 {id:'visitor',label:'會客室',x:-4.9,z:-15.8,w:5.3,d:4.9,h:2.35,kind:'visitor',entry:{x:-4.9,z:-12.3}},
 {id:'guard',label:'大門崗哨',x:3.7,z:-19.5,w:2.6,d:2.4,h:2.5,kind:'guard',entry:{x:1.8,z:-19.5}},
];

// Waypoints outside collision volumes. Interactions can attach later.
export const FEATURES = [
 {id:'barracks',label:'營舍 · 折棉被',short:'營舍',x:-33.9,z:-3.1,r:2.3,color:'#578260'},
 {id:'drill',label:'大操場 · 集合／唱軍歌',short:'大操場',x:-21,z:2.9,r:4,color:'#c28b5f'},
 {id:'grenade',label:'手榴彈投擲場',short:'手榴彈',x:-21,z:-11,r:3,color:'#a47e59'},
 {id:'office',label:'中山室／辦公大樓',short:'中山室',x:-20,z:11.3,r:2.5,color:'#6c8eae'},
 {id:'target',label:'靶場 · 打靶訓練',short:'靶場',x:10.7,z:16.4,r:4,color:'#a87556'},
 {id:'obstacle',label:'500公尺障礙場',short:'障礙場',x:11,z:8.0,r:3,color:'#a87556'},
 {id:'single',label:'單兵戰鬥教練場',short:'單戰場',x:12,z:2.2,r:4,color:'#b58c63'},
 {id:'chem',label:'毒氣室／核生化',short:'毒氣室',x:27.4,z:3.3,r:2,color:'#7a9793'},
 {id:'ammo',label:'彈藥庫 · 軍用品',short:'彈藥庫',x:22.4,z:16.8,r:2,color:'#b47a6f'},
 {id:'assembly',label:'連隊集合場',short:'連集合',x:16,z:-8.2,r:3,color:'#bd8b68'},
 {id:'fitness',label:'單槓／體能訓練場',short:'體能場',x:20,z:-14.0,r:3,color:'#a89053'},
 {id:'armory',label:'軍械室',short:'軍械室',x:7.2,z:-12.6,r:2.0,color:'#a79748'},
 {id:'visitor',label:'會客室',short:'會客室',x:-4.9,z:-12.3,r:2,color:'#7496b5'},
 {id:'shop',label:'營站（福利社）',short:'營站',x:34,z:4.0,r:2.3,color:'#c5ab60'},
 {id:'canteen',label:'餐廳 · 吃飯！',short:'餐廳',x:33.4,z:-2.6,r:2.5,color:'#d3b34f'},
 {id:'wash',label:'洗手／洗碗區',short:'洗碗區',x:43.1,z:-8.0,r:2,color:'#6eafc2'},
 {id:'medic',label:'醫務所',short:'醫務所',x:28.0,z:-12.3,r:2.5,color:'#c7686a'},
 {id:'smoke',label:'吸菸區',short:'吸菸區',x:-38.6,z:-18.0,r:2,color:'#689373'},
 {id:'gate',label:'大門衛哨',short:'大門',x:0,z:-20.6,r:2,color:'#9a8c5c'},
];

export function pointNear(p,q,dist=2){return Math.hypot(p.x-q.x,p.z-q.z)<dist}
export function insidePerimeter(p){let yes=false;for(let i=0,j=PERIMETER.length-1;i<PERIMETER.length;j=i++){
 const a=PERIMETER[i],b=PERIMETER[j];if(((a[1]>p.z)!==(b[1]>p.z))&&(p.x<(b[0]-a[0])*(p.z-a[1])/(b[1]-a[1])+a[0]))yes=!yes;
}return yes}
export function collides(pos,radius=.4){
 for(const b of BUILDINGS){
  const dx=Math.max(Math.abs(pos.x-b.x)-b.w/2,0),dz=Math.max(Math.abs(pos.z-b.z)-b.d/2,0);
  if(dx*dx+dz*dz<radius*radius)return true;
 }
 return false;
}
export function clampPos(pos){return {x:Math.max(CAMP.bounds.left+.6,Math.min(CAMP.bounds.right-.6,pos.x)),z:Math.max(CAMP.bounds.top+.6,Math.min(CAMP.bounds.bottom-.6,pos.z))}}
export function moveWithCollision(pos,dx,dz){
 // Separate axis sliding; avoid any wall, perimeter fence or world boundary.
 const can=p=>!collides(p)&&insidePerimeter(p);
 const first=clampPos({x:pos.x+dx,z:pos.z});const out=can(first)?first:pos;
 const second=clampPos({x:out.x,z:out.z+dz});return can(second)?second:out;
}
