const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){try{fn();checks++;}catch(error){error.message=name+': '+error.message;throw error;}}
function start(hard=false,seed=42){const meta=G.emptyMeta();meta.wallet=300000;return {meta,s:G.newRun({hard,seed},meta)};}
function pending(s,id){s.pendingEvent=id;s.pendingChoices=null;s.pendingCapGroup=null;}
function numericState(s){return G.copy({money:s.money,spent:s.spent,income:s.income,work:s.work,softCaps:s.softCaps,debt:s.debt,morale:s.morale,effects:s.effects,knownPartners:s.knownPartners,milestones:s.milestones,week:s.week,rng:s.rng,adSpend:s.adSpend,publisher:s.publisher});}
function pick(s,index=0){assert.ok(G.resolveEvent(s,index));if(s.eventResult?.unread)assert.ok(G.acknowledgeEvent(s));}
const originalIds=['inspiration','palette','discount','feedback','coffee','break','backup','scope','showcase','bug','forms','compat','tired','debt','monetization','pricing','ip_plan','ad_plan','store_page','scale_review','market_rival','market_watch','cash_review','team_exchange'];
check('all original event identities remain alongside the three new method discussions',()=>{
  assert.deepEqual(G.EVENTS.slice(0,24).map(e=>e.id),originalIds);
  assert.equal(new Set(G.EVENTS.map(e=>e.id)).size,123);
  for(const [kind,count] of [['ambient',36],['hidden',36],['publisher',12]])assert.equal(G.EVENTS.filter(e=>e.kind===kind).length,count);assert.equal(G.EVENTS.filter(e=>!e.kind).length,36);
});
check('all ambient options leave every numerical value and RNG unchanged in both modes',()=>{
  for(const hard of [false,true])for(const e of G.EVENTS.filter(e=>e.kind==='ambient'))for(let i=0;i<e.choices.length;i++){
    const {s}=start(hard);s.debt=4;s.morale=60;pending(s,e.id);const before=numericState(s);
    assert.ok(G.resolveEvent(s,i));assert.deepEqual(numericState(s),before);assert.deepEqual(s.eventResult.details,['没有发生任何数值变化。']);assert.ok(G.validateRun(s));
  }
});
check('hidden and ambient choices expose identical label-only presentation and valid options',()=>{
  for(const e of G.EVENTS.filter(e=>['ambient','hidden'].includes(e.kind))){const {s}=start();s.money=0;pending(s,e.id);const before=JSON.stringify(s),shown=G.event(s);
    assert.equal(shown.kind,'daily');assert.equal(shown.tag,'工作室日常');for(let i=0;i<shown.choices.length;i++){assert.deepEqual(Object.keys(shown.choices[i]),['label']);assert.ok(G.eventChoiceStatus(s,i).ok);}
    assert.equal(JSON.stringify(s),before);assert.ok(!/resultText|hint|cash|effect|caps|bonus/.test(JSON.stringify(shown)));
  }
});
check('a hidden result reveals its exact applied effect only after selecting',()=>{
  const {s}=start();pending(s,'hidden_folder');assert.ok(!JSON.stringify(G.event(s)).includes('软上限'));const before=s.work.theme;
  assert.ok(G.resolveEvent(s,0));assert.equal(s.softCaps.theme,.85);assert.equal(s.work.theme,before);assert.ok(s.eventResult.text.includes('世界观'));assert.ok(s.eventResult.details.includes('题材软上限 70% → 85%'));
});
check('hidden negative effects never remove completion even in real mode',()=>{
  for(const hard of [false,true])for(const e of G.EVENTS.filter(e=>e.kind==='hidden'))for(let i=0;i<e.choices.length;i++){
    const {s}=start(hard);for(const j of G.JOBS)s.work[j.id]=s.req[j.id]*.5;pending(s,e.id);const work=G.copy(s.work),rng=s.rng;
    assert.ok(G.resolveEvent(s,i));assert.deepEqual(s.work,work);assert.equal(s.rng,rng);assert.ok(s.eventResult.details.every(d=>!d.includes('undefined')));assert.ok(G.validateRun(s));
  }
});
check('hidden efficiency and maintenance results disclose numeric magnitude and duration',()=>{
  const {s}=start();pending(s,'hidden_build');pick(s);assert.ok(s.eventResult.details.includes('程序开发效率 +18% · 持续 1 周'));
  pending(s,'hidden_drawer');pick(s,1);assert.ok(s.eventResult.details.includes('维护费 −10% · 持续 2 周'));
});
check('hidden effects report clamped actual results instead of overstating benefits',()=>{
  const {s}=start();s.softCaps.qa=.95;pending(s,'hidden_note');pick(s);assert.equal(s.softCaps.qa,1);assert.deepEqual(s.eventResult.details,['测试软上限 95% → 100%']);
  s.morale=98;pending(s,'hidden_ticket');pick(s);assert.equal(s.morale,100);assert.deepEqual(s.eventResult.details,['士气 +2']);
});
check('selection and outcome survive JSON restore and duplicate choice cannot apply twice',()=>{
  const {s}=start();pending(s,'hidden_mail');const copy=G.copy(s);assert.ok(G.resolveEvent(s,0));assert.ok(G.resolveEvent(copy,0));assert.deepEqual(copy,s);
  const saved=G.copy(s),before=JSON.stringify(saved);assert.equal(G.resolveEvent(saved,0),false);assert.equal(JSON.stringify(saved),before);assert.ok(saved.eventResult.unread);assert.ok(G.validateRun(saved));
});
check('unread results block new development and contracts until acknowledged without charging',()=>{
  const {s}=start();pending(s,'hidden_mail');G.resolveEvent(s,0);const before=JSON.stringify(s);
  assert.equal(G.advance(s).ok,false);assert.equal(G.assignMember(s,'hero','theme'),false);assert.equal(G.signPublisher(s),false);assert.equal(JSON.stringify(s),before);
  assert.ok(G.acknowledgeEvent(s));const done=JSON.stringify(s);assert.equal(G.acknowledgeEvent(s),false);assert.equal(JSON.stringify(s),done);assert.ok(G.advance(s).ok);
});
check('publisher events enter only signed project pools and forged unsigned resolution is rejected',()=>{
  const {s}=start();assert.ok(!G.eventPool(s).some(e=>e.kind==='publisher'));pending(s,'publisher_position');assert.equal(G.resolveEvent(s,0),false);s.pendingEvent=null;
  G.signPublisher(s);assert.ok(G.eventPool(s).some(e=>e.kind==='publisher'));
});
check('publisher advice advances completion within soft caps without changing funds or random state',()=>{
  for(const hard of [false,true]){const {s}=start(hard);G.signPublisher(s);s.work.gameplay=s.req.gameplay*.69;pending(s,'publisher_playtest');const before=numericState(s);pick(s);
    assert.ok(Math.abs(G.progress(s,'gameplay')-.7)<1e-8);assert.equal(s.money,before.money);assert.equal(s.spent,before.spent);assert.equal(s.rng,before.rng);assert.equal(s.adSpend,before.adSpend);assert.ok(s.eventResult.details.some(d=>d.startsWith('玩法完成度 +1%')));assert.ok(G.validateRun(s));
  }
});
check('publisher cap-only advice changes available headroom but never existing work',()=>{
  const {s}=start();G.signPublisher(s);pending(s,'publisher_position');const work=G.copy(s.work);pick(s);for(const id of ['theme','gameplay','subtheme'])assert.equal(s.softCaps[id],.85);assert.deepEqual(s.work,work);
});
check('publisher progress respects content and implementation dependencies',()=>{
  const {s}=start();G.signPublisher(s);s.work.development=s.req.development*.19;pending(s,'publisher_tech');pick(s);assert.equal(G.progress(s,'development'),.2);
  pending(s,'publisher_quality');pick(s);assert.ok(G.progress(s,'qa')<=G.progress(s,'development'));assert.ok(G.validateRun(s));
});
check('every publisher intervention targets only player work and never managed work or its caps',()=>{
  const targets=new Set();for(const hard of [false,true])for(const e of G.EVENTS.filter(e=>e.kind==='publisher'))for(let i=0;i<e.choices.length;i++){
    const {s}=start(hard);G.signPublisher(s);const c=e.choices[i];for(const key of Object.keys(c.progress||{}))targets.add(key);
    for(const id of [...Object.keys(c.progress||{}),...Object.keys(c.caps||{})]){const jobs=G.JOBS.filter(j=>j.id===id||j.group===id);assert.ok(jobs.length);assert.ok(jobs.every(j=>['content','framework','commerce'].includes(j.group)));}
    for(const j of G.JOBS)s.work[j.id]=s.req[j.id]*.5;pending(s,e.id);const before=G.copy(s);pick(s,i);
    for(const id of G.PUBLISHER_JOBS){assert.equal(s.work[id],before.work[id]);assert.equal(G.softCap(s,id),G.softCap(before,id));}assert.equal(G.revealLevel(s),G.revealLevel(before));assert.equal(s.adSpend,before.adSpend);assert.equal(s.publisher.adSpend,before.publisher.adSpend);
  }assert.deepEqual([...targets].sort(),G.JOBS.filter(j=>['content','framework','commerce'].includes(j.group)).map(j=>j.id).sort());
});
check('publisher ad-design advice improves commerce without touching publicity or paid acquisition',()=>{
  const {s}=start();G.signPublisher(s);const budget=s.adBudget;assert.equal(G.revealLevel(s),0);pending(s,'publisher_ads');pick(s);assert.equal(G.progress(s,'ads'),.1);assert.equal(G.revealLevel(s),0);assert.equal(G.progress(s,'acquisition'),0);assert.equal(s.adBudget,budget);assert.equal(s.publisher.adSpend,0);
  for(const payload of [{progress:{publicity:.1}},{progress:{materials:.1}},{caps:{promotion:.15}},{caps:{review:.15}}]){pending(s,'publisher_ads');s.pendingChoices={id:s.pendingEvent,choices:[{label:'invalid',...payload}]};const before=JSON.stringify(s);assert.equal(G.resolveEvent(s,0),false);assert.equal(JSON.stringify(s),before);}
});
check('pool removes irrelevant testing debt fatigue and completed listing events in real time',()=>{
  const {s}=start(),ids=()=>new Set(G.eventPool(s).map(e=>e.id));assert.ok(!ids().has('bug')&&!ids().has('compat')&&!ids().has('debt')&&!ids().has('tired'));
  s.debt=10;s.morale=40;G.assignMember(s,'hero','qa');assert.ok(ids().has('bug')&&ids().has('compat')&&ids().has('debt')&&ids().has('tired'));
  G.signPublisher(s);assert.ok(ids().has('publisher_ip'));s.work.materials=s.req.materials;s.work.review=s.req.review;assert.ok(!ids().has('forms')&&!ids().has('store_page'));assert.ok(ids().has('publisher_ip'));
});
check('all capped work removes wasted cap and publisher progress choices but keeps daily fallback',()=>{
  const {s}=start();G.signPublisher(s);for(const j of G.JOBS){if(j.group!=='release')s.softCaps[j.id]=1;s.work[j.id]=s.req[j.id];}s.morale=100;
  const pool=G.eventPool(s);assert.ok(pool.some(e=>e.kind==='ambient'));assert.ok(!pool.some(e=>e.kind==='publisher'));assert.ok(!pool.some(e=>['inspiration','palette'].includes(e.id)));
});
check('budget and active bottlenecks affect current pool eligibility and weight without RNG draws',()=>{
  const {s}=start();G.assignMember(s,'hero','acquisition');const rng=s.rng;assert.ok(G.eventPool(s).some(e=>e.id==='ad_plan'));G.setAdBudget(s,100);assert.ok(!G.eventPool(s).some(e=>e.id==='ad_plan'));
  G.assignMember(s,'hero','gameplay');const base=G.eventPool(s).find(e=>e.id==='inspiration').weight;s.work.gameplay=s.req.gameplay*.7;assert.ok(G.eventPool(s).find(e=>e.id==='inspiration').weight>base);assert.equal(s.rng,rng);
});
check('pool uses post-week work morale and milestone state, not pre-week snapshot',()=>{
  const {s}=start();s.morale=69;s.pace='crunch';for(const j of G.JOBS.filter(j=>['content','framework'].includes(j.group)))s.work[j.id]=s.req[j.id]*.3;
  assert.ok(!G.eventPool(s).some(e=>e.id==='tired'));G.advance(s);assert.ok(G.eventPool(s).some(e=>e.id==='tired')||s.pendingEvent==='tired');assert.ok(!s.knownPartners.includes('lin'));assert.ok(s.milestones.includes('prototype'));
});
check('live filtering freezes option indexes and reloads the exact pending decision',()=>{
  let chosen;
  for(let seed=1;seed<=400&&!chosen;seed++){const {s}=start(false,seed*99991);G.signPublisher(s);s.work.theme=s.req.theme*.7;G.advance(s);if(s.pendingEvent==='publisher_position')chosen=s;}
  assert.ok(chosen);const shown=G.event(chosen);assert.equal(shown.choices.length,1);assert.equal(shown.choices[0].label,'拓展内容表达');const restored=G.copy(chosen);assert.deepEqual(G.event(restored),shown);pick(chosen);pick(restored);assert.deepEqual(restored,chosen);
});
check('pending hidden decision and revealed receipt survive pause and project resume',()=>{
  const {meta,s}=start();pending(s,'hidden_folder');assert.ok(G.pauseProject(meta,s));let active=G.resumeProject(meta,s.id);assert.equal(G.event(active).choices[0].hint,undefined);G.resolveEvent(active,0);const receipt=G.copy(active.eventResult),cash=active.money;
  G.pauseProject(meta,active);active=G.resumeProject(meta,active.id);assert.deepEqual(active.eventResult,receipt);assert.equal(active.money,cash);assert.equal(G.resolveEvent(active,0),false);assert.ok(G.validateSnapshot({meta,run:active}));
});
check('ending a project with an unread result clears the prompt and settles once',()=>{
  const {meta,s}=start();pending(s,'hidden_mail');G.resolveEvent(s,0);const before=s.money;const result=G.endProject(meta,s.id,s);assert.ok(result);assert.equal(s.eventResult.unread,false);assert.equal(s.money,before);assert.equal(G.endProject(meta,s.id,s),false);
});
check('seeded weekly pools produce all categories with valid live choices and no consecutive repeat',()=>{
  const seen=new Set();for(let seed=1;seed<=480;seed++){const {s}=start(seed%2===0,Math.imul(seed,2654435761)>>>0);if(seed%2)G.signPublisher(s);s.lastEvent='daily_cat';s.debt=9;s.morale=60;const identical=G.copy(s),out=G.advance(s);G.advance(identical);assert.ok(out.ok);assert.equal(s.pendingEvent,identical.pendingEvent);assert.deepEqual(G.event(s),G.event(identical));assert.notEqual(s.pendingEvent,'daily_cat');
    const definition=G.EVENTS.find(e=>e.id===s.pendingEvent);seen.add(definition.kind||'standard');if(definition.kind==='publisher')assert.ok(s.publisher);for(let i=0;i<G.event(s).choices.length;i++)assert.ok(G.eventChoiceStatus(s,i).ok);assert.ok(G.validateRun(s));
  }assert.deepEqual([...seen].sort(),['ambient','hidden','publisher','standard']);
});
check('actual dialog renders no hidden hints before selection and exact numeric results after it',()=>{
  const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),code=source.slice(source.indexOf('  function showEvent(){'),source.indexOf('  function result('));let markup='',kind='';const {s}=start();pending(s,'hidden_folder');
  const ctx={run:s,G,hiddenPrompt:false,P:{voice:()=>'',portrait:()=>''},esc:String,disabled:ok=>ok?'':' disabled',showDialog:(html,k)=>{markup=html;kind=k;},dialogHeader:(eye,title)=>eye+' '+title};vm.createContext(ctx);vm.runInContext(code+';showEvent()',ctx);
  assert.equal(kind,'event');assert.ok(!/软上限|15%|世界观|隐藏|<small>/.test(markup));assert.equal((markup.match(/data-action="event"/g)||[]).length,2);
  G.resolveEvent(s,0);vm.runInContext('showEventResult()',ctx);assert.equal(kind,'event-result');assert.ok(markup.includes('题材软上限 70% → 85%')&&markup.includes('世界观')&&markup.includes('data-action="event-result-done"'));
});
check('publisher dialogs identify the publisher and visible consequences',()=>{
  const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),code=source.slice(source.indexOf('  function showEvent(){'),source.indexOf('  function result('));let markup='';const {s}=start();G.signPublisher(s);pending(s,'publisher_ads');
  vm.runInNewContext(code+';showEvent()',{run:s,G,hiddenPrompt:false,P:{voice:()=>{throw Error('wrong speaker');}},esc:String,disabled:ok=>ok?'':' disabled',showDialog:html=>markup=html,dialogHeader:(eye,title)=>eye+' '+title});assert.ok(markup.includes('发行商代表')&&markup.includes('广告变现完成度 +10%')&&markup.includes('仅协助游戏内容、程序构架和商业化'));
});
check('a frozen paid decision retains a free exit if shared money was spent in another project',()=>{
  let chosen;for(let seed=1;seed<=800&&!chosen;seed++){const {s}=start(false,seed*7919);for(const id of Object.keys(s.softCaps))s.softCaps[id]=1;s.morale=100;G.assignMember(s,'hero','ads');G.advance(s);if(s.pendingEvent==='monetization')chosen=s;}
  assert.ok(chosen);const index=G.event(chosen).choices.findIndex(c=>c.label==='暂时搁置');assert.ok(index>=0);chosen.money=0;const before=numericState(chosen);assert.ok(G.eventChoiceStatus(chosen,index).ok);assert.ok(G.resolveEvent(chosen,index));assert.deepEqual(numericState(chosen),before);
});
check('malformed event snapshots are rejected before rendering',()=>{
  for(const mutate of [s=>s.pendingChoices={id:'other',choices:[{label:'x'}]},s=>s.pendingChoices.choices=[],s=>s.pendingChoices.choices=[{}]]){
    const {s}=start();G.advance(s);assert.ok(G.validateRun(s));mutate(s);assert.equal(G.validateRun(s),false);
  }
  for(const mutate of [s=>s.eventResult.unread='yes',s=>s.eventResult.details=null,s=>s.eventResult.kind='unknown',s=>s.pendingEvent='daily_cat']){
    const {s}=start();pending(s,'hidden_folder');G.resolveEvent(s,0);assert.ok(G.validateRun(s));mutate(s);assert.equal(G.validateRun(s),false);
  }
});
console.log(JSON.stringify({eventChecks:checks,eventCount:G.EVENTS.length,seededSelectionCases:480}));
