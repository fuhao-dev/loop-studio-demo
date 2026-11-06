const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
function start(spent=0,seed=95501){const meta=G.emptyMeta(),s=G.newRun({seed},meta);s.spent=spent;s.money-=spent;return {meta,s};}
function ledger(s,r){assert.equal(r.revenue,r.organicRevenue+r.adRevenue);assert.equal(r.profit,r.revenue+r.recovery+s.income-s.spent);assert.equal(s.initialMoney+s.sharedCashDelta+r.profit,s.money);}
const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
function load(from,to,context){vm.runInNewContext(source.slice(source.indexOf('  function '+from+'('),source.indexOf('  '+to)),context);}
function ui(s,meta=G.emptyMeta()){
  const context={G,run:s,meta,esc:x=>String(x).replace(/</g,'&lt;'),yen:n=>(n<0?'−':'')+'¥'+Math.abs(Math.round(n)),showDialog:x=>context.markup=x,dialogHeader:()=>'',disabled:ok=>ok?'':' disabled'};
  load('incomeRange','const pct=',context);return context;
}
check('ending an active project recovers investment and settles cash experience and history',()=>{
  const {meta,s}=start(2600);s.milestones=['prototype','slice'];s.income=200;s.money+=200;const r=G.endProject(meta,s.id,s);
  assert.ok(r&&!r.released&&s.over);assert.equal(r.revenue,0);assert.equal(r.exp,16);assert.equal(r.objectiveOK,false);
  assert.equal(meta.activeRunId,null);assert.equal(meta.wallet,s.money);assert.equal(meta.exp,16);assert.equal(meta.receipts[s.id],16);assert.deepEqual(meta.history,[r]);ledger(s,r);assert.ok(G.validateSnapshot({meta,run:s}));
});
check('recovery is an integer 10 to 50 percent drawn once and includes all project costs',()=>{
  const rates=new Set();for(let seed=1;seed<=400;seed++){
    const {meta,s}=start(1001,seed);s.adSpend=600;const r=G.endProject(meta,s.id,s);rates.add(Math.round(r.recoveryRate*100));
    assert.ok(r.recoveryRate>=.1&&r.recoveryRate<=.5);assert.equal(r.recovery,Math.round(1001*r.recoveryRate));assert.equal(r.adRevenue,0);assert.equal(r.adNetRevenue,-600);ledger(s,r);
  }assert.ok(rates.has(10)&&rates.has(50));assert.equal(rates.size,41);
});
check('no investment yields zero recovery without consuming random outcomes',()=>{
  const {meta,s}=start(),rng=s.rng,r=G.endProject(meta,s.id,s);assert.equal(r.recovery,0);assert.equal(r.recoveryRate,null);assert.equal(s.rng,rng);assert.equal(meta.wallet,7600);
});
check('a pending event and an exhausted balance never prevent ending a project',()=>{
  const {meta,s}=start(7600);s.pendingEvent='bug';s.pendingCapGroup='content';const work=G.copy(s.work),r=G.endProject(meta,s.id,s);
  assert.ok(r);assert.equal(s.pendingEvent,null);assert.equal(s.pendingCapGroup,null);assert.deepEqual(s.work,work);assert.ok(G.validateSnapshot({meta,run:s}));
});
check('repeat finish clicks settle and reload cannot duplicate recovery or experience',()=>{
  const {meta,s}=start(6000);G.endProject(meta,s.id,s);const restored=G.copy({meta,run:s}),before=JSON.stringify(restored);
  assert.equal(G.endProject(restored.meta,s.id,restored.run),false);assert.equal(G.finish(restored.run,false),false);assert.deepEqual(G.settle(restored.meta,restored.run),restored.meta);assert.equal(JSON.stringify(restored),before);
});
check('ending a paused project works without requiring funds to resume it',()=>{
  const {meta,s}=start(7600);s.pendingEvent='bug';G.pauseProject(meta,s);const r=G.endProject(meta,s.id);
  assert.ok(r);assert.equal(meta.activeRunId,null);assert.equal(meta.pausedProjects.length,0);assert.equal(meta.wallet,r.recovery);assert.ok(G.validateSnapshot({meta,run:null}));
});
check('ending a paused project preserves the active project work event RNG and roster',()=>{
  const {meta,s:a}=start(500);a.pendingEvent='bug';G.pauseProject(meta,a);const b=G.newRun({seed:95502},meta);G.advance(b);const before=G.copy(b),r=G.endProject(meta,a.id,b);
  assert.ok(r);assert.equal(meta.activeRunId,b.id);assert.equal(meta.wallet,b.money);assert.equal(b.money,before.money+r.recovery);assert.equal(b.sharedCashDelta,before.sharedCashDelta+r.recovery);
  for(const key of ['work','week','rng','pendingEvent','team','spent','income','adSpend','morale','debt'])assert.deepEqual(b[key],before[key],key);
  assert.equal(r.walletStart+r.sharedCashDelta+r.profit,r.walletEnd);assert.ok(G.validateSnapshot({meta,run:b}));
});
check('paused recovery never replaces newer global skills or team changes',()=>{
  const {meta,s}=start(1000);G.pauseProject(meta,s);meta.exp=meta.earnedExp=200;G.train(meta,'code');meta.knownPartners=['lin'];G.hirePartner(meta,'lin');G.renameHero(meta,'新制作人');const profile=G.copy(meta.hero),partners=G.copy(meta.partners);
  G.endProject(meta,s.id);assert.deepEqual(meta.hero,profile);assert.deepEqual(meta.partners,partners);assert.deepEqual(meta.knownPartners,['lin']);
});
check('invalid or stale project identities cannot change career money or any RNG',()=>{
  const {meta,s:a}=start(1000);G.pauseProject(meta,a);const b=G.newRun({},meta);
  for(const [id,current] of [['missing',b],[a.id,null],[a.id,{...b,id:'wrong'}],[b.id,{...b,over:true}]]){
    const before=JSON.stringify({meta,a,b,current});assert.equal(G.endProject(meta,id,current),false);assert.equal(JSON.stringify({meta,a,b,current}),before);
  }
});
check('all paused projects must end before a grant including after the active project ends',()=>{
  const {meta,s:a}=start(0);G.pauseProject(meta,a);const b=G.newRun({},meta);G.pauseProject(meta,b);const c=G.newRun({},meta);c.spent=6000;c.money-=6000;
  G.endProject(meta,c.id,c);assert.equal(G.startupAidStatus(meta).unfinished,2);assert.equal(G.claimStartupAid(meta),0);
  G.endProject(meta,a.id);assert.equal(G.claimStartupAid(meta),0);G.endProject(meta,b.id);assert.ok(G.claimStartupAid(meta)>0);assert.equal(meta.wallet,7600);
});
check('cross-project recoveries balance each individual report and the shared wallet',()=>{
  const {meta,s:a}=start(800);G.pauseProject(meta,a);const b=G.newRun({},meta);b.spent=1200;b.money-=1200;G.endProject(meta,a.id,b);const rb=G.endProject(meta,b.id,b);
  ledger(b,rb);assert.equal(meta.wallet,7600+meta.history.reduce((n,r)=>n+r.profit,0));assert.ok(G.validateSnapshot({meta,run:b}));
});
check('income is fully hidden at zero publicity even with high work and buying investment',()=>{
  const {s}=start(2000);s.adSpend=1000;for(const j of G.JOBS)if(j.id!=='publicity'){if(j.group!=='release')s.softCaps[j.id]=1;s.work[j.id]=s.req[j.id];}
  const v=G.incomeView(s);assert.equal(v.visible,false);assert.equal(v.level,0);for(const k of ['revenue','profit','adGross','adNet','adRate'])assert.equal(v[k],null);
});
check('publicity unlocks five stages at the exact specified boundaries',()=>{
  const {s}=start();for(const [p,level] of [[0,0],[.0001,1],[.24999,1],[.25,2],[.49999,2],[.5,3],[.74999,3],[.75,4],[.99999,4],[1,5]]){s.work.publicity=s.req.publicity*p;const v=G.incomeView(s);assert.equal(v.level,level);assert.equal(v.visible,level>0);}
});
check('revealed estimates round outward and never exclude the underlying forecast',()=>{
  for(let seed=1;seed<=80;seed++)for(const p of [.01,.25,.5,.75,1]){
    const {s}=start(2100,seed);s.adSpend=1700;if(seed%2)G.signPublisher(s);s.softCaps.publicity=1;s.work.publicity=s.req.publicity*p;
    const v=G.incomeView(s),f=G.forecast(s);for(const [k,low,high] of [['revenue',f.low,f.high],['profit',f.low+s.income-s.spent,f.high+s.income-s.spent],['adGross',f.ad.low,f.ad.high],['adNet',f.ad.netLow,f.ad.netHigh]]){assert.ok(v[k].low<=low&&v[k].high>=high,k);assert.ok(Number.isInteger(v[k].low)&&Number.isInteger(v[k].high));if(p===1)assert.deepEqual(v[k],{low,high});}
  }
});
check('revealing income never consumes random outcomes or pre-draws the market result',()=>{
  const {s}=start(2000);s.work.publicity=s.req.publicity*.5;const before=JSON.stringify(s);for(let i=0;i<100;i++)G.incomeView(s);assert.equal(JSON.stringify(s),before);assert.equal(G.incomeView(s).marketMultiplier,undefined);
});
check('publicity is optional and a zero-publicity release reveals actual receipts',()=>{
  const {s}=start(1500);s.adSpend=500;s.work.materials=s.req.materials;s.work.review=s.req.review;assert.equal(G.incomeView(s).visible,false);
  const r=G.finish(s,true),v=G.incomeView(s);assert.ok(r);assert.equal(v.level,5);assert.deepEqual(v.revenue,{low:r.revenue,high:r.revenue});assert.deepEqual(v.profit,{low:r.profit,high:r.profit});assert.equal(r.recovery,0);
});
check('hidden income cannot leak through objectives marketing or release confirmation',()=>{
  const {meta,s}=start(1500),context=ui(s,meta);s.adSpend=500;s.work.materials=s.req.materials;s.work.review=s.req.review;
  load('strategyPanel','function job(',context);load('marketing','function eventPanel(',context);load('release','function help(',context);
  const objective=vm.runInNewContext('strategyPanel(run,null)',context),marketing=vm.runInNewContext('marketing(run,true)',context);vm.runInNewContext('release()',context);
  assert.match(objective,/objective-value gold">\?{5}<small>/);assert.match(marketing,/预计买量总回款<\/span><b>\?{5}/);assert.match(marketing,/预计买量净回款<\/span><b class="">\?{5}/);
  for(const label of ['当前认知收入区间','其中工作室买量到账','工作室买量净回款区间'])assert.ok(context.markup.includes(label+'</label><strong>?????</strong>'));
  s.work.publicity=s.req.publicity*.25;assert.match(vm.runInNewContext('incomeRange(run)',context),/^约 ¥/);
});
check('confirmation and cancellation preview recovery bounds without drawing the result',()=>{
  const {meta,s}=start(2600),context=ui(s,meta),before=JSON.stringify({meta,s});load('confirmEndProject','function endCurrentOrPausedProject(',context);vm.runInNewContext('confirmEndProject(run.id)',context);
  assert.equal(JSON.stringify({meta,s}),before);assert.ok(context.markup.includes('¥260—¥1300'));assert.ok(context.markup.includes('data-id="'+s.id+'"'));assert.ok(context.markup.includes('无法继续开发'));
});
check('history exposes end actions for active and paused projects and lists recovery separately',()=>{
  const {meta,s:a}=start(500);G.pauseProject(meta,a);const b=G.newRun({},meta),context=ui(b,meta);Object.assign(context,{historyFilter:'all',title:()=>'',bar:()=>''});load('projectEntries','function pauseCurrentProject(',context);
  let markup=vm.runInNewContext('developmentHistory()',context);assert.equal((markup.match(/data-action="end-project"/g)||[]).length,2);
  const r=G.endProject(meta,a.id,b);markup=vm.runInNewContext('developmentHistory()',context);assert.ok(markup.includes('结束回收'));assert.ok(markup.includes('回收比例 '+Math.round(r.recoveryRate*100)+'%'));assert.equal((markup.match(/data-action="end-project"/g)||[]).length,1);
});
check('aborted reports show actual recovery with no quality or revenue forecast reveal',()=>{
  const {meta,s}=start(1000),r=G.endProject(meta,s.id,s),context=ui(s,meta);load('result','function release(',context);vm.runInNewContext('result()',context);
  assert.ok(context.markup.includes('结束项目回收')&&context.markup.includes('结果已保存'));assert.equal(r.marketMultiplier,null);assert.equal(r.ratings,null);assert.equal(G.incomeView(s).visible,false);
});
console.log(JSON.stringify({v95Checks:checks,recoverySamples:400,incomePreviewCases:400}));
