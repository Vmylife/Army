import {POSITIVE_TRAITS,NEGATIVE_TRAITS,TRAITS,generateStory,storyToText,ENGINE_EVENT_COUNT} from './story-engine.js?v=0120';
const $=id=>document.getElementById(id);
const selected=new Set();
let currentStory=null,entries=[],shown=0,playing=false,speed=1,playId=0;
let lastToast;
function toast(message){const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(lastToast);lastToast=setTimeout(()=>{el.hidden=true},2400)}
function scoreDescription(score){return score<20?'超級雷兵':score<40?'欠加強的新兵':score<60?'普通新兵':score<80?'可靠老兵':score<95?'精銳士兵':'軍營傳說';}
function updateScore(){const value=Number($('scoreRange').value);$('scoreValue').textContent=value;$('scoreRating').textContent=scoreDescription(value);$('scoreRange').style.setProperty('--fill',`${(value-1)/99*100}%`);}
function renderTraits(id,traits,negative){const parent=$(id);parent.replaceChildren();for(const t of traits){const btn=document.createElement('button');btn.type='button';btn.className=`trait${negative?' negative':''}`;btn.dataset.trait=t.id;btn.setAttribute('aria-pressed','false');btn.title=t.desc;
 const check=document.createElement('span');check.className='trait-check';check.textContent='✓';check.setAttribute('aria-hidden','true');const body=document.createElement('span');body.className='trait-body';const title=document.createElement('span');title.className='trait-name';title.textContent=t.name;const desc=document.createElement('span');desc.className='trait-desc';desc.textContent=t.desc;body.append(title,desc);btn.append(check,body);
 btn.addEventListener('click',()=>{if(selected.has(t.id))selected.delete(t.id);else selected.add(t.id);updateTraits();});parent.append(btn);}}
function updateTraits(){for(const btn of document.querySelectorAll('.trait')){const active=selected.has(btn.dataset.trait);btn.classList.toggle('chosen',active);btn.setAttribute('aria-pressed',String(active));}const pc=POSITIVE_TRAITS.filter(t=>selected.has(t.id)).length,nc=NEGATIVE_TRAITS.filter(t=>selected.has(t.id)).length;$('positiveCount').textContent=`已選 ${pc}`;$('negativeCount').textContent=`已選 ${nc}`;$('selectedSummary').textContent=selected.size?`已選 ${selected.size} 項特質（正 ${pc}／負 ${nc}）`:'尚未選取特質';}
function easeScrollTo(el){const rect=el.getBoundingClientRect();if(rect.bottom>innerHeight-40&&rect.top>60&&rect.top<innerHeight*2){el.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});}}
function createMonthCard(item){const card=document.createElement('article');card.className=`month-card ${item.kind}`;
 const head=document.createElement('div');head.className='month-card-head';const month=document.createElement('span');month.className='month-num';month.textContent=`第 ${String(item.month).padStart(2,'0')} 個月${item.subEvent?' · 重大轉折':''}`;const state=document.createElement('span');state.className='month-status';state.textContent=`戰功 ${item.merit} · HP ${item.health}`;head.append(month,state);
 const title=document.createElement('h3');title.className='month-title';title.textContent=item.title;const body=document.createElement('p');body.className='month-text';body.textContent=item.text;
 const tags=document.createElement('div');tags.className='month-tags';for(const t of item.tags||[]){const s=document.createElement('span');s.textContent=t;tags.appendChild(s)}card.append(head,title,body,tags);
 if(item.achievements?.length){const unlock=document.createElement('div');unlock.className='award-unlocked';unlock.textContent='🏆 解鎖成就：'+item.achievements.map(a=>a.label).join('、');card.appendChild(unlock)}return card;}
function updateProgress(){const total=entries.length;const item=shown?entries[shown-1]:null;const month=item?.month||0;const complete=shown>=total;$('progressText').textContent=complete?`歷經 ${month} 個月 · 戰報完成`:`第 ${month||1} 個月 · 命運未定`;$('timelineFill').style.width=`${complete?100:month/36*100}%`;$('resultStatus').textContent=complete?'已完成':'逐月播報中';$('resultMerit').textContent=item?.merit||0;$('resultMonths').textContent=(month||'—')+(month?' 月':'');$('pauseBtn').disabled=complete;$('pauseBtn').textContent=playing?'暫停':'繼續';}
function stopPlayback(){playing=false;playId++;updateProgress();}
function revealNext(){if(shown>=entries.length){finish();return false}const card=createMonthCard(entries[shown++]);$('timeline').appendChild(card);updateProgress();if(shown<=3||shown===entries.length)easeScrollTo(card);if(shown>=entries.length)finish();return true;}
function finish(){playing=false;playId++;updateProgress();renderEnding();}
function schedule(token){if(!playing||token!==playId)return;setTimeout(()=>{if(!playing||token!==playId)return;const hasMore=revealNext();if(hasMore)schedule(token)},Math.round(1020/speed));}
function startPlayback(){if(shown>=entries.length)return;playing=true;playId++;updateProgress();schedule(playId);}
function revealAll(){stopPlayback();const timeline=$('timeline');const fragment=document.createDocumentFragment();while(shown<entries.length)fragment.appendChild(createMonthCard(entries[shown++]));timeline.appendChild(fragment);finish();}
function renderEnding(){if(!currentStory)return;const s=currentStory;$('endingCard').hidden=false;$('endingIcon').textContent=s.endType==='killed'?'🕯️':s.endType==='evacuated'?'🏥':s.merit>=10?'🏅':'🏠';$('endingTitle').textContent=s.headline;$('endingText').textContent=s.epilogue;
 const stats=$('endingStats');stats.replaceChildren();for(const [value,label] of [[s.months,'服役月份'],[s.merit,'累計戰功'],[s.saved,'救援次數']]){const b=document.createElement('div'),strong=document.createElement('strong'),l=document.createElement('span');strong.textContent=value;l.textContent=label;b.append(strong,l);stats.appendChild(b)}
 $('achievementCount').textContent=`共 ${s.achievements.length} 項`;
 const list=$('achievementList');list.replaceChildren();if(!s.achievements.length){const n=document.createElement('p');n.className='no-achievement';n.textContent='這次沒有解鎖成就。下一場戰爭，或許會有意想不到的結果。';list.append(n)}else for(const a of s.achievements){const div=document.createElement('div');div.className='achievement';const icon=document.createElement('div');icon.className='achievement-icon';icon.textContent='🏆';const body=document.createElement('div');const name=document.createElement('strong');name.textContent=a.label;const desc=document.createElement('span');desc.textContent=a.desc;body.append(name,desc);div.append(icon,body);list.append(div)}
 $('resultMerit').textContent=s.merit;
}
function generate({keepScroll=false}={}){stopPlayback();const name=$('soldierName').value.trim()||'阿兵哥';const score=Number($('scoreRange').value);currentStory=generateStory({name,score,traits:[...selected]});entries=currentStory.log;shown=0;speed=1;$('timeline').replaceChildren();$('endingCard').hidden=true;$('resultSection').hidden=false;$('speedBtn').textContent='1×';$('resultName').textContent=currentStory.name;$('resultScore').textContent=currentStory.score;$('resultMerit').textContent='0';$('resultMonths').textContent='—';revealNext();if(!keepScroll)$('resultSection').scrollIntoView({behavior:'smooth',block:'start'});if(shown<entries.length)startPlayback();}
async function copyStory(){if(!currentStory)return;const content=storyToText(currentStory);try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(content);}else{const t=document.createElement('textarea');t.value=content;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();if(!document.execCommand('copy'))throw Error('copy failed');t.remove();}toast('完整戰報已複製')}catch(err){toast('複製失敗，請使用下載文字紀錄');}}
function saveStory(){if(!currentStory)return;const blob=new Blob(['\ufeff'+storyToText(currentStory)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${currentStory.name.replace(/[\\/:*?"<>|]/g,'')}_戰場人生_${currentStory.seed}.txt`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('已建立文字戰報');}
renderTraits('positiveTraits',POSITIVE_TRAITS,false);renderTraits('negativeTraits',NEGATIVE_TRAITS,true);updateScore();updateTraits();
$('scoreRange').addEventListener('input',updateScore);
$('clearTraits').addEventListener('click',()=>{selected.clear();updateTraits()});
$('generateBtn').addEventListener('click',()=>generate());
$('regenerateBtn').addEventListener('click',()=>generate({keepScroll:true}));
$('revealBtn').addEventListener('click',revealAll);
$('pauseBtn').addEventListener('click',()=>{if(shown>=entries.length)return;if(playing)stopPlayback();else startPlayback();});
$('speedBtn').addEventListener('click',()=>{speed=speed===1?2:speed===2?4:1;$('speedBtn').textContent=`${speed}×`;if(playing){playId++;schedule(playId);}});
$('copyBtn').addEventListener('click',copyStory);
$('saveBtn').addEventListener('click',saveStory);
console.info(`戰場人生 v0.12.0，${ENGINE_EVENT_COUNT} 個基礎事件＋動態分支，完全離線生成`);
