/* 天才程序员带我做游戏 v0.18.0 · shared career and pausable projects. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioGame=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=18;
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
  const PERSON_RANKS=[
    {id:'N',min:0,color:'#a5acb7',shape:'circle'},
    {id:'R',min:80,color:'#76b5e7',shape:'diamond'},
    {id:'SR',min:110,color:'#ba9ce9',shape:'star4'},
    {id:'SSR',min:135,color:'#e4c074',shape:'star6'},
    {id:'UR',min:165,color:'#f0a578',shape:'crown'}
  ];
  function abilityScore(person){const values=SKILLS.map(k=>person.skills[k.id]||0).sort((a,b)=>b-a);return Math.round((values[0]*.6+values[1]*.25+(values[2]+values[3]+values[4])*.05)*100)/100;}
  function personRank(person){if(person.id==='hero'||person.kind==='hero')return null;if(person.id==='ace'||person.kind==='companion')return {id:'EX',color:'#a2e0cc',shape:'horns',score:null};const score=abilityScore(person);return {...PERSON_RANKS.filter(r=>score>=r.min).at(-1),score};}
  function recruitUnlockText(person){const n=recruitReputation(person);return n?'累计名誉达到 '+n+' 后结识':'初始即可结识';}
  const HERO={id:'hero',name:'你',title:'独立制作人',kind:'hero',skills:{design:100,code:100,art:100,test:100,ops:100},salary:72,quote:'这一作积累的经验，会陪我走到下一作。',bio:'五项基础能力均为 100%；在局外生涯中训练后永久提高，跨项目继承。',color:'#d8b879',look:0};
  const COMPANION={id:'ace',name:'天才程序员',title:'白发有角龙娘 · 全能搭档',kind:'companion',skills:{design:145,code:145,art:145,test:145,ops:145},salary:96,quote:'你来决定方向，我来补上最需要的一块。',bio:'白发有角龙娘，强的可怕。',color:'#81bea7',look:5};
  const RECRUITS=[
    {"id":"lin","name":"林绘","title":"独立美术","skills":{"design":90,"code":0,"art":170,"test":40,"ops":55},"salary":88,"stage":"prototype","quote":"这个原型，我想给它画一片天空。","bio":"被你的可玩原型打动，擅长视觉表达，完全不会写程序。","color":"#bc9fe4","look":2},
    {"id":"shen","name":"沈序","title":"引擎程序员","skills":{"design":60,"code":170,"art":0,"test":95,"ops":40},"salary":96,"stage":"prototype","quote":"你的原型挺有意思，技术部分交给我。","bio":"喜欢有野心的系统，能承担复杂实现，不会美术制作。","color":"#76a9e7","look":3},
    {"id":"tang","name":"唐砚","title":"叙事设计师","skills":{"design":165,"code":40,"art":110,"test":0,"ops":75},"salary":92,"stage":"vertical","quote":"切片里的世界，还能再多一点回响。","bio":"看过垂直切片后主动来信，擅长设计与画面叙事，不做测试。","color":"#d8b879","look":4},
    {"id":"wen","name":"温衡","title":"质量工程师","skills":{"design":75,"code":100,"art":0,"test":175,"ops":65},"salary":90,"stage":"vertical","quote":"让每一个好设计，都能可靠地到达玩家。","bio":"相信打磨决定作品的最后一公里，擅长验收、修复与重构。","color":"#80ba91","look":5},
    {"id":"xia","name":"夏禾","title":"发行联络人","skills":{"design":100,"code":40,"art":65,"test":0,"ops":175},"salary":84,"stage":"content","quote":"内容完成了，接下来让玩家找到它。","bio":"关注到你的完整版本，熟悉资质与渠道准备，不会测试。","color":"#dd957d","look":6},
    {"id":"lu","name":"陆简","title":"交付协调员","skills":{"design":70,"code":95,"art":0,"test":125,"ops":135},"salary":88,"stage":"content","quote":"验收和上架，我们一起把最后几步走稳。","bio":"擅长测试和发行之间的协作，不会美术，适合收尾阶段。","color":"#8bbfc5","look":7},
    {"id":"yu","name":"余苗","title":"策划实习生","skills":{"design":90,"code":40,"art":20,"test":0,"ops":0},"salary":32,"stage":"opening","quote":"先把一个小点子做清楚。","bio":"刚入行的策划，愿意反复整理玩法笔记，不会测试与发行。","color":"#b1ac91","look":8},
    {"id":"chi","name":"池川","title":"初级程序员","skills":{"design":20,"code":95,"art":0,"test":35,"ops":10},"salary":35,"stage":"opening","quote":"今天也少写一个临时补丁。","bio":"负责简单实现与脚本维护，不会美术，适合低预算起步。","color":"#849cae","look":9},
    {"id":"mo","name":"墨小雨","title":"美术学徒","skills":{"design":30,"code":0,"art":100,"test":20,"ops":10},"salary":36,"stage":"opening","quote":"我想给这款游戏画第一张图。","bio":"喜欢像素和色块，负责基础美术，不会程序。","color":"#c99db0","look":10},
    {"id":"qiao","name":"乔安","title":"测试助理","skills":{"design":10,"code":40,"art":0,"test":95,"ops":20},"salary":33,"stage":"opening","quote":"我会把每一步都记下来。","bio":"耐心执行验收步骤，对程序略有了解，完全不会美术。","color":"#91b29e","look":11},
    {"id":"le","name":"乐小满","title":"社区助理","skills":{"design":35,"code":10,"art":20,"test":0,"ops":95},"salary":34,"stage":"opening","quote":"先认真回复每一条留言。","bio":"负责基础发行事务和玩家沟通，不会测试。","color":"#c5ae7b","look":12},
    {"id":"ning","name":"宁禾","title":"制作助理","skills":{"design":75,"code":70,"art":50,"test":35,"ops":0},"salary":38,"stage":"opening","quote":"哪里缺人，我就先去学。","bio":"可以协助多项基础工作，但缺少突出专长，不会发行。","color":"#aaa7c2","look":13},
    {"id":"he","name":"何知","title":"玩法策划","skills":{"design":135,"code":20,"art":70,"test":45,"ops":0},"salary":65,"stage":"opening","quote":"规则讲清楚，乐趣才会留下来。","bio":"擅长玩法设计，能画简单示意稿，不处理发行事务。","color":"#d4b47c","look":14},
    {"id":"you","name":"游弈","title":"工具程序员","skills":{"design":40,"code":135,"art":0,"test":75,"ops":20},"salary":68,"stage":"opening","quote":"重复三次的事，就写成工具吧。","bio":"擅长程序与工具，能承担部分测试，不会美术。","color":"#7da6bd","look":15},
    {"id":"qiu","name":"秋染","title":"像素美术师","skills":{"design":65,"code":0,"art":140,"test":30,"ops":20},"salary":66,"stage":"opening","quote":"四个像素也能有自己的表情。","bio":"擅长像素场景和角色绘制，不会写程序。","color":"#c292b8","look":16},
    {"id":"cheng","name":"程谨","title":"功能测试员","skills":{"design":30,"code":80,"art":0,"test":135,"ops":25},"salary":64,"stage":"opening","quote":"能复现，就能把验收做扎实。","bio":"擅长测试，了解实现逻辑，不会美术。","color":"#87b19a","look":17},
    {"id":"su","name":"苏晴","title":"社区运营","skills":{"design":75,"code":20,"art":40,"test":0,"ops":135},"salary":63,"stage":"opening","quote":"把合适的游戏送到合适的人面前。","bio":"擅长发行事务和玩家交流，不会测试。","color":"#d09a82","look":18},
    {"id":"zhao","name":"赵平","title":"综合开发者","skills":{"design":110,"code":100,"art":0,"test":65,"ops":55},"salary":70,"stage":"opening","quote":"先让今天的版本完整跑起来。","bio":"策划与程序都能胜任，适合灵活补位，不会美术。","color":"#9bafb4","look":19},
    {"id":"ji","name":"纪澄","title":"自动化测试工程师","skills":{"design":70,"code":100,"art":0,"test":155,"ops":55},"salary":94,"stage":"prototype","quote":"把验证流程也做成作品的一部分。","bio":"擅长测试与基础程序协作，不会美术；被可玩原型吸引而来。","color":"#81b6a4","look":20},
    {"id":"bai","name":"白露","title":"商业化设计师","skills":{"design":100,"code":40,"art":60,"test":0,"ops":160},"salary":96,"stage":"vertical","quote":"好的付费体验，也应该让人舒服。","bio":"擅长商业化与发行设计，理解策划，不会测试。","color":"#d6a187","look":21},
    {"id":"xu","name":"许望","title":"创意总监","skills":{"design":190,"code":80,"art":130,"test":0,"ops":50},"salary":128,"stage":"vertical","quote":"让每一处设计都服务于同一种体验。","bio":"顶尖策划，兼具美术表达能力，不会测试。","color":"#d6bd82","look":22},
    {"id":"han","name":"韩栈","title":"架构专家","skills":{"design":65,"code":195,"art":0,"test":130,"ops":45},"salary":132,"stage":"content","quote":"复杂的系统，也能有干净的边界。","bio":"顶尖程序专家，擅长测试协作，不会美术。","color":"#87b4d3","look":23},
    {"id":"gu","name":"顾星河","title":"创意大师","skills":{"design":200,"code":100,"art":180,"test":0,"ops":60},"salary":172,"stage":"content","quote":"给玩家一个离开之后还会想起的世界。","bio":"策划与美术双专长，能理解技术实现，不会测试。","color":"#e5bf73","look":24},
    {"id":"zero","name":"零一","title":"技术大师","skills":{"design":100,"code":200,"art":0,"test":185,"ops":60},"salary":178,"stage":"content","quote":"让宏大的想法，也能稳稳运行。","bio":"程序与测试双专长，面对复杂实现游刃有余，不会美术。","color":"#93c9dc","look":25},
    {"id":"shang","name":"商时雨","title":"商业大师","skills":{"design":180,"code":60,"art":100,"test":0,"ops":200},"salary":175,"stage":"content","quote":"先理解作品，再找到它应得的市场。","bio":"发行与策划双专长，能参与美术表达，不会测试。","color":"#e3a786","look":26}
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
    {id:'qa',name:'测试',group:'framework',skill:'test',base:40,desc:'验证已实现内容，推进测试完成度与完善度。'},
    {id:'ads',name:'广告变现',group:'commerce',skill:'ops',base:32,desc:'设计广告接入与体验，影响商业化表现。'},
    {id:'payment',name:'用户付费',group:'commerce',skill:'design',base:32,desc:'设计付费价值和转化路径。'},
    {id:'ip',name:'IP衍生',group:'commerce',skill:'art',base:32,desc:'制作衍生内容与形象，扩展商业价值。'},
    {id:'publicity',name:'宣传',group:'promotion',skill:'ops',base:64,desc:'收集玩家反馈，逐步缩小四项评级的认知误差。'},
    {id:'acquisition',name:'买量',group:'promotion',skill:'ops',base:40,desc:'安排投放并消耗预算，发售时按综合真实评级回款。'},
    {id:'materials',name:'资料准备',group:'release',skill:'ops',base:40,desc:'整理上架资料，必须完成。'},
    {id:'review',name:'审核进度',group:'release',skill:'ops',base:40,desc:'资料完成后推进审核，必须完成。'}
  ].map(j=>({...j,short:j.name,color:GROUPS.find(g=>g.id===j.group).color,icon:GROUPS.find(g=>g.id===j.group).icon}));

  const WORK_PROFILES=[
    {id:'balanced',name:'均衡制作',note:'各模块需求均衡，适合熟悉开发流程。',core:[32,48,40,64,40,40,32,32,32]},
    {id:'content',name:'内容偏重',note:'内容工作更多，策划与美术伙伴更有发挥空间。',core:[40,64,52,56,32,32,28,28,28]},
    {id:'systems',name:'系统偏重',note:'实现与验收工作更多，程序与测试伙伴更有发挥空间。',core:[28,36,32,84,56,52,24,24,24]},
    {id:'commerce',name:'商业设计偏重',note:'商业设计工作更多，发行与综合设计伙伴更有发挥空间。',core:[28,40,32,56,32,32,48,48,44]}
  ];
  function workProfile(s){return WORK_PROFILES.find(p=>p.id===s.workProfile);}
  const PUBLISHER_STAGES=[{id:'signing',name:'签约金',threshold:0,ratio:.2},{id:'prototype',name:'核心开发 30%',threshold:.3,ratio:.4},{id:'polish',name:'核心开发 60%',threshold:.6,ratio:.4}];
  function publisherFunding(s){
    const q=s.publisher?.quote||publisherQuote(s),paid=s.publisher?.paidStages||[];
    const amounts=[Math.floor(q.advance*.2),Math.floor(q.advance*.4)];amounts.push(q.advance-amounts[0]-amounts[1]);
    return {total:q.advance,received:s.publisher?.advance||0,pending:q.advance-(s.publisher?.advance||0),core:round(coreProgress(s)*100),stages:PUBLISHER_STAGES.map((stage,i)=>({...stage,amount:amounts[i],paid:paid.includes(stage.id)}))};
  }
  function payPublisherMilestones(s){
    if(!s.publisher)return 0;let amount=0;
    for(const stage of publisherFunding(s).stages)if(!stage.paid&&coreProgress(s)+1e-9>=stage.threshold){s.publisher.paidStages.push(stage.id);s.publisher.advance+=stage.amount;amount+=stage.amount;addLog(s,'发行开发款到账：'+stage.name+'，+¥'+stage.amount+'。','good');}
    s.income+=amount;s.money+=amount;return amount;
  }
  function developmentCompletion(s){return JOBS.filter(j=>['content','framework','commerce'].includes(j.group)).reduce((sum,j)=>sum+progress(s,j.id),0)/9;}
  function experienceBreakdown(s,profit,objectiveOK){
    const completion=developmentCompletion(s),factor=Math.min(1,completion/.7);
    const parts={base:10,development:Math.round(completion*80),quality:Math.round(overallScore(s)*.4*factor),profit:profit>0?Math.round(15*factor):0,objective:objectiveOK?Math.round(40*factor):0,mode:s.hard?25:0};
    return {...parts,completion:round(completion*100),total:Object.values(parts).reduce((a,b)=>a+b,0)};
  }
  function decisionFinance(s){const weekly=cost(s).total,breakeven=Math.max(0,s.spent-s.income);return {invested:s.spent,received:s.income,weekly,breakeven,nextBreakeven:Math.max(0,s.spent+weekly-s.income),runway:weekly?Math.floor(s.money/weekly):Infinity};}

  const REPUTATION_NODES=[
    [20,"advanceRatio",0.7],
    [40,"moraleCap",105],
    [65,"speedBonus",0.05],
    [95,"talent","SR"],
    [130,"managedWork",22],
    [170,"studioShare",0.55],
    [215,"managedWork",24],
    [265,"moraleCap",110],
    [320,"speedBonus",0.1],
    [380,"studioShare",0.6],
    [445,"talent","SSR"],
    [515,"advanceRatio",0.8],
    [590,"managedWork",26],
    [670,"moraleCap",115],
    [755,"speedBonus",0.15],
    [845,"managedWork",28],
    [940,"studioShare",0.65],
    [1040,"managedWork",30],
    [1145,"talent","UR"],
    [1255,"moraleCap",120],
    [1370,"speedBonus",0.2],
    [1490,"advanceRatio",0.9],
    [1615,"managedWork",32],
    [1745,"studioShare",0.7],
    [1880,"managedWork",34],
    [2020,"moraleCap",125],
    [2165,"speedBonus",0.25],
    [2315,"advanceRatio",1],
    [2470,"studioShare",0.75],
    [2630,"managedWork",36],
    [2795,"moraleCap",130],
    [2965,"speedBonus",0.3]
  ].map(([threshold,type,value],i)=>({id:'reputation-'+(i+1),threshold,type,value,label:type==='advanceRatio'?'发行开发款比例 → '+Math.round(value*100)+'%':type==='moraleCap'?'士气上限 → '+value:type==='speedBonus'?'团队工作速度 → +'+Math.round(value*100)+'%':type==='talent'?'结识 '+value+' 伙伴':type==='managedWork'?'发行托管每项 → '+value+' 点／周':'工作室分成 → '+Math.round(value*100)+'%'}));
  const RECRUIT_REPUTATION={N:0,R:0,...Object.fromEntries(REPUTATION_NODES.filter(n=>n.type==='talent').map(n=>[n.value,n.threshold]))};
  const repRound=n=>Math.round(n*1000)/1000;
  function reputationProfile(state=0){const reputation=typeof state==='number'?state:state.reputation||0,p={reputation,moraleCap:100,speedBonus:0,advanceRatio:.6,studioShare:.5,managedWork:20,talent:'R'};for(const n of REPUTATION_NODES)if(reputation>=n.threshold)p[n.type]=n.value;return p;}
  function reputationStatus(state){const profile=reputationProfile(state),unlocked=REPUTATION_NODES.filter(n=>profile.reputation>=n.threshold),next=REPUTATION_NODES.find(n=>n.threshold>profile.reputation)||null;return {profile,unlocked:copy(unlocked),next:next?{...next,remaining:repRound(next.threshold-profile.reputation)}:null,total:REPUTATION_NODES.length};}
  function recruitReputation(person){return RECRUIT_REPUTATION[personRank(person)?.id]??Infinity;}
  function reputationPartners(state){const p=reputationProfile(state);return RECRUITS.filter(r=>recruitReputation(r)<=p.reputation).map(r=>r.id);}
  function reputationGain(s,sales){return repRound(Math.max(0,sales)/100*(s.publisher?.5:1));}
  function publisherWork(s){return s.publisher?s.publisher.quote.weeklyWork:reputationProfile(s).managedWork;}
  function publisherShare(s){return s.publisher?s.publisher.quote.studioShare:reputationProfile(s).studioShare;}
  function terminationQuote(s,balance=s.money){const due=s.publisher?.advance||0,low=Math.round(s.spent*.1),high=Math.round(s.spent*.5);return {advanceDue:due,recoveryLow:low,recoveryHigh:high,repayLow:Math.min(balance+low,due),repayHigh:Math.min(balance+high,due),balanceLow:Math.max(0,balance+low-due),balanceHigh:Math.max(0,balance+high-due)};}

  const GRADES=['D-','D','D+','C-','C','C+','B-','B','B+','A-','A','A+','S-','S','S+'];
  const AD_RATES=[.15,.25,.4,.55,.7,.9,1.05,1.2,1.4,1.65,1.95,2.3,2.7,3.2,3.8];
  // Base micro-project budgets; scale every positive tier together (20-fold range).
  const AD_BUDGETS=[0,100,300,600,1000,2000];
  const MARKET_MIN=.1,MARKET_MAX=10;
  const OBJECTIVES=[{id:'profit',name:'商业回报',desc:'发售后项目结余达到 ¥1,200。',bonus:40},{id:'acclaim',name:'口碑佳作',desc:'综合真实评级达到 A-。',bonus:40}];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),round=v=>Math.round(v*100)/100,copy=o=>JSON.parse(JSON.stringify(o));
  const task=id=>JOBS.find(j=>j.id===id),group=id=>GROUPS.find(g=>g.id===id);
  function random(s){s.rng=(s.rng*1664525+1013904223)>>>0;return s.rng/4294967296;}
  const projectScale=s=>SCALES.find(g=>g.id===s.scale);
  function scalePlan(id){const work=Object.values(baseRequirements(id)).reduce((n,v)=>n+v,0),personWeeks=work/STANDARD_WEEKLY_WORK;return {work,personWeeks,minFunds:Math.ceil(work*STANDARD_PERSON_WEEK_COST/STANDARD_WEEKLY_WORK)};}
  function baseRequirements(id,profile='balanced'){const g=SCALES.find(g=>g.id===id),p=WORK_PROFILES.find(p=>p.id===profile);if(!g||!p)throw Error('请选择有效的项目规模与工作配比');return Object.fromEntries(JOBS.map((j,i)=>[j.id,(i<9?p.core[i]:j.base)*g.multiplier]));}

  function skillLabel(n){return n===0?'不会':n>=130?'擅长':n>=80?'胜任':'生疏';}
  function taskSkill(m,id){const j=task(id);return j?m.skills[j.skill]||0:0;}
  function syncPeople(s){s.people=Object.fromEntries(JOBS.map(j=>[j.id,s.team.filter(m=>m.job===j.id).length]));s.reserve=s.team.filter(m=>m.job==='idle').length;}
  function makeMember(def,job){return {...copy(def),job,lastJob:job,kind:def.kind||'partner'};}
  function preferredJob(m){return ({design:'gameplay',code:'development',art:'subtheme',test:'qa',ops:'ads'})[SKILLS.reduce((a,j)=>m.skills[j.id]>m.skills[a]?j.id:a,'design')];}
  function createTeam(profile,partners){const hero=makeMember({...copy(HERO),name:profile.name,skills:copy(profile.skills)},'gameplay');return [hero,makeMember(COMPANION,'development'),...partners.map(id=>{const r=RECRUITS.find(r=>r.id===id);return makeMember(r,preferredJob(r));})];}
  function addLog(s,text,kind='info'){s.logs.unshift({week:s.week,text,kind});s.logs=s.logs.slice(0,90);}
  function blocked(s){return s.over||s.paused||!!s.pendingEvent||!!s.eventResult?.unread;}
  function assignMember(s,id,job){const m=s.team.find(m=>m.id===id);if(blocked(s)||!m||publisherManaged(s,job)||job!=='idle'&&taskSkill(m,job)<=0)return false;if(m.job!==job)s.assignmentUndo=null;m.job=job;syncPeople(s);return true;}
  function setAssignmentLock(s,id,locked){if(!s||blocked(s)||!s.team.some(m=>m.id===id)||typeof locked!=='boolean')return false;s.assignmentLocks=locked?[...new Set([...s.assignmentLocks,id])]:s.assignmentLocks.filter(x=>x!==id);s.assignmentUndo=null;return true;}
  function assignmentFingerprint(s){return JSON.stringify([s.week,s.pace,s.adBudget,s.assignmentLocks,s.team.map(m=>[m.id,m.job])]);}
  function assignmentUndoStatus(s){const u=s?.assignmentUndo;return !!u&&!blocked(s)&&u.fingerprint===assignmentFingerprint(s)&&s.team.every(m=>Object.hasOwn(u.before,m.id)&&(u.before[m.id]==='idle'||taskSkill(m,u.before[m.id])>0&&!publisherManaged(s,u.before[m.id])));}
  function undoAutoAssign(s){if(!assignmentUndoStatus(s))return false;const before=s.assignmentUndo.before;for(const m of s.team)m.job=before[m.id];s.assignmentUndo=null;syncPeople(s);return true;}
  function availableRecruits(s){return RECRUITS.filter(r=>recruitReputation(r)<=s.reputation&&s.knownPartners.includes(r.id)&&!s.team.some(m=>m.id===r.id)&&!s.departed.includes(r.id));}
  function teamSize(s){return s.team.length;}
  function hire(s,id){const r=availableRecruits(s).find(r=>r.id===id);if(!r||blocked(s)||s.managed||s.money<180)return false;const m=makeMember(r,publisherManaged(s,preferredJob(r))?'idle':preferredJob(r));m.lastJob='idle';s.team.push(m);s.assignmentUndo=null;syncPeople(s);s.money-=180;s.spent+=180;s.managed=true;addLog(s,r.name+'加入团队，基础周薪 ¥'+r.salary+'；准备支出 ¥180。','good');return true;}
  function downsize(s,id){const m=s.team.find(m=>m.id===id);if(!m||m.kind!=='partner'||blocked(s)||s.managed||s.money<100)return false;s.team=s.team.filter(m=>m.id!==id);s.assignmentLocks=s.assignmentLocks.filter(x=>x!==id);s.assignmentUndo=null;s.departed.push(id);syncPeople(s);s.money-=100;s.spent+=100;s.managed=true;addLog(s,'与'+m.name+'暂别，支付 ¥100；本项目不再重复邀请。');return true;}
  function mods(s){const m={all:1,design:1,code:1,art:1,test:1,ops:1,play:1,visual:1,debt:1,rework:1,overhead:1,wages:1,ramp:1,crowd:.45,morale:0,cleanup:0,fee:0,sales:1};s.effects.forEach(e=>{if(e.weeks>0){m.all*=e.all||1;if(e.job)m[e.job]*=e.mult||1;}});return m;}
  function adBudgetOptions(s){const scale=typeof s==='string'?SCALES.find(g=>g.id===s):projectScale(s);return scale?AD_BUDGETS.map(n=>n*scale.multiplier):[];}
  function publisherAdBudget(s){const v=overallView(s),index=v.exact?GRADES.indexOf(v.text):gradeIndex((v.low+v.high)/2),base=index>=12?2000:index>=9?1000:index>=6?300:100;return base*projectScale(s).multiplier;}
  function currentAdBudget(s){return s.publisher?publisherAdBudget(s):s.adBudget;}
  function campaignCost(s){return s.publisher||s.people.acquisition>0?currentAdBudget(s):0;}
  function buyingStatus(s){
    const managed=!!s.publisher,assigned=s.team.filter(m=>m.job==='acquisition'),spend=campaignCost(s),budget=currentAdBudget(s);
    return {managed,assigned:assigned.length,members:managed?[{id:'publisher',name:'发行商团队'}]:assigned.map(m=>({id:m.id,name:m.name})),budget,spend,studioSpend:managed?0:spend,publisherSpend:managed?spend:0,unfunded:(managed||assigned.length>0)&&budget===0,reason:budget===0?'买量预算为 ¥0，本周买量无进度':!managed&&assigned.length===0?'未安排买量人手，本周不投放、无买量进度':''};
  }
  function cost(s){const m=mods(s),wages=Math.ceil(s.team.reduce((n,p)=>n+p.salary,0)*m.wages),overhead=Math.ceil((90+s.debt*2+Math.max(0,s.team.length-4)**2*4)*m.overhead),campaign=campaignCost(s),ads=s.publisher?0:campaign,publisherAds=s.publisher?campaign:0;return {wages,overhead,tools:m.fee,ads,publisherAds,total:wages+overhead+m.fee+ads};}
  function progress(s,id){return s.req[id]>0?clamp(s.work[id]/s.req[id],0,1):0;}
  function recruitCostPreview(s,id,meta=null){
    const recruit=RECRUITS.find(m=>m.id===id);if(!recruit||!s&&!meta)return null;
    const before=s?copy(s):{team:createTeam(meta.hero,meta.partners),effects:[],debt:0,publisher:null,people:{acquisition:0},adBudget:0};
    if(before.team.some(m=>m.id===id))return null;
    const after=copy(before);after.team.push(makeMember(recruit,'idle'));
    const a=cost(before),b=cost(after),wallet=s?s.money:meta.wallet,balance=round(wallet-180);
    return {balance,affordable:balance>=0,wages:b.wages-a.wages,overhead:b.overhead-a.overhead,beforeWeekly:a.total,weekly:b.total,runway:Math.max(0,Math.floor(balance/Math.max(1,b.total))),basis:s?'按当前项目、节奏与投放预算估算':'按无买量、无临时效果的基础周费用估算；活动项目费用以开发现场为准'};
  }
  function groupProgress(s,id){const list=JOBS.filter(j=>j.group===id);return list.reduce((a,j)=>a+progress(s,j.id),0)/list.length;}
  function coreProgress(s){return (groupProgress(s,'content')+groupProgress(s,'framework'))/2;}
  function coreReady(s){return JOBS.filter(j=>['content','framework'].includes(j.group)).every(j=>progress(s,j.id)>=1);}
  function complete(s){return progress(s,'materials')>=1&&progress(s,'review')>=1;}
  function goals(s){return ['materials','review'].map(id=>({name:task(id).name,ok:progress(s,id)>=1,value:Math.floor(progress(s,id)*100)+'%'}));}
  function canRelease(s){return !blocked(s)&&complete(s);}
  function jobContributions(s,id,members,m=mods(s)){
    const j=task(id);if(!j||publisherManaged(s,id)||id==='acquisition'&&s.adBudget===0)return [];
    const ordered=members.map(p=>({id:p.id,n:taskSkill(p,id)/100*(id!==p.lastJob?1-.2*m.ramp:1)})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id));
    const debt=j.skill==='code'?Math.max(.6,1-s.debt*.01):1;
    return ordered.map((p,i)=>({id:p.id,output:round(p.n*(i?m.crowd:1)*STANDARD_WEEKLY_WORK*(1+reputationProfile(s).speedBonus)*m.all*m[j.skill]*(s.pace==='crunch'?1.35:s.pace==='rest'?.7:1)*(.65+s.morale/285)*debt)}));
  }
  function memberOutput(s,id){const member=s.team.find(p=>p.id===id);if(!member||member.job==='idle')return 0;return jobContributions(s,member.job,s.team.filter(p=>p.job===member.job)).find(p=>p.id===id)?.output||0;}
  function throughput(s,id){if(publisherManaged(s,id))return publisherWork(s);return round(jobContributions(s,id,s.team.filter(p=>p.job===id)).reduce((sum,p)=>sum+p.output,0));}
  function softCap(s,id){return task(id)?.group==='release'?HARD_CAP:s.softCaps[id];}
  function workDependency(s,id){const content=groupProgress(s,'content'),development=progress(s,'development'),systems=progress(s,'systems'),materials=progress(s,'materials');const source=(name,value)=>({name,value});if(id==='development')return {sources:[source('游戏内容',content)],cap:Math.min(1,.2+content*.8)};if(id==='systems')return {sources:[source('开发进度',development)],cap:Math.min(1,.2+development)};if(id==='qa')return {sources:[source('开发进度',development),source('系统协作',systems)],cap:Math.min(development,.2+systems)};if(id==='review')return {sources:[source('资料准备',materials)],cap:materials>=1?1:0};return null;}
  function workLimit(s,id){return s.req[id]*Math.min(HARD_CAP,softCap(s,id),workDependency(s,id)?.cap??1);}
  function workPhase(s,id){const p=progress(s,id);if(!s.hard||task(id)?.group==='release')return {id:'steady',name:'正常推进',min:1,max:1,spill:0};if(p<.3)return {id:'early',name:'正常推进',min:1,max:1,spill:0};if(p<.5)return {id:'slow',name:'推进放缓 · 65%',min:.65,max:.65,spill:0};if(p<=.7+1e-9)return {id:'coupled',name:'推进困难 · 35% / 牵连其他项',min:.35,max:.35,spill:.2};return {id:'uncertain',name:'随机增减 · 各 50% 概率',min:-1,max:1,spill:0};}
  function unlockCaps(s,caps){for(const [id,amount] of Object.entries(caps)){const targets=task(id)?[task(id)]:JOBS.filter(j=>j.group===id);for(const j of targets)if(j.group!=='release')s.softCaps[j.id]=round(Math.min(HARD_CAP,s.softCaps[j.id]+amount));}}
  function setAdBudget(s,n){if(blocked(s)||s.publisher||!adBudgetOptions(s).includes(n))return false;if(s.adBudget!==n)s.assignmentUndo=null;s.adBudget=n;return true;}
  function gradeIndex(value){return clamp(Math.floor(clamp(value,0,100)/100*15),0,14);}
  function grade(value){return GRADES[gradeIndex(value)];}
  function trueScore(s,id){if(id==='release')return groupProgress(s,id)*100;const p=groupProgress(s,id);let n=10+p*65+s.ratingRolls[id];if(id==='content')n+=(mods(s).play-1)*8+(mods(s).visual-1)*8;if(id==='framework')n-=s.debt*.18;return round(clamp(n,0,100));}
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
  function marketFloor(value){const index=typeof value==='string'?GRADES.indexOf(value):gradeIndex(value);return index>=12?2:index>=9?1:index>=6?.5:MARKET_MIN;}
  function marketMultiplier(roll,value=0){return Math.max(marketFloor(value),round(MARKET_MIN*Math.pow(MARKET_MAX/MARKET_MIN,clamp(roll,0,1))));}
  function revenueRules(s){const v=overallView(s);return {scaleMultiplier:projectScale(s).revenueMultiplier,marketMin:marketFloor(v.exact?v.text:v.low),marketMax:MARKET_MAX};}
  function organic(s,scoreValue,commerceValue){return Math.max(0,Math.round((1000+scoreValue*scoreValue*.9)*(.65+commerceValue/100*.7)*mods(s).sales*projectScale(s).revenueMultiplier));}
  function forecast(s){
    const v=overallView(s),c=ratingView(s,'commerce'),ad=adProjection(s),rules=revenueRules(s);
    const net=value=>s.publisher?Math.floor(value*publisherShare(s)):value;const low=net(Math.round(organic(s,v.low,c.low)*rules.marketMin))+ad.low,high=net(Math.round(organic(s,v.high,c.high)*rules.marketMax))+ad.high;
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
    const profile=config.workProfile|| (meta.stage===1?'balanced':WORK_PROFILES[((seed^(seed>>>16))>>>0)%WORK_PROFILES.length].id);
    const req=baseRequirements(g.id,profile);
    const s={version:VERSION,id:'run-'+meta.stage+'-'+seed+'-'+Date.now(),stage:meta.stage,seed,rng:seed,scale:g.id,workProfile:profile,name,hard:config.hard===true,week:1,money:meta.wallet,reputation:meta.reputation,spent:0,income:0,sharedCashDelta:0,paused:false,pace:'normal',work:Object.fromEntries(JOBS.map(j=>[j.id,0])),req,debt:0,morale:90,effects:[],logs:[],history:[],milestones:[],publisher:null,managed:false,pendingEvent:null,pendingChoices:null,eventResult:null,lastEvent:null,over:false,result:null,objective:config.objective==='acclaim'?'acclaim':'profit',departed:[],adBudget:0,adSpend:0,ratingRolls:{},revealRolls:{},softCaps:Object.fromEntries(JOBS.filter(j=>j.group!=='release').map(j=>[j.id,INITIAL_SOFT_CAP])),pendingCapGroup:null,lastScene:null};
    s.assignmentLocks=[];s.assignmentUndo=null;s.initialMoney=s.money;s.knownPartners=meta.knownPartners.slice();s.team=createTeam(meta.hero,meta.partners);syncPeople(s);if(s.money<cost(s).total)throw Error('生涯资金不足以支付首周团队成本；可在局外重新开始生涯');GROUPS.filter(g=>g.id!=='release').forEach(g=>{s.ratingRolls[g.id]=round(random(s)*56-28);s.revealRolls[g.id]=round(random(s)*2-1);});meta.activeRunId=s.id;meta.stage++;
    addLog(s,'第 '+s.stage+' 关「'+s.name+'」立项：继承资金 ¥'+s.money+' 与主角能力；'+g.name+'，需要 '+plan.personWeeks+' 人周工作量'+'；上架两项完成即可发售。','good');return s;
  }
  function publisherManaged(s,id){return !!s.publisher&&PUBLISHER_JOBS.includes(id);}
  function publisherQuote(s){
    if(s.publisher)return {...copy(s.publisher.quote),signed:true};
    const view=overallView(s),commerce=ratingView(s,'commerce'),expectedScore=round((view.low+view.high)/2),commerceScore=(commerce.low+commerce.high)/2;
    const baseRevenue=organic(s,expectedScore,commerceScore),advance=Math.max(100,Math.round(baseRevenue*reputationProfile(s).advanceRatio/100)*100);
    return {signed:false,advance,expectedScore,baseRevenue,scaleMultiplier:projectScale(s).revenueMultiplier,level:revealLevel(s),basis:revealLevel(s)?'当前已揭示评级的中位预期':'未宣传，按中性预期报价',weeklyWork:reputationProfile(s).managedWork,advanceRatio:reputationProfile(s).advanceRatio,studioShare:reputationProfile(s).studioShare};
  }
  function signPublisher(s){
    if(blocked(s)||s.publisher)return false;
    const quote=publisherQuote(s);s.publisher={quote:copy(quote),advance:0,paidStages:[],signWeek:s.week,adSpend:0};
    payPublisherMilestones(s);s.adBudget=publisherAdBudget(s);
    const managedMembers=s.team.filter(m=>PUBLISHER_JOBS.includes(m.job)).map(m=>m.id);s.assignmentLocks=s.assignmentLocks.filter(id=>!managedMembers.includes(id));s.assignmentUndo=null;
    for(const m of s.team)if(PUBLISHER_JOBS.includes(m.job))m.job='idle';syncPeople(s);
    addLog(s,'签约发行商：合约总开发款 ¥'+quote.advance+'，已到账 ¥'+s.publisher.advance+'；宣发与上架由发行团队接管，签约后买量由发行商垫付并承担亏损。工作室自然销售及买量正净利润分成 '+Math.round(quote.studioShare*100)+'%，终止项目时退还预付款（余额不足扣至 0）。','good');return true;
  }
  function adSettlement(s,rate,released=true){
    const publisherSpend=s.publisher?.adSpend||0,studioSpend=s.adSpend-publisherSpend;
    const studioGross=released?Math.round(studioSpend*rate):0,publisherGross=released?Math.round(publisherSpend*rate):0;
    const publisherRecovered=Math.min(publisherSpend,publisherGross),positiveProfit=Math.max(0,publisherGross-publisherSpend);
    const studioShare=Math.floor(positiveProfit*publisherShare(s)),publisherProfit=positiveProfit-studioShare;
    const studioRevenue=studioGross+studioShare,publisherRevenue=publisherRecovered+publisherProfit;
    return {studioSpend,publisherSpend,gross:studioGross+publisherGross,studioGross,publisherGross,studioShare,studioRevenue,studioNet:studioRevenue-studioSpend,publisherRecovered,publisherProfit,publisherRevenue,publisherLoss:Math.max(0,publisherSpend-publisherGross),campaignNet:studioGross+publisherGross-s.adSpend};
  }
  function workWeek(s,previewOnly=false,ignoreModeEffects=false){const production=Object.fromEntries(JOBS.map(j=>[j.id,throughput(s,j.id)])),before={...s.work},gains={},ranges={},impacts=[],m=mods(s),campaign=campaignCost(s);s.lastBottlenecks={};
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
    s.debt=round(Math.max(0,s.debt+implementation*.025-production.systems*.22-m.cleanup+(s.pace==='crunch'?2:0)));
    // Freeze this week's budget before publicity changes next week's public expectation.
    if(campaign>0){s.adSpend+=campaign;if(s.publisher){s.publisher.adSpend+=campaign;s.adBudget=campaign;}}
    s.morale=clamp(s.morale+(s.pace==='crunch'?-10:s.pace==='rest'?12:1)+m.morale,25,reputationProfile(s).moraleCap);s.team.forEach(m=>m.lastJob=m.job);return {production,gains,ranges,impacts};
  }
  // Shared scene text is intentional: the story alone must not disclose its outcome category.
  const EVENTS=[
    {"id":"inspiration","tag":"玩法突破","title":"天才程序员画出了新的核心循环","text":"玩法有了更高的完成空间，但好点子仍要排进工作表。","choices":[{"label":"拓展玩法表达","hint":"玩法软上限 +15%，当前完成度不变","caps":{"gameplay":0.15}},{"label":"记进下一作","hint":"士气 +4；本作进度保持","morale":4}],"scene":"inspiration"},
    {"id":"palette","tag":"内容表达","title":"子主题终于有了自己的气质","text":"画面、氛围与题材接上了。下一步是继续打磨，还是让团队缓口气？","choices":[{"label":"拓展视觉细节","hint":"子主题软上限 +15%，仍需安排工作","caps":{"subtheme":0.15}},{"label":"先照顾团队状态","hint":"士气 +5","morale":5}],"scene":"palette"},
    {"id":"discount","tag":"开发成本","title":"工具订阅返还了一笔差价","text":"省下的资金进入全局生涯余额，可以继续支持当前作品或下一作。","choices":[{"label":"收下这份幸运","hint":"生涯资金 +¥120，记入本作其他收入","cash":120}],"scene":"discount"},
    {"id":"feedback","tag":"玩家反馈","title":"试玩长评指出了两个突破口","text":"反馈可以帮助准备更好的宣传与测试方案；评级认知仍需通过宣传工作逐步揭示。","choices":[{"label":"整理玩家调研","hint":"宣传软上限 +15%；不会直接揭示评级","caps":{"publicity":0.15}},{"label":"整理复现步骤","hint":"测试软上限 +15%，下周测试效率 +15%","caps":{"qa":0.15},"effect":{"job":"test","mult":1.15,"weeks":1,"name":"清晰测试步骤"}}],"scene":"feedback"},
    {"id":"coffee","tag":"团队节奏","title":"今天的咖啡刚刚好","text":"本周工作已经结算。决定下一周的效率与状态，不改写刚完成的进度。","choices":[{"label":"保持节奏","hint":"士气 +5","morale":5},{"label":"集中突破","hint":"下周全体效率 +15%，士气 −6","morale":-6,"effect":{"all":1.15,"weeks":1,"name":"集中突破"}}],"scene":"coffee"},
    {"id":"break","tag":"工作室日常","title":"不如今晚早点回家","text":"伙伴会陪你跨作品继续开发，当前项目的疲劳也值得照顾。","choices":[{"label":"一起吃饭","hint":"生涯资金 −¥100，士气 +14","cash":-100,"morale":14},{"label":"散步也挺好","hint":"士气 +5","morale":5}],"scene":"break"},
    {"id":"backup","tag":"程序维护","title":"构建机发出了奇怪的声音","text":"代码备份还在，已有完成度保留；设备选择会影响下周程序岗位的效率。","choices":[{"label":"更换设备","hint":"支出 ¥180，下周程序效率 +15%","cash":-180,"effect":{"job":"code","mult":1.15,"weeks":1,"name":"新构建机"}},{"label":"启用备用机","hint":"下周程序效率 −15%，当前完成度不变","effect":{"job":"code","mult":0.85,"weeks":1,"name":"备用构建机"}}],"scene":"backup"},
    {"id":"scope","tag":"内容打磨","title":"这个点子，要在本作继续探索吗？","text":"讨论为内容打开了更多打磨空间，实现仍需人手与预算。","choices":[{"label":"先记进下一作","hint":"士气 +3","morale":3},{"label":"探索新的表达","hint":"支出 ¥100，内容三项软上限各 +15%，下周策划效率 +15%","cash":-100,"caps":{"content":0.15},"effect":{"job":"design","mult":1.15,"weeks":1,"name":"新表达方案"}}],"scene":"scope"},
    {"id":"showcase","tag":"宣发机会","title":"独立游戏展开放了试玩席位","text":"参展能拓宽宣传准备的空间；实际评级认知仍由宣传完成度决定，市场波动无法提前确定。","min":0.3,"choices":[{"label":"带试玩版参展","hint":"支出 ¥200，宣传软上限 +30%","cash":-200,"caps":{"publicity":0.3}},{"label":"专注当前开发","hint":"下周全体效率 +10%","effect":{"all":1.1,"weeks":1,"name":"专注开发"}}],"scene":"showcase"},
    {"id":"bug","tag":"测试发现","title":"复现清单补全了一页","text":"测试笔记多了几条清晰的验收步骤，团队讨论下一周怎么安排。","choices":[{"label":"整理成测试脚本","hint":"支出 ¥120，下周测试效率 +25%","cash":-120,"effect":{"job":"test","mult":1.25,"weeks":1,"name":"测试脚本"}},{"label":"照现有节奏继续","hint":"士气 +3","morale":3}],"condition":s=>s.people.qa>0||progress(s,'qa')>0,"scene":"bug"},
    {"id":"forms","tag":"上架准备","title":"渠道明确了资质与素材清单","text":"授权材料、商店资料和审核提交有了清晰安排。资料到 100% 后才能推进审核，两项都要完成。","choices":[{"label":"更新发行工作清单","hint":"下周发行能力相关岗位效率 +20%；上架无软上限","effect":{"job":"ops","mult":1.2,"weeks":1,"name":"清晰发行清单"}}],"scene":"forms"},
    {"id":"compat","tag":"系统协作","title":"工具接口的兼容方案需要确认","text":"技术债会拖慢程序岗位并增加维护成本，系统协作也能持续偿债。","choices":[{"label":"现在处理","hint":"支出 ¥100，技术债 −3","cash":-100,"debt":-3},{"label":"锁定现有版本","hint":"技术债 +2，当前完成度不变","debt":2}],"scene":"compat"},
    {"id":"tired","tag":"团队状态","title":"大家需要喘口气","text":"士气影响全部岗位的产出。赶进度之前，先看一眼团队状态。","choices":[{"label":"充分休息","hint":"士气 +15，下周全体效率 −10%","morale":15,"effect":{"all":0.9,"weeks":1,"name":"休整"}},{"label":"再坚持一下","hint":"士气 −5，下周全体效率 +10%","morale":-5,"effect":{"all":1.1,"weeks":1,"name":"再坚持一周"}}],"condition":s=>s.morale<65,"scene":"tired"},
    {"id":"debt","tag":"架构提醒","title":"旧代码开始牵一发动全身","text":"偿还技术债能改善程序效率、维护费与完善度，不会凭空补满开发工作。","choices":[{"label":"整理架构","hint":"支出 ¥180，技术债 −7","cash":-180,"debt":-7},{"label":"先整理标记","hint":"技术债 −2","debt":-2}],"condition":s=>s.debt>8,"scene":"debt"},
    {"id":"monetization","tag":"广告变现","title":"激励广告应该放在哪里？","text":"广告变现属于商业化，和花钱吸引新用户的买量是两项不同的工作。","choices":[{"label":"细化广告体验","hint":"广告变现软上限 +15%","caps":{"ads":0.15}},{"label":"打磨展示方案","hint":"支出 ¥100，下周发行能力相关岗位效率 +20%","cash":-100,"effect":{"job":"ops","mult":1.2,"weeks":1,"name":"广告展示方案"}}],"condition":s=>s.people.ads>0||progress(s,'ads')>0,"scene":"monetization"},
    {"id":"pricing","tag":"用户付费","title":"试玩者问：这份内容值得付费吗？","text":"团队看到了优化付费体验的空间，具体成果仍需推进用户付费工作。","choices":[{"label":"完善付费方案","hint":"用户付费软上限 +15%","caps":{"payment":0.15}},{"label":"做一次付费体验研究","hint":"支出 ¥120，下周策划效率 +20%","cash":-120,"effect":{"job":"design","mult":1.2,"weeks":1,"name":"付费体验研究"}}],"condition":s=>s.people.payment>0||progress(s,'payment')>0,"scene":"pricing"},
    {"id":"ip_plan","tag":"IP衍生","title":"角色表情包收到了合作询问","text":"衍生合作可以成为商业化的一部分，也可以先换取一笔实际预算。","min":0.15,"choices":[{"label":"准备长期衍生方案","hint":"IP衍生软上限 +15%","caps":{"ip":0.15}},{"label":"承接一次小型授权","hint":"生涯资金 +¥180，记入本作其他收入","cash":180}],"scene":"ip_plan"},
    {"id":"ad_plan","tag":"买量准备","title":"投放计划里还缺一笔预算","text":"买量已有人负责，但预算为 ¥0：本周没有投放支出，也没有买量产出。解锁上限后，下周仍需设置预算。","choices":[{"label":"完善下一轮投放方案","hint":"买量软上限 +15%；不补发进度、不自动扣费","caps":{"acquisition":0.15}},{"label":"先稳住团队状态","hint":"士气 +4；买量预算保持 ¥0","morale":4}],"condition":s=>!s.publisher&&s.people.acquisition>0&&s.adBudget===0,"scene":"ad_plan"},
    {"id":"store_page","tag":"上架资料","title":"商店页素材与授权目录对齐了","text":"上架没有软上限，资料和审核都必须真正做到 100%；此次只为后续工作提供条件。","choices":[{"label":"组织提交资料演练","hint":"支出 ¥100，下周发行能力相关岗位效率 +25%","cash":-100,"effect":{"job":"ops","mult":1.25,"weeks":1,"name":"资料演练"}},{"label":"记录审核注意事项","hint":"士气 +4，当前完成度不变","morale":4}],"condition":s=>s.publisher||s.people.materials>0||s.people.review>0,"scene":"store_page"},
    {"id":"scale_review","tag":"规模复盘","title":"大作品需要分阶段啃下来","text":"规模同时放大工作需求与自然收入倍率，不会让同能力成员每周产出更多工作点。","choices":[{"label":"梳理协作节点","hint":"系统协作软上限 +15%，下周全体效率 +10%","caps":{"systems":0.15},"effect":{"all":1.1,"weeks":1,"name":"分阶段协作"}},{"label":"守住团队节奏","hint":"士气 +6","morale":6}],"condition":s=>s.scale!=='micro',"scene":"scale_review"},
    {"id":"market_rival","tag":"市场风向","title":"同类作品突然占据了讨论区","text":"市场基础波动为 0.10～10.00 倍；综合真实评级 B 档保底 0.50、A 档 1.00、S 档 2.00。保底仍不能保证热销，也不能从今天的讨论预测最终系数。","min":0.3,"choices":[{"label":"重看作品定位","hint":"支出 ¥120，题材软上限 +15%，下周策划效率 +10%","cash":-120,"caps":{"theme":0.15},"effect":{"job":"design","mult":1.1,"weeks":1,"name":"定位复盘"}},{"label":"继续打磨自己的作品","hint":"士气 +6；市场结果仍在发售时确定","morale":6}],"scene":"market_rival"},
    {"id":"market_watch","tag":"宣传认知","title":"榜单一夜换了风向","text":"宣传可以揭示作品评级，却不能消除市场随机。团队决定把反馈用在哪里。","choices":[{"label":"整理传播反馈","hint":"宣传软上限 +15%","caps":{"publicity":0.15}},{"label":"补充测试清单","hint":"测试软上限 +15%，下周测试效率 +10%","caps":{"qa":0.15},"effect":{"job":"test","mult":1.1,"weeks":1,"name":"补充测试清单"}}],"condition":s=>s.publisher||s.people.publicity>0||progress(s,'publicity')>0,"scene":"market_watch"},
    {"id":"cash_review","tag":"资金复盘","title":"先算清楚，还能开发几周","text":"所有项目共用生涯余额；结束全部未完成项目后可领取创业补助，补助不算作品盈利。买量回款扣除投放投入后，才是买量净回款。","choices":[{"label":"精简短期维护安排","hint":"未来 2 周维护费 −25%，工资与买量预算不变","effect":{"job":"overhead","mult":0.75,"weeks":2,"name":"维护节流"}},{"label":"研究商业化短板","hint":"商业化三项软上限各 +15%","caps":{"commerce":0.15}}],"condition":s=>s.money<5440,"scene":"cash_review"},
    {"id":"team_exchange","tag":"全局团队","title":"伙伴想交流一下各自的工作方法","text":"伙伴与主角能力会带入后续项目；每个人本周仍只能负责一个岗位。","choices":[{"label":"组织岗位分享","hint":"下周全体效率 +12%","effect":{"all":1.12,"weeks":1,"name":"岗位分享"}},{"label":"安排团队交流","hint":"士气 +7","morale":7}],"condition":s=>s.team.length>2||availableRecruits(s).length>0,"scene":"team_exchange"},
    {"id":"daily_cat","kind":"ambient","tag":"工作室日常","title":"窗外有一只猫","text":"一只猫坐在窗台上，似乎在监督这个工作室。","choices":[{"label":"隔着玻璃挥挥手"},{"label":"给它起个名字"},{"label":"继续看屏幕"}],"scene":"daily_cat"},
    {"id":"daily_lunch","kind":"ambient","tag":"工作室日常","title":"午饭投票又平局了","text":"菜单在群里传了三轮，大家依旧没有达成共识。","choices":[{"label":"投面条一票"},{"label":"投米饭一票"},{"label":"让硬币决定"}],"scene":"daily_lunch"},
    {"id":"daily_branch","kind":"ambient","tag":"工作室日常","title":"这个分支该叫什么","text":"天才程序员说，这次取一个平平无奇的名字就好。","choices":[{"label":"叫做 next"},{"label":"叫做 next_final"},{"label":"叫做 next_final_really"}],"scene":"daily_branch"},
    {"id":"daily_plant","kind":"ambient","tag":"工作室日常","title":"桌上的绿植朝左歪了","text":"大家围着花盆研究了片刻，谁也没说出个所以然。","choices":[{"label":"把花盆转半圈"},{"label":"给它画个小箭头"},{"label":"赞同它的选择"}],"scene":"daily_plant"},
    {"id":"daily_cable","kind":"ambient","tag":"工作室日常","title":"那根线到底属于谁","text":"抽屉里多出一根没有标签的线，接口看起来很有年代感。","choices":[{"label":"放回原处"},{"label":"贴上「未知」标签"},{"label":"摆进线材收藏盒"}],"scene":"daily_cable"},
    {"id":"daily_cursor","kind":"ambient","tag":"工作室日常","title":"光标停在一个句号后面","text":"办公室很安静，只有键盘灯在缓缓变色。","choices":[{"label":"看它变成蓝色"},{"label":"看它变成紫色"},{"label":"把视线移开"}],"scene":"daily_cursor"},
    {"id":"daily_rain","kind":"ambient","tag":"工作室日常","title":"雨滴在窗上排队","text":"有人问：如果把雨声放进片尾，会不会很合适？","choices":[{"label":"说像白噪音"},{"label":"说像篝火声"},{"label":"点头听一会儿"}],"scene":"daily_rain"},
    {"id":"daily_elevator","kind":"ambient","tag":"工作室日常","title":"电梯里遇见邻居工作室","text":"对方抱着一箱马克杯，你们交换了一个熟悉的眼神。","choices":[{"label":"微笑点头"},{"label":"聊一句天气"},{"label":"扶住电梯门"}],"scene":"daily_elevator"},
    {"id":"hidden_folder","kind":"hidden","tag":"工作室日常","title":"旧文件夹里有什么","text":"清理桌面时，一个名字模糊的文件夹引起了注意。","choices":[{"label":"打开看看","resultText":"里面是曾经搁置的世界观草稿，题材有了新的打磨空间。","caps":{"theme":0.15}},{"label":"先归档","resultText":"归档时翻到了工具订单的返现凭证。","cash":90}],"scene":"hidden_folder"},
    {"id":"hidden_note","kind":"hidden","tag":"工作室日常","title":"显示器边的一张便签","text":"便签上只有一个箭头，指向屏幕角落。","choices":[{"label":"顺着箭头找找","resultText":"箭头指向一份旧验收笔记，测试有了更充分的准备。","caps":{"qa":0.15}},{"label":"把便签翻过来","resultText":"背面画着团队全员的简笔头像。","morale":4}],"scene":"hidden_note"},
    {"id":"hidden_mail","kind":"hidden","tag":"工作室日常","title":"收到一封没有标题的邮件","text":"发件人的头像看起来有些熟悉。","choices":[{"label":"回复一句问候","resultText":"以前的合作方补结了一笔尾款。","cash":150},{"label":"转给天才程序员","resultText":"邮件附件里的旧接口被临时接入，留下了一点维护负担。","debt":2}],"scene":"hidden_mail"},
    {"id":"hidden_build","kind":"hidden","tag":"工作室日常","title":"构建结束时响了一声","text":"屏幕上的窗口被另一张便签挡住了。","choices":[{"label":"移开便签","resultText":"发现了可以复用的编译缓存，下一周程序工作更快。","effect":{"job":"code","mult":1.18,"weeks":1,"name":"编译缓存"}},{"label":"先去倒杯水","resultText":"构建需要重跑，团队下一周要花些时间重新整理流程。","effect":{"all":0.9,"weeks":1,"name":"重新整理流程"}}],"scene":"hidden_build"},
    {"id":"hidden_ticket","kind":"hidden","tag":"工作室日常","title":"抽屉里的一张小票","text":"纸张已经有些褪色，上面还有一个手绘的笑脸。","choices":[{"label":"拿给大家看看","resultText":"这是工作室第一次聚餐的小票，大家聊起了当时的糗事。","morale":8},{"label":"夹进笔记本","resultText":"意外翻到了还没兑现的休假计划，大家有点失落。","morale":-4}],"scene":"hidden_ticket"},
    {"id":"hidden_message","kind":"hidden","tag":"工作室日常","title":"群聊里多了一条语音","text":"消息不长，背景里有一点风声。","choices":[{"label":"戴耳机听","resultText":"老朋友分享了一种有趣的玩法思路。","caps":{"gameplay":0.15}},{"label":"外放给大家听","resultText":"讨论绕了个大圈，下一周发行事务的衔接会慢一点。","effect":{"job":"ops","mult":0.9,"weeks":1,"name":"讨论后的整理"}}],"scene":"hidden_message"},
    {"id":"hidden_drawer","kind":"hidden","tag":"工作室日常","title":"要整理哪个抽屉","text":"工位旁的两个抽屉都贴着同样的标签。","choices":[{"label":"上面的抽屉","resultText":"找到一张仍可兑换的小额工具券，已经折抵入账。","cash":80},{"label":"下面的抽屉","resultText":"找到尚未过期的维护套餐，未来两周可以节省一点开销。","effect":{"job":"overhead","mult":0.9,"weeks":2,"name":"旧维护套餐"}}],"scene":"hidden_drawer"},
    {"id":"hidden_dream","kind":"hidden","tag":"工作室日常","title":"早上想起了一个梦","text":"梦里的游戏画面很清晰，但醒来后只剩两个片段。","choices":[{"label":"记下那片风景","resultText":"风景给子主题提供了新的表达空间。","caps":{"subtheme":0.15}},{"label":"记下那段对白","resultText":"对白整理成了一份参考，下一周的策划表达更顺畅。","effect":{"job":"design","mult":1.12,"weeks":1,"name":"梦中的对白"}}],"scene":"hidden_dream"},
    {"id":"publisher_position","kind":"publisher","tag":"发行商建议","title":"发行商安排了一次定位讨论","text":"发行商代表：你们的题材表达还有值得拓展的空间，也可以先把现有方向整理到位。","choices":[{"label":"拓展内容表达","hint":"内容三项软上限各 +15%，最高 100%","caps":{"content":0.15}},{"label":"一起梳理题材","hint":"题材完成度 +8%，受当前上限限制","progress":{"theme":0.08}}],"condition":s=>!!s.publisher,"scene":"publisher_position"},
    {"id":"publisher_playtest","kind":"publisher","tag":"发行商建议","title":"发行商带来了试玩记录","text":"发行商代表：我们整理了玩家卡住的地方，可以协助打磨，也可以探索玩法的下一步。","choices":[{"label":"协作打磨玩法","hint":"玩法完成度 +8%，受当前上限限制","progress":{"gameplay":0.08}},{"label":"研究新玩法空间","hint":"玩法软上限 +15%，最高 100%","caps":{"gameplay":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_playtest"},
    {"id":"publisher_tech","kind":"publisher","tag":"发行商建议","title":"发行商请来了技术顾问","text":"发行商代表：顾问看过现有构架，愿意协助整理实现或系统接口。","choices":[{"label":"协助推进实现","hint":"开发进度完成度 +8%，受软上限和内容依赖限制","progress":{"development":0.08}},{"label":"梳理系统接口","hint":"系统协作完成度 +8%，受软上限和开发依赖限制","progress":{"systems":0.08}},{"label":"拓展程序打磨空间","hint":"程序三项软上限各 +15%，最高 100%","caps":{"framework":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_tech"},
    {"id":"publisher_quality","kind":"publisher","tag":"发行商建议","title":"发行商组织了验收交流","text":"发行商代表：现有实现可以交给验收人员协助测试，也可以先完善后续测试方案。","choices":[{"label":"联合测试现有版本","hint":"测试完成度 +10%，受软上限和上游依赖限制","progress":{"qa":0.1}},{"label":"补充测试方案","hint":"测试软上限 +15%，最高 100%","caps":{"qa":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_quality"},
    {"id":"publisher_commerce","kind":"publisher","tag":"发行商建议","title":"发行商提供了商业化建议","text":"发行商代表：我们可以协作改善付费体验，或为商业化预留更多打磨空间。","choices":[{"label":"协作打磨付费体验","hint":"用户付费完成度 +10%，受当前上限限制","progress":{"payment":0.1}},{"label":"拓展商业化方案","hint":"商业化三项软上限各 +15%，最高 100%","caps":{"commerce":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_commerce"},
    {"id":"publisher_ads","kind":"publisher","tag":"发行商建议","title":"发行商分享了广告体验建议","text":"发行商代表：广告变现属于你们的商业化设计；我们可以协助打磨激励位置和展示节奏。","choices":[{"label":"协作改善广告体验","hint":"广告变现完成度 +10%，受当前上限限制；不影响买量预算","progress":{"ads":0.1}},{"label":"拓展广告设计空间","hint":"广告变现软上限 +15%，最高 100%","caps":{"ads":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_ads"},
    {"id":"publisher_ip","kind":"publisher","tag":"发行商建议","title":"发行商提出了衍生内容建议","text":"发行商代表：角色与世界观很有辨识度，可以一起梳理衍生内容的制作方向。","choices":[{"label":"协作完善衍生内容","hint":"IP衍生完成度 +10%，受当前上限限制","progress":{"ip":0.1}},{"label":"拓展衍生内容空间","hint":"IP衍生软上限 +15%，最高 100%","caps":{"ip":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_ip"},
    {"id":"publisher_art","kind":"publisher","tag":"发行商建议","title":"发行商提出了视觉建议","text":"发行商代表：我们从商店展示的角度整理了一批参考，希望能帮助作品更有辨识度。","choices":[{"label":"协作完善子主题","hint":"子主题完成度 +8%，受当前上限限制","progress":{"subtheme":0.08}},{"label":"拓展视觉表现空间","hint":"子主题软上限 +15%，最高 100%","caps":{"subtheme":0.15}}],"condition":s=>!!s.publisher,"scene":"publisher_art"},
    {"id":"hidden_daily_cat","scene":"daily_cat","kind":"hidden","tag":"工作室日常","title":"窗外有一只猫","text":"一只猫坐在窗台上，似乎在监督这个工作室。","choices":[{"label":"隔着玻璃挥挥手","morale":4,"resultText":"猫在玻璃上留下一个爪印，大家看着笑了起来。"},{"label":"给它起个名字","caps":{"subtheme":0.1},"resultText":"随口起的名字启发了一个新的角色细节。"},{"label":"继续看屏幕","resultText":"猫坐了一会儿就走了，办公室恢复安静。"}]},
    {"id":"hidden_daily_lunch","scene":"daily_lunch","kind":"hidden","tag":"工作室日常","title":"午饭投票又平局了","text":"菜单在群里传了三轮，大家依旧没有达成共识。","choices":[{"label":"投面条一票","morale":6,"resultText":"午饭合了大家的口味，气氛轻松了一些。"},{"label":"投米饭一票","cash":100,"resultText":"店家核对订单时退回了上次多收的餐费。"},{"label":"让硬币决定","effect":{"all":0.9,"weeks":1,"name":"午间讨论的尾巴"},"resultText":"投票讨论延伸成了一场长会，下一周需要重新衔接工作。"}]},
    {"id":"hidden_daily_branch","scene":"daily_branch","kind":"hidden","tag":"工作室日常","title":"这个分支该叫什么","text":"天才程序员说，这次取一个平平无奇的名字就好。","choices":[{"label":"叫做 next","effect":{"job":"code","mult":1.12,"weeks":1,"name":"分支整理"},"resultText":"简短的名字顺便促成了一次分支整理。"},{"label":"叫做 next_final","effect":{"job":"code","mult":0.9,"weeks":1,"name":"分支重命名"},"resultText":"几个相近的分支混在了一起，下一周要重新核对。"},{"label":"叫做 next_final_really","morale":3,"resultText":"名字成了今天办公室的新梗。"}]},
    {"id":"hidden_daily_plant","scene":"daily_plant","kind":"hidden","tag":"工作室日常","title":"桌上的绿植朝左歪了","text":"大家围着花盆研究了片刻，谁也没说出个所以然。","choices":[{"label":"把花盆转半圈","caps":{"theme":0.1},"resultText":"换个方向看盆栽，突然想到了新的题材表达。"},{"label":"给它画个小箭头","morale":3,"resultText":"小箭头引来了大家的一轮涂鸦。"},{"label":"赞同它的选择","resultText":"花盆依旧朝着原来的方向。"}]},
    {"id":"hidden_daily_cable","scene":"daily_cable","kind":"hidden","tag":"工作室日常","title":"那根线到底属于谁","text":"抽屉里多出一根没有标签的线，接口看起来很有年代感。","choices":[{"label":"放回原处","cash":80,"resultText":"收纳时找到一张尚未结清的工具退款单。"},{"label":"贴上「未知」标签","effect":{"job":"overhead","mult":0.9,"weeks":2,"name":"线材整理"},"resultText":"标签促成了一次设备整理，接下来两周维护开销略低。"},{"label":"摆进线材收藏盒","effect":{"job":"code","mult":1.1,"weeks":1,"name":"备用连接线"},"resultText":"收藏盒里的转接头刚好能改善构建机的连接。"}]},
    {"id":"hidden_daily_cursor","scene":"daily_cursor","kind":"hidden","tag":"工作室日常","title":"光标停在一个句号后面","text":"办公室很安静，只有键盘灯在缓缓变色。","choices":[{"label":"看它变成蓝色","effect":{"job":"design","mult":1.12,"weeks":1,"name":"蓝色便签"},"resultText":"发呆时理清了一份策划草稿。"},{"label":"看它变成紫色","effect":{"job":"test","mult":1.12,"weeks":1,"name":"紫色便签"},"resultText":"视线落在验收笔记上，几条步骤接了起来。"},{"label":"把视线移开","morale":-3,"resultText":"盯屏幕太久有些疲惫，大家决定少聊几句。"}]},
    {"id":"hidden_daily_rain","scene":"daily_rain","kind":"hidden","tag":"工作室日常","title":"雨滴在窗上排队","text":"有人问：如果把雨声放进片尾，会不会很合适？","choices":[{"label":"说像白噪音","effect":{"job":"art","mult":1.12,"weeks":1,"name":"雨声参考"},"resultText":"雨声成了下一周制作画面和氛围的参考。"},{"label":"说像篝火声","caps":{"subtheme":0.1},"resultText":"联想让子主题有了新的打磨方向。"},{"label":"点头听一会儿","morale":5,"resultText":"安静听雨的片刻让大家放松了一点。"}]},
    {"id":"hidden_daily_elevator","scene":"daily_elevator","kind":"hidden","tag":"工作室日常","title":"电梯里遇见邻居工作室","text":"对方抱着一箱马克杯，你们交换了一个熟悉的眼神。","choices":[{"label":"微笑点头","cash":120,"resultText":"邻居想起上次借用设备的费用，转来了补款。"},{"label":"聊一句天气","caps":{"payment":0.1},"resultText":"闲聊意外谈到了付费内容的新组织方式。"},{"label":"扶住电梯门","resultText":"电梯到了，各自回去继续工作。"}]},
    {"id":"daily_hidden_folder","scene":"hidden_folder","kind":"ambient","tag":"工作室日常","title":"旧文件夹里有什么","text":"清理桌面时，一个名字模糊的文件夹引起了注意。","choices":[{"label":"打开看看"},{"label":"先归档"}]},
    {"id":"daily_hidden_note","scene":"hidden_note","kind":"ambient","tag":"工作室日常","title":"显示器边的一张便签","text":"便签上只有一个箭头，指向屏幕角落。","choices":[{"label":"顺着箭头找找"},{"label":"把便签翻过来"}]},
    {"id":"daily_hidden_mail","scene":"hidden_mail","kind":"ambient","tag":"工作室日常","title":"收到一封没有标题的邮件","text":"发件人的头像看起来有些熟悉。","choices":[{"label":"回复一句问候"},{"label":"转给天才程序员"}]},
    {"id":"daily_hidden_build","scene":"hidden_build","kind":"ambient","tag":"工作室日常","title":"构建结束时响了一声","text":"屏幕上的窗口被另一张便签挡住了。","choices":[{"label":"移开便签"},{"label":"先去倒杯水"}]},
    {"id":"daily_hidden_ticket","scene":"hidden_ticket","kind":"ambient","tag":"工作室日常","title":"抽屉里的一张小票","text":"纸张已经有些褪色，上面还有一个手绘的笑脸。","choices":[{"label":"拿给大家看看"},{"label":"夹进笔记本"}]},
    {"id":"daily_hidden_message","scene":"hidden_message","kind":"ambient","tag":"工作室日常","title":"群聊里多了一条语音","text":"消息不长，背景里有一点风声。","choices":[{"label":"戴耳机听"},{"label":"外放给大家听"}]},
    {"id":"daily_hidden_drawer","scene":"hidden_drawer","kind":"ambient","tag":"工作室日常","title":"要整理哪个抽屉","text":"工位旁的两个抽屉都贴着同样的标签。","choices":[{"label":"上面的抽屉"},{"label":"下面的抽屉"}]},
    {"id":"daily_hidden_dream","scene":"hidden_dream","kind":"ambient","tag":"工作室日常","title":"早上想起了一个梦","text":"梦里的游戏画面很清晰，但醒来后只剩两个片段。","choices":[{"label":"记下那片风景"},{"label":"记下那段对白"}]},
    {"id":"daily_kettle","kind":"ambient","scene":"scene_kettle","tag":"工作室日常","title":"水壶响了第三次","text":"茶水间里有人探出头，问这一壶要泡点什么。","choices":[{"label":"拿出茶叶"},{"label":"找找咖啡"},{"label":"先喝白水"}]},
    {"id":"hidden_kettle","kind":"hidden","scene":"scene_kettle","tag":"工作室日常","title":"水壶响了第三次","text":"茶水间里有人探出头，问这一壶要泡点什么。","choices":[{"label":"拿出茶叶","morale":5,"resultText":"热茶让大家的聊天轻松起来。"},{"label":"找找咖啡","effect":{"all":1.1,"weeks":1,"name":"茶水间的新安排"},"resultText":"冲咖啡时顺便理清了下周的协作顺序。"},{"label":"先喝白水","resultText":"喝完水，大家各自回到工位。"}]},
    {"id":"shared_kettle","scene":"scene_kettle","tag":"工作室日常","title":"水壶响了第三次","text":"茶水间里有人探出头，问这一壶要泡点什么。","choices":[{"label":"拿出茶叶","hint":"士气 +5","morale":5},{"label":"找找咖啡","hint":"未来 1 周全体效率 +10%","effect":{"all":1.1,"weeks":1,"name":"茶水间的新安排"}},{"label":"先喝白水","hint":"没有额外数值变化"}]},
    {"id":"daily_whiteboard","kind":"ambient","scene":"scene_whiteboard","tag":"工作室日常","title":"白板还剩一个角落","text":"白板上密密麻麻，最后一个空角落引起了大家的注意。","choices":[{"label":"画个小方框"},{"label":"写一句话"},{"label":"留着空白"}]},
    {"id":"hidden_whiteboard","kind":"hidden","scene":"scene_whiteboard","tag":"工作室日常","title":"白板还剩一个角落","text":"白板上密密麻麻，最后一个空角落引起了大家的注意。","choices":[{"label":"画个小方框","caps":{"systems":0.1},"resultText":"小方框变成了接口草图，系统协作有了新空间。"},{"label":"写一句话","effect":{"job":"design","mult":1.15,"weeks":1,"name":"白板上的一句话"},"resultText":"一句话帮团队理顺了设计表达。"},{"label":"留着空白","morale":3,"resultText":"大家约定给下一次讨论留一点余地。"}]},
    {"id":"shared_whiteboard","scene":"scene_whiteboard","tag":"工作室日常","title":"白板还剩一个角落","text":"白板上密密麻麻，最后一个空角落引起了大家的注意。","choices":[{"label":"画个小方框","hint":"系统协作软上限 +10%","caps":{"systems":0.1}},{"label":"写一句话","hint":"未来 1 周策划设计效率 +15%","effect":{"job":"design","mult":1.15,"weeks":1,"name":"白板上的一句话"}},{"label":"留着空白","hint":"士气 +3","morale":3}]},
    {"id":"daily_notification","kind":"ambient","scene":"scene_notification","tag":"工作室日常","title":"通知栏亮了一下","text":"屏幕角落出现一个提示，几秒后又安静下来。","choices":[{"label":"点开看看"},{"label":"晚点再看"}]},
    {"id":"hidden_notification","kind":"hidden","scene":"scene_notification","tag":"工作室日常","title":"通知栏亮了一下","text":"屏幕角落出现一个提示，几秒后又安静下来。","choices":[{"label":"点开看看","cash":100,"resultText":"是一笔已到账的工具返现。"},{"label":"晚点再看","effect":{"job":"ops","mult":0.9,"weeks":1,"name":"延后整理通知"},"resultText":"几封联络信堆在一起，下周发行事务需要重新整理。"}]},
    {"id":"shared_notification","scene":"scene_notification","tag":"工作室日常","title":"通知栏亮了一下","text":"屏幕角落出现一个提示，几秒后又安静下来。","choices":[{"label":"点开看看","hint":"资金 +¥100","cash":100},{"label":"晚点再看","hint":"未来 1 周发行事务效率 -10%","effect":{"job":"ops","mult":0.9,"weeks":1,"name":"延后整理通知"}}]},
    {"id":"daily_album","kind":"ambient","scene":"scene_album","tag":"工作室日常","title":"相册里多了一张截图","text":"不知道是谁把一张截图传进了工作室共享相册。","choices":[{"label":"放大看看"},{"label":"顺手收藏"}]},
    {"id":"hidden_album","kind":"hidden","scene":"scene_album","tag":"工作室日常","title":"相册里多了一张截图","text":"不知道是谁把一张截图传进了工作室共享相册。","choices":[{"label":"放大看看","caps":{"subtheme":0.15},"resultText":"截图里的构图启发了新的视觉细节。"},{"label":"顺手收藏","effect":{"job":"art","mult":1.15,"weeks":1,"name":"共享相册参考"},"resultText":"收藏夹里的参考被整理到了一起。"}]},
    {"id":"shared_album","scene":"scene_album","tag":"工作室日常","title":"相册里多了一张截图","text":"不知道是谁把一张截图传进了工作室共享相册。","choices":[{"label":"放大看看","hint":"子主题软上限 +15%","caps":{"subtheme":0.15}},{"label":"顺手收藏","hint":"未来 1 周美术制作效率 +15%","effect":{"job":"art","mult":1.15,"weeks":1,"name":"共享相册参考"}}]},
    {"id":"daily_seat","kind":"ambient","scene":"scene_seat","tag":"工作室日常","title":"今天坐哪个位置","text":"阳光照在另一张空椅子上，电源线也刚好够长。","choices":[{"label":"换到窗边"},{"label":"坐回原位"}]},
    {"id":"hidden_seat","kind":"hidden","scene":"scene_seat","tag":"工作室日常","title":"今天坐哪个位置","text":"阳光照在另一张空椅子上，电源线也刚好够长。","choices":[{"label":"换到窗边","morale":5,"resultText":"换个位置让大家精神了一点。"},{"label":"坐回原位","effect":{"job":"code","mult":1.1,"weeks":1,"name":"熟悉的工位"},"resultText":"熟悉的桌面布局帮助理清了下周的实现安排。"}]},
    {"id":"shared_seat","scene":"scene_seat","tag":"工作室日常","title":"今天坐哪个位置","text":"阳光照在另一张空椅子上，电源线也刚好够长。","choices":[{"label":"换到窗边","hint":"士气 +5","morale":5},{"label":"坐回原位","hint":"未来 1 周程序开发效率 +10%","effect":{"job":"code","mult":1.1,"weeks":1,"name":"熟悉的工位"}}]},
    {"id":"daily_parcel","kind":"ambient","scene":"scene_parcel","tag":"工作室日常","title":"前台送来一个纸箱","text":"纸箱上的标签有些模糊，里面传来轻微的碰撞声。","choices":[{"label":"现在拆开"},{"label":"等大家一起拆"}]},
    {"id":"hidden_parcel","kind":"hidden","scene":"scene_parcel","tag":"工作室日常","title":"前台送来一个纸箱","text":"纸箱上的标签有些模糊，里面传来轻微的碰撞声。","choices":[{"label":"现在拆开","cash":120,"resultText":"供应商附上了此前差价的退款凭证。"},{"label":"等大家一起拆","caps":{"ip":0.1},"resultText":"样品引出了几种衍生内容的制作想法。"}]},
    {"id":"shared_parcel","scene":"scene_parcel","tag":"工作室日常","title":"前台送来一个纸箱","text":"纸箱上的标签有些模糊，里面传来轻微的碰撞声。","choices":[{"label":"现在拆开","hint":"资金 +¥120","cash":120},{"label":"等大家一起拆","hint":"IP衍生软上限 +10%","caps":{"ip":0.1}}]},
    {"id":"daily_keyboard","kind":"ambient","scene":"scene_keyboard","tag":"工作室日常","title":"键盘换了一种声音","text":"敲击声和平时有点不同，有人抬头看了看。","choices":[{"label":"听一会儿"},{"label":"换个角度摆放"}]},
    {"id":"hidden_keyboard","kind":"hidden","scene":"scene_keyboard","tag":"工作室日常","title":"键盘换了一种声音","text":"敲击声和平时有点不同，有人抬头看了看。","choices":[{"label":"听一会儿","effect":{"job":"test","mult":1.15,"weeks":1,"name":"键盘旁的笔记"},"resultText":"看键盘时注意到一份验收记录，测试步骤顺了起来。"},{"label":"换个角度摆放","morale":-4,"resultText":"桌面的线绕在一起，整理得有些烦躁。"}]},
    {"id":"shared_keyboard","scene":"scene_keyboard","tag":"工作室日常","title":"键盘换了一种声音","text":"敲击声和平时有点不同，有人抬头看了看。","choices":[{"label":"听一会儿","hint":"未来 1 周测试打磨效率 +15%","effect":{"job":"test","mult":1.15,"weeks":1,"name":"键盘旁的笔记"}},{"label":"换个角度摆放","hint":"士气 +5，支付 ¥40 调整工位","morale":5,"cash":-40}]},
    {"id":"daily_invitation","kind":"ambient","scene":"scene_invitation","tag":"工作室日常","title":"日历上多了一条邀请","text":"邀请只有一个简短标题，地点写着楼下的小会议室。","choices":[{"label":"带上笔记本"},{"label":"先问问时间"}]},
    {"id":"hidden_invitation","kind":"hidden","scene":"scene_invitation","tag":"工作室日常","title":"日历上多了一条邀请","text":"邀请只有一个简短标题，地点写着楼下的小会议室。","choices":[{"label":"带上笔记本","caps":{"payment":0.15},"resultText":"交流带来了新的付费体验方向。"},{"label":"先问问时间","effect":{"all":1.1,"weeks":1,"name":"对齐交流时间"},"resultText":"确认时间时顺手把下周的协作安排对齐了。"}]},
    {"id":"shared_invitation","scene":"scene_invitation","tag":"工作室日常","title":"日历上多了一条邀请","text":"邀请只有一个简短标题，地点写着楼下的小会议室。","choices":[{"label":"带上笔记本","hint":"用户付费软上限 +15%","caps":{"payment":0.15}},{"label":"先问问时间","hint":"未来 1 周全体效率 +10%","effect":{"all":1.1,"weeks":1,"name":"对齐交流时间"}}]},
    {"id":"daily_printer","kind":"ambient","scene":"scene_printer","tag":"工作室日常","title":"打印机吐出了一张纸","text":"没人记得刚才按过打印，纸上只有几行字。","choices":[{"label":"拿起来读"},{"label":"放到公共桌上"}]},
    {"id":"hidden_printer","kind":"hidden","scene":"scene_printer","tag":"工作室日常","title":"打印机吐出了一张纸","text":"没人记得刚才按过打印，纸上只有几行字。","choices":[{"label":"拿起来读","caps":{"qa":0.1},"resultText":"纸上是一份旧验收思路，可以继续扩展测试准备。"},{"label":"放到公共桌上","morale":4,"resultText":"伙伴认出了自己早上写的小笑话。"}]},
    {"id":"shared_printer","scene":"scene_printer","tag":"工作室日常","title":"打印机吐出了一张纸","text":"没人记得刚才按过打印，纸上只有几行字。","choices":[{"label":"拿起来读","hint":"测试软上限 +10%","caps":{"qa":0.1}},{"label":"放到公共桌上","hint":"士气 +4","morale":4}]},
    {"id":"daily_usb","kind":"ambient","scene":"scene_usb","tag":"工作室日常","title":"桌上躺着一只旧U盘","text":"外壳有一道划痕，标签上的字已经掉了色。","choices":[{"label":"找个盒子收好"},{"label":"问问是谁的"}]},
    {"id":"hidden_usb","kind":"hidden","scene":"scene_usb","tag":"工作室日常","title":"桌上躺着一只旧U盘","text":"外壳有一道划痕，标签上的字已经掉了色。","choices":[{"label":"找个盒子收好","debt":-2,"resultText":"盒子里的旧接口文档帮助理清了两处维护关系。"},{"label":"问问是谁的","effect":{"job":"code","mult":1.12,"weeks":1,"name":"旧接口文档"},"resultText":"伙伴翻出了对应的接口参考，下周实现更顺畅。"}]},
    {"id":"shared_usb","scene":"scene_usb","tag":"工作室日常","title":"桌上躺着一只旧U盘","text":"外壳有一道划痕，标签上的字已经掉了色。","choices":[{"label":"找个盒子收好","hint":"技术债 -2","debt":-2},{"label":"问问是谁的","hint":"未来 1 周程序开发效率 +12%","effect":{"job":"code","mult":1.12,"weeks":1,"name":"旧接口文档"}}]},
    {"id":"daily_clock","kind":"ambient","scene":"scene_clock","tag":"工作室日常","title":"墙上的钟慢了两分钟","text":"有人举起手机核对时间，另一人说这样好像也不错。","choices":[{"label":"把时间调准"},{"label":"先记在便签上"}]},
    {"id":"hidden_clock","kind":"hidden","scene":"scene_clock","tag":"工作室日常","title":"墙上的钟慢了两分钟","text":"有人举起手机核对时间，另一人说这样好像也不错。","choices":[{"label":"把时间调准","effect":{"all":1.08,"weeks":1,"name":"对齐时间表"},"resultText":"校对时间顺便理顺了下周的工作交接。"},{"label":"先记在便签上","morale":4,"resultText":"便签成了今天最轻松的一句办公室玩笑。"}]},
    {"id":"shared_clock","scene":"scene_clock","tag":"工作室日常","title":"墙上的钟慢了两分钟","text":"有人举起手机核对时间，另一人说这样好像也不错。","choices":[{"label":"把时间调准","hint":"未来 1 周全体效率 +8%","effect":{"all":1.08,"weeks":1,"name":"对齐时间表"}},{"label":"先记在便签上","hint":"士气 +4","morale":4}]},
    {"id":"daily_reply","kind":"ambient","scene":"scene_reply","tag":"工作室日常","title":"聊天窗口里停着三个点","text":"对方似乎还在输入，大家等了一小会儿。","choices":[{"label":"发个表情"},{"label":"再等一会儿"}]},
    {"id":"hidden_reply","kind":"hidden","scene":"scene_reply","tag":"工作室日常","title":"聊天窗口里停着三个点","text":"对方似乎还在输入，大家等了一小会儿。","choices":[{"label":"发个表情","caps":{"theme":0.1},"resultText":"一个表情引出了新的人物与题材联想。"},{"label":"再等一会儿","cash":160,"resultText":"对方确认了此前的合作尾款并转账。"}]},
    {"id":"shared_reply","scene":"scene_reply","tag":"工作室日常","title":"聊天窗口里停着三个点","text":"对方似乎还在输入，大家等了一小会儿。","choices":[{"label":"发个表情","hint":"题材软上限 +10%","caps":{"theme":0.1}},{"label":"再等一会儿","hint":"资金 +¥160","cash":160}]},
    {"id":"daily_headphones","kind":"ambient","scene":"scene_headphones","tag":"工作室日常","title":"耳机里传来一段前奏","text":"曲子刚响起就停了，似乎有人按错了播放键。","choices":[{"label":"问问曲名"},{"label":"把耳机放好"}]},
    {"id":"hidden_headphones","kind":"hidden","scene":"scene_headphones","tag":"工作室日常","title":"耳机里传来一段前奏","text":"曲子刚响起就停了，似乎有人按错了播放键。","choices":[{"label":"问问曲名","caps":{"subtheme":0.1},"resultText":"曲子的氛围启发了新的子主题表达。"},{"label":"把耳机放好","effect":{"job":"art","mult":0.9,"weeks":1,"name":"重新整理参考"},"resultText":"参考列表混在一起，下周美术要重新分类。"}]},
    {"id":"daily_calendar","kind":"ambient","scene":"scene_calendar","tag":"工作室日常","title":"月历上有个没署名的圈","text":"日期旁边画着一个小圈，没有其他说明。","choices":[{"label":"补一个问号"},{"label":"问问大家"}]},
    {"id":"hidden_calendar","kind":"hidden","scene":"scene_calendar","tag":"工作室日常","title":"月历上有个没署名的圈","text":"日期旁边画着一个小圈，没有其他说明。","choices":[{"label":"补一个问号","morale":3,"resultText":"大家围着问号聊起了第一次立项。"},{"label":"问问大家","debt":-2,"resultText":"问出了那天的维护记录，几处旧衔接得以理清。"}]},
    {"id":"daily_samplebook","kind":"ambient","scene":"scene_samplebook","tag":"工作室日常","title":"样册翻到了一页空白","text":"夹在样册中的一页白纸落在了桌面上。","choices":[{"label":"在上面涂两笔"},{"label":"夹回原处"}]},
    {"id":"hidden_samplebook","kind":"hidden","scene":"scene_samplebook","tag":"工作室日常","title":"样册翻到了一页空白","text":"夹在样册中的一页白纸落在了桌面上。","choices":[{"label":"在上面涂两笔","caps":{"ip":0.15},"resultText":"随手画的轮廓延伸成了衍生内容的新方向。"},{"label":"夹回原处","effect":{"job":"design","mult":1.12,"weeks":1,"name":"样册整理"},"resultText":"翻页时把几份零散的设计参考接了起来。"}]},
    {"id":"daily_planter","kind":"ambient","scene":"scene_planter","tag":"工作室日常","title":"花盆旁边多了一个小石头","text":"石头被摆得很整齐，像是特意放在那里。","choices":[{"label":"挪到另一边"},{"label":"保持原样"}]},
    {"id":"hidden_planter","kind":"hidden","scene":"scene_planter","tag":"工作室日常","title":"花盆旁边多了一个小石头","text":"石头被摆得很整齐，像是特意放在那里。","choices":[{"label":"挪到另一边","effect":{"job":"ops","mult":1.12,"weeks":1,"name":"小石头旁的清单"},"resultText":"挪动时发现压在下面的联络清单，下一周发行事务更顺畅。"},{"label":"保持原样","resultText":"石头和花盆安静地待在一起。"}]},
    {"id":"daily_stationery","kind":"ambient","scene":"scene_stationery","tag":"工作室日常","title":"文具盒里少了一支笔","text":"大家各自看了看桌面，好像每人都有一支差不多的。","choices":[{"label":"看看抽屉"},{"label":"借一支先用"}]},
    {"id":"hidden_stationery","kind":"hidden","scene":"scene_stationery","tag":"工作室日常","title":"文具盒里少了一支笔","text":"大家各自看了看桌面，好像每人都有一支差不多的。","choices":[{"label":"看看抽屉","cash":80,"resultText":"找笔时翻到了一笔可以退回的文具差价。"},{"label":"借一支先用","morale":4,"resultText":"借来的笔带着一张鼓励的小纸条。"}]},
    {"id":"daily_light","kind":"ambient","scene":"scene_light","tag":"工作室日常","title":"台灯的光落在另一页上","text":"一阵风吹动了笔记本，翻开的那页有点眼熟。","choices":[{"label":"读完这一页"},{"label":"翻回刚才那页"}]},
    {"id":"hidden_light","kind":"hidden","scene":"scene_light","tag":"工作室日常","title":"台灯的光落在另一页上","text":"一阵风吹动了笔记本，翻开的那页有点眼熟。","choices":[{"label":"读完这一页","caps":{"gameplay":0.1},"resultText":"旧笔记里有一段尚未展开的玩法思路。"},{"label":"翻回刚才那页","effect":{"job":"test","mult":1.12,"weeks":1,"name":"台灯下的验收笔记"},"resultText":"两页笔记对在一起，让下周测试安排更清楚。"}]},
    {"id":"daily_sticker","kind":"ambient","scene":"scene_sticker","tag":"工作室日常","title":"杯子上多了一张贴纸","text":"贴纸贴得歪歪的，图案倒是很有精神。","choices":[{"label":"把它贴正"},{"label":"保留这个角度"}]},
    {"id":"hidden_sticker","kind":"hidden","scene":"scene_sticker","tag":"工作室日常","title":"杯子上多了一张贴纸","text":"贴纸贴得歪歪的，图案倒是很有精神。","choices":[{"label":"把它贴正","caps":{"ads":0.1},"resultText":"调整位置时想到一种更自然的广告展示设计。"},{"label":"保留这个角度","morale":5,"resultText":"歪着的贴纸成了大家今天最喜欢的小细节。"}]},
    {"id":"daily_walk","kind":"ambient","scene":"scene_walk","tag":"工作室日常","title":"楼下新铺了一条小路","text":"回工作室的路上，有人指了指刚铺好的路面。","choices":[{"label":"绕过去看看"},{"label":"沿着老路走"}]},
    {"id":"hidden_walk","kind":"hidden","scene":"scene_walk","tag":"工作室日常","title":"楼下新铺了一条小路","text":"回工作室的路上，有人指了指刚铺好的路面。","choices":[{"label":"绕过去看看","effect":{"all":1.1,"weeks":1,"name":"走过一条新路"},"resultText":"散步时讨论出了更顺手的下周协作顺序。"},{"label":"沿着老路走","morale":4,"resultText":"熟悉的小路让这一天结束得很平静。"}]},
    {"id":"publisher_whiteboard","scene":"scene_whiteboard","kind":"publisher","tag":"发行商建议","title":"白板还剩一个角落","text":"白板上密密麻麻，最后一个空角落引起了大家的注意。","condition":s=>!!s.publisher,"choices":[{"label":"一起整理接口草图","hint":"系统协作完成度 +8%，受上游依赖与软上限限制","progress":{"systems":0.08}},{"label":"把草图继续展开","hint":"程序三项软上限各 +10%","caps":{"framework":0.1}}]},
    {"id":"publisher_kettle","scene":"scene_kettle","kind":"publisher","tag":"发行商建议","title":"水壶响了第三次","text":"茶水间里有人探出头，问这一壶要泡点什么。","condition":s=>!!s.publisher,"choices":[{"label":"聊聊下一步的内容","hint":"内容三项软上限各 +10%","caps":{"content":0.1}},{"label":"整理刚才的题材想法","hint":"题材完成度 +8%，受当前上限限制","progress":{"theme":0.08}}]},
    {"id":"publisher_parcel","scene":"scene_parcel","kind":"publisher","tag":"发行商建议","title":"前台送来一个纸箱","text":"纸箱上的标签有些模糊，里面传来轻微的碰撞声。","condition":s=>!!s.publisher,"choices":[{"label":"一起整理样品参考","hint":"IP衍生完成度 +8%，受当前上限限制","progress":{"ip":0.08}},{"label":"多准备几种衍生方向","hint":"IP衍生软上限 +15%","caps":{"ip":0.15}}]},
    {"id":"publisher_printer","scene":"scene_printer","kind":"publisher","tag":"发行商建议","title":"打印机吐出了一张纸","text":"没人记得刚才按过打印，纸上只有几行字。","condition":s=>!!s.publisher,"choices":[{"label":"一起梳理验收步骤","hint":"测试完成度 +8%，受上游依赖与软上限限制","progress":{"qa":0.08}},{"label":"拓展测试准备","hint":"测试软上限 +15%","caps":{"qa":0.15}}]}
  ];
  const eventTargets=id=>task(id)?[task(id)]:JOBS.filter(j=>j.group===id);
  function publisherAdviceAllowed(c){return ['caps','progress'].some(k=>c[k])&&['caps','progress'].every(k=>Object.keys(c[k]||{}).every(id=>eventTargets(id).length&&eventTargets(id).every(j=>['content','framework','commerce'].includes(j.group))));}
  const capRoom=(s,id)=>eventTargets(id).some(j=>j.group!=='release'&&softCap(s,j.id)<HARD_CAP);
  const progressRoom=(s,id)=>workLimit(s,id)-s.work[id]>.01;
  // Original events remain, but irrelevant contexts and exhausted choices leave the live pool.
  function eventContext(s,e){
    if(e.min&&coreProgress(s)<e.min||e.condition&&!e.condition(s))return false;
    if(['compat','debt'].includes(e.id))return s.debt>0;
    if(['forms','store_page'].includes(e.id))return !complete(s);
    if(e.id==='backup')return JOBS.some(j=>j.skill==='code'&&s.people[j.id]>0);
    return true;
  }
  function usefulChoice(s,c){
    if(c.cash<0&&s.money<-c.cash)return false;
    // When the principal reward is exhausted, secondary morale or cleanup does not keep it alive.
    if(c.caps&&!Object.keys(c.caps).some(id=>capRoom(s,id)))return false;
    if(c.progress&&!Object.keys(c.progress).some(id=>progressRoom(s,id)))return false;
    const efficiencyUseful=c.effect&&(c.effect.job==='overhead'||JOBS.some(j=>(!c.effect.job||j.skill===c.effect.job)&&!publisherManaged(s,j.id)&&(progressRoom(s,j.id)||j.id==='systems'&&s.debt>0)));
    return c.cash>0||c.caps||c.progress||efficiencyUseful||c.debt>0||c.debt<0&&s.debt>0||c.morale>0&&s.morale<reputationProfile(s).moraleCap||c.morale<0&&s.morale>25;
  }
  function eventWeight(s,e,choices){
    let weight=1;
    if(e.id==='cash_review'&&s.money<cost(s).total*4)weight+=3;
    if(e.id==='tired'&&s.morale<50)weight+=2;
    if(e.id==='debt'&&s.debt>8)weight+=2;
    if(choices.some(c=>c.caps&&Object.keys(c.caps).some(id=>eventTargets(id).some(j=>j.group!=='release'&&(s.people[j.id]>0||publisherManaged(s,j.id))&&progress(s,j.id)>=softCap(s,j.id)-.05))))weight+=2;
    return weight;
  }
  function eligibleEvents(s){return EVENTS.filter(e=>e.id!==s.lastEvent&&(!e.scene||e.scene!==s.lastScene)&&eventContext(s,e)).map(e=>{
    const choices=e.kind==='ambient'?e.choices:e.kind==='hidden'?(e.choices.some(c=>usefulChoice(s,c))?e.choices:[]):e.choices.filter(c=>(e.kind!=='publisher'||publisherAdviceAllowed(c))&&usefulChoice(s,c));
    // Paused projects share their wallet with other projects: never freeze a paid-only decision.
    if(!e.kind&&choices.length&&choices.every(c=>c.cash<0))choices.push({label:'暂时搁置',hint:'保留现有成果，没有数值变化'});
    return {...e,choices,weight:eventWeight(s,e,choices)};
  }).filter(e=>e.choices.length);}
  function eventPool(s){return eligibleEvents(s).map(e=>({id:e.id,kind:e.kind||'standard',weight:e.weight}));}
  function pendingEvent(s){const e=EVENTS.find(e=>e.id===s.pendingEvent);if(!e)return undefined;
    const frozen=s.pendingChoices?.id===e.id,choices=frozen?copy(s.pendingChoices.choices):e.choices.slice(),g=group(s.pendingCapGroup);
    if(!frozen&&!e.kind&&g&&capRoom(s,g.id))choices.push({label:'复盘并拓展'+g.name,hint:g.name+'各项完成度软上限 +15%，最高 100%；仍需安排工作',caps:{[g.id]:CAP_STEP}});
    return {...e,choices};
  }
  function event(s){const e=pendingEvent(s);if(!e)return undefined;
    const daily=e.kind==='ambient'||e.kind==='hidden';
    return {id:e.id,kind:daily?'daily':e.kind||'standard',tag:e.tag,title:e.title,text:e.text,choices:e.choices.map(c=>daily?{label:c.label}:{...c})};
  }
  function eventChoiceStatus(s,i){if(s.over||s.paused)return {ok:false,reason:'项目已结束或暂停'};const e=pendingEvent(s),c=e?.choices[i];if(!c||e.kind==='publisher'&&!s.publisher)return {ok:false,reason:'无效选项'};if(e.kind==='publisher'&&!publisherAdviceAllowed(c))return {ok:false,reason:'发行商建议只能协助游戏内容、程序构架和商业化工作'};if(c.cash<0&&s.money<-c.cash)return {ok:false,reason:'资金不足'};return {ok:true};}
  function acknowledgeEvent(s){if(s.over||s.paused||!s.eventResult?.unread)return false;s.eventResult.unread=false;return true;}
  function checkMilestones(s){const n=coreProgress(s);for(const milestone of [{id:'prototype',check:n>=.3,name:'可玩原型'},{id:'vertical',check:n>=.65,name:'垂直切片'},{id:'content',check:coreReady(s),name:'内容完成'}])if(milestone.check&&!s.milestones.includes(milestone.id)){s.milestones.push(milestone.id);addLog(s,'达成「'+milestone.name+'」。项目进展已记录；高级伙伴通过累计销售名誉结识。','good');}}

  function resolveEvent(s,i){const e=pendingEvent(s),c=e?.choices[i];if(!eventChoiceStatus(s,i).ok)return false;
    const before={work:copy(s.work),caps:copy(s.softCaps),money:s.money,debt:s.debt,morale:s.morale},details=[];
    if(c.cash){s.money+=c.cash;if(c.cash<0)s.spent-=c.cash;else s.income+=c.cash;}
    if(c.caps)unlockCaps(s,c.caps);
    // Advice is applied once, bounded by the current soft cap and a single dependency snapshot.
    const limits=Object.fromEntries(JOBS.map(j=>[j.id,workLimit(s,j.id)]));
    if(e.kind==='publisher'&&c.progress)for(const [id,n] of Object.entries(c.progress))s.work[id]=Math.max(s.work[id],round(Math.min(limits[id],s.work[id]+s.req[id]*n)));
    s.debt=round(Math.max(0,s.debt+(c.debt||0)));s.morale=clamp(s.morale+(c.morale||0),25,reputationProfile(s).moraleCap);
    if(c.effect)s.effects.push(copy(c.effect));
    const signed=n=>(n>0?'+':'−')+Math.abs(round(n));
    if(s.money!==before.money)details.push('生涯资金 '+(s.money>before.money?'+':'−')+'¥'+Math.abs(s.money-before.money));
    for(const j of JOBS){const gain=round((s.work[j.id]-before.work[j.id])/s.req[j.id]*100);if(gain)details.push(j.name+'完成度 '+signed(gain)+'%（现为 '+round(progress(s,j.id)*100)+'%）');if(j.group!=='release'&&s.softCaps[j.id]!==before.caps[j.id])details.push(j.name+'软上限 '+round(before.caps[j.id]*100)+'% → '+round(s.softCaps[j.id]*100)+'%');}
    for(const [id,name] of [['debt','技术债'],['morale','士气']])if(s[id]!==before[id])details.push(name+' '+signed(s[id]-before[id]));
    if(c.effect){const effect=c.effect,label=effect.all?'全体效率':effect.job==='overhead'?'维护费':(SKILLS.find(k=>k.id===effect.job)?.name||'工作')+'效率';details.push(label+' '+signed(((effect.all||effect.mult||1)-1)*100)+'% · 持续 '+effect.weeks+' 周');}
    const eventGrant=payPublisherMilestones(s);if(eventGrant)details.push('发行开发款 +¥'+eventGrant);
    if(!details.length)details.push('没有发生任何数值变化。');
    s.eventResult={id:e.id,kind:e.kind||'standard',week:s.week-1,title:e.title,label:c.label,text:c.resultText||(e.kind==='ambient'?'大家聊了几句，这段小插曲就这样过去了。':e.kind==='publisher'?'发行团队已落实这项建议。':'本周的决定已经记录。'),details,unread:!!e.kind&& (s.hard||details[0]!=='没有发生任何数值变化。')};
    addLog(s,e.title+'：'+c.label+'。'+details.join('；'),c.cash<0?'info':'good');
    s.pendingEvent=null;s.pendingCapGroup=null;s.pendingChoices=null;if(e.kind==='publisher')checkMilestones(s);return true;
  }
  function drawEvent(s){
    const pool=eligibleEvents(s),weights=s.publisher?{standard:48,ambient:14,hidden:14,publisher:24}:{standard:52,ambient:24,hidden:24};
    const kinds=Object.keys(weights).filter(kind=>pool.some(e=>(e.kind||'standard')===kind));
    let roll=random(s)*kinds.reduce((n,k)=>n+weights[k],0),kind=kinds.at(-1);
    for(const k of kinds){roll-=weights[k];if(roll<0){kind=k;break;}}
    const candidates=pool.filter(e=>(e.kind||'standard')===kind);roll=random(s)*candidates.reduce((n,e)=>n+e.weight,0);let chosen=candidates.at(-1);
    for(const e of candidates){roll-=e.weight;if(roll<0){chosen=e;break;}}
    s.pendingEvent=chosen.id;s.pendingChoices={id:chosen.id,choices:copy(chosen.choices)};s.pendingCapGroup=null;
    // Preserve the original bonus cap opportunity only for the original events.
    if(!chosen.kind){const groups=GROUPS.filter(g=>g.id!=='release'&&capRoom(s,g.id));if(groups.length){const g=groups[Math.floor(random(s)*groups.length)];s.pendingCapGroup=g.id;s.pendingChoices.choices.push({label:'复盘并拓展'+g.name,hint:g.name+'各项完成度软上限 +15%，最高 100%；仍需安排工作',caps:{[g.id]:CAP_STEP}});}}
    s.lastEvent=chosen.id;s.lastScene=chosen.scene||null;return chosen;
  }
  function advance(s){if(blocked(s))return {ok:false,reason:'请先完成当前选择'};const c=cost(s);if(s.money<c.total)return {ok:false,reason:'资金不足以支付本周工资、维护和投放；可降低买量预算、签约发行商或发售。'};const contributions=s.team.map(m=>({id:m.id,name:m.name,job:m.job,output:memberOutput(s,m.id)}));s.assignmentUndo=null;s.money-=c.total;s.spent+=c.total;const {production,gains,ranges,impacts}=workWeek(s),publisherGrant=payPublisherMilestones(s);s.effects=s.effects.map(e=>({...e,weeks:e.weeks-1})).filter(e=>e.weeks>0);s.history.push({week:s.week,cost:c.total,ads:c.ads,publisherAds:c.publisherAds,publisherGrant,production,gains,ranges,impacts,team:contributions,money:s.money,ratings:quality(s)});addLog(s,'完成第 '+s.week+' 周：支出 ¥'+c.total+(c.ads?'（含买量 ¥'+c.ads+'）':'')+(c.publisherAds?'，发行商另垫付买量 ¥'+c.publisherAds:'')+(s.publisher?'，发行团队自动推进宣发与上架':'')+'。'+contributions.filter(m=>m.output>0).map(m=>m.name+'负责'+task(m.job).name).join('、')+'。');
    for(const impact of impacts)addLog(s,task(impact.from).name+'的调整牵连了'+task(impact.to).name+'，后者完成度 −'+impact.points+'%。');
    for(const j of JOBS)if(gains[j.id]<0)addLog(s,task(j.id).name+'本周净变化：'+round(gains[j.id]/s.req[j.id]*100)+'%。');
    checkMilestones(s);const e=drawEvent(s);s.week++;s.managed=false;return {ok:true,event:e.id};}

  function preview(s,ignoreModeEffects=false){if(blocked(s))return null;const p=copy(s),c=cost(p),{production,gains,ranges}=workWeek(p,true,ignoreModeEffects);return {production,gains,ranges,cost:c,work:p.work,debt:p.debt,bottlenecks:p.lastBottlenecks,money:s.money-c.total};}
  // UI estimates use full efficiency; actual settlement retains real-mode slowdown, rework and spillover.
  function progressEstimate(s){return preview(s,true);}
  function assignmentEstimate(s,memberId,job){
    const projected=copy(s);
    if(!assignMember(projected,memberId,job))return null;
    const plan=progressEstimate(projected);
    if(!plan||job==='idle')return null;
    return {gain:plan.gains[job],percent:round(plan.gains[job]/projected.req[job]*100),production:plan.production[job],teamSize:projected.people[job]};
  }
  function assignmentPriorities(s){
    const runway=s.money/Math.max(1,cost(s).total-cost(s).ads),core=coreProgress(s),urgent=runway<8&&!complete(s),feedback=!s.publisher&&core>=.25&&revealLevel(s)<3;
    const weights={theme:2.2,gameplay:3,subtheme:2.2,development:2.4,systems:1.7,qa:1.7,ads:1,payment:1.2,ip:1,publicity:feedback?3:.65,acquisition:.5,materials:urgent?6:core>=.3?2.8:.8,review:urgent?7:core>=.3?3.2:1};
    if(s.objective==='acclaim')for(const id of ['theme','gameplay','subtheme','development','systems','qa'])weights[id]*=1.25;
    if(s.objective==='profit'&&core>=.45)for(const id of ['ads','payment','ip'])weights[id]*=1.6;
    return {weights,reason:urgent?'资金偏紧，优先补齐上架':feedback?'先获得玩家反馈，再决定打磨':core<.3?'先搭建可玩原型':s.objective==='acclaim'?'围绕口碑目标打磨核心':'平衡发售准备与商业回报'};
  }
  function assignmentUtility(s,plan){const {weights}=assignmentPriorities(s);return JOBS.reduce((n,j)=>n+plan.gains[j.id]/s.req[j.id]*weights[j.id],0);}
  // Exact subset DP: each job's gain depends only on the members assigned to it.
  // Full-efficiency estimates make job gains additive; publisher work is constant.
  function automaticAssignmentPlan(s){
    if(!s||blocked(s))return {ok:false,improved:false,reason:'请先恢复项目并处理当前事件。'};
    if(s.assignmentLocks.length===s.team.length)return {...assignmentPlanResult(s,Object.fromEntries(s.team.map(m=>[m.id,m.job])),true,s.team.length<=10),allLocked:true};
    if(s.team.length>10)return largeAssignmentPlan(s);
    const n=s.team.length,size=1<<n,epsilon=1e-10;
    const weekly=cost(s),baseCost=weekly.total-weekly.ads;
    const canBuy=!!s.publisher||baseCost+s.adBudget<=s.money;
    const locked=new Set(s.assignmentLocks),m=mods(s),priority=assignmentPriorities(s),jobs=JOBS.filter(j=>!publisherManaged(s,j.id)&&(j.id!=='acquisition'||canBuy||s.team.some(p=>locked.has(p.id)&&p.job===j.id)));
    const tables=jobs.map(j=>{
      let allowed=0,current=0,required=0;const values=new Float64Array(size),changes=new Uint8Array(size);
      s.team.forEach((p,i)=>{if(taskSkill(p,j.id)>0&&(!locked.has(p.id)||p.job===j.id))allowed|=1<<i;if(p.job===j.id){current|=1<<i;if(locked.has(p.id))required|=1<<i;}});
      const room=Math.max(0,workLimit(s,j.id)-s.work[j.id]);
      for(let bits=0;bits<size;bits++){
        if(bits&~allowed)continue;
        const members=s.team.filter((p,i)=>bits&(1<<i));
        const amount=round(jobContributions(s,j.id,members,m).reduce((sum,p)=>sum+p.output,0));
        const after=round(clamp(s.work[j.id]+Math.min(room,amount),0,s.req[j.id]));
        values[bits]=round(after-s.work[j.id])/s.req[j.id]*priority.weights[j.id];
        for(let i=0;i<n;i++)if(bits&(1<<i)&&!(current&(1<<i)))changes[bits]++;
      }
      return {job:j.id,allowed,required,values,changes};
    });
    let scores=new Float64Array(size).fill(-Infinity),counts=new Uint8Array(size).fill(255);scores[0]=0;counts[0]=0;
    const parents=[];
    for(const table of tables){
      const next=new Float64Array(size).fill(-Infinity),nextCounts=new Uint8Array(size).fill(255),chosen=new Int16Array(size).fill(-1);
      for(let used=0;used<size;used++){
        if(scores[used]===-Infinity)continue;
        const remaining=table.allowed&~used;
        for(let bits=remaining;;bits=(bits-1)&remaining){
          if((bits&table.required)!==table.required){if(!bits)break;continue;}
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
    return assignmentPlanResult(s,assignments,canBuy,true);
  }
  function assignmentPlanResult(s,assignments,canBuy,exact){
    const proposed=copy(s);for(const member of proposed.team)member.job=assignments[member.id];syncPeople(proposed);
    const before=progressEstimate(s),after=progressEstimate(proposed),total=plan=>JOBS.reduce((sum,j)=>sum+plan.gains[j.id]/s.req[j.id],0)/JOBS.length*100;
    const beforeProgress=total(before),afterProgress=total(after),beforeUtility=assignmentUtility(s,before),afterUtility=assignmentUtility(s,after),improved=afterUtility>beforeUtility+1e-10||before.cost.total>s.money&&after.cost.total<=s.money;
    const jobs=JOBS.filter(j=>Math.abs(after.gains[j.id]-before.gains[j.id])>.001).map(j=>({id:j.id,name:j.name,before:round(before.gains[j.id]/s.req[j.id]*100),after:round(after.gains[j.id]/s.req[j.id]*100)}));
    const changes=improved?s.team.filter(p=>assignments[p.id]!==p.job).map(p=>{
      const to=assignments[p.id],notes=[];
      if(p.job!=='idle'){
        const room=Math.max(0,workLimit(s,p.job)-s.work[p.job]);
        if(room<.01)notes.push(workDependency(s,p.job)?.cap<softCap(s,p.job)?'避开上游等待':'原岗位已到完成度上限');
        else if(before.production[p.job]>room+.01)notes.push('减少上限折损');
        else if(s.people[p.job]>proposed.people[p.job])notes.push('减少同岗协作折损');
      }
      if(to===p.lastJob&&to!=='idle')notes.push('回到熟悉岗位，减少转岗磨合');
      if(!notes.length)notes.push(assignmentPriorities(s).reason);
      return {id:p.id,name:p.name,from:p.job,to,reason:notes.join('；')};
    }):[];
    return {ok:true,improved,exact,lockedCount:s.assignmentLocks.length,beforeUtility,afterUtility:improved?afterUtility:beforeUtility,reason:assignmentPriorities(s).reason,beforeProgress,afterProgress:improved?afterProgress:beforeProgress,beforeCost:before.cost.total,afterCost:improved?after.cost.total:before.cost.total,budgetLimited:!canBuy,assignments:improved?assignments:Object.fromEntries(s.team.map(p=>[p.id,p.job])),jobChanges:improved?jobs:[],changes};
  }
  // Large rosters use deterministic marginal placement, then best moves and swaps.
  // This avoids exponential subset tables and reports that it is a search, not a proof.
  function largeAssignmentPlan(s){
    const n=s.team.length,m=mods(s),priority=assignmentPriorities(s),weekly=cost(s),base=weekly.total-weekly.ads,canBuy=!!s.publisher||base+s.adBudget<=s.money;
    const locked=new Set(s.assignmentLocks),fixed=new Set(s.team.map((p,i)=>locked.has(p.id)?i:-1).filter(i=>i>=0));
    const jobs=JOBS.filter(j=>!publisherManaged(s,j.id)&&(j.id!=='acquisition'||canBuy&&s.adBudget>0||s.team.some(p=>locked.has(p.id)&&p.job===j.id))),ids=jobs.map(j=>j.id),room=jobs.map(j=>Math.max(0,workLimit(s,j.id)-s.work[j.id]));
    const weights=jobs.map(j=>s.team.map(p=>taskSkill(p,j.id)/100*(j.id!==p.lastJob?1-.2*m.ramp:1)));
    const outputs=jobs.map((j,k)=>weights[k].map(w=>{const raw=w*STANDARD_WEEKLY_WORK*(1+reputationProfile(s).speedBonus)*m.all*m[j.skill]*(s.pace==='crunch'?1.35:s.pace==='rest'?.7:1)*(.65+s.morale/285)*(j.skill==='code'?Math.max(.6,1-s.debt*.01):1);return {solo:round(raw),coop:round(raw*m.crowd)};}));
    function value(job,members){if(job<0||!members.length||room[job]<=0)return 0;let lead=members[0],amount=0;for(const i of members){amount+=outputs[job][i].coop;if(weights[job][i]>weights[job][lead]||weights[job][i]===weights[job][lead]&&s.team[i].id.localeCompare(s.team[lead].id)<0)lead=i;}amount=round(amount+outputs[job][lead].solo-outputs[job][lead].coop);const id=ids[job],after=round(clamp(s.work[id]+Math.min(room[job],amount),0,s.req[id]));return round(after-s.work[id])/s.req[id]*priority.weights[id];}
    function improve(initial){
      const a=initial.slice(),groups=jobs.map((_,j)=>a.map((v,i)=>v===j?i:-1).filter(i=>i>=0));let values=groups.map((g,j)=>value(j,g));
      for(let pass=0;pass<200;pass++){
        let best=1e-10,move=null;
        for(let i=0;i<n;i++){if(fixed.has(i))continue;const from=a[i],without=from<0?[]:groups[from].filter(v=>v!==i),loss=from<0?0:value(from,without)-values[from];
          for(let to=-1;to<jobs.length;to++){if(to===from||to>=0&&weights[to][i]<=0)continue;const delta=loss+(to<0?0:value(to,[...groups[to],i])-values[to]);if(delta>best){best=delta;move={i,to};}}
          for(let k=i+1;k<n;k++){const to=a[k];if(fixed.has(k)||to===from||to>=0&&weights[to][i]<=0||from>=0&&weights[from][k]<=0)continue;const delta=(from<0?0:value(from,[...without,k])-values[from])+(to<0?0:value(to,[...groups[to].filter(v=>v!==k),i])-values[to]);if(delta>best){best=delta;move={i,to,k,from};}}
        }
        if(!move)break;const {i,to,k,from}=move,old=a[i];if(old>=0)groups[old]=groups[old].filter(v=>v!==i);if(k!==undefined){if(to>=0)groups[to]=groups[to].filter(v=>v!==k);a[k]=from;if(from>=0)groups[from].push(k);}a[i]=to;if(to>=0)groups[to].push(i);values=groups.map((g,j)=>value(j,g));
      }
      return {a,score:values.reduce((v,x)=>v+x,0),changes:a.filter((j,i)=>(ids[j]||'idle')!==s.team[i].job).length};
    }
    const current=s.team.map(p=>ids.indexOf(p.job)),starts=[current],order=s.team.map((_,i)=>i).sort((a,b)=>Math.max(...weights.map(w=>w[b]))-Math.max(...weights.map(w=>w[a]))||s.team[a].id.localeCompare(s.team[b].id));
    for(const sequence of [order,order.slice().reverse()]){const a=s.team.map((_,i)=>fixed.has(i)?current[i]:-1),groups=jobs.map((_,j)=>a.map((v,i)=>v===j?i:-1).filter(i=>i>=0)),values=groups.map((g,j)=>value(j,g));for(const i of sequence){if(fixed.has(i))continue;let best=0,to=-1;for(let j=0;j<jobs.length;j++)if(weights[j][i]>0){const delta=value(j,[...groups[j],i])-values[j];if(delta>best+1e-10){best=delta;to=j;}}if(to>=0){a[i]=to;groups[to].push(i);values[to]=value(to,groups[to]);}}starts.push(a);}
    const choices=starts.map(improve).sort((a,b)=>Math.abs(b.score-a.score)>1e-10?b.score-a.score:a.changes-b.changes),best=choices[0];
    return assignmentPlanResult(s,Object.fromEntries(s.team.map((p,i)=>[p.id,ids[best.a[i]]||'idle'])),canBuy,false);
  }
  function autoAssign(s){
    const plan=automaticAssignmentPlan(s);if(!plan.ok||!plan.improved)return plan;
    const before=Object.fromEntries(s.team.map(m=>[m.id,m.job]));
    for(const member of s.team)member.job=plan.assignments[member.id];syncPeople(s);
    s.assignmentUndo={before,review:plan,fingerprint:assignmentFingerprint(s)};return plan;
  }

  function softCapWarnings(s){
    if(!s||s.over||s.paused)return [];
    return JOBS.filter(j=>j.group!=='release'&&s.people[j.id]>0&&progress(s,j.id)>=softCap(s,j.id)-1e-9).map(j=>({
      job:j.id,name:j.name,completion:round(progress(s,j.id)*100),cap:round(softCap(s,j.id)*100),
      members:s.team.filter(m=>m.job===j.id).map(m=>({id:m.id,name:m.name})),
      full:softCap(s,j.id)>=HARD_CAP,
      ongoing:j.id==='systems'?'仍可偿还技术债':j.id==='acquisition'&&s.adBudget>0?'仍会按本周预算继续买量并扣费':'',
      rework:workPhase(s,j.id).id==='uncertain'
    }));
  }

  function objectiveStatus(s,result){if(result)return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,value:s.objective==='acclaim'?result.rating:result.profit,ok:result.objectiveOK,ready:true,known:true};const f=forecast(s),low=s.objective==='acclaim'?f.rating.low:f.low+s.income-s.spent,high=s.objective==='acclaim'?f.rating.high:f.high+s.income-s.spent,target=s.objective==='acclaim'?60:1200;return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective).name,low,high,known:f.exact,ready:complete(s),ok:complete(s)&&low>=target,possible:high>=target};}
  function finish(s,released){
    if(!s||s.over||s.paused||released&&!canRelease(s))return false;
    const trueValue=overallScore(s),rating=grade(trueValue),scaleRevenueMultiplier=projectScale(s).revenueMultiplier;
    const organicBaseRevenue=released?organic(s,trueValue,trueScore(s,'commerce')):0,marketFactor=released?marketMultiplier(random(s),trueValue):null;
    const organicGrossRevenue=released?Math.round(organicBaseRevenue*marketFactor):0,organicRevenue=s.publisher?Math.floor(organicGrossRevenue*publisherShare(s)):organicGrossRevenue,publisherOrganicRevenue=organicGrossRevenue-organicRevenue;
    const ad=adSettlement(s,adRate(s),released),adRevenue=ad.studioRevenue,revenue=organicRevenue+adRevenue;
    const recoveryRate=!released&&s.spent>0?(10+Math.floor(random(s)*41))/100:null,recovery=recoveryRate===null?0:Math.round(s.spent*recoveryRate);
    const advanceDue=!released?(s.publisher?.advance||0):0,advanceRepaid=Math.min(s.money+revenue+recovery,advanceDue),advanceWrittenOff=advanceDue-advanceRepaid;
    const grossProductSales=released?organicGrossRevenue+ad.gross:0,earnedReputation=released?reputationGain(s,grossProductSales):0,reputationBefore=s.reputation,reputationAfter=repRound(reputationBefore+earnedReputation),unlockedMilestones=REPUTATION_NODES.filter(n=>n.threshold>reputationBefore&&n.threshold<=reputationAfter).map(copy);
    const profit=revenue+recovery+s.income-s.spent-advanceRepaid,objectiveOK=!!released&&(s.objective==='acclaim'?gradeIndex(trueValue)>=9:profit>=1200);
    const experience=released?experienceBreakdown(s,profit,objectiveOK):null,exp=released?experience.total:Math.min(30,s.milestones.length*8);
    s.money+=revenue+recovery-advanceRepaid;s.over=true;s.pendingEvent=null;s.pendingCapGroup=null;s.pendingChoices=null;if(s.eventResult)s.eventResult.unread=false;
    s.result={grossProductSales,earnedReputation,reputationBefore,reputationAfter,unlockedMilestones,advanceDue,advanceRepaid,advanceWrittenOff,runId:s.id,stage:s.stage,walletStart:s.initialMoney,walletEnd:s.money,sharedCashDelta:s.sharedCashDelta,name:s.name,workProfile:s.workProfile,hard:s.hard,totalCompletion:round(JOBS.reduce((n,j)=>n+progress(s,j.id),0)/JOBS.length*100),progress:Object.fromEntries(GROUPS.map(g=>[g.id,round(groupProgress(s,g.id)*100)])),scale:s.scale,released,weeks:s.week-1,score:Math.round(trueValue),rating:released?rating:'—',ratings:released?Object.fromEntries(GROUPS.filter(g=>g.id!=='release').map(g=>[g.id,{grade:grade(trueScore(s,g.id)),score:trueScore(s,g.id)}])):null,organicRevenue,organicGrossRevenue,publisherOrganicRevenue,organicBaseRevenue,marketMultiplier:marketFactor,marketFloor:released?marketFloor(trueValue):null,scaleRevenueMultiplier,adRevenue,adGrossRevenue:ad.gross,adNetRevenue:ad.studioNet,adCampaignNetRevenue:ad.campaignNet,adSpend:s.adSpend,studioAdSpend:ad.studioSpend,publisherAdSpend:ad.publisherSpend,publisherAdRevenue:ad.publisherRevenue,publisherAdRecovered:ad.publisherRecovered,publisherAdProfit:ad.publisherProfit,publisherAdLoss:ad.publisherLoss,adRate:released?adRate(s):null,publisher:copy(s.publisher),otherIncome:s.income,revenue,recovery,recoveryRate,cost:s.spent,profit,exp,experience,teamReview:s.team.map(m=>{const weeks=s.history.map(h=>h.team.find(p=>p.id===m.id)).filter(p=>p?.output>0);return {id:m.id,name:m.name,weeks:weeks.length,output:round(weeks.reduce((n,p)=>n+p.output,0)),quote:m.quote};}),objective:s.objective,objectiveOK,team:copy(s.team),seed:s.seed};
    addLog(s,released?'「'+s.name+'」正式发售，真实评级与发行账目已揭晓。':'项目已结束，回收工作室投入 '+recovery.toLocaleString('zh-CN')+' 元，退还发行预付款 '+advanceRepaid+' 元，保留里程碑经验。',released?'good':'info');return s.result;
  }
  function emptyMeta(){return {version:4,reputation:0,wallet:INITIAL_FUNDS,hero:{name:HERO.name,skills:copy(HERO.skills)},partners:[],knownPartners:RECRUITS.filter(r=>r.stage==='opening').map(r=>r.id),exp:0,earnedExp:0,stage:1,activeRunId:null,pausedProjects:[],receipts:{},history:[]};}
  function validateMeta(m){try{return !!m&&m.version===4&&Number.isFinite(m.reputation)&&m.reputation>=0&&Number.isFinite(m.wallet)&&m.wallet>=0&&Number.isInteger(m.exp)&&m.exp>=0&&Number.isInteger(m.earnedExp)&&m.earnedExp>=m.exp&&Number.isInteger(m.stage)&&m.stage>=1&&m.hero&&typeof m.hero.name==='string'&&m.hero.name.trim().length>0&&m.hero.name.length<=12&&SKILLS.every(j=>Number.isInteger(m.hero.skills[j.id])&&m.hero.skills[j.id]>=100&&m.hero.skills[j.id]<=200)&&[m.partners,m.knownPartners].every(a=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(id=>RECRUITS.some(r=>r.id===id&&recruitReputation(r)<=m.reputation)))&&m.partners.every(id=>m.knownPartners.includes(id))&&m.receipts&&typeof m.receipts==='object'&&!Array.isArray(m.receipts)&&Array.isArray(m.history)&&Array.isArray(m.pausedProjects)&&m.pausedProjects.every(p=>validateRun(p)&&p.paused&&!p.over&&p.id!==m.activeRunId&&p.stage<m.stage)&&new Set(m.pausedProjects.map(p=>p.id)).size===m.pausedProjects.length&&(m.activeRunId===null||typeof m.activeRunId==='string');}catch{return false;}}
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
  function hirePartner(meta,id){if(meta.activeRunId||meta.wallet<180||!meta.knownPartners.includes(id)||meta.partners.includes(id)||!reputationPartners(meta).includes(id))return false;meta.partners.push(id);meta.wallet-=180;return true;}
  function dismissPartner(meta,id){if(meta.activeRunId||meta.wallet<100||!meta.partners.includes(id))return false;meta.partners=meta.partners.filter(member=>member!==id);meta.wallet-=100;return true;}
  function settle(meta,s){const m=copy(meta);if(!s.over||!s.result||Object.prototype.hasOwnProperty.call(m.receipts,s.id)||m.activeRunId!==s.id)return m;const r=copy(s.result),hero=s.team.find(m=>m.id==='hero');m.receipts[s.id]=r.exp;m.exp+=r.exp;m.earnedExp+=r.exp;m.wallet=r.walletEnd;m.reputation=repRound(m.reputation+r.earnedReputation);m.hero={name:hero.name,skills:copy(hero.skills)};m.partners=s.team.filter(m=>m.kind==='partner').map(m=>m.id);m.knownPartners=[...new Set([...s.knownPartners,...reputationPartners(m)])];m.stage=Math.max(m.stage,s.stage+1);m.activeRunId=null;m.history.unshift(r);return m;}
  function pauseProject(meta,s){if(!validateMeta(meta)||!validateRun(s)||s.over||s.paused||meta.activeRunId!==s.id)return false;syncCareer(meta,s);s.paused=true;meta.pausedProjects.push(copy(s));meta.activeRunId=null;return true;}
  function resumeProject(meta,id,current=null){if(!validateMeta(meta))return null;const target=meta.pausedProjects.find(p=>p.id===id);if(!target)return null;if(meta.activeRunId&&(!current||current.id!==meta.activeRunId||!pauseProject(meta,current)))return null;meta.pausedProjects=meta.pausedProjects.filter(p=>p.id!==id);target.sharedCashDelta=round(target.sharedCashDelta+meta.wallet-target.money);target.money=meta.wallet;target.reputation=meta.reputation;target.paused=false;const previous=target.team;target.team=createTeam(meta.hero,meta.partners).map(m=>{const old=previous.find(p=>p.id===m.id);if(old){m.job=(old.job==='idle'||taskSkill(m,old.job)>0)&&!publisherManaged(target,old.job)?old.job:'idle';m.lastJob=old.lastJob;}else{m.lastJob='idle';if(publisherManaged(target,m.job))m.job='idle';}return m;});target.departed=target.departed.filter(id=>!meta.partners.includes(id));target.knownPartners=meta.knownPartners.slice();target.assignmentLocks=target.assignmentLocks.filter(id=>target.team.some(m=>m.id===id));target.assignmentUndo=null;syncPeople(target);meta.activeRunId=target.id;return target;}
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
    if(meta.activeRunId){current.money=meta.wallet;current.sharedCashDelta=round(current.sharedCashDelta+result.recovery-result.advanceRepaid);}
    return result;
  }
  function validateSnapshot(snapshot){try{if(!snapshot||!validateMeta(snapshot.meta))return false;const {meta,run}=snapshot;if(meta.activeRunId)return validateRun(run)&&!run.over&&!run.paused&&run.id===meta.activeRunId&&run.money===meta.wallet&&run.reputation===meta.reputation&&run.stage<meta.stage;return !run||validateRun(run)&&run.over&&!run.paused;}catch{return false;}}
  function memberAdvice(s,m){
    if(m.job==='idle')return m.id==='ace'?'把最棘手的一块交给我，别让我只看着。':m.name+'：我还在待命，可以接一项工作。';
    const j=task(m.job),lead=m.id==='ace'?'这部分我能接住。':m.id==='hero'?'我来盯住这一块。':m.name+'：';
    if(progress(s,m.job)>=softCap(s,m.job)-1e-9&&j.group!=='release')return lead+' '+j.name+'已到上限，先换一岗或等新思路。';
    if(workLimit(s,m.job)<=s.work[m.job]+.01)return lead+' '+j.name+'在等上游，先补前置工作。';
    const lines={design:'先把规则和玩家体验讲清楚。',code:'把接口理顺，下游才接得上。',art:'让画面和内容有自己的气质。',test:'把验证步骤写清楚，验收更稳。',ops:j.group==='release'?'资料和审核按顺序收尾。':'先理解作品，再找到它的玩家。'};
    return lead+' '+lines[j.skill];
  }
  // Only public scene text selects dialogue: paired daily/hidden scenes sound identical.
  function teamVoice(s,e){
    const m=s.team[(Array.from(e?.title||'').reduce((n,c)=>n+c.charCodeAt(0),s.week))%s.team.length],scene=(e?.title||'')+' '+(e?.text||''),style=m.id==='ace'?0:m.id==='hero'?1:2;
    const scenes=[
      [/茶|咖啡|水壶|饮料/,['茶给你，难写的代码给我。','先把杯子放稳，今天的事一件件来。','我把杯子拿过来了，大家想喝什么？']],
      [/猫|窗台/,['它的角没有我好看，不过这个位置倒是挑得不错。','它在窗外看我们，我们也看它一会儿。','小声一点，别把这位窗台访客吓跑了。']],
      [/打印|纸|样册|笔记|便签|文具/,['纸上的字我看得清，写字的人得你来认。','先看看写了什么，再听听大家的想法。','这张纸先放中间，我们一起看看。']],
      [/键盘|桌面|鼠标|屏幕/,['键盘响得再威风，也得看敲出来的是什么。','先看看哪里和平时不同。','我这边也听见了，刚才是谁先发现的？']],
      [/耳机|曲|音乐/,['这段前奏不错，别让我等到下一作才听到名字。','刚才那几秒我也听到了。','是谁的播放列表？我想记一下曲名。']],
      [/花盆|植物|石头/,['这块石头不需要写代码，倒是挺会占位置。','先看看它摆在哪里比较合适。','花盆边的位置不大，大家一起想想怎么摆。']],
      [/月历|日历|时间|钟/,['钟可以慢两分钟，别把我的茶也放凉两分钟。','我看看日历，大家也回忆一下。','我来核对一下时间，先听听大家怎么说。']],
      [/箱|快递|包裹/,['这个声音我听见了，拆的时候给我留个位置。','先看看标签，等大家过来一起决定。','纸箱放这里吧，我给桌面腾点地方。']],
      [/通知|聊天|邀请|消息|窗口/,['先看看对方说了什么，我还没准备替三个点写完后半句。','消息先读完，我们再决定怎么回应。','我也在等这条消息，先别急着猜。']],
      [/贴纸|杯子/,['歪一点也有歪一点的气势，你觉得呢？','这个图案我记住了，看看大家怎么摆。','是有人刚贴上的吗？这个角度挺特别。']],
      [/路|散步|楼下/,['新路我也想看看，回来还认得工作室就行。','走哪边都可以，听听大家的想法。','我走在旁边，大家慢慢聊。']],
      [/测试|验收|复现/,['把看到的情况摊开说，我来听。','先把实际体验记录清楚。','这份记录我也想看，我们一起核对。']],
      [/资料|审核|商店页|授权/,['目录拿来一起看，别让一张纸把我们绕晕。','我们先核对看到的资料。','我把清单放在这里，大家一起看。']],
      [/玩家|试玩|榜单|反馈/,['玩家的话先听完。好不好玩，我也想知道他们怎么说。','先把反馈摆出来，别急着下结论。','这段反馈我记下了，也想听听大家的理解。']],
      [/付费|商业|授权|收益|预算/,['账本可以一起看，先别急着替结果鼓掌。','把条件读清楚，我们再做选择。','这部分我想和大家一起算算。']]
    ];
    const match=scenes.find(([pattern])=>pattern.test(scene));
    const skill=SKILLS.reduce((a,j)=>m.skills[j.id]>m.skills[a]?j.id:a,'design'),fallback={design:'我想听听大家怎么看这个小插曲。',code:'先看看实际发生了什么，别忙着找解释。',art:'这个细节挺特别，我也想凑近看看。',test:'我先把看到的记下来，大家慢慢说。',ops:'我在听，先把大家的想法放在一起。'};
    return {id:m.id,name:m.name,text:match?match[1][style]:style===0?'我也在这里，先听听这个故事。':style===1?'先看看眼前发生的事，我们一起决定。':fallback[skill]};
  }
  function eventResponse(s,r){const v=teamVoice(s,{title:r.title,text:''}),none=r.details.every(x=>x==='没有发生任何数值变化。');return {...v,text:none?(v.id==='ace'?'没发生什么也很好，刚才那一会儿我记住了。':'这段小插曲先记在这里，我们继续。'):(v.id==='ace'?'结果看到了。你来决定接下来做什么，我陪你。':'结果记下了，接下来按新的情况安排吧。')};}
  function validAssignmentState(s){
    if(!Array.isArray(s.assignmentLocks)||new Set(s.assignmentLocks).size!==s.assignmentLocks.length||s.assignmentLocks.some(id=>!s.team.some(m=>m.id===id)))return false;
    const u=s.assignmentUndo;if(u===null)return true;
    const jobs=['idle',...JOBS.map(j=>j.id)],p=u?.review;
    return !!u&&typeof u.fingerprint==='string'&&u.before&&typeof u.before==='object'&&!Array.isArray(u.before)&&Object.keys(u.before).every(id=>s.team.some(m=>m.id===id))&&s.team.every(m=>Object.hasOwn(u.before,m.id)&&jobs.includes(u.before[m.id]))&&!!p&&typeof p.reason==='string'&&Number.isInteger(p.lockedCount)&&p.lockedCount>=0&&p.lockedCount<=s.team.length&&['beforeProgress','afterProgress','beforeCost','afterCost'].every(k=>Number.isFinite(p[k])&&p[k]>=0)&&Array.isArray(p.changes)&&p.changes.every(c=>c&&s.team.some(m=>m.id===c.id)&&['name','reason'].every(k=>typeof c[k]==='string')&&jobs.includes(c.from)&&jobs.includes(c.to))&&Array.isArray(p.jobChanges)&&p.jobChanges.every(j=>j&&JOBS.some(x=>x.id===j.id)&&typeof j.name==='string'&&Number.isFinite(j.before)&&Number.isFinite(j.after));
  }
  function validEventState(s){
    const p=s.pendingChoices,r=s.eventResult;
    if(p&&(!s.pendingEvent||p.id!==s.pendingEvent||!Array.isArray(p.choices)||!p.choices.length||p.choices.some(c=>!c||typeof c.label!=='string')))return false;
    if(r&&(!EVENTS.some(e=>e.id===r.id)||!['standard','ambient','hidden','publisher'].includes(r.kind)||typeof r.unread!=='boolean'||!Number.isInteger(r.week)||r.week<0||!['title','label','text'].every(k=>typeof r[k]==='string')||!Array.isArray(r.details)||!r.details.length||r.details.some(d=>typeof d!=='string')||r.unread&&(s.pendingEvent||s.over)))return false;
    return true;
  }
  function validateRun(s){try{if(!s||s.version!==VERSION||typeof s.paused!=='boolean'||!Number.isInteger(s.stage)||s.stage<1||!SCALES.some(g=>g.id===s.scale)||!WORK_PROFILES.some(p=>p.id===s.workProfile)||!Number.isInteger(s.week)||s.week<1||!Array.isArray(s.team)||s.team.length<2||!Number.isFinite(s.reputation)||s.reputation<0)return false;for(const a of ['departed','history','logs','effects','milestones','knownPartners'])if(!Array.isArray(s[a]))return false;if(new Set(s.knownPartners).size!==s.knownPartners.length||s.knownPartners.some(id=>!RECRUITS.some(r=>r.id===id&&recruitReputation(r)<=s.reputation))||s.team.some(m=>m.kind==='partner'&&!s.knownPartners.includes(m.id)))return false;if(!s.work||!s.req||!s.softCaps||typeof s.hard!=='boolean'||s.pendingCapGroup&&!GROUPS.some(g=>g.id===s.pendingCapGroup&&g.id!=='release')||!s.people||!['normal','rest','crunch'].includes(s.pace)||!['profit','acclaim'].includes(s.objective)||!adBudgetOptions(s).includes(s.adBudget))return false;const ids=s.team.map(m=>m.id);if(new Set(ids).size!==ids.length||!s.team.some(m=>m.id==='hero'&&m.kind==='hero')||!s.team.some(m=>m.id==='ace'&&m.kind==='companion'))return false;if(!s.team.every(m=>typeof m.name==='string'&&m.name.length>0&&Number.isFinite(m.salary)&&m.salary>=0&&['idle',...JOBS.map(j=>j.id)].includes(m.lastJob)&&SKILLS.every(j=>Number.isFinite(m.skills[j.id])&&m.skills[j.id]>=0&&m.skills[j.id]<=200)&&(m.job==='idle'||taskSkill(m,m.job)>0&&!publisherManaged(s,m.job))))return false;
    return validAssignmentState(s)&&validEventState(s)&&JOBS.every(j=>(j.group==='release'||Number.isFinite(s.softCaps[j.id])&&s.softCaps[j.id]>=INITIAL_SOFT_CAP&&s.softCaps[j.id]<=HARD_CAP&&s.work[j.id]<=s.req[j.id]*s.softCaps[j.id]+.01)&&Number.isFinite(s.work[j.id])&&s.work[j.id]>=0&&Number.isFinite(s.req[j.id])&&s.req[j.id]>0&&s.work[j.id]<=s.req[j.id]+.01&&s.people[j.id]===s.team.filter(m=>m.job===j.id).length)&&s.reserve===s.team.filter(m=>m.job==='idle').length&&GROUPS.filter(g=>g.id!=='release').every(g=>Number.isFinite(s.ratingRolls[g.id])&&Math.abs(s.ratingRolls[g.id])<=28&&Number.isFinite(s.revealRolls[g.id])&&Math.abs(s.revealRolls[g.id])<=1)&&[s.money,s.spent,s.income,s.adSpend,s.debt,s.morale,s.rng,s.seed,s.initialMoney,s.sharedCashDelta].every(Number.isFinite)&&s.money>=0&&s.spent>=0&&s.adSpend>=0&&s.adSpend<=(s.spent+(s.publisher?.adSpend||0))&&(s.publisher===null||s.publisher&&Number.isFinite(s.publisher.advance)&&s.publisher.advance>0&&Number.isInteger(s.publisher.signWeek)&&s.publisher.signWeek>=1&&s.publisher.signWeek<=s.week&&Number.isFinite(s.publisher.adSpend)&&s.publisher.adSpend>=0&&s.publisher.adSpend<=s.adSpend&&s.publisher.quote&&s.publisher.quote.advance>=s.publisher.advance&&Array.isArray(s.publisher.paidStages)&&new Set(s.publisher.paidStages).size===s.publisher.paidStages.length&&s.publisher.paidStages.includes('signing')&&s.publisher.paidStages.every(id=>PUBLISHER_STAGES.some(p=>p.id===id))&&publisherFunding(s).stages.filter(p=>p.paid).reduce((n,p)=>n+p.amount,0)===s.publisher.advance&&[.6,.7,.8,.9,1].includes(s.publisher.quote.advanceRatio)&&[.5,.55,.6,.65,.7,.75].includes(s.publisher.quote.studioShare)&&[20,22,24,26,28,30,32,34,36].includes(s.publisher.quote.weeklyWork))&&(!s.pendingEvent||EVENTS.some(e=>e.id===s.pendingEvent))&&(!s.over||!!s.result);
    }catch{return false;}}
  return {setAssignmentLock,assignmentUndoStatus,undoAutoAssign,recruitCostPreview,eventResponse,VERSION,WORK_PROFILES,workProfile,PUBLISHER_STAGES,publisherFunding,developmentCompletion,experienceBreakdown,decisionFinance,assignmentPriorities,assignmentUtility,memberAdvice,REPUTATION_NODES,RECRUIT_REPUTATION,reputationProfile,reputationStatus,recruitReputation,reputationPartners,reputationGain,publisherWork,publisherShare,terminationQuote,PERSON_RANKS,abilityScore,personRank,recruitUnlockText,MARKET_MIN,MARKET_MAX,marketFloor,marketMultiplier,revenueRules,INITIAL_FUNDS,startupAidStatus,claimStartupAid,STANDARD_WEEKLY_WORK,STANDARD_PERSON_WEEK_COST,scalePlan,projectNameStatus,HARD_CAP,INITIAL_SOFT_CAP,CAP_STEP,softCap,workPhase,SKILLS,GROUPS,JOBS,GRADES,AD_RATES,AD_BUDGETS,adBudgetOptions,publisherAdBudget,currentAdBudget,HERO,COMPANION,RECRUITS,SCALES,baseRequirements,PUBLISHER_JOBS,PUBLISHER_WEEKLY_WORK,publisherManaged,publisherQuote,signPublisher,adSettlement,OBJECTIVES,EVENTS,skillLabel,taskSkill,assignMember,availableRecruits,memberOutput,teamVoice,newRun,pauseProject,resumeProject,endProject,validateSnapshot,mods,cost,teamSize,progress,groupProgress,coreProgress,coreReady,complete,goals,canRelease,quality,trueScore,overallScore,grade,gradeIndex,revealLevel,ratingView,overallView,adRate,adProjection,buyingStatus,setAdBudget,forecast,incomeView,objectiveStatus,throughput,workDependency,workLimit,hire,downsize,advance,event,eventPool,eventChoiceStatus,resolveEvent,acknowledgeEvent,preview,progressEstimate,assignmentEstimate,automaticAssignmentPlan,autoAssign,softCapWarnings,finish,emptyMeta,settle,validateMeta,syncCareer,trainingCost,train,renameHero,hirePartner,dismissPartner,validateRun,copy};
});
