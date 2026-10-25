// Standalone battle page. Existing camp exploration boot remains untouched.
const $=id=>document.getElementById(id);
const start=$('armyStart'),loading=$('armyLoading'),bar=$('armyBar');
let selected='normal';
for(const b of document.querySelectorAll('[data-mode]')){
 b.addEventListener('click',()=>{
  selected=b.dataset.mode;
  for(const other of document.querySelectorAll('[data-mode]')){
   const active=other===b;other.classList.toggle('chosen',active);other.setAttribute('aria-pressed',String(active));
  }
 });
}
window.armyBattleMode=()=>selected;
window.armySetLoading=(done,total,message)=>{
 loading.hidden=false;$('armyMessage').textContent=message;
 const percent=Math.min(99,Math.floor(100*done/Math.max(1,total)));
 bar.style.width=percent+'%';$('armyCount').textContent=percent+'%';
};
window.armyLoadComplete=()=>{
 $('armyMessage').textContent='軍營已就緒';bar.style.width='100%';$('armyCount').textContent='100%';
 document.body.classList.add('army-ready');$('armyHome').hidden=true;$('battleHUD').hidden=false;
};
window.armyLoadFailure=e=>{
 loading.hidden=false;$('armyMessage').textContent='載入失敗：'+String(e?.message||e);
 $('armyMessage').style.color='#9d332f';start.hidden=false;start.disabled=false;start.textContent='重新載入';
 start.onclick=()=>location.reload();
};
start.addEventListener('click',async()=>{
 start.disabled=true;start.hidden=true;window.armySetLoading(0,1,'準備原版軍營…');
 try{
  // Load identical camp layout, terrain patches, and light as the v0.10.5 exploration mode.
  await import('../map/layout105.js?v=105');
  await import('../lighting96.js?v=096');
  const world92=await import('../map/camp.js?v=092');
  const world93=await import('../map/camp.js?v=093');
  const removeFence=world=>{
   let n=0;
   for(let i=world.PROPS.length-1;i>=0;i--){
    const p=world.PROPS[i];
    // West side (barracks side) and south side (gate), not the basketball or eastern/northern fences.
    if(p.type==='fence' && ((p.x<=-43.5)||(p.z<=-19.1&&p.x<36))){world.PROPS.splice(i,1);n++}
   }
   return n;
  };
  console.info('戰鬥專用圍欄移除',removeFence(world92),removeFence(world93));
  await import('./campBattle111.js?v=111');
 }catch(e){console.error('軍營保衛戰載入失敗',e);window.armyLoadFailure(e);}
},{once:true});
