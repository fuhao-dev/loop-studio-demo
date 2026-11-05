const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){fn();checks++;}
function spentRun(amount=2600){const meta=G.emptyMeta(),s=G.newRun({seed:55401},meta);s.money-=amount;s.spent+=amount;return {meta,s};}
check('fresh funds and exact launch threshold cannot claim',()=>{
  const m=G.emptyMeta();assert.equal(G.startupAidStatus(m).eligible,false);m.wallet=G.scalePlan('micro').minFunds;
  const before=JSON.stringify(m);assert.equal(G.claimStartupAid(m),0);assert.equal(JSON.stringify(m),before);
  m.wallet--;assert.equal(G.startupAidStatus(m).amount,2161);
});
check('empty funds recover enough money to start the next game',()=>{
  const m=G.emptyMeta();m.wallet=0;assert.throws(()=>G.newRun({},m),/资金不足/);
  assert.equal(G.claimStartupAid(m),G.INITIAL_FUNDS);assert.equal(m.wallet,7600);
  assert.equal(G.newRun({},m).initialMoney,7600);
});
check('aid preserves skills team experience stage and every history record',()=>{
  const m=G.emptyMeta();m.wallet=123;m.hero.skills.code=165;m.exp=80;m.earnedExp=120;m.knownPartners=['lin','shen'];m.partners=['lin'];
  m.history=[{runId:'previous',revenue:3000,profit:-100}];m.receipts.previous=40;m.stage=4;
  const before=G.copy(m);assert.equal(G.claimStartupAid(m),7477);before.wallet=7600;assert.deepEqual(m,before);
});
check('active aid uses current funds and keeps the project ledger balanced',()=>{
  const {meta,s}=spentRun();const before=G.copy(s);
  assert.equal(meta.wallet,7600);assert.equal(s.money,5000);
  assert.equal(G.claimStartupAid(meta,s),2600);assert.equal(meta.wallet,s.money);assert.equal(s.sharedCashDelta,2600);
  assert.equal(s.initialMoney+s.sharedCashDelta+s.income-s.spent,s.money);
  for(const key of ['week','rng','seed','work','softCaps','team','features','spent','income','pendingEvent'])assert.deepEqual(s[key],before[key],key);
  assert.ok(G.validateSnapshot({meta,run:s}));
});
check('repeated clicks do not mint another payment',()=>{
  const {meta,s}=spentRun();G.claimStartupAid(meta,s);const before=JSON.stringify({meta,s});
  assert.equal(G.claimStartupAid(meta,s),0);assert.equal(JSON.stringify({meta,s}),before);
});
check('claiming again requires funds to fall below the launch threshold again',()=>{
  const {meta,s}=spentRun();G.claimStartupAid(meta,s);s.money-=2100;s.spent+=2100;
  assert.equal(G.claimStartupAid(meta,s),0);s.money-=100;s.spent+=100;
  assert.equal(G.claimStartupAid(meta,s),2200);assert.equal(s.sharedCashDelta,4800);
});
check('wrong missing or paused active project cannot receive a grant',()=>{
  for(const edit of [()=>null,s=>({...s,id:'other'}),s=>({...s,paused:true}),s=>({...s,money:-1})]){
    const {meta,s}=spentRun();meta.wallet=5000;const wrong=edit(s),before=JSON.stringify({meta,s,wrong});
    assert.equal(G.claimStartupAid(meta,wrong),0);assert.equal(JSON.stringify({meta,s,wrong}),before);
  }
});
check('a finished project must settle before receiving career assistance',()=>{
  const {meta,s}=spentRun();G.finish(s,false);const before=JSON.stringify({meta,s});
  assert.equal(G.claimStartupAid(meta,s),0);assert.equal(JSON.stringify({meta,s}),before);
  const next=G.settle(meta,s),report=G.copy(next.history);assert.equal(G.claimStartupAid(next,s),2600);
  assert.deepEqual(next.history,report);assert.equal(G.settle(next,s).wallet,7600);
});
check('paused projects resume with the subsidy as shared cash and retain progress',()=>{
  const {meta,s}=spentRun();s.work.payment=10;G.pauseProject(meta,s);const before=G.copy(meta.pausedProjects[0]);
  assert.equal(G.claimStartupAid(meta),2600);assert.deepEqual(meta.pausedProjects[0],before);
  const resumed=G.resumeProject(meta,s.id);assert.equal(resumed.money,7600);assert.equal(resumed.sharedCashDelta,2600);
  assert.deepEqual(resumed.work,before.work);assert.equal(resumed.rng,before.rng);assert.ok(G.validateSnapshot({meta,run:resumed}));
});
check('aid cannot turn a losing project into a profitable project',()=>{
  const {meta,s}=spentRun();G.claimStartupAid(meta,s);s.work.materials=s.req.materials;s.work.review=s.req.review;
  const r=G.finish(s,true);assert.equal(r.profit,r.revenue+s.income-r.cost);assert.equal(r.sharedCashDelta,2600);
  assert.equal(r.walletStart+r.sharedCashDelta+r.profit,r.walletEnd);assert.equal(G.settle(meta,s).wallet,r.walletEnd);
});
check('aid availability and preview do not change random outcomes or any state',()=>{
  const {meta,s}=spentRun(),before=JSON.stringify({meta,s});
  for(let i=0;i<20;i++){assert.equal(G.startupAidStatus(meta,s).eligible,true);G.forecast(s);}
  assert.equal(JSON.stringify({meta,s}),before);
});
check('recovery banner disappears after aid and exposes exact eligibility and amount',()=>{
  const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
  const code=source.slice(source.indexOf('  function startupAidNotice('),source.indexOf('  function careerStats('));
  const meta=G.emptyMeta();meta.wallet=4806;const context={G,meta,run:null,yen:n=>'¥'+n.toLocaleString('zh-CN')};
  const render=vm.runInNewContext(code+';startupAidNotice',context),markup=render();
  assert.ok(markup.includes('¥2,794')&&markup.includes('¥7,600')&&markup.includes('¥5,440')&&markup.includes('data-action="startup-aid"'));
  G.claimStartupAid(meta);assert.equal(render(),'');
});
console.log(JSON.stringify({startupAidChecks:checks}));
