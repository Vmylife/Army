// Army 軍營資料：地圖大小、建築、互動地點與碰撞。不要把地點寫死在主迴圈。
export const CAMP={
 width:62,depth:52,
 spawn:{x:0,z:2.4},enemySpawn:{x:5.6,z:1.6},
 bounds:{left:-30,right:30,top:-25,bottom:25},
};
export const BUILDINGS=[
 {id:'barracksA',label:'第一連寢室',x:-22,z:-17,w:10.6,d:6.7,h:2.25,kind:'barracks',entry:{x:-22,z:-12.9}},
 {id:'barracksB',label:'第二連寢室',x:-10,z:-17,w:9.4,d:6.7,h:2.25,kind:'barracks',entry:{x:-10,z:-12.9}},
 {id:'bath',label:'浴廁',x:-25,z:-5.4,w:6.6,d:6,h:1.95,kind:'bath',entry:{x:-20.6,z:-5.4}},
 {id:'stores',label:'裝備庫',x:10,z:-17,w:9.0,d:7.3,h:2.4,kind:'stores',entry:{x:10,z:-12.5}},
 {id:'canteen',label:'大餐廳',x:-21.5,z:16,w:12.0,d:8.4,h:2.4,kind:'canteen',entry:{x:-15,z:15.2}},
 {id:'shop',label:'營站',x:-7.8,z:16.5,w:7.7,d:7.3,h:2.15,kind:'shop',entry:{x:-3.1,z:16.5}},
 {id:'classroom',label:'莒光教室',x:4.7,z:18,w:9.0,d:7.3,h:2.3,kind:'classroom',entry:{x:4.7,z:13.8}},
 {id:'medic',label:'醫務所',x:-23,z:5.9,w:7.2,d:5.3,h:1.85,kind:'medic',entry:{x:-18.5,z:5.9}},
 {id:'command',label:'連部辦公室',x:-10,z:-6.5,w:8.8,d:5.5,h:2.15,kind:'command',entry:{x:-10,z:-2.9}},
];
// 世界中的可探索點。座標為玩家能抵達的互動位置，不是建築中心。
export const FEATURES=[
 {id:'parade',label:'集合場 · 長官訓話',short:'集合場',symbol:'★',x:0,z:0,r:5.2,color:'#dfb14f'},
 {id:'barracks',label:'第一連寢室 · 折棉被',short:'第一連',symbol:'⌂',x:-22,z:-12.3,r:3.0,color:'#638b63'},
 {id:'barracks2',label:'第二連寢室 · 整理內務',short:'第二連',symbol:'⌂',x:-10,z:-12.3,r:3.0,color:'#638b63'},
 {id:'bath',label:'浴廁 · 搶時間洗澡',short:'浴廁',symbol:'●',x:-20.4,z:-5.4,r:2.3,color:'#638b63'},
 {id:'stores',label:'裝備庫 · 裝備清點',short:'裝備庫',symbol:'▣',x:10,z:-12.4,r:3,color:'#748c62'},
 {id:'range',label:'靶場 · 打靶訓練',short:'打靶場',symbol:'◎',x:23,z:-12.3,r:4,color:'#bd7d52'},
 {id:'mess',label:'餐廳 · 精神答數',short:'餐廳',symbol:'◆',x:-15,z:15.3,r:3,color:'#b78c55'},
 {id:'shop',label:'營站 · 偷懶補給',short:'營站',symbol:'$',x:-3.1,z:16.5,r:2.9,color:'#b78c55'},
 {id:'classroom',label:'莒光教室 · 軍歌',short:'教室',symbol:'▤',x:4.7,z:13.7,r:3,color:'#b78c55'},
 {id:'field',label:'操場跑道 · 跑三千',short:'操場',symbol:'◌',x:21,z:14.0,r:6.0,color:'#a97861'},
 {id:'obstacle',label:'戰技場 · 匍匐與障礙',short:'戰技場',symbol:'▲',x:22,z:0.5,r:4.2,color:'#a97861'},
 {id:'medic',label:'醫務所 · 裝病休息',short:'醫務所',symbol:'+',x:-18.3,z:5.9,r:2.5,color:'#bb756a'},
 {id:'command',label:'連部 · 長官巡視',short:'連部',symbol:'!',x:-10,z:-2.7,r:3,color:'#bb756a'},
 {id:'guard',label:'衛兵哨所 · 站哨',short:'哨所',symbol:'◇',x:27,z:1,r:2.6,color:'#aa8053'},
];
export function pointNear(p,q,dist=2){return Math.hypot(p.x-q.x,p.z-q.z)<dist}
export function clampPos(pos){return {x:Math.max(CAMP.bounds.left+.4,Math.min(CAMP.bounds.right-.4,pos.x)),z:Math.max(CAMP.bounds.top+.4,Math.min(CAMP.bounds.bottom-.4,pos.z))}}
export function collides(pos,radius=.38){
 for(const b of BUILDINGS){
  // Buildings include door facades and roof overhangs; collision only applies to solid walls.
  const dx=Math.max(Math.abs(pos.x-b.x)-(b.w/2-.1),0),dz=Math.max(Math.abs(pos.z-b.z)-(b.d/2-.1),0);
  if(dx*dx+dz*dz<radius*radius && Math.abs(pos.x-b.x)<b.w/2+radius && Math.abs(pos.z-b.z)<b.d/2+radius)return true;
 }
 return false;
}
export function moveWithCollision(pos,dx,dz){
 // Slide along a building wall instead of freezing both directions.
 let out=clampPos({x:pos.x+dx,z:pos.z});if(collides(out))out={...pos};
 let next=clampPos({x:out.x,z:out.z+dz});if(collides(next))next=out;
 return next;
}
