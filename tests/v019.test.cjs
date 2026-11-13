const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;const report={version:'0.19.0',cycles:[]};
function check(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
function start(config={},reputation=0,people=2){const meta=G.emptyMeta();meta.wallet=3000000;meta.reputation=reputation;meta.knownPartners=G.reputationPartners(meta);meta.partners=meta.knownPartners.slice(0,people-2);return {meta,s:G.newRun({seed:18019,...config},meta)};}
function core(s,n){for(const j of G.JOBS.filter(j=>['content','framework'].includes(j.group)))s.work[j.id]=s.req[j.id]*n;}
function settleEvent(s){while(s.pendingEvent){const e=G.event(s),i=e.kind==='method'?e.choices.findIndex(c=>c.skipMethod):e.choices.findIndex((c,i)=>G.eventChoiceStatus(s,i).ok&&!c.cash);assert.ok(G.resolveEvent(s,i<0?0:i));G.acknowledgeEvent(s);}G.acknowledgeEvent(s);}
function method(s,id){const stage=G.METHOD_STAGES[s.methodStages.length],m=G.PROJECT_METHODS.find(m=>m.id===id),other=G.PROJECT_METHODS.find(m=>m.id!==id&&!s.methods.includes(m.id));s.week=Math.max(s.week,3);core(s,stage.threshold+.02);s.pendingEvent=stage.id;s.pendingCapGroup=null;s.pendingChoices={id:stage.id,choices:[{label:m.name,hint:m.description,method:m.id},{label:other.name,hint:other.description,method:other.id},{label:'沿用现有流程',hint:'不采用新方法，放弃本次机会。',skipMethod:true}]};assert.ok(G.resolveEvent(s,0));G.acknowledgeEvent(s);}
const near=(a,b)=>assert.ok(Math.abs(a-b)<.03,a+' != '+b);

check('project requirements, revenue multipliers and personal output keep their original scale relationship',()=>{
  for(const [i,g] of G.SCALES.entries()){const {s}=start({scale:g.id}),p=G.scalePlan(g.id);near(p.personWeeks,54.4*g.multiplier);assert.equal(g.revenueMultiplier,g.multiplier);assert.equal(s.req.materials,40*g.multiplier);assert.equal(G.memberOutput(s,'hero'),G.memberOutput(start().s,'hero'));assert.equal(G.publisherWork(s),[20,30,60,90][i]);}
});
check('actual publisher listing cycles match the new targets in both modes at initial and final reputation',()=>{
  for(const hard of [false,true])for(const reputation of [0,2965])for(const [i,scale] of G.SCALES.entries()){
    const {s}=start({scale:scale.id,hard},reputation);G.signPublisher(s);for(const m of s.team)G.assignMember(s,m.id,'idle');const initial=G.publisherPacing(s);let weeks=0;
    while(!G.canRelease(s)&&weeks<150){assert.ok(G.advance(s).ok);settleEvent(s);assert.ok(G.validateRun(s));weeks++;}
    assert.equal(weeks,(reputation?[4,6,8,14]:[4,8,12,24])[i]);assert.equal(initial.listingWeeks,weeks);assert.equal(G.publisherPacing(s).listingWeeks,0);report.cycles.push({scale:scale.id,hard,reputation,weeklyWork:initial.weeklyWork,weeks});
  }
});
check('scaled contracts remain frozen when reputation improves and survive save and project switching',()=>{
  const {meta,s}=start({scale:'large'});G.signPublisher(s);const quote=G.copy(s.publisher.quote);assert.equal(quote.baseWeeklyWork,20);assert.equal(quote.scaleWorkMultiplier,4.5);assert.equal(quote.weeklyWork,90);G.pauseProject(meta,s);meta.reputation=2965;meta.knownPartners=G.reputationPartners(meta);const restored=G.resumeProject(meta,s.id);assert.deepEqual(restored.publisher.quote,quote);assert.equal(G.publisherWork(restored),90);assert.ok(G.validateSnapshot({meta,run:restored}));assert.equal(G.publisherQuote(start({scale:'large'},2965).s).weeklyWork,162);
});
check('invalid scaled clauses are rejected instead of silently changing production',()=>{
  for(const change of [q=>q.weeklyWork=20,q=>q.baseWeeklyWork=21,q=>q.scaleWorkMultiplier=27,q=>q.weeklyWork=Infinity]){const {s}=start({scale:'large'});G.signPublisher(s);change(s.publisher.quote);assert.equal(G.validateRun(s),false);}
});
check('listing estimates account for remaining materials and review independently without random draws',()=>{
  const {s}=start({scale:'large'});s.work.materials=1000;s.work.review=20;const before=JSON.stringify(s),p=G.publisherPacing(s);assert.equal(p.listingWeeks,1+12);assert.equal(JSON.stringify(s),before);s.work.materials=s.req.materials;assert.equal(G.publisherPacing(s).listingWeeks,12);
});
check('method events require real project progress and two completed weeks',()=>{
  const {s}=start();core(s,.7);assert.ok(!G.eventPool(s).some(e=>e.kind==='method'));s.week=3;core(s,.099);assert.ok(!G.eventPool(s).some(e=>e.kind==='method'));core(s,.1);assert.deepEqual(G.eventPool(s).filter(e=>e.kind==='method').map(e=>e.id),['method-first']);
});
check('eligible method events arrive within three weekly events and freeze two distinct random offers',()=>{
  const seen=new Set();for(let seed=1;seed<=80;seed++){const {s}=start({seed});s.week=3;core(s,.12);for(const m of s.team)G.assignMember(s,m.id,'idle');let count=0;
    do{assert.ok(G.advance(s).ok);count++;if(G.event(s).kind==='method')break;settleEvent(s);}while(count<3);
    const e=G.event(s);assert.equal(e.kind,'method');assert.equal(e.choices.length,3);assert.equal(e.choices.filter(c=>c.skipMethod).length,1);const offers=e.choices.filter(c=>c.method);assert.equal(offers.length,2);assert.notEqual(offers[0].method,offers[1].method);offers.forEach(c=>seen.add(c.method));const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(G.event(restored),e);assert.ok(G.validateRun(restored));const before=JSON.stringify(s);G.eventPool(s);G.event(s);G.projectMethodStatus(s);assert.equal(JSON.stringify(s),before);
  }assert.equal(seen.size,6);
});
check('adopting a method changes no current progress cash or random state and resolves exactly once',()=>{
  const {s}=start();s.week=3;core(s,.12);s.methodWait=2;for(const m of s.team)G.assignMember(s,m.id,'idle');G.advance(s);assert.equal(G.event(s).kind,'method');const id=G.event(s).choices[0].method,before=G.copy(s);assert.ok(G.resolveEvent(s,0));assert.deepEqual(s.methods,[id]);assert.deepEqual(s.methodStages,['method-first']);assert.deepEqual(s.work,before.work);assert.equal(s.money,before.money);assert.equal(s.rng,before.rng);assert.ok(s.eventResult.unread);assert.ok(s.eventResult.details.some(x=>x.includes('本项目采用')));const once=JSON.stringify(s);assert.equal(G.resolveEvent(s,0),false);assert.equal(JSON.stringify(s),once);assert.ok(G.validateRun(s));
});
check('late project offers omit spent prototype benefits and large rosters omit small-team methods',()=>{
  for(let seed=1;seed<=16;seed++){const {s}=start({seed},2965,12);s.week=3;core(s,.4);s.methodWait=2;for(const m of s.team)G.assignMember(s,m.id,'idle');G.advance(s);const e=G.event(s);assert.equal(e.kind,'method');assert.equal(e.choices.filter(c=>c.method).length,2);assert.ok(e.choices.every(c=>!['rapid','small-team'].includes(c.method)));}
});
check('declining a discussion consumes its opportunity and does not change production',()=>{
  const {s}=start();s.week=3;core(s,.12);s.methodWait=2;for(const m of s.team)G.assignMember(s,m.id,'idle');G.advance(s);const before=G.projectMethodModifiers(s),i=G.event(s).choices.findIndex(c=>c.skipMethod);assert.ok(G.resolveEvent(s,i));assert.deepEqual(s.methods,[]);assert.deepEqual(s.methodStages,['method-first']);assert.deepEqual(G.projectMethodModifiers(s),before);G.acknowledgeEvent(s);assert.ok(!G.eventPool(s).some(e=>e.kind==='method'));core(s,.35);assert.equal(G.eventPool(s).find(e=>e.kind==='method').id,'method-second');
});
check('three stages cannot offer duplicate methods or create a fourth opportunity',()=>{
  const {s}=start();for(const id of ['rapid','pairing','flexible']){method(s,id);assert.ok(G.validateRun(s));const pool=G.eventPool(s);assert.ok(pool.filter(e=>e.kind==='method').length<=1);}core(s,.7);assert.equal(G.eventPool(s).filter(e=>e.kind==='method').length,0);assert.equal(s.methods.length,3);assert.equal(new Set(s.methods).size,3);
});
check('method state and frozen discussions reject corrupt stages duplicate choices and unknown methods',()=>{
  const {s}=start();method(s,'rapid');for(const change of [x=>x.methods=['fake'],x=>x.methods=['rapid','rapid'],x=>x.methodStages=['method-third'],x=>x.methodStages=[],x=>x.methodWait=-1,x=>x.methodWait=4]){const a=G.copy(s);change(a);assert.equal(G.validateRun(a),false);}
  const a=start().s;a.week=3;core(a,.12);a.methodWait=2;for(const m of a.team)G.assignMember(a,m.id,'idle');G.advance(a);for(const change of [x=>x.pendingChoices.choices[1]=G.copy(x.pendingChoices.choices[0]),x=>x.pendingChoices.choices[0].method='fake',x=>x.pendingChoices.choices.pop()]){const b=G.copy(a);change(b);assert.equal(G.validateRun(b),false);}
});
check('rapid prototyping and careful polish switch benefits and costs at their published thresholds',()=>{
  for(const [id,expected] of [['rapid',[1.25,1,1,1,1,.9,.9]],['polish',[.9,1,1,1.2,1.2,1.2,1.2]]]){const {s}=start();method(s,id);for(const [i,n] of [.2,.3,.35,.5,.55,.6,.65].entries()){core(s,n);near(G.projectMethodModifiers(s).efficiency,expected[i]);const plain=G.copy(s);plain.methods=[];G.assignMember(s,'hero','theme');G.assignMember(plain,'hero','theme');near(G.memberOutput(s,'hero'),G.memberOutput(plain,'hero')*expected[i]);}}
});
check('flexible working makes transfers cheaper while charging its efficiency cost on unchanged jobs',()=>{
  const {s}=start();method(s,'flexible');core(s,.2);G.assignMember(s,'hero','theme');const plain=G.copy(s);plain.methods=[];near(G.memberOutput(s,'hero'),G.memberOutput(plain,'hero')*(.9/.8)*.95);s.team[0].lastJob='theme';plain.team[0].lastJob='theme';near(G.memberOutput(s,'hero'),G.memberOutput(plain,'hero')*.95);
});
check('pairing and specialist workflows trade solo output against secondary-member efficiency',()=>{
  for(const [id,eff,crowd] of [['pairing',.9,.7],['specialist',1.15,.3]]){const {s}=start();method(s,id);core(s,.2);for(const m of s.team){G.assignMember(s,m.id,'theme');m.lastJob='theme';}const plain=G.copy(s);plain.methods=[];near(G.memberOutput(s,'ace'),G.memberOutput(plain,'ace')*eff);near(G.memberOutput(s,'hero'),G.memberOutput(plain,'hero')*eff*crowd/.45);}
});
check('small-team workflow changes dynamically when members join and leave',()=>{
  const {s}=start({},2965);method(s,'small-team');for(const [n,factor] of [[2,1.15],[4,1.15],[5,1],[8,1],[9,.9]]){while(s.team.length<n){s.managed=false;assert.ok(G.hire(s,G.availableRecruits(s)[0].id));}near(G.projectMethodModifiers(s).efficiency,factor);}s.managed=false;G.downsize(s,s.team.at(-1).id);near(G.projectMethodModifiers(s).efficiency,1);
});
check('combined method effects are order-independent and publisher work is never modified',()=>{
  const {s}=start({scale:'large'});for(const id of ['rapid','pairing','specialist'])method(s,id);core(s,.2);const a=G.projectMethodModifiers(s);near(a.efficiency,1.25*.9*1.15);near(.45+a.crowdDelta,.55);const reverse=G.copy(s);reverse.methods.reverse();assert.deepEqual(G.projectMethodModifiers(reverse),a);G.signPublisher(s);for(const id of G.PUBLISHER_JOBS)assert.equal(G.throughput(s,id),90);assert.equal(G.publisherPacing(s).listingWeeks,24);
});
check('full-efficiency forecasts and actual ideal production agree with methods including caps and dependencies',()=>{
  for(const id of G.PROJECT_METHODS.map(m=>m.id)){const {s}=start();method(s,id);core(s,.4);G.assignMember(s,'hero','theme');G.assignMember(s,'ace','development');const before=JSON.stringify(s),p=G.progressEstimate(s);assert.equal(JSON.stringify(s),before);G.advance(s);for(const j of G.JOBS)near(s.history.at(-1).gains[j.id],p.gains[j.id]);}
});
check('real-mode forecasts still omit phase slowdown and actual work still applies the original 65 percent band',()=>{
  const {s}=start({hard:true});method(s,'flexible');core(s,.4);G.assignMember(s,'hero','theme');G.assignMember(s,'ace','idle');const p=G.progressEstimate(s),room=G.workLimit(s,'theme')-s.work.theme;G.advance(s);near(s.history.at(-1).gains.theme,Math.min(room,p.production.theme*.65));assert.ok(p.gains.theme>s.history.at(-1).gains.theme);
});
check('automatic allocation matches an independent exhaustive search with the selected methods',()=>{
  for(const selected of [['flexible'],['pairing'],['specialist'],['pairing','flexible','rapid']]){const {s}=start();for(const id of selected)method(s,id);core(s,.2);const jobs=['idle',...G.JOBS.map(j=>j.id)],p=G.automaticAssignmentPlan(s);let best=-Infinity;
    for(const hero of jobs)for(const ace of jobs){const a=G.copy(s);if(!G.assignMember(a,'hero',hero)||!G.assignMember(a,'ace',ace))continue;best=Math.max(best,G.assignmentUtility(a,G.progressEstimate(a)));}
    near(p.afterUtility,best);assert.ok(Math.abs(p.afterUtility-best)<1e-8);const a=G.copy(s);for(const [id,job] of Object.entries(p.assignments))G.assignMember(a,id,job);assert.ok(Math.abs(G.assignmentUtility(a,G.progressEstimate(a))-best)<1e-8);
  }
});
check('large-team allocation and undo retain method-aware public forecasts without reading hidden ratings',()=>{
  const {s}=start({},2965,13);for(const id of ['small-team','pairing','flexible'])method(s,id);core(s,.2);const original=s.team.map(m=>[m.id,m.job]),p=G.automaticAssignmentPlan(s),other=G.copy(s);other.rng=7;other.ratingRolls={content:-28,framework:-28,commerce:-28,promotion:-28};other.hard=true;assert.deepEqual(G.automaticAssignmentPlan(other),p);if(p.improved){G.autoAssign(s);assert.ok(Math.abs(G.assignmentUtility(s,G.progressEstimate(s))-p.afterUtility)<1e-8);assert.ok(G.undoAutoAssign(s));assert.deepEqual(s.team.map(m=>[m.id,m.job]),original);}assert.ok(G.validateRun(s));
});
check('pause resume and JSON save restore project methods independently while new projects start clean',()=>{
  const {s,meta}=start();method(s,'rapid');method(s,'pairing');assert.ok(G.pauseProject(meta,s));const second=G.newRun({seed:9019},meta);assert.deepEqual(second.methods,[]);method(second,'flexible');const active=G.resumeProject(meta,s.id,second);assert.deepEqual(active.methods,['rapid','pairing']);assert.deepEqual(meta.pausedProjects[0].methods,['flexible']);G.syncCareer(meta,active);const save=JSON.parse(JSON.stringify({meta,run:active}));assert.ok(G.validateSnapshot(save));assert.deepEqual(G.projectMethodStatus(save.run),G.projectMethodStatus(active));
});
check('released and abandoned reports retain project methods without granting them to the next project',()=>{
  for(const released of [false,true]){const {s,meta}=start();method(s,'rapid');if(released)for(const id of ['materials','review'])s.work[id]=s.req[id];const r=G.finish(s,released),career=G.settle(meta,s);assert.deepEqual(r.methods,['rapid']);assert.deepEqual(career.history[0].methods,['rapid']);const next=G.newRun({},career);assert.deepEqual(next.methods,[]);assert.deepEqual(next.methodStages,[]);}
});
const app=fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),slice=(a,b)=>app.slice(app.indexOf('  function '+a+'('),app.indexOf('  function '+b+'('));
check('compact method panel exposes both tradeoffs current effects and automatic assignment coverage',()=>{
  const {s}=start();for(const id of ['rapid','pairing','flexible'])method(s,id);const c={G,esc:String},before=JSON.stringify(s);vm.runInNewContext(slice('projectMethodsPanel','game')+';this.draw=projectMethodsPanel',c);const html=c.draw(s);assert.ok(html.startsWith('<details')&&!html.startsWith('<details open'));for(const text of ['快速原型','结对协作','灵活转岗','预估与自动分配已计入','发行托管产能独立计算','效率 −10%'])assert.ok(html.includes(text),text);assert.equal(JSON.stringify(s),before);
});
check('publisher UI and confirmation show scale staffing and remaining listing time using the same rules',()=>{
  const {s}=start({scale:'large'}),c={run:s,G,busy:()=>false,yen:n=>'¥'+n,esc:String,fundingSchedule:()=>'',marketing:()=>'',bar:()=>'',disabled:()=>'',dialogHeader:()=>'',showDialog:x=>c.html=x};vm.runInNewContext(slice('publisherPanel','logs')+';this.panel=publisherPanel;this.confirm=confirmPublisher',c);const before=JSON.stringify(s),html=c.panel();for(const text of ['每项 90 点／周','名誉基础 20 点 × 规模配置 4.5','24 周'])assert.ok(html.includes(text),text);c.confirm();assert.ok(c.html.includes('每项每周 90 点')&&c.html.includes('24 周'));assert.equal(JSON.stringify(s),before);
});
check('the classified manual documents methods and scaled staffing and the offline build includes the current engine',()=>{
  const c={G,yen:n=>'¥'+n},before=G.emptyMeta();vm.runInNewContext(slice('manualSections','help')+';this.sections=manualSections',c);const sections=c.sections();assert.equal(sections.length,8);const text=sections.map(s=>s.body).join('');for(const key of ['本项目制作方法','快速原型','结对协作','4／8／12／24','4／6／8／14'])assert.ok(text.includes(key),key);const offline=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.ok(offline.includes('v'+require('../package.json').version+' DEMO')&&offline.includes('loop_studio_career_v19'));assert.ok(offline.includes('const PROJECT_METHODS=['));assert.equal(before.reputation,0);
});
report.checks=checks;report.methodOfferSeeds=80;report.exhaustiveMethodPlans=4;report.limits=['Cycle fixtures isolate publisher listing at fixed signed speed; events remain active but cannot directly advance listing.','Method production uses public project progress and roster size; no hidden rating or market prediction.','Browser verification is recorded separately.'];
fs.writeFileSync(require('node:path').join(__dirname,'v019-verification.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({v019Checks:checks,listingCycleCases:report.cycles.length,methodOfferSeeds:80,exhaustiveMethodPlans:4}));
