// Army war chronicle simulator v0.12.0. Deterministic, offline, no API calls.
export const POSITIVE_TRAITS = [
 {id:'sharpshooter',name:'神槍手',desc:'射擊穩定，容易立下精準射擊戰功',mods:{aim:19,tactics:2}},
 {id:'grenadier',name:'投擲高手',desc:'擅長手榴彈與臨場投擲',mods:{grenade:24,aim:3}},
 {id:'athlete',name:'體能怪物',desc:'行軍、逃生與救援時有優勢',mods:{fitness:21,grit:6}},
 {id:'tactician',name:'戰術天才',desc:'懂得觀察局勢與保護隊友',mods:{tactics:23}},
 {id:'calm',name:'冷靜沉著',desc:'危急時更不容易慌亂',mods:{grit:15,tactics:8}},
 {id:'medic',name:'急救達人',desc:'能救援傷員、降低傷亡',mods:{medical:27,grit:3}},
 {id:'leader',name:'天生領袖',desc:'凝聚隊伍、獲得信任',mods:{social:21,tactics:7}},
 {id:'ironwill',name:'鋼鐵意志',desc:'受傷或逆境仍有機會撐下去',mods:{grit:22,fitness:4}},
 {id:'nightowl',name:'夜戰專家',desc:'夜巡和偵察較容易成功',mods:{tactics:11,aim:10}},
 {id:'lucky',name:'幸運星',desc:'命運偶爾會站在你這邊',mods:{luck:23}}
];
export const NEGATIVE_TRAITS = [
 {id:'disaster',name:'雷包',desc:'總能在最不該出錯時出錯',mods:{discipline:-19,tactics:-10}},
 {id:'clumsy',name:'笨手笨腳',desc:'裝備、工具常常跟你作對',mods:{grenade:-13,aim:-8}},
 {id:'lost',name:'路痴',desc:'地圖與方向感是最大敵人',mods:{tactics:-16}},
 {id:'coward',name:'膽小鬼',desc:'遭遇危機容易手忙腳亂',mods:{grit:-18}},
 {id:'lazy',name:'懶惰成性',desc:'能躺就不站，能不跑就不跑',mods:{fitness:-17,discipline:-9}},
 {id:'forgetful',name:'健忘症',desc:'總忘記一件很重要的東西',mods:{discipline:-22}},
 {id:'impulsive',name:'衝動派',desc:'往往先行動，後思考',mods:{tactics:-17,grit:6}},
 {id:'sensitive',name:'玻璃心',desc:'心情起伏大，容易失去鬥志',mods:{grit:-15,social:-8}},
 {id:'jinx',name:'烏鴉嘴',desc:'預感通常都很不妙',mods:{luck:-15}},
 {id:'foodie',name:'貪吃鬼',desc:'對伙食的關心勝過任何命令',mods:{discipline:-6,social:4}}
];
export const TRAITS=[...POSITIVE_TRAITS,...NEGATIVE_TRAITS];
const TRAIT_BY_ID=Object.fromEntries(TRAITS.map(t=>[t.id,t]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const chose=(a,r)=>a[Math.floor(r()*a.length)];
const chance=(r,p)=>r()<clamp(p,0,1);
function rand(seed){let t=(seed>>>0)||0x12345678;return()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
const nice=(n)=>Math.round(n);
const names=['阿哲','老張','志明','小伍','阿峰','國豪','大雄','阿翔','小陳','阿宏','阿明','阿凱'];
const places=['河谷前哨','第七補給線','荒野觀測站','山腰陣地','紅土丘陵','白石哨所','南部防區','邊境村落','霧松高地','溪口防線','北線橋頭','東側山道'];
const titles=['無線電裡的雜音','沒有人記得的夜晚','一個不太好的早晨','戰地日常','兵荒馬亂','英雄還是麻煩人物','一場意外的轉機'];
const quote=(s)=>`「${s}」`;
function statsFrom(score,chosen,r){
 const base={aim:score,grenade:score,fitness:score,tactics:score,grit:score,medical:score,discipline:score,social:score,luck:50};
 for(const [k,v] of Object.entries(base))base[k]=clamp(v+(k==='luck'?Math.round((r()-.5)*64):Math.round((r()-.5)*14)),1,100);
 for(const id of chosen){for(const [k,val] of Object.entries(TRAIT_BY_ID[id]?.mods||{}))base[k]=clamp(base[k]+val,1,100);}
 return base;
}
function newState({score,traits,name,seed},r){
 const chosen=new Set(traits);
 const stats=statsFrom(score,chosen,r),ally=chose(names.filter(n=>n!==name),r),captain=chose(['林班長','黃班長','王班長','陳班長','許排長'],r);
 return {score,name,seed,traits:chosen,stats,ally,captain,place:chose(places,r),health:100,merit:0,rank:0,injuries:0,supplies:3,confidence:55,reputation:0,flags:new Set(),used:new Set(),log:[],achievements:[],alive:true,ending:'',endType:'',month:0,warTension:0,nearMisses:0,missions:0,absurd:0,saved:0,combat:0,failures:0,items:new Set(),profession:'步槍兵',hasAlly:true,allyTrust:0,promotionMonth:0};
}
const has=(s,id)=>s.traits.has(id);
const flag=(s,id)=>s.flags.has(id);
const setflag=(s,id)=>s.flags.add(id);
const more=(s,field,amount,min=-Infinity,max=Infinity)=>{s[field]=clamp(s[field]+amount,min,max);};
const merits=(s,r,base=1)=>{const bonus=chance(r,Math.max(.04,(s.stats.tactics+s.stats.aim-90)/260))?1:0;more(s,'merit',base+bonus,0,99);more(s,'reputation',2+bonus,0,100);};
function event(id,category,weight,run,options={}){return {id,category,weight,run,...options};}
function makeMonthData(s,title,text,kind='ordinary',tags=[],additional={}){
 return {month:s.month,title,text,kind,tags,health:Math.round(s.health),merit:s.merit,rank:s.rank,...additional};
}
function buildEvents(){const E=[];const add=(...v)=>E.push(event(...v));
 // One-shot follow-ups: earlier events really alter the narrative.
 add('saved-returns','follow',65,(s,r)=>{merits(s,r,1);more(s,'health',16,0,100);setflag(s,'savedReturns');return {title:'當初被你救下的人',text:`那次在火線上被你拖回來的${s.ally}，這回發現你受困，毫不猶豫回頭救你。${s.name}忽然明白，一場戰爭的生死有時竟來自好幾個月前的一個決定。`,kind:'hero',tags:['戰友','救援']};},{requires:s=>flag(s,'savedAlly')&&!flag(s,'savedReturns')});
 add('weapon-check','follow',58,(s,r)=>{setflag(s,'checkedWeapon');more(s,'confidence',12,0,100);return {title:'那支差點害死你的槍',text:`自從上次忘記處理槍械的事，${s.name}每天都比別人多檢查兩遍。這個月全班出勤前，他居然是第一個發現武器異常的人。${s.captain}沉默半天，終於點了點頭。`,kind:'growth',tags:['成長','呼應']};},{requires:s=>flag(s,'misfire')&&!flag(s,'checkedWeapon')});
 add('pen-tank','legend',18,(s,r)=>{setflag(s,'penTank');s.absurd++;merits(s,r,4);return {title:'一支原子筆，癱瘓一輛坦克',text:`敵軍戰車在陣地外突然拋錨。現場唯一被拍到的，是${s.name}拿著那支撿來的原子筆在附近比劃，試圖做筆記。沒人說得清筆怎麼扯上關係，報告卻寫成「運用簡易文具成功解除裝甲威脅」。三個單位搶著替他立功。`,kind:'legend',tags:['傳說','荒謬','戰功']};},{requires:s=>flag(s,'foundPen')&&!flag(s,'penTank'),minMonth:4});
 add('pen-report','follow',30,(s,r)=>{setflag(s,'penReport');merits(s,r,1);return {title:'文書兵的反擊',text:`${s.name}用之前撿到的原子筆幫全連整理出錯誤百出的補給清冊。因為這份文件，部隊及時找回失蹤的物資。${s.captain}說：「你這支筆比你那張嘴可靠。」`,kind:'hero',tags:['補給','呼應']};},{requires:s=>flag(s,'foundPen')&&!flag(s,'penReport')});
 add('dog-follows','follow',50,(s,r)=>{setflag(s,'dogReturns');more(s,'confidence',10,0,100);if(chance(r,.43))merits(s,r,1);return {title:'會認人的軍犬',text:`幾個月前跟過${s.name}的那隻流浪狗，竟然一路追到新防線。牠在夜間吠叫，意外讓哨兵發現不尋常的動靜。從此全連都默許牠有一份晚餐。`,kind:'funny',tags:['戰友','呼應']};},{requires:s=>flag(s,'adoptDog')&&!flag(s,'dogReturns'),minMonth:4});
 add('lie-exposed','follow',26,(s,r)=>{setflag(s,'lieExposed');if(chance(r,.5)){more(s,'merit',-1,0,99);more(s,'confidence',-12,0,100);return {title:'戰功報告出了問題',text:`軍部複查${s.name}那份神奇戰功，才發現當初只是撞翻了一排貨箱。勳章暫時被收回，${s.captain}要求他下次務必先搞懂自己究竟做了什麼。`,kind:'bad',tags:['翻車','呼應']};}merits(s,r,1);return {title:'錯誤報告，正確結果',text:`幾個月前那場陰錯陽差的「立功」終於接受複查。雖然過程荒謬，軍部卻意外發現${s.name}確實救下了另一支部隊，決定保留他的獎勵。`,kind:'funny',tags:['荒謬','呼應']};},{requires:s=>flag(s,'fakeHero')&&!flag(s,'lieExposed'),minMonth:5});
 add('letter-home','follow',35,(s,r)=>{setflag(s,'letterReturn');more(s,'confidence',12,0,100);return {title:'家裡寄來的回信',text:`${s.name}收到一封從家鄉寄來的信，上面畫著他出發前最愛吃的便當。讀完之後，他默默把信摺好放在胸前口袋，晚上第一次睡了個安穩覺。`,kind:'quiet',tags:['家書','呼應']};},{requires:s=>flag(s,'wroteHome')&&!flag(s,'letterReturn')});
 add('saved-captain','follow',38,(s,r)=>{setflag(s,'captainReturns');merits(s,r,2);return {title:'班長記得那件事',text:`${s.captain}當初在交火時被${s.name}救下，如今主動舉薦他參加重要任務。理由只有一句：「他不一定最聰明，但關鍵時刻我信得過。」`,kind:'hero',tags:['戰友','戰功']};},{requires:s=>flag(s,'savedCaptain')&&!flag(s,'captainReturns')});
 // The ordinary catalog supports many situation-dependent outcomes.
 add('first-fire','combat',27,(s,r)=>{s.combat++;const good=chance(r,.19+s.stats.aim*.006);if(good){merits(s,r,1);return {title:'第一次真正聽見槍聲',text:`${s.name}在${s.place}第一次遇上正面交火。手心全是汗，但訓練養成的動作派上用場，他冷靜協助小隊壓制威脅。散場後，${s.ally}看他的眼神已經不太一樣。`,kind:'hero',tags:['交火','首次']};}s.failures++;return {title:'第一次真正聽見槍聲',text:`${s.name}在${s.place}第一次遭遇交火，嚇得差點把槍背反。幸好${s.captain}及時指示撤離，大家雖然狼狽，終究平安回到陣地。`,kind:'bad',tags:['交火','首次']};},{minMonth:2,requires:s=>!flag(s,'firstFire'),after:s=>setflag(s,'firstFire')});
 add('misfire','error',18,(s,r)=>{setflag(s,'misfire');s.failures++;more(s,'confidence',-9,0,100);return {title:'忘記拉槍機',text:`${s.name}在交火時才發現自己的槍沒有準備好。${has(s,'forgetful')?'這已經不是他第一次忘東忘西了。':'他一瞬間腦袋一片空白。'}幸好隊友拉他進了掩體，才沒有釀成更大的災難。`,kind:'bad',tags:['糗事','伏筆']};},{traitBoost:['forgetful','disaster','clumsy'],requires:s=>!flag(s,'misfire')});
 add('flying-mess','error',10,(s,r)=>{s.failures++;return {title:'吃飯比敵人還難對付',text:`砲聲剛響，${s.name}就端著一整盤伙食往掩體衝，結果滑倒把晚餐灑到${s.captain}身上。全班先愣住三秒，接著笑到忘記害怕。`,kind:'funny',tags:['伙食','荒謬']};},{traitBoost:['foodie','clumsy']});
 add('good-shot','combat',22,(s,r)=>{merits(s,r,2);return {title:'奇蹟般的精準一槍',text:`敵方觀測員從遠處暴露位置。${s.name}${has(s,'sharpshooter')?'像在靶場一樣屏住呼吸':'憑著一瞬間的直覺'}完成關鍵射擊，替小隊爭取撤離時間。回營後，大家把他叫作「會走路的靶紙剋星」。`,kind:'hero',tags:['射擊','戰功']};},{traitBoost:['sharpshooter','nightowl'],requires:s=>s.stats.aim>=30});
 add('missed-shot','combat',15,(s,r)=>{s.failures++;return {title:'射擊訓練的教訓',text:`${s.name}在交火時接連射偏，甚至把遠處的空罐打得叮噹響。${s.ally}一邊掩護一邊提醒他別急著扣扳機；幸好敵軍也沒有抓住這個破綻。`,kind:'bad',tags:['射擊','失誤']};},{traitBoost:['clumsy','disaster']});
 add('grenade','combat',18,(s,r)=>{merits(s,r,2);return {title:'弧線剛剛好',text:`在${s.place}的交火中，${s.name}靠一次準確投擲讓敵軍停止推進。${s.captain}拿著報告看了半天，確認那不是訓練場的假手榴彈後才放心。`,kind:'hero',tags:['投擲','戰功']};},{traitBoost:['grenadier'],requires:s=>s.stats.grenade>=30});
 add('grenade-slip','error',12,(s,r)=>{s.failures++;more(s,'confidence',-5,0,100);return {title:'投擲高手？差一點',text:`${s.name}本來打算丟出漂亮的一記投擲，沒想到一緊張把水壺拋到半空。整隊看著水壺滾進壕溝，${s.captain}默默決定先讓他練習整理裝備。`,kind:'funny',tags:['投擲','荒謬']};},{traitBoost:['clumsy','disaster']});
 add('hike','training',18,(s,r)=>{if(chance(r,s.stats.fitness/130)){merits(s,r,1);return {title:'天亮前的急行軍',text:`${s.name}背著沉重裝備翻過兩座山頭，還有餘力幫${s.ally}扛一段補給。到目的地時，連${s.captain}都忍不住問他是不是把腿換成了發動機。`,kind:'hero',tags:['體能','協助']};}more(s,'health',-3,0,100);return {title:'天亮前的急行軍',text:`${s.name}走到一半就開始懷疑人生。幸好他沒有落隊，只是到達目的地後躺在地上，宣稱自己「短暫退伍十分鐘」。`,kind:'funny',tags:['體能','日常']};},{traitBoost:['athlete','lazy']});
 add('medical','rescue',20,(s,r)=>{s.saved++;merits(s,r,1);return {title:'救護包終於派上用場',text:`${s.ally}在任務中受了傷，${s.name}立刻協助處置，等到醫護人員抵達時已穩住局面。${s.ally}說這份人情會記一輩子。`,kind:'hero',tags:['急救','戰友']};},{traitBoost:['medic'],requires:s=>s.stats.medical>34,after:s=>setflag(s,'savedAlly')});
 add('bandage','rescue',12,(s,r)=>{if(chance(r,.35+s.stats.medical*.004)){s.saved++;return {title:'一條繃帶的價值',text:`醫護人員尚未抵達，${s.name}先替一名受傷隊友做了簡單處置。這次沒有勳章，也沒有掌聲，但那名隊友後來悄悄握住了他的手。`,kind:'hero',tags:['急救','戰友']};}s.failures++;return {title:'繃帶打成了蝴蝶結',text:`${s.name}急忙拿出救護包，卻把繃帶纏成一團。軍醫接手後忍不住問：「你是在包紮還是在包禮物？」`,kind:'funny',tags:['急救','糗事']};},{traitBoost:['medic','clumsy']});
 add('captain-rescue','rescue',12,(s,r)=>{s.saved++;setflag(s,'savedCaptain');merits(s,r,2);return {title:'把班長拖回來的人',text:`${s.captain}在撤離途中倒下，${s.name}咬牙頂著混亂將他帶回安全位置。回營後，班長沒說謝謝，只是把自己珍藏的罐頭塞到他手裡。`,kind:'hero',tags:['戰友','伏筆','戰功']};},{traitBoost:['athlete','ironwill','medic'],requires:s=>!flag(s,'savedCaptain')});
 add('wrong-turn','error',15,(s,r)=>{s.failures++;setflag(s,'wrongTurn');if(chance(r,.2+s.stats.luck*.005)){merits(s,r,1);return {title:'走錯路，撞對地方',text:`${s.name}明明拿反地圖，卻陰錯陽差帶隊繞開遭伏擊的山道。${s.captain}半信半疑地問他怎麼知道的，他只回答：「我以為前面是廁所。」`,kind:'funny',tags:['迷路','意外戰功']};}return {title:'你確定這是東邊？',text:`${s.name}帶隊走錯了山路，等大家發現時已經多繞了兩個山頭。所幸任務沒有失敗，但接下來一個月他都被禁止拿地圖。`,kind:'bad',tags:['迷路','失誤']};},{traitBoost:['lost'],requires:s=>!flag(s,'wrongTurn')});
 add('map-redemption','follow',22,(s,r)=>{setflag(s,'mapRedemption');return {title:'路痴第一次看懂地圖',text:`上次走錯路後，${s.name}偷偷花了好幾個晚上研究方位。這次他居然帶全班找到捷徑。${s.ally}懷疑他是不是在地圖上偷偷畫了小抄。`,kind:'growth',tags:['迷路','成長']};},{requires:s=>flag(s,'wrongTurn')&&!flag(s,'mapRedemption')&&s.month>=6});
 add('pen','daily',9,(s,r)=>{setflag(s,'foundPen');s.items.add('原子筆');return {title:'戰場上最不起眼的寶物',text:`${s.name}在補給箱底撿到一支還能寫字的原子筆。他把它夾在口袋裡，認為總有一天會派上用場。${s.ally}笑說：「你不如去領幾顆子彈。」`,kind:'quiet',tags:['物品','伏筆']};},{requires:s=>!flag(s,'foundPen')});
 add('dog','daily',8,(s,r)=>{setflag(s,'adoptDog');return {title:'多了一名不在編制內的隊員',text:`${s.name}在營區外把半份口糧分給一隻流浪狗。牠從此每晚在門口等他，連${s.captain}都假裝沒看見。`,kind:'funny',tags:['動物','伏筆']};},{requires:s=>!flag(s,'adoptDog')});
 add('fake-hero','absurd',9,(s,r)=>{setflag(s,'fakeHero');s.absurd++;merits(s,r,2);return {title:'沒人搞懂的重大戰功',text:`${s.name}逃避一場毫無勝算的衝突時踢倒兩個補給箱，竟意外暴露敵方假陣地。隔天戰報把這件事寫成「利用後勤物資實施誘敵戰術」，連本人都不敢承認不是故意的。`,kind:'legend',tags:['荒謬','戰功','伏筆']};},{requires:s=>!flag(s,'fakeHero'),traitBoost:['disaster','lucky','clumsy']});
 add('canteen','daily',13,(s,r)=>{more(s,'confidence',8,0,100);return {title:'一碗熱湯的和平',text:`前線連續幾天缺乏熱食。${s.name}終於喝到一碗真正熱的湯，覺得自己又能再撐一個月。${has(s,'foodie')?'他甚至認真寫下了這碗湯的味道。':'大家難得安靜地吃完這頓飯。'}`,kind:'quiet',tags:['伙食','日常']};},{traitBoost:['foodie']});
 add('kitchen-war','absurd',8,(s,r)=>{s.absurd++;return {title:'史上最認真的便當保衛戰',text:`${s.name}發現補給隊把全連便當送錯地方，帶著${s.ally}追車追了半條山路。最後追回的是一箱空餐盒，卻因此順便發現一份遺失的任務文件。`,kind:'funny',tags:['伙食','荒謬']};},{traitBoost:['foodie','athlete']});
 add('night-watch','tactics',16,(s,r)=>{if(chance(r,.15+s.stats.tactics*.007)){merits(s,r,1);return {title:'半夜最清醒的人',text:`${s.name}值夜哨時察覺遠處不尋常的燈光，及時通知全隊轉移，避免了一場突襲。${s.captain}說：「這次你的眼睛比雷達還準。」`,kind:'hero',tags:['夜戰','警戒']};}return {title:'看錯的影子',text:`${s.name}在夜哨看見樹影晃動，差點以為敵軍逼近，結果是風把一件雨衣吹上樹梢。大家鬆了一口氣，他則一整夜不敢再看那棵樹。`,kind:'funny',tags:['夜戰','烏龍']};},{traitBoost:['nightowl','calm']});
 add('radio','tactics',18,(s,r)=>{if(chance(r,s.stats.tactics/125)){merits(s,r,1);return {title:'失靈的無線電',text:`無線電在關鍵時刻失去訊號，${s.name}沒有硬闖，而是迅速找到替代聯絡方式，讓隊伍順利接收撤離命令。`,kind:'hero',tags:['通訊','戰術']};}s.failures++;return {title:'無線電裡的國語課',text:`${s.name}在雜訊裡把「原地待命」聽成「原地帶麵」，全隊一度以為今晚加菜。幸好${s.ally}及時再確認命令，沒有真的抱著鍋子出發。`,kind:'funny',tags:['通訊','誤會']};},{traitBoost:['tactician','forgetful']});
 add('false-alarm','daily',17,(s,r)=>{return {title:'警報，結果是貓',text:`清晨營區忽然響起警戒聲，${s.name}立刻抓起裝備衝出帳棚。大家四處搜索半小時，最後在指揮所找到一隻踩到通訊器的野貓。`,kind:'funny',tags:['荒謬','日常']};});
 add('sleepless','daily',14,(s,r)=>{more(s,'confidence',-5,0,100);return {title:'睡不著的戰地夜晚',text:`${s.name}躺在行軍床上，聽著遠處的風聲與車輛，怎樣都睡不著。${s.ally}悄悄分給他半包餅乾，兩人誰也沒有提起白天的事。`,kind:'quiet',tags:['戰友','日常']};});
 add('letter','daily',13,(s,r)=>{setflag(s,'wroteHome');more(s,'confidence',6,0,100);return {title:'寫給家裡的一封信',text:`${s.name}拿出紙筆，寫了半天，最後只留下${quote('我還好，別擔心。')}他不知道該如何描述戰區的日子，於是把這句話寫得特別工整。`,kind:'quiet',tags:['家書','伏筆']};},{requires:s=>!flag(s,'wroteHome')});
 add('old-rifle','daily',12,(s,r)=>{if(chance(r,s.stats.discipline/120)){more(s,'confidence',4,0,100);return {title:'一把老槍',text:`${s.name}替配發的步槍仔細保養。雖然它外觀老舊，這個月整隊裝備檢查時卻只有他的槍沒有出問題。`,kind:'growth',tags:['紀律','裝備']};}s.failures++;return {title:'保養過度',text:`${s.name}拆開步槍保養時，突然發現多出一顆不知道從哪裡來的螺絲。幸好軍械士及時協助，才把整件事當成一場教訓。`,kind:'funny',tags:['裝備','糗事']};},{traitBoost:['forgetful','clumsy']});
 add('lucky-mud','absurd',11,(s,r)=>{s.absurd++;more(s,'health',3,0,100);return {title:'救命的爛泥巴',text:`${s.name}奔跑途中一頭栽進泥坑，剛好錯過一陣混亂的射擊。爬起來時全身都是泥，${s.captain}只說：「你這次摔得很有戰術價值。」`,kind:'funny',tags:['狗屎運','荒謬']};},{traitBoost:['lucky','clumsy']});
 add('discipline','daily',13,(s,r)=>{if(chance(r,s.stats.discipline/110)){merits(s,r,1);return {title:'誰把彈藥排成一條線？',text:`${s.name}主動整理混亂的彈藥清冊，讓整支小隊的補給更有效率。原本沒人注意到這件小事，直到補給長公開點名感謝他。`,kind:'hero',tags:['紀律','補給']};}s.failures++;return {title:'點名時的空白',text:`${s.name}忘了自己被派去哪一班，集合時站錯隊伍。等他終於找到位置，${s.captain}已經把他的名字唸了三遍。`,kind:'funny',tags:['紀律','糗事']};},{traitBoost:['lazy','forgetful','disaster']});
 add('ration','daily',13,(s,r)=>{more(s,'supplies',-1,0,5);if(s.supplies===0)more(s,'confidence',-5,0,100);return {title:'補給還沒來',text:`通往${s.place}的補給路線中斷，${s.name}與隊友只能把有限的罐頭分著吃。有人開始討論退伍後第一餐要吃什麼，越說越餓。`,kind:'quiet',tags:['補給','壓力']};});
 add('found-supply','supply',15,(s,r)=>{more(s,'supplies',2,0,5);more(s,'confidence',8,0,100);return {title:'補給終於抵達',text:`耽擱許久的卡車終於開進陣地。${s.name}第一件事不是找彈藥，而是確認有沒有熱水與乾淨襪子。${s.ally}笑說他終於懂得戰爭最重要的東西。`,kind:'growth',tags:['補給','日常']};});
 add('command','tactics',17,(s,r)=>{if(chance(r,s.stats.tactics/125)){merits(s,r,2);return {title:'一個臨時決定',text:`${s.captain}一時無法聯絡指揮所，${s.name}提出先撤到安全位置，再確認友軍動向。這個冷靜決定保全了小隊。`,kind:'hero',tags:['戰術','戰功']};}s.failures++;return {title:'好心辦壞事',text:`${s.name}搶著替全班安排撤離路線，結果忘記算上補給車的大小。車子被卡在小路口，所有人只好下車推了十幾分鐘。`,kind:'funny',tags:['戰術','失誤']};},{traitBoost:['tactician','impulsive','leader']});
 add('enemy-sniper','combat',15,(s,r)=>{if(chance(r,.26+s.stats.tactics*.005)){merits(s,r,1);return {title:'遠方的觀測鏡',text:`${s.name}先發現遠方一閃而過的反光，示警後成功讓全班隱蔽。沒有人知道敵方有沒有真的瞄準他們，但他們也不想再確認一次。`,kind:'hero',tags:['偵察','危機']};}return {title:'低頭的那一秒',text:`${s.name}剛彎下腰繫鞋帶，遠處就傳來急促的射擊聲。他抬頭時所有人都已趴下，事後大家都說他的鞋帶有預知能力。`,kind:'funny',tags:['驚險','狗屎運']};},{risk:'high'});
 add('rescue-map','rescue',11,(s,r)=>{s.saved++;merits(s,r,1);return {title:'遺失的醫療車',text:`一輛載著傷員的救護車迷失方向，${s.name}和${s.ally}冒著危險到岔路口引導，總算讓它平安抵達救護站。`,kind:'hero',tags:['救援','戰功']};},{traitBoost:['medic','lost','leader']});
 add('rain','daily',18,(s,r)=>{return {title:'下了一整個月的雨',text:`雨水把戰壕變成泥池，${s.name}連襪子都找不到乾的。${has(s,'athlete')?'他照樣每天做體能訓練。':'他每天都祈禱天空至少停雨一個下午。'}這個月最大的勝利，是終於把行軍床墊高了。`,kind:'quiet',tags:['氣候','日常']};});
 add('snow','daily',12,(s,r)=>{return {title:'寒流穿過了前線',text:`${s.place}夜裡冷得讓人牙齒打顫。${s.name}和${s.ally}把能找到的毯子堆成一座小山，兩人宣稱這是全戰區最先進的暖氣系統。`,kind:'quiet',tags:['氣候','日常']};});
 add('heat','daily',12,(s,r)=>{return {title:'熱到連影子都懶得動',text:`盛夏的${s.place}像一座大烤箱。${s.name}用空罐做了簡陋的小風車，沒有降溫效果，倒是讓全連笑了一整晚。`,kind:'funny',tags:['氣候','荒謬']};});
 add('tense-advance','combat',16,(s,r)=>{s.combat++;if(chance(r,.23+s.stats.tactics*.006)){merits(s,r,2);return {title:'奪回失去的前哨',text:`${s.name}與友軍重新進入一處廢棄陣地。靠著耐心偵察與彼此掩護，這次推進沒有造成重大傷亡。部隊終於能把旗子重新升上去。`,kind:'hero',tags:['戰功','推進']};}s.failures++;return {title:'進退兩難的一天',text:`${s.name}所在的部隊奉命前進，卻發現道路完全無法通行，只能原路折返。${s.captain}說至少沒有人為了面子硬闖。`,kind:'ordinary',tags:['任務','挫折']};},{risk:'medium'});
 add('withdraw','combat',14,(s,r)=>{s.combat++;more(s,'confidence',-4,0,100);return {title:'撤退不是失敗',text:`敵軍火力突然增強，${s.name}跟著全班逐段後撤。雖然丟下一些裝備，大家都還能在回營後重新點名。${s.captain}說：「人回來比較重要。」`,kind:'quiet',tags:['撤退','戰友']};},{risk:'medium'});
 add('broken-boot','error',12,(s,r)=>{s.failures++;return {title:'鞋底離家出走',text:`${s.name}行軍途中鞋底突然整片掀開，只能用膠帶纏著走。${s.ally}一路忍住不笑，直到兩人踏進營區才一起笑出來。`,kind:'funny',tags:['裝備','糗事']};},{traitBoost:['clumsy','lazy']});
 add('phone-call','daily',10,(s,r)=>{more(s,'confidence',11,0,100);return {title:'三分鐘的電話',text:`${s.name}排到短暫的通話時間。家人問他過得好不好，他只說一切順利，掛掉電話後卻站在角落安靜了好久。`,kind:'quiet',tags:['家人','日常']};});
 add('photo','daily',11,(s,r)=>{setflag(s,'photo');return {title:'全班最後一張合照？',text:`${s.captain}難得允許所有人拍張照片。${s.name}站在最旁邊，${s.ally}硬是把他拉進畫面。幾個月後，他才明白那張照片有多重要。`,kind:'quiet',tags:['戰友','紀念']};},{requires:s=>!flag(s,'photo')});
 add('lost-talisman','daily',8,(s,r)=>{if(has(s,'lucky'))more(s,'confidence',-4,0,100);return {title:'護身符不見了',text:`${s.name}發現口袋裡的小護身符消失，翻遍床底都找不到。隔天卻在軍靴裡摸到它，害他整晚懷疑是不是有人在偷偷幫忙。`,kind:'funny',tags:['運氣','日常']};},{traitBoost:['lucky']});
 add('quiet-hero','rescue',13,(s,r)=>{s.saved++;merits(s,r,1);return {title:'沒有寫進戰報的功勞',text:`整夜搶修被破壞的道路時，${s.name}替兩名筋疲力竭的隊友輪班。隔天運輸隊平安通過，沒有人知道他那晚幾乎沒睡。`,kind:'hero',tags:['救援','日常']};},{traitBoost:['ironwill','athlete','leader']});
 add('scared-brave','combat',13,(s,r)=>{s.combat++;s.saved++;merits(s,r,1);return {title:'手一直抖，腳卻沒停',text:`${s.name}在緊張到發抖的情況下，仍協助一名受傷隊友離開火線。事後他坦白自己怕得要死。${s.captain}回答：「怕也能救人，這才不簡單。」`,kind:'hero',tags:['勇氣','成長']};},{traitBoost:['coward','ironwill'],risk:'medium'});
 add('wrong-flag','absurd',8,(s,r)=>{s.absurd++;return {title:'升錯的旗子',text:`${s.name}奉命在新陣地升旗，卻拿到後勤部隊的大型餐廳布條。遠遠看去像是開了一家新餐館，敵軍偵察報告一度困惑不已。`,kind:'funny',tags:['荒謬','糗事']};},{traitBoost:['forgetful','clumsy']});
 add('paper-plane','absurd',7,(s,r)=>{s.absurd++;return {title:'紙飛機飛進了戰報',text:`一張沒用的文書被風吹進敵方觀測區，${s.name}只是追著它跑，卻意外發現一條安全小路。報告上出現了「創新空中偵察」五個字，大家都不敢笑得太大聲。`,kind:'funny',tags:['荒謬','意外戰功']};});
 add('banana','absurd',6,(s,r)=>{s.absurd++;merits(s,r,1);return {title:'香蕉皮戰術',text:`補給站一片混亂時，敵方偵察員竟踩到${s.name}剛吃完的香蕉皮而摔倒，暴露自己的位置。軍部不願公開這段細節，於是把功勞寫成「近距離警戒有功」。`,kind:'legend',tags:['荒謬','成就']};},{traitBoost:['foodie','lucky']});
 add('blanket','absurd',7,(s,r)=>{s.absurd++;return {title:'棉被比掩體更有存在感',text:`突如其來的警報讓${s.name}抱著棉被衝出寢室。那一大團棉被剛好遮住了後方燈光，讓整個隊伍得以低調轉移。回營後，班長問他是不是想申請棉被戰術教官。`,kind:'funny',tags:['棉被','荒謬']};},{traitBoost:['disaster','lucky']});
 add('snore','absurd',9,(s,r)=>{s.absurd++;return {title:'史上最大聲的打呼',text:`${s.name}的打呼聲在夜間巡邏時穿過半個陣地。敵方偵察員誤以為附近有大型機械啟動，竟主動避開這條路。${s.ally}從此堅持不准他閉嘴。`,kind:'funny',tags:['荒謬','幸運']};},{traitBoost:['lazy','lucky']});
 add('goose','absurd',7,(s,r)=>{s.absurd++;return {title:'一隻鵝守住了前線',text:`一隻不知道從哪裡跑來的鵝衝著${s.name}狂叫，他追著鵝跑了兩條街，意外引開巡邏隊注意。等整件事結束，大家決定授予那隻鵝「義務士兵」稱號。`,kind:'funny',tags:['荒謬','動物']};});
 add('pencil-bomb','absurd',6,(s,r)=>{s.absurd++;return {title:'文具也是戰略資源',text:`${s.name}把補給箱裡的彩色筆全部拿出來，在地圖上畫了一大圈。${s.captain}看不懂那堆塗鴉，卻意外發現漏標的安全路線，於是鄭重保留那張紙。`,kind:'funny',tags:['荒謬','文書']};});
 add('misheard-code','absurd',9,(s,r)=>{s.absurd++;return {title:'口令講成了菜名',text:`${s.name}把當晚口令聽成滷肉飯，值勤時真的對來人喊了這三個字。對方竟然正好也是台灣人，兩個人差點站在哨口討論要不要加滷蛋。`,kind:'funny',tags:['荒謬','伙食']};},{traitBoost:['foodie','forgetful']});
 add('accidental-negotiator','absurd',5,(s,r)=>{s.absurd++;merits(s,r,2);return {title:'雙方都以為對方要投降',text:`${s.name}在霧裡高舉白色毛巾找人借水，沒想到遠處敵軍也舉起白布示意停火。一次莫名其妙的誤會，竟替雙方換來短暫的和平。`,kind:'legend',tags:['荒謬','重大戰功']};},{requires:s=>s.month>=6});
 add('little-command','tactics',13,(s,r)=>{merits(s,r,1);return {title:'這次換你帶路',text:`${s.captain}臨時把幾名新兵交給${s.name}照看。他沒有講什麼大道理，只是不斷提醒大家保持距離、記得喝水，這趟任務居然意外順利。`,kind:'hero',tags:['領導','責任']};},{traitBoost:['leader','tactician'],requires:s=>s.rank>=1||s.stats.social>55});
 add('squad-argument','daily',15,(s,r)=>{more(s,'confidence',-3,0,100);return {title:'比敵軍更難說服的是自己人',text:`${s.name}和${s.ally}為了分配值班時間大吵一架，兩人整整半天不講話。晚上其中一人把多出來的罐頭推給對方，事情就這樣翻篇了。`,kind:'ordinary',tags:['戰友','日常']};});
 add('field-promotion','tactics',8,(s,r)=>{merits(s,r,2);return {title:'排長的一句稱讚',text:`${s.name}帶著隊伍完成一項看似不起眼的任務，意外獲得指揮官點名。${s.captain}說他已經不像剛來的那個新兵了。`,kind:'hero',tags:['軍階','責任']};},{traitBoost:['leader','calm'],requires:s=>s.month>=4});
 add('warehouse','supply',12,(s,r)=>{more(s,'supplies',2,0,5);return {title:'廢棄倉庫裡的好消息',text:`${s.name}協助查點一座空置倉庫，竟發現還能使用的醫療物資和乾淨水壺。全班最激動的不是軍醫，而是一直缺水壺的${s.ally}。`,kind:'hero',tags:['補給','幸運']};});
 add('missing-helmet','error',10,(s,r)=>{s.failures++;return {title:'我的鋼盔呢？',text:`集合前，${s.name}突然發現鋼盔不見了，找遍整排行軍床。最後它竟好端端地戴在自己頭上，${s.captain}決定不再追問。`,kind:'funny',tags:['糗事','紀律']};},{traitBoost:['forgetful','disaster']});
 add('misplaced-prize','absurd',8,(s,r)=>{s.absurd++;return {title:'勳章被拿去墊桌腳',text:`${s.name}領到一枚表揚徽章，回營卻找不到地方收藏，便暫時拿來墊不穩的桌腳。第二天督導經過時看見那張桌子，整個連隊安靜得像在開追悼會。`,kind:'funny',tags:['荒謬','戰功']};},{requires:s=>s.merit>=2});
 add('slow-recovery','medical',14,(s,r)=>{more(s,'health',12,0,100);more(s,'confidence',8,0,100);return {title:'終於能把繃帶拆下來',text:`${s.name}在醫療站休養了一段時間，舊傷終於好轉。${s.ally}帶來兩瓶汽水慶祝，說這次總算能一起正常吃飯了。`,kind:'growth',tags:['復原','戰友']};},{requires:s=>s.health<82});
 add('medical-nightmare','medical',10,(s,r)=>{more(s,'confidence',-8,0,100);return {title:'軍醫說要多休息',text:`軍醫檢查${s.name}的舊傷後，要求他減少出勤。${s.name}嘴上說沒問題，夜裡卻常夢到之前那場交火，直到${s.ally}敲敲床邊，他才清醒過來。`,kind:'quiet',tags:['傷勢','心情']};},{requires:s=>s.injuries>=1});
 add('medical-volunteer','rescue',12,(s,r)=>{s.saved++;merits(s,r,1);return {title:'醫療站最可靠的幫手',text:`${s.name}自願替臨時救護站搬運物資。一次忙碌的夜晚結束後，軍醫對他說：「有你在，今晚少慌了很多人。」`,kind:'hero',tags:['醫療','救援']};},{traitBoost:['medic','ironwill']});
 add('fierce-barrage','combat',12,(s,r)=>{s.combat++;merits(s,r,1);return {title:'火線裡的十分鐘',text:`${s.name}在密集交火中和同袍互相掩護，硬是守住撤離通道。短短十分鐘像過了幾個小時，回營後每個人都比平常安靜。`,kind:'hero',tags:['戰鬥','防線']};},{risk:'high'});
 add('tired-patrol','daily',17,(s,r)=>{return {title:'沒事發生的一個月',text:`${s.name}在${s.place}照表巡邏、填寫紀錄、等待交班。什麼轟轟烈烈的事都沒發生。對生活在戰區的人而言，這可能是這個月最值得慶祝的好消息。`,kind:'quiet',tags:['平安','日常']};});
 add('checkpoint','tactics',13,(s,r)=>{return {title:'哨口的陌生車隊',text:`一列車隊在${s.place}外等待通行，${s.name}跟著值勤人員核對資料，整整忙了半天。結果只是後勤單位走錯了集合地點，但每個人都鬆了一口氣。`,kind:'ordinary',tags:['哨口','任務']};});
 add('voice-imitation','absurd',6,(s,r)=>{s.absurd++;return {title:'班長的聲音被偷走了',text:`${s.name}在無線電上模仿${s.captain}說話，想逗隊友笑。沒想到對面的人竟然真的照辦，害他接下來花三個小時逐一解釋那些並不存在的命令。`,kind:'funny',tags:['通訊','荒謬']};},{traitBoost:['impulsive','disaster']});
 add('friendly-cooking','daily',10,(s,r)=>{more(s,'confidence',6,0,100);return {title:'只有今天，戰場像家',text:`${s.name}和幾名同袍找來一口舊鍋，把僅有的食材煮成一鍋亂七八糟的湯。味道很難形容，但誰都沒有剩下半口。`,kind:'quiet',tags:['戰友','伙食']};});
 add('rucksack','error',12,(s,r)=>{s.failures++;return {title:'不見的背包',text:`出發前三分鐘，${s.name}才發現自己的背包留在上一個駐點。${s.captain}忍住怒氣派人去拿，等他回來時，全班已經幫他取好新綽號「行李失蹤案」。`,kind:'funny',tags:['糗事','裝備']};},{traitBoost:['forgetful','lazy']});
 add('watchful-friend','rescue',10,(s,r)=>{s.saved++;return {title:'有人替你守著背後',text:`在一場緊張的巡邏中，${s.ally}及時發現${s.name}漏看的岔路，提醒大家更換路線。${s.name}拍拍他的肩，答應下次換自己照顧他。`,kind:'hero',tags:['戰友','合作']};});
 add('unexpected-medal','absurd',5,(s,r)=>{s.absurd++;merits(s,r,2);return {title:'軍部寄錯的勳章',text:`一枚勳章送到了${s.name}手裡，理由寫著「成功掩護全連撤退」。問題是他當天明明在洗碗。軍部後來承認送錯，卻因為他確實救過一名傷員，決定另外頒一面獎狀。`,kind:'funny',tags:['荒謬','戰功']};},{requires:s=>s.merit>=1});
 add('luck-candy','absurd',8,(s,r)=>{s.absurd++;return {title:'一顆糖果的命運',text:`${s.name}在巡邏前撿到一顆糖，想著等回營再吃。途中他停下來綁鞋帶，恰好避開一場小型意外。${s.ally}從此叫那顆糖「戰術糖果」。`,kind:'funny',tags:['幸運','荒謬']};},{traitBoost:['lucky']});
 add('train-rookie','daily',14,(s,r)=>{if(chance(r,.2+s.stats.social*.006)){merits(s,r,1);return {title:'新兵的第一堂課',text:`一名剛到前線的新兵緊張到發抖，${s.name}耐心陪他練習整理裝備。幾個月前還在挨罵的自己，現在竟然也能帶人了。`,kind:'growth',tags:['成長','帶兵']};}return {title:'教學相長',text:`新兵問${s.name}如何在戰場保持冷靜。他想了半天，只能回答：「我也不知道，但別忘記吃飯。」新兵似懂非懂地記進筆記本。`,kind:'funny',tags:['新兵','日常']};},{minMonth:6});
 add('rare-silence','daily',12,(s,r)=>{return {title:'沒有炮聲的星期日',text:`這是${s.name}來到戰區以來最安靜的一天。他坐在一塊石頭上看夕陽，第一次覺得日子其實可以不用一直發生大事。`,kind:'quiet',tags:['平安','心情']};});
 add('hold-bridge','combat',10,(s,r)=>{s.combat++;if(chance(r,.16+s.stats.tactics*.006)){merits(s,r,2);return {title:'守住橋頭',text:`${s.name}隨小隊守住唯一能撤離的橋頭，堅持到友軍順利通過。戰後清點名單時，${s.captain}把他的名字寫在最前面。`,kind:'hero',tags:['戰功','防線']};}return {title:'橋頭的漫長等待',text:`${s.name}在河邊守了一整夜，等待原定前來的友軍，最後接到取消任務的命令。大家拖著疲憊的腳步回營，覺得這一夜既漫長又空白。`,kind:'quiet',tags:['任務','防線']};},{risk:'high'});
 add('mission-delayed','daily',13,(s,r)=>{return {title:'又改期了',text:`${s.name}已經把裝備全部整理好，任務卻突然延期。${s.ally}開玩笑說這支部隊最大的敵人其實是排程表，${s.captain}聽見後忍不住笑了一聲。`,kind:'ordinary',tags:['任務','日常']};});
 add('rank-party','daily',8,(s,r)=>{return {title:'最不像慶祝的慶祝會',text:`小隊替${s.name}辦了一場簡陋慶祝會，禮物是一塊寫著「不要再出事」的木牌。他看著隊友們，第一次覺得自己真正在這裡有了位置。`,kind:'growth',tags:['軍階','戰友']};},{requires:s=>s.rank>=1});
 add('helmet-bowl','absurd',6,(s,r)=>{s.absurd++;return {title:'鋼盔裡的泡麵',text:`${s.name}找不到鍋子，竟想用一頂舊鋼盔裝熱水泡麵。全班一致否決這個創意，卻把它寫進了連隊最蠢提案排行榜第一名。`,kind:'funny',tags:['荒謬','伙食']};},{traitBoost:['foodie','disaster']});
 add('wrong-medical-chart','absurd',7,(s,r)=>{s.absurd++;return {title:'病歷寫成了菜單',text:`${s.name}幫軍醫整理名冊時，一不小心把「暫緩出勤」寫成「加飯一碗」。軍醫差點氣昏，受傷同袍卻表示這是整個月最美好的診斷。`,kind:'funny',tags:['荒謬','醫療']};},{traitBoost:['forgetful','foodie','clumsy']});
 add('safe-passage','tactics',12,(s,r)=>{merits(s,r,1);return {title:'不開一槍的成功任務',text:`${s.name}在任務前發現另一條安全通道，帶隊避開了可能的衝突。這一個月沒有英勇交火，卻讓所有人平安回營。`,kind:'hero',tags:['戰術','平安']};},{traitBoost:['tactician','calm','nightowl']});
 add('double-back','error',11,(s,r)=>{s.failures++;return {title:'再走一次同一條路',text:`${s.name}明明相信自己記得路，結果帶著兩名隊友繞了整整一圈，回到原本的出發點。${s.ally}指著起點的招牌問：「你是不是只是想散步？」`,kind:'funny',tags:['路痴','糗事']};},{traitBoost:['lost']});
 add('last-bullet','combat',12,(s,r)=>{s.combat++;merits(s,r,1);return {title:'只剩最後一發',text:`${s.name}在混亂中發現彈藥所剩不多，沒有貿然射擊，而是等隊友撤離後才離開陣地。雖然沒留下華麗戰功，卻把所有人都帶回來了。`,kind:'hero',tags:['危機','戰術']};},{risk:'high',traitBoost:['calm','sharpshooter']});
 add('postcard','daily',11,(s,r)=>{return {title:'一張不存在的風景明信片',text:`${s.name}在廢棄小鎮看見一張褪色的舊明信片，上面畫的是戰前繁華的街道。他沒有帶走，只默默希望這條街有一天能再恢復原本模樣。`,kind:'quiet',tags:['心情','日常']};});
 add('war-rumor','daily',13,(s,r)=>{return {title:'戰爭快結束了？',text:`軍營裡忽然傳出停戰的消息，${s.name}和隊友們整晚都在討論回家要做什麼。隔天確認只是謠言，大家失望歸失望，還是繼續完成勤務。`,kind:'quiet',tags:['戰況','日常']};});
 add('sideways-plan','tactics',11,(s,r)=>{if(chance(r,.22+s.stats.tactics*.006)){merits(s,r,1);return {title:'沒想到你還有這一招',text:`${s.name}沒有照著原本最直接的路線前進，而是提出繞道觀察。雖然多花了時間，但大家順利避開了最危險的一段道路。`,kind:'hero',tags:['戰術','戰功']};}return {title:'計畫趕不上變化',text:`${s.name}在地圖前講了半天漂亮的戰術，卻忘記山路下雨後根本無法通行。${s.captain}嘆氣說：「你很會想，下次先看天氣。」`,kind:'funny',tags:['戰術','失誤']};},{traitBoost:['tactician','impulsive']});
 add('gift','daily',10,(s,r)=>{more(s,'confidence',6,0,100);return {title:'不知道誰放的糖',text:`${s.name}在行軍床邊發現兩顆用紙包好的糖，旁邊只有一句「辛苦了」。他問了一整天都沒人承認，只好把其中一顆留給${s.ally}。`,kind:'quiet',tags:['戰友','日常']};});
 add('bad-joke','daily',12,(s,r)=>{return {title:'爛笑話救了大家一晚',text:`${s.name}在大家情緒低落時講了個冷得可怕的笑話，沒有人笑。過了三秒，${s.captain}先憋不住，最後整個帳棚都笑到拍桌。`,kind:'funny',tags:['戰友','日常']};});
 return E;
}
const EVENTS=buildEvents();
export const ENGINE_EVENT_COUNT=EVENTS.length;
function eventWeight(e,s){
 if(s.used.has(e.id))return 0;
 if(e.minMonth&&s.month<e.minMonth)return 0;
 if(e.maxMonth&&s.month>e.maxMonth)return 0;
 if(e.requires&&!e.requires(s))return 0;
 let weight=e.weight;
 if(e.category==='combat')weight*=s.warTension>0.5?1.65:1.0;
 if(e.category==='daily')weight*=s.warTension>0.7?.55:1.55;
 if(e.category==='follow')weight*=1.15;
 if(e.category==='legend')weight*=.24;
 if(e.category==='absurd')weight*=.68;
 for(const id of (e.traitBoost||[]))if(has(s,id))weight*=1.6;
 if(s.health<42&&e.risk==='high')weight*=.40;
 return weight;
}
function selectEvent(s,r){const pool=EVENTS.map(e=>({e,w:eventWeight(e,s)})).filter(v=>v.w>0);const total=pool.reduce((n,x)=>n+x.w,0);if(!total)return null;let n=r()*total;for(const x of pool){n-=x.w;if(n<=0)return x.e;}return pool[pool.length-1].e;}
function riskCheck(s,r,risk){
 if(!risk)return null;
 const power=(.27*s.stats.fitness+.26*s.stats.grit+.31*s.stats.tactics+.16*s.stats.luck)/100;
 const pressure=(risk==='high'?.145:.075)*(1.10+.40*s.warTension)*(1.45-1.24*power);
 const luck=s.stats.luck/100;
 if(chance(r,pressure*.36)){ // A rare fatal event can strike even the best soldier.
  s.alive=false;s.endType='killed';s.ending='戰場陣亡';
  return {fatal:true,text:chose([
   `但戰況突然惡化，一次無法預料的攻擊奪走了${s.name}的生命。${s.ally}把他的姓名慎重寫進部隊名冊。`,
   `就在小隊準備收隊時，意外的火力落在陣地附近。${s.name}沒能回到營區，戰友們替他保存了最後的隨身物品。`,
   `沒有人預料到這場任務會是最後一次。${s.name}在混亂中陣亡，${s.captain}親自向全班宣布這個消息。`
  ],r)};
 }
 if(chance(r,pressure*.68*(1.12-.32*luck))){const harm=12+Math.floor(r()*28);more(s,'health',-harm,0,100);s.injuries++;more(s,'confidence',-5,0,100);if(s.health<=0){s.alive=false;s.endType='killed';s.ending='戰場陣亡';return {fatal:true,text:`就在撤離途中，${s.name}因傷勢過重而離世，戰友們只能帶著他的遺物返回駐地。`};}
 return {wounded:true,text:`然而撤離時仍發生意外，${s.name}受到傷害，在醫護站接受治療。這次他記住了自己並不是每次都能如此幸運。`};}
 return null;
}
function maybeSpecial(s,r){if(!s.alive)return null;
 if(s.month>=3&&s.merit>=3&&s.rank<3&&s.merit>=([0,3,8,15][s.rank+1]||999)&&s.month-s.promotionMonth>=2){s.rank++;s.promotionMonth=s.month;return `另外，因為累積戰功與勤務表現，他被晉升為${['上兵','下士','中士'][s.rank-1]}。${s.ally}堅持要請他吃一頓。`;}
 if(s.supplies<=0&&chance(r,.2)){more(s,'supplies',1,0,5);return `這個月後半段補給終於恢復了一些，大家勉強熬過最難捱的日子。`;}
 if(s.health<60&&chance(r,.37)){more(s,'health',8+Math.floor(r()*10),0,100);return `在醫療站的休養讓他的傷勢稍有改善。`;}
 return '';
}
function achieve(s,id,label,desc){if(s.achievements.some(a=>a.id===id))return;const obj={id,label,desc,month:s.month};s.achievements.push(obj);return obj;}
function awardAchievements(s,r){const a=[];
 const give=(...args)=>{const x=achieve(s,...args);if(x)a.push(x)};
 if(s.merit>=4)give('merit4','前線新星','單次戰場人生獲得 4 點戰功');
 if(s.merit>=10)give('merit10','勳章收集狂','單次戰場人生獲得 10 點戰功');
 if(s.saved>=2)give('rescue2','不丟下任何人','至少兩次成功救援隊友');
 if(s.rank>=2)give('rank2','這也能升官？','一路晉升至下士以上');
 if(s.absurd>=3)give('absurd3','離譜事件製造機','一場戰爭發生至少三件荒謬事件');
 if(s.failures>=4)give('fail4','班長的頭痛來源','在戰區累積四次失誤');
 if(flag(s,'penTank'))give('penTank','筆比槍還強','一支原子筆竟成為裝甲部隊的噩夢');
 if(flag(s,'fakeHero'))give('fakeHero','我真的不是故意的','因為誤會而得到戰功');
 if(flag(s,'savedReturns'))give('comrade','善意會回來','曾救過的戰友反過來救了你');
 if(flag(s,'dogReturns'))give('dog','不在編制內的戰友','流浪狗成了前線警戒員');
 if(s.score<=25&&s.merit>=5)give('badhero','廢兵也能成傳奇','低評分士兵仍獲得可觀戰功');
 if(s.score>=90&&s.failures>=3)give('elitefail','戰神也會出包','高評分士兵依然犯下三次錯誤');
 if(s.score<=30&&s.month>=24&&s.alive)give('survivor24','怎麼還活著？','低評分士兵撐過 24 個月');
 return a;
}
function createIntro(s,r){const strong=s.score>=75,weak=s.score<=35;
 const starts=[
 `${s.name}跟隨${s.captain}的部隊抵達${s.place}。剛下車，${s.ally}就告訴他：「先記住回營的路，比記住敵軍在哪還重要。」`,
 `${s.name}抵達${s.place}後，第一件事是找地方放背包。${s.captain}看完他的受訓紀錄，沒有立刻說話，只派了一位老兵帶他認識陣地。`,
 `一輛載滿新兵的軍車停在${s.place}，${s.name}背著裝備踏上陌生土地。前方是戰區，後方的軍營已經看不見了。`,
 `${s.name}在${s.place}領到第一份勤務表。同一張紙上有巡邏、夜哨與補給，沒有任何一欄寫著「害怕」。`,
 `抵達前線那天，天氣好得不像戰場。${s.name}認識了同寢的${s.ally}，兩人約好無論如何都要一起回家。`
 ];
 const comment=strong?chose([`他的訓練表現相當突出，隊友們對他抱有不小期待。`,`${s.captain}看完成績說：「有本事的人更要懂得小心。」`],r):weak?chose([`他的訓練成績慘不忍睹，連背包都背得歪歪的。`,`看到他的訓練成績，${s.captain}深深吸了口氣，決定先教他不要走丟。`],r):`他的訓練成績不算驚人，但也不是墊底；真正的考驗現在才開始。`;
 return {title:'抵達戰區',text:chose(starts,r)+comment,kind:'ordinary',tags:['入伍','序章']};
}
function maybeEnding(s,r){if(!s.alive)return null;
 if(s.health<=18&&s.injuries>=2&&s.month>=3&&chance(r,.48)){
  s.endType='evacuated';s.ending='傷退歸國';s.alive=false;
  return {title:'提早退下火線',text:`軍醫判斷${s.name}的傷勢已不適合繼續留在戰區。離開前，${s.ally}幫他把背包整理好。這次不是凱旋，但至少還能親口跟家人說「我回來了」。`,kind:'ending',tags:['傷退','結局']};
 }
 // A war ending is not purely a function of the soldier's score.
 const p=s.month>=10?(s.month>=28?.080:s.month>=21?.046:s.month>=15?.020:.009):0;
 if(s.month===36||chance(r,p)){
  s.endType='survived';s.ending=s.month===36?'服役期滿，平安歸國':'停戰歸國';s.alive=false;
  const legend=s.merit>=12;
  const t=legend?`${s.name}帶著滿滿戰功與傳聞歸國。有人說他是傳奇，也有人說其中至少一半的故事太荒謬，不能相信。`:s.score<=30?`${s.name}居然真的撐到了戰爭結束。連${s.captain}都說不清這是實力還是純粹的運氣。`:`${s.name}在漫長的戰地生活後終於等到返鄉通知。他最想做的事不是接受採訪，而是好好睡上一整天。`;
  return {title:s.month===36?'第三十六個月：歸程':'停戰消息傳來',text:`防區接獲停戰與撤離命令。${t}回家路上，他想起了第一次來到${s.place}的那天。`,kind:'ending',tags:['歸國','結局']};
 }
 return null;
}
function endingExtra(s){const lived=s.endType!=='killed',month=s.month;
 const synopsis=lived?(s.merit>=12?'身經百戰的前線傳奇':s.merit>=5?'戰功累累的倖存者':s.score<=35?'不可思議的生還者':'終於返家的老兵'):s.merit>=8?'令人惋惜的前線英雄':s.score>=80?'天才也敵不過命運':'沒能回家的普通士兵';
 const epilogue=s.endType==='killed'?`他的故事停在第 ${month} 個月，卻在戰友的記憶裡繼續。`:`經歷 ${month} 個月後，他終於離開戰區。那些光榮、難堪與不可思議的經歷，都成了無法重來的人生。`;
 return {headline:synopsis,epilogue};
}
export function generateStory(config={}){
 const score=clamp(Math.round(Number(config.score)||1),1,100);
 const traits=[...new Set((Array.isArray(config.traits)?config.traits:[]).filter(x=>TRAIT_BY_ID[x]))];
 const name=(String(config.name||'阿兵哥').trim().slice(0,16)||'阿兵哥');
 const seed=(config.seed===undefined?Math.floor(Math.random()*4294967295):Number(config.seed))>>>0;
 const r=rand(seed),s=newState({score,traits,name,seed},r);
 for(let month=1;month<=36;month++){
  s.month=month;
  // Month dynamics oscillate; all scores can run into bad luck or unexpected success.
  s.warTension=clamp(.43+month*.009+Math.sin((month+seed%11)*.91)*.24+(r()-.5)*.22,0,1);
  if(month>1){if(s.health<100&&chance(r,.24))more(s,'health',4+Math.floor(r()*11),0,100);if(s.supplies<5&&chance(r,.16))more(s,'supplies',1,0,5);}
  let out=month===1?createIntro(s,r):null;
  if(month>1){const picked=selectEvent(s,r);if(picked){s.used.add(picked.id);out=picked.run(s,r);if(picked.after)picked.after(s);if(picked.category==='combat')setflag(s,'firstFire');const side=riskCheck(s,r,picked.risk||(picked.category==='combat'?'high':null));if(side){out.text+=` ${side.text}`;out.tags=[...new Set([...out.tags,side.fatal?'陣亡':'負傷'])];if(side.fatal)out.kind='death';else out.kind=out.kind==='funny'?'bad':out.kind;}}
   else out={title:'戰地日常',text:`${s.name}隨隊執行巡邏、整備與值勤，這個月平安度過。`,kind:'quiet',tags:['日常']};
  }
  if(s.alive){const extra=maybeSpecial(s,r);if(extra)out.text+=` ${extra}`;}
  let end=null;if(s.alive)end=maybeEnding(s,r);
  if(!s.alive&&s.endType==='killed'){
   out.tags=[...new Set([...out.tags,'陣亡','結局'])];
   out.kind='death';
  }
  const achievements=awardAchievements(s,r);
  const entry=makeMonthData(s,out.title,out.text,out.kind,out.tags,{achievements});
  s.log.push(entry);
  if(end){const additional=awardAchievements(s,r);s.log.push(makeMonthData(s,end.title,end.text,end.kind,end.tags,{subEvent:true,achievements:additional}));}
  if(!s.alive)break;
 }
 if(s.endType==='survived'&&s.score<=30)achieve(s,'unbelievable','什麼都不會，但就是死不了','低評分士兵活著離開戰區');
 if(s.endType==='survived'&&s.month>=36)achieve(s,'36months','三十六個月的戰地人生','活著撐過完整 36 個月');
 if(s.endType==='killed'&&s.score>=90)achieve(s,'strong-fate','神兵也有倒下的一天','訓練評分 90 分以上仍不幸陣亡');
 const summary=endingExtra(s);
 return {
  version:'0.12.0',name,score,traits,seed,stats:s.stats,place:s.place,months:s.month,ending:s.ending,endType:s.endType,headline:summary.headline,epilogue:summary.epilogue,
  merit:s.merit,rank:s.rank,health:Math.round(s.health),saved:s.saved,failures:s.failures,absurd:s.absurd,
  achievements:s.achievements,log:s.log,uniqueEvents:s.used.size
 };
}
export function storyToText(s){const selected=s.traits.map(id=>TRAIT_BY_ID[id]?.name).filter(Boolean).join('、')||'無';return [`《${s.name}的戰場人生》`,`評分：${s.score}／100`,`特質：${selected}`,`戰場期間：${s.months} 個月`,...s.log.map(e=>`第 ${e.month} 個月｜${e.title}\n${e.text}${e.achievements.length?`\n【解鎖成就】${e.achievements.map(a=>a.label).join('、')}`:''}`),`結局：${s.headline}（${s.ending}）`,`戰功：${s.merit}｜救援：${s.saved}｜荒謬事件：${s.absurd}`,`成就：${s.achievements.map(a=>a.label).join('、')||'尚無'}`,`故事種子：${s.seed}`].join('\n\n');}
