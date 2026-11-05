const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),G=require('../dist/engine.js');
const root=path.resolve(__dirname,'..'),window={StudioGame:G};
vm.runInNewContext(fs.readFileSync(path.join(root,'dist/characters-ui.js'),'utf8'),{window});
const s=G.newRun({heroName:'小周'});G.assignMember(s,'hero','development');
assert.ok(window.StudioPeople.strip(s,true).includes('转岗磨合 −20%'));

s.team[0].name='<x>';const card=window.StudioPeople.memberCard(s,s.team[0],true);
assert.ok(card.includes('&lt;x&gt;')&&!card.includes('<x>'),'player names are escaped in person card and labels');
s.knownPartners.push('lin');G.hire(s,'lin');assert.ok(window.StudioPeople.memberCard(s,s.team[2],true).includes('value="development" disabled'));
assert.equal((window.StudioPeople.assignment(s,s.team[0],true).match(/<optgroup/g)||[]).length,5);
assert.equal((window.StudioPeople.assignment(s,s.team[0],true).match(/<option/g)||[]).length,14,'13 work choices plus idle');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length,4,'offline package includes the people module');
scripts.forEach((m,i)=>new vm.Script(m[1],{filename:'offline-script-'+i}));
assert.ok(!/<script\b[^>]*\bsrc=|<link\b[^>]*rel=["']stylesheet/i.test(html),'offline scripts and styles embedded');
assert.ok(html.includes('v0.6.0 DEMO')&&html.includes('loop_studio_career_v6'),'offline build current version and isolated save key');
for(const f of ['engine.js','audio.js','characters-ui.js','app.js'])new vm.Script(fs.readFileSync(path.join(root,'dist',f),'utf8'),{filename:f});
console.log('UI checks passed: individual ramp hints, unavailable role, escaped names, four inline scripts, current offline build.');

// Exercise the actual work-row renderer, including concealed real-mode rolls.
const source=fs.readFileSync(path.join(root,'dist/app.js'),'utf8'),jobCode=source.slice(source.indexOf('  function job('),source.indexOf('  function ratingTile('));
const renderJob=vm.runInNewContext(jobCode+';job',{G,esc:v=>String(v),disabled:ok=>ok?'':' disabled'});
const real=G.newRun({hard:true});real.softCaps.payment=1;real.work.payment=real.req.payment*.8;G.assignMember(real,'hero','payment');
const row=renderJob(real,G.JOBS.find(j=>j.id==='payment'),G.preview(real),true);
assert.ok(row.includes('完成度')&&row.includes('刚性上限 100%')&&row.includes('各 50%')&&row.includes(' ～ '));
assert.ok(!row.includes('工作量'));
const listing=renderJob(real,G.JOBS.find(j=>j.id==='materials'),G.preview(real),true);
assert.ok(listing.includes('无软上限')&&!listing.includes('随机增减'));
assert.ok(source.includes('理想模式')&&source.includes('真实模式'));
console.log('Completion UI passed: percentage labels, both caps, risk range, listing exception, mode names.');

assert.ok(!/G\.(CARDS|BUFFS|TEMPLATES)|pendingCards|showCards/.test(source));assert.ok(!html.includes('name="template"')&&!html.includes('data-view="blueprints"'));assert.equal(window.StudioPeople.setup,undefined);assert.ok(source.includes('G.syncCareer(meta,run)')&&source.includes('JSON.stringify({meta,run})'));console.log('Career UI checks passed: no starting cards or blueprints, one shared snapshot.');
