
const assert=require('node:assert/strict');
const G=require('../dist/engine.js');
const {resolve}=require('./work-sim.cjs');

let checks=0,cycleCases=0;
function check(name,fn){try{fn();checks++;}catch(e){e.message=name+': '+e.message;throw e;}}
function start(config={},reputation=0,teamSize=2){
  const meta=G.emptyMeta();
  meta.wallet=3000000;
  meta.reputation=reputation;
  meta.knownPartners=G.reputationPartners(meta);
  meta.partners=meta.knownPartners.slice(0,teamSize-2);
  return {meta,s:G.newRun({seed:12020,...config},meta)};
}
function week(s){assert.ok(G.advance(s).ok);resolve(s);assert.ok(G.validateRun(s));}
function listingReady(s){for(const id of ['materials','review'])s.work[id]=s.req[id];}

check('mid-project agency signing retains publicity, budget, existing progress, and unmanaged locks',()=>{
  const {s}=start({},2965,3),other=s.team[2];
  assert.ok(G.assignMember(s,'hero','materials'));
  assert.ok(G.assignMember(s,'ace','publicity'));
  assert.ok(G.setAssignmentLock(s,'hero',true));
  assert.ok(G.setAssignmentLock(s,'ace',true));
  assert.ok(G.setAdBudget(s,600));
  week(s);
  const before=G.copy(s);
  assert.equal(G.signPublisher(s,'unknown'),false);
  assert.ok(G.signPublisher(s,'listing'));
  assert.equal(G.publisherKind(s),'listing');
  assert.equal(s.team[0].job,'idle');
  assert.equal(s.team[1].job,'publicity');
  assert.equal(other.job,before.team[2].job);
  assert.deepEqual(s.assignmentLocks,['ace']);
  assert.equal(s.adBudget,600);
  for(const key of ['money','income','adSpend','work','req','rng'])assert.deepEqual(s[key],before[key]);
  assert.deepEqual(G.PUBLISHER_JOBS.filter(id=>G.publisherManaged(s,id)),['materials','review']);
  assert.equal(G.assignMember(s,'hero','review'),false);
  assert.equal(G.signPublisher(s,'full'),false);
  assert.deepEqual(G.publisherFunding(s).stages,[]);
  assert.ok(G.validateRun(s));
});

check('both contracts match across scales, modes, and reputations without assisting listing-route development',()=>{
  for(const scale of G.SCALES)for(const hard of [false,true])for(const reputation of [0,2965]){
    const {s}=start({scale:scale.id,hard},reputation);
    const full=G.publisherQuote(s,'full'),listing=G.publisherQuote(s,'listing'),pacing=G.publisherPacing(s);
    assert.equal(full.weeklyWork,listing.weeklyWork);
    assert.ok(G.signPublisher(s,'listing'));
    for(const m of s.team)G.assignMember(s,m.id,'idle');
    for(let w=0;w<pacing.listingWeeks;w++){
      assert.equal(G.canRelease(s),false);
      assert.ok(!G.eventPool(s).some(e=>e.kind==='publisher'));
      week(s);
      assert.equal(s.history.at(-1).publisherGrant,0);
      assert.equal(s.history.at(-1).publisherAds,0);
    }
    assert.ok(G.canRelease(s));
    assert.equal(G.publisherPacing(s).listingWeeks,0);
    assert.equal(s.work.publicity,0);
    assert.equal(s.work.acquisition,0);
    assert.equal(s.publisher.adSpend,0);
    cycleCases++;
  }
});

check('agency spend and positive or negative ad returns are entirely the studio’s',()=>{
  for(const rating of [0,1]){
    const {s}=start();
    assert.ok(G.assignMember(s,'hero','acquisition'));
    assert.ok(G.setAdBudget(s,100));week(s);
    assert.ok(G.signPublisher(s,'listing'));
    assert.ok(G.setAdBudget(s,300));
    assert.equal(G.cost(s).ads,300);assert.equal(G.cost(s).publisherAds,0);
    week(s);
    assert.equal(s.history.at(-1).ads,300);
    assert.equal(s.adSpend,400);
    assert.equal(s.publisher.adSpend,0);
    assert.ok(G.setAdBudget(s,0));assert.equal(G.throughput(s,'acquisition'),0);
    for(const j of G.JOBS.filter(j=>j.group!=='release')){s.softCaps[j.id]=1;s.work[j.id]=s.req[j.id]*rating;}
    for(const g of G.GROUPS.filter(g=>g.id!=='release'))s.ratingRolls[g.id]=rating?25:-25;
    listingReady(s);
    const projection=G.forecast(s),r=G.finish(s,true);
    assert.equal(r.organicRevenue,Math.floor(r.organicGrossRevenue*.9));
    assert.equal(r.publisherOrganicRevenue,r.organicGrossRevenue-r.organicRevenue);
    assert.ok(r.revenue>=projection.low&&r.revenue<=projection.high);
    assert.equal(r.studioAdSpend,400);
    assert.equal(r.adRevenue,Math.round(400*r.adRate));
    assert.equal(r.adNetRevenue,r.adRevenue-400);
    assert.ok(rating?r.adNetRevenue>0:r.adNetRevenue<0);
    assert.equal(r.publisherAdRevenue,0);
    assert.equal(r.publisherAdLoss,0);
    assert.equal(r.grossProductSales,r.organicGrossRevenue+r.adRevenue);
    assert.equal(r.earnedReputation,Math.round(r.grossProductSales*.8/100*1000)/1000);
    assert.equal(r.profit,r.revenue-r.cost);
  }
});

check('agency pause freezes listing, restores the locked contract, and terminates without clawback',()=>{
  const {s,meta}=start({scale:'large'});
  G.signPublisher(s,'listing');week(s);
  const quote=G.copy(s.publisher.quote),work=G.copy(s.work);
  assert.ok(G.pauseProject(meta,s));
  const other=G.newRun({seed:4},meta);
  week(other);
  const restored=G.resumeProject(meta,s.id,other);
  assert.deepEqual(restored.work,work);
  assert.deepEqual(restored.publisher.quote,quote);
  assert.equal(G.terminationQuote(restored).advanceDue,0);
  G.syncCareer(meta,restored);
  assert.ok(G.validateSnapshot({meta,run:restored}));
  const ended=G.endProject(meta,s.id,restored);
  assert.equal(ended.advanceRepaid,0);
  assert.equal(ended.earnedReputation,0);
});

check('agency records reject full-service funding and advertising, while v0.19 full contracts still load',()=>{
  const {s}=start();G.signPublisher(s,'listing');
  for(const edit of [x=>x.publisher.kind='wrong',x=>x.publisher.adSpend=100,x=>x.publisher.advance=1,x=>x.publisher.paidStages=['signing'],x=>x.publisher.quote.studioShare=.5,x=>x.publisher.quote.advance=100]){
    const invalid=G.copy(s);edit(invalid);assert.equal(G.validateRun(invalid),false);
  }
  const old=start().s;G.signPublisher(old);delete old.publisher.kind;delete old.publisher.quote.kind;
  assert.ok(G.validateRun(old));
  assert.equal(G.publisherKind(old),'full');
  assert.equal(G.cost(old).publisherAds,300);
});

check('independent allocation completes materials at 95.5% ahead of higher output jobs',()=>{
  for(const hard of [false,true]){
    const {s}=start({hard});s.work.materials=s.req.materials*.955;
    G.assignMember(s,'hero','payment');G.assignMember(s,'ace','ads');G.setAssignmentLock(s,'ace',true);
    const p=G.autoAssign(s);
    assert.equal(p.assignments.hero,'materials');
    assert.equal(p.assignments.ace,'ads');
    assert.ok(p.reason.includes('收尾'));
    assert.ok(G.assignmentUndoStatus(s));
    assert.ok(G.undoAutoAssign(s));
    assert.equal(s.team[0].job,'payment');
    G.autoAssign(s);week(s);
    assert.equal(G.progress(s,'materials'),1);
    assert.equal(G.progress(s,'review'),0);
  }
});

check('under eight weeks of runway, materials then review are prioritized before optional work',()=>{
  const {s}=start();
  s.money=G.cost(s).total*7;
  assert.equal(G.assignmentPriorities(s).finishJob,'materials');
  assert.ok(Object.values(G.autoAssign(s).assignments).includes('materials'));
  week(s);
  s.work.materials=s.req.materials;
  assert.equal(G.assignmentPriorities(s).finishJob,'review');
  assert.ok(Object.values(G.autoAssign(s).assignments).includes('review'));
});

check('large teams finish the remaining review without moving locked staff',()=>{
  const {s}=start({scale:'large'},2965,15);
  G.assignMember(s,'hero','theme');G.setAssignmentLock(s,'hero',true);
  s.work.materials=s.req.materials;s.work.review=s.req.review-30;
  const p=G.autoAssign(s);
  assert.equal(p.exact,false);
  assert.equal(p.assignments.hero,'theme');
  assert.ok(Object.values(p.assignments).includes('review'));
  week(s);assert.ok(G.canRelease(s));
});

check('agency cannot add unaffordable ads via auto allocation, and can reveal income via player publicity',()=>{
  const {s}=start();
  G.signPublisher(s,'listing');
  G.setAdBudget(s,2000);s.money=G.cost(s).total*2;
  const p=G.autoAssign(s);
  assert.ok(p.budgetLimited);
  assert.ok(!Object.values(p.assignments).includes('acquisition'));
  G.assignMember(s,'ace','publicity');week(s);
  assert.ok(G.revealLevel(s)>0);
  assert.ok(G.incomeView(s).visible);
});

console.log(JSON.stringify({v020Checks:checks,agencyCycleCases:cycleCases}));
