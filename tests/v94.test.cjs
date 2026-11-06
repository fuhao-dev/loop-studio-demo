const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){fn();checks++;}
const window={StudioGame:G};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/characters-ui.js'),'utf8'),{window});const P=window.StudioPeople;
const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
const renderJob=vm.runInNewContext(source.slice(source.indexOf('  function job('),source.indexOf('  function ratingTile('))+';job',{G,esc:String,disabled:ok=>ok?'':' disabled'});
function ready(hard=false,scale='micro',seed=88401){const meta=G.emptyMeta();meta.wallet=300000;return G.newRun({hard,scale,seed},meta);}
function rateReady(score){const s=ready();for(const j of G.JOBS){if(j.group!=='release')s.softCaps[j.id]=1;s.work[j.id]=s.req[j.id];}for(const g of G.GROUPS.filter(g=>g.id!=='release')){s.ratingRolls[g.id]=score-75;}s.adSpend=1000;s.spent=1000;s.money-=1000;return s;}
check('zero budget yields no acquisition output or spend in either mode but salaries are paid',()=>{
  for(const hard of [false,true]){const s=ready(hard);G.assignMember(s,'hero','idle');G.assignMember(s,'ace','acquisition');const before=s.money,c=G.cost(s),status=G.buyingStatus(s);assert.ok(status.unfunded);assert.equal(status.assigned,1);assert.equal(status.spend,0);assert.ok(status.reason.includes('无进度'));assert.equal(G.memberOutput(s,'ace'),0);G.advance(s);assert.equal(s.history[0].gains.acquisition,0);assert.equal(s.adSpend,0);assert.equal(s.money,before-c.total);assert.ok(c.wages>0);}
});
check('assigned staff and positive budget enable actual buying progress and one charge',()=>{
  const s=ready();G.assignMember(s,'ace','acquisition');G.setAdBudget(s,100);assert.equal(G.buyingStatus(s).reason,'');assert.equal(G.buyingStatus(s).spend,100);G.advance(s);assert.ok(s.history[0].gains.acquisition>0);assert.equal(s.adSpend,100);
});
check('positive budget without staff does not spend or advance buying',()=>{
  const s=ready();G.setAdBudget(s,300);assert.ok(G.buyingStatus(s).reason.includes('未安排'));assert.equal(G.buyingStatus(s).spend,0);G.advance(s);assert.equal(s.adSpend,0);assert.equal(s.history[0].gains.acquisition,0);
});
check('net buying projections and settlement deduct spend for all grades and publishing',()=>{
  for(let i=0;i<15;i++)for(const signed of [false,true]){const s=rateReady((i+.5)/15*100);if(signed)G.signPublisher(s);const p=G.adProjection(s),r=G.finish(s,true);assert.equal(r.adNetRevenue,r.adRevenue-1000);assert.equal(p.netLow,p.low-1000);assert.equal(p.netHigh,p.high-1000);assert.equal(p.netLow,r.adNetRevenue);assert.equal(p.netHigh,r.adNetRevenue);assert.equal(r.profit,r.revenue+s.income-s.spent);assert.equal(r.revenue,r.organicRevenue+r.adRevenue);if(i<6)assert.ok(r.adNetRevenue<0);}
});
check('aborting a paid campaign reports the lost spend without deducting it twice',()=>{
  const s=rateReady(50),r=G.finish(s,false);assert.equal(r.adRevenue,0);assert.equal(r.adNetRevenue,-1000);assert.equal(r.profit,r.recovery-1000);assert.equal(r.walletEnd,r.walletStart-1000+r.recovery);assert.equal(r.revenue,0);
});
check('total release forecasts still include gross buying receipts',()=>{
  const s=rateReady(50),f=G.forecast(s);assert.equal(f.ad.netLow,f.ad.low-1000);const noAds=G.copy(s);noAds.adSpend=0;const other=G.forecast(noAds);assert.equal(f.low-other.low,f.ad.low);assert.equal(f.high-other.high,f.ad.high);
});
check('compact work cards retain all numeric data and details while highlighting blockers',()=>{
  const s=ready(true);s.work.development=s.req.development*.145;const before=JSON.stringify(s),p=G.progressEstimate(s),row=renderJob(s,G.JOBS.find(j=>j.id==='development'),p,true);
  for(const text of ['14.5','70%','本周基础产能','上周实际','刚性上限 100%','上游依赖','上游允许上限','按周初进度计算','天才程序员','145%','满效率预估','未计真实模式的阶段减速、随机返工与牵连'])assert.ok(row.includes(text),text);
  assert.ok(row.includes('<details class="work-details">')&&!row.includes('work-details" open'));assert.equal(JSON.stringify(s),before);
  G.assignMember(s,'ace','acquisition');assert.ok(renderJob(s,G.JOBS.find(j=>j.id==='acquisition'),G.progressEstimate(s),true).includes('¥0 · 买量无进度'));
});
check('member cards and work options warn about a zero budget and keep expandable reasoning',()=>{
  const s=ready();G.assignMember(s,'ace','acquisition');const text=P.productionEstimate(s,s.team[1],G.progressEstimate(s));assert.ok(text.includes('本周买量无进度')&&text.includes('团队工资照付')&&text.includes('<details class="production-breakdown">'));assert.ok(P.assignment(s,s.team[1],true).includes('⚠ 无预算'));G.setAdBudget(s,100);assert.ok(!P.productionEstimate(s,s.team[1],G.progressEstimate(s)).includes('本周买量无进度'));
});
check('pre-week budget warning does not spend time money or randomness',()=>{
  const run=ready();G.assignMember(run,'ace','acquisition');let markup='';const before=JSON.stringify(run);
  const code=source.slice(source.indexOf('  function showWorkCapWarning('),source.indexOf('  function advanceWeek('));
  vm.runInNewContext(code+';showWorkCapWarning([])',{G,run,showDialog:x=>markup=x,dialogHeader:()=>'',esc:String});assert.equal(JSON.stringify(run),before);assert.ok(markup.includes('预算为 ¥0，本周买量无进度')&&markup.includes('去设置买量预算')&&markup.includes('仍然推进一周'));assert.ok(source.includes('warnings.length||buying.unfunded'));
});
check('event pool covers the current game and has no removed systems',()=>{
  assert.equal(G.EVENTS.length,120);assert.equal(new Set(G.EVENTS.map(e=>e.id)).size,120);
  const texts=G.EVENTS.map(e=>e.title+e.text+e.choices.map(c=>c.label+c.hint).join('')).join('');assert.ok(!/阿策|蓝图|主攻|任务奖励|角色模板/.test(texts));
  for(const key of ['买量净回款','0.10～10.00','软上限','规模','生涯','伙伴','资料','审核','广告变现','用户付费','IP'])assert.ok(texts.includes(key),key);
});
check('new contextual events require the corresponding job scale budget or team state',()=>{
  const s=ready(),find=id=>G.EVENTS.find(e=>e.id===id);assert.equal(find('ad_plan').condition(s),false);G.assignMember(s,'ace','acquisition');assert.equal(find('ad_plan').condition(s),true);G.setAdBudget(s,100);assert.equal(find('ad_plan').condition(s),false);
  assert.equal(find('scale_review').condition(s),false);assert.equal(find('scale_review').condition(ready(false,'large')),true);
  assert.equal(find('cash_review').condition(s),false);s.money=100;assert.equal(find('cash_review').condition(s),true);
  assert.equal(find('team_exchange').condition(s),true);s.knownPartners=[];assert.equal(find('team_exchange').condition(s),false);s.knownPartners=['qiu'];assert.equal(find('team_exchange').condition(s),true);
});
check('seeded weekly events meet their state conditions without repeating the last event',()=>{
  const seen=new Set();for(let i=1;i<=640;i++){
    const s=ready(i%2===0,G.SCALES[i%4].id,Math.imul(i,2654435761)>>>0);for(const j of G.JOBS)s.work[j.id]=s.req[j.id]*.5;
    s.knownPartners=['qiu'];G.assignMember(s,'hero','publicity');G.assignMember(s,'ace',i%3?'acquisition':'materials');if(i%3===0)s.money=3000;
    const previous=s.lastEvent;G.advance(s);const e=G.event(s);seen.add(e.id);assert.notEqual(e.id,previous);assert.ok(!e.min||G.coreProgress(s)>=e.min);assert.ok(!e.condition||e.condition(s));assert.ok(G.validateRun(s));
  }
  assert.ok(seen.has('ad_plan')&&seen.has('scale_review')&&seen.has('market_watch')&&seen.has('cash_review')&&seen.has('team_exchange'));assert.ok(seen.size>=50);
});
check('pending current-version events restore identically and never grant progress directly',()=>{
  for(const e of G.EVENTS.slice(14,24))for(let i=0;i<e.choices.length;i++){const s=ready();for(const j of G.JOBS)s.work[j.id]=s.req[j.id]*.5;s.pendingEvent=e.id;const restored=G.copy(s),before=G.copy(s.work),rng=s.rng;assert.ok(G.resolveEvent(s,i));assert.ok(G.resolveEvent(restored,i));assert.deepEqual(restored,s);assert.deepEqual(s.work,before);assert.equal(s.rng,rng);assert.ok(G.validateRun(s));}
});
check('cash-review relief changes maintenance only and leaves market rules intact',()=>{
  const s=ready();s.pendingEvent='cash_review';const before=G.cost(s),rules=G.revenueRules(s),work=G.copy(s.work);G.resolveEvent(s,0);const after=G.cost(s);assert.equal(after.wages,before.wages);assert.equal(after.ads,before.ads);assert.equal(after.overhead,Math.ceil(before.overhead*.75));assert.deepEqual(G.revenueRules(s),rules);assert.deepEqual(s.work,work);
});
console.log(JSON.stringify({v94Checks:checks,adSettlementCases:30,eventSelectionCases:640,eventCount:G.EVENTS.length}));
