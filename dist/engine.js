/* 周目工作室 v0.3.0. Pure, seeded simulation; interface/storage are separate.
   Architecture follows 周目小镇 v3.17.0: run configuration, seeded choices,
   projections, milestone blueprints and idempotent growth receipts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioGame=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const VERSION=3;
  const JOBS=[
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
    {id:'autotest',name:'自动化测试',tag:'测试',desc:'验收效率 +50%，有测试人员时额外修复 2 个问题；维护 +75/周。',effect:{test:1.5,fix:2,fee:75},unlock:0},
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
    {id:'insight',name:'制作人直觉',desc:'初始玩法与表现品质各 +8',cost:2,unlock:260}
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
  function skillLabel(value){return value===0?'不会':value>=130?'擅长':value>=80?'胜任':'生疏';}
  function syncPeople(s){s.people=Object.fromEntries(JOBS.map(j=>[j.id,s.team.filter(m=>m.job===j.id).length]));s.reserve=s.team.filter(m=>m.job==='idle').length;}
  function makeMember(def,job){return {...copy(def),job,lastJob:job,kind:def.kind||'partner'};}
  function createTeam(config){const t=TEMPLATES.find(t=>t.id===(config.template||'designer'));if(!t)throw Error('请选择有效的主角模板');const hero=makeMember({...t,id:'hero',template:t.id,name:String(config.heroName||'你').trim().slice(0,12)||'你',title:t.name,kind:'hero',salary:72,bio:t.title},JOBS.reduce((a,j)=>t.skills[j.id]>t.skills[a]?j.id:a,'design'));return [hero,makeMember(COMPANION,hero.job==='design'?'code':'design')];}
  function availableRecruits(s){return RECRUITS.filter(r=>s.milestones.includes(r.stage)&&!s.team.some(m=>m.id===r.id)&&!s.departed.includes(r.id));}
  function assignMember(s,memberId,job){const m=s.team.find(m=>m.id===memberId);if(blocked(s)||!m||job!=='idle'&&!JOBS.some(j=>j.id===job)||job!=='idle'&&m.skills[job]<=0)return false;m.job=job;syncPeople(s);return true;}
  function memberOutput(s,memberId){const member=s.team.find(m=>m.id===memberId);if(!member||member.job==='idle')return 0;const job=member.job,m=mods(s);const ordered=s.team.filter(p=>p.job===job).map(p=>({id:p.id,n:p.skills[job]/100*(p.job!==p.lastJob?1-.2*m.ramp:1)})).sort((a,b)=>b.n-a.n||a.id.localeCompare(b.id));const index=ordered.findIndex(p=>p.id===memberId);const spirit=.65+s.morale/285,debt=['code','art'].includes(job)?Math.max(.55,1-s.debt*.013):1,freeze=s.designLocked&&['code','art'].includes(job)?1.12:1;return round(ordered[index].n*(index?m.crowd:1)*10*(s.focus===job?1.5:1)*m.all*m[job]*(s.pace==='crunch'?1.35:s.pace==='rest'?.7:1)*spirit*debt*freeze);}
  function teamVoice(s,e){const key={palette:'art',backup:'code',bug:'test',compat:'code',debt:'code',forms:'ops',showcase:'ops',inspiration:'design',scope:'design',feedback:'test'}[e?.id];const m=s.team.find(m=>m.job===key)||s.team.find(m=>m.id==='ace');const lines={palette:'风格值得打磨，也要想好多画的这些工作值不值。',backup:'先把备份保住，再决定设备预算。',bug:'发现问题是好事，留到上线后代价更大。',forms:'资质和上架清单，我已经重新核对了一遍。',scope:'这个想法很好。是放进这一作，还是留给下一作？',feedback:'有人认真玩了我们的作品，这份反馈值得研究。'};return {id:m.id,name:m.name,text:lines[e?.id]||m.quote};}
  const OBJECTIVES=[{id:'profit',name:'商业回报',desc:'项目结余达到 ¥1,200，尽量少花钱交付。',bonus:40},{id:'acclaim',name:'口碑佳作',desc:'作品评分达到 82，需要功能方向和品质投入。',bonus:40}];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const round=v=>Math.round(v*100)/100;
  const copy=o=>JSON.parse(JSON.stringify(o));
  function random(s){s.rng=(s.rng*1664525+1013904223)>>>0;return s.rng/4294967296;}
  function genre(s){return GENRES.find(g=>g.id===s.genre);}
  function capacity(meta){return meta.exp>=260?3:2;}
  function addLog(s,text,kind='info'){s.logs.unshift({week:s.week,text,kind});s.logs=s.logs.slice(0,70);}
  function mods(s){const m={all:1,design:1,code:1,art:1,test:1,ops:1,play:1,visual:1,debt:1,rework:1,overhead:1,wages:1,ramp:1,crowd:.45,fix:0,morale:0,cleanup:0,fee:0,sales:1};
    s.cards.forEach(id=>{const c=CARDS.find(x=>x.id===id);if(c)Object.entries(c.effect).forEach(([k,v])=>{if(['fix','morale','fee','crowd','cleanup'].includes(k))m[k]+=v;else m[k]*=v;});});
    if(s.buffs.includes('friend'))m.all*=1.08;if(s.buffs.includes('contacts')){m.ops*=1.25;m.sales*=1.05;}
    s.effects.forEach(e=>{if(e.weeks>0){m.all*=e.all||1;if(e.job)m[e.job]*=e.mult||1;}});return m;}
  function teamSize(s){return s.team.length;}
  function cost(s){const m=mods(s);const wages=Math.ceil(s.team.reduce((n,m)=>n+m.salary,0)*(s.hard?1.15:1)*(s.buffs.includes('savings')?.9:1)*m.wages);const overhead=Math.ceil((90+s.features.length*22+s.debt*3+Math.max(0,teamSize(s)-4)**2*12)*m.overhead);return {wages,overhead,tools:m.fee,total:wages+overhead+m.fee};}
  function progress(s,id){return clamp(s.work[id]/s.req[id],0,1);}
  function coreReady(s){return ['design','code','art'].every(k=>progress(s,k)>=1);}
  function complete(s){return ['design','code','art','test'].every(k=>progress(s,k)>=1)&&s.qualification>=70&&s.listing>=80;}
  function goals(s){return [
    {name:'核心开发',ok:coreReady(s),value:Math.floor(['design','code','art'].reduce((a,k)=>a+progress(s,k),0)/3*100)+'%'},
    {name:'测试覆盖',ok:progress(s,'test')>=1,value:Math.floor(progress(s,'test')*100)+'%'},
    {name:'严重问题',ok:s.bugs<=10,value:s.bugs+' / ≤10'},
    {name:'资质准备',ok:s.qualification>=70,value:Math.floor(s.qualification/70*100)+'%'},
    {name:'上架准备',ok:s.listing>=80,value:Math.floor(s.listing/80*100)+'%'}
  ];}
  function canRelease(s){return !s.over&&!s.pendingEvent&&!s.pendingCards&&goals(s).every(g=>g.ok);}
  function quality(s){return {play:clamp(Math.round(s.quality.play),0,100),visual:clamp(Math.round(s.quality.visual),0,100),stable:clamp(Math.round(100-s.bugs*2-s.debt*.55),0,100)};}
  function score(s){const q=quality(s),w=genre(s).weights;return round(q.play*w[0]+q.visual*w[1]+q.stable*w[2]);}
  function featureFit(s,id){return ({branch:{story:1.3,action:.75,sim:.9},combat:{story:.8,action:1.3,sim:.75},world:{story:.9,action:1,sim:1.3},style:{story:1.15,action:1.15,sim:.85}}[id]||{})[s.genre]||1;}
  function forecast(s){const q=score(s);const fit=1+s.features.reduce((a,id)=>a+(featureFit(s,id)-.85)*.25,0);const rev=Math.round((1400+q*q*1.05)*fit*mods(s).sales*(1-s.share));return {revenue:rev,low:Math.round(rev*.85),high:Math.round(rev*1.15),score:q,fit:round(fit),breakeven:Math.ceil(s.spent/24)};}
  function pool(s){return CARDS.filter(c=>c.unlock<=s.metaExp&&!s.cards.includes(c.id));}
  function offerCards(s){const p=pool(s);const pick=[];while(p.length&&pick.length<3)pick.push(p.splice(Math.floor(random(s)*p.length),1)[0].id);s.pendingCards=pick.length?pick:null;}
  function newRun(config={},meta={exp:0}){const g=GENRES.find(x=>x.id===config.genre)||GENRES[0];const exp=Number(meta.exp)||0;
    const buffs=[...new Set(config.buffs||[])];if(buffs.some(id=>!BUFFS.some(b=>b.id===id&&b.unlock<=exp))||buffs.reduce((n,id)=>n+BUFFS.find(b=>b.id===id).cost,0)>capacity({exp}))throw Error('开局加成尚未解锁或超过额度');
    const seed=(Number(config.seed)||Date.now())>>>0;
    const s={version:VERSION,id:'run-'+seed+'-'+Date.now(),seed,rng:seed,genre:g.id,name:String(config.name||g.title).trim().slice(0,18)||g.title,hard:config.hard===true,buffs,metaExp:exp,week:1,money:config.hard?6800:7600,spent:0,income:0,people:{design:1,code:1,art:1,test:0,ops:1},focus:'design',opsMode:'auto',pace:'normal',work:{design:0,code:0,art:0,test:0},req:copy(g.req),qualification:0,listing:0,quality:{play:12,visual:12},bugs:0,debt:0,morale:90,cards:[],features:[],effects:[],logs:[],history:[],milestones:[],funding:false,share:0,managed:false,pendingCards:null,pendingEvent:null,over:false,result:null,lastEvent:null};
    s.team=createTeam(config);s.departed=[];syncPeople(s);s.lastPeople=copy(s.people);s.testMode='qa';s.designLocked=false;s.featureWork={};s.objective=config.objective==='acclaim'?'acclaim':'profit';s.initialMoney=s.money+(buffs.includes('fund')?900:0);if(buffs.includes('fund'))s.money+=900;if(buffs.includes('insight')){s.quality.play+=8;s.quality.visual+=8;}
    addLog(s,'项目「'+s.name+'」正式立项。'+s.team[0].name+'与阿策两人开工，随着作品进展结识新伙伴。','good');offerCards(s);return s;
  }
  function chooseCard(s,id){if(s.over||!s.pendingCards||id!=='skip'&&!s.pendingCards.includes(id))return false;if(id==='skip'){s.pendingCards=null;addLog(s,'放弃本次蓝图，保持轻量开发。');return true;}s.cards.push(id);s.pendingCards=null;addLog(s,'采用技术蓝图：'+CARDS.find(c=>c.id===id).name,'good');return true;}
  function blocked(s){return s.over||!!s.pendingEvent||!!s.pendingCards;}
  function allocate(s,from,to){if(from===to)return false;const m=s.team.filter(m=>m.job===from&&m.skills[to]>0).sort((a,b)=>b.skills[to]-a.skills[to])[0];return !!m&&assignMember(s,m.id,to);}
  function assign(s,id,delta){if(!JOBS.some(j=>j.id===id)||![1,-1].includes(delta))return false;const choices=s.team.filter(m=>delta===1?m.job==='idle'&&m.skills[id]>0:m.job===id).sort((a,b)=>delta===1?b.skills[id]-a.skills[id]:a.skills[id]-b.skills[id]);return !!choices.length&&assignMember(s,choices[0].id,delta===1?id:'idle');}
  function hire(s,id){const r=availableRecruits(s).find(r=>r.id===id);if(!r||blocked(s)||s.managed||teamSize(s)>=8||s.money<180)return false;const job=JOBS.reduce((a,j)=>r.skills[j.id]>r.skills[a]?j.id:a,'design');const member=makeMember(r,job);member.lastJob='idle';s.team.push(member);syncPeople(s);s.money-=180;s.spent+=180;s.managed=true;addLog(s,r.name+'加入团队：'+r.title+'，负责'+JOBS.find(j=>j.id===job).name+'。入组支出 ¥180，基础周薪 ¥'+r.salary+'。','good');return true;}
  function downsize(s,id){const member=id?s.team.find(m=>m.id===id):s.team.filter(m=>m.kind==='partner').at(-1);if(!member||member.kind!=='partner'||blocked(s)||s.managed||s.money<100)return false;s.team=s.team.filter(m=>m.id!==member.id);s.departed.push(member.id);syncPeople(s);s.money-=100;s.spent+=100;s.managed=true;addLog(s,'与'+member.name+'暂别，支付 ¥100 安置费；本项目不再重复邀请。');return true;}
  function featurePreview(s,id){const f=FEATURES.find(x=>x.id===id);if(!f)return null;const avg=['design','code','art'].reduce((a,k)=>a+progress(s,k),0)/3;const rework=1+avg*.7*mods(s).rework;const fit=featureFit(s,id);return {req:Object.fromEntries(Object.entries(f.req).map(([k,v])=>[k,Math.ceil(v*rework)])),fit,rework:Math.round((rework-1)*100),weekly:22,debt:round(f.debt*mods(s).debt)};}
  function feature(s,id){const f=FEATURES.find(x=>x.id===id);if(!f||blocked(s)||s.managed||s.designLocked||s.features.includes(id)||s.money<f.cost)return false;const p=featurePreview(s,id);s.features.push(id);s.featureWork[id]=p.req;s.money-=f.cost;s.spent+=f.cost;Object.entries(p.req).forEach(([k,v])=>s.req[k]+=v);s.debt=round(s.debt+p.debt);s.managed=true;addLog(s,'扩展功能：'+f.name+'。后期返工增加 '+p.rework+'%，维护 +22/周。');return true;}
  function cutFeature(s,id){const f=FEATURES.find(x=>x.id===id);if(!f||blocked(s)||s.managed||s.designLocked||!s.features.includes(id))return false;s.features=s.features.filter(x=>x!==id);Object.entries(s.featureWork[id]||f.req).forEach(([k,v])=>{s.req[k]-=v;s.work[k]=Math.min(s.work[k],s.req[k]);});delete s.featureWork[id];s.debt=Math.max(0,s.debt-f.debt*.6);s.managed=true;addLog(s,'删减「'+f.name+'」，收缩开发范围。已花费资金不退还。');return true;}
  function freeze(s){if(blocked(s)||s.managed||progress(s,'design')<.6||s.designLocked&&s.money<180)return false;if(s.designLocked){s.money-=180;s.spent+=180;s.debt+=4;s.req.design+=8;s.designLocked=false;addLog(s,'解冻设计：支出 180、设计 +8、技术债 +4。');}else{s.designLocked=true;addLog(s,'冻结设计范围：程序、美术效率 +12%，新问题减少 25%；不能增删功能。','good');}s.managed=true;return true;}
  function funding(s){if(blocked(s)||s.funding)return false;const n=['design','code','art'].reduce((a,k)=>a+progress(s,k),0)/3;if(n<.3)return false;s.funding=true;s.money+=2200;s.income+=2200;s.share=.22;addLog(s,'签订发行合作：预付款 ¥2,200，发售收入分成 22%。本项目仅一次。','good');return true;}
  function throughput(s,id){return round(s.team.filter(m=>m.job===id).reduce((n,m)=>n+memberOutput(s,m.id),0));}
  function workLimit(s,id){if(id==='code'||id==='art')return s.req[id]*Math.min(1,.15+progress(s,'design')*.85);if(id==='test')return s.req.test*Math.min(progress(s,'code'),progress(s,'art'));return s.req[id]||Infinity;}
  function workWeek(s){const m=mods(s),result={};s.lastBottlenecks={};
    JOBS.forEach(j=>{const amount=throughput(s,j.id);result[j.id]=amount;
      if(j.id==='ops'){let left=amount;const mode=s.opsMode;const auth=()=>{let n=Math.min(left,70-s.qualification);s.qualification+=n;left-=n;};const listing=()=>{const cap=coreReady(s)?80:64;let n=Math.min(left,Math.max(0,cap-s.listing));s.listing+=n;left-=n;};if(mode==='listing'){listing();}else if(mode==='qualification'){auth();}else{auth();listing();}}
      else{if(j.id==='test'&&s.testMode==='refactor'){s.debt=Math.max(0,s.debt-amount*.38);s.bugs=Math.max(0,s.bugs-amount*.1);return;}const before=s.work[j.id],limit=workLimit(s,j.id);s.work[j.id]=round(Math.max(before,Math.min(s.req[j.id],limit,before+amount)));const added=s.work[j.id]-before;const polish=progress(s,j.id)>=1?Math.max(0,amount-added):0;const wasted=Math.max(0,amount-added-polish);if(wasted>.1&&j.id!=='test')s.lastBottlenecks[j.id]=round(wasted);if(wasted>.1&&j.id==='test'&&s.bugs<=0)s.lastBottlenecks.test=round(wasted);
        const bonuses=s.features.map(id=>({...FEATURES.find(f=>f.id===id),fit:featureFit(s,id)}));const playCap=70+bonuses.reduce((a,f)=>a+f.play*f.fit,0);const visualCap=70+bonuses.reduce((a,f)=>a+f.visual*f.fit,0);
        if(j.id==='design')s.quality.play+=added*.35*m.play+polish*.1*m.play*Math.max(.08,1-s.quality.play/playCap);
        if(j.id==='code'){s.quality.play+=added*.19;s.bugs+=added*.14*(1+s.debt/25)*(s.pace==='crunch'?1.55:1)*(s.designLocked?.75:1);s.debt+=added*.025;}
        if(j.id==='art')s.quality.visual+=added*.48*m.visual+polish*.14*m.visual*Math.max(.08,1-s.quality.visual/visualCap);
        if(j.id==='test'){s.bugs=Math.max(0,s.bugs-amount*.38);s.quality.play+=added*.06;}
        s.quality.play=Math.min(playCap,s.quality.play);s.quality.visual=Math.min(visualCap,s.quality.visual);
      }
    });s.bugs=Math.max(0,Math.round(s.bugs-(s.people.test>0?m.fix:0)));s.debt=round(Math.max(0,s.debt-m.cleanup));s.morale=clamp(s.morale+(s.pace==='crunch'?-10:s.pace==='rest'?12:1)+m.morale,25,100);if(s.pace==='crunch')s.debt+=2.5;s.lastPeople=copy(s.people);s.team.forEach(m=>m.lastJob=m.job);return result;
  }
  const EVENTS=[
    {id:'inspiration',tag:'灵感时刻',title:'茶水间的一句好点子',text:'一个新想法可能让玩法更出色，但整合它就得扩大范围。',choices:[{label:'扩展这个创意',hint:'可玩性 +5；设计、程序工作量各 +8',quality:{play:5},workload:{design:8,code:8}},{label:'收进下一作的笔记',hint:'士气 +3，本作不扩范围',morale:3}]},
    {id:'palette',tag:'创作火花',title:'找到了对的那抹颜色',text:'新风格很漂亮，也意味着额外的美术工作。',choices:[{label:'把新风格做完整',hint:'表现力 +5，美术工作量 +12',quality:{visual:5},workload:{art:12}},{label:'继续沿用已有规范',hint:'美术进度 +5，保持范围',work:{art:5}}]},
    {id:'discount',tag:'小小幸运',title:'工具续费，意外优惠',text:'常用工具发来了老用户折扣。一笔不大的节省，足够请大家喝杯好咖啡。',choices:[{label:'收下这份小幸运',hint:'资金 +120',cash:120}]},
    {id:'feedback',tag:'玩家来信',title:'第一位试玩者的长评',text:'朋友把原型一口气玩了三遍，还认真写了一页反馈。要把这份热情用在哪里？',choices:[{label:'研究玩法反馈',hint:'可玩性 +4',quality:{play:4}},{label:'梳理复现步骤',hint:'问题 −4，测试进度 +8',bugs:-4,work:{test:8}}]},
    {id:'coffee',tag:'工作室日常',title:'今天的咖啡刚刚好',text:'团队状态不错，是保持可持续节奏，还是趁势推进下一阶段？',choices:[{label:'保持这个好节奏',hint:'士气 +5',morale:5},{label:'趁状态好集中突破',hint:'下周全体效率 +15%，士气 −6',morale:-6,effect:{all:1.15,weeks:1,name:'集中突破'}}]},
    {id:'break',tag:'团队选择',title:'不如今晚早点回家',text:'连续的开发让大家有些疲惫。有人提议安排一次小聚，也有人想留点预算。',choices:[{label:'一起吃顿饭',hint:'支出 100，士气 +14',cash:-100,morale:14},{label:'散步也挺好',hint:'士气 +5',morale:5}]},
    {id:'backup',tag:'意外插曲',title:'硬盘发出了奇怪的声音',text:'幸好备份还在。换掉旧设备，或者先用备用机顶一阵？',choices:[{label:'更换设备',hint:'支出 180，下周程序效率 +15%',cash:-180,effect:{job:'code',mult:1.15,weeks:1,name:'新设备'}},{label:'启用备用机',hint:'下周程序效率 −15%',effect:{job:'code',mult:.85,weeks:1,name:'备用设备'}}]},
    {id:'scope',tag:'制作人抉择',title:'这个点子，要现在做吗？',text:'一个新交互可能提升体验，也可能延后发布。',choices:[{label:'先记进下一作',hint:'士气 +3，不增加工作量',morale:3},{label:'把实验做进这个版本',hint:'支出 100，可玩性 +5，程序与测试工作量各 +8',cash:-100,quality:{play:5},workload:{code:8,test:8}}]},
    {id:'showcase',tag:'行业机会',title:'小型独立游戏展的邀请',text:'主办方看中了你的原型，愿意留一个展位。参展有成本，但能带来宝贵反馈。',min:.3,choices:[{label:'带上试玩版去看看',hint:'支出 200，可玩性 +4，表现力 +3',cash:-200,quality:{play:4,visual:3}},{label:'专注手头的开发',hint:'下周全体效率 +10%',effect:{all:1.1,weeks:1,name:'专注开发'}}]},
    {id:'bug',tag:'测试发现',title:'藏在角落里的边界问题',text:'一个不常见的操作触发了异常。根治需要成本，临时隔离会留下隐患。',choices:[{label:'现在彻底修复',hint:'支出 120，问题 −3',cash:-120,bugs:-3},{label:'临时隔离，稍后清理',hint:'严重问题 +2，技术债 +3',bugs:2,debt:3}]},
    {id:'forms',tag:'发行事务',title:'资料整理得很清楚',text:'渠道对你准备的材料给出了清晰反馈，下一步可以少走一些弯路。',choices:[{label:'更新发行清单',hint:'资质准备 +8，上架准备 +6',qualification:8,listing:6}]},
    {id:'compat',tag:'技术维护',title:'一次小小的兼容更新',text:'开发工具更新了接口。眼下可以处理，也可以暂时保持旧版本。',choices:[{label:'现在处理',hint:'支出 100，技术债 −3',cash:-100,debt:-3},{label:'锁定现有版本',hint:'技术债 +2',debt:2}]},
    {id:'tired',tag:'团队状态',title:'大家需要喘口气',text:'赶工的痕迹写在每个人脸上。是否把下周的一部分时间留给调整？',condition:s=>s.morale<65,choices:[{label:'安排充分休息',hint:'士气 +15，下周效率 −10%',morale:15,effect:{all:.9,weeks:1,name:'休整'}},{label:'再坚持一下',hint:'士气 −5，问题 +2',morale:-5,bugs:2}]},
    {id:'debt',tag:'架构提醒',title:'旧代码开始牵一发动全身',text:'几处临时方案互相纠缠。现在清理，可能比继续叠功能更值得。',condition:s=>s.debt>8,choices:[{label:'投入一次架构整理',hint:'支出 180，技术债 −7',cash:-180,debt:-7},{label:'标记风险，稍后处理',hint:'严重问题 +3',bugs:3}]}
  ];
  function eventPool(s){const p=['design','code','art'].reduce((a,k)=>a+progress(s,k),0)/3;return EVENTS.filter(e=>(!e.min||p>=e.min)&&(!e.condition||e.condition(s))&&e.id!==s.lastEvent);}
  function advance(s){if(blocked(s))return {ok:false,reason:'请先完成当前选择'};const c=cost(s);if(s.money<c.total)return {ok:false,reason:'资金不足以支付下一周，请发售、融资、缩减规模或终止项目'};
    const contributions=s.team.map(m=>({id:m.id,name:m.name,job:m.job,output:memberOutput(s,m.id)}));s.money-=c.total;s.spent+=c.total;const production=workWeek(s);s.effects=s.effects.map(e=>({...e,weeks:e.weeks-1})).filter(e=>e.weeks>0);s.history.push({week:s.week,cost:c.total,production,team:contributions,score:score(s),money:s.money});
    addLog(s,'完成第 '+s.week+' 周：支出 ¥'+c.total+'，主攻'+JOBS.find(j=>j.id===s.focus).name+'。'+contributions.filter(m=>m.output>0).map(m=>m.name+'负责'+JOBS.find(j=>j.id===m.job).short).join('、')+'。');const p=eventPool(s);const e=p[Math.floor(random(s)*p.length)];s.pendingEvent=e.id;s.lastEvent=e.id;s.week++;s.managed=false;return {ok:true,event:e.id};
  }
  function event(s){return EVENTS.find(e=>e.id===s.pendingEvent);}
  function eventChoiceStatus(s,index){const c=event(s)?.choices[index];if(!c)return {ok:false,reason:'无效选项'};if(c.cash<0&&s.money<-c.cash)return {ok:false,reason:'资金不足'};if(c.workload&&s.designLocked)return {ok:false,reason:'已冻结范围，不能扩展'};return {ok:true};}
  function resolveEvent(s,index){const e=event(s);const c=e&&e.choices[index];if(s.over||!eventChoiceStatus(s,index).ok)return false;
    if(c.cash){s.money+=c.cash;if(c.cash<0)s.spent-=c.cash;else s.income+=c.cash;}
    if(c.quality)Object.entries(c.quality).forEach(([k,v])=>s.quality[k]=clamp(s.quality[k]+v,0,100));
    if(c.workload)Object.entries(c.workload).forEach(([k,v])=>s.req[k]+=v);
    if(c.work)Object.entries(c.work).forEach(([k,v])=>s.work[k]=Math.max(s.work[k],Math.min(s.req[k],workLimit(s,k),s.work[k]+v)));
    s.bugs=Math.max(0,s.bugs+(c.bugs||0));s.debt=Math.max(0,s.debt+(c.debt||0));s.morale=clamp(s.morale+(c.morale||0),25,100);s.qualification=Math.min(70,s.qualification+(c.qualification||0));s.listing=Math.min(coreReady(s)?80:64,s.listing+(c.listing||0));if(c.effect)s.effects.push(copy(c.effect));
    addLog(s,e.title+'：'+c.label+'。'+c.hint,c.cash<0?'info':'good');s.pendingEvent=null;checkMilestones(s);return true;
  }
  function checkMilestones(s){const avg=['design','code','art'].reduce((a,k)=>a+progress(s,k),0)/3;
    const next=[{id:'prototype',check:avg>=.3,name:'可玩原型'},{id:'vertical',check:avg>=.65,name:'垂直切片'},{id:'content',check:coreReady(s),name:'内容完成'}].find(m=>m.check&&!s.milestones.includes(m.id));
    if(next){s.milestones.push(next.id);addLog(s,'达成里程碑「'+next.name+'」，获得蓝图选择；'+RECRUITS.filter(r=>r.stage===next.id).map(r=>r.name).join('、')+'愿意加入团队，可在人物卡查看与邀请。','good');offerCards(s);}
  }
  function preview(s){const p=copy(s);if(blocked(p))return null;const c=cost(p);const production=workWeek(p);return {production,cost:c,quality:quality(p),bugs:p.bugs,debt:p.debt,bottlenecks:p.lastBottlenecks,work:p.work,qualification:p.qualification,listing:p.listing,money:s.money-c.total};}
  function objectiveStatus(s,result){const f=forecast(s),profit=result?result.profit:f.revenue+s.income-s.spent;const value=s.objective==='acclaim'?(result?result.score:Math.round(f.score)):profit;const target=s.objective==='acclaim'?82:1200;const ready=result?true:goals(s).every(g=>g.ok);return {id:s.objective,name:OBJECTIVES.find(o=>o.id===s.objective)?.name||'商业回报',value,target,ready,ok:ready&&value>=target};}
  function finish(s,released){if(blocked(s)||released&&!canRelease(s))return false;const f=forecast(s);let revenue=0;if(released)revenue=Math.round(f.revenue*(.85+random(s)*.3));const profit=revenue+s.income-s.spent;const target=objectiveStatus(s,{score:Math.round(f.score),profit});const exp=released?Math.round(35+f.score*.9+(revenue>s.spent?20:0)+(s.hard?25:0)+(target.ok?40:0)):Math.min(30,Math.floor(s.milestones.length*8));
    s.over=true;s.result={runId:s.id,name:s.name,genre:s.genre,released,weeks:s.week-1,score:Math.round(f.score),quality:quality(s),revenue,cost:s.spent,profit,exp,objective:s.objective,objectiveOK:released&&target.ok,features:s.features.slice(),cards:s.cards.slice(),team:copy(s.team),seed:s.seed};addLog(s,released?'「'+s.name+'」正式发售。':'项目终止。已完成里程碑将保留少量制作经验。',released?'good':'info');return s.result;
  }
  function emptyMeta(){return {version:1,exp:0,receipts:{},history:[]};}
  function settle(meta,s){const m=copy(meta);if(!s.over||!s.result||m.receipts[s.id])return m;const r=copy(s.result);m.receipts[s.id]=r.exp;m.exp+=r.exp;m.history.unshift(r);return m;}
  function validateRun(s){try{if(!s||s.version!==VERSION||!GENRES.some(g=>g.id===s.genre)||!Number.isInteger(s.week)||s.week<1||!Array.isArray(s.team)||s.team.length<2||s.team.length>8||!Array.isArray(s.departed)||!Array.isArray(s.history)||!Array.isArray(s.cards)||!Array.isArray(s.logs)||!Array.isArray(s.effects)||!Array.isArray(s.features)||!Array.isArray(s.milestones)||!Array.isArray(s.buffs)||!s.quality||!s.req||!s.work||!s.people||!s.featureWork)return false;const ids=s.team.map(m=>m.id);if(new Set(ids).size!==ids.length||s.team.filter(m=>m.kind==='hero').length!==1||!s.team.some(m=>m.id==='hero'&&m.kind==='hero')||!s.team.some(m=>m.id==='ace'&&m.kind==='companion')||!['qa','refactor'].includes(s.testMode)||!['profit','acclaim'].includes(s.objective))return false;if(!s.team.every(m=>typeof m.name==='string'&&m.name.length>0&&Number.isFinite(m.salary)&&m.salary>=0&&['idle',...JOBS.map(j=>j.id)].includes(m.job)&&['idle',...JOBS.map(j=>j.id)].includes(m.lastJob)&&JOBS.every(j=>Number.isFinite(m.skills[j.id])&&m.skills[j.id]>=0&&m.skills[j.id]<=200)&&(m.job==='idle'||m.skills[m.job]>0)))return false;return JOBS.every(j=>s.people[j.id]===s.team.filter(m=>m.job===j.id).length)&&s.reserve===s.team.filter(m=>m.job==='idle').length&&['design','code','art','test'].every(k=>Number.isFinite(s.work[k])&&Number.isFinite(s.req[k])&&s.req[k]>0)&&[s.money,s.spent,s.income,s.qualification,s.listing,s.bugs,s.debt,s.morale,s.quality.play,s.quality.visual,s.rng,s.seed].every(Number.isFinite)&&s.cards.every(id=>CARDS.some(c=>c.id===id))&&(!s.pendingEvent||EVENTS.some(e=>e.id===s.pendingEvent))&&(!s.pendingCards||Array.isArray(s.pendingCards)&&s.pendingCards.every(id=>CARDS.some(c=>c.id===id)));}catch{return false;}}
  return {VERSION,TEMPLATES,COMPANION,RECRUITS,skillLabel,assignMember,availableRecruits,memberOutput,teamVoice,JOBS,GENRES,CARDS,FEATURES,BUFFS,OBJECTIVES,EVENTS,newRun,chooseCard,mods,cost,teamSize,progress,coreReady,complete,goals,canRelease,quality,score,forecast,objectiveStatus,featureFit,featurePreview,freeze,throughput,workLimit,allocate,assign,hire,downsize,feature,cutFeature,funding,advance,event,eventChoiceStatus,resolveEvent,preview,finish,emptyMeta,settle,capacity,validateRun,copy};
});
