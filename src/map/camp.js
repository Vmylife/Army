export const CAMP={width:19,depth:18,spawn:{x:-.1,z:2.5},enemySpawn:{x:1.9,z:.1},center:{x:0,z:0},bounds:{left:-8,right:8,top:-7,bottom:7}};
export const FEATURES=[
 {id:'barracks',label:'寢室 · 折棉被',x:-4.5,z:-3.7,r:2.5},
 {id:'range',label:'靶場 · 射擊練習',x:5.9,z:-4.4,r:2.2},
 {id:'canteen',label:'餐廳 · 集合答數',x:-4.9,z:4.8,r:2.0},
 {id:'training',label:'操場 · 跑三千',x:5.4,z:3.8,r:2.3}
];
export function clampPos(pos){return{x:Math.max(CAMP.bounds.left,Math.min(CAMP.bounds.right,pos.x)),z:Math.max(CAMP.bounds.top,Math.min(CAMP.bounds.bottom,pos.z))}}
export function pointNear(p,q,dist=2){return Math.hypot(p.x-q.x,p.z-q.z)<dist}
