const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),G=require('../dist/engine.js');
let checks=0;function check(name,fn){fn();checks++;}
function ready(scale='micro',score=50){
  const meta=G.emptyMeta();meta.wallet=300000;const s=G.newRun({scale,seed:55401},meta);
  for(const j of G.JOBS){if(j.group!=='release')s.softCaps[j.id]=1;s.work[j.id]=s.req[j.id];}
  for(const g of G.GROUPS.filter(g=>g.id!=='release')){s.ratingRolls[g.id]=0;s.ratingBonus[g.id]=score-75;}
  return {meta,s};
}
function nextRoll(s,roll){const next=BigInt(Math.floor(roll*4294967296));s.rng=Number(((next-1013904223n)*4276115653n)&0xffffffffn);}
function ship(scale,score,roll){const {s}=ready(scale,score);nextRoll(s,roll);return G.finish(s,true);}
check('market has a 100-fold range and logarithmic midpoint',()=>{
  assert.equal(G.MARKET_MIN,.1);assert.equal(G.MARKET_MAX,10);
  assert.equal(G.marketMultiplier(0),.1);assert.equal(G.marketMultiplier(.25),.32);assert.equal(G.marketMultiplier(.5),1);assert.equal(G.marketMultiplier(.75),3.16);assert.equal(G.marketMultiplier(1),10);
});
check('market distribution is balanced between cold and hot with a strong tail',()=>{
  const factors=Array.from({length:10000},(_,i)=>G.marketMultiplier((i+.5)/10000));
  const cold=factors.filter(x=>x<1).length,hot=factors.filter(x=>x>1).length;
  assert.ok(Math.abs(cold-5000)<50&&Math.abs(hot-5000)<50);assert.ok(factors.filter(x=>x>=5).length>1400);
});
check('four scales multiply natural income by their work scale',()=>{
  assert.deepEqual(G.SCALES.map(g=>g.revenueMultiplier),[1,3,9,27]);
  for(const g of G.SCALES){const r=ship(g.id,50,.5);assert.equal(r.organicBaseRevenue,3250*g.revenueMultiplier);assert.equal(r.organicRevenue,r.organicBaseRevenue);assert.equal(r.scaleRevenueMultiplier,g.revenueMultiplier);}
});
check('settlement supports exact cold and hot boundaries',()=>{
  for(const [roll,factor] of [[0,.1],[.5,1],[1-1/4294967296,10]]){const r=ship('micro',50,roll);assert.equal(r.marketMultiplier,factor);assert.equal(r.organicRevenue,Math.round(3250*factor));}
});
check('market luck can outweigh the complete quality range',()=>{
  const lowQualityHit=ship('micro',0,1-1/4294967296),perfectFlop=ship('micro',100,0);
  assert.equal(lowQualityHit.organicRevenue,6500);assert.equal(perfectFlop.organicRevenue,1350);assert.ok(lowQualityHit.organicRevenue>perfectFlop.organicRevenue);
});
check('quality still improves revenue when scale and luck are equal',()=>{
  for(const roll of [0,.5,.99])assert.ok(ship('micro',80,roll).organicRevenue>ship('micro',20,roll).organicRevenue);
});
check('fully revealed grades retain market uncertainty',()=>{
  const {s}=ready(),f=G.forecast(s);assert.equal(f.exact,true);assert.equal(f.rating.text,'B');assert.equal(f.low,Math.round(organicAtBounds(s,false)*.1));assert.equal(f.high,Math.round(organicAtBounds(s,true)*10));assert.ok(f.high/f.low>100);assert.deepEqual(f.rules,{scaleMultiplier:1,marketMin:.1,marketMax:10});
});
function organicAtBounds(s,high){const f=G.overallView(s),c=G.ratingView(s,'commerce'),q=high?f.high:f.low,v=high?c.high:c.low;return Math.round((1000+.9*q*q)*(.65+.007*v));}
check('forecast contains releases across scales reveal levels features and publishing',()=>{
  for(let i=0;i<80;i++){
    const g=G.SCALES[i%4],{s}=ready(g.id,20+i%70);if(i%2===0){G.feature(s,'style');for(const j of G.JOBS)s.work[j.id]=s.req[j.id];}
    s.work.publicity=s.req.publicity*[0,.1,.25,.5,.75,1][i%6];if(i%3===0)G.funding(s);
    s.adSpend=300;s.spent+=300;s.money-=300;nextRoll(s,(i+.5)/80);
    const f=G.forecast(s),r=G.finish(s,true);assert.ok(r.revenue>=f.low&&r.revenue<=f.high,JSON.stringify({i,f,r}));
    assert.equal(r.organicRevenue,Math.round(r.organicBaseRevenue*r.marketMultiplier));
  }
});
check('market and scale do not subsidize low-rated paid acquisition',()=>{
  for(const g of G.SCALES)for(const roll of [0,1-1/4294967296]){
    const {s}=ready(g.id,30);s.adSpend=1000;s.spent=1000;s.money-=1000;nextRoll(s,roll);
    const expected=G.adProjection(s),r=G.finish(s,true);assert.equal(r.adRevenue,700);assert.ok(r.adRevenue<r.adSpend);assert.equal(expected.low,700);assert.equal(expected.high,700);
  }
});
check('publisher share and project ledger remain consistent with both multipliers',()=>{
  const {meta,s}=ready('large');G.funding(s);s.adSpend=1000;s.spent=1000;s.money-=1000;nextRoll(s,.75);
  const r=G.finish(s,true);assert.equal(r.organicBaseRevenue,Math.round(3250*27*.78));assert.equal(r.adRevenue,Math.round(1000*1.2*.78));
  assert.equal(r.revenue,r.organicRevenue+r.adRevenue);assert.equal(r.walletStart+r.sharedCashDelta+r.profit,r.walletEnd);assert.equal(G.settle(meta,s).wallet,r.walletEnd);
});
check('preview and rules do not draw or reveal the market roll',()=>{
  const {s}=ready(),before=JSON.stringify(s);for(let i=0;i<20;i++){G.forecast(s);G.revenueRules(s);}
  assert.equal(JSON.stringify(s),before);assert.equal(G.forecast(s).marketMultiplier,undefined);
  const restored=G.copy(s);assert.equal(G.finish(s,true).marketMultiplier,G.finish(restored,true).marketMultiplier);
});
check('successful release draws once and persists the market result',()=>{
  const {meta,s}=ready();nextRoll(s,.25);const oldRng=s.rng,r=G.finish(s,true);assert.notEqual(s.rng,oldRng);
  const saved=G.copy(s),before=JSON.stringify(saved);assert.equal(G.finish(saved,true),false);assert.equal(JSON.stringify(saved),before);
  const next=G.settle(meta,s);assert.equal(next.history[0].marketMultiplier,.32);assert.deepEqual(G.settle(next,s),next);assert.equal(saved.result.marketMultiplier,r.marketMultiplier);
});
check('failed release and abort do not draw a market outcome',()=>{
  const {s}=ready();s.work.review=0;const before=JSON.stringify(s);assert.equal(G.finish(s,true),false);assert.equal(JSON.stringify(s),before);
  const rng=s.rng,r=G.finish(s,false);assert.equal(r.marketMultiplier,null);assert.equal(r.organicBaseRevenue,0);assert.equal(r.revenue,0);assert.equal(s.rng,rng);
});
check('release confirmation and report show the rules and actual market factor',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../dist/app.js'),'utf8');
  let markup='';const {s}=ready('large');const context={G,run:s,meta:G.emptyMeta(),showDialog:x=>markup=x,dialogHeader:()=>'',esc:String,yen:n=>'¥'+n};
  vm.runInNewContext(source.slice(source.indexOf('  function incomeRange('),source.indexOf('  const pct=')),context);
  const releaseCode=source.slice(source.indexOf('  function release('),source.indexOf('  function help('));
  vm.runInNewContext(releaseCode+';release()',context);assert.ok(markup.includes('规模倍率 ×27')&&markup.includes('×0.10～10.00')&&markup.includes('宣传无法消除市场波动'));
  const reportCode=source.slice(source.indexOf('  function result('),source.indexOf('  function release('));nextRoll(s,.25);G.finish(s,true);
  vm.runInNewContext(reportCode+';result()',context);assert.ok(markup.includes('遇冷 · ×0.32')&&markup.includes('规模收益倍率')&&markup.includes('规模后基准自然收入'));
});
console.log(JSON.stringify({marketChecks:checks,forecastCases:80,distributionSamples:10000}));
