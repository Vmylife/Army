export function createEncounter(enemy){let hits=0,dead=false;return {
 get hits(){return hits},get dead(){return dead},
 poke(player,dist){if(dead)return {message:'敵人已倒地，按「重置敵人」讓他起來'};if(dist>3.0)return{message:'靠近紅衣敵兵再按「測試攻擊」'};
 hits++;enemy.anim.setClip(hits>=3?'Dead':'BeHit_FlyUp',{restart:true});if(hits>=3)dead=true;return{message:dead?'紅隊菜兵倒地了！':'命中！敵軍受擊 '+hits+'/3',hit:true,dead}},
 reset(){hits=0;dead=false;enemy.anim.setClip('Arise',{restart:true});return{message:'紅隊士兵已復原'}}};}
