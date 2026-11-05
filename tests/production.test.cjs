const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),G=require('../dist/engine.js');
const window={StudioGame:G};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/characters-ui.js'),'utf8'),{window});const P=window.StudioPeople;
let checks=0;const check=(name,test)=>{test();checks++;};
const ace=s=>s.team.find(m=>m.id==='ace');
check('22.5% raw capacity displays the dependency-limited 5.5% that settlement actually advances',()=>{
  const s=G.newRun();s.morale=98;s.work.development=s.req.development*.145;
  assert.equal((G.memberOutput(s,'ace')/s.req.development*100).toFixed(1),'22.5');
  const plan=G.preview(s);assert.equal(plan.gains.development/s.req.development*100,5.5);
  for(const html of [P.strip(s,true,plan),P.memberCard(s,ace(s),true,false,plan)]){assert.ok(html.includes('本周岗位预计 +5.5%'));assert.ok(html.includes('受上游完成度限制'));assert.ok(!html.includes('预计 +22.5%'));}
  assert.ok(G.advance(s).ok);assert.equal(s.history[0].gains.development/s.req.development*100,5.5);
});
check('soft cap limits the forecast, including zero room at the cap',()=>{
  for(const completion of [.65,.7]){const s=G.newRun();G.assignMember(s,'ace','payment');s.work.payment=s.req.payment*completion;const p=G.preview(s),expected=completion===.65?5:0;const text=P.productionEstimate(s,ace(s),p);assert.ok(text.includes('预计 '+(expected?'+5.0%':'0%')));assert.ok(text.includes('软上限'));G.advance(s);assert.ok(Math.abs(s.history[0].gains.payment/s.req.payment*100-expected)<.01);}
});
check('review correctly forecasts zero until beginning-of-week materials are complete',()=>{
  const s=G.newRun();G.assignMember(s,'ace','review');G.assignMember(s,'hero','materials');s.work.materials=s.req.materials*.99;const p=G.preview(s);assert.ok(P.productionEstimate(s,ace(s),p).includes('本周岗位预计 0%'));assert.ok(P.productionEstimate(s,ace(s),p).includes('等待资料准备完成'));G.advance(s);assert.equal(s.history[0].gains.review,0);assert.equal(G.progress(s,'materials'),1);
});
check('same-role estimates are explicitly combined and match the job settlement',()=>{
  const s=G.newRun();G.assignMember(s,'ace','gameplay');const p=G.preview(s),percent=(p.gains.gameplay/s.req.gameplay*100).toFixed(1),html=P.strip(s,true,p);assert.equal((html.match(/同岗合计/g)||[]).length,2);assert.equal((html.match(new RegExp('本周岗位预计 \\+'+percent.replace('.','\\.')+'%','g'))||[]).length,2);G.advance(s);assert.equal(s.history[0].gains.gameplay,p.gains.gameplay);
});
check('real-mode stable estimates exclude random rework without consuming or leaking the roll',()=>{
  const s=G.newRun({hard:true});G.assignMember(s,'ace','payment');s.softCaps.payment=1;s.work.payment=s.req.payment*.8;const before=JSON.stringify(s),p=G.progressEstimate(s),bounds=G.preview(s),text=P.productionEstimate(s,ace(s),p);assert.equal(p.ranges.payment.low,p.ranges.payment.high);assert.ok(p.gains.payment>0);assert.ok(!text.includes(' ～ ')&&text.includes('满效率预估，不含真实模式减速、返工与牵连'));assert.equal(JSON.stringify(s),before);assert.equal(P.productionEstimate(s,ace(s),G.progressEstimate(s)),text);
  let changed=false;for(let seed=1;seed<=60;seed++){const played=G.copy(s);played.rng=(seed*134775813)>>>0;G.advance(played);const gain=played.history[0].gains.payment;assert.ok(gain>=bounds.ranges.payment.low-.01&&gain<=bounds.ranges.payment.high+.01);changed ||= Math.abs(gain-p.gains.payment)>.01;}assert.ok(changed,'actual real-mode settlement retains randomness');
});
check('real-mode estimates use full efficiency in slowdown bands and exclude random spillover',()=>{
  for(const completion of [.4,.6]){const s=G.newRun({hard:true});G.assignMember(s,'ace','payment');s.softCaps.payment=1;s.work.payment=s.req.payment*completion;s.work.theme=s.req.theme*.2;const before=JSON.stringify(s),p=G.progressEstimate(s),ideal=G.copy(s);ideal.hard=false;assert.deepEqual(p,G.progressEstimate(ideal));assert.equal(p.gains.theme,0);assert.equal(p.ranges.theme.low,0);assert.equal(p.ranges.theme.high,0);assert.equal(JSON.stringify(s),before);}
});
check('dependency hints expose the same caps used by weekly work limits',()=>{
  const s=G.newRun();s.work.development=s.req.development*.4;s.work.systems=s.req.systems*.3;
  for(const [id,cap,names] of [['development',.2,['游戏内容']],['systems',.6,['开发进度']],['qa',.4,['开发进度','系统协作']],['review',0,['资料准备']]]){const dependency=G.workDependency(s,id);assert.ok(Math.abs(dependency.cap-cap)<1e-9);assert.deepEqual(dependency.sources.map(source=>source.name),names);assert.ok(Math.abs(G.workLimit(s,id)-s.req[id]*Math.min(cap,G.softCap(s,id)))<1e-9);G.assignMember(s,'ace',id);assert.ok(P.productionEstimate(s,ace(s),G.progressEstimate(s)).includes('上游依赖：'));}
  assert.equal(G.workDependency(s,'gameplay'),null);s.work.materials=s.req.materials;assert.equal(G.workDependency(s,'review').cap,1);
});
check('pending events suppress stale completion predictions until choices are resolved',()=>{
  const s=G.newRun();G.advance(s);assert.ok(s.pendingEvent);const text=P.productionEstimate(s,ace(s),G.preview(s));assert.ok(text.includes('处理事件后更新预估'));assert.ok(!text.includes('本周岗位预计'));
});
console.log(JSON.stringify({productionChecks:checks}));
