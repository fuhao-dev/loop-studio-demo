/* 天才程序员带我做游戏 v0.10.1 · shared career and pausable projects. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioGame=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=10;
  const STANDARD_WEEKLY_WORK=10,STANDARD_PERSON_WEEK_COST=100,INITIAL_FUNDS=7600;
  const HARD_CAP=1, INITIAL_SOFT_CAP=.7, CAP_STEP=.15;
  const SKILLS=[
    {id:'design',name:'策划设计',short:'策划',icon:'✦',color:'#d8b879'},
    {id:'code',name:'程序开发',short:'程序',icon:'⌘',color:'#76a9e7'},
    {id:'art',name:'美术制作',short:'美术',icon:'◈',color:'#bc9fe4'},
    {id:'test',name:'测试打磨',short:'测试',icon:'✓',color:'#80ba91'},
    {id:'ops',name:'发行事务',short:'发行',icon:'↗',color:'#dd957d'}
  ];
  const SCALES=[
    {id:'micro',name:'微型游戏',tag:'01 / 轻装起步',icon:'·',multiplier:1,revenueMultiplier:1,desc:'用一个小点子完成第一作，适合积累资金与经验。',title:'小小的第一作'},
    {id:'small',name:'小型游戏',tag:'02 / 扩大范围',icon:'◇',multiplier:3,revenueMultiplier:3,desc:'更多内容与开发投入，基础工作需求是微型的 3 倍。',title:'更远一点的故事'},
    {id:'medium',name:'中型游戏',tag:'03 / 团队制作',icon:'▦',multiplier:9,revenueMultiplier:9,desc:'需要充足的资金和团队，基础工作需求是微型的 9 倍。',title:'一起造一个世界'},
    {id:'large',name:'大型游戏',tag:'04 / 长线开发',icon:'▣',multiplier:27,revenueMultiplier:27,desc:'一场长期开发，基础工作需求是微型的 27 倍。',title:'我们的宏大计划'}
  ];
  const PUBLISHER_JOBS=['publicity','acquisition','materials','review'],PUBLISHER_WEEKLY_WORK=20;
  const HERO={id:'hero',name:'你',title:'独立制作人',kind:'hero',skills:{design:100,code:100,art:100,test:100,ops:100},salary:72,quote:'这一作积累的经验，会陪我走到下一作。',bio:'五项基础能力均为 100%；在局外生涯中训练后永久提高，跨项目继承。',color:'#d8b879',look:0};
  const COMPANION={id:'ace',name:'天才程序员',title:'白发有角龙娘 · 全能搭档',kind:'companion',skills:{design:145,code:145,art:145,test:145,ops:145},salary:96,quote:'你来决定方向，我来补上最需要的一块。',bio:'白发有角龙娘，强的可怕。',color:'#81bea7',look:5};
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
  const MARKET_MIN=.1,MARKET_MAX=10;
  const OBJECTIVES=[{id:'profit',name:'商业回报',desc:'发售后项目结余达到 ¥1,200。',bonus:40},{id:'acclaim',name:'口碑佳作',desc:'综合真实评级达到 A-。',bonus:40}];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Math.round(v*100)/100,copy=o=>JSON.parse(JSON.stringify(o));
  const task=id=>JOBS.find(j=>j.id===id),group=id=>GROUPS.find(g=>g.id===id);
  function random(s){s.rng=(s.rng*1664525+1013904223)>>>0;return s.rng/4294967296;}
  const projectScale=s=>SCALES.find(g=>g.id===s.scale);
  function scalePlan(id){const work=Object.values(baseRequirements(id)).reduce((n,v)=>n+v,0),personWeeks=work/STANDARD_WEEKLY_WORK;return {work,personWeeks,minFunds:Math.ceil(work*STANDARD_PERSON_WEEK_COST/STANDARD_WEEKLY_WORK)};}
  function baseRequirements(id){const g=SCALES.find(g=>g.id===id);if(!g)throw Error('请选择有效的项目规模');return Object.fromEntries(JOBS.map(j=>[j.id,j.base*g.multiplier]));}

  function skillLabel(n){return n===0?'不会':n>=130?'擅长':n>=80?'胜任':'生疏';}
  function taskSkill(m,id){const j=task(id);return j?m.skills[j.skill]||0:0;}
  function syncPeople(s){s.people=Object.fromEntries(JOBS.map(j=>[j.id,s.team.filter(m=>m.job===j.id).length]));s.reserve=s.team.filter(m=>m.job==='idle').length;}
  function makeMember(def,job){return {...copy(def),job,lastJob:job,kind:def.kind||'partner'};}
  function preferredJob(m){return ({design:'gameplay',code:'development',art:'subtheme',test:'qa',ops:'ads'})[SKILLS.reduce((a,j)=>m.skills[j.id]>m.skills[a]?j.id:a,'design')];}
  function createTeam(profile,partners){const hero=makeMember({...copy(HERO),name:profile.name,skills:copy(profile.skills)},'gameplay');return [hero,makeMember(COMPANION,'development'),...partners.map(id=>{const r=RECRUITS.find(r=>r.id===id);return makeMember(r,preferredJob(r));})];}
  function addLog(s,text,kind='info'){s.logs.unshift({week:s.week,text,kind});s.logs=s.logs.slice(0,90);}
  function blocked(s){return s.over||s.paused||!!s.pendingEvent;}
  function assignMember(s,id,job){const m=s.team.find(m=>m.id===id);if(blocked(s)||!m||publisherManaged(s,job)||job!=='idle'&&taskSkill(m,job)<=0)return false;m.job=job;syncPeople(s);return true;}
  function availableRecruits(s){return RECRUITS.filter(r=>s.knownPartners.includes(r.id)&&!s.team.some(m=>m.id===r.id)&&!s.departed.includes(r.id));}
  function teamSize(s){return s.team.length;}
  function hire(s,id){const r=availableRecruits(s).find(r=>r.id===id);if(!r||blocked(s)||s.managed||s.team.length>=8||s.money<180)return false;const m=makeMember(r,publisherManaged(s,preferredJob(r))?'idle':preferredJob(r));m.lastJob='idle';s.team.push(m);syncPeople(s);s.money-=180;s.spent+=180;s.managed=true;addLog(s,r.name+'加入团队，基础周薪 ¥'+r.salary+'；准备支出 ¥180。','good');return true;}
  function downsize(s,id){const m=s.team.find(m=>m.id===id);if(!m||m.kind!=='partner'||blocked(s)||s.managed||s.money<100)return false;s.team=s.team.filter(m=>m.id!==id);s.departed.push(id);syncPeople(s);s.money-=100;s.spent+=100;s.managed=true;addLog(s,'与'+m.name+'暂别，支付 ¥100；本项目不再重复邀请。');return true;}
  function mods(s){const m={all:1,design:1,code:1,art:1,test:1,ops:1,play:1,visual:1,debt:1,rework:1,overhead:1,wages:1,ramp:1,crowd:.45,fix:0,morale:0,cleanup:0,fee:0,sales:1};s.effects.forEach(e=>{if(e.weeks>0){m.all*=e.all||1;if(e.job)m[e.job]*=e.mult||1;}});return m;}
  function campaignCost(s){return s.publisher||s.people.acquisition>0?s.adBudget:0;}
  function buyingStatus(s){
    const managed=!!s.publisher,assigned=s.team.filter(m=>m.job==='acquisition'),spend=campaignCost(s);
    return {managed,assigned:assigned.length,members:managed?[{id:'publisher',name:'发行商团队'}]:assigned.map(m=>({id:m.id,name:m.name})),budget:s.adBudget,spend,studioSpend:managed?0:spend,publisherSpend:managed?spend:0,unfunded:(managed||assigned.length>0)&&s.adBudget===0,reason:s.adBudget===0?'买量预算为 ¥0，本周买量无进度':!managed&&assigned.length===0?'未安排买量人手，本周不投放、无买量进度':''};
  }
  function cost(s){const m=mods(s),wages=Math.ceil(s.team.reduce((n,p)=>n+p.salary,0)*m.wages),overhead=Math.ceil((90+s.debt*2+Math.max(0,s.team.length-4)**2*12)*m.overhead),campaign=campaignCost(s),ads=s.publisher?0:campaign,publisherAds=s.publisher?campaign:0;return {wages,overhead,tools:m.fee,ads,publisherAds,total:wages+overhead+m.fee+ads};}
  function progress(s,id){return s.req[id]>0?clamp(s.work[id]/s.req[id],0,1):0;}
  function groupProgress(s,id){const list=JOBS.filter(j=>j.group===id);return list.reduce((a,j)=>a+progress(s,j.id),0)/list.length;}
  function coreProgress(s){return (groupProgress(s,'content')+groupProgress(s,'framework'))/2;}
  function coreReady(s){return JOBS.filter(j=>['content','framework'].includes(j.group)).every(j=>progress(s,j.id)>=1);}
  function complete(s){return progress(s,'materials')>=1&&progress(s,'review')>=1;}
  function goals(s){return ['materials','review'].map(id=>({name:task(id).name,ok:progress(s,id)>=1,value:Math.floor(progress(s,id)*100)+'%'}));}
  function canRelease(s){return !s.over&&!s.paused&&!s.pendingEvent&&complete(s);}
  function jobContributions(s,id,members,m=mods(s)){
    const j=task(id);if(!j||publisherManaged(s,id)||id==='acquisition'&&s.adBudget===0)return [];
    const ordered=members.map(p=>({id:p.id,n:taskSkill(p,id)/100*(id!==p.lastJob?1-.2*m.ramp:1)})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id));
    const debt=j.skill==='code'?Math.max(.6,1-s.debt*.01):1;
    return ordered.map((p,i)=>({id:p.id,output:round(p.n*(i?m.crowd:1)*STANDARD_WEEKLY_WORK*m.all*m[j.skill]*(s.pace==='crunch'?1.35:s.pace==='rest'?.7:1)*(.65+s.morale/285)*debt)}));
  }
  function memberOutput(s,id){const member=s.team.find(p=>p.id===id);if(!member||member.job==='idle')return 0;return jobContributions(s,member.job,s.team.filter(p=>p.job===member.job)).find(p=>p.id===id)?.output||0;}
  function throughput(s,id){if(publisherManaged(s,id))return id==='acquisition'&&s.adBudget===0?0:PUBLISHER_WEEKLY_WORK;return round(jobContributions(s,id,s.team.filter(p=>p.job===id)).reduce((sum,p)=>sum+p.output,0));}
  function softCap(s,id){return task(id)?.group==='release'?HARD_CAP:s.softCaps[id];}
  function workDependency(s,id){const content=groupProgress(s,'content'),development=progress(s,'development'),systems=progress(s,'systems'),materials=progress(s,'materials');const source=(name,value)=>({name,value});if(id==='development')return {sources:[source('游戏内容',content)],cap:Math.min(1,.2+content*.8)};if(id==='systems')return {sources:[source('开发进度',development)],cap:Math.min(1,.2+development)};if(id==='qa')return {sources:[source('开发进度',development),source('系统协作',systems)],cap:Math.min(development,.2+systems)};if(id==='review')return {sources:[source('资料准备',materials)],cap:materials>=1?1:0};return null;}
  function workLimit(s,id){return s.req[id]*Math.min(HARD_CAP,softCap(s,id),workDependency(s,id)?.cap??1);}
  function workPhase(s,id){const p=progress(s,id);if(!s.hard||task(id)?.group==='release')return {id:'steady',name:'正常推进',min:1,max:1,spill:0};if(p<.3)return {id:'early',name:'正常推进',min:1,max:1,spill:0};if(p<.5)return {id:'slow',name:'推进放缓 · 65%',min:.65,max:.65,spill:0};if(p<=.7+1e-9)return {id:'coupled',name:'推进困难 · 35% / 牵连其他项',min:.35,max:.35,spill:.2};return {id:'uncertain',name:'随机增减 · 各 50% 概率',min:-1,max:1,spill:0};}
  function unlockCaps(s,caps){for(const [id,amount] of Object.entries(caps)){const targets=task(id)?[task(id)]:JOBS.filter(j=>j.group===id);for(const j of targets)if(j.group!=='release')s.softCaps[j.id]=round(Math.min(HARD_CAP,s.softCaps[j.id]+amount));}}
  function setAdBudget(s,n){if(blocked(s)||!AD_BUDGETS.includes(n))return false;s.adBudget=n;return true;}
  function gradeIndex(value){return clamp(Math.floor(clamp(value,0,100)/100*15),0,14);}
  function grade(value){return GRADES[gradeIndex(value)];}
  function trueScore(s,id){if(id==='release')return groupProgress(s,id)*100;const p=groupProgress(s,id);let n=10+p*65+s.ratingRolls[id]+s.ratingBonus[id];if(id==='content')n+=(mods(s).play-1)*8+(mods(s).visual-1)*8;if(id==='framework')n-=s.bugs*.3+s.debt*.18;return round(clamp(n,0,100));}
  function overallScore(s){return round(trueScore(s,'content')*.4+trueScore(s,'framework')*.3+trueScore(s,'commerce')*.2+trueScore(s,'promotion')*.1);}
  function revealLevel(s){const p=progress(s,'publicity');return p>=1?5:p>=.75?4:p>=.5?3:p>=.25?2:p>0?1:0;}
  function ratingView(s,id,force=false){const level=force||s.over&&s.result?.released?5:revealLevel(s);if(!level)return {id,level:0,text:'?????',low:0,high:100,lowGrade:'D-',highGrade:'S+',exact:false,questions:5};
    const actual=gradeIndex(trueScore(s,id)),radius=(5-level)*2,estimate=clamp(actual+Math.round(s.revealRolls[id]*radius),0,14),lo=clamp(estimate-radius,0,14),hi=clamp(estimate+radius,0,14),text=(level<4?GRADES[estimate][0]:GRADES[estimate])+'?'.repeat(5-level);
    return {id,level,text,low:lo/15*100,high:Math.min(100,(hi+1)/15*100-0.0001),lowGrade:GRADES[lo],highGrade:GRADES[hi],exact:level===5,questions:5-level};}
  function overallView(s,force=false){const views=GROUPS.filter(g=>g.id!=='release').map(g=>ratingView(s,g.id,force)),weights=[.4,.3,.2,.1],low=views.reduce((n,v,i)=>n+v.low*weights[i],0),high=views.reduce((n,v,i)=>n+v.high*weights[i],0),exact=views.every(v=>v.exact);return {text:exact?grade(overallScore(s)):revealLevel(s)?grade((low+high)/2)[0]+'?'.repeat(5-revealLevel(s)):'?????',low,high,lowGrade:grade(low),highGrade:grade(high),exact};}
  // Only this public interval goes to the UI. Exact values are used at settlement, never in projections.
  function adRate(s){return AD_RATES[gradeIndex(overallScore(s))];}
  function adProjection(s){
    const v=overallView(s),index=v.exact?GRADES.indexOf(v.text):null,lowRate=AD_RATES[index??gradeIndex(v.low)],highRate=AD_RATES[index??gradeIndex(v.high)],low=adSettlement(s,lowRate),high=adSettlement(s,highRate);
    return {spend:s.adSpend,studioSpend:low.studioSpend,publisherSpend:low.publisherSpend,lowRate,highRate,low:low.studioRevenue,high:high.studioRevenue,netLow:low.studioNet,netHigh:high.studioNet,grossLow:low.gross,grossHigh:high.gross,rating:v};
  }
  function marketMultiplier(roll){return round(MARKET_MIN*Math.pow(MARKET_MAX/MARKET_MIN,clamp(roll,0,1)));}
  function revenueRules(s){return {scaleMultiplier:projectScale(s).revenueMultiplier,marketMin:MARKET_MIN,marketMax:MARKET_MAX};}
  function organic(s,scoreValue,commerceValue){return Math.max(0,Math.round((1000+scoreValue*scoreValue*.9)*(.65+commerceValue/100*.7)*mods(s).sales*projectScale(s).revenueMultiplier));}
  function forecast(s){
    const v=overallView(s),c=ratingView(s,'commerce'),ad=adProjection(s),rules=revenueRules(s);
    const net=value=>s.publisher?Math.floor(value*.5):value;const low=net(Math.round(organic(s,v.low,c.low)*rules.marketMin))+ad.low,high=net(Math.round(organic(s,v.high,c.high)*rules.marketMax))+ad.high;
    return {low,high,exact:v.exact,rating:v,ad,rules,breakeven:Math.ceil(s.spent/24)};
  }
  function incomeView(s){
    const settled=s.over&&s.result?.released,level=settled?5:s.over?0:revealLevel(s),visible=level>0;
    const labels=['未解锁','粗略区间','初步区间','细化区间','清晰区间','完整区间'];
    const next=['推进宣传后解锁','宣传 25% 解锁下一档','宣传 50% 解锁下一档','宣传 75% 解锁下一档','宣传 100% 解锁完整区间','市场波动仍在发售时揭晓'][level];
    if(!visible)return {visible:false,level,label:s.over?'项目已结束':labels[0],next,revenue:null,profit:null,adTotal:null,adGross:null,adNet:null,adRate:null};
    function range(low,high){
      const largest=Math.max(Math.abs(low),Math.abs(high),1),unit=level===5?1:10**Math.max(0,Math.floor(Math.log10(largest))-level+1);
      return {low:Math.floor(low/unit)*unit,high:Math.ceil(high/unit)*unit};
    }
    if(settled){const r=s.result;return {visible:true,level,label:'实际结算',next:'',revenue:range(r.revenue,r.revenue),profit:range(r.profit,r.profit),adTotal:range(r.adGrossRevenue,r.adGrossRevenue),adGross:range(r.adRevenue,r.adRevenue),adNet:range(r.adNetRevenue,r.adNetRevenue),adRate:range(r.adRate*100,r.adRate*100)};}
    const f=forecast(s);
    return {visible:true,level,label:labels[level],next,revenue:range(f.low,f.high),profit:range(f.low+s.income-s.spent,f.high+s.income-s.spent),adTotal:range(f.ad.grossLow,f.ad.grossHigh),adGross:range(f.ad.low,f.ad.high),adNet:range(f.ad.netLow,f.ad.netHigh),adRate:range(f.ad.lowRate*100,f.ad.highRate*100)};
  }
  function quality(s){return Object.fromEntries(GROUPS.filter(g=>g.id!=='release').map(g=>[g.id,ratingView(s,g.id)]));}


  // Local, curated name screening. English words use boundaries to avoid
  // rejecting ordinary titles such as "Classical Studio" or "Scunthorpe".
  const NAME_WARNING='当前名字不合适，请换个名字。';
  const BLOCKED_NAME_PHRASES=[
    '傻逼','傻屌','傻叉','煞笔','操你','草你妈','艹你妈','你妈逼','妈了个逼','狗日的','婊子','贱人',
    '色情','淫秽','裸聊','约炮','卖淫','嫖娼','强奸','迷奸','性奴','儿童色情','幼女色情','未成年色情',
    '贩毒','制毒','冰毒','海洛因','摇头丸','枪支交易','买卖枪支','炸弹教程','诈骗教程','洗钱教程',
    '赌博网站','网络赌场','纳粹万岁','希特勒万岁'
  ];
  const BLOCKED_ENGLISH_WORDS=['fuck','fucking','fucker','motherfucker','shit','bullshit','bitch','asshole','cunt','porn','pornhub','rape','rapist','nigger'];
  const NAME_SEPARATORS='[\\p{P}\\p{S}\\p{Z}\\s_]*';
  const BLOCKED_ENGLISH_PATTERN=new RegExp('(^|[^a-z0-9])(?:'+BLOCKED_ENGLISH_WORDS.map(word=>word.split('').join(NAME_SEPARATORS)).join('|')+')(?=$|[^a-z0-9])','iu');
  function projectNameStatus(value){
    const name=String(value??'').trim();
    if(!name)return {ok:false,reason:'请输入作品名称。'};
    if(name.length>18)return {ok:false,reason:'作品名称最多 18 个字符。'};
    const normalized=name.normalize('NFKC').toLowerCase().replace(/[\p{Cf}\p{Cc}]/gu,'');
    const compact=normalized.replace(/[\p{P}\p{S}\p{Z}\s_]/gu,'');
    if(!compact)return {ok:false,reason:'请输入包含文字或数字的作品名称。'};
    const blocked=BLOCKED_NAME_PHRASES.some(word=>compact.includes(word))||BLOCKED_ENGLISH_PATTERN.test(normalized);
    return {ok:!blocked,reason:blocked?NAME_WARNING:''};
  }

  function newRun(config={},meta=emptyMeta()){if(!validateMeta(meta))throw Error('生涯数据无效');if(meta.activeRunId)throw Error('请先暂停或结算当前项目，再开始新项目');const scaleId=config.scale||SCALES[0].id,g=SCALES.find(g=>g.id===scaleId);if(!g)throw Error('请选择有效的项目规模');const name=String(config.name||g.title).trim().slice(0,18)||g.title,nameStatus=projectNameStatus(name);if(!nameStatus.ok)throw Error(nameStatus.reason);const plan=scalePlan(g.id);if(meta.wallet<plan.minFunds)throw Error('资金不足：'+g.name+'需要 ¥'+plan.minFunds.toLocaleString('zh-CN')+'，当前 ¥'+meta.wallet.toLocaleString('zh-CN')+'，还差 ¥'+(plan.minFunds-meta.wallet).toLocaleString('zh-CN'));const seed=(Number(config.seed)||Date.now())>>>0;
    const req=baseRequirements(g.id);
    const s={version:VERSION,id:'run-'+meta.stage+'-'+seed+'-'+Date.now(),stage:meta.stage,seed,rng:seed,scale:g.id,name,hard:config.hard===true,week:1,money:meta.wallet,spent:0,income:0,sharedCashDelta:0,paused:false,pace:'normal',work:Object.fromEntries(JOBS.map(j=>[j.id,0])),req,bugs:0,debt:0,morale:90,effects:[],logs:[],history:[],milestones:[],publisher:null,managed:false,pendingEvent:null,lastEvent:null,over:false,result:null,objective:config.objective==='acclaim'?'acclaim':'profit',departed:[],adBudget:0,adSpend:0,ratingRolls:{},revealRolls:{},ratingBonus:{},softCaps:Object.fromEntries(JOBS.filter(j=>j.group!=='release').map(j=>[j.id,INITIAL_SOFT_CAP])),pendingCapGroup:null};
    s.initialMoney=s.money;s.knownPartners=meta.knownPartners.slice();s.team=createTeam(meta.hero,meta.partners);syncPeople(s);if(s.money<cost(s).total)throw Error('生涯资金不足以支付首周团队成本；可在局外重新开始生涯');GROUPS.filter(g=>g.id!=='release').forEach(g=>{s.ratingRolls[g.id]=round(random(s)*56-28);s.revealRolls[g.id]=round(random(s)*2-1);s.ratingBonus[g.id]=0;});meta.activeRunId=s.id;meta.stage++;
    addLog(s,'第 '+s.stage+' 关「'+s.name+'」立项：继承资金 ¥'+s.money+' 与主角能力；'+g.name+'，需要 '+plan.personWeeks+' 人周工作量'+'；上架两项完成即可发售。','good');return s;
  }
  function publisherManaged(s,id){return !!s.publisher&&PUBLISHER_JOBS.includes(id);}
  function publisherQuote(s){
    if(s.publisher)return {...copy(s.publisher.quote),signed:true};
    const view=overallView(s),commerce=ratingView(s,'commerce'),expectedScore=round((view.low+view.high)/2),commerceScore=(commerce.low+commerce.high)/2;
    const baseRevenue=organic(s,expectedScore,commerceScore),advance=Math.max(100,Math.round(baseRevenue*.6/100)*100);
    return {signed:false,advance,expectedScore,baseRevenue,scaleMultiplier:projectScale(s).revenueMultiplier,level:revealLevel(s),basis:revealLevel(s)?'当前已揭示评级的中位预期':'未宣传，按中性预期报价',weeklyWork:PUBLISHER_WEEKLY_WORK};
  }
  function signPublisher(s){
    if(blocked(s)||s.publisher)return false;
    const quote=publisherQuote(s);s.publisher={quote:copy(quote),advance:quote.advance,signWeek:s.week,adSpend:0};
    s.money+=quote.advance;s.income+=quote.advance;s.adBudget=s.adBudget||300;
    for(const m of s.team)if(PUBLISHER_JOBS.includes(m.job))m.job='idle';syncPeople(s);
    addLog(s,'签约发行商：收到预付款 ¥'+quote.advance+'；宣发与上架由发行团队接管，签约后买量由发行商垫付并承担亏损。自然销售双方各 50%，发行商回收买量成本后再分走正净利润的 50%。','good');return true;
  }
  function adSettlement(s,rate,released=true){
    const publisherSpend=s.publisher?.adSpend||0,studioSpend=s.adSpend-publisherSpend;
    const studioGross=released?Math.round(studioSpend*rate):0,publisherGross=released?Math.round(publisherSpend*rate):0;
    const publisherRecovered=Math.min(publisherSpend,publisherGross),positiveProfit=Math.max(0,publisherGross-publisherSpend);
    const studioShare=Math.floor(positiveProfit*.5),publisherProfit=positiveProfit-studioShare;
    const studioRevenue=studioGross+studioShare,publisherRevenue=publisherRecovered+publisherProfit;
    return {studioSpend,publisherSpend,gross:studioGross+publisherGross,studioGross,publisherGross,studioShare,studioRevenue,studioNet:studioRevenue-studioSpend,publisherRecovered,publisherProfit,publisherRevenue,publisherLoss:Math.max(0,publisherSpend-publisherGross),campaignNet:studioGross+publisherGross-s.adSpend};
  }
  function workWeek(s,previewOnly=false,ignoreModeEffects=false){const production=Object.fromEntries(JOBS.map(j=>[j.id,throughput(s,j.id)])),before={...s.work},gains={},ranges={},impacts=[],m=mods(s);s.lastBottlenecks={};
    // Dependencies and difficulty bands use the beginning-of-week snapshot.
    const limits=Object.fromEntries(JOBS.map(j=>[j.id,workLimit(s,j.id)])),phases=Object.fromEntries(JOBS.map(j=>[j.id,workPhase(s,j.id)]));
    for(const j of JOBS){const id=j.id,p=ignoreModeEffects?{...phases[id],min:1,max:1,spill:0}:phases[id],amount=production[id],room=Math.max(0,limits[id]-before[id]),low=round(p.min<0?-Math.min(before[id],amount):Math.min(room,amount*p.min)),high=round(Math.min(room,amount*p.max));ranges[id]={low,high};let change=(low+high)/2;
      if(!previewOnly){const factor=p.min<0&&amount>0?(random(s)<.5?-1:1)*(.2+random(s)*.8):p.max;change=factor<0?-Math.min(before[id],amount*-factor):Math.min(room,amount*factor);}
      s.work[id]=round(clamp(before[id]+change,0,s.req[id]));gains[id]=round(s.work[id]-before[id]);if(amount>0&&room<amount*p.max)s.lastBottlenecks[id]=round(Math.max(0,amount*p.max-room));}
    if(s.hard&&!ignoreModeEffects){for(const j of JOBS){const id=j.id,p=phases[id];if(!p.spill||gains[id]<=0)continue;const candidates=JOBS.filter(other=>other.id!==id&&other.group!=='release'&&s.work[other.id]>0),fraction=gains[id]/s.req[id]*p.spill;
        if(previewOnly){for(const other of JOBS.filter(other=>other.id!==id&&other.group!=='release'))ranges[other.id].low-=fraction*s.req[other.id];}
        else if(candidates.length){const other=candidates[Math.floor(random(s)*candidates.length)],lost=round(Math.min(s.work[other.id],fraction*s.req[other.id]));s.work[other.id]=round(s.work[other.id]-lost);if(lost>0)impacts.push({from:id,to:other.id,points:round(lost/s.req[other.id]*100)});}}
    }
    for(const j of JOBS){gains[j.id]=round(s.work[j.id]-before[j.id]);ranges[j.id].low=round(Math.max(-before[j.id],ranges[j.id].low));}
    const implementation=Math.max(0,gains.development);
    s.bugs=Math.max(0,s.bugs+implementation*.1*(1+s.debt/25)*(s.pace==='crunch'?1.5:1)-production.qa*.42-(s.people.qa?m.fix:0));s.debt=Math.max(0,s.debt+implementation*.025-production.systems*.22-m.cleanup+(s.pace==='crunch'?2:0));s.bugs=round(s.bugs);s.debt=round(s.debt);
    if(campaignCost(s)>0){s.adSpend+=campaignCost(s);if(s.publisher)s.publisher.adSpend+=campaignCost(s);}
    s.morale=clamp(s.morale+(s.pace==='crunch'?-10:s.pace==='rest'?12:1)+m.morale,25,100);s.team.forEach(m=>m.lastJob=m.job);return {production,gains,ranges,impacts};
  }
  const EVENTS=[
    {id:'inspiration',tag:'玩法突破',title:'天才程序员画出了新的核心循环',text:'玩法有了更高的完成空间，但好点子仍要排进工作表。',choices:[{label:'拓展玩法表达',hint:'玩法软上限 +15%，当前完成度不变',caps:{gameplay:.15}},{label:'记进下一作',hint:'士气 +4；本作进度保持',morale:4}]},
    {id:'palette',tag:'内容表达',title:'子主题终于有了自己的气质',text:'画面、氛围与题材接上了。下一步是继续打磨，还是让团队缓口气？',choices:[{label:'拓展视觉细节',hint:'子主题软上限 +15%，仍需安排工作',caps:{subtheme:.15}},{label:'先照顾团队状态',hint:'士气 +5',morale:5}]},
    {id:'discount',tag:'开发成本',title:'工具订阅返还了一笔差价',text:'省下的资金进入全局生涯余额，可以继续支持当前作品或下一作。',choices:[{label:'收下这份幸运',hint:'生涯资金 +¥120，记入本作其他收入',cash:120}]},
    {id:'feedback',tag:'玩家反馈',title:'试玩长评指出了两个突破口',text:'反馈可以帮助准备更好的宣传与测试方案；评级认知仍需通过宣传工作逐步揭示。',choices:[{label:'整理玩家调研',hint:'宣传软上限 +15%；不会直接揭示评级',caps:{publicity:.15}},{label:'整理复现步骤',hint:'测试软上限 +15%，问题 −3',caps:{qa:.15},bugs:-3}]},
    {id:'coffee',tag:'团队节奏',title:'今天的咖啡刚刚好',text:'本周工作已经结算。决定下一周的效率与状态，不改写刚完成的进度。',choices:[{label:'保持节奏',hint:'士气 +5',morale:5},{label:'集中突破',hint:'下周全体效率 +15%，士气 −6',morale:-6,effect:{all:1.15,weeks:1,name:'集中突破'}}]},
    {id:'break',tag:'工作室日常',title:'不如今晚早点回家',text:'伙伴会陪你跨作品继续开发，当前项目的疲劳也值得照顾。',choices:[{label:'一起吃饭',hint:'生涯资金 −¥100，士气 +14',cash:-100,morale:14},{label:'散步也挺好',hint:'士气 +5',morale:5}]},
    {id:'backup',tag:'程序维护',title:'构建机发出了奇怪的声音',text:'代码备份还在，已有完成度保留；设备选择会影响下周程序岗位的效率。',choices:[{label:'更换设备',hint:'支出 ¥180，下周程序效率 +15%',cash:-180,effect:{job:'code',mult:1.15,weeks:1,name:'新构建机'}},{label:'启用备用机',hint:'下周程序效率 −15%，当前完成度不变',effect:{job:'code',mult:.85,weeks:1,name:'备用构建机'}}]},
    {id:'scope',tag:'内容潜力',title:'这个点子，要在本作继续探索吗？',text:'提高潜力和软上限，不等于立即做出成果；实现仍需人手与预算。',choices:[{label:'先记进下一作',hint:'士气 +3',morale:3},{label:'探索新的表达',hint:'支出 ¥100，内容潜力 +4，内容三项软上限各 +15%',cash:-100,bonus:{content:4},caps:{content:.15}}]},
    {id:'showcase',tag:'宣发机会',title:'独立游戏展开放了试玩席位',text:'参展能拓宽宣传准备的空间；实际评级认知仍由宣传完成度决定，市场波动无法提前确定。',min:.3,choices:[{label:'带试玩版参展',hint:'支出 ¥200，宣传软上限 +30%',cash:-200,caps:{publicity:.3}},{label:'专注当前开发',hint:'下周全体效率 +10%',effect:{all:1.1,weeks:1,name:'专注开发'}}]},
    {id:'bug',tag:'测试发现',title:'边界问题有了明确的复现步骤',text:'修复问题会改善完善度；不直接增减测试或开发完成度。',choices:[{label:'现在修复',hint:'支出 ¥120，问题 −3',cash:-120,bugs:-3},{label:'暂时隔离',hint:'问题 +2，技术债 +3',bugs:2,debt:3}]},
    {id:'forms',tag:'上架准备',title:'渠道明确了资质与素材清单',text:'授权材料、商店资料和审核提交有了清晰安排。资料到 100% 后才能推进审核，两项都要完成。',choices:[{label:'更新发行工作清单',hint:'下周发行能力相关岗位效率 +20%；上架无软上限',effect:{job:'ops',mult:1.2,weeks:1,name:'清晰发行清单'}}]},
    {id:'compat',tag:'系统协作',title:'工具接口的兼容方案需要确认',text:'技术债会拖慢程序岗位并增加维护成本，系统协作也能持续偿债。',choices:[{label:'现在处理',hint:'支出 ¥100，技术债 −3',cash:-100,debt:-3},{label:'锁定现有版本',hint:'技术债 +2，当前完成度不变',debt:2}]},
    {id:'tired',tag:'团队状态',title:'大家需要喘口气',text:'士气影响全部岗位的产出。赶进度之前，先看一眼团队状态。',condition:s=>s.morale<65,choices:[{label:'充分休息',hint:'士气 +15，下周全体效率 −10%',morale:15,effect:{all:.9,weeks:1,name:'休整'}},{label:'再坚持一下',hint:'士气 −5，问题 +2',morale:-5,bugs:2}]},
    {id:'debt',tag:'架构提醒',title:'旧代码开始牵一发动全身',text:'偿还技术债能改善程序效率、维护费与完善度，不会凭空补满开发工作。',condition:s=>s.debt>8,choices:[{label:'整理架构',hint:'支出 ¥180，技术债 −7',cash:-180,debt:-7},{label:'标记风险',hint:'问题 +3',bugs:3}]},
    {id:'monetization',tag:'广告变现',title:'激励广告应该放在哪里？',text:'广告变现属于商业化，和花钱吸引新用户的买量是两项不同的工作。',condition:s=>s.people.ads>0||progress(s,'ads')>0,choices:[{label:'细化广告体验',hint:'广告变现软上限 +15%',caps:{ads:.15}},{label:'打磨展示方案',hint:'支出 ¥100，商业化潜力 +3',cash:-100,bonus:{commerce:3}}]},
    {id:'pricing',tag:'用户付费',title:'试玩者问：这份内容值得付费吗？',text:'团队看到了优化付费体验的空间，具体成果仍需推进用户付费工作。',condition:s=>s.people.payment>0||progress(s,'payment')>0,choices:[{label:'完善付费方案',hint:'用户付费软上限 +15%',caps:{payment:.15}},{label:'做一次付费体验研究',hint:'支出 ¥120，商业化潜力 +4',cash:-120,bonus:{commerce:4}}]},
    {id:'ip_plan',tag:'IP衍生',title:'角色表情包收到了合作询问',text:'衍生合作可以成为商业化的一部分，也可以先换取一笔实际预算。',min:.15,choices:[{label:'准备长期衍生方案',hint:'IP衍生软上限 +15%',caps:{ip:.15}},{label:'承接一次小型授权',hint:'生涯资金 +¥180，记入本作其他收入',cash:180}]},
    {id:'ad_plan',tag:'买量准备',title:'投放计划里还缺一笔预算',text:'买量已有人负责或由发行商托管，但预算为 ¥0：本周没有投放支出，也没有买量产出。解锁上限后，下周仍需设置预算。',condition:s=>(s.publisher||s.people.acquisition>0)&&s.adBudget===0,choices:[{label:'完善下一轮投放方案',hint:'买量软上限 +15%；不补发进度、不自动扣费',caps:{acquisition:.15}},{label:'先稳住团队状态',hint:'士气 +4；买量预算保持 ¥0',morale:4}]},
    {id:'store_page',tag:'上架资料',title:'商店页素材与授权目录对齐了',text:'上架没有软上限，资料和审核都必须真正做到 100%；此次只为后续工作提供条件。',condition:s=>s.publisher||s.people.materials>0||s.people.review>0,choices:[{label:'组织提交资料演练',hint:'支出 ¥100，下周发行能力相关岗位效率 +25%',cash:-100,effect:{job:'ops',mult:1.25,weeks:1,name:'资料演练'}},{label:'记录审核注意事项',hint:'士气 +4，当前完成度不变',morale:4}]},
    {id:'scale_review',tag:'规模复盘',title:'大作品需要分阶段啃下来',text:'规模同时放大工作需求与自然收入倍率，不会让同能力成员每周产出更多工作点。',condition:s=>s.scale!=='micro',choices:[{label:'梳理协作节点',hint:'系统协作软上限 +15%，下周全体效率 +10%',caps:{systems:.15},effect:{all:1.1,weeks:1,name:'分阶段协作'}},{label:'守住团队节奏',hint:'士气 +6',morale:6}]},
    {id:'market_rival',tag:'市场风向',title:'同类作品突然占据了讨论区',text:'市场自然收入会随机乘 0.10～10.00 倍。品质有用，但无法保证热销，也不能从今天的讨论预测最终系数。',min:.3,choices:[{label:'重看作品定位',hint:'支出 ¥120，题材软上限 +15%，内容潜力 +2',cash:-120,caps:{theme:.15},bonus:{content:2}},{label:'继续打磨自己的作品',hint:'士气 +6；市场结果仍在发售时确定',morale:6}]},
    {id:'market_watch',tag:'宣传认知',title:'榜单一夜换了风向',text:'宣传可以揭示作品评级，却不能消除市场随机。团队决定把反馈用在哪里。',condition:s=>s.publisher||s.people.publicity>0||progress(s,'publicity')>0,choices:[{label:'整理传播反馈',hint:'宣传软上限 +15%',caps:{publicity:.15}},{label:'补充测试清单',hint:'测试软上限 +15%，问题 −2',caps:{qa:.15},bugs:-2}]},
    {id:'cash_review',tag:'资金复盘',title:'先算清楚，还能开发几周',text:'所有项目共用生涯余额；结束全部未完成项目后可领取创业补助，补助不算作品盈利。买量回款扣除投放投入后，才是买量净回款。',condition:s=>s.money<5440,choices:[{label:'精简短期维护安排',hint:'未来 2 周维护费 −25%，工资与买量预算不变',effect:{job:'overhead',mult:.75,weeks:2,name:'维护节流'}},{label:'研究商业化短板',hint:'商业化三项软上限各 +15%',caps:{commerce:.15}}]},
    {id:'team_exchange',tag:'全局团队',title:'伙伴想交流一下各自的工作方法',text:'伙伴与主角能力会带入后续项目；每个人本周仍只能负责一个岗位。',condition:s=>s.team.length>2||availableRecruits(s).length>0,choices:[{label:'组织岗位分享',hint:'下周全体效率 +12%',effect:{all:1.12,weeks:1,name:'岗位分享'}},{label:'安排团队交流',hint:'士气 +7',morale:7}]}
  ];
  function event(s){const e=EVENTS.find(e=>e.id===s.pendingEvent);if(!e)return undefined;const g=group(s.pendingCapGroup),choices=e.choices.slice();if(g&&JOBS.some(j=>j.group===g.id&&softCap(s,j.id)<HARD_CAP))choices.push({label:'复盘并拓展'+g.name,hint:g.name+'各项完成度软上限 +15%，最高 100%；仍需安排工作',caps:{[g.id]:CAP_STEP}});return {...e,choices};}
  function eventChoiceStatus(s,i){if(s.paused)return {ok:false,reason:'项目已暂停'};const c=event(s)?.choices[i];if(!c)return {ok:false,reason:'无效选项'};if(c.cash<0&&s.money<-c.cash)return {ok:false,reason:'资金不足'};return {ok:true};}
  function checkMilestones(s){const n=coreProgress(s);for(const milestone of [{id:'prototype',check:n>=.3,name:'可玩原型'},{id:'vertical',check:n>=.65,name:'垂直切片'},{id:'content',check:coreReady(s),name:'内容完成'}])if(milestone.check&&!s.milestones.includes(milestone.id)){s.milestones.push(milestone.id);const newcomers=RECRUITS.filter(r=>r.stage===milestone.id&&!s.knownPartners.includes(r.id));s.knownPartners.push(...newcomers.map(r=>r.id));addLog(s,'达成「'+milestone.name+'」。'+(newcomers.length?newcomers.map(r=>r.name).join('、')+'发来伙伴来信，加入全局结识名单。':'已结识的伙伴会继续与你同行。'),'good');}}
  function resolveEvent(s,i){const e=event(s),c=e?.choices[i];if(s.over||s.paused||!eventChoiceStatus(s,i).ok)return false;if(c.cash){s.money+=c.cash;if(c.cash<0)s.spent-=c.cash;else s.income+=c.cash;}if(c.caps)unlockCaps(s,c.caps);if(c.bonus)Object.entries(c.bonus).forEach(([k,v])=>s.ratingBonus[k]=clamp(s.ratingBonus[k]+v,-12,12));s.bugs=Math.max(0,s.bugs+(c.bugs||0));s.debt=Math.max(0,s.debt+(c.debt||0));s.morale=clamp(s.morale+(c.morale||0),25,100);if(c.effect)s.effects.push(copy(c.effect));addLog(s,e.title+'：'+c.label+'。'+c.hint,c.cash<0?'info':'good');s.pendingEvent=null;s.pendingCapGroup=null;checkMilestones(s);return true;}
  function advance(s){if(blocked(s))return {ok:false,reason:'请先完成当前选择'};const c=cost(s);if(s.money<c.total)return {ok:false,reason:'资金不足以支付本周工资、维护和投放；可降低买量预算、签约发行商或发售。'};const contributions=s.team.map(m=>({id:m.id,name:m.name,job:m.job,output:memberOutput(s,m.id)}));s.money-=c.total;s.spent+=c.total;const {production,gains,ranges,impacts}=workWeek(s);s.effects=s.effects.map(e=>({...e,weeks:e.weeks-1})).filter(e=>e.weeks>0);s.history.push({week:s.week,cost:c.total,ads:c.ads,publisherAds:c.publisherAds,production,gains,ranges,impacts,team:contributions,money:s.money,ratings:quality(s)});addLog(s,'完成第 '+s.week+' 周：支出 ¥'+c.total+(c.ads?'（含买量 ¥'+c.ads+'）':'')+(c.publisherAds?'，发行商另垫付买量 ¥'+c.publisherAds:'')+(s.publisher?'，发行团队自动推进宣发与上架':'')+'。'+contributions.filter(m=>m.output>0).map(m=>m.name+'负责'+task(m.job).name).join('、')+'。');
    for(const impact of impacts)addLog(s,task(impact.from).name+'的调整牵连了'+task(impact.to).name+'，后者完成度 −'+impact.points+'%。');
    for(const j of JOBS)if(gains[j.id]<0)addLog(s,task(j.id).name+'本周净变化：'+round(gains[j.id]/s.req[j.id]*100)+'%。');
    const events=EVENTS.filter(e=>(!e.min||coreProgress(s)>=e.min)&&(!e.condition||e.condition(s))&&e.id!==s.lastEvent),e=events[Math.floor(random(s)*events.length)],groups=GROUPS.filter(g=>g.id!=='release'&&JOBS.some(j=>j.group===g.id&&softCap(s,j.id)<HARD_CAP));s.pendingEvent=e.id;s.pendingCapGroup=groups.length?groups[Math.floor(random(s)*groups.length)].id:null;s.lastEvent=e.id;s.week++;s.managed=false;return {ok:true,event:e.id};}
  function preview(s,ignoreModeEffects=false){if(blocked(s))return null;const p=copy(s),c=cost(p),{production,gains,ranges}=workWeek(p,true,ignoreModeEffects);return {production,gains,ranges,cost:c,work:p.work,bugs:p.bugs,debt:p.debt,bottlenecks:p.lastBottlenecks,money:s.money-c.total};}
  // UI estimates use full efficiency; actual settlement retains real-mode slowdown, rework and spillover.
  function progressEstimate(s){return preview(s,true);}
  function assignmentEstimate(s,memberId,job){
    const projected=copy(s);
    if(!assignMember(projected,memberId,job))return null;
    const plan=progressEstimate(projected);
    if(!plan||job==='idle')return null;
    return {gain:plan.gains[job],percent:round(plan.gains[job]/projected.req[job]*100),production:plan.production[job],teamSize:projected.people[job]};
  }
  // Exact subset DP: each job's gain depends only on the members assigned to it.
  // Full-efficiency estimates make job gains additive; publisher work is constant.
  function automaticAssignmentPlan(s){
    if(!s||blocked(s))return {ok:false,improved:false,reason:'请先恢复项目并处理当前事件。'};
    const n=s.team.length,size=1<<n,all=size-1,epsilon=1e-10;
    const weekly=cost(s),baseCost=weekly.total-weekly.ads;
    const canBuy=!!s.publisher||baseCost+s.adBudget<=s.money;
    const m=mods(s),jobs=JOBS.filter(j=>!publisherManaged(s,j.id)&&(j.id!=='acquisition'||canBuy));
    const tables=jobs.map(j=>{
      let allowed=0,current=0;const values=new Float64Array(size),changes=new Uint8Array(size);
      s.team.forEach((p,i)=>{if(taskSkill(p,j.id)>0)allowed|=1<<i;if(p.job===j.id)current|=1<<i;});
      const room=Math.max(0,workLimit(s,j.id)-s.work[j.id]);
      for(let bits=0;bits<size;bits++){
        if(bits&~allowed)continue;
        const members=s.team.filter((p,i)=>bits&(1<<i));
        const amount=round(jobContributions(s,j.id,members,m).reduce((sum,p)=>sum+p.output,0));
        const after=round(clamp(s.work[j.id]+Math.min(room,amount),0,s.req[j.id]));
        values[bits]=round(after-s.work[j.id])/s.req[j.id];
        for(let i=0;i<n;i++)if(bits&(1<<i)&&!(current&(1<<i)))changes[bits]++;
      }
      return {job:j.id,allowed,values,changes};
    });
    let scores=new Float64Array(size).fill(-Infinity),counts=new Uint8Array(size).fill(255);scores[0]=0;counts[0]=0;
    const parents=[];
    for(const table of tables){
      const next=new Float64Array(size).fill(-Infinity),nextCounts=new Uint8Array(size).fill(255),chosen=new Int16Array(size).fill(-1);
      for(let used=0;used<size;used++){
        if(scores[used]===-Infinity)continue;
        const remaining=table.allowed&~used;
        for(let bits=remaining;;bits=(bits-1)&remaining){
          const mask=used|bits,value=scores[used]+table.values[bits],changed=counts[used]+table.changes[bits];
          if(value>next[mask]+epsilon||Math.abs(value-next[mask])<=epsilon&&changed<nextCounts[mask]){next[mask]=value;nextCounts[mask]=changed;chosen[mask]=bits;}
          if(!bits)break;
        }
      }
      scores=next;counts=nextCounts;parents.push(chosen);
    }
    let best=-Infinity,bestChanges=255,mask=0;
    for(let used=0;used<size;used++){
      if(scores[used]===-Infinity)continue;
      let changed=counts[used];for(let i=0;i<n;i++)if(!(used&(1<<i))&&s.team[i].job!=='idle')changed++;
      if(scores[used]>best+epsilon||Math.abs(scores[used]-best)<=epsilon&&changed<bestChanges){best=scores[used];bestChanges=changed;mask=used;}
    }
    const assignments=Object.fromEntries(s.team.map(p=>[p.id,'idle']));
    for(let i=tables.length-1;i>=0;i--){const bits=parents[i][mask];s.team.forEach((p,k)=>{if(bits&(1<<k))assignments[p.id]=tables[i].job;});mask^=bits;}
    const proposed=copy(s);for(const member of proposed.team)member.job=assignments[member.id];syncPeople(proposed);
    const before=progressEstimate(s),after=progressEstimate(proposed);
    const total=plan=>JOBS.reduce((sum,j)=>sum+plan.gains[j.id]/s.req[j.id],0)/JOBS.length*100;
    const beforeProgress=total(before),afterProgress=total(after);
    const improved=afterProgress>beforeProgress+epsilon||before.cost.total>s.money&&after.cost.total<=s.money;
    return {ok:true,improved,beforeProgress,afterProgress:improved?afterProgress:beforeProgress,beforeCost:before.cost.total,afterCost:improved?after.cost.total:before.cost.total,budgetLimited:!canBuy,assignments:improved?assignments:Object.fromEntries(s.team.map(p=>[p.id,p.job])),changes:improved?s.team.filter(p=>assignments[p.id]!==p.job).map(p=>({id:p.id,name:p.name,from:p.job,to:assignments[p.id]})):[]};
  }
  function autoAssign(s){
    const plan=automaticAssignmentPlan(s);if(!plan.ok||!plan.improved)return plan;
    for(const member of s.team)member.job=plan.assignments[member.id];syncPeople(s);return plan;
  }

  function softCapWarnings(s){
    if(!s||s.over||s.paused)return [];
    return JOBS.filter(j=>j.group!=='release'&&s.people[j.id]>0&&progress(s,j.id)>=softCap(s,j.id)-1e-9).map(j=>({
      job:j.id,name:j.name,completion:round(progress(s,j.id)*100),cap:round(softCap(s,j.id)*100),
      members:s.team.filter(m=>m.job===j.id).map(m=>({id:m.id,name:m.name})),
      full:softCap(s,j.id)>=HARD_CAP,
      ongoing:j.id==='systems'?'仍可偿还技术债':j.id==='qa'?'仍可修复问题':j.id==='acquisition'&&s.adBudget>0?'仍会按本周预算继续买量并扣费':'',
      rework:workPhase(s,j.id).id==='uncertain'
    }));
  }

  function objectiveStatus(s,result){if(result)return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,value:s.objective==='acclaim'?result.rating:result.profit,ok:result.objectiveOK,ready:true,known:true};const f=forecast(s),low=s.objective==='acclaim'?f.rating.low:f.low+s.income-s.spent,high=s.objective==='acclaim'?f.rating.high:f.high+s.income-s.spent,target=s.objective==='acclaim'?60:1200;return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,low,high,known:f.exact,ready:complete(s),ok:complete(s)&&low>=target,possible:high>=target};}
  function finish(s,released){
    if(!s||s.over||s.paused||released&&!canRelease(s))return false;
    const trueValue=overallScore(s),rating=grade(trueValue),scaleRevenueMultiplier=projectScale(s).revenueMultiplier;
    const organicBaseRevenue=released?organic(s,trueValue,trueScore(s,'commerce')):0,marketFactor=released?marketMultiplier(random(s)):null;
    const organicGrossRevenue=released?Math.round(organicBaseRevenue*marketFactor):0,organicRevenue=s.publisher?Math.floor(organicGrossRevenue*.5):organicGrossRevenue,publisherOrganicRevenue=organicGrossRevenue-organicRevenue;
    const ad=adSettlement(s,adRate(s),released),adRevenue=ad.studioRevenue,revenue=organicRevenue+adRevenue;
    const recoveryRate=!released&&s.spent>0?(10+Math.floor(random(s)*41))/100:null,recovery=recoveryRate===null?0:Math.round(s.spent*recoveryRate);
    const profit=revenue+recovery+s.income-s.spent,objectiveOK=!!released&&(s.objective==='acclaim'?gradeIndex(trueValue)>=9:profit>=1200);
    const exp=released?Math.round(35+trueValue*.9+(profit>0?20:0)+(s.hard?25:0)+(objectiveOK?40:0)):Math.min(30,s.milestones.length*8);
    s.money+=revenue+recovery;s.over=true;s.pendingEvent=null;s.pendingCapGroup=null;
    s.result={runId:s.id,stage:s.stage,walletStart:s.initialMoney,walletEnd:s.money,sharedCashDelta:s.sharedCashDelta,name:s.name,hard:s.hard,totalCompletion:round(JOBS.reduce((n,j)=>n+progress(s,j.id),0)/JOBS.length*100),progress:Object.fromEntries(GROUPS.map(g=>[g.id,round(groupProgress(s,g.id)*100)])),scale:s.scale,released,weeks:s.week-1,score:Math.round(trueValue),rating:released?rating:'—',ratings:released?Object.fromEntries(GROUPS.filter(g=>g.id!=='release').map(g=>[g.id,{grade:grade(trueScore(s,g.id)),score:trueScore(s,g.id)}])):null,organicRevenue,organicGrossRevenue,publisherOrganicRevenue,organicBaseRevenue,marketMultiplier:marketFactor,scaleRevenueMultiplier,adRevenue,adGrossRevenue:ad.gross,adNetRevenue:ad.studioNet,adCampaignNetRevenue:ad.campaignNet,adSpend:s.adSpend,studioAdSpend:ad.studioSpend,publisherAdSpend:ad.publisherSpend,publisherAdRevenue:ad.publisherRevenue,publisherAdRecovered:ad.publisherRecovered,publisherAdProfit:ad.publisherProfit,publisherAdLoss:ad.publisherLoss,adRate:released?adRate(s):null,publisher:copy(s.publisher),otherIncome:s.income,revenue,recovery,recoveryRate,cost:s.spent,profit,exp,objective:s.objective,objectiveOK,team:copy(s.team),seed:s.seed};
    addLog(s,released?'「'+s.name+'」正式发售，真实评级与发行账目已揭晓。':'项目已结束，回收工作室投入 '+recovery.toLocaleString('zh-CN')+' 元，保留里程碑经验。',released?'good':'info');return s.result;
  }
  function emptyMeta(){return {version:3,wallet:INITIAL_FUNDS,hero:{name:HERO.name,skills:copy(HERO.skills)},partners:[],knownPartners:[],exp:0,earnedExp:0,stage:1,activeRunId:null,pausedProjects:[],receipts:{},history:[]};}
  function validateMeta(m){try{return !!m&&m.version===3&&Number.isFinite(m.wallet)&&m.wallet>=0&&Number.isInteger(m.exp)&&m.exp>=0&&Number.isInteger(m.earnedExp)&&m.earnedExp>=m.exp&&Number.isInteger(m.stage)&&m.stage>=1&&m.hero&&typeof m.hero.name==='string'&&m.hero.name.trim().length>0&&m.hero.name.length<=12&&SKILLS.every(j=>Number.isInteger(m.hero.skills[j.id])&&m.hero.skills[j.id]>=100&&m.hero.skills[j.id]<=200)&&[m.partners,m.knownPartners].every(a=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(id=>RECRUITS.some(r=>r.id===id)))&&m.partners.every(id=>m.knownPartners.includes(id))&&m.receipts&&typeof m.receipts==='object'&&!Array.isArray(m.receipts)&&Array.isArray(m.history)&&Array.isArray(m.pausedProjects)&&m.pausedProjects.every(p=>validateRun(p)&&p.paused&&!p.over&&p.id!==m.activeRunId&&p.stage<m.stage)&&new Set(m.pausedProjects.map(p=>p.id)).size===m.pausedProjects.length&&(m.activeRunId===null||typeof m.activeRunId==='string');}catch{return false;}}
  function syncCareer(meta,s){if(s&&!s.over&&!s.paused&&meta.activeRunId===s.id){meta.wallet=s.money;const hero=s.team.find(p=>p.id==='hero');meta.hero={name:hero.name,skills:copy(hero.skills)};meta.partners=s.team.filter(m=>m.kind==='partner').map(m=>m.id);meta.knownPartners=s.knownPartners.slice();}return meta;}
  function startupAidStatus(meta,s=null){
    const threshold=scalePlan('micro').minFunds,live=!!meta?.activeRunId;
    const valid=validateMeta(meta)&&(!live||(validateRun(s)&&!s.over&&!s.paused&&s.id===meta.activeRunId));
    const balance=live?s?.money:meta?.wallet,unfinished=(live?1:0)+(meta?.pausedProjects?.length||0);
    const lowFunds=valid&&balance<threshold,eligible=lowFunds&&unfinished===0;
    return {eligible:!!eligible,lowFunds:!!lowFunds,unfinished,balance,threshold,target:INITIAL_FUNDS,amount:eligible?round(INITIAL_FUNDS-balance):0,reason:unfinished?'请先结束所有未完成项目（含暂停项目），再领取创业补助。':lowFunds?'':'余额尚未低于最低立项门槛。'};
  }
  function claimStartupAid(meta,s=null){
    const aid=startupAidStatus(meta,s);if(!aid.eligible)return 0;
    meta.wallet=aid.target;return aid.amount;
  }
  function trainingCost(meta,id){return SKILLS.some(j=>j.id===id)?40+(meta.hero.skills[id]-100)*2:Infinity;}
  function train(meta,id){const price=trainingCost(meta,id);if(meta.activeRunId||!Number.isFinite(price)||meta.exp<price||meta.hero.skills[id]>=200)return false;meta.exp-=price;meta.hero.skills[id]=Math.min(200,meta.hero.skills[id]+5);return true;}
  function renameHero(meta,name){const value=String(name||'').trim().slice(0,12);if(meta.activeRunId||!value)return false;meta.hero.name=value;return true;}
  function hirePartner(meta,id){if(meta.activeRunId||meta.wallet<180||meta.partners.length>=6||!meta.knownPartners.includes(id)||meta.partners.includes(id))return false;meta.partners.push(id);meta.wallet-=180;return true;}
  function dismissPartner(meta,id){if(meta.activeRunId||meta.wallet<100||!meta.partners.includes(id))return false;meta.partners=meta.partners.filter(member=>member!==id);meta.wallet-=100;return true;}
  function settle(meta,s){const m=copy(meta);if(!s.over||!s.result||Object.prototype.hasOwnProperty.call(m.receipts,s.id)||m.activeRunId!==s.id)return m;const r=copy(s.result),hero=s.team.find(m=>m.id==='hero');m.receipts[s.id]=r.exp;m.exp+=r.exp;m.earnedExp+=r.exp;m.wallet=r.walletEnd;m.hero={name:hero.name,skills:copy(hero.skills)};m.partners=s.team.filter(m=>m.kind==='partner').map(m=>m.id);m.knownPartners=s.knownPartners.slice();m.stage=Math.max(m.stage,s.stage+1);m.activeRunId=null;m.history.unshift(r);return m;}
  function pauseProject(meta,s){if(!validateMeta(meta)||!validateRun(s)||s.over||s.paused||meta.activeRunId!==s.id)return false;syncCareer(meta,s);s.paused=true;meta.pausedProjects.push(copy(s));meta.activeRunId=null;return true;}
  function resumeProject(meta,id,current=null){if(!validateMeta(meta))return null;const target=meta.pausedProjects.find(p=>p.id===id);if(!target)return null;if(meta.activeRunId&&(!current||current.id!==meta.activeRunId||!pauseProject(meta,current)))return null;meta.pausedProjects=meta.pausedProjects.filter(p=>p.id!==id);target.sharedCashDelta=round(target.sharedCashDelta+meta.wallet-target.money);target.money=meta.wallet;target.paused=false;const previous=target.team;target.team=createTeam(meta.hero,meta.partners).map(m=>{const old=previous.find(p=>p.id===m.id);if(old){m.job=(old.job==='idle'||taskSkill(m,old.job)>0)&&!publisherManaged(target,old.job)?old.job:'idle';m.lastJob=old.lastJob;}else{m.lastJob='idle';if(publisherManaged(target,m.job))m.job='idle';}return m;});target.departed=target.departed.filter(id=>!meta.partners.includes(id));target.knownPartners=meta.knownPartners.slice();syncPeople(target);meta.activeRunId=target.id;return target;}
  function endProject(meta,id,current=null){
    if(!validateMeta(meta)||Object.prototype.hasOwnProperty.call(meta.receipts,id))return false;
    if(meta.activeRunId&&(!validateRun(current)||current.over||current.paused||current.id!==meta.activeRunId))return false;
    const active=meta.activeRunId===id,target=active?current:meta.pausedProjects.find(p=>p.id===id);
    if(!target)return false;
    syncCareer(meta,current);
    if(active){const result=finish(current,false);if(!result)return false;Object.assign(meta,settle(meta,current));return result;}
    const ending=copy(target);ending.sharedCashDelta=round(ending.sharedCashDelta+meta.wallet-ending.money);ending.money=meta.wallet;ending.paused=false;
    const result=finish(ending,false);if(!result)return false;
    meta.pausedProjects=meta.pausedProjects.filter(p=>p.id!==id);meta.receipts[id]=result.exp;meta.exp+=result.exp;meta.earnedExp+=result.exp;meta.wallet=ending.money;meta.history.unshift(copy(result));
    if(meta.activeRunId){current.money=meta.wallet;current.sharedCashDelta=round(current.sharedCashDelta+result.recovery);}
    return result;
  }
  function validateSnapshot(snapshot){try{if(!snapshot||!validateMeta(snapshot.meta))return false;const {meta,run}=snapshot;if(meta.activeRunId)return validateRun(run)&&!run.over&&!run.paused&&run.id===meta.activeRunId&&run.money===meta.wallet&&run.stage<meta.stage;return !run||validateRun(run)&&run.over&&!run.paused;}catch{return false;}}
  function teamVoice(s,e){const skill={palette:'art',backup:'code',bug:'test',forms:'ops',showcase:'ops',inspiration:'design',scope:'design',feedback:'test'}[e?.id],m=s.team.find(m=>task(m.job)?.skill===skill)||s.team.find(m=>m.id==='ace');return {id:m.id,name:m.name,text:e?.id==='feedback'?'反馈让我们更接近真实评价，但不一定是我们原先想的那样。':m.quote};}
  function validateRun(s){try{if(!s||s.version!==VERSION||typeof s.paused!=='boolean'||!Number.isInteger(s.stage)||s.stage<1||!SCALES.some(g=>g.id===s.scale)||!Number.isInteger(s.week)||s.week<1||!Array.isArray(s.team)||s.team.length<2||s.team.length>8)return false;for(const a of ['departed','history','logs','effects','milestones','knownPartners'])if(!Array.isArray(s[a]))return false;if(new Set(s.knownPartners).size!==s.knownPartners.length||s.knownPartners.some(id=>!RECRUITS.some(r=>r.id===id))||s.team.some(m=>m.kind==='partner'&&!s.knownPartners.includes(m.id)))return false;if(!s.work||!s.req||!s.softCaps||typeof s.hard!=='boolean'||s.pendingCapGroup&&!GROUPS.some(g=>g.id===s.pendingCapGroup&&g.id!=='release')||!s.people||!['normal','rest','crunch'].includes(s.pace)||!['profit','acclaim'].includes(s.objective)||!AD_BUDGETS.includes(s.adBudget))return false;const ids=s.team.map(m=>m.id);if(new Set(ids).size!==ids.length||!s.team.some(m=>m.id==='hero'&&m.kind==='hero')||!s.team.some(m=>m.id==='ace'&&m.kind==='companion'))return false;if(!s.team.every(m=>typeof m.name==='string'&&m.name.length>0&&Number.isFinite(m.salary)&&m.salary>=0&&['idle',...JOBS.map(j=>j.id)].includes(m.lastJob)&&SKILLS.every(j=>Number.isFinite(m.skills[j.id])&&m.skills[j.id]>=0&&m.skills[j.id]<=200)&&(m.job==='idle'||taskSkill(m,m.job)>0&&!publisherManaged(s,m.job))))return false;
    return JOBS.every(j=>(j.group==='release'||Number.isFinite(s.softCaps[j.id])&&s.softCaps[j.id]>=INITIAL_SOFT_CAP&&s.softCaps[j.id]<=HARD_CAP&&s.work[j.id]<=s.req[j.id]*s.softCaps[j.id]+.01)&&Number.isFinite(s.work[j.id])&&s.work[j.id]>=0&&Number.isFinite(s.req[j.id])&&s.req[j.id]>0&&s.work[j.id]<=s.req[j.id]+.01&&s.people[j.id]===s.team.filter(m=>m.job===j.id).length)&&s.reserve===s.team.filter(m=>m.job==='idle').length&&GROUPS.filter(g=>g.id!=='release').every(g=>Number.isFinite(s.ratingRolls[g.id])&&Math.abs(s.ratingRolls[g.id])<=28&&Number.isFinite(s.revealRolls[g.id])&&Math.abs(s.revealRolls[g.id])<=1&&Number.isFinite(s.ratingBonus[g.id]))&&[s.money,s.spent,s.income,s.adSpend,s.bugs,s.debt,s.morale,s.rng,s.seed,s.initialMoney,s.sharedCashDelta].every(Number.isFinite)&&s.money>=0&&s.spent>=0&&s.adSpend>=0&&s.adSpend<=(s.spent+(s.publisher?.adSpend||0))&&(s.publisher===null||s.publisher&&Number.isFinite(s.publisher.advance)&&s.publisher.advance>0&&Number.isInteger(s.publisher.signWeek)&&s.publisher.signWeek>=1&&s.publisher.signWeek<=s.week&&Number.isFinite(s.publisher.adSpend)&&s.publisher.adSpend>=0&&s.publisher.adSpend<=s.adSpend&&s.publisher.quote&&s.publisher.quote.advance===s.publisher.advance)&&(!s.pendingEvent||EVENTS.some(e=>e.id===s.pendingEvent))&&(!s.over||!!s.result);
    }catch{return false;}}
  return {VERSION,MARKET_MIN,MARKET_MAX,marketMultiplier,revenueRules,INITIAL_FUNDS,startupAidStatus,claimStartupAid,STANDARD_WEEKLY_WORK,STANDARD_PERSON_WEEK_COST,scalePlan,projectNameStatus,HARD_CAP,INITIAL_SOFT_CAP,CAP_STEP,softCap,workPhase,SKILLS,GROUPS,JOBS,GRADES,AD_RATES,AD_BUDGETS,HERO,COMPANION,RECRUITS,SCALES,baseRequirements,PUBLISHER_JOBS,PUBLISHER_WEEKLY_WORK,publisherManaged,publisherQuote,signPublisher,adSettlement,OBJECTIVES,EVENTS,skillLabel,taskSkill,assignMember,availableRecruits,memberOutput,teamVoice,newRun,pauseProject,resumeProject,endProject,validateSnapshot,mods,cost,teamSize,progress,groupProgress,coreProgress,coreReady,complete,goals,canRelease,quality,trueScore,overallScore,grade,gradeIndex,revealLevel,ratingView,overallView,adRate,adProjection,buyingStatus,setAdBudget,forecast,incomeView,objectiveStatus,throughput,workDependency,workLimit,hire,downsize,advance,event,eventChoiceStatus,resolveEvent,preview,progressEstimate,assignmentEstimate,automaticAssignmentPlan,autoAssign,softCapWarnings,finish,emptyMeta,settle,validateMeta,syncCareer,trainingCost,train,renameHero,hirePartner,dismissPartner,validateRun,copy};
});
