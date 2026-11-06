const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),G=require('../dist/engine.js');
const window={StudioGame:G};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/characters-ui.js'),'utf8'),{window});const P=window.StudioPeople;
let checks=0;const check=(name,test)=>{test();checks++;};
check('all work options show current completion, ceiling, proposed progress and capability',()=>{
  const s=G.newRun(),markup=P.assignment(s,s.team[1],true);
  assert.equal((markup.match(/<option/g)||[]).length,14);assert.equal((markup.match(/ · 完成 /g)||[]).length,13);assert.equal((markup.match(/软上限 70%/g)||[]).length,11);assert.equal((markup.match(/无软上限/g)||[]).length,2);assert.equal((markup.match(/ · 岗位合计预计 /g)||[]).length,13);assert.equal((markup.match(/ · 能力 145%/g)||[]).length,13);
});
check('proposed assignment includes ramp and shared-role output without changing state or random numbers',()=>{
  const s=G.newRun();G.assignMember(s,'hero','payment');const before=JSON.stringify(s),estimate=G.assignmentEstimate(s,'ace','payment');assert.equal(JSON.stringify(s),before);const actual=G.copy(s);G.assignMember(actual,'ace','payment');assert.equal(estimate.teamSize,2);G.advance(actual);assert.equal(estimate.gain,actual.history[0].gains.payment);
});
check('proposed assignments respect dependencies and full-efficiency real-mode estimates',()=>{
  const s=G.newRun({hard:true});assert.equal(G.assignmentEstimate(s,'ace','review').percent,0);s.work.payment=s.req.payment*.4;const real=G.assignmentEstimate(s,'ace','payment'),ideal=G.copy(s);ideal.hard=false;assert.deepEqual(real,G.assignmentEstimate(ideal,'ace','payment'));assert.equal(G.assignmentEstimate(s,'missing','payment'),null);
});
check('warnings include only assigned capped non-listing jobs and combine same-role members',()=>{
  const s=G.newRun();s.work.gameplay=s.req.gameplay*.7;s.work.development=s.req.development*.7;s.work.payment=s.req.payment*.7;s.work.materials=s.req.materials;G.assignMember(s,'ace','gameplay');const before=JSON.stringify(s),warnings=G.softCapWarnings(s);assert.equal(warnings.length,1);assert.equal(warnings[0].job,'gameplay');assert.equal(warnings[0].cap,70);assert.equal(warnings[0].members.length,2);assert.equal(JSON.stringify(s),before);assert.ok(P.strip(s,true).includes('⚠ 已到软上限 70%'));assert.ok(P.assignment(s,s.team[0],true).includes('⚠ 已到软上限 · 玩法'));
});
check('listing work never causes cap alerts, while 100% non-listing work is labelled finished',()=>{
  const s=G.newRun();G.assignMember(s,'hero','materials');G.assignMember(s,'ace','review');s.work.materials=s.req.materials;s.work.review=s.req.review;assert.deepEqual(G.softCapWarnings(s),[]);G.assignMember(s,'ace','payment');s.softCaps.payment=1;s.work.payment=s.req.payment;assert.equal(G.softCapWarnings(s)[0].full,true);assert.ok(P.strip(s,true).includes('完成度已满'));
});
check('cap alerts retain ongoing utility and real-mode rework information',()=>{
  for(const [job,ongoing] of [['systems','偿还技术债'],['acquisition','买量并扣费']]){const s=G.newRun({hard:true});G.assignMember(s,'ace',job);s.softCaps[job]=.85;s.work[job]=s.req[job]*.85;if(job==='acquisition')G.setAdBudget(s,100);const warning=G.softCapWarnings(s)[0];assert.ok(warning.ongoing.includes(ongoing));assert.equal(warning.rework,true);assert.equal(G.assignmentEstimate(s,'ace',job).percent,0);}
});
console.log(JSON.stringify({workOptionChecks:checks}));
