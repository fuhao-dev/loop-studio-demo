const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
function start(seed=1,hard=false){const meta=G.emptyMeta();meta.wallet=1000000;return G.newRun({seed,hard},meta);}
function pending(s,id){s.pendingEvent=id;s.pendingChoices=null;s.pendingCapGroup=null;}
const outcomes=G.EVENTS.filter(e=>e.kind==='hidden'),ordinary=G.EVENTS.filter(e=>e.kind==='ambient');
check('project state and previews contain neither removed numeric mechanism',()=>{
  for(const hard of [false,true]){const s=start(12,hard);assert.ok(!('bugs' in s)&&!('ratingBonus' in s));assert.ok(!('bugs' in G.progressEstimate(s)));G.advance(s);G.resolveEvent(s,0);G.acknowledgeEvent(s);assert.ok(!('bugs' in s)&&!('ratingBonus' in s));assert.ok(G.validateRun(s));}
});
check('removed fields cannot influence any score income or production even if injected',()=>{
  const s=start(),before=G.copy(s),score=G.GROUPS.map(g=>G.trueScore(s,g.id)),forecast=G.forecast(s),production=G.progressEstimate(s);s.bugs=9999;s.ratingBonus={content:999,framework:-999,commerce:999,promotion:999};
  assert.deepEqual(G.GROUPS.map(g=>G.trueScore(s,g.id)),score);assert.deepEqual(G.forecast(s),forecast);assert.deepEqual(G.progressEstimate(s),production);delete s.bugs;delete s.ratingBonus;assert.deepEqual(s,before);
});
check('all authored effects and descriptions are free of removed stat payloads',()=>{
  for(const e of G.EVENTS)for(const c of e.choices){assert.ok(!('bugs' in c)&&!('bonus' in c));assert.ok(!/潜力|问题[\s：:+−-]*\d/.test((c.hint||'')+(c.resultText||'')));}
  for(const file of ['engine.js','app.js','characters-ui.js'])assert.ok(!/\bbugs\b|ratingBonus|修复问题|商业化潜力|内容潜力/.test(fs.readFileSync(require.resolve('../dist/'+file),'utf8')),file);
});
check('testing remains useful through completion and creates no continuing phantom cleanup',()=>{
  const s=start();for(const m of s.team)G.assignMember(s,m.id,'idle');G.assignMember(s,'hero','qa');s.debt=5;s.work.development=s.req.development*.5;s.work.systems=s.req.systems*.5;const score=G.trueScore(s,'framework');
  G.advance(s);G.resolveEvent(s,0);G.acknowledgeEvent(s);assert.ok(s.work.qa>0);assert.ok(G.trueScore(s,'framework')>score);assert.equal(s.debt,5);assert.ok(!('bugs' in s));
  s.softCaps.qa=1;s.work.qa=s.req.qa;const warning=G.softCapWarnings(s).find(w=>w.job==='qa');assert.ok(warning);assert.equal(warning.ongoing,'');
});
check('each of 36 daily scenes has both outcome categories with exactly the same story and labels',()=>{
  assert.equal(ordinary.length,36);assert.equal(outcomes.length,36);assert.equal(G.EVENTS.length,120);assert.equal(new Set(G.EVENTS.map(e=>e.id)).size,120);
  for(const a of ordinary){const matches=outcomes.filter(e=>e.scene===a.scene);assert.equal(matches.length,1);const h=matches[0];assert.equal(a.title,h.title);assert.equal(a.text,h.text);assert.equal(a.tag,h.tag);assert.deepEqual(a.choices.map(c=>c.label),h.choices.map(c=>c.label));}
});
check('all paired public event objects and voices are indistinguishable before selection',()=>{
  for(const a of ordinary){const h=outcomes.find(e=>e.scene===a.scene),s=start();pending(s,a.id);const shown=G.event(s),voice=G.teamVoice(s,shown);pending(s,h.id);assert.deepEqual({...G.event(s),id:''},{...shown,id:''});assert.deepEqual(G.teamVoice(s,G.event(s)),voice);}
});
check('actual paired dialogs have byte-identical pre-choice markup with no payload hints',()=>{
  const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8'),code=source.slice(source.indexOf('  function showEvent(){'),source.indexOf('  function result('));
  for(const a of ordinary){const s=start(),h=outcomes.find(e=>e.scene===a.scene);let markup='';const ctx={run:s,G,hiddenPrompt:false,P:{voice:()=>''},esc:String,disabled:ok=>ok?'':' disabled',showDialog:x=>markup=x,dialogHeader:(eye,title)=>eye+title};vm.createContext(ctx);vm.runInContext(code,ctx);pending(s,a.id);vm.runInContext('showEvent()',ctx);const normal=markup;pending(s,h.id);vm.runInContext('showEvent()',ctx);assert.equal(markup,normal);assert.ok(!markup.includes('<small>'));}
});
check('the same title and choice can be a transition or have an actual concealed result',()=>{
  const a=start(),h=G.copy(a);pending(a,'daily_cat');pending(h,'hidden_daily_cat');const before=a.morale;G.resolveEvent(a,0);G.resolveEvent(h,0);assert.equal(a.morale,before);assert.equal(h.morale,before+4);assert.deepEqual(a.eventResult.details,['没有发生任何数值变化。']);assert.ok(h.eventResult.details.includes('士气 +4'));
});
check('daily scenes overlap with regular and publisher stories instead of separating by subject',()=>{
  const scenes=new Set(ordinary.map(e=>e.scene));assert.equal(G.EVENTS.filter(e=>!e.kind&&scenes.has(e.scene)).length,12);assert.equal(G.EVENTS.filter(e=>e.kind==='publisher'&&scenes.has(e.scene)).length,4);
});
check('scene cooldown prevents immediate repeated stories across different outcome categories',()=>{
  const s=start(88441),seen=new Set();for(let i=0;i<200;i++){const previous=s.lastScene;assert.ok(G.advance(s).ok);const e=G.EVENTS.find(e=>e.id===s.pendingEvent);if(e.scene)assert.notEqual(e.scene,previous);seen.add(e.scene);assert.equal(s.lastScene,e.scene||null);if(!e.scene)assert.ok(G.eventPool(s).some(candidate=>candidate.id!==e.id&&!G.EVENTS.find(original=>original.id===candidate.id).scene),'unrelated original events remain eligible');const restored=G.copy(s);assert.deepEqual(G.event(restored),G.event(s));assert.ok(G.resolveEvent(s,0));G.acknowledgeEvent(s);assert.ok(G.validateRun(s));}assert.ok(seen.size>25);
});
check('seeded sampling reaches both versions of several shared scenes without unsigned publisher events',()=>{
  const seen=new Map();for(let i=1;i<=1400;i++){const s=start(Math.imul(i,2654435761)>>>0);G.advance(s);const e=G.EVENTS.find(e=>e.id===s.pendingEvent);assert.notEqual(e.kind,'publisher');if(['ambient','hidden'].includes(e.kind)){if(!seen.has(e.scene))seen.set(e.scene,new Set());seen.get(e.scene).add(e.kind);}}
  assert.ok([...seen.values()].filter(kinds=>kinds.size===2).length>=20);
});
check('every publisher suggestion stays inside the three player groups after expansion',()=>{
  const list=G.EVENTS.filter(e=>e.kind==='publisher');assert.equal(list.length,12);for(const e of list)for(let index=0;index<e.choices.length;index++){const s=start();G.signPublisher(s);const before=G.copy(s);pending(s,e.id);assert.ok(G.resolveEvent(s,index));for(const id of G.PUBLISHER_JOBS){assert.equal(s.work[id],before.work[id]);assert.equal(G.softCap(s,id),G.softCap(before,id));}assert.equal(s.adBudget,before.adBudget);assert.equal(s.publisher.adSpend,before.publisher.adSpend);}
});
console.log(JSON.stringify({eventExpansionChecks:checks,totalEvents:120,sharedDailyScenes:36,seededCases:1400,cooldownWeeks:200}));
