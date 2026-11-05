/* 周目工作室 v0.4.0 · thirteen work items and uncertain ratings. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioGame=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=4;
  const SKILLS=[
    {id:'design',name:'策划设计',short:'策划',icon:'✦',color:'#d8b879'},
    {id:'code',name:'程序开发',short:'程序',icon:'⌘',color:'#76a9e7'},
    {id:'art',name:'美术制作',short:'美术',icon:'◈',color:'#bc9fe4'},
    {id:'test',name:'测试打磨',short:'测试',icon:'✓',color:'#80ba91'},
    {id:'ops',name:'发行事务',short:'发行',icon:'↗',color:'#dd957d'}
  ];
  const GENRES=[
    {id:'story',name:'叙事冒险',tag:'故事与氛围',icon:'✦',desc:'从一个好故事开始。注重设计与美术，技术规模较小。',req:{design:84,code:84,art:108,test:84},weights:[.38,.37,.25],title:'雨停之前',subtitle:'在一座将被遗忘的小城，收集最后一场雨的声音。'},
    {id:'action',name:'动作闯关',tag:'手感与节奏',icon:'⚔',desc:'让每一次操作都有回应。程序、测试与手感决定成败。',req:{design:84,code:120,art:84,test:108},weights:[.5,.18,.32],title:'最后一格电量',subtitle:'一台旧机器人，和它回家路上最后的一格电量。'},
    {id:'sim',name:'模拟经营',tag:'系统与深度',icon:'▦',desc:'让系统自己讲故事。设计与程序工作量更大。',req:{design:120,code:108,art:78,test:84},weights:[.5,.25,.25],title:'云端杂货铺',subtitle:'把一间小店开到云上，接待来往的奇妙旅人。'}
  ];
  const CARDS=[
    {id:'prototype',name:'纸面原型',tag:'策划',desc:'策划效率 +40%、玩法收益 +10%；程序效率 −10%。适合先验证再实现。',effect:{design:1.4,play:1.1,code:.9},unlock:0},
    {id:'modules',name:'模块化架构',tag:'程序',desc:'程序效率 +20%，扩功能技术债与后期返工减半；工具维护 +55/周。',effect:{code:1.2,debt:.5,rework:.5,fee:55},unlock:0},
    {id:'artkit',name:'强风格美术',tag:'美术',desc:'美术效率 +35%、表现收益 +15%；测试效率 −15%，需验证特殊表现。',effect:{art:1.35,visual:1.15,test:.85},unlock:0},
    {id:'autotest',name:'自动化测试',tag:'测试',desc:'测试效率 +50%，有测试人员时额外修复 2 个问题；维护 +75/周。',effect:{test:1.5,fix:2,fee:75},unlock:0},
    {id:'publisher',name:'渠道代办',tag:'发行',desc:'发行效率 +60%；代办维护 +35/周，发售净收入 −5%。',effect:{ops:1.6,fee:35,sales:.95},unlock:0},
    {id:'lean',name:'精益工作室',tag:'经营',desc:'工资 −18%、维护 −20%；所有工作效率 −10%。低投入路线。',effect:{wages:.82,overhead:.8,all:.9},unlock:0},
    {id:'pipeline',name:'协作流水线',tag:'协作',desc:'同岗额外人手效率由 45% 提到 70%；程序、美术 +10%，维护 +50/周。',effect:{crowd:.25,art:1.1,code:1.1,fee:50},unlock:80},
    {id:'retrospective',name:'每周复盘',tag:'协作',desc:'每周士气 +5、技术债 −1；所有工作效率 −8%。支持可控赶工。',effect:{all:.92,morale:5,cleanup:1},unlock:160},
    {id:'community',name:'试玩社群',tag:'口碑',desc:'测试效率 +15%、发售收入 +18%；社群运营 +50/周。',effect:{test:1.15,sales:1.18,fee:50},unlock:260},
    {id:'veteran',name:'资深协作者',tag:'团队',desc:'全体效率 +15%，转岗磨合损失减半；顾问支出 +85/周。',effect:{all:1.15,ramp:.5,fee:85},unlock:400}
  ];
  const FEATURES=[
    {id:'branch',name:'分支叙事',desc:'让选择留下回响。',cost:260,req:{design:24,code:12,art:12,test:12},play:8,visual:3,debt:4},
    {id:'combat',name:'进阶战斗',desc:'更丰富的招式与反馈。',cost:320,req:{design:12,code:30,art:12,test:24},play:11,visual:2,debt:7},
    {id:'world',name:'动态世界',desc:'让世界回应玩家。',cost:380,req:{design:24,code:30,art:18,test:24},play:10,visual:7,debt:9},
    {id:'style',name:'动态演出',desc:'为关键时刻增加表现力。',cost:280,req:{design:12,code:12,art:30,test:12},play:3,visual:11,debt:4}
  ];
  const BUFFS=[
    {id:'fund',name:'启动资助',desc:'启动资金 +900',cost:1,unlock:0},
    {id:'friend',name:'熟悉的工具',desc:'所有工作效率 +8%',cost:1,unlock:0},
    {id:'contacts',name:'行业人脉',desc:'发行效率 +25%，发售收入 +5%',cost:1,unlock:80},
    {id:'savings',name:'节约习惯',desc:'团队工资 −10%',cost:1,unlock:160},
    {id:'insight',name:'制作人直觉',desc:'游戏内容基础评级 +8',cost:2,unlock:260}
  ];
  const TEMPLATES=[
    {id:'designer',name:'灵感主策',title:'把点子变成可玩的规则',skills:{design:150,code:60,art:85,test:0,ops:75},quote:'先想清楚玩家为什么想再玩一次。',color:'#d8b879',look:0},
    {id:'engineer',name:'系统工程师',title:'用代码搭建世界',skills:{design:75,code:155,art:0,test:95,ops:50},quote:'让复杂的系统，也能稳稳运行。',color:'#76a9e7',look:1},
    {id:'artist',name:'视觉创作者',title:'为世界赋予独特气质',skills:{design:90,code:0,art:155,test:55,ops:70},quote:'让玩家一眼就记住这个世界。',color:'#bc9fe4',look:2},
    {id:'tester',name:'体验侦探',title:'从细节里找出体验的裂缝',skills:{design:70,code:80,art:45,test:160,ops:0},quote:'这个边界情况，玩家一定会遇见。',color:'#80ba91',look:3},
    {id:'producer',name:'发行制作人',title:'把作品送到对的玩家手里',skills:{design:85,code:45,art:0,test:70,ops:155},quote:'好作品，也值得被看见。',color:'#dd957d',look:4}
  ];
  const COMPANION={id:'ace',name:'阿策',title:'Codex 的化身 · 全能搭档',kind:'companion',skills:{design:145,code:145,art:145,test:145,ops:145},salary:96,quote:'你来决定方向，我来补上最需要的一块。',bio:'从第一行想法到最后一次提交，一直和你并肩。五项能力都很强，每周仍只能专注一项工作。',color:'#81bea7',look:5};
  const RECRUITS=[
    {id:'lin',name:'林绘',title:'独立美术',skills:{design:90,code:0,art:170,test:40,ops:55},salary:88,stage:'prototype',quote:'这个原型，我想给它画一片天空。',bio:'被你的可玩原型打动，擅长视觉表达，完全不会写程序。',color:'#bc9fe4',look:2},
    {id:'shen',name:'沈序',title:'引擎程序员',skills:{design:60,code:170,art:0,test:95,ops:40},salary:96,stage:'prototype',quote:'你的原型挺有意思，技术部分交给我。',bio:'喜欢有野心的系统，能承担复杂实现，不会美术制作。',color:'#76a9e7',look:1},
    {id:'tang',name:'唐砚',title:'叙事设计师',skills:{design:165,code:40,art:110,test:0,ops:75},salary:92,stage:'vertical',quote:'切片里的世界，还能再多一点回响。',bio:'看过垂直切片后主动来信，擅长设计与画面叙事，不做测试。',color:'#d8b879',look:0},
    {id:'wen',name:'温衡',title:'质量工程师',skills:{design:75,code:100,art:0,test:175,ops:65},salary:90,stage:'vertical',quote:'让每一个好设计，都能可靠地到达玩家。',bio:'相信打磨决定作品的最后一公里，擅长验收、修复与重构。',color:'#80ba91',look:3},
    {id:'xia',name:'夏禾',title:'发行联络人',skills:{design:100,code:40,art:65,test:0,ops:175},salary:84,stage:'content',quote:'内容完成了，接下来让玩家找到它。',bio:'关注到你的完整版本，熟悉资质与渠道准备，不会测试。',color:'#dd957d',look:4},
    {id:'lu',name:'陆简',title:'交付协调员',skills:{design:70,code:95,art:0,test:125,ops:135},salary:88,stage:'content',quote:'验收和上架，我们一起把最后几步走稳。',bio:'擅长测试和发行之间的协作，不会美术，适合收尾阶段。',color:'#8bbfc5',look:6}
  ];
  const GROUPS=[
    {id:'content',name:'游戏内容',rating:'可玩性',color:'#d8b879',icon:'✦'},
    {id:'framework',name:'程序构架',rating:'完善度',color:'#76a9e7',icon:'⌘'},
    {id:'commerce',name:'商业化',rating:'商业化效果',color:'#dd957d',icon:'◈'},
    {id:'promotion',name:'宣发推广',rating:'推广效果',color:'#bc9fe4',icon:'↗'},
    {id:'release',name:'上架',rating:'能否上架',color:'#80ba91',icon:'✓'}
  ];
  // Professional abilities stay on the characters; these are the thirteen actual assignments.
  const JOBS=[
    {id:'theme',name:'题材',group:'content',skill:'design',base:32,desc:'明确世界、受众与题材表达。'},
    {id:'gameplay',name:'玩法',group:'content',skill:'design',base:48,desc:'打磨规则、循环和核心体验。'},
    {id:'subtheme',name:'子主题',group:'content',skill:'art',base:40,desc:'通过画面与内容塑造独特气质。'},
    {id:'development',name:'开发进度',group:'framework',skill:'code',base:64,desc:'实现内容；可实现范围受游戏内容进度限制。'},
    {id:'systems',name:'系统协作',group:'framework',skill:'code',base:40,desc:'打通系统接口，清理技术债；需要已有实现。'},
    {id:'qa',name:'测试',group:'framework',skill:'test',base:40,desc:'验证已实现内容并修复问题。'},
    {id:'ads',name:'广告变现',group:'commerce',skill:'ops',base:32,desc:'设计广告接入与体验，影响商业化表现。'},
    {id:'payment',name:'用户付费',group:'commerce',skill:'design',base:32,desc:'设计付费价值和转化路径。'},
    {id:'ip',name:'IP衍生',group:'commerce',skill:'art',base:32,desc:'制作衍生内容与形象，扩展商业价值。'},
    {id:'publicity',name:'宣传',group:'promotion',skill:'ops',base:64,desc:'收集玩家反馈，逐步缩小四项评级的认知误差。'},
    {id:'acquisition',name:'买量',group:'promotion',skill:'ops',base:40,desc:'安排投放并消耗预算，发售时按综合真实评级回款。'},
    {id:'materials',name:'资料准备',group:'release',skill:'ops',base:40,desc:'整理上架资料，必须完成。'},
    {id:'review',name:'审核进度',group:'release',skill:'ops',base:40,desc:'资料完成后推进审核，必须完成。'}
  ].map(j=>({...j,short:j.name,color:GROUPS.find(g=>g.id===j.group).color,icon:GROUPS.find(g=>g.id===j.group).icon}));
  const GRADES=['D-','D','D+','C-','C','C+','B-','B','B+','A-','A','A+','S-','S','S+'];
  const AD_RATES=[.15,.25,.4,.55,.7,.9,1.05,1.2,1.4,1.65,1.95,2.3,2.7,3.2,3.8];
  const AD_BUDGETS=[0,100,300,600];
  const OBJECTIVES=[{id:'profit',name:'商业回报',desc:'发售后项目结余达到 ¥1,200。',bonus:40},{id:'acclaim',name:'口碑佳作',desc:'综合真实评级达到 A-。',bonus:40}];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Math.round(v*100)/100,copy=o=>JSON.parse(JSON.stringify(o));
  const task=id=>JOBS.find(j=>j.id===id),group=id=>GROUPS.find(g=>g.id===id);
  const legacy={design:'gameplay',code:'development',art:'subtheme',test:'qa',ops:'materials'};
  function random(s){s.rng=(s.rng*1664525+1013904223)>>>0;return s.rng/4294967296;}
  function genre(s){return GENRES.find(g=>g.id===s.genre);}
  function capacity(meta){return meta.exp>=260?3:2;}
  function skillLabel(n){return n===0?'不会':n>=130?'擅长':n>=80?'胜任':'生疏';}
  function taskSkill(m,id){const j=task(id);return j?m.skills[j.skill]||0:0;}
  function syncPeople(s){s.people=Object.fromEntries(JOBS.map(j=>[j.id,s.team.filter(m=>m.job===j.id).length]));s.reserve=s.team.filter(m=>m.job==='idle').length;}
  function makeMember(def,job){return {...copy(def),job,lastJob:job,kind:def.kind||'partner'};}
  function preferredJob(m){return ({design:'gameplay',code:'development',art:'subtheme',test:'qa',ops:'ads'})[SKILLS.reduce((a,j)=>m.skills[j.id]>m.skills[a]?j.id:a,'design')];}
  function createTeam(config){const t=TEMPLATES.find(t=>t.id===(config.template||'designer'));if(!t)throw Error('请选择有效的主角模板');const hero=makeMember({...t,id:'hero',template:t.id,name:String(config.heroName||'你').trim().slice(0,12)||'你',title:t.name,kind:'hero',salary:72,bio:t.title},preferredJob(t));return [hero,makeMember(COMPANION,hero.job==='gameplay'?'development':'gameplay')];}
  function addLog(s,text,kind='info'){s.logs.unshift({week:s.week,text,kind});s.logs=s.logs.slice(0,90);}
  function blocked(s){return s.over||!!s.pendingEvent||!!s.pendingCards;}
  function assignMember(s,id,job){const m=s.team.find(m=>m.id===id);if(blocked(s)||!m||job!=='idle'&&taskSkill(m,job)<=0)return false;m.job=job;syncPeople(s);return true;}
  function availableRecruits(s){return RECRUITS.filter(r=>s.milestones.includes(r.stage)&&!s.team.some(m=>m.id===r.id)&&!s.departed.includes(r.id));}
  function teamSize(s){return s.team.length;}
  function hire(s,id){const r=availableRecruits(s).find(r=>r.id===id);if(!r||blocked(s)||s.managed||s.team.length>=8||s.money<180)return false;const m=makeMember(r,preferredJob(r));m.lastJob='idle';s.team.push(m);syncPeople(s);s.money-=180;s.spent+=180;s.managed=true;addLog(s,r.name+'加入团队，基础周薪 ¥'+r.salary+'；准备支出 ¥180。','good');return true;}
  function downsize(s,id){const m=s.team.find(m=>m.id===id);if(!m||m.kind!=='partner'||blocked(s)||s.managed||s.money<100)return false;s.team=s.team.filter(m=>m.id!==id);s.departed.push(id);syncPeople(s);s.money-=100;s.spent+=100;s.managed=true;addLog(s,'与'+m.name+'暂别，支付 ¥100；本项目不再重复邀请。');return true;}
  function mods(s){const m={all:1,design:1,code:1,art:1,test:1,ops:1,play:1,visual:1,debt:1,rework:1,overhead:1,wages:1,ramp:1,crowd:.45,fix:0,morale:0,cleanup:0,fee:0,sales:1};
    s.cards.forEach(id=>{const c=CARDS.find(c=>c.id===id);if(c)Object.entries(c.effect).forEach(([k,v])=>{if(['fix','morale','fee','crowd','cleanup'].includes(k))m[k]+=v;else m[k]*=v;});});
    if(s.buffs.includes('friend'))m.all*=1.08;if(s.buffs.includes('contacts')){m.ops*=1.25;m.sales*=1.05;}
    s.effects.forEach(e=>{if(e.weeks>0){m.all*=e.all||1;if(e.job)m[e.job]*=e.mult||1;}});return m;
  }
  function campaignCost(s){return s.people.acquisition>0?s.adBudget:0;}
  function cost(s){const m=mods(s),wages=Math.ceil(s.team.reduce((n,p)=>n+p.salary,0)*(s.hard?1.15:1)*(s.buffs.includes('savings')?.9:1)*m.wages),overhead=Math.ceil((90+s.features.length*22+s.debt*2+Math.max(0,s.team.length-4)**2*12)*m.overhead),ads=campaignCost(s);return {wages,overhead,tools:m.fee,ads,total:wages+overhead+m.fee+ads};}
  function progress(s,id){return s.req[id]>0?clamp(s.work[id]/s.req[id],0,1):0;}
  function groupProgress(s,id){const list=JOBS.filter(j=>j.group===id);return list.reduce((a,j)=>a+progress(s,j.id),0)/list.length;}
  function coreProgress(s){return (groupProgress(s,'content')+groupProgress(s,'framework'))/2;}
  function coreReady(s){return JOBS.filter(j=>['content','framework'].includes(j.group)).every(j=>progress(s,j.id)>=1);}
  function complete(s){return progress(s,'materials')>=1&&progress(s,'review')>=1;}
  function goals(s){return ['materials','review'].map(id=>({name:task(id).name,ok:progress(s,id)>=1,value:Math.floor(progress(s,id)*100)+'%'}));}
  function canRelease(s){return !s.over&&!s.pendingEvent&&!s.pendingCards&&complete(s);}
  function memberOutput(s,id){const member=s.team.find(p=>p.id===id);if(!member||member.job==='idle'||member.job==='acquisition'&&s.adBudget===0)return 0;const j=task(member.job),m=mods(s),ordered=s.team.filter(p=>p.job===j.id).map(p=>({id:p.id,n:taskSkill(p,j.id)/100*(p.job!==p.lastJob?1-.2*m.ramp:1)})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id)),i=ordered.findIndex(p=>p.id===id),debt=j.skill==='code'?Math.max(.6,1-s.debt*.01):1,freeze=s.designLocked&&['code','art'].includes(j.skill)?1.12:1;return round(ordered[i].n*(i?m.crowd:1)*10*(s.focus===j.id?1.5:1)*m.all*m[j.skill]*(s.pace==='crunch'?1.35:s.pace==='rest'?.7:1)*(.65+s.morale/285)*debt*freeze);}
  function throughput(s,id){return round(s.team.filter(p=>p.job===id).reduce((n,p)=>n+memberOutput(s,p.id),0));}
  function workLimit(s,id){if(id==='development')return s.req[id]*Math.min(1,.2+groupProgress(s,'content')*.8);if(id==='systems')return s.req[id]*Math.min(1,.2+progress(s,'development'));if(id==='qa')return s.req[id]*Math.min(progress(s,'development'),.2+progress(s,'systems'));if(id==='review')return progress(s,'materials')>=1?s.req.review:0;return s.req[id];}
  function setAdBudget(s,n){if(blocked(s)||!AD_BUDGETS.includes(n))return false;s.adBudget=n;return true;}
  function gradeIndex(value){return clamp(Math.floor(clamp(value,0,100)/100*15),0,14);}
  function grade(value){return GRADES[gradeIndex(value)];}
  function trueScore(s,id){if(id==='release')return groupProgress(s,id)*100;const p=groupProgress(s,id);const featureBonus=s.features.reduce((a,k)=>{const f=FEATURES.find(f=>f.id===k);return a+(id==='content'?(f.play+f.visual)*featureFit(s,k)*.13:0);},0);let n=10+p*65+s.ratingRolls[id]+s.ratingBonus[id]+featureBonus;
    if(id==='content')n+=(mods(s).play-1)*8+(mods(s).visual-1)*8;
    if(id==='framework')n-=s.bugs*.3+s.debt*.18;return round(clamp(n,0,100));}
  function overallScore(s){return round(trueScore(s,'content')*.4+trueScore(s,'framework')*.3+trueScore(s,'commerce')*.2+trueScore(s,'promotion')*.1);}
  function revealLevel(s){const p=progress(s,'publicity');return p>=1?5:p>=.75?4:p>=.5?3:p>=.25?2:p>0?1:0;}
  function ratingView(s,id,force=false){const level=force||s.over&&s.result?.released?5:revealLevel(s);if(!level)return {id,level:0,text:'?????',low:0,high:100,lowGrade:'D-',highGrade:'S+',exact:false,questions:5};
    const actual=gradeIndex(trueScore(s,id)),radius=(5-level)*2,estimate=clamp(actual+Math.round(s.revealRolls[id]*radius),0,14),lo=clamp(estimate-radius,0,14),hi=clamp(estimate+radius,0,14),text=(level<4?GRADES[estimate][0]:GRADES[estimate])+'?'.repeat(5-level);
    return {id,level,text,low:lo/15*100,high:Math.min(100,(hi+1)/15*100-0.0001),lowGrade:GRADES[lo],highGrade:GRADES[hi],exact:level===5,questions:5-level};}
  function overallView(s,force=false){const views=GROUPS.filter(g=>g.id!=='release').map(g=>ratingView(s,g.id,force)),weights=[.4,.3,.2,.1],low=views.reduce((n,v,i)=>n+v.low*weights[i],0),high=views.reduce((n,v,i)=>n+v.high*weights[i],0),exact=views.every(v=>v.exact);return {text:exact?grade(overallScore(s)):revealLevel(s)?grade((low+high)/2)[0]+'?'.repeat(5-revealLevel(s)):'?????',low,high,lowGrade:grade(low),highGrade:grade(high),exact};}
  // Only this public interval goes to the UI. Exact values are used at settlement, never in projections.
  function adRate(s){return AD_RATES[gradeIndex(overallScore(s))]*(1-s.share);}
  function adProjection(s){const v=overallView(s),index=v.exact?GRADES.indexOf(v.text):null,low=AD_RATES[index??gradeIndex(v.low)]*(1-s.share),high=AD_RATES[index??gradeIndex(v.high)]*(1-s.share);return {spend:s.adSpend,lowRate:low,highRate:high,low:Math.round(s.adSpend*low),high:Math.round(s.adSpend*high),rating:v};}
  function organic(s,scoreValue,commerceValue){const fit=1+s.features.reduce((a,id)=>a+(featureFit(s,id)-.85)*.15,0);return Math.max(0,Math.round((1000+scoreValue*scoreValue*.9)*(.65+commerceValue/100*.7)*fit*mods(s).sales*(1-s.share)));}
  function forecast(s){const v=overallView(s),c=ratingView(s,'commerce'),ad=adProjection(s),low=Math.round(organic(s,v.low,c.low)*.85)+ad.low,high=Math.round(organic(s,v.high,c.high)*1.15)+ad.high;return {low,high,exact:v.exact,rating:v,ad,breakeven:Math.ceil(s.spent/24)};}
  function quality(s){return Object.fromEntries(GROUPS.filter(g=>g.id!=='release').map(g=>[g.id,ratingView(s,g.id)]));}
  function pool(s){return CARDS.filter(c=>c.unlock<=s.metaExp&&!s.cards.includes(c.id));}
  function offerCards(s){const p=pool(s),pick=[];while(p.length&&pick.length<3)pick.push(p.splice(Math.floor(random(s)*p.length),1)[0].id);s.pendingCards=pick.length?pick:null;}
  function newRun(config={},meta={exp:0}){const g=GENRES.find(g=>g.id===config.genre)||GENRES[0],exp=Number(meta.exp)||0,buffs=[...new Set(config.buffs||[])];if(buffs.some(id=>!BUFFS.some(b=>b.id===id&&b.unlock<=exp))||buffs.reduce((n,id)=>n+BUFFS.find(b=>b.id===id).cost,0)>capacity({exp}))throw Error('开局加成尚未解锁或超过额度');const seed=(Number(config.seed)||Date.now())>>>0;
    const req=Object.fromEntries(JOBS.map(j=>{const factor=j.skill==='design'?g.req.design/84:j.skill==='code'?g.req.code/96:j.skill==='art'?g.req.art/90:j.skill==='test'?g.req.test/90:1;return [j.id,Math.round(j.base*(j.group==='content'||j.group==='framework'?factor:1))];}));
    const s={version:VERSION,id:'run-'+seed+'-'+Date.now(),seed,rng:seed,genre:g.id,name:String(config.name||g.title).trim().slice(0,18)||g.title,hard:config.hard===true,buffs,metaExp:exp,week:1,money:(config.hard?6800:7600)+(buffs.includes('fund')?900:0),spent:0,income:0,focus:'gameplay',pace:'normal',work:Object.fromEntries(JOBS.map(j=>[j.id,0])),req,bugs:0,debt:0,morale:90,cards:[],features:[],featureWork:{},effects:[],logs:[],history:[],milestones:[],funding:false,share:0,managed:false,pendingCards:null,pendingEvent:null,lastEvent:null,over:false,result:null,designLocked:false,objective:config.objective==='acclaim'?'acclaim':'profit',departed:[],adBudget:0,adSpend:0,ratingRolls:{},revealRolls:{},ratingBonus:{}};
    s.initialMoney=s.money;s.team=createTeam(config);syncPeople(s);GROUPS.filter(g=>g.id!=='release').forEach(g=>{s.ratingRolls[g.id]=round(random(s)*56-28);s.revealRolls[g.id]=round(random(s)*2-1);s.ratingBonus[g.id]=buffs.includes('insight')&&g.id==='content'?8:0;});
    addLog(s,'「'+s.name+'」立项。'+s.team[0].name+'与阿策从两人开始：13 项工作，上架两项完成即可发售。','good');offerCards(s);return s;
  }
  function chooseCard(s,id){if(s.over||!s.pendingCards||id!=='skip'&&!s.pendingCards.includes(id))return false;if(id!=='skip')s.cards.push(id);s.pendingCards=null;addLog(s,id==='skip'?'放弃本次蓝图，保持轻量开发。':'采用蓝图：'+CARDS.find(c=>c.id===id).name,'good');return true;}
  function featureFit(s,id){return ({branch:{story:1.3,action:.75,sim:.9},combat:{story:.8,action:1.3,sim:.75},world:{story:.9,action:1,sim:1.3},style:{story:1.15,action:1.15,sim:.85}}[id]||{})[s.genre]||1;}
  function featurePreview(s,id){const f=FEATURES.find(f=>f.id===id);if(!f)return null;const rework=1+coreProgress(s)*.7*mods(s).rework;return {req:Object.fromEntries(Object.entries(f.req).map(([k,v])=>[legacy[k],Math.ceil(v*rework)])),fit:featureFit(s,id),rework:Math.round((rework-1)*100),weekly:22,debt:round(f.debt*mods(s).debt)};}
  function feature(s,id){const f=FEATURES.find(f=>f.id===id);if(!f||blocked(s)||s.managed||s.designLocked||s.features.includes(id)||s.money<f.cost)return false;const p=featurePreview(s,id);s.features.push(id);s.featureWork[id]=p.req;Object.entries(p.req).forEach(([k,v])=>s.req[k]+=v);s.money-=f.cost;s.spent+=f.cost;s.debt+=p.debt;s.managed=true;addLog(s,'扩展「'+f.name+'」；相关工作量增加，维护 +22/周。');return true;}
  function cutFeature(s,id){const f=FEATURES.find(f=>f.id===id);if(!f||blocked(s)||s.managed||s.designLocked||!s.features.includes(id))return false;Object.entries(s.featureWork[id]).forEach(([k,v])=>{s.req[k]-=v;s.work[k]=Math.min(s.work[k],s.req[k]);});s.features=s.features.filter(k=>k!==id);delete s.featureWork[id];s.debt=Math.max(0,s.debt-f.debt*.6);s.managed=true;return true;}
  function freeze(s){if(blocked(s)||s.managed||groupProgress(s,'content')<.6||s.designLocked&&s.money<180)return false;if(s.designLocked){s.money-=180;s.spent+=180;s.debt+=4;s.req.gameplay+=8;s.designLocked=false;addLog(s,'解冻范围：支出 ¥180，玩法工作量 +8，技术债 +4。');}else{s.designLocked=true;addLog(s,'冻结范围：程序与美术效率 +12%，实现产生的问题 −25%；不能扩功能。','good');}s.managed=true;return true;}
  function funding(s){if(blocked(s)||s.funding||coreProgress(s)<.3)return false;s.money+=2200;s.income+=2200;s.share=.22;s.funding=true;addLog(s,'获得发行预付款 ¥2,200，发售收入分出 22%。','good');return true;}
  function workWeek(s){const production=Object.fromEntries(JOBS.map(j=>[j.id,throughput(s,j.id)])),gains={},m=mods(s);s.lastBottlenecks={};
    // Snapshot limits prevent ordering an assignment twice or getting free same-week upstream work.
    const limits=Object.fromEntries(JOBS.map(j=>[j.id,workLimit(s,j.id)]));
    JOBS.forEach(j=>{const before=s.work[j.id],amount=production[j.id],after=round(Math.max(before,Math.min(s.req[j.id],limits[j.id],before+amount)));s.work[j.id]=after;gains[j.id]=round(after-before);const wasted=round(amount-gains[j.id]);if(wasted>.1)s.lastBottlenecks[j.id]=wasted;});
    s.bugs=Math.max(0,s.bugs+gains.development*.1*(1+s.debt/25)*(s.pace==='crunch'?1.5:1)*(s.designLocked?.75:1)-production.qa*.42-(s.people.qa?m.fix:0));s.debt=Math.max(0,s.debt+gains.development*.025-production.systems*.22-m.cleanup+(s.pace==='crunch'?2:0));s.bugs=round(s.bugs);s.debt=round(s.debt);
    if(campaignCost(s)>0)s.adSpend+=campaignCost(s);
    s.morale=clamp(s.morale+(s.pace==='crunch'?-10:s.pace==='rest'?12:1)+m.morale,25,100);s.team.forEach(m=>m.lastJob=m.job);return {production,gains};
  }
  const EVENTS=[
    {id:'inspiration',tag:'灵感时刻',title:'茶水间的好点子',text:'一个小改动可能让核心循环更清楚。',choices:[{label:'完善玩法表达',hint:'玩法工作 +6',work:{gameplay:6}},{label:'记进下一作',hint:'士气 +4',morale:4}]},
    {id:'palette',tag:'创作火花',title:'找到了对的那抹颜色',text:'画面语言终于和世界观接上了。',choices:[{label:'统一视觉细节',hint:'子主题工作 +6',work:{subtheme:6}},{label:'先把大家状态照顾好',hint:'士气 +5',morale:5}]},
    {id:'discount',tag:'小小幸运',title:'工具续费意外优惠',text:'老用户折扣帮工作室省了一点预算。',choices:[{label:'收下这份幸运',hint:'资金 +120',cash:120}]},
    {id:'feedback',tag:'玩家来信',title:'第一位试玩者的长评',text:'这份反馈既谈体验，也提供了复现步骤。',choices:[{label:'整理玩家调研',hint:'宣传工作 +6，逐步揭示评级',work:{publicity:6}},{label:'处理复现步骤',hint:'测试工作 +6，严重问题 −3',work:{qa:6},bugs:-3}]},
    {id:'coffee',tag:'工作室日常',title:'今天的咖啡刚刚好',text:'团队状态不错，要不要集中突破？',choices:[{label:'保持节奏',hint:'士气 +5',morale:5},{label:'集中突破',hint:'下周全体效率 +15%，士气 −6',morale:-6,effect:{all:1.15,weeks:1,name:'集中突破'}}]},
    {id:'break',tag:'团队选择',title:'不如今晚早点回家',text:'收工后的时间，也属于开发生活。',choices:[{label:'一起吃饭',hint:'支出 ¥100，士气 +14',cash:-100,morale:14},{label:'散步也挺好',hint:'士气 +5',morale:5}]},
    {id:'backup',tag:'意外插曲',title:'硬盘发出了奇怪的声音',text:'备份还在，但设备需要安排。',choices:[{label:'更换设备',hint:'支出 ¥180，下周程序效率 +15%',cash:-180,effect:{job:'code',mult:1.15,weeks:1,name:'新设备'}},{label:'启用备用机',hint:'下周程序效率 −15%',effect:{job:'code',mult:.85,weeks:1,name:'备用设备'}}]},
    {id:'scope',tag:'制作人抉择',title:'这个点子，要现在做吗？',text:'新交互会加深体验，也会扩大开发范围。',choices:[{label:'先记进下一作',hint:'士气 +3',morale:3},{label:'做进这个版本',hint:'支出 ¥100，内容潜力 +4，开发与测试工作量各 +8',cash:-100,bonus:{content:4},workload:{development:8,qa:8}}]},
    {id:'showcase',tag:'行业机会',title:'独立游戏展的邀请',text:'展位可以收集真实玩家的体验反馈。',min:.3,choices:[{label:'带试玩版参展',hint:'支出 ¥200，宣传工作 +12',cash:-200,work:{publicity:12}},{label:'专注开发',hint:'下周全体效率 +10%',effect:{all:1.1,weeks:1,name:'专注开发'}}]},
    {id:'bug',tag:'测试发现',title:'藏在角落里的边界问题',text:'彻底修复，还是暂时隔离？',choices:[{label:'现在修复',hint:'支出 ¥120，问题 −3',cash:-120,bugs:-3},{label:'暂时隔离',hint:'问题 +2，技术债 +3',bugs:2,debt:3}]},
    {id:'forms',tag:'上架事务',title:'渠道给出了清晰反馈',text:'资料目录的意见非常具体。',choices:[{label:'更新上架清单',hint:'资料工作 +6；已完成资料时审核工作 +6',work:{materials:6,review:6}}]},
    {id:'compat',tag:'技术维护',title:'一次小小的兼容更新',text:'工具接口有些变化。',choices:[{label:'现在处理',hint:'支出 ¥100，技术债 −3',cash:-100,debt:-3},{label:'锁定现有版本',hint:'技术债 +2',debt:2}]},
    {id:'tired',tag:'团队状态',title:'大家需要喘口气',text:'开发不是只有亮着的灯。',condition:s=>s.morale<65,choices:[{label:'充分休息',hint:'士气 +15，下周效率 −10%',morale:15,effect:{all:.9,weeks:1,name:'休整'}},{label:'再坚持一下',hint:'士气 −5，问题 +2',morale:-5,bugs:2}]},
    {id:'debt',tag:'架构提醒',title:'旧代码开始牵一发动全身',text:'清理临时方案能让后续工作更顺。',condition:s=>s.debt>8,choices:[{label:'整理架构',hint:'支出 ¥180，技术债 −7',cash:-180,debt:-7},{label:'标记风险',hint:'问题 +3',bugs:3}]}
  ];
  function event(s){return EVENTS.find(e=>e.id===s.pendingEvent);}
  function eventChoiceStatus(s,i){const c=event(s)?.choices[i];if(!c)return {ok:false,reason:'无效选项'};if(c.cash<0&&s.money<-c.cash)return {ok:false,reason:'资金不足'};if(c.workload&&s.designLocked)return {ok:false,reason:'范围已冻结'};return {ok:true};}
  function checkMilestones(s){const n=coreProgress(s),next=[{id:'prototype',check:n>=.3,name:'可玩原型'},{id:'vertical',check:n>=.65,name:'垂直切片'},{id:'content',check:coreReady(s),name:'内容完成'}].find(m=>m.check&&!s.milestones.includes(m.id));if(next){s.milestones.push(next.id);addLog(s,'达成「'+next.name+'」，获得蓝图选择；'+RECRUITS.filter(r=>r.stage===next.id).map(r=>r.name).join('、')+'发来伙伴来信。','good');offerCards(s);}}
  function resolveEvent(s,i){const e=event(s),c=e?.choices[i];if(s.over||!eventChoiceStatus(s,i).ok)return false;if(c.cash){s.money+=c.cash;if(c.cash<0)s.spent-=c.cash;else s.income+=c.cash;}if(c.workload)Object.entries(c.workload).forEach(([k,v])=>s.req[k]+=v);if(c.work)Object.entries(c.work).forEach(([k,v])=>s.work[k]=round(Math.max(s.work[k],Math.min(s.req[k],workLimit(s,k),s.work[k]+v))));if(c.bonus)Object.entries(c.bonus).forEach(([k,v])=>s.ratingBonus[k]=clamp(s.ratingBonus[k]+v,-12,12));s.bugs=Math.max(0,s.bugs+(c.bugs||0));s.debt=Math.max(0,s.debt+(c.debt||0));s.morale=clamp(s.morale+(c.morale||0),25,100);if(c.effect)s.effects.push(copy(c.effect));addLog(s,e.title+'：'+c.label+'。'+c.hint,c.cash<0?'info':'good');s.pendingEvent=null;checkMilestones(s);return true;}
  function advance(s){if(blocked(s))return {ok:false,reason:'请先完成当前选择'};const c=cost(s);if(s.money<c.total)return {ok:false,reason:'资金不足以支付本周工资、维护和投放；可降低买量预算、融资或发售。'};const contributions=s.team.map(m=>({id:m.id,name:m.name,job:m.job,output:memberOutput(s,m.id)}));s.money-=c.total;s.spent+=c.total;const {production,gains}=workWeek(s);s.effects=s.effects.map(e=>({...e,weeks:e.weeks-1})).filter(e=>e.weeks>0);s.history.push({week:s.week,cost:c.total,ads:c.ads,production,gains,team:contributions,money:s.money,ratings:quality(s)});addLog(s,'完成第 '+s.week+' 周：支出 ¥'+c.total+(c.ads?'（含买量 ¥'+c.ads+'）':'')+'。'+contributions.filter(m=>m.output>0).map(m=>m.name+'负责'+task(m.job).name).join('、')+'。');const events=EVENTS.filter(e=>(!e.min||coreProgress(s)>=e.min)&&(!e.condition||e.condition(s))&&e.id!==s.lastEvent),e=events[Math.floor(random(s)*events.length)];s.pendingEvent=e.id;s.lastEvent=e.id;s.week++;s.managed=false;return {ok:true,event:e.id};}
  function preview(s){if(blocked(s))return null;const p=copy(s),c=cost(p),{production,gains}=workWeek(p);return {production,gains,cost:c,work:p.work,bugs:p.bugs,debt:p.debt,bottlenecks:p.lastBottlenecks,money:s.money-c.total};}
  function objectiveStatus(s,result){if(result)return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,value:s.objective==='acclaim'?result.rating:result.profit,ok:result.objectiveOK,ready:true,known:true};const f=forecast(s),low=s.objective==='acclaim'?f.rating.low:f.low+s.income-s.spent,high=s.objective==='acclaim'?f.rating.high:f.high+s.income-s.spent,target=s.objective==='acclaim'?60:1200;return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,low,high,known:f.exact,ready:complete(s),ok:complete(s)&&low>=target,possible:high>=target};}
  function finish(s,released){if(blocked(s)||released&&!canRelease(s))return false;const trueValue=overallScore(s),rating=grade(trueValue),organicRevenue=released?Math.round(organic(s,trueValue,trueScore(s,'commerce'))*(.85+random(s)*.3)):0,adRevenue=released?Math.round(s.adSpend*adRate(s)):0,revenue=organicRevenue+adRevenue,profit=revenue+s.income-s.spent,objectiveOK=!!released&&(s.objective==='acclaim'?gradeIndex(trueValue)>=9:profit>=1200),exp=released?Math.round(35+trueValue*.9+(profit>0?20:0)+(s.hard?25:0)+(objectiveOK?40:0)):Math.min(30,s.milestones.length*8);
    s.over=true;s.result={runId:s.id,name:s.name,genre:s.genre,released,weeks:s.week-1,score:Math.round(trueValue),rating:released?rating:'—',ratings:released?Object.fromEntries(GROUPS.filter(g=>g.id!=='release').map(g=>[g.id,{grade:grade(trueScore(s,g.id)),score:trueScore(s,g.id)}])):null,organicRevenue,adRevenue,adSpend:s.adSpend,adRate:released?adRate(s):null,revenue,cost:s.spent,profit,exp,objective:s.objective,objectiveOK,features:s.features.slice(),cards:s.cards.slice(),team:copy(s.team),seed:s.seed};addLog(s,released?'「'+s.name+'」正式发售，真实评级已揭晓。':'项目终止，保留里程碑经验。',released?'good':'info');return s.result;}
  function emptyMeta(){return {version:1,exp:0,receipts:{},history:[]};}
  function settle(meta,s){const m=copy(meta);if(!s.over||!s.result||m.receipts[s.id])return m;const r=copy(s.result);m.receipts[s.id]=r.exp;m.exp+=r.exp;m.history.unshift(r);return m;}
  function teamVoice(s,e){const skill={palette:'art',backup:'code',bug:'test',forms:'ops',showcase:'ops',inspiration:'design',scope:'design',feedback:'test'}[e?.id],m=s.team.find(m=>task(m.job)?.skill===skill)||s.team.find(m=>m.id==='ace');return {id:m.id,name:m.name,text:e?.id==='feedback'?'反馈让我们更接近真实评价，但不一定是我们原先想的那样。':m.quote};}
  function validateRun(s){try{if(!s||s.version!==VERSION||!GENRES.some(g=>g.id===s.genre)||!Number.isInteger(s.week)||s.week<1||!Array.isArray(s.team)||s.team.length<2||s.team.length>8)return false;for(const a of ['departed','history','cards','logs','effects','features','milestones','buffs'])if(!Array.isArray(s[a]))return false;if(!s.work||!s.req||!s.featureWork||!s.people||!['normal','rest','crunch'].includes(s.pace)||!task(s.focus)||!['profit','acclaim'].includes(s.objective)||!AD_BUDGETS.includes(s.adBudget))return false;const ids=s.team.map(m=>m.id);if(new Set(ids).size!==ids.length||!s.team.some(m=>m.id==='hero'&&m.kind==='hero')||!s.team.some(m=>m.id==='ace'&&m.kind==='companion'))return false;if(!s.team.every(m=>typeof m.name==='string'&&m.name.length>0&&Number.isFinite(m.salary)&&m.salary>=0&&['idle',...JOBS.map(j=>j.id)].includes(m.lastJob)&&SKILLS.every(j=>Number.isFinite(m.skills[j.id])&&m.skills[j.id]>=0&&m.skills[j.id]<=200)&&(m.job==='idle'||taskSkill(m,m.job)>0)))return false;
    return JOBS.every(j=>Number.isFinite(s.work[j.id])&&s.work[j.id]>=0&&Number.isFinite(s.req[j.id])&&s.req[j.id]>0&&s.work[j.id]<=s.req[j.id]+.01&&s.people[j.id]===s.team.filter(m=>m.job===j.id).length)&&s.reserve===s.team.filter(m=>m.job==='idle').length&&GROUPS.filter(g=>g.id!=='release').every(g=>Number.isFinite(s.ratingRolls[g.id])&&Math.abs(s.ratingRolls[g.id])<=28&&Number.isFinite(s.revealRolls[g.id])&&Math.abs(s.revealRolls[g.id])<=1&&Number.isFinite(s.ratingBonus[g.id]))&&[s.money,s.spent,s.income,s.adSpend,s.bugs,s.debt,s.morale,s.rng,s.seed,s.initialMoney].every(Number.isFinite)&&s.money>=0&&s.spent>=0&&s.adSpend>=0&&s.adSpend<=s.spent&&s.cards.every(id=>CARDS.some(c=>c.id===id))&&s.features.every(id=>FEATURES.some(f=>f.id===id))&&(!s.pendingEvent||EVENTS.some(e=>e.id===s.pendingEvent))&&(!s.pendingCards||Array.isArray(s.pendingCards)&&s.pendingCards.every(id=>CARDS.some(c=>c.id===id)))&&(!s.over||!!s.result);
    }catch{return false;}}
  return {VERSION,SKILLS,GROUPS,JOBS,GRADES,AD_RATES,AD_BUDGETS,TEMPLATES,COMPANION,RECRUITS,GENRES,CARDS,FEATURES,BUFFS,OBJECTIVES,EVENTS,skillLabel,taskSkill,assignMember,availableRecruits,memberOutput,teamVoice,newRun,chooseCard,mods,cost,teamSize,progress,groupProgress,coreProgress,coreReady,complete,goals,canRelease,quality,trueScore,overallScore,grade,gradeIndex,revealLevel,ratingView,overallView,adRate,adProjection,setAdBudget,forecast,objectiveStatus,featureFit,featurePreview,freeze,throughput,workLimit,hire,downsize,feature,cutFeature,funding,advance,event,eventChoiceStatus,resolveEvent,preview,finish,emptyMeta,settle,capacity,validateRun,copy};
});
