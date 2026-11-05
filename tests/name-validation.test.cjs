const assert=require('node:assert/strict'),G=require('../dist/engine.js');
let checks=0;
const check=(name,test)=>{test();checks++;};
const warning='当前名字不合适，请换个名字。';
check('ordinary Chinese, English and default scale titles are accepted',()=>{
  for(const name of ['龙娘的小工作室','星际战争','反诈骗侦探','游戏开发物语','Classical Studio','Scunthorpe','Assistant','The RapeSeed Farm',...G.SCALES.map(g=>g.title)])assert.equal(G.projectNameStatus(name).ok,true,name);
});
check('common abusive, sexual and illegal solicitation names are blocked',()=>{
  for(const name of ['傻逼工作室','色情小镇','买卖枪支','贩毒帝国','纳粹万岁','FUCK','a bitch town'])assert.deepEqual(G.projectNameStatus(name),{ok:false,reason:warning});
});
check('case, full-width, punctuation and invisible separator variants are blocked',()=>{
  for(const name of ['傻·逼','傻 逼','傻\u200b逼','ＦＵＣＫ','F.u.C.k','a f u c k game','龙娘fuck工坊','p_o_r_n'])assert.equal(G.projectNameStatus(name).reason,warning,name);
});
check('matching is deterministic and does not retain regular-expression state',()=>{
  for(let i=0;i<30;i++){assert.equal(G.projectNameStatus('Fuck').ok,false);assert.equal(G.projectNameStatus('Classical Studio').ok,true);}
});
check('empty, punctuation-only and overlong names have actionable validation',()=>{
  for(const name of ['',null,'   ','\u200b','——！','x'.repeat(19)]){const r=G.projectNameStatus(name);assert.equal(r.ok,false);assert.ok(r.reason);}
  assert.equal(G.projectNameStatus('x'.repeat(18)).ok,true);
});
check('engine rejects inappropriate names before modifying career or allocating a project',()=>{
  for(const hard of [false,true])for(const name of ['色情小镇','F.u.C.k']){const meta=G.emptyMeta(),before=G.copy(meta);assert.throws(()=>G.newRun({name,hard},meta),{message:warning});assert.deepEqual(meta,before);}
});
check('a corrected name can start normally after rejection, without extra money or project number',()=>{
  const meta=G.emptyMeta();assert.throws(()=>G.newRun({name:'傻逼'},meta));const s=G.newRun({name:'龙娘的小工作室'},meta);assert.equal(s.name,'龙娘的小工作室');assert.equal(s.stage,1);assert.equal(meta.stage,2);assert.equal(meta.wallet,7600);assert.equal(s.spent,0);assert.ok(G.validateSnapshot({meta,run:s}));
});
console.log(JSON.stringify({nameValidationChecks:checks}));
