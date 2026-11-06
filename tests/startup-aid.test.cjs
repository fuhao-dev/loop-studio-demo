const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
function spentRun(amount=2600){const meta=G.emptyMeta(),s=G.newRun({seed:55401},meta);s.money-=amount;s.spent+=amount;return {meta,s};}
check('fresh funds and exact launch threshold cannot claim',()=>{
  const m=G.emptyMeta();assert.equal(G.startupAidStatus(m).eligible,false);m.wallet=G.scalePlan('micro').minFunds;
  const before=JSON.stringify(m);assert.equal(G.claimStartupAid(m),0);assert.equal(JSON.stringify(m),before);
  m.wallet--;assert.equal(G.startupAidStatus(m).amount,2161);
});
check('empty funds recover enough money to start the next game',()=>{
  const m=G.emptyMeta();m.wallet=0;assert.throws(()=>G.newRun({},m),/资金不足/);
  assert.equal(G.claimStartupAid(m),7600);assert.equal(G.newRun({},m).initialMoney,7600);
});
check('aid preserves skills team experience stage and every history record',()=>{
  const m=G.emptyMeta();m.wallet=123;m.hero.skills.code=165;m.exp=80;m.earnedExp=120;m.reputation=40;m.knownPartners=['lin','shen'];m.partners=['lin'];
  m.history=[{runId:'previous',revenue:3000,profit:-100}];m.receipts.previous=40;m.stage=4;
  const before=G.copy(m);assert.equal(G.claimStartupAid(m),7477);before.wallet=7600;assert.deepEqual(m,before);
});
check('active project cannot receive aid even when it cannot afford another week',()=>{
  const {meta,s}=spentRun(7500),before=JSON.stringify({meta,s});
  const aid=G.startupAidStatus(meta,s);assert.equal(aid.eligible,false);assert.equal(aid.lowFunds,true);assert.equal(aid.unfinished,1);
  assert.equal(G.claimStartupAid(meta,s),0);assert.equal(JSON.stringify({meta,s}),before);
});
check('repeated clicks do not mint another payment',()=>{
  const m=G.emptyMeta();m.wallet=100;assert.equal(G.claimStartupAid(m),7500);const before=JSON.stringify(m);
  assert.equal(G.claimStartupAid(m),0);assert.equal(JSON.stringify(m),before);
});
check('a later grant requires finishing the next project and falling below threshold again',()=>{
  const m=G.emptyMeta();m.wallet=100;G.claimStartupAid(m);const s=G.newRun({seed:55401},m);s.spent=6000;s.money-=6000;
  assert.equal(G.claimStartupAid(m,s),0);G.endProject(m,s.id,s);assert.ok(m.wallet<5440);
  assert.equal(G.claimStartupAid(m,s),7600-s.money);assert.equal(m.wallet,7600);
});
check('wrong missing or invalid active project cannot receive a grant',()=>{
  for(const edit of [()=>null,s=>({...s,id:'other'}),s=>({...s,paused:true}),s=>({...s,money:-1})]){
    const {meta,s}=spentRun();meta.wallet=5000;const wrong=edit(s),before=JSON.stringify({meta,s,wrong});
    assert.equal(G.claimStartupAid(meta,wrong),0);assert.equal(JSON.stringify({meta,s,wrong}),before);
  }
});
check('a finished project must settle before aid and the historical report stays fixed',()=>{
  const {meta,s}=spentRun(6000);G.finish(s,false);const before=JSON.stringify({meta,s});
  assert.equal(G.claimStartupAid(meta,s),0);assert.equal(JSON.stringify({meta,s}),before);
  const next=G.settle(meta,s),report=G.copy(next.history),amount=7600-next.wallet;
  assert.equal(G.claimStartupAid(next,s),amount);assert.deepEqual(next.history,report);assert.equal(G.settle(next,s).wallet,7600);
});
check('pausing cannot bypass the requirement to finish all unfinished projects',()=>{
  const {meta,s}=spentRun(6000);G.pauseProject(meta,s);const before=JSON.stringify(meta);
  assert.equal(G.startupAidStatus(meta).unfinished,1);assert.equal(G.claimStartupAid(meta),0);assert.equal(JSON.stringify(meta),before);
  G.endProject(meta,s.id);assert.equal(meta.pausedProjects.length,0);assert.ok(G.claimStartupAid(meta)>0);
});
check('aid after settlement never changes project profit or adds a project cash transfer',()=>{
  const {meta,s}=spentRun(6000),r=G.endProject(meta,s.id,s),profit=r.profit;
  assert.equal(r.sharedCashDelta,0);assert.equal(r.walletStart+r.profit,r.walletEnd);
  G.claimStartupAid(meta,s);assert.equal(meta.history[0].profit,profit);assert.equal(s.result.profit,profit);assert.equal(meta.wallet,7600);
  const next=G.newRun({},meta);assert.equal(next.money,7600);assert.equal(next.sharedCashDelta,0);
});
check('availability and income previews never change money random outcomes or any state',()=>{
  const {meta,s}=spentRun(),before=JSON.stringify({meta,s});
  for(let i=0;i<20;i++){assert.equal(G.startupAidStatus(meta,s).eligible,false);G.incomeView(s);}
  assert.equal(JSON.stringify({meta,s}),before);
});
check('banner shows an unfinished-project explanation then an exact claim after settlement',()=>{
  const source=fs.readFileSync(require.resolve('../dist/app.js'),'utf8');
  const code=source.slice(source.indexOf('  function startupAidNotice('),source.indexOf('  function careerStats('));
  const {meta,s:run}=spentRun(6000);G.syncCareer(meta,run);const context={G,meta,run,yen:n=>'¥'+n.toLocaleString('zh-CN')};
  const render=vm.runInNewContext(code+';startupAidNotice',context);let markup=render();
  assert.ok(markup.includes('结束项目后')&&markup.includes('含暂停项目')&&!markup.includes('data-action="startup-aid"'));
  G.endProject(meta,run.id,run);markup=render();assert.ok(markup.includes('¥5,440')&&markup.includes('¥7,600')&&markup.includes('data-action="startup-aid"'));
  G.claimStartupAid(meta);assert.equal(render(),'');
});
console.log(JSON.stringify({startupAidChecks:checks}));
