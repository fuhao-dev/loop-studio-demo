(function(){
  'use strict';
  const G=window.StudioGame;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const disabled=ok=>ok?'':' disabled';
  const PIXEL_LOOKS=[
    ['#51483f','#c8ac76','#7c9f92',0,'short','none','book'],
    ['#e4eee8','#365e57','#acdbc1',0,'long','horns','tablet'],
    ['#70516c','#8f6a97','#dfbd8a',1,'long','beret','brush'],
    ['#314353','#526f9b','#99c5d8',2,'short','glasses','laptop'],
    ['#6a493d','#a87c54','#e2cc9b',0,'bob','scarf','book'],
    ['#364d44','#e5e0cc','#75ac9d',1,'short','glasses','list'],
    ['#775242','#b77966','#e8bf96',2,'pony','headset','phone'],
    ['#404e54','#6c969d','#d3dfbe',1,'short','headset','list'],
    ['#755c49','#b5ad90','#da795e',0,'bob','clip','book'],
    ['#414c61','#809bac','#e4b574',2,'short','cap','laptop'],
    ['#7a5566','#cb92ae','#7fb69d',0,'twins','clip','brush'],
    ['#544633','#81a893','#d9ca91',1,'short','glasses','list'],
    ['#8e6b44','#b9a474','#87babb',0,'pony','headset','cup'],
    ['#594d6b','#9793b4','#d6b5a4',2,'bob','scarf','book'],
    ['#674a39','#bca265','#dce0b2',1,'short','glasses','book'],
    ['#34435a','#5e91ad','#debe84',0,'short','headset','laptop'],
    ['#8c708e','#a475a6','#e5d1ae',0,'long','beret','brush'],
    ['#3e5950','#86ad93','#d9d9bc',2,'short','cap','list'],
    ['#815a45','#cb927e','#f0d2a0',1,'pony','clip','phone'],
    ['#465454','#91a6a8','#d3ad76',2,'short','glasses','tablet'],
    ['#475b68','#78a99b','#e3d7b2',1,'short','headset','list'],
    ['#8e7061','#c5967e','#e6c77c',0,'long','scarf','phone'],
    ['#b5a57d','#816847','#e2bc70',1,'short','glasses','book'],
    ['#3c4a5a','#54768f','#b1d9e0',2,'short','glasses','tablet'],
    ['#d3c5ae','#5e636d','#ead09a',0,'long','beret','book'],
    ['#a8d0d7','#3e6677','#b1ece4',1,'short','headset','laptop'],
    ['#b27a6c','#6c4f60','#edbf82',2,'pony','scarf','phone']
  ];
  function pixelShade(hex,delta){return '#'+hex.slice(1).match(/../g).map(c=>Math.max(0,Math.min(255,parseInt(c,16)+delta)).toString(16).padStart(2,'0')).join('');}
  function portrait(m){
    const look=m.id==='hero'?0:m.id==='ace'?1:(m.look||2),[hair,coat,accent,skinId,style,accessory,prop]=PIXEL_LOOKS[look%PIXEL_LOOKS.length],skin=['#edc6a5','#d6aa88','#b98265'][skinId],ink='#172330',shade=pixelShade(coat,-24),light=pixelShade(coat,24),hairDark=pixelShade(hair,-25),rank=G.personRank(m);let pixels='';
    const r=(x,y,w,h,c)=>{pixels+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';};
    r(12,69,26,2,'#101c25');r(16,68,18,1,'#29404a');
    if(style==='long'||style==='twins'||style==='pony'){r(14,10,20,29,hairDark);r(style==='pony'?31:12,16,5,25,hair);if(style==='twins')r(32,16,5,25,hair);r(14,34,4,7,hair);}
    if(rank?.id==='UR'){r(10,33,28,21,ink);r(12,34,24,18,shade);r(10,48,4,9,shade);r(34,48,4,9,shade);r(12,35,2,16,accent);r(34,35,2,16,accent);}
    r(16,48,16,17,ink);r(17,50,6,14,'#3a4957');r(25,50,6,14,'#303b48');r(18,51,2,11,'#4d6070');r(26,52,2,10,'#435364');
    r(14,64,10,5,ink);r(25,64,10,5,ink);r(15,65,8,2,'#6a5b55');r(26,65,8,2,'#665951');r(15,68,8,1,accent);r(26,68,8,1,accent);
    r(14,30,20,21,ink);r(15,32,18,18,coat);r(15,33,3,15,light);r(29,34,4,15,shade);r(10,33,5,13,ink);r(11,34,4,12,coat);r(33,33,5,13,ink);r(33,34,4,11,shade);
    r(11,45,4,7,ink);r(12,45,3,6,skin);r(33,44,5,7,ink);r(33,44,4,6,skin);r(15,48,18,2,shade);r(20,30,8,4,skin);r(20,32,3,4,accent);r(25,32,3,4,accent);r(23,35,2,12,shade);r(24,38,1,1,accent);r(24,43,1,1,accent);
    r(16,7,16,23,ink);r(14,11,20,15,hairDark);r(17,14,14,14,skin);r(17,25,2,3,pixelShade(skin,-15));r(19,28,10,2,skin);r(22,30,4,1,pixelShade(skin,-24));r(15,20,2,5,skin);r(31,20,2,5,skin);
    r(16,7,16,7,hair);r(18,5,11,3,hair);r(14,11,3,10,hairDark);r(31,11,3,12,hairDark);r(17,12,14,3,hair);r(17,15,4,3,hair);r(22,14,3,4,hair);r(28,14,3,2,hair);r(18,8,10,2,pixelShade(hair,22));
    if(style==='bob'){r(14,21,3,11,hair);r(31,21,3,11,hair);r(16,28,2,4,hairDark);}if(style==='short'){r(29,7,4,5,hair);r(16,5,5,3,hair);}if(style==='pony')r(33,13,4,3,accent);if(style==='twins'){r(12,17,4,2,accent);r(33,17,4,2,accent);}
    r(19,20,3,1,ink);r(27,20,3,1,ink);r(20,21,2,2,ink);r(27,21,2,2,ink);r(20,21,1,1,'#e9f2ec');r(27,21,1,1,'#e9f2ec');r(18,24,3,1,'#db9c88');r(28,24,3,1,'#db9c88');r(23,26,4,1,'#a36561');
    if(accessory==='glasses'){r(18,19,6,1,ink);r(18,23,6,1,ink);r(18,20,1,3,ink);r(23,20,1,3,ink);r(26,19,6,1,ink);r(26,23,6,1,ink);r(26,20,1,3,ink);r(31,20,1,3,ink);r(24,20,2,1,ink);}
    if(accessory==='beret'){r(14,6,20,4,shade);r(17,3,14,3,coat);r(29,5,3,3,accent);r(15,9,18,2,ink);}
    if(accessory==='cap'){r(16,5,17,6,coat);r(15,10,22,2,shade);r(22,6,3,3,accent);}
    if(accessory==='clip'){r(29,13,4,2,accent);r(30,12,2,4,accent);}
    if(accessory==='headset'){r(14,12,2,12,ink);r(33,12,2,12,ink);r(13,17,4,7,accent);r(32,17,4,7,accent);r(34,24,2,4,ink);r(29,27,6,1,ink);}
    if(accessory==='scarf'){r(18,31,13,3,accent);r(27,34,3,10,accent);r(27,41,3,1,pixelShade(accent,-24));}
    if(accessory==='horns'){for(const [x,flip] of [[13,-1],[32,1]]){r(x,5,4,8,'#9b907b');r(x+flip*2,2,3,5,'#b9ad91');r(x+flip*3,0,2,3,'#e1d5b2');}r(15,18,2,4,'#b0d4bc');r(31,18,2,4,'#b0d4bc');r(35,52,4,5,'#659b89');r(38,56,4,6,'#659b89');r(41,59,4,3,'#8bb7a2');r(39,62,4,2,'#8bb7a2');r(24,41,3,3,accent);}
    const px=31,py=40;
    if(prop==='laptop'||prop==='tablet'){r(px,py,11,9,ink);r(px+1,py+1,9,6,'#84b4bf');r(px+2,py+2,6,1,'#c1e2d4');r(px+2,py+4,4,1,'#d9ecb8');if(prop==='laptop'){r(px-1,py+9,13,2,'#627e8a');r(px+3,py+9,4,1,'#b9d5cc');}}
    if(prop==='book'||prop==='list'){r(px,py,9,11,ink);r(px+1,py+1,7,9,prop==='book'?accent:'#e3dfc6');r(px+2,py+2,1,7,prop==='book'?shade:'#9cb099');r(px+4,py+3,3,1,shade);r(px+4,py+6,3,1,shade);}
    if(prop==='brush'){r(px+3,py-6,2,18,'#b48d64');r(px+2,py-10,4,6,hairDark);r(px+3,py-10,3,3,accent);r(px,py+8,4,3,skin);}
    if(prop==='phone'){r(px+3,py-2,6,11,ink);r(px+4,py-1,4,8,'#adc9ca');r(px+5,py+1,2,2,accent);r(px+5,py+8,2,1,'#71828a');}
    if(prop==='cup'){r(px+1,py+2,7,7,accent);r(px+8,py+3,3,4,accent);r(px+8,py+4,2,2,ink);r(px+2,py+1,5,1,'#eadcc3');r(px+3,py-3,1,2,'#b6cbca');}
    if(rank?.id==='UR'||rank?.id==='EX'){r(7,12,1,5,accent);r(5,14,5,1,accent);r(39,28,1,3,accent);r(38,29,3,1,accent);}
    return '<svg class="person-portrait pixel-portrait" viewBox="0 0 48 72" shape-rendering="crispEdges" role="img" aria-label="'+esc(m.name)+'的像素立绘"><title>'+esc(m.name)+' · '+esc(m.title||'团队成员')+'</title>'+pixels+'</svg>';
  }
  function rankBadge(m,compact=false){const rank=G.personRank(m);if(!rank)return '';const shapes={circle:'<circle cx="16" cy="16" r="10"/>',diamond:'<path d="m16 3 12 13-12 13L4 16Z"/>',star4:'<path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z"/>',star6:'<path d="m16 2 4 8 9-1-5 8 5 7-9-1-4 8-4-8-9 1 5-7-5-8 9 1Z"/>',crown:'<path d="m3 9 7 5 6-10 6 10 7-5-4 17H7Z"/><path d="M8 29h16"/>',horns:'<path d="M6 4 4 15l9 8m13-19 2 11-9 8M10 14l6-5 6 5-2 12-4 4-4-4Z"/>'};const description=rank.id==='EX'?'特殊评级 EX · 白发有角龙娘，五项能力均为 145%':'人物能力评级 '+rank.id+' · 能力分 '+rank.score+'；最高能力×60%＋次高×25%＋其余三项平均×15%';return '<span class="rarity-badge rarity-'+rank.id+(compact?' compact':'')+'" style="--rank-color:'+rank.color+'" role="img" aria-label="'+description+'" title="'+description+'"><svg viewBox="0 0 32 32" aria-hidden="true">'+shapes[rank.shape]+'</svg><b>'+rank.id+'</b></span>';}
  function abilities(m){return `<div class="ability-list" aria-label="${esc(m.name)}的五项能力">${G.SKILLS.map(j=>{const n=m.skills[j.id];return `<div class="ability-row ${n===0?'cannot':''}"><span>${j.short}</span><div class="ability-bar" style="--ability-color:${j.color}"><i style="width:${n/2}%"></i></div><b>${n}%</b><small>${G.skillLabel(n)}</small></div>`;}).join('')}</div>`;}
  function summary(m){const strong=G.SKILLS.filter(j=>m.skills[j.id]>=130).map(j=>j.short),cannot=G.SKILLS.filter(j=>m.skills[j.id]===0).map(j=>j.short);return `${strong.length===5?'五项全能':strong.length?'擅长 '+strong.join(' / '):'多岗协作'}${cannot.length?' · 不会 '+cannot.join(' / '):''}`;}
  function workOption(s,m,j){
    const managed=G.publisherManaged(s,j.id),skill=G.taskSkill(m,j.id),cap=G.softCap(s,j.id),completion=G.progress(s,j.id),estimate=skill&&!managed?G.assignmentEstimate(s,m.id,j.id):null;
    const signed=n=>(Math.abs(n)<.05?'0':(n>0?'+':'−')+Math.abs(n).toFixed(1))+'%';
    const atCap=j.group!=='release'&&completion>=cap-1e-9;
    const predicted=managed?'发行商托管':estimate?'预计 '+signed(estimate.percent):skill?'暂不预估':'不会';
    const ceiling=j.group==='release'?'无软上限':'软上限 '+Math.round(cap*100)+'%';
    const text=(managed?'发行商托管 · ':'')+(j.id==='acquisition'&&s.adBudget===0?'⚠ 无预算 · ':'')+(atCap?(cap<1?'⚠ 已到软上限 · ':'⚠ 已完成 · '):'')+j.name+' · 完成 '+(completion*100).toFixed(1)+'% / '+ceiling+' · '+predicted+' · 能力 '+skill+'%';
    return `<option value="${j.id}"${m.job===j.id?' selected':''}${skill===0||managed?' disabled':''}>${text}</option>`;
  }
  function assignment(s,m,active){return `<label class="person-assignment"><span>本周负责</span><select data-member="${m.id}" aria-label="${esc(m.name)}本周岗位"${disabled(active)}><option value="idle"${m.job==='idle'?' selected':''}>待命（仍计工资）</option>${G.GROUPS.map(g=>`<optgroup label="${g.name}">${G.JOBS.filter(j=>j.group===g.id).map(j=>workOption(s,m,j)).join('')}</optgroup>`).join('')}</select></label>`;}

  function productionEstimate(s,m,plan){
    if(m.job==='idle')return '<span class="state-chip">待命 · 产能 0 · 仍计工资</span>';
    const warning=G.softCapWarnings(s).find(w=>w.job===m.job),base='基础产能 '+G.memberOutput(s,m.id).toFixed(1)+' 点';
    const noBudget=m.job==='acquisition'&&s.adBudget===0,alerts=[];
    if(noBudget)alerts.push('预算 ¥0 · 本周买量无进度');
    if(warning)alerts.push((warning.full?'完成度已满':'已到软上限 '+warning.cap+'%')+(warning.ongoing?' · '+warning.ongoing:''));
    const alertHtml=alerts.map(t=>'<span class="work-cap-warning">⚠ '+t+'</span>').join('');
    if(!plan)return '<div class="production-pair"><small>'+base+'</small><span>'+(s.over?'项目已结束':s.paused?'项目已暂停':'处理事件后更新预估')+'</span></div>'+alertHtml;
    const signed=n=>(Math.abs(n)<.05?'0':(n>0?'+':'−')+Math.abs(n).toFixed(1))+'%';
    const range=plan.ranges[m.job],low=range.low/s.req[m.job]*100,high=range.high/s.req[m.job]*100,amount=Math.abs(high-low)<.01?signed(high):signed(low)+' ～ '+signed(high);
    const limit=G.workLimit(s,m.job),ceiling=s.req[m.job]*G.softCap(s,m.job),notes=[];
    if(limit<ceiling-.01)notes.push(m.job==='review'?'等待资料准备完成':'受上游完成度限制');
    if(s.work[m.job]>=ceiling-.01)notes.push(G.softCap(s,m.job)<1?'已到软上限':'完成度已满');
    else if(ceiling-s.work[m.job]<plan.production[m.job])notes.push(G.softCap(s,m.job)<1?'受软上限限制':'接近 100%');
    const conditions=notes.slice();
    if(s.hard)notes.push('满效率预估，不含真实模式减速、返工与牵连');
    if(m.job!==m.lastJob)notes.push('转岗磨合 −'+Math.round(20*G.mods(s).ramp)+'%');
    const dependency=G.workDependency(s,m.job);if(dependency)notes.push('上游依赖：'+dependency.sources.map(source=>source.name+' '+(source.value*100).toFixed(1)+'%').join(' / ')+'；上游允许上限 '+(dependency.cap*100).toFixed(1)+'%');
    if(noBudget)notes.push('买量预算为 ¥0，不扣投放费，不产生买量进度；团队工资照付。');
    const shared=s.team.filter(p=>p.job===m.job).length>1?'同岗合计':'';
    return `<div class="production-pair"><div class="production-estimate" aria-label="本周岗位预计 ${amount}"><small>${s.hard?'满效率岗位预计':'本周岗位预计'}</small><b>${amount}</b></div><div class="production-base"><small>${base}</small>${shared?'<span class="state-chip">'+shared+'</span>':''}${s.hard?'<span class="state-chip">满效率</span>':''}</div></div>${alertHtml}${conditions.length?'<div class="production-conditions">'+conditions.map(t=>'<span class="state-chip">'+t+'</span>').join('')+'</div>':''}<details class="production-breakdown"><summary>产出依据</summary><ul class="production-note">${(notes.length?notes:['已计依赖与上限']).map(t=>'<li>'+t+'</li>').join('')}</ul></details>`;
  }

  function memberCard(s,m,active,candidate=false,plan=s?G.progressEstimate(s):null,context={}){
    const career=!!context.meta,known=(career?context.meta.knownPartners:s?.knownPartners||[]).includes(m.id),departed=!!s?.departed.includes(m.id),rank=G.personRank(m),kind=candidate?(known?'候选伙伴':'待结识'):m.kind==='hero'?'主角':m.kind==='companion'?'初始搭档':'团队伙伴';
    const canHire=active&&known&&!departed&&(career?context.meta.wallet>=180:!s.managed&&s.money>=180),label=!known?G.recruitUnlockText(m):departed?'本项目已暂别，下个项目可再邀请':!active?(career?'暂停当前项目后可在局外邀请':'恢复项目并处理事件后可邀请'):!career&&s.managed?'本周管理行动已使用':(career?context.meta.wallet:s.money)<180?'资金不足，需要 ¥180':'邀请'+m.name+'入组 · ¥180';
    return '<article class="person-card '+(m.id==='ace'?'person-ai ':'')+(rank?'ranked-card rarity-'+rank.id:'')+(candidate&&!known?' unacquainted':'')+'" data-person="'+m.id+'"'+(rank?' data-rarity="'+rank.id+'"':'')+' style="--person-color:'+m.color+';--rank-color:'+(rank?.color||m.color)+'">'+rankBadge(m)+'<div class="person-head">'+portrait(m)+'<div><span class="person-kind">'+kind+'</span><h3>'+esc(m.name)+'</h3><p>'+esc(m.title)+'</p></div></div><p class="person-bio">'+esc(m.bio)+'</p>'+abilities(m)+'<blockquote>“'+esc(m.quote)+'”</blockquote><div class="person-salary">基础周薪 <b>¥'+m.salary+'</b>'+(candidate?'<span>入组准备 ¥180</span>':'<div class="person-production">'+productionEstimate(s,m,plan)+'</div>')+'</div>'+(candidate?'<p class="recruit-requirement">'+(known?'已结识 · 跨项目保留':G.recruitUnlockText(m))+'</p><button class="btn-teal person-join" data-action="'+(career?'career-hire':'hire')+'" data-id="'+m.id+'"'+disabled(canHire)+'>'+esc(label)+'</button>':assignment(s,m,active))+(!candidate&&m.kind==='partner'?'<button class="person-dismiss" data-action="dismiss" data-id="'+m.id+'"'+disabled(active&&!s.managed&&s.money>=100)+'>与'+esc(m.name)+'暂别 · ¥100</button>':'')+'</article>';
  }
  function recruitmentBoard(s,active,filter='all',context={}){
    const joined=context.meta?context.meta.partners:s.team.filter(m=>m.kind==='partner').map(m=>m.id),known=context.meta?context.meta.knownPartners:s.knownPartners,remaining=G.RECRUITS.filter(r=>!joined.includes(r.id)).sort((a,b)=>G.PERSON_RANKS.findIndex(r=>r.id===G.personRank(a).id)-G.PERSON_RANKS.findIndex(r=>r.id===G.personRank(b).id)),shown=remaining.filter(r=>filter==='all'||G.personRank(r).id===filter),ready=remaining.filter(r=>known.includes(r.id)&&!s?.departed.includes(r.id)).length;
    return '<section class="recruitment-board" aria-label="候选伙伴图鉴"><div class="section-heading"><div><h2>候选伙伴 <span class="pill gold">'+G.RECRUITS.length+' 人</span></h2><small>已入组 '+joined.length+' · 已结识待邀请 '+ready+' · 团队人数不限</small></div></div><div class="recruit-filters" role="group" aria-label="按人物评级筛选">'+[{id:'all',color:'#b7c5cb'},...G.PERSON_RANKS].map(r=>'<button class="recruit-filter'+(filter===r.id?' selected':'')+'" style="--rank-color:'+r.color+'" aria-pressed="'+(filter===r.id)+'" data-action="recruit-filter" data-rank="'+r.id+'">'+(r.id==='all'?'全部':r.id)+' <span>'+(r.id==='all'?remaining.length:remaining.filter(p=>G.personRank(p).id===r.id).length)+'</span></button>').join('')+'</div><p class="rank-explanation">能力分＝最高能力×60%＋次高×25%＋其余三项平均×15%。主角不评级；龙娘为特殊 EX。未结识的伙伴可预览能力，达到里程碑后即可邀请。</p>'+(shown.length?'<div class="people-grid candidate-grid">'+shown.map(m=>memberCard(s,m,active,true,null,context)).join('')+'</div>':'<div class="panel people-empty"><p>这一档的伙伴已全部入组。</p></div>')+'</section>';
  }
  function autoAssignmentControls(active){return '<div class="crew-actions"><button type="button" class="btn-small btn-teal" data-action="auto-assign"'+disabled(active)+'>自动分配</button></div>';}
  function autoAssignmentHelp(){return '<details class="auto-assignment-help"><summary>自动分配怎么算？</summary><p>以本周 13 项工作平均完成度的预估增量最大为目标，计入人物能力、转岗磨合、同岗协作、软上限、刚性上限和上游依赖。遵守现有买量预算与可支付资金，排除不会的工作和发行商托管岗位；同收益优先保留现有分工。10 人及以内计算全局最优；更大的团队从现有分工及两组新分工出发，搜索岗位调换与人员交换，不保证全局最优。真实模式同样使用满效率预估。完成度之外的偿债与未来周收益可结合策略手动安排。</p></details>';}
  function strip(s,active,plan=G.progressEstimate(s)){return `<section class="crew-section"><div class="section-heading"><div><h2>一起做游戏的人</h2><small>能力决定产能 · 每人每周专注一岗</small></div><div class="crew-actions">${autoAssignmentControls(active)}<button class="btn-small btn-ghost" data-action="tab" data-tab="team">查看人物卡 ↗</button></div></div><p class="crew-legend">选项：当前完成度 / 软上限 · 选岗后团队合计预估 · 人物能力。预估按满效率计算，计入上游依赖、上限、转岗磨合与同岗协作。</p>${autoAssignmentHelp()}<div class="crew-strip">${s.team.map(m=>`<article class="crew-mini" style="--person-color:${m.color}"><div class="crew-mini-head">${portrait(m)}<div><strong>${esc(m.name)} ${rankBadge(m,true)}<small>${m.kind==='hero'?'主角':m.id==='ace'?'龙娘搭档':''}</small></strong><p>${summary(m)}</p></div></div>${assignment(s,m,active)}<div class="contribution">${productionEstimate(s,m,plan)}</div></article>`).join('')}</div></section>`;}
  function roster(s,active,plan=G.progressEstimate(s),filter='all'){return '<div class="section-heading"><h2>本周团队分工 · '+s.team.length+' 人</h2>'+autoAssignmentControls(active)+'</div>'+autoAssignmentHelp()+'<p class="legend">100% 为标准能力；擅长 ≥130%，不会的岗位不能分配。天才程序员每项 145%，每周仍只负责一岗。同岗最有效成员发挥全产能，其余按协作效率折算；转岗磨合按每个人上周的实际岗位计算。团队人数不限，工资与维护随团队增加。</p><p class="crew-legend">岗位预估为选岗后的团队合计，按满效率、依赖与上限计算；详细依据可展开查看。</p><div class="people-grid">'+s.team.map(m=>memberCard(s,m,active,false,plan)).join('')+'</div>'+recruitmentBoard(s,active,filter)+'<p class="legend" style="margin-top:18px">邀请和暂别占用本周管理行动；邀请不推进时间，新伙伴首周需要磨合。整个团队会带入下一关；主角与天才程序员始终留队。伙伴暂别后本项目不能再次邀请，但结识关系跨关保留。</p>';}
  function voice(s,event){const v=G.teamVoice(s,event),m=s.team.find(m=>m.id===v.id);return `<div class="team-voice">${portrait(m)}<div><strong>${esc(v.name)}</strong><p>${esc(v.text)}</p></div></div>`;}
  window.StudioPeople={portrait,rankBadge,recruitmentBoard,abilities,summary,assignment,productionEstimate,memberCard,strip,roster,voice};
})();
