(function(){
  'use strict';
  const G=window.StudioGame, P=window.StudioPeople, T=window.StudioTutorial, $=id=>document.getElementById(id);
  const SAVE='loop_studio_career_v18';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const yen=n=>{const value=Math.round(n);return (value<0?'−':'')+'¥'+Math.abs(value).toLocaleString('zh-CN');};
  function incomeRange(s,kind='revenue'){
    const v=G.incomeView(s),r=v[kind];if(!r)return '?????';
    return (v.level<5?'约 ':'')+(kind==='adRate'?r.low+'%—'+r.high+'%':r.low===r.high?yen(r.low):yen(r.low)+'—'+yen(r.high));
  }
  function incomeDisclosure(s){const v=G.incomeView(s);return `<div class="income-disclosure"><span>${v.label} · ${v.level} / 5</span><small>${v.next}</small></div>`;}
  const pct=(n,d)=>Math.max(0,Math.min(100,Math.floor(n/d*100)));
  let run=null,meta=G.emptyMeta(),view='home',tab='work',workModule='content',historyFilter='all',recruitFilter='known',hiddenPrompt=false,setupScale='micro',toastTimer,storageOK=true,guideOpen=false,manualSection='start',recruitSort='rank',compareIds=[],crewSearch='',crewJob='all',crewExpanded=false;
  try{const snapshot=JSON.parse(localStorage.getItem(SAVE)||'null');if(G.validateSnapshot(snapshot)){meta=snapshot.meta;run=snapshot.run;}}catch{}
  let tutorial=T.empty();
  try{const stored=JSON.parse(localStorage.getItem(T.KEY)||'null');if(T.valid(stored))tutorial=stored;}catch{}
  function tutorialContext(){return {meta,run};}
  function saveTutorial(){try{localStorage.setItem(T.KEY,JSON.stringify(tutorial));}catch{}}
  function observeTutorial(signal='observe'){const previous=tutorial.step;tutorial=T.update(tutorial,signal,tutorialContext());if(tutorial.step!==previous)tutorial.minimized=false;saveTutorial();}
  function tutorialWelcome(){
    if(tutorial.status==='unseen'){tutorial.status='paused';saveTutorial();}
    const resume=['active','paused'].includes(tutorial.status)&&tutorial.runId!==null;
    showDialog(dialogHeader('YOUR FIRST GAME','和天才程序员，做出第一款游戏。')+`<div class="tutorial-welcome"><div>${P.portrait(G.COMPANION)}</div><p>从立项到发售，我陪你走一遍。<br>每一步都在真实项目中完成，进度会自动保存。</p></div><ol class="tutorial-outline"><li><b>先开工</b><span>选择规模，安排两人的工作</span></li><li><b>过一周</b><span>认识进度、成本与随机事件</span></li><li><b>做完一作</b><span>选择发行方式，完成上架，积累成长</span></li></ol><p class="quality-note">可以随时暂停或跳过，从侧栏「新手教程」继续查看。引导不会重置项目、改变随机结果或替你签约。</p><div class="dialog-actions"><button class="btn-ghost" data-action="tutorial-skip">我想自行探索</button>${resume?'<button class="btn-ghost" data-action="tutorial-start" data-restart="true">从当前项目重新学习</button>':''}<button class="btn-primary" data-action="tutorial-start">${resume?'继续新手教程':'开始新手教程 →'}</button></div>`,'tutorial-welcome');
  }
  function renderTutorial(){
    const coach=$('tutorial-coach');document.querySelectorAll('.tutorial-target').forEach(el=>el.classList.remove('tutorial-target'));
    coach.hidden=tutorial.status!=='active'||dialog.open;if(coach.hidden)return;
    const d=T.detail(tutorial,tutorialContext());coach.className='tutorial-coach'+(tutorial.minimized?' minimized':'');
    const ready=d.id==='release'&&run&&G.canRelease(run);
    coach.innerHTML=`<div class="tutorial-coach-head"><span aria-hidden="true">◇</span><div><small>新手教程 ${d.index}／${d.total}</small><h2 id="tutorial-step-title">${esc(d.title)}</h2></div><button data-action="tutorial-minimize" aria-label="${tutorial.minimized?'展开':'收起'}新手教程" aria-expanded="${!tutorial.minimized}">${tutorial.minimized?'＋':'−'}</button></div>${tutorial.minimized?'':`<div class="tutorial-coach-content"><div class="tutorial-progress" aria-label="教程进度 ${d.index}／${d.total}"><i style="width:${d.index/d.total*100}%"></i></div><p>${esc(d.text)}</p><p class="tutorial-note">${esc(d.note)}</p><div class="tutorial-coach-actions"><button class="btn-primary" data-action="tutorial-go">${ready?'查看发售方案':esc(d.label)}</button>${d.id==='publisher'?'<button class="btn-ghost" data-action="tutorial-indie">选择独立发行</button>':''}${d.id==='release'?'<button class="btn-ghost" data-action="tutorial-growth">先了解后续成长</button>':''}</div><div class="tutorial-coach-foot"><button data-action="tutorial-pause">暂停引导</button><button data-action="tutorial-skip">跳过教程</button></div></div>`}`;
    coach.setAttribute('aria-labelledby','tutorial-step-title');
    if(view===d.view){const target=document.querySelector(d.target);if(target)target.classList.add('tutorial-target');}
  }
  function locateTutorial(){
    const d=T.detail(tutorial,tutorialContext());
    if(d.id==='project'){setup('micro');return;}
    if(d.id==='event'){if(run?.pendingEvent)showEvent();else if(run?.eventResult?.unread)showEventResult();return;}
    view=d.view;if(view==='game'){tab=d.id==='publisher'?'publisher':'work';if(d.id==='release')workModule='release';}
    hiddenPrompt=false;render();
    const target=document.querySelector(d.target);target?.scrollIntoView({block:'center',inline:'nearest'});
    const control=target?.matches('button,select')?target:target?.querySelector('select,button');control?.focus({preventScroll:true});
    if(innerWidth<741&&['assign','modules','week','release'].includes(d.id)){tutorial.minimized=true;saveTutorial();renderTutorial();}
  }
  function tutorialAction(action,button){
    if(action==='tutorial'){tutorialWelcome();return true;}
    if(!action.startsWith('tutorial-'))return false;
    if(action==='tutorial-start'){tutorial=T.start(tutorial,tutorialContext(),button.dataset.restart==='true'||['done','skipped'].includes(tutorial.status));saveTutorial();close();render();locateTutorial();return true;}
    if(action==='tutorial-skip'){tutorial={...tutorial,status:'skipped',minimized:false};saveTutorial();if(dialogKind==='tutorial-welcome')close();renderTutorial();return true;}
    if(action==='tutorial-pause'){observeTutorial('pause');renderTutorial();toast('引导已暂停，可从侧栏「新手教程」继续。');return true;}
    if(tutorial.status!=='active')return true;
    if(action==='tutorial-minimize'){observeTutorial('minimize');renderTutorial();return true;}
    if(action==='tutorial-indie'){observeTutorial('indie');render();locateTutorial();return true;}
    if(action==='tutorial-growth'){observeTutorial('learn-growth');render();locateTutorial();return true;}
    if(action==='tutorial-go'){
      if(tutorial.step==='growth'){observeTutorial('finish');renderTutorial();toast('教程已完成，去做属于你的游戏吧。');return true;}
      if(['caps','budget'].includes(tutorial.step)){observeTutorial('next');render();locateTutorial();return true;}
      if(tutorial.step==='release'&&run&&G.canRelease(run)){release();return true;}
      locateTutorial();return true;
    }
    return true;
  }

  const audio=window.DSHAudio.create(window);audio.init(updateAudio);
  function updateAudio(){const a=audio.getState();const muted=a.settings?.muted??a.muted;const b=$('audio-toggle');b.classList.toggle('on',!muted);b.setAttribute('aria-label',muted?'开启声音':'关闭声音');b.title=muted?'开启声音':'关闭声音';}
  function save(){G.syncCareer(meta,run);try{localStorage.setItem(SAVE,JSON.stringify({meta,run}));}catch{if(storageOK){storageOK=false;toast('浏览器未允许保存，当前进度仅在本次打开期间保留。');}}}
  function toast(text){clearTimeout(toastTimer);$('toast').textContent=text;$('toast').classList.add('toast');toastTimer=setTimeout(()=>$('toast').classList.remove('toast'),3200);}
  function disabled(ok){return ok?'':' disabled';}
  function busy(){return !run||run.over||run.pendingEvent||run.eventResult?.unread;}
  function bar(value,max,color){return `<div class="progress" style="--bar:${color||'var(--teal)'}"><span style="width:${pct(value,max)}%"></span></div>`;}
  function metricHelpButton(id){const name=id==='morale'?'士气':'技术债';return `<button type="button" class="metric-help-trigger" data-metric-help="${id}" aria-label="查看${name}说明" aria-haspopup="dialog" aria-expanded="false" aria-controls="metric-help">?</button>`;}
  function metricHelpContent(s,id){
    const morale=id==='morale',name=morale?'士气':'技术债';
    const body=morale?`<div class="metric-help-current">当前 ${Math.round(s.morale)} / ${G.reputationProfile(s).moraleCap}<span>全岗位产出系数 ×${((.65+s.morale/285)*100).toFixed(1)}%</span></div>
      <p>士气影响所有岗位的每周产出，与能力、节奏等效果相乘。</p><ul><li>正常开发：每周士气 +1。</li><li>休整：当周产出 ×70%，士气 +12。</li><li>赶工：当周产出 ×135%，士气 −10。</li><li>士气低于 65，疲劳类事件会进入随机池。</li></ul><p class="metric-help-foot">士气范围 25—${G.reputationProfile(s).moraleCap}，每个新项目从 90 开始；名誉解锁提高上限后仍需自行恢复。产出系数 = 0.65 + 士气 ÷ 285。</p>`:
      `<div class="metric-help-current">当前 ${s.debt.toFixed(1)} 点<span>程序产出系数 ×${(Math.max(.6,1-s.debt*.01)*100).toFixed(1)}%</span></div>
      <div class="metric-help-effects"><span>每周额外基础维护 <b>+${yen(s.debt*2)}</b></span><span>完善度真实分数 <b>−${(s.debt*.18).toFixed(2)}</b></span></div>
      <p>每点技术债使程序岗位效率降低 1%，最低为 60%；影响开发进度和系统协作。每点另增加约 ¥2/周维护费。</p><ul><li>安排系统协作可持续偿债，完成度已满时仍有效。</li><li>开发与赶工会增加技术债；赶工额外 +2/周。</li><li>部分事件也可偿还技术债。</li></ul><p class="metric-help-foot">每个新项目从 0 开始。系统协作推进完成度的同时持续偿债。</p>`;
    return `<header><h2 id="metric-help-title">${name}说明</h2><button type="button" class="metric-help-close" aria-label="关闭数值说明">×</button></header>${body}`;
  }
  function positionMetricHelp(){
    if(!metricTrigger||metricPopup.hidden)return;
    const r=metricTrigger.getBoundingClientRect(),w=metricPopup.offsetWidth,h=metricPopup.offsetHeight,pad=12;
    metricPopup.style.left=Math.max(pad,Math.min(innerWidth-w-pad,r.left+r.width/2-w/2))+'px';
    const below=r.bottom+8,above=r.top-h-8;
    metricPopup.style.top=Math.max(pad,Math.min(innerHeight-h-pad,below+h<=innerHeight-pad?below:above))+'px';
  }
  function hideMetricHelp(restoreFocus=false){
    clearTimeout(metricHideTimer);const trigger=metricTrigger;
    if(trigger)trigger.setAttribute('aria-expanded','false');
    metricTrigger=null;metricPinned=false;metricPopup.hidden=true;
    if(restoreFocus&&trigger?.isConnected){suppressMetricFocus=true;trigger.focus();suppressMetricFocus=false;}
  }
  function showMetricHelp(trigger,pinned=false){
    const id=trigger.dataset.metricHelp;if(!run||!['morale','debt'].includes(id))return;
    clearTimeout(metricHideTimer);if(metricTrigger&&metricTrigger!==trigger)metricTrigger.setAttribute('aria-expanded','false');
    metricTrigger=trigger;metricPinned=pinned;metricPopup.innerHTML=metricHelpContent(run,id);metricPopup.hidden=false;
    trigger.setAttribute('aria-expanded','true');positionMetricHelp();
  }
  function scheduleMetricHide(){clearTimeout(metricHideTimer);metricHideTimer=setTimeout(()=>{if(!metricPinned)hideMetricHelp();},160);}

  function title(eye,name,sub,right=''){return `<div class="title-row"><div><div class="eyebrow">${eye}</div><h1>${name}</h1>${sub?`<p class="sub">${sub}</p>`:''}</div>${right}</div>`;}
  function officeSVG(){
    const people=run?G.teamSize(run):2;
    const desks=[{x:156,y:170,c:'#92bca8'},{x:268,y:170,c:'#a6afe0'},{x:213,y:239,c:'#d8bb80'},{x:325,y:239,c:'#d8a991'}];
    return `<svg class="office-art" viewBox="0 0 530 350" aria-label="像素风工作室，团队在温暖灯光下制作游戏" role="img"><defs><pattern id="floor" width="38" height="38" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 0 0)"><rect width="38" height="38" fill="#384a43"/><path d="M0 0h38v38" fill="none" stroke="#4a5a4f" stroke-width="1"/></pattern><linearGradient id="windowlight" x2="0" y2="1"><stop stop-color="#a1c6ae"/><stop offset="1" stop-color="#6d9c91"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="6"/></filter></defs><ellipse cx="283" cy="276" rx="185" ry="52" fill="#0f191c" opacity=".3"/><path d="M76 169 276 68 466 163 267 268Z" fill="#263932"/><path d="M76 169v48l191 98v-47Z" fill="#26352f"/><path d="M267 268v47l199-100v-52Z" fill="#1c2e2b"/><path d="M76 169 276 68 466 163 267 268Z" fill="url(#floor)"/><path d="M76 169V72L276-27v95Z" fill="#506258" transform="translate(0 24)"/><path d="M276 92V-3l190 95v95Z" fill="#344c46"/><path d="M99 105 190 60v58l-91 45Z" fill="#253d39" stroke="#72887b" stroke-width="4"/><path d="M105 106 184 67v48l-79 39Z" fill="url(#windowlight)"/><path d="M144 87v48M106 129l77-39" stroke="#3e5c50" stroke-width="4"/><path d="M107 128 113 110l8-4 2 10 9-20 9-5 3 24 11-23 12-6 8 14 8-4v18l-78 39Z" fill="#42665a" opacity=".55"/><path d="M147 142 270 203 334 171 188 115Z" fill="#e4d5a9" opacity=".065"/><path d="m219 53 33-16v29l-33 17Z" fill="#c7b794"/><path d="m225 56 20-10v16l-20 10Z" fill="#718b72"/><path d="M304 49 358 76v42l-54-27Z" fill="#233d37" stroke="#789082" stroke-width="2"/><path d="m313 65 34 17m-34-7 25 13m-25-3 30 15" stroke="#b0b68e" stroke-width="2"/><path d="m386 99 55 28v8l-55-28Z" fill="#a18a65"/><path d="m390 92 5 2v10l-5-2m9-3 5 2v8l-5-2m10-2 5 2v8l-5-2m8-3 5 2v9l-5-2" fill="#91ab96" stroke="#6d8a77" stroke-width="2"/>
    <g transform="translate(90 174)"><path d="m0 0 21-10 17 8-20 10Z" fill="#bc9a6a"/><path d="M0 0v18l18 10V8m0 20 20-10V-2" fill="#6b6044"/><path d="M18-5v-38" stroke="#547d64" stroke-width="4"/><path d="M18-16C-8-18-8-35 1-31c13 2 15 8 17 15m0-5c23-6 26-22 17-21-15 0-19 12-17 21m0-9c-14-9-13-23-7-21 10 2 11 13 7 21" fill="#739b78"/></g>
    ${desks.map((d,i)=>`<g transform="translate(${d.x} ${d.y})"><path d="m-25 0 49-25L72-1 23 24Z" fill="#b2966b" stroke="#ccb184" stroke-width="1"/><path d="M-25 0v6l48 25v-7m49-25v7L23 31v-7" fill="#73684f"/><path d="M-19 9v27m79-24v26M22 31v24" stroke="#374039" stroke-width="5"/><path d="m0-11 29-15v24L0 13Z" fill="#1b2b30" stroke="#667f76" stroke-width="2"/><path d="m3-10 23-12v18L3 8Z" fill="${run?.team?.[i]?.color||d.c}" opacity=".65"/><path d="m6-10 8-4m-8 9 15-8m-15 13 10-5" stroke="#d7e0c9" stroke-width="1" opacity=".6"/><path d="m13 13 12-6 12 6-12 6Z" fill="#566c60"/><path d="m29 8 17-8 12 6-17 8Z" fill="#aeb8a0"/><path d="m54-7 6-3v9l-6 3Z" fill="#d5c3a1"/>${i<people?`<g><path d="M8 37v15l13 7 12-7V39" fill="#26363a"/><path d="m8 34 13-7 13 7-13 7Z" fill="#526b61"/><path d="M12 23v17l10 6 9-5V23" fill="${d.c}"/><path d="m12 22 10-5 9 5v10l-9 5-10-5Z" fill="#d6ad87"/><path d="m10 19 11-6 12 6v7l-5-2-1-5-13 6-4-1Z" fill="${i%2?'#76624a':'#3c3c34'}"/><path d="m15 42-9-8m22 9 9-9" stroke="${d.c}" stroke-width="5"/></g>`:''}</g>`).join('')}
    <path d="m407 178 27-14 15 8-27 14Z" fill="#9d8c68"/><path d="M407 178v32l15 8v-32m27-14v32l-27 14v-32" fill="#526252"/><path d="m415 181 10-5 8 4-10 5Z" fill="#b7ba9e"/><path d="m396 155 6-3v18l-6 3Z" fill="#d9c198"/><path d="m384 150 16-20 17 20-17 8Z" fill="#dac28c"/><ellipse cx="401" cy="151" rx="15" ry="5" fill="#f5d795" opacity=".22" filter="url(#glow)"/></svg>`;
  }
  function home(){const live=run&&!run.over;return title('MAKE SOMETHING WORTH PLAYING','天才程序员带我做游戏','一间小工作室，一个新点子，还有属于你的制作人故事。')+
    `${careerStats()}<section class="hero"><div class="hero-copy"><div class="eyebrow">下一个好点子 · 等你开工</div><h1>从一个点子，<br>到一款真正的游戏。</h1><p>安排团队，积累主角能力，应对开发中的意外。<br>时间没有终点，预算会提醒你何时该发售。</p><div class="hero-buttons"><button class="btn-primary" data-action="${live?'continue':'setup'}">${live?'继续开发「'+esc(run.name)+'」':meta.stage===1?'＋ 立项，开始第一款游戏':'＋ 立项，开始新项目'} <span>↗</span></button>${live?'<button class="btn-ghost" data-action="setup">新项目</button>':'<button class="btn-ghost" data-action="tutorial">新手教程 →</button>'}</div><p class="hero-note">回合开发 · 每周随机事件 · 资金继承 · 全局团队</p></div><div class="home-office">${officeSVG()}</div></section>
    ${meta.pausedProjects.length?`<div class="notice">还有 ${meta.pausedProjects.length} 个已暂停项目，可以随时继续。<button class="btn-small" data-action="nav" data-view="history">查看并恢复开发 ↗</button></div>`:''}
    <div class="section-heading"><h2>这一次，做多大的游戏？</h2><small>四档规模 · 以 100% 能力计算标准人周</small></div><div class="scale-grid">${G.SCALES.map((g,i)=>`<article class="scale-card" style="--accent:${['#d8b879','#81bea7','#76a9e7','#bc9fe4'][i]}"><div class="scale-icon">${g.icon}</div><h3>${g.name}</h3><div class="scale-meta">${g.tag}</div><p>${g.desc}</p><div class="scale-work"><small>需要</small>${G.scalePlan(g.id).personWeeks.toLocaleString("zh-CN")}<small>人周工作量 · 100% 能力</small></div><div class="scale-funds ${meta.wallet<G.scalePlan(g.id).minFunds?'insufficient':''}">立项需要 ${yen(G.scalePlan(g.id).minFunds)}<small>${meta.wallet<G.scalePlan(g.id).minFunds?'资金不足 · 还差 '+yen(G.scalePlan(g.id).minFunds-meta.wallet):'当前资金可立项'}</small></div><div class="scale-return">自然收入 ×${g.revenueMultiplier}<small>市场随机 ×${G.MARKET_MIN.toFixed(2)}～${G.MARKET_MAX.toFixed(2)}</small></div><button data-action="setup" data-scale="${g.id}"${disabled(meta.wallet>=G.scalePlan(g.id).minFunds)}>${meta.wallet<G.scalePlan(g.id).minFunds?'资金不足':'选择这个规模 <span>↗</span>'}</button></article>`).join('')}</div>
    <div class="home-bottom"><div class="home-tip"><span>◷</span><div><h3>开发多久，由你决定</h3><p>没有固定回合上限。团队、项目范围与技术债决定每周成本。</p></div></div><div class="home-tip"><span>◇</span><div><h3>每一作，都是新的开始</h3><p>完成作品获得经验，训练主角；剩余资金与全体伙伴带到下一关。</p></div></div></div>`;
  }
  function game(){
    if(!run)return title('YOUR NEXT PROJECT','当前没有正在开发的项目','从你和天才程序员两个人开始，安排 13 项开发工作。')+'<section class="panel empty"><h2>从第一周，开始你的作品。</h2><button data-action="setup" class="btn-primary">＋ 开始一个新项目</button>'+(meta.pausedProjects.length?'<button data-action="nav" data-view="history" class="btn-ghost">查看暂停项目 · '+meta.pausedProjects.length+'</button>':'')+'</section>';
    const s=run,g=G.SCALES.find(g=>g.id===s.scale);
    let html=title('PROJECT WORKBENCH',esc(s.name),`${g.name} · ${G.workProfile(s).name} · 需要 ${G.scalePlan(g.id).personWeeks.toLocaleString('zh-CN')} 人周工作量 · ${s.hard?'真实模式':'理想模式'}`,`<div class="title-badges"><span class="pill gold">${s.over?'已开发 '+s.result.weeks+' 周':'第 '+s.week+' 周'}</span><span class="pill">${s.over?s.result.released?'已发售':'已结束':G.canRelease(s)?'可以正式发售':'开发中'}</span></div>`);
    if(s.over)return html+endedWorkbench(s);
    const c=G.cost(s),p=G.progressEstimate(s),active=!busy();
    html+=`<div class="stats"><div class="stat"><div class="label">生涯资金</div><div class="value gold num">${yen(s.money)}</div><div class="note">本作投入 ${yen(s.spent)}</div></div><div class="stat"><div class="label">预计可维持</div><div class="value teal num">${Math.floor(s.money/c.total)}<small>周</small></div><div class="note">按当前分工与预算</div></div><div class="stat"><div class="label">本周总支出</div><div class="value num">${yen(c.total)}</div><div class="note">工资 ${yen(c.wages)} / 维护与工具 ${yen(c.overhead+c.tools)} / 买量 ${yen(c.ads)}${c.publisherAds?' · 发行商另付 '+yen(c.publisherAds):''}</div></div><div class="stat"><div class="label">工作室伙伴</div><div class="value num">${G.teamSize(s)}<small>人</small></div><div class="note status-metrics"><span class="metric-value">士气 ${Math.round(s.morale)} ${metricHelpButton('morale')}</span><span class="metric-value">技术债 ${Math.round(s.debt)} ${metricHelpButton('debt')}</span></div></div></div>`;
    if(s.money<c.total)html+='<div class="notice">预算不足以推进下一周。可减少买量预算、签约发行商，或完成上架后发售。<button class="btn-small" data-action="abort">结束项目并回收资金</button></div>';
    html+=`<div class="tabs" role="tablist">${[['work','开发现场'],['team','团队人物 '+G.teamSize(s)],['publisher','签约发行商'],['logs','开发记录']].map(([id,n])=>`<button role="tab" aria-selected="${tab===id}" class="${tab===id?'active':''}" data-action="tab" data-tab="${id}">${n}</button>`).join('')}</div>`;
    const context={sort:recruitSort,compareIds};
    if(tab==='team')return html+P.roster(s,active,p,recruitFilter,context)+projectActions(s);
    if(tab==='publisher')return html+publisherPanel()+projectActions(s);
    if(tab==='logs')return html+logs()+projectActions(s);
    html+=`<div class="ratings-summary" role="tablist" aria-label="开发工作模块">${G.GROUPS.map(g=>ratingTile(s,g)).join('')}</div><div class="production-workspace"><div class="work-groups" id="work-module-panel" role="tabpanel" aria-labelledby="work-tab-${workModule}" tabindex="0">${workGroup(s,G.GROUPS.find(g=>g.id===workModule),p,active)}</div>${P.strip(s,active,p,{search:crewSearch,job:crewJob,expanded:crewExpanded})}</div>`;
    html+=weekSummary(s)+launchDecision(s)+`<details class="workbench-guide" id="workbench-guide"${guideOpen?' open':''}><summary>制作人目标与评级说明<span>展开查看 ↗</span></summary>${strategyPanel(s,p)}</details><div class="workbench-bottom"><aside class="project-aside">${eventPanel(s)}</aside><section class="panel"><div class="panel-head"><h2>团队与发行</h2><small>人数不限</small></div><div class="panel-body"><p class="quality-note">已结识 ${G.availableRecruits(s).length} 位伙伴可邀请。邀请 ¥180，暂别 ¥100，每周可管理一次；高级伙伴需要名誉。</p><div class="crew-actions"><button class="btn-small" data-action="tab" data-tab="team">查看伙伴来信</button><button class="btn-small" data-action="tab" data-tab="publisher">${s.publisher?'查看合约':'查看发行商报价'}</button></div></div></section></div>`+projectActions(s);
    return html;
  }
  function projectActions(s){return `<div class="project-switch-actions"><span class="pill gold">正在开发 · 项目 ${s.stage}</span><button class="btn-small btn-ghost" data-action="pause-project">暂停项目</button><button class="btn-small btn-danger" data-action="end-project" data-id="${s.id}">结束项目</button><button class="btn-small" data-action="nav" data-view="history">切换项目 · ${meta.pausedProjects.length} 个已暂停</button><button class="btn-small" data-action="setup">＋ 新项目</button></div>`;}
  function endedWorkbench(s){
    const r=s.result;
    return `<section class="panel ended-workbench"><div class="panel-head"><h2>${r.released?'作品回顾 · 已发售':'项目回顾 · 已结束'}</h2><span class="pill">${r.weeks} 周</span></div><div class="panel-body">${settlementOverview(r)}<div class="ended-actions"><button class="btn-primary" data-action="result">查看结算报告</button><button class="btn-ghost" data-action="setup">下一款作品 ↗</button><button class="btn-small" data-action="nav" data-view="history">开发历史</button></div><p class="quality-note">本作已经结算。以下为结束时的实际记录；当前生涯余额 ${yen(meta.wallet)}，所有项目共用。</p></div></section><section class="panel ended-progress"><div class="panel-head"><h2>完成度记录</h2><small>项目结束时</small></div><div class="panel-body">${G.GROUPS.map(g=>`<details><summary><b>${g.name}</b><span>${r.progress[g.id].toFixed(1)}%${r.ratings&&g.id!=='release'?' · '+r.ratings[g.id].grade:''}</span></summary><div>${G.JOBS.filter(j=>j.group===g.id).map(j=>`<p>${j.name}<b>${(G.progress(s,j.id)*100).toFixed(1)}%</b></p>`).join('')}</div></details>`).join('')}</div></section><details class="ended-logs"><summary>查看本作开发记录</summary>${logs()}</details>`;
  }
  function launchDecision(s,button=true){
    const f=G.forecast(s),ready=G.goals(s);
    return `<section class="panel release-decision" aria-label="发售决策"><div class="panel-head"><h2>发售决策</h2><span class="pill">${ready.filter(g=>g.ok).length}／2 上架准备</span></div><div class="panel-body"><div class="release-readiness">${ready.map(g=>`<span>${g.ok?'✓':'·'} ${g.name} <b>${g.value}</b></span>`).join('')}</div><div class="launch-income"><div><small>综合评级认知</small><strong>${esc(f.rating.text)}</strong></div><div><small>当前版本收入区间</small><strong>${incomeRange(s)}</strong></div></div>${incomeDisclosure(s)}${decisionFinancePanel(s)}<details class="release-rules"><summary>收入区间、买量与分成说明</summary><p>区间为工作室可到账的发售总收入，含自然收入与买量回款，已扣发行分成，未扣开发成本，不是利润。收入预估初始不可见，随宣传逐步解锁；未宣传也可以发售。</p><p>自然收入先乘规模倍率 ×${f.rules.scaleMultiplier}，再随机乘 ×${f.rules.marketMin.toFixed(2)}～${f.rules.marketMax.toFixed(2)}。基础抽样约一半遇冷、一半走热；综合真实评级 B／A／S 档分别最低 ×0.50／1.00／2.00（含各档 +／−），C／D 档最低 ×0.10。当前区间只采用已揭示信息能确认的保底，宣传无法消除市场波动。</p><dl class="detail-grid"><div><dt>其中工作室买量到账</dt><dd>${incomeRange(s,'adGross')}</dd></div><div><dt>工作室买量净回款</dt><dd>${incomeRange(s,'adNet')}</dd></div></dl><p>净回款已扣工作室买量投入。${s.publisher?'发行商先回收垫付成本，再按本作合约分配正净利润；亏损由发行商承担。已到账预付款不重复入账，合作发行销售名誉减半。':'自己投放需要安排人手和正预算，按综合真实评级与实际投入结算。'}</p></details>${button?`<button class="btn-teal release-btn" data-action="release"${disabled(G.canRelease(s))}>${G.canRelease(s)?'正式发售这款游戏 ↗':'完成上架后即可发售'}</button>`:''}<p class="quality-note">仅资料准备、审核进度必须达到 100%；其他工作可以自行取舍。</p></div></section>`;
  }
  function nextWeekSummary(s){
    const p=G.progressEstimate(s);if(!p)return '<p class="quality-note">处理当前事件后更新预计进展。</p>';
    const changes=G.JOBS.filter(j=>p.gains[j.id]>.001);
    return `<details class="next-week-preview"><summary>维持当前分工，预计改善 ${changes.length} 项工作</summary><ul>${changes.map(j=>`<li><span>${j.name}</span><b>+${(p.gains[j.id]/s.req[j.id]*100).toFixed(1)}%</b></li>`).join('')||'<li>没有正向完成度进展；请检查上限、依赖和预算。</li>'}</ul><p>同岗只计一次，按当前周初状态预估，不预测随机事件${s.hard?'；按满效率计算，不含真实模式减速、返工和牵连':''}。收益区间仍只基于当前版本。</p></details>`;
  }
  function decisionFinancePanel(s){
    const d=G.decisionFinance(s);
    return `<div class="decision-choices" aria-label="发售决策参考"><article><small>现在发售</small><b>回本需到账 ${yen(d.breakeven)}</b><p>本作累计投入 ${yen(d.invested)}，已到账其他收入 ${yen(d.received)} 已抵扣。</p></article><article><small>继续一周</small><b>再开发一周 ${yen(d.weekly)}</b><p>维持分工和预算，回本需到账 ${yen(d.nextBreakeven)}；未到账开发款不抵扣。</p></article></div>${nextWeekSummary(s)}`;
  }
  function weekSummary(s){
    const h=s.history.at(-1);if(s.hard||!h)return '';
    const gains=G.JOBS.filter(j=>h.gains[j.id]>0).map(j=>({name:j.name,value:h.gains[j.id]/s.req[j.id]*100})).sort((a,b)=>b.value-a.value);
    const capped=G.JOBS.filter(j=>j.group!=='release'&&!G.publisherManaged(s,j.id)&&h.production[j.id]>0&&G.progress(s,j.id)>=G.softCap(s,j.id)-1e-9);
    return '<section class="week-summary" aria-label="上周开发摘要"><div><b>第 '+h.week+' 周完成</b><span>支出 '+yen(h.cost)+(h.publisherGrant?' · 开发款到账 +'+yen(h.publisherGrant):'')+'</span></div><p>'+ (gains.length?gains.map(g=>'<span>'+g.name+' <b>+'+g.value.toFixed(1)+'%</b></span>').join(''):'本周人物工作没有正向进展')+'</p>'+(capped.length?'<small>已到上限：'+capped.map(j=>j.name).join('、')+'，可调整下周分工。</small>':'')+'</section>';
  }
  function chooseJob(memberId){
    if(busy())return;const m=run.team.find(m=>m.id===memberId);if(!m)return;
    const buttons=G.GROUPS.map(g=>'<section class="job-picker-group"><h3>'+g.name+'</h3>'+G.JOBS.filter(j=>j.group===g.id).map(j=>{
      const managed=G.publisherManaged(run,j.id),skill=G.taskSkill(m,j.id),e=skill&&!managed?G.assignmentEstimate(run,m.id,j.id):null,cap=G.softCap(run,j.id),current=G.progress(run,j.id);
      return '<button class="job-pick'+(m.job===j.id?' selected':'')+'" data-action="pick-job" data-member="'+m.id+'" data-job="'+j.id+'"'+disabled(skill>0&&!managed)+'><strong>'+j.name+'<em>'+ (managed?'发行商托管':skill===0?'不会':skill+'% 能力')+'</em></strong><span>完成 '+(current*100).toFixed(1)+'% · '+(j.group==='release'?'无软上限':'软上限 '+Math.round(cap*100)+'%')+'</span><b>'+ (managed?'自动推进':e?'岗位合计预计 '+(e.percent>0?'+':'')+e.percent.toFixed(1)+'%':'—')+'</b>'+(!managed&&j.id==='acquisition'&&run.adBudget===0?'<small class="job-pick-note">¥0 预算 · 本周无进度</small>':!managed&&G.workDependency(run,j.id)&&G.workDependency(run,j.id).cap<Math.min(cap,1)?'<small class="job-pick-note">上游限制 '+Math.round(G.workDependency(run,j.id).cap*100)+'% · '+G.workDependency(run,j.id).sources.map(p=>p.name+' '+Math.round(p.value*100)+'%').join(' / ')+'</small>':'')+'</button>';
    }).join('')+'</section>').join('');
    showDialog(dialogHeader('WEEKLY ASSIGNMENT',esc(m.name)+' · 选择工作')+'<p class="quality-note">预估为选岗后团队合计，按满效率计算，计入转岗、协作、依赖与上限。选择岗位不会推进时间。</p><button class="btn-ghost job-idle" data-action="pick-job" data-member="'+m.id+'" data-job="idle">待命 · 仍计工资</button>'+buttons,'job-picker');
  }
  function strategyPanel(s,p){const o=G.objectiveStatus(s,s.over?s.result:undefined),f=G.forecast(s),visible=G.incomeView(s).visible;return `<section class="strategy-panel"><div class="strategy-title"><div><span class="eyebrow">BUILD · LEARN · DECIDE</span><h2>${o.name} <span class="pill dim">${s.over?s.result.objectiveOK?'已达成':'未达成':visible&&o.ok?'有望达成':'开发中'}</span></h2><p>${s.objective==='acclaim'?'综合真实评级达到 A-':'发售后项目结余至少 ¥1,200'} · 达成最高 +40 EXP</p></div><div class="objective-value gold">${s.over?s.objective==='acclaim'?s.result.released?s.result.rating:'—':yen(s.result.profit):s.objective==='acclaim'?esc(f.rating.text):incomeRange(s,'profit')}<small>${s.over?'实际结算':visible?'基于当前认知，未计未来成本':'推进宣传，逐步揭示预计结余'}</small></div></div><div class="strategy-flow"><span>推进工作</span><b>→</b><span>积累真实品质</span><b>→</b><span>宣传验证认知</span><b>→</b><span>决定投放与发售</span></div><p class="quality-note">????? 表示完全未知；例如 B???? 是可能偏离真实值的初步判断。问号越少，误差越小。收入区间也随宣传逐步揭示；宣传改变认知，不会直接提高作品品质。</p></section>`;}
  function job(s,j,p,active){
    const assigned=s.team.filter(m=>m.job===j.id),completion=G.progress(s,j.id),cap=G.softCap(s,j.id),phase=G.workPhase(s,j.id),listing=j.group==='release',done=completion>=1;
    const atCap=!listing&&cap<1&&completion>=cap-.0001,dependency=G.workDependency(s,j.id),upstream=G.workLimit(s,j.id)<s.req[j.id]*cap-.01&&G.workLimit(s,j.id)<=s.work[j.id]+.01;
    const pp=n=>(Math.abs(n)<.05?'0':(n>0?'+':'−')+Math.abs(n).toFixed(1))+'%',range=p?.ranges[j.id],low=range?range.low/s.req[j.id]*100:0,high=range?range.high/s.req[j.id]*100:0;
    const forecast=!p?(s.over?'已结算':s.paused?'已暂停':'待事件'):Math.abs(high-low)<.01?pp(high):pp(low)+' ～ '+pp(high),last=s.history.at(-1)?.gains?.[j.id];
    const tags=[];if(j.id==='acquisition'&&s.adBudget===0)tags.push('<span class="state-chip warning">¥0 · 买量无进度</span>');
    if(atCap)tags.push('<span class="state-chip warning">已到软上限</span>');if(upstream)tags.push('<span class="state-chip warning">等待上游</span>');
    if(G.publisherManaged(s,j.id))tags.push('<span class="state-chip managed">发行商托管</span>');
    if(!assigned.length&&!G.publisherManaged(s,j.id))tags.push('<span class="state-chip">未安排伙伴</span>');
    if(s.hard&&!listing)tags.push('<span class="state-chip '+(phase.id==='uncertain'?'risk':'')+'">'+(phase.id==='uncertain'?'随机返工':phase.name)+'</span>');
    return `<div class="job work-item compact-work" data-work="${j.id}" style="--job-color:${j.color}">
      <div class="work-head"><div><strong>${j.name}</strong><div class="work-tags">${tags.join('')}</div></div><div class="completion-number"><small>完成度</small><b>${(completion*100).toFixed(1)}<em>%</em></b></div></div>
      <div class="progress completion-bar" style="--bar:${j.color};--soft:${cap*100}%" aria-label="${j.name}完成度 ${(completion*100).toFixed(1)}%，${listing?'无软上限':'软上限 '+Math.round(cap*100)+'%'}"><span style="width:${completion*100}%"></span>${!listing&&cap<1?'<i class="soft-limit" aria-hidden="true"></i>':''}</div>
      <div class="work-metrics"><div><small>${listing?'上架目标':'软上限'}</small><b>${listing?'100%':Math.round(cap*100)+'%'}</b>${listing?'<em>无软上限</em>':''}</div><div><small>${s.hard?'满效率预估':'本周预计'}</small><b class="teal">${forecast}</b></div><div><small>上周实际</small><b>${last!==undefined?pp(last/s.req[j.id]*100):'—'}</b></div></div>
      <details class="work-details"><summary>工作详情<span>点数 · 依赖 · 分工${s.hard?' · 模式':''}</span></summary><div class="work-detail-body"><p class="work-description">${j.desc}</p>
      <dl class="detail-grid"><div><dt>已完成</dt><dd>${s.work[j.id].toFixed(1)} / ${s.req[j.id]} 点</dd></div><div><dt>本周基础产能</dt><dd>${(p?.production[j.id]||0).toFixed(1)} 点</dd></div><div><dt>刚性上限 100%</dt><dd>${listing?'无软上限':'软上限 '+Math.round(cap*100)+'%'}</dd></div></dl>
      <p class="detail-foot">基础产能未计阶段与上限；${s.hard?'以上为满效率预估，未计真实模式的阶段减速、随机返工与牵连；实际变化可能不同。':'预计已计入上游依赖与完成度上限。'}</p>
      ${dependency?`<div class="dependency-card"><strong>上游依赖</strong>${dependency.sources.map(source=>`<span>${source.name}<b>${(source.value*100).toFixed(1)}%</b></span>`).join('')}<span>上游允许上限<b>${(dependency.cap*100).toFixed(1)}%</b></span><small>${j.id==='review'?'资料准备须到 100%':'仍受本项软上限限制'} · 按周初进度计算</small></div>`:''}
      <div class="job-members">${G.publisherManaged(s,j.id)?'发行团队 · 每周 '+G.publisherWork(s)+' 点基础工作':assigned.map(m=>`<span style="color:${m.color}">${esc(m.name)} · ${G.taskSkill(m,j.id)}%${m.job!==m.lastJob?' · 磨合中':''}</span>`).join(' / ')||'未安排伙伴'}</div>
      ${atCap?'<p class="detail-foot">已到软上限，等待事件解锁。</p>':''}
      ${s.hard&&phase.spill?'<p class="detail-foot">本项实际推进的 20% 会从另一项非上架工作扣除；具体影响在推进后揭晓。</p>':''}
      ${s.hard&&phase.id==='uncertain'?'<p class="detail-foot">即使已满或触及上限，继续安排仍可能返工。增减各 50%，幅度为基础产能的 20%—100%。</p>':''}
      ${done&&['systems','acquisition'].includes(j.id)?'<p class="detail-foot">'+(j.id==='systems'?'继续工作可偿还技术债。':'继续工作仍会按本周预算追加投放。')+'</p>':''}</div></details></div>`;
  }
  function ratingTile(s,g){const v=g.id==='release'?null:G.ratingView(s,g.id),completion=G.groupProgress(s,g.id)*100,selected=workModule===g.id;return `<button type="button" role="tab" id="work-tab-${g.id}" aria-selected="${selected}" aria-controls="work-module-panel" tabindex="${selected?0:-1}" data-action="work-module" data-module="${g.id}" class="rating-summary-item ${selected?'selected':''}" style="--rating-color:${g.color}"><small>${g.rating}</small><strong class="rating-text"${v?' data-rating="'+g.id+'"':''}>${v?(!s.hard&&v.level&&!v.exact?v.lowGrade+'～'+v.highGrade:esc(v.text)):G.complete(s)?'可上架':'未就绪'}</strong><span class="module-rating-note">${v?v.exact?'真实评级已揭示':v.level?(!s.hard?'初步判断 '+esc(v.text):'认知范围 '+v.lowGrade+'—'+v.highGrade):'未获得玩家反馈':'资料与审核均须完成'}</span><div class="module-completion"><span>总完成度</span><b>${completion.toFixed(1)}%</b></div><div class="module-progress" aria-hidden="true"><i style="width:${completion}%"></i></div></button>`;}
  function selectWorkModule(id){if(!G.GROUPS.some(g=>g.id===id))return;workModule=id;tab='work';render();$('work-tab-'+id)?.focus({preventScroll:true});}
  function workGroup(s,g,p,active){const v=g.id==='release'?null:G.ratingView(s,g.id),list=G.JOBS.filter(j=>j.group===g.id);return `<section class="panel work-group" id="group-${g.id}" style="--group-color:${g.color}"><header class="work-group-head"><div><span class="eyebrow">${String(G.GROUPS.indexOf(g)+1).padStart(2,'0')} / ${g.id==='release'?'必须完成':'可自主取舍'}</span><h2>${g.icon} ${g.name}</h2><p class="group-total">总完成度 <b>${(G.groupProgress(s,g.id)*100).toFixed(1)}%</b> · ${list.length} 项工作</p></div><div class="group-verdict"><small>${g.rating}</small><strong>${v?esc(v.text):G.complete(s)?'可上架':'未就绪'}</strong>${v?`<span>${v.exact?'真实评级':v.level?'范围 '+v.lowGrade+'—'+v.highGrade:'等待反馈'}</span>`:`<span>上架总进度 ${Math.floor(G.groupProgress(s,'release')*100)}%</span>`}</div></header>${s.publisher&&['promotion','release'].includes(g.id)?`<p class="group-note">发行商托管 · 每项每周 ${G.publisherWork(s)} 点基础工作，不占用团队人物；仍遵守上限、依赖与模式规则。</p>`:''}${list.map(j=>job(s,j,p,active)).join('')}${g.id==='promotion'?marketing(s,active):g.id==='release'?'<p class="group-note">资料准备 100% 后才能推进审核。上架资格确定，不受评级随机值影响。</p>':''}</section>`;}
  function marketing(s,active){const a=G.adProjection(s),level=G.revealLevel(s),buying=G.buyingStatus(s),iv=G.incomeView(s),signed=!!s.publisher;return `<div class="marketing-controls"><div class="reveal-progress"><strong>评级揭示 ${level} / 5</strong><span>宣传 >0 / 25 / 50 / 75 / 100% 逐步揭示评级与收入</span></div><p class="quality-note">${signed?'发行团队自动推进宣发；买量由发行商决定预算并垫付，玩家无需安排人手。':'宣传和买量都不影响发售资格。买量需要安排伙伴并设置预算；未安排人手不扣投放费，¥0 暂停。'}</p><div class="buying-status ${buying.reason?'warning':''}">${buying.reason?'⚠ '+buying.reason+'；团队工资照付。':'本周预计投放 '+yen(buying.spend)+(signed?' · 发行商支付':' · 工作室支付')}</div>${signed?`<div class="publisher-budget" aria-label="发行商买量预算"><div><span>发行商决定 · 本周买量预算</span><strong>${yen(buying.budget)}<small> / 周</small></strong></div><span class="pill">发行商控制</span><p>按项目规模与已揭示评级的中位预期逐周调整，玩家无法修改。未宣传按 B 档预期；C／D、B、A、S 档分别采用本规模的低档、常规、高档、最高预算。</p></div>`:`<label class="field"><span>本周买量预算 · ${G.SCALES.find(g=>g.id===s.scale).name}</span><select id="ad-budget" aria-label="本周买量预算"${disabled(active)}>${G.adBudgetOptions(s).map(n=>`<option value="${n}"${s.adBudget===n?' selected':''}>${n===0?'暂停买量 · ¥0':yen(n)+' / 周'}</option>`).join('')}</select><small>正预算 ${yen(G.adBudgetOptions(s)[1])}～${yen(G.adBudgetOptions(s).at(-1))}，最大为最小的 20 倍。</small></label>`}<div class="ad-ledger"><div><span>累计买量投入</span><b>${yen(a.spend)}</b></div>${signed?`<div><span>工作室自投 / 发行商垫付</span><b>${yen(a.studioSpend)} / ${yen(a.publisherSpend)}</b></div><div><span>预计买量总回款（分配前）</span><b>${incomeRange(s,'adTotal')}</b></div>`:''}<div><span>${signed?'预计工作室买量到账':'预计买量总回款'}</span><b>${incomeRange(s,'adGross')}</b></div><div><span>预计买量净回款${signed?'（工作室）':''}</span><b class="${iv.adNet&&iv.adNet.high<0?'red':''}">${incomeRange(s,'adNet')}</b></div><div><span>评级回款比例（分配前）</span><b>${incomeRange(s,'adRate')}</b></div></div>${incomeDisclosure(s)}<p class="quality-note">${signed?'工作室买量净回款 = 工作室买量到账 − 签约前自投成本。发行商投放先回收成本，再按合约比例分配正净利润；亏损不向工作室追偿。':'净回款 = 总回款 − 买量投入；累计投入已包含买量费用，不重复扣除。'} 回款在发售时结算，综合真实评级按内容 40% / 完善度 30% / 商业化 20% / 推广 10% 计算。C、D 档回款低于投入，B 档起可回本；评级未知时，区间很宽。</p></div>`;}

  function eventPanel(s){const pending=G.event(s),receipt=s.eventResult;const last=s.logs.find(x=>x.text.includes('：')&&!x.text.startsWith('完成第')&&!x.text.startsWith('采用技术')&&!x.text.startsWith('扩展功能'));
    return `<section class="panel event-empty"><div class="event-eyebrow"><span>✧ ${pending?'本周事件 · 等待决定':'开发中的小插曲'}</span><span>${pending?'待处理':receipt?.unread?'待查看':'每周 1 次'}</span></div><h3>${pending?pending.title:s.week===1?'故事，从第一周开始。':'每一步，都有新的可能。'}</h3><p>${pending?pending.text:s.week===1?'安排好伙伴的岗位。推进一周后，会发生属于这个项目的随机事件。':'灵感、意外、合作与团队日常，都会影响这款作品的诞生。事件与开发状态有关。'}</p>${pending?'<button class="btn-teal btn-small" style="margin-top:16px" data-action="prompt">处理这个事件 →</button>':receipt?.unread?'<button class="btn-teal btn-small" style="margin-top:16px" data-action="prompt">查看事件结果 →</button>':last?`<div class="event-last">最近记录 · ${esc(last.text)}</div>`:''}</section>`;
  }
  function fundingSchedule(s){const f=G.publisherFunding(s);return '<div class="funding-schedule" aria-label="发行开发款进度">'+f.stages.map(p=>'<div class="'+(p.paid?'paid':'')+'"><span>'+(p.paid?'✓ ':'◇ ')+p.name+'</span><b>'+yen(p.amount)+'</b><small>'+ (p.paid?'已到账':!s.publisher&&G.coreProgress(s)+1e-9>=p.threshold?'签约时到账':'达到节点自动到账')+'</small></div>').join('')+'<p>核心开发为内容与程序六项的平均完成度，目前 '+f.core.toFixed(1)+'%。已到账 '+yen(f.received)+' / 合约总额 '+yen(f.total)+'；正式发售后未达节点的余款不再发放。</p></div>';}
  function publisherPanel(){
    const s=run,q=G.publisherQuote(s),signed=!!s.publisher,active=!busy(),share=Math.round(q.studioShare*100);
    return `<section class="panel publisher-panel"><div class="panel-head"><h2>${signed?'发行合作 · 已签约':'让发行团队加入项目'}</h2><span class="pill gold">${signed?'本作条款已锁定':'名誉改善新签条件'}</span></div><div class="panel-body"><p class="legend">发行团队负责宣传、买量、资料准备与审核，玩家专注内容、程序和商业化。</p><div class="publisher-quote"><div><small>${signed?'已到账开发款':'合约开发款总额'}</small><strong>${yen(signed?s.publisher.advance:q.advance)}</strong><p>${esc(q.basis)} · ${G.SCALES.find(g=>g.id===s.scale).name}</p></div><span class="pill">工作室分成 ${share}%</span></div><div class="publisher-terms"><article><b>01 · 预付款 ${Math.round(q.advanceRatio*100)}%</b><p>按规模与已揭示评级的中位预期计算基准自然收入，再按合约比例预付，四舍五入至百元。签约金 20%，核心开发 30% 与 60% 时各到账 40%。正式发售无需归还已到账款；终止开发按实际已到账额退款，余额不足扣至 0。</p></article><article><b>02 · 每项 ${q.weeklyWork} 点／周</b><p>四项托管工作遵守规模、上限、依赖与模式规则，不占用人物和工资。团队工作速度加成仅作用于人物，托管速度独立成长。</p></article><article><b>03 · 收益与风险</b><p>工作室获得自然销售额的 ${share}%。发行商垫付后续买量，回收成本后，工作室分得正净利润的 ${share}%；买量亏损由发行商承担。买量可持续进行。签约前自投回款归工作室。</p></article></div>${fundingSchedule(s)}${signed?`<div class="publisher-managed"><h3>发行团队的工作表</h3><p class="quality-note">第 ${s.publisher.signWeek} 周签约 · 暂停时托管和投放同步暂停；名誉提升作用于之后新签的合约。</p><div class="publisher-progress">${G.PUBLISHER_JOBS.map(id=>{const j=G.JOBS.find(j=>j.id===id);return `<div><span>${j.name}</span><b>${(G.progress(s,id)*100).toFixed(1)}%</b>${bar(s.work[id],s.req[id],j.color)}</div>`;}).join('')}</div>${marketing(s,active)}</div>`:`<p class="quality-note">签约后这四项岗位上的人物转为待命。买量预算由发行商决定，玩家不能调整；每作签约时锁定预付款、分成与托管速度。</p><button class="btn-primary" data-action="publisher-contract"${disabled(active)}>查看合约 · 总额 ${yen(q.advance)} ↗</button>`}</div></section>`;
  }
  function confirmPublisher(){
    if(busy()||run.publisher)return;const q=G.publisherQuote(run),signing=G.publisherFunding(run).stages.filter(p=>G.coreProgress(run)+1e-9>=p.threshold).reduce((n,p)=>n+p.amount,0),share=Math.round(q.studioShare*100);
    showDialog(dialogHeader('PUBLISHING PARTNERSHIP','把发行工作，交给专业团队。')+`<div class="publisher-quote"><div><small>签约时立即到账 · 合约总额 ${yen(q.advance)}</small><strong>${yen(signing)}</strong><p>${esc(q.basis)} · 预付款比例 ${Math.round(q.advanceRatio*100)}%</p></div><span class="pill">工作室分成 ${share}%</span></div>${fundingSchedule(run)}<p class="dialog-desc">宣传、买量、资料准备与审核，每项每周 ${q.weeklyWork} 点基础工作；签约后相应人物转为待命。</p><ul class="publisher-contract"><li>工作室获得自然销售额的 ${share}%。</li><li>发行商买量先回收成本，工作室再获得正净利润的 ${share}%；买量亏损由发行商承担。</li><li>买量预算由发行商决定，当前预计 ${yen(G.publisherAdBudget(run))}/周，可持续投放。暂停项目时同步暂停。</li><li>正式发售时已到账开发款无需归还；未达开发节点的余款不再发放。终止项目时，在随机回收后退还实际已到账款，不足时余额扣至 0，不留负债。</li><li>合作发行的销售名誉减半，条款在签约时锁定；名誉提升改善之后的新合约。</li></ul><div class="dialog-actions"><button class="btn-ghost" data-action="close">继续独立开发</button><button class="btn-primary" data-action="confirm-publisher">签约，先领 ${yen(signing)}</button></div>`,'publisher');
  }

  function logs(){return `<section class="panel"><div class="panel-head"><h2>开发记录</h2><small>记录认知与实际行动</small></div><div class="panel-body"><div class="dev-logs">${run.logs.map(l=>`<p><span>W${l.week}</span> ${esc(l.text)}</p>`).join('')}</div></div></section><section class="panel" style="margin-top:20px"><div class="panel-head"><h2>每周账本</h2></div><div class="ledger-wrap"><table class="ledger"><thead><tr><th>周次</th><th>总支出</th><th>工作室买量</th><th>发行商买量</th><th>剩余资金</th><th>伙伴分工</th></tr></thead><tbody>${run.history.slice().reverse().map(h=>`<tr><td>${h.week}</td><td>${yen(h.cost)}</td><td>${yen(h.ads)}</td><td>${yen(h.publisherAds||0)}</td><td>${yen(h.money)}</td><td>${h.team.filter(m=>m.output>0).map(m=>esc(m.name)+' · '+G.JOBS.find(j=>j.id===m.job).name).join(' / ')}</td></tr>`).join('')||'<tr><td colspan="6">推进第一周后记录收支。</td></tr>'}</tbody></table></div></section>`;}


  function projectEntries(){const live=[...(run&&!run.over&&meta.activeRunId===run.id?[run]:[]),...meta.pausedProjects].map(s=>({id:s.id,stage:s.stage,name:s.name,scale:s.scale,hard:s.hard,status:s.paused?'paused':'active',weeks:s.week-1,cost:s.spent,revenue:null,profit:null,rating:null,team:s.team,totalCompletion:G.JOBS.reduce((n,j)=>n+G.progress(s,j.id),0)/G.JOBS.length*100,progress:Object.fromEntries(G.GROUPS.map(g=>[g.id,G.groupProgress(s,g.id)*100]))}));return [...live,...meta.history.map(r=>({...r,id:r.runId,status:r.released?'released':'aborted'}))].sort((a,b)=>b.stage-a.stage);}
  function developmentHistory(){const entries=projectEntries(),states=[['all','全部'],['active','开发中'],['paused','已暂停'],['released','已发售'],['aborted','已结束']],names=Object.fromEntries(states),shown=entries.filter(e=>historyFilter==='all'||e.status===historyFilter);return title('YOUR GAME LIBRARY','开发历史','每个点子都有自己的进度。暂停、继续，或回看已经交付的作品。',`<button class="btn-primary" data-action="setup">＋ 新项目</button>`)+`<div class="history-overview">${[['全部产品',entries.length],['正在开发',entries.filter(e=>e.status==='active').length+' / 1'],['已暂停',meta.pausedProjects.length],['已发售',meta.history.filter(e=>e.released).length]].map(([name,n])=>`<div class="stat"><span class="label">${name}</span><div class="value">${n}</div></div>`).join('')}</div><p class="history-note">资金与团队由所有项目共用。暂停不产生开发周成本；恢复时同步当前余额、成员与能力，保留项目进度、分工和随机事件。同一时间只能开发一个项目。</p><div class="history-filters" aria-label="产品状态筛选">${states.map(([id,name])=>`<button data-action="history-filter" data-filter="${id}" aria-pressed="${historyFilter===id}" class="${historyFilter===id?'selected':''}">${name} <span>${id==='all'?entries.length:entries.filter(e=>e.status===id).length}</span></button>`).join('')}</div><div class="project-library">${shown.length?shown.map(e=>`<article class="panel project-record" data-project="${e.id}"><div class="project-record-head"><div><div class="eyebrow">PROJECT ${String(e.stage).padStart(2,'0')} · ${G.SCALES.find(g=>g.id===e.scale).name} · ${e.hard?'真实模式':'理想模式'}</div><h2>${esc(e.name)} <span class="project-status ${e.status}">${names[e.status]}</span></h2></div><div class="project-record-actions">${e.status==='active'?'<button class="btn-small btn-ghost" data-action="pause-project">暂停项目</button><button class="btn-teal btn-small" data-action="nav" data-view="game">继续开发 ↗</button>':e.status==='paused'?`<button class="btn-teal btn-small" data-action="resume-project" data-id="${e.id}">${meta.activeRunId?'切换到此项目':'恢复开发'} ↗</button>`:`<strong class="history-grade">${e.released?e.rating:'—'}</strong><button class="btn-small" data-action="history-result" data-id="${e.id}">查看结算报告</button>`}${['active','paused'].includes(e.status)?`<button class="btn-small btn-danger" data-action="end-project" data-id="${e.id}">结束项目</button>`:''}</div></div><div class="project-record-stats"><div><small>已开发</small><b>${e.weeks} 周</b></div><div><small>开发总完成度</small><b>${e.totalCompletion.toFixed(1)}%</b></div><div><small>累计投入</small><b>${yen(e.cost)}</b></div><div><small>${e.status==='aborted'?'结束回收':'发售收入'}</small><b>${e.status==='aborted'?yen(e.recovery||0):e.revenue===null?'未发售':yen(e.revenue)}</b>${e.status==='aborted'&&e.recoveryRate!==null?`<small>回收比例 ${Math.round(e.recoveryRate*100)}%</small>`:''}</div><div><small>项目盈亏</small><b class="${e.profit===null?'':e.profit>=0?'teal':'red'}">${e.profit===null?'待结算':yen(e.profit)}</b></div></div><details class="history-details"><summary>各模块进度与制作团队</summary><div class="history-progress">${G.GROUPS.map(g=>`<div><span>${g.rating}</span><b>${e.progress[g.id].toFixed(1)}%</b>${bar(e.progress[g.id],100,g.color)}</div>`).join('')}</div><p>制作团队：${e.team.map(m=>esc(m.name)).join('、')}</p>${e.status==='released'?'<p>仅上架两项为发售硬条件，其他模块可以未满进度。</p>':''}</details></article>`).join(''):`<section class="panel empty"><h2>${entries.length?'这个状态下还没有作品。':'你的第一款作品，从这里开始。'}</h2><p>${entries.length?'切换筛选可以查看其他项目。':'立项后，这里会保留每个项目的开发与发售情况。'}</p></section>`}</div>`;}
  function pauseCurrentProject(nextView='history'){if(!run||!G.pauseProject(meta,run)){toast('当前项目无法暂停。');return false;}run=null;view=nextView;tab='work';hiddenPrompt=false;close();render();window.scrollTo(0,0);return true;}

  function confirmEndProject(id){
    const s=run&&!run.over&&run.id===id?run:meta.pausedProjects.find(p=>p.id===id);if(!s)return;
    const ready=G.complete(s),switching=s.paused&&meta.activeRunId&&meta.activeRunId!==id,choicePending=!!s.pendingEvent||!!s.eventResult?.unread,ending=G.terminationQuote(s,meta.wallet);
    showDialog(dialogHeader('CLOSE THIS PROJECT','结束「'+esc(s.name)+'」？')+`${ready?`<div class="release-reminder" role="note"><strong>这个项目已具备发售条件，可以选择发售。</strong><p>资料准备与审核均已达到 100%。发售可结算销售收入；结束项目仅回收部分投入。${choicePending?'请先完成当前事件，再正式发售。':switching?'选择发售会暂停当前开发项目，切换到本作后再确认发售。':s.paused?'选择发售会恢复本作，再打开确认界面。':'可先查看发售收入区间，再决定。'}</p></div>`:''}<p class="dialog-desc">结束后无法继续开发，项目会保存在开发历史。按累计投入的 <strong>10%～50%</strong> 随机回收资金，确认结束时抽取一次；不产生发售收入。</p><div class="result-grid"><div><label>累计投入</label><strong>${yen(s.spent)}</strong></div><div><label>可能回收</label><strong>${yen(Math.round(s.spent*.1))}—${yen(Math.round(s.spent*.5))}</strong></div><div><label>里程碑经验</label><strong>+${Math.min(30,s.milestones.length*8)} EXP</strong></div></div>${s.publisher?`<div class="release-reminder"><strong>终止需退还签约资金 ${yen(ending.advanceDue)}</strong><p>先结算随机回收，再从全局资金扣除预付款；不足时全部扣完，余额最低为 0，不留负债。</p><p>预计实际扣除 ${yen(ending.repayLow)}—${yen(ending.repayHigh)}，结束后余额 ${yen(ending.balanceLow)}—${yen(ending.balanceHigh)}。</p></div>`:''}<p class="quality-note">主角能力、名誉和全局团队保留，终止项目不获得名誉。结束所有未完成项目（含暂停项目）后，若余额低于最低立项门槛，可领取创业补助。${meta.activeRunId&&meta.activeRunId!==id?'正在开发的其他项目会继续保留当前状态。':''}</p><div class="dialog-actions"><button data-action="close" class="btn-ghost">保留这个项目</button>${ready?`<button data-action="release-ended-project" data-id="${id}" class="btn-primary"${disabled(!choicePending)}>${s.paused?'切换并查看发售':'查看发售方案'} ↗</button>`:''}<button data-action="confirm-end-project" data-id="${id}" class="btn-danger">确认结束并回收资金</button></div>`,'end-project');
  }
  function releaseEndedProject(id){
    const target=run&&!run.over&&run.id===id?run:meta.pausedProjects.find(p=>p.id===id);
    if(!target||!G.complete(target)||target.pendingEvent||target.eventResult?.unread){toast('请先完成发售准备与当前选择。');return;}
    if(target.paused){const resumed=G.resumeProject(meta,id,run);if(!resumed){toast('当前无法切换到这个项目。');return;}run=resumed;}
    view='game';tab='work';workModule='release';hiddenPrompt=false;close();render();release();
  }
  function endCurrentOrPausedProject(id){
    const r=G.endProject(meta,id,run);if(!r){toast('项目状态已变化，无法重复结束。');return;}
    hiddenPrompt=true;close();view='history';render();result(r);
  }

  function startupAidNotice(){
    const aid=G.startupAidStatus(meta,run);if(!aid.lowFunds)return '';
    if(!aid.eligible)return `<section class="startup-aid blocked" aria-label="创业补助"><div><strong>结束项目后，可申请创业补助。</strong><p>还有 ${aid.unfinished} 个未完成项目（含暂停项目）。请先发售或结束项目，再根据结算后的余额判断是否可领取。</p><small>暂停不算结束；结束项目可随机回收 10%～50% 的累计投入。</small></div><button class="btn-small" data-action="nav" data-view="history">查看未完成项目</button></section>`;
    return `<section class="startup-aid" aria-label="创业补助"><div><strong>好点子，值得再试一次。</strong><p>全部项目已结束，余额低于最低立项资金 ${yen(aid.threshold)}，可领取 ${yen(aid.amount)}，补足至初始资金 ${yen(aid.target)}。</p><small>保留能力、伙伴与开发历史；无需偿还，不计入作品收入和盈利。下次全部项目结束且余额不足时可再次领取。</small></div><button class="btn-primary" data-action="startup-aid">领取创业补助 +${yen(aid.amount)}</button></section>`;
  }
  function reputationCard(){const r=G.reputationStatus(meta),p=r.profile;return `<section class="reputation-card"><div><small>工作室名誉 · 永久累计</small><strong>${p.reputation.toLocaleString('zh-CN',{maximumFractionDigits:3})}</strong><span>已解锁 ${r.unlocked.length}／${r.total} 项</span></div><div class="reputation-next"><b>${r.next?esc(r.next.label):'当前里程碑全部达成'}</b><p>${r.next?'距 '+r.next.threshold+' 名誉还差 '+r.next.remaining:'后续里程碑待开放，名誉继续累计'}</p>${r.next?bar(p.reputation,r.next.threshold,'var(--gold)'):''}</div><button class="btn-small" data-action="nav" data-view="milestones">查看开发里程碑 ↗</button></section>`;}
  function developmentMilestones(){const r=G.reputationStatus(meta),p=r.profile;return title('STUDIO REPUTATION','开发里程碑','每一作的销售，让工作室走得更远。')+reputationCard()+`<section class="panel"><div class="panel-head"><h2>当前工作室权益</h2><span class="pill">自动解锁 · 无需消耗名誉</span></div><div class="growth-benefits"><div>全局团队<strong>${meta.partners.length+2} 人</strong><small>人数不限，包含主角与龙娘</small></div><div>可结识伙伴<strong>N～${p.talent}</strong><small>仍需招募与支付工资</small></div><div>团队加成<strong>速度 +${Math.round(p.speedBonus*100)}%</strong><small>士气上限 ${p.moraleCap}，需自行恢复</small></div><div>新签发行条件<strong>预付 ${Math.round(p.advanceRatio*100)}% · 分成 ${Math.round(p.studioShare*100)}%</strong><small>托管每项 ${p.managedWork} 点／周，已签合约条款保持</small></div></div><div class="panel-body"><p>名誉 = 分成前自然销售额与买量总回款之和 ÷100；合作发行再乘 50%。仅正式发售增加，预付款、补助、事件收入和结束回收均不计入。名誉永久累计，不因亏损或终止减少。</p><p>从 20 名誉开始，后续间隔逐步拉开；团队加成、伙伴与发行奖励交错发放。团队维护费为 ¥90＋技术债×2＋超过4人的人数²×4。</p></div></section><div class="milestone-list">${G.REPUTATION_NODES.map(n=>`<article class="milestone-node ${p.reputation>=n.threshold?'unlocked':r.next?.id===n.id?'next':''}"><span>${n.threshold}<small>名誉</small></span><div><h3>${esc(n.label)}</h3><p>${p.reputation>=n.threshold?'已永久解锁':r.next?.id===n.id?'下一里程碑 · 还差 '+r.next.remaining:'待解锁'}</p></div><b>${p.reputation>=n.threshold?'✓':r.next?.id===n.id?'→':'◇'}</b></article>`).join('')}</div>`;}

  function careerStats(){return `<div class="career-summary"><div class="stat"><span class="label">生涯资金</span><div class="value gold">${yen(meta.wallet)}</div><span class="note">所有项目共用的当前余额</span></div><div class="stat"><span class="label">${meta.activeRunId?'当前项目':'下个项目'}</span><div class="value teal">${meta.activeRunId&&run?run.stage:meta.stage}<small>号</small></div><span class="note">${meta.partners.length+2} 位全局团队成员</span></div><div class="stat"><span class="label">可用训练经验</span><div class="value">${meta.exp}<small>EXP</small></div><span class="note">训练能力后永久保留</span></div></div>`+reputationCard();}
  function career(){const released=meta.history.filter(h=>h.released),active=!!meta.activeRunId,team=[{...G.HERO,name:meta.hero.name,skills:meta.hero.skills},G.COMPANION,...meta.partners.map(id=>G.RECRUITS.find(r=>r.id===id))];return title('YOUR STUDIO CAREER','人、能力与资金，一起走到下一关。','项目的完成度重新开始，生涯的积累持续保留。')+careerStats()+`
    <section class="panel"><div class="panel-head"><h2>主角成长 · ${esc(meta.hero.name)}</h2><span class="pill">${active?'暂停或结算项目后可训练':'没有开发中项目时可训练'}</span></div><div class="panel-body"><form id="profile-form" class="profile-form"><label class="field"><span>主角称呼</span><input name="heroName" maxlength="12" required value="${esc(meta.hero.name)}"${disabled(!active)}></label><button class="btn-small"${disabled(!active)}>保存称呼</button></form><p class="quality-note">基础能力均为 100%。每次训练 +5，最高 200%；消耗经验，资金不变。训练后的能力带入后续每一个项目。</p><div class="growth-list">${G.SKILLS.map(j=>{const n=meta.hero.skills[j.id],price=G.trainingCost(meta,j.id);return `<div class="growth-row"><strong>${j.name}</strong><div class="ability-bar" style="--ability-color:${j.color}"><i style="width:${n/2}%"></i></div><b>${n}%</b><button class="btn-small" data-action="train" data-skill="${j.id}"${disabled(!active&&n<200&&meta.exp>=price)}>${n>=200?'已达上限':'+5 · '+price+' EXP'}</button></div>`;}).join('')}</div></div></section>
    <div class="section-heading"><h2>全局团队 · ${team.length} 人</h2><small>伙伴加入后跨关留队，工资按当前团队计算</small></div><div class="global-team">${team.map(m=>`<article class="panel global-person">${P.portrait(m)}${P.rankBadge(m,true)}<div><h3>${esc(m.name)}</h3><p>${m.id==='hero'?'主角 · 能力永久成长':m.id==='ace'?'全能搭档':esc(m.title)}</p><small>基础周薪 ${yen(m.salary)}</small></div>${m.id!=='hero'&&m.id!=='ace'?`<button class="btn-small" data-action="career-dismiss" data-id="${m.id}"${disabled(!active&&meta.wallet>=100)}>暂别 · ¥100</button>`:'<span class="pill dim">固定成员</span>'}</article>`).join('')}</div>
    ${P.recruitmentBoard(null,!active,recruitFilter,{meta,sort:recruitSort,compareIds})}
    <section class="panel career-history-link"><div><h2>开发历史 · 已发售 ${released.length} 款</h2><p>查看正在开发、暂停、已发售和已结束的全部产品。</p></div><button data-action="nav" data-view="history" class="btn-small">打开开发历史 ↗</button></section>
    <p class="quality-note" style="margin-top:24px">结束全部未完成项目后，余额低于最低立项门槛时可领取创业补助，保留生涯进度。重新开始生涯会重置资金、能力、伙伴和履历。</p><button class="btn-ghost btn-small" data-action="reset-career"${disabled(!active)}>重新开始生涯</button>`;}

  function render(){observeTutorial();const guide=$('workbench-guide');if(guide)guideOpen=guide.open;hideMetricHelp();G.syncCareer(meta,run);compareIds=compareIds.filter(id=>!meta.partners.includes(id));const labels={home:'工作室大厅',game:'开发现场',career:'局外生涯',history:'开发历史',milestones:'开发里程碑'};document.querySelectorAll('.sidebar nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('location').textContent=labels[view];$('app').classList.toggle('workbench-work',view==='game'&&tab==='work');$('run-dot').style.display=run&&!run.over?'':'none';$('meta-mini').innerHTML='<div class="side-growth"><small>生涯资金</small><div style="margin-top:8px"><strong class="gold">'+yen(meta.wallet)+'</strong></div><p>可用经验 '+meta.exp+' EXP<br>全局团队 '+(meta.partners.length+2)+' 人 · 名誉 '+meta.reputation.toLocaleString('zh-CN',{maximumFractionDigits:3})+'<br>已暂停 '+meta.pausedProjects.length+' 个项目'+'</p></div>';
    $('app').innerHTML=startupAidNotice()+({home,game,career,history:developmentHistory,milestones:developmentMilestones}[view])();renderFooter();save();renderTutorial();if(view==='game'&&!hiddenPrompt&&run&&!run.over){if(run.pendingEvent)showEvent();else if(run.eventResult?.unread)showEventResult();}}
  function renderFooter(){if(view!=='game'||!run||run.over){$('footer').innerHTML='';return;}const s=run,c=G.cost(s),pending=s.pendingEvent||s.eventResult?.unread;$('footer').innerHTML=`<footer class="actionbar"><div><p><strong>第 ${s.week} 周 · 团队开发</strong><span class="break-mobile">　${s.reserve?s.reserve+' 人尚未分配岗位':'岗位调整不消耗时间'}</span></p><p class="${s.money<c.total?'danger-text':''}" style="margin-top:4px">${pending?'完成当前选择后才能继续开发':s.money<c.total?'预算不足，请处理资金或结束项目':'推进后支付 '+yen(c.total)+'，并触发一次随机事件'}</p></div><div class="action-controls"><div class="pace" aria-label="开发节奏">${[['rest','休整'],['normal','正常'],['crunch','赶工']].map(([id,n])=>`<button data-action="pace" data-pace="${id}" title="${id==='rest'?'效率 70%，士气 +12':id==='crunch'?'效率 135%，士气 −10，增加技术债':'标准效率，士气 +1'}" class="${s.pace===id?'selected':''}"${disabled(!busy())}>${n}</button>`).join('')}</div><button data-action="${pending?'prompt':'advance'}" class="btn-primary next-week"${disabled(pending||s.money>=c.total)}>${pending?'完成当前选择':'推进一周'}　→</button></div></footer>`;}
  const metricPopup=document.createElement('aside');metricPopup.id='metric-help';metricPopup.className='metric-help';metricPopup.hidden=true;
  metricPopup.setAttribute('role','dialog');metricPopup.setAttribute('aria-modal','false');metricPopup.setAttribute('aria-labelledby','metric-help-title');document.body.append(metricPopup);
  let metricTrigger=null,metricPinned=false,metricHideTimer,suppressMetricFocus=false;
  document.addEventListener('pointerover',e=>{const b=e.target.closest('[data-metric-help]');if(b&&e.pointerType!=='touch'&&!metricPinned)showMetricHelp(b);});
  document.addEventListener('pointerout',e=>{const b=e.target.closest('[data-metric-help]');if(b&&!b.contains(e.relatedTarget)&&!metricPopup.contains(e.relatedTarget)&&!metricPinned)scheduleMetricHide();});
  metricPopup.addEventListener('pointerenter',()=>clearTimeout(metricHideTimer));
  metricPopup.addEventListener('pointerleave',e=>{if(!metricPinned&&!metricTrigger?.contains(e.relatedTarget))scheduleMetricHide();});
  document.addEventListener('focusin',e=>{const b=e.target.closest('[data-metric-help]');if(b){if(!suppressMetricFocus&&metricTrigger!==b)showMetricHelp(b);}else if(metricTrigger&&!metricPopup.contains(e.target))hideMetricHelp();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-metric-help]');
    if(b){e.preventDefault();if(metricTrigger===b&&metricPinned)hideMetricHelp();else showMetricHelp(b,true);return;}
    if(e.target.closest('.metric-help-close')){hideMetricHelp(true);return;}
    if(metricTrigger&&!metricPopup.contains(e.target))hideMetricHelp();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!metricPopup.hidden){e.preventDefault();hideMetricHelp(true);}});
  window.addEventListener('resize',()=>hideMetricHelp());
  window.addEventListener('scroll',positionMetricHelp,true);

  const dialog=$('dialog');let dialogKind='';
  function showDialog(html,kind){hideMetricHelp();dialogKind=kind;const tip=T.dialogTip(kind,tutorial);html=(tip?'<aside class="tutorial-dialog-tip" aria-label="新手教程提示"><b>◇ 天才程序员的小提示</b><p>'+esc(tip)+'</p></aside>':'')+html;dialog.innerHTML=`<div class="dialog-body">${html}</div>`;if(!dialog.open)dialog.showModal();renderTutorial();}
  function close(){dialog.close();dialogKind='';renderTutorial();}
  function dialogHeader(eye,name,closable=true){return `<div class="dialog-header"><div><div class="eyebrow">${eye}</div><h2 id="dialog-title">${name}</h2></div>${closable?'<button class="close-btn" data-action="close" aria-label="关闭窗口">×</button>':''}</div>`;}
  function updateProjectNameValidation(){
    const form=$('setup-form');if(!form)return false;
    const input=form.elements.name,status=G.projectNameStatus(input.value),warning=$('project-name-error');
    input.setCustomValidity(status.reason);input.setAttribute('aria-invalid',String(!status.ok));
    warning.textContent=status.reason;warning.hidden=status.ok;
    const affordable=meta.wallet>=G.scalePlan(setupScale).minFunds,button=form.querySelector('button[type="submit"]');
    button.disabled=!affordable||!status.ok;
    button.textContent=!affordable?'资金不足，无法立项':status.ok?'开始本次开发 →':'请修改作品名称';
    return status.ok;
  }

  function setup(scaleId){if(run&&!run.over){showDialog(dialogHeader('ONE PROJECT AT A TIME','先暂停，再开始新的点子。')+'<p class="dialog-desc">当前项目会保留进度、分工与随机事件，不结算经验，也不退回已花掉的资金。暂停后可以立项，或在开发历史中随时恢复。</p><div class="dialog-actions"><button data-action="close" class="btn-ghost">继续当前项目</button><button data-action="pause-setup" data-scale="'+(scaleId||setupScale)+'" class="btn-primary">暂停当前项目并立项</button></div>','setup-blocked');return;}setupScale=scaleId||setupScale;const g=G.SCALES.find(g=>g.id===setupScale),plan=G.scalePlan(g.id),affordable=meta.wallet>=plan.minFunds;showDialog(dialogHeader('PROJECT '+meta.stage,'开始第 '+meta.stage+' 个项目。')+`
    <p class="dialog-desc">继承生涯资金 <strong>${yen(meta.wallet)}</strong>、${esc(meta.hero.name)}的五项能力，以及 ${meta.partners.length+2} 人的全局团队。所有项目共用当前余额，不自动发放启动资金；结束所有未完成项目后，余额不足最低立项门槛时可主动领取创业补助。</p>${startupAidNotice()}<form id="setup-form"><div class="setup-scales">${G.SCALES.map(x=>`<button type="button" class="${x.id===setupScale?'selected':''}" data-action="setup-scale" data-scale="${x.id}">${x.icon} ${x.name}<small>${G.scalePlan(x.id).personWeeks.toLocaleString("zh-CN")} 人周 · ${meta.wallet<G.scalePlan(x.id).minFunds?'资金不足':'可立项'}</small></button>`).join('')}</div><div class="scale-explainer"><strong>${g.name} · 需要 ${plan.personWeeks.toLocaleString("zh-CN")} 人周工作量</strong><p>以 100% 能力计算，每人每周基础产出 ${G.STANDARD_WEEKLY_WORK} 点，即 1 标准人周。同能力、同状态的人员每周产出相同；实际开发还受士气、磨合、协作与模式影响。</p><div class="setup-funds ${affordable?'':'insufficient'}"><b>立项需要 ${yen(plan.minFunds)} · 当前 ${yen(meta.wallet)}</b><span>${affordable?'资金充足，可以开始开发':'资金不足，还差 '+yen(plan.minFunds-meta.wallet)}</span><small>每标准人周按 ${yen(G.STANDARD_PERSON_WEEK_COST)} 校验启动资金，仅为立项门槛，不预扣款；实际支出仍按周结算。</small></div><small>每作内容、程序、商业化的需求配比可能不同，总人周保持；第一作为均衡配比。本档自然收入 ×${g.revenueMultiplier}，市场再随机 ×${G.MARKET_MIN.toFixed(2)}～${G.MARKET_MAX.toFixed(2)}。${g.multiplier>1?' 建议先积累资金与团队，再挑战较大规模。':' 适合从这里开始积累生涯。'}</small></div><label class="field"><span>作品名称</span><input id="project-name" name="name" maxlength="18" required value="${esc(g.title)}" autocomplete="off" aria-describedby="project-name-error" aria-invalid="false"><small id="project-name-error" class="name-warning" aria-live="polite" hidden></small></label><label class="field"><span>这款作品的目标 · 达成最高 +40 EXP</span><select name="objective"><option value="profit">商业回报：项目结余至少 ¥1,200</option><option value="acclaim">口碑佳作：综合真实评级至少 A-</option></select></label><div class="radio-line"><label><input type="radio" name="difficulty" value="normal" checked> 理想模式 · 稳定推进</label><label><input type="radio" name="difficulty" value="hard"> 真实模式 · 感受一下现实吧</label></div><details style="margin-top:17px;font-size:10px;color:var(--muted)"><summary>固定种子（可选，用于重玩同一组随机选择）</summary><label class="field" style="margin-top:10px"><input name="seed" type="number" min="1" max="4294967295" placeholder="留空则随机生成"></label></details><div id="setup-error" class="warning-note" role="alert"></div><div class="dialog-actions"><button type="button" class="btn-ghost" data-action="close">再想想</button><button class="btn-primary" type="submit"${disabled(affordable)}>${affordable?'开始本次开发 →':'资金不足，无法立项'}</button></div></form>`,'setup');updateProjectNameValidation();}


  function showEvent(){const e=G.event(run);if(!e)return;hiddenPrompt=false;
    const voice=e.kind==='publisher'?'<div class="publisher-advice"><span aria-hidden="true">↗</span><div><strong>发行商代表</strong><p>我们一起把这款作品推进到下一个阶段。</p></div></div>':P.voice(run,e);
    showDialog(dialogHeader('WEEK '+String(run.week-1).padStart(2,'0')+' · '+esc(e.tag),esc(e.title))+`<div class="event-image" aria-hidden="true">${e.kind==='publisher'?'↗':e.kind==='daily'?'☕':'✦'}</div>${voice}<div class="event-context"><span>${G.SCALES.find(g=>g.id===run.scale).name} · 自然收入 ×${G.revenueRules(run).scaleMultiplier}</span><span>${run.hard?'真实模式':'理想模式'}</span></div><p class="dialog-desc">${esc(e.text)}</p><div class="event-options">${e.choices.map((c,i)=>{const status=G.eventChoiceStatus(run,i);return `<button class="event-option${e.kind==='daily'?' daily-option':''}" data-action="event" data-index="${i}"${disabled(status.ok)}><div><strong>${esc(c.label)}</strong>${c.hint||!status.ok?`<small>${esc(c.hint||'')}${!status.ok?' · '+esc(status.reason):''}</small>`:''}</div><span>↗</span></button>`;}).join('')}</div><p class="quality-note">${e.kind==='daily'?'做出选择，看看接下来会发生什么。':e.kind==='publisher'?'建议仅协助游戏内容、程序构架和商业化，可推进完成度或提高软上限。':'解锁软上限后仍需安排工作。'}选择会自动保存。</p>`,'event');
  }
  function eventResultVoice(s,r){const v=G.eventResponse(s,r),m=s.team.find(m=>m.id===v.id);return '<div class="team-voice event-response">'+P.portrait(m)+'<div><strong>'+esc(v.name)+'</strong><p>'+esc(v.text)+'</p></div></div>';}
  function showEventResult(){const r=run?.eventResult;if(!r)return;hiddenPrompt=false;showDialog(dialogHeader('WEEK '+String(r.week).padStart(2,'0')+' · 事件结果',esc(r.title))+`<div class="event-result-mark" aria-hidden="true">${r.kind==='publisher'?'↗':'✧'}</div><p class="event-choice-receipt">你的选择 · ${esc(r.label)}</p><p class="dialog-desc">${esc(r.text)}</p>${r.kind==='publisher'?'<p class="event-response">发行商代表：结果已同步给团队，接下来按新进展安排吧。</p>':eventResultVoice(run,r)}<div class="event-result-effects" aria-live="polite">${r.details.map(d=>`<p>${esc(d)}</p>`).join('')}</div><p class="quality-note">结果已保存；刷新或重新查看不会重复生效。</p><div class="dialog-actions"><button class="btn-primary" data-action="event-result-done">继续开发 →</button></div>`,'event-result');}

  function settlementOverview(r){
    const items=r.released?[
      ['项目结余',yen(r.profit),r.profit>=0?'teal':'red'],['综合真实评级',r.rating,'gold'],['本次市场际遇','×'+r.marketMultiplier.toFixed(2),r.marketMultiplier>=1?'teal':'red'],['生涯成长','+'+r.earnedReputation+' 名誉 · +'+r.exp+' EXP','gold']
    ]:[['结束回收',yen(r.recovery),'teal'],['退还签约资金',yen(r.advanceRepaid),''],['项目结余',yen(r.profit),r.profit>=0?'teal':'red'],['制作经验','+'+r.exp+' EXP','gold']];
    return '<div class="settlement-overview">'+items.map(([label,value,color])=>'<div><small>'+label+'</small><strong class="'+color+'">'+esc(value)+'</strong></div>').join('')+'</div>';
  }
  function resultInsights(r){
    if(!r.released)return '<div class="postmortem"><h3>本作复盘</h3><p>本作未发售，不产生销售名誉。回收 '+yen(r.recovery)+'，实际退还签约资金 '+yen(r.advanceRepaid)+'；资金与制作经验已结算。</p></div>';
    const groups=G.GROUPS.filter(g=>g.id!=='release'),weak=groups.slice().sort((a,b)=>G.GRADES.indexOf(r.ratings[a.id].grade)-G.GRADES.indexOf(r.ratings[b.id].grade))[0],share=r.publisher?Math.round(r.publisher.quote.studioShare*100):100;
    const market=r.marketMultiplier>1?'市场走热放大了自然销售':r.marketMultiplier<1?'市场遇冷压低了自然销售':'市场系数为 1，没有额外放大或缩小自然销售';
    return `<section class="postmortem" aria-label="本作复盘"><h3>本作复盘</h3><p>综合评级 ${r.rating}；${market}（×${r.marketMultiplier.toFixed(2)}）。${weak.rating} ${r.ratings[weak.id].grade} 是本作最低评级，对应总完成度 ${r.progress[weak.id].toFixed(1)}%。</p><p>下一作可尝试加强${weak.name}的投入，再观察实际评级与市场结果。</p><ol class="revenue-flow" aria-label="自然销售结算过程"><li><small>规模后基准自然收入</small><b>${yen(r.organicBaseRevenue)}</b></li><li><small>市场系数</small><b>×${r.marketMultiplier.toFixed(2)}</b></li><li><small>自然销售总额</small><b>${yen(r.organicGrossRevenue)}</b></li><li><small>工作室分成</small><b>${share}%</b></li><li><small>自然销售到账</small><b>${yen(r.organicRevenue)}</b></li></ol><small>按实际精度结算，显示数值经四舍五入。买量独立结算，工作室净回款 ${yen(r.adNetRevenue)}。</small></section>`;
  }
  function showAssignmentReview(){
    if(!G.assignmentUndoStatus(run)){toast('这次分配已失效，请重新分配后查看。');return;}
    const p=run.assignmentUndo.review,name=id=>id==='idle'?'待命':G.JOBS.find(j=>j.id===id).name;
    showDialog(dialogHeader('ASSIGNMENT REVIEW','本次分工调整')+`<p class="dialog-desc">已调整 ${p.changes.length} 人，保留 ${p.lockedCount} 人的锁定岗位。${esc(p.reason)}。</p><div class="assignment-review-list">${p.changes.map(c=>`<article><h3>${esc(c.name)} <span>${name(c.from)} → ${name(c.to)}</span></h3><p>${esc(c.reason)}</p></article>`).join('')}</div><h3>各岗位合计预计进展</h3><div class="assignment-gain-review">${p.jobChanges.map(j=>`<p><span>${j.name}</span><b>${j.before.toFixed(1)}% → ${j.after.toFixed(1)}%</b></p>`).join('')}</div><p class="quality-note">开发总完成度预计 +${p.beforeProgress.toFixed(2)}% → +${p.afterProgress.toFixed(2)}%；本周支出 ${yen(p.beforeCost)} → ${yen(p.afterCost)}。优化以当前策略权重为准，单项进展可能下降。预估按满效率，计入转岗、同岗协作、上限与依赖，不预测随机事件或真实模式随机结果。</p><div class="dialog-actions"><button data-action="assignment-undo" class="btn-ghost">撤销本次分配</button><button data-action="close" class="btn-primary">保留这次分配</button></div>`,'assignment-review');
  }
  function result(project=run){
    const r=project.result||project,signed=!!r.publisher;
    const cell=(label,value,note='',style='')=>`<div><label>${label}</label><strong class="${style}">${value}</strong>${note?`<small>${note}</small>`:''}</div>`;
    let cells=cell('项目规模',G.SCALES.find(g=>g.id===r.scale).name)+cell('开发时间',r.weeks+' 周')+cell('工作室累计投入',yen(r.cost),'含工作室自投买量；不含发行商垫付');
    if(r.released){
      cells+=cell('规模收益倍率','×'+r.scaleRevenueMultiplier)+cell('本次市场际遇',(r.marketMultiplier<1?'遇冷':r.marketMultiplier>1?'走热':'平稳')+' · ×'+r.marketMultiplier.toFixed(2),'综合 '+r.rating+' · 系数保底 ×'+r.marketFloor.toFixed(2),r.marketMultiplier>=1?'teal':'red')+cell('规模后基准自然收入',yen(r.organicBaseRevenue));
      cells+=cell('自然销售总额',yen(r.organicGrossRevenue))+cell('工作室自然收入',yen(r.organicRevenue),signed?'自然销售的 '+Math.round(r.publisher.quote.studioShare*100)+'%':'独立发行 · 全额到账');
      if(signed)cells+=cell('发行商自然销售分成',yen(r.publisherOrganicRevenue));
    }else cells+=cell('结束项目回收','+'+yen(r.recovery||0),r.recoveryRate===null?'尚无工作室投入，无可回收资金':'工作室投入回收 '+Math.round(r.recoveryRate*100)+'% · 结果已保存','teal');
    cells+=cell('买量总回款（分配前）',yen(r.adGrossRevenue))+cell('工作室自投买量成本',yen(r.studioAdSpend));
    if(signed)cells+=cell('发行商垫付买量成本',yen(r.publisherAdSpend))+cell('发行商收回买量成本',yen(r.publisherAdRecovered))+cell('发行商买量利润分成',yen(r.publisherAdProfit))+cell('发行商承担买量亏损',yen(r.publisherAdLoss),'工作室无需补差');
    cells+=cell('工作室买量到账',yen(r.adRevenue))+cell('买量净回款（工作室）',yen(r.adNetRevenue),'工作室到账 − 工作室自投成本',r.adNetRevenue<0?'red':'teal')+cell('评级回款比例（分配前）',r.released?(r.adRate*100).toFixed(1)+'%':'未发售');
    if(!r.released&&signed)cells+=cell('退还签约资金','−'+yen(r.advanceRepaid),'合约预付款 '+yen(r.advanceDue))+cell('预付款未追回部分',yen(r.advanceWrittenOff),'余额不足部分不转为负债');
    if(r.released)cells+=cell('产品总销售额（分成前）',yen(r.grossProductSales))+cell('本作获得名誉','+'+r.earnedReputation,(signed?'合作发行 ×50% · ':'')+'累计 '+r.reputationAfter,'gold');
    cells+=cell(r.released?'本次发售到账':'销售到账（未发售）',yen(r.revenue),'工作室自然收入 + 工作室买量到账','teal');
    if(signed)cells+=cell('发行预付款（此前已到账）',yen(r.publisher.advance),'已包含在项目其他收入，不重复入账');
    cells+=cell('项目其他收入（含预付款）',yen(r.otherIncome))+cell('项目结余',yen(r.profit),'发售到账 + 回收 + 其他收入 − 投入 − 退还签约资金',r.profit>=0?'teal':'red')+cell('本次制作经验','+'+r.exp+' EXP')+cell('结算时生涯余额',yen(r.walletEnd));
    showDialog(dialogHeader('THE TRUTH BEHIND THE QUESTION MARKS',r.released?'「'+esc(r.name)+'」发售了。':'把经验，留给下一作。')+`${settlementOverview(r)}${resultInsights(r)}${r.unlockedMilestones?.length?`<details class="release-reminder milestone-receipt"><summary>本次解锁 ${r.unlockedMilestones.length} 项开发里程碑</summary><ul>${r.unlockedMilestones.map(n=>`<li>${n.threshold} 名誉 · ${esc(n.label)}</li>`).join('')}</ul><button class="btn-small" data-action="nav" data-view="milestones">查看全部里程碑</button></details>`:''}${r.ratings?`<div class="result-ratings">${G.GROUPS.filter(g=>g.id!=='release').map(g=>`<div><small>${g.rating}</small><strong>${r.ratings[g.id].grade}</strong></div>`).join('')}</div>`:''}<details class="settlement-ledger"><summary>全部结算账目</summary><div class="result-grid">${cells}</div></details>${r.experience?`<details class="experience-review"><summary>制作经验构成 · 自主开发完成度 ${r.experience.completion.toFixed(1)}%</summary><p>基础 ${r.experience.base} · 开发成果 ${r.experience.development} · 品质 ${r.experience.quality} · 盈利 ${r.experience.profit} · 目标 ${r.experience.objective}${r.experience.mode?' · 模式 '+r.experience.mode:''} EXP</p></details>`:''}${r.teamReview?`<details class="experience-review"><summary>制作团队回顾</summary>${r.teamReview.map(m=>`<p><b>${esc(m.name)}</b> · ${m.weeks} 周参与 · 累计基础产能 ${m.output.toFixed(1)} 点<br><small>${esc(m.quote)}</small></p>`).join('')}</details>`:''}<p class="result-note">共同完成：${r.team.map(m=>esc(m.name)).join('、')}${signed?'、发行团队':''}<br>${r.objectiveOK?'✓ 制作人目标达成，最高 +40 EXP。':'本作未达成制作人目标，保留已获得的制作经验。'}<br>所有项目共用主角能力、全局团队和生涯资金。</p><div class="dialog-actions"><button data-action="nav" data-view="history" class="btn-ghost">查看开发历史</button><button data-action="${meta.activeRunId?'continue':'setup'}" class="btn-primary">${meta.activeRunId?'继续当前开发 →':'新项目 →'}</button></div>`,'result');
  }

  function release(){if(!G.canRelease(run))return;showDialog(dialogHeader('READY TO SHIP','让玩家，给出最后的答案。')+launchDecision(run,false)+'<div class="dialog-actions"><button data-action="close" class="btn-ghost">继续开发</button><button data-action="confirm-release" class="btn-primary">正式发售 ↗</button></div>','release');}
  function manualSections(){
    const block=(title,body)=>'<article class="manual-card"><h4>'+title+'</h4>'+body+'</article>';
    const text=body=>'<p>'+body+'</p>';
    const list=items=>'<ul>'+items.map(t=>'<li>'+t+'</li>').join('')+'</ul>';
    const ranks=['SR','SSR','UR'].map(r=>r+'：'+G.RECRUIT_REPUTATION[r]+' 名誉').join(' · ');
    return [
      {id:'start',name:'入门流程',intro:'先完成一款能够发售的小作品，再用积累的资金与经验挑战更大的项目。',body:
        block('第一作怎么开始',list(['在大厅选择规模、填写作品名称，再选择理想模式或真实模式。初期适合微型游戏。','进入开发现场，为每个人选择本周工作。岗位调整不消耗周数；每个人每周只负责一项工作。','查看本周费用和预估进展，点击「推进一周」，支付费用、推进开发并处理一次随机事件。','资料准备和审核进度均达到 100% 后即可正式发售；内容与其他模块不要求全部做满。']))+
        block('没有固定开发期限',text('开发可以一直继续，预算决定你还能支撑多久。先看当前余额、本周费用和可维持周数，再决定继续打磨还是发售。待命也要付工资。'))+
        block('制作人目标',text('立项时选择商业回报（本项目结余至少 ¥1,200）或口碑佳作（综合真实评级至少 A-）。目标是可选的追求，不是发售门槛；达成后按实际开发成果获得奖励，最高 40 EXP。'))+
        block('需要一步步引导',text('侧栏、大厅和本手册均可打开新手教程。教程在真实项目中引导操作，可收起、暂停、跳过或重新开始；阅读说明不会替你签约、花钱或推进时间。'))},
      {id:'work',name:'开发与完成度',intro:'工作点数表示投入，完成度表示这项工作的成果比例；两者要分开看。',body:
        block('五类工作，共十三项','<div class="manual-work-list">'+G.GROUPS.map(g=>'<p><strong>'+g.name+'</strong><span>'+G.JOBS.filter(j=>j.group===g.id).map(j=>j.name).join(' · ')+'</span></p>').join('')+'</div>')+
        block('规模与标准人周',text(G.SCALES.map(g=>g.name+' '+G.scalePlan(g.id).personWeeks.toLocaleString('zh-CN')+' 人周').join('；')+'。100% 能力对应每周 10 点基础产能，即 1 标准人周。实际产出还受士气、技术债、转岗、协作、节奏和事件影响。')+text('完成度＝已完成点数÷本项总需求。假设同样完成 10 点工作，总需求 100 点时增加 10%，总需求 300 点时约增加 3.3%。这里的 10 点是工作量，10% 是完成度变化。规模越大，相同产出换来的完成度越少。')+text('第一作需求均衡，后续项目可能偏重内容、系统或商业设计；同规模总人周不变，宣发与上架需求不随配比改变。立项资金门槛按每标准人周 ¥100 检查，仅校验余额，不预扣款。'))+
        block('软上限与刚性上限',text('除上架外，11 项工作的初始软上限为 70%。事件可逐项提高软上限，最高达到刚性上限 100%；提高上限不会自动完成工作，仍需分配人手。当前进度、软上限和预计进展可在岗位比较及工作卡查看。')+text('资料准备、审核进度不受软上限限制，都可以推进到 100%。达到软上限后继续安排通常不增加完成度；系统协作仍可偿还技术债，有预算的买量仍会持续花钱投放。真实模式还可能返工，详见《真实视界》。'))+
        block('为什么预估产出被限制',text('上游完成度会限制下游：游戏内容支持开发，开发支持系统协作和测试；测试同时需要系统协作。审核必须等资料准备在周初已达到 100% 才能推进，同一周完成资料不会立刻推进审核。')+text('预估按周初状态和满效率计算，计入人物能力、转岗、协作、上游和上限；岗位选项显示的是选岗后该岗位的团队合计进展。人物基础产能是点数，岗位进展是 %，不同人分到同岗时不要重复相加。'))},
      {id:'team',name:'团队与成本',intro:'团队没有人数上限；是否继续招募，取决于你能否承担后续开支。',body:
        block('成员与招募',text('开局有主角和天才程序员。主角没有稀有度评级；龙娘为特殊 EX，五项基础能力均为 145%。另有 '+G.RECRUITS.length+' 名 N／R／SR／SSR／UR 候选伙伴，人物卡可查看能力与不会的岗位。')+text('初始结识 '+G.reputationPartners(0).length+' 名 N／R 伙伴，高级伙伴随名誉结识：'+ranks+'。结识后仍需主动邀请；已结识的伙伴可全部入组，不再需要解锁编制。')+text('邀请支出 ¥180，暂别支出 ¥100。开发中每周可进行一次邀请或暂别，不推进时间；新伙伴首周有磨合。候选人可按能力或周薪排序，最多比较 3 人；费用预览分别计算单独邀请一人的余额、每周费用和可维持周数，不叠加候选。主角和龙娘不能暂别，同一伙伴暂别后本项目不能再次邀请，后续项目可以重新邀请。'))+
        block('能力、转岗与协作',text('100% 是标准能力，130% 及以上为擅长，0% 表示不会，不能分配对应岗位。换到另一具体工作时，即使同属一类，也有一周转岗磨合；默认产出减少 20%，按上周实际岗位判断。')+text('同岗最有效成员发挥完整产能，其余成员默认按 45% 协作效率计算，事件可能改变比例。并非人越集中产出越高，分散安排也要考虑依赖和上限。'))+
        block('工资、维护与工具',text('本周总支出＝全员工资＋维护费＋工具等额外费用＋工作室自投买量。待命人员照付工资；发行商垫付的买量单列，不从工作室余额扣除。')+text('基础维护费＝¥90＋技术债×2＋超过 4 人的人数²×4，再应用事件修正。团队越大，维护费增长越快；取消人数上限并不取消费用。'))+
        block('士气与技术债',text('士气影响人物效率：正常工作每周恢复 1，休整效率为 70%、士气恢复 12；赶工效率为 135%、士气减少 10，并增加技术债。士气上限可由名誉提高，提高上限不会自动恢复士气。')+text('开发会积累技术债。技术债降低程序类产出与完善度评级，并提高维护费；持续安排系统协作可偿债。数值旁的问号可随时查看说明。'))+
        block('自动分配',text('自动分配会考虑转岗、协作、上游依赖、剩余上限、买量预算和资金，并根据项目阶段、反馈需求与制作人目标分配权重。它不读取隐藏评级，也不预判真实模式的随机结果。10 人及以内求当前策略和锁定条件下的最优，大团队使用搜索，不保证全局最优；你仍可按长期计划手动调整。每个人可以锁定当前岗位，自动分配会保留锁定成员，手动换岗仍可用。分配后可查看逐人理由、各岗位预估变化，并撤销最近一次自动分配；推进周数、手动改岗、调整节奏或预算、变更团队后不可撤销。'))},
      {id:'ratings',name:'评级与收益',intro:'完成度能提高作品基础，但真实评级和市场表现仍有很大的随机性。',body:
        block('完成度不是评级',text('可玩性、完善度、商业化效果、推广效果分别使用 S／A／B／C／D 五档，每档分 +、无符号、−，共十五级。上架只显示准备状态。')+text('评级由当前完成度和立项时固定的随机值共同决定；技术债会影响完善度，事件也可通过改变开发进展影响评价。同样的完成度可能得到不同评级；刷新或反复查看不会重掷。更高完成度能提高基础，也影响能否达到最高评级。综合评级权重为内容 40%、完善度 30%、商业化 20%、推广 10%。'))+
        block('问号与认知范围',text('四项评级初始显示 ?????。宣传会减少问号并缩小认知范围，例如 B???? 只是可能偏差很大的粗略判断，不代表已确定是 B。宣传达到 100% 揭示当前真实评级；继续开发后评级仍可能变化。')+text('收入区间初始也不可见。宣传开始后显示粗略区间，在 25%、50%、75%、100% 逐档细化金额与评级认知。宣传不能消除市场波动，所以完全揭示评级后收入仍是区间，正式发售才知道实际结果。'))+
        block('自然销售与市场际遇',text('自然销售以作品综合品质、商业化评价和事件效果为基础，先乘规模倍率（微型 ×1／小型 ×3／中型 ×9／大型 ×27），再乘本次市场系数。')+text('基础市场系数在 ×0.10～10.00 间大幅波动；综合真实评级 B 档最低 ×0.50、A 档最低 ×1.00、S 档最低 ×2.00，含各档 +／−。C／D 最低 ×0.10。只把低于保底的结果抬到保底，其他抽样保持。市场运气可能压过品质差距，相同运气下提高品质仍有收益。'))+
        block('收入、结余与回本',text('界面的发售收入区间是工作室可到账的自然销售与买量回款，已扣发行分成，尚未扣开发成本，不是利润。买量净回款＝工作室买量到账−工作室自投买量成本。')+text('项目结余＝发售到账＋其他收入＋终止回收−本项目累计投入−终止退还开发款。发行开发款此前已到账，不在发售时重复发放；其他项目的收支不计入本作盈亏。')+text('发售决策中的「回本需到账」会抵扣已经收到的其他收入；「继续一周」同时显示下一周费用和下一周回本线。尚未领取的开发款不抵扣。资金是所有项目共用的实际余额，可能与单个项目的结余不同。'))},
      {id:'publishing',name:'宣发与发行',intro:'可以独立发行，也可以把宣发与上架交给发行商；宣传和买量各有不同用途。',body:
        block('宣传与买量',text('宣传用于认识作品，买量是花钱争取后续回款。两者都不是发售必做项。独立发行需安排买量人员并选择正预算才扣投放费；预算 ¥0 时没有买量进度，也不产生投放支出，但人员工资照付。')+text('买量预算按项目规模放大，同规模最高正预算是最低正预算的 20 倍，另有 ¥0 暂停档。买量完成度满后仍能持续投放，不设累计投放上限；发售前不回款。签约后预算由发行商逐周决定，玩家无法修改，暂停项目时投放也暂停。'))+
        block('买量回款风险',text('买量回款只按真实综合评级和投入金额结算，不再乘规模或市场系数。分配前回款率：D 档 15%～40%，C 档 55%～90%，B 档 105%～140%，A 档 165%～230%，S 档 270%～380%。C／D 档回款低于投入；B 档及以上回款高于投入，但整部作品仍可能因开发成本亏损。'))+
        block('发行开发款如何到账',text('签约额度按规模及已揭示评级的中位预期，估算基准自然销售，再乘合约开发款比例，四舍五入至百元、最低 ¥100；未宣传时按中性预期报价，不读取隐藏结果。初始比例为 60%，名誉可提升到 100%。')+text('签约先领额度的 20%；内容与程序六项的平均完成度达到 30%、60% 时，各领 40%。每档一次，进度回落不会重复领；中途签约立即发放已达标档位。正式发售保留已到账款，未达标余款不再发放；终止项目需退还实领款。'))+
        block('托管工作与收益分成',text('签约后宣传、买量、资料准备、审核由发行商自动推进，每项基础产能初始 20 点／周，名誉最高提升至 36 点／周；不占团队人手，相应岗位原有人员转为待命。托管仍受规模、上限、依赖与模式影响；名誉的人物速度加成不影响托管速度。')+text('初始合约给工作室自然销售的 50%，名誉最高提升至 75%。发行商垫付签约后的买量，先从回款回收成本，再按相同合约比例分配正净利润；亏损由发行商承担，工作室不补差。签约前工作室自投的回款归工作室，盈亏自负。')+text('开发款比例、分成和托管速度在每作签约时锁定，之后的名誉升级只改善新合约。每周买量预算按规模和当时已知评级预期调整；未宣传时按 B 档预期。合作发行得到的销售名誉减半。'))},
      {id:'growth',name:'名誉与成长',intro:'名誉由销售积累，经验用于训练；两者都能跨作品保留。',body:
        block('怎样获得名誉',text('正式发售获得名誉＝分成前自然销售总额与买量总回款之和÷100；合作发行再乘 50%。例如独立作品总销售 ¥2,000，获得 20 名誉；合作发行同样销售额获得 10。只看销售，不看利润，因此亏损作品也可能带来名誉。')+text('名誉永久累计、不消费，也不因亏损或终止减少。发行开发款、事件收入、创业补助和终止回收不计名誉，未发售项目不获得名誉。'))+
        block('更疏的里程碑节奏',text('共有 '+G.REPUTATION_NODES.length+' 个里程碑，从 '+G.REPUTATION_NODES[0].threshold+' 名誉开始；前几个节点为 '+G.REPUTATION_NODES.slice(0,6).map(n=>n.threshold).join('、')+'，后续间隔逐步增加。达到条件自动解锁，无需领取或消耗名誉。')+text('奖励交错提供高级伙伴、士气上限、人物工作速度，以及更高的发行开发款比例、工作室分成和托管产能。团队人数本来就不受限制，里程碑不再提供编制奖励。具体节点见「开发里程碑」页面。'))+
        block('制作经验怎么计算',text('正式发售基础奖励 10 EXP，自主开发成果奖励＝内容、程序、商业化九项平均完成度×80。品质原始奖励＝综合评分×0.4，盈利奖励最高 15 EXP，目标奖励最高 40 EXP。')+text('品质、盈利和目标这三部分再乘 min(1，自主开发完成度÷70%)，各项取整。少做开发只做上架，不能获得完整奖励。真实模式正式发售另加 25 EXP。发售报告可展开各部分构成与人物参与回顾。')+text('终止开发仅保留已经完成的项目进展里程碑经验，每项 8 EXP、最多 30；不领取正式发售的基础、品质、盈利、目标或模式奖励。'))+
        block('哪些成长能带走',text('主角五项能力初始均为 100%，暂停或结算当前项目后，可用经验训练，每次 +5、最高 200%；每次训练消耗会随能力提高而增加。主角能力、剩余资金、伙伴、结识名单、名誉和履历均跨作品保留。新项目重新开始完成度、软上限、士气与技术债。'))},
      {id:'projects',name:'项目与补助',intro:'暂停用于保留项目，结束会永久停止开发，正式发售才结算产品销售。',body:
        block('暂停、恢复与切换',text('同一时间只开发一个项目。暂停保留进度、岗位、事件、随机状态和发行合约，不结算经验，也不收取该项目开发周费用。可以从开发历史恢复或切换；恢复时同步共用资金、全局团队和主角能力。')+text('所有项目共用余额。开发其他项目花掉的资金会影响恢复后的可用预算，但不会被记作本项目成本。新项目仍要通过对应规模的立项资金门槛。'))+
        block('正式发售',text('资料准备和审核均达到 100%，并处理完当前选择后，就能确认发售。提前发售可以回收销售收入，也可能因为品质不足而亏损；发售前可对比当前回本线和维持当前分工再开发一周的费用与满效率进展；不预测下一周收入或随机结果。发售后揭晓真实评级、市场系数、收入、经验与名誉，并进入开发历史；先看本作复盘，全部结算账目可展开查阅。'))+
        block('结束项目与退款',text('开发现场与开发历史均可结束活动或暂停项目。结束后不能恢复，按工作室累计投入随机回收 10%～50%，确认时只抽一次；没有投入则回收为零。回收单列，不算产品销售，但计入项目结余。')+text('签约项目先获得回收，再退还实际已领开发款；资金不足时余额扣至 0，差额不留作负债，也不要求补发行商的买量亏损。如果已经满足发售条件，结束前会提醒可以选择发售。'))+
        block('创业补助',text('所有未完成项目（含暂停项目）都已发售或结束，且生涯余额低于 ¥5,440 时，可主动领取补助，补足至 ¥7,600。暂停项目仍算未完成，不能靠暂停领取补助。')+text('补助不消耗周数，不重掷结果，不重置能力、伙伴、名誉或历史；也不计入作品收入、盈利目标和销售名誉。'))+
        block('随机事件与存档',text('每推进一周触发一次事件，事件池会按当前进度、上限、依赖、预算、技术债、士气、资金和发行合约实时筛选，倾向于当前相关的短板，避免连续重复同一事件。')+text('既有可见效果事件，也有看似普通的日常与隐藏后果；相似场景不保证相同结果，隐藏后果在选择后揭示。发行商事件只在签约后出现，只协助内容、程序和商业化，不推进自己的四项托管工作。')+text('选择和项目进度保存在当前浏览器本机；刷新不会重新领取效果或重抽已保存结果。更换浏览器、设备或清除本地数据不会自动同步存档。声音默认关闭，可在顶部切换。'))},
      {id:'reality',name:'真实视界',intro:'真实模式与理想模式（原普通模式）的区别集中在以下几处。本页解释现行规则，不改变模式玩法。',body:
        block('按周初完成度分阶段','<div class="manual-table-wrap"><table class="manual-table"><thead><tr><th>周初完成度</th><th>理想模式</th><th>真实模式</th></tr></thead><tbody><tr><th>低于 30%</th><td>正常推进</td><td>正常推进</td></tr><tr><th>30%～不足 50%</th><td>正常推进</td><td>按当周基础产能的 65% 推进</td></tr><tr><th>50%～70%（含 70%）</th><td>正常推进</td><td>按 35% 推进，并可能牵连其他工作</td></tr><tr><th>超过 70%</th><td>正常推进</td><td>各有 50% 概率推进或返工</td></tr></tbody></table></div>'+text('阶段以每项工作在本周开始时的完成度判断，不会因本周跨过门槛而中途更换阶段。这里的「基础产能」已计入人物、士气、转岗、协作等共通修正；仍要受上游依赖和完成度上限限制。'))+
        block('50%～70%：牵连其他工作',text('这项工作取得正向进展时，可能随机扣除另一项已有进度的非上架工作。扣除的完成度约为本项正向进展的 20%：例如本项增加 10%，另一项约减少 2%，按各自需求换算点数。可牵连的工作没有进度时，不会扣成负数。'))+
        block('超过 70%：可能返工',text('每项有产出的工作分别随机决定方向，推进与返工各占 50%；幅度在当周基础产能的 20%～100% 间随机。推进仍受上限与依赖限制，返工最多降至 0%。因此继续投入不保证正向进展；已经到上限也可能返工。'))+
        block('上架工作始终例外',text('资料准备和审核始终正常推进，没有软上限，不会因真实模式出现负向产出，也不会被其他岗位牵连。审核仍需资料在周初已完成。签约后的托管宣传和买量也遵守真实模式规则，托管资料与审核享有相同上架例外。'))+
        block('预估与实际为何不同',text('两种模式的岗位预估和自动分配都按满效率计算，计入共通修正、转岗、协作、上限和上游依赖。真实模式预估不显示阶段减速，也不提前抽取或透露返工与牵连结果，所以实际推进可能更少，甚至为负；以本周结算和开发记录为准。'))+
        block('经验与界面差异',text('真实模式正式发售额外获得 25 EXP；终止项目没有这项加成。理想模式提供上周摘要，已揭示评级以可能范围为主标题；真实模式保留原有评级和记录展示。无实际数值变化的日常事件，在理想模式用轻提示结束，在真实模式仍需确认结果；有效果的隐藏事件两种模式都展示实际结果。'))+
        block('其余规则相同',text('真实模式没有额外工资加价。两种模式共用资金、招募、名誉、软上限、发售条件、发行分账和市场波动规则；理想模式的正常工作和随机事件不会降低当前完成度，仍需通过事件提高软上限。'))}
    ];
  }
  function help(section=manualSection){
    const sections=manualSections(),selected=sections.find(s=>s.id===section)||sections[0];manualSection=selected.id;
    showDialog(dialogHeader('PRODUCER HANDBOOK','制作人手册')+'<div class="manual-handbook"><p class="manual-intro">按主题查阅。查看手册不会推进周数或改变项目。</p><nav class="manual-nav" aria-label="手册分类">'+sections.map(s=>'<button id="manual-nav-'+s.id+'" data-action="manual-section" data-section="'+s.id+'" aria-pressed="'+(s.id===selected.id)+'" class="'+(s.id===selected.id?'selected':'')+'">'+s.name+'</button>').join('')+'</nav><section class="manual-topic" aria-labelledby="manual-section-title"><header><small>'+String(sections.indexOf(selected)+1).padStart(2,'0')+' / '+sections.length+'</small><h3 id="manual-section-title">'+selected.name+'</h3><p>'+selected.intro+'</p></header><div class="manual-cards">'+selected.body+'</div></section></div><div class="dialog-actions"><button data-action="tutorial" class="btn-ghost">进入新手教程</button><button data-action="close" class="btn-primary">回到游戏</button></div>','help');
  }


  function showWorkCapWarning(warnings,buying=G.buyingStatus(run)){
    const unfunded=buying.unfunded;
    showDialog(dialogHeader('CHECK YOUR ASSIGNMENTS',unfunded?'买量还没有设置投放预算。':'有伙伴的工作已到达上限。')+`${unfunded?'<div class="buying-status warning"><strong>'+esc(buying.members.map(m=>m.name).join('、'))+' · 买量</strong><p>预算为 ¥0，本周买量无进度、不扣投放费，但团队工资照付。请设置预算'+(buying.managed?'；发行团队的其他工作照常推进。':'，或调整这些伙伴的岗位。')+'</p></div>':''}${warnings.length?'<p class="dialog-desc">以下岗位已到达完成度上限，继续安排不会获得正向进度：</p>':''}<ul class="work-cap-list">${warnings.map(w=>`<li><strong>${esc(w.members.map(m=>m.name).join('、'))} · ${w.name}</strong><span>当前 ${w.completion.toFixed(1)}% / ${w.full?'刚性上限':'软上限'} ${w.cap}%</span>${w.ongoing?'<small>'+w.ongoing+'。</small>':''}${w.rework?'<small>真实模式下仍可能返工，降低当前完成度。</small>':''}</li>`).join('')}</ul><p class="warning-note">继续推进仍会支付本周工资、维护和投放等费用。${run.hard?'真实模式的实际结算仍包含阶段减速、返工与牵连。':''}</p><div class="dialog-actions">${unfunded?'<button data-action="open-ad-budget" class="btn-primary">去设置买量预算</button>':''}<button data-action="close" class="${unfunded?'btn-ghost':'btn-primary'}">返回调整分工</button><button data-action="confirm-advance" data-run="${run.id}" data-week="${run.week}" class="btn-ghost">仍然推进一周 →</button></div>`,'work-cap-warning');
  }
  function advanceWeek(){const result=G.advance(run);if(!result.ok)toast(result.reason);hiddenPrompt=false;render();}

  function finish(released){const r=G.finish(run,released);if(!r){toast('请先完成当前选择，或检查发售准备。');return;}meta=G.settle(meta,run);close();save();render();result();}
  document.addEventListener('input',e=>{if(e.target.matches('#setup-form input[name="name"]')&&!e.isComposing){$('setup-error').textContent='';updateProjectNameValidation();}});
  document.addEventListener('input',e=>{if(e.target.id!=='crew-search'||e.isComposing)return;crewSearch=e.target.value;const start=e.target.selectionStart,end=e.target.selectionEnd;render();const input=$('crew-search');input?.focus({preventScroll:true});input?.setSelectionRange(start,end);});
  document.addEventListener('compositionend',e=>{if(e.target.matches('#setup-form input[name="name"]'))updateProjectNameValidation();});
  document.addEventListener('change',e=>{const el=e.target;if(el.id==='recruit-sort'){recruitSort=el.value;render();return;}if(el.id==='crew-job'){crewJob=el.value;render();return;}if(el.id==='ad-budget'&&run){G.setAdBudget(run,Number(el.value));render();return;}if(!el.matches('select[data-member]')||!run)return;const ok=G.assignMember(run,el.dataset.member,el.value);if(ok)observeTutorial('assigned');if(!ok)toast('这个岗位暂时不能分配。');render();});
  document.addEventListener('submit',e=>{if(e.target.id==='profile-form'){e.preventDefault();const name=new FormData(e.target).get('heroName');if(!G.renameHero(meta,name))toast('请先暂停或结算项目再修改称呼。');render();return;}if(e.target.id!=='setup-form')return;e.preventDefault();if(!updateProjectNameValidation())return;const fd=new FormData(e.target);try{run=G.newRun({scale:setupScale,name:fd.get('name'),hard:fd.get('difficulty')==='hard',seed:fd.get('seed'),objective:fd.get('objective')},meta);}catch(err){$('setup-error').textContent=err.message;return;}view='game';tab='work';workModule='content';hiddenPrompt=false;crewSearch='';crewJob='all';crewExpanded=false;close();render();window.scrollTo(0,0);});
  document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b||b.disabled)return;e.preventDefault();const a=b.dataset.action;
    if(tutorialAction(a,b))return;
    if(a==='close'){const result=dialogKind==='event-result';if(result)G.acknowledgeEvent(run);hiddenPrompt=true;close();if(result)render();return;}
    if(a==='audio'){const st=audio.getState();audio.setSettings({muted:!(st.settings?.muted??st.muted)});audio.unlock();return;}
    if(a==='startup-aid'){
      const form=$('setup-form'),draft=form?Object.fromEntries(new FormData(form)):null;
      const amount=G.claimStartupAid(meta,run);if(!amount){toast(G.startupAidStatus(meta,run).reason);return;}
      close();render();
      if(draft){setup(setupScale);const next=$('setup-form');for(const [key,value] of Object.entries(draft))next.elements[key].value=value;updateProjectNameValidation();}
      toast('创业补助 +'+yen(amount)+'，生涯资金已补足至 '+yen(G.INITIAL_FUNDS)+'。');return;
    }
    if(a==='help'){help();return;}
    if(a==='manual-section'){help(b.dataset.section);document.getElementById('manual-nav-'+manualSection)?.focus();return;}
    if(a==='setup'){setup(b.dataset.scale);return;}
    if(a==='setup-scale'){const form=$('setup-form'),name=form.elements.name.value,mode=form.elements.difficulty.value,objective=form.elements.objective.value,seed=form.elements.seed.value,old=G.SCALES.find(g=>g.id===setupScale).title;setup(b.dataset.scale);if(name&&name!==old)$('setup-form').elements.name.value=name;$('setup-form').elements.difficulty.value=mode;$('setup-form').elements.objective.value=objective;$('setup-form').elements.seed.value=seed;updateProjectNameValidation();return;}
    if(['home','nav','continue','career'].includes(a)){view=a==='nav'?b.dataset.view:a==='continue'?'game':a==='career'?'career':'home';close();hiddenPrompt=false;render();window.scrollTo(0,0);return;}
    if(a==='end-project'){confirmEndProject(b.dataset.id);return;}
    if(a==='release-ended-project'){releaseEndedProject(b.dataset.id);return;}
    if(a==='confirm-end-project'){endCurrentOrPausedProject(b.dataset.id);return;}
    if(a==='pause-project'){pauseCurrentProject();return;}
    if(a==='pause-setup'){const scale=b.dataset.scale;if(pauseCurrentProject())setup(scale);return;}
    if(a==='resume-project'){const resumed=G.resumeProject(meta,b.dataset.id,run);if(!resumed){toast('当前无法恢复这个项目。');return;}run=resumed;view='game';tab='work';workModule='content';crewSearch='';crewJob='all';crewExpanded=false;hiddenPrompt=false;close();render();window.scrollTo(0,0);return;}
    if(a==='history-filter'){if(['all','active','paused','released','aborted'].includes(b.dataset.filter))historyFilter=b.dataset.filter;render();return;}
    if(a==='history-result'){const record=meta.history.find(r=>r.runId===b.dataset.id);if(record)result(record);return;}
    if(a==='result'){result();return;}
    if(a==='tab'){tab=b.dataset.tab;render();return;}
    if(a==='open-ad-budget'){close();tab='work';workModule='promotion';render();$('ad-budget')?.focus();return;}
    if(a==='work-module'){observeTutorial('module');selectWorkModule(b.dataset.module);return;}
    if(a==='train'){if(!G.train(meta,b.dataset.skill))toast('当前无法训练，请检查经验或先暂停项目。');render();return;}
    if(a==='recruit-filter'){if(['known','all',...G.PERSON_RANKS.map(r=>r.id)].includes(b.dataset.rank))recruitFilter=b.dataset.rank;render();return;}
    if(a==='career-hire'){if(!G.hirePartner(meta,b.dataset.id))toast('当前无法邀请，请检查资金或先结算项目。');render();return;}
    if(a==='career-dismiss'){const member=G.RECRUITS.find(r=>r.id===b.dataset.id);if(!member||meta.activeRunId)return;showDialog(dialogHeader('TEAM CHANGE','与'+esc(member.name)+'暂别？')+'<p class="dialog-desc">支付 ¥100，之后不再计算这位伙伴的工资。结识关系保留，后续可再次邀请。</p><div class="dialog-actions"><button data-action="close">继续同行</button><button data-action="confirm-career-dismiss" data-id="'+member.id+'">确认暂别 · ¥100</button></div>','career-dismiss');return;}
    if(a==='confirm-career-dismiss'){G.dismissPartner(meta,b.dataset.id);close();render();return;}
    if(a==='reset-career'){if(meta.activeRunId)return;showDialog(dialogHeader('A FRESH CAREER','重新开始整个生涯？')+'<p class="dialog-desc">资金恢复到 ¥7,600，主角五项能力恢复为 100%。已加入伙伴、后续结识关系、经验和作品履历都会清空，恢复为初始可结识名单。</p><div class="dialog-actions"><button data-action="close">保留当前生涯</button><button data-action="confirm-reset-career">确认重新开始</button></div>','reset-career');return;}
    if(a==='confirm-reset-career'){if(meta.activeRunId)return;meta=G.emptyMeta();run=null;close();view='career';render();return;}
    if(a==='crew-expand'){crewExpanded=!crewExpanded;render();return;}
    if(a==='compare-recruit'){const id=b.dataset.id;if(!G.RECRUITS.some(m=>m.id===id))return;if(compareIds.includes(id))compareIds=compareIds.filter(x=>x!==id);else if(compareIds.length<3)compareIds.push(id);else{toast('最多比较 3 人，请先移除一位。');return;}render();return;}
    if(!run||run.over)return;
    if(a==='prompt'){if(run.pendingEvent)showEvent();else if(run.eventResult?.unread)showEventResult();return;}
    if(a==='event-result-done'){G.acknowledgeEvent(run);close();hiddenPrompt=false;render();return;}
    if(a==='event'){if(G.resolveEvent(run,Number(b.dataset.index))){const r=run.eventResult;close();hiddenPrompt=false;render();if(!run.hard&&!r.unread)toast(r.text+' '+r.details.join(' · '));}return;}
    if(a==='release'){release();return;}
    if(a==='dismiss'){const m=run.team.find(m=>m.id===b.dataset.id);if(!m||m.kind!=='partner'||busy())return;showDialog(dialogHeader('UNTIL NEXT TIME','与'+esc(m.name)+'暂别？')+`<p class="dialog-desc">支付 ¥100 安置费，之后不再计入${esc(m.name)}的周薪。本项目内不能再次邀请；结识关系会保留到后续关卡。此操作占用本周管理行动。</p><div class="dialog-actions"><button data-action="close" class="btn-ghost">继续同行</button><button data-action="downsize" data-id="${m.id}">确认暂别 · ¥100</button></div>`,'dismiss');return;}
    if(a==='confirm-release'){finish(true);return;}
    if(a==='abort'){confirmEndProject(run.id);return;}
    if(busy()){toast('请先完成当前随机事件选择。');return;}
    if(a==='choose-job'){chooseJob(b.dataset.member);return;}
    if(a==='pick-job'){if(G.assignMember(run,b.dataset.member,b.dataset.job)){observeTutorial('assigned');close();render();}return;}
    if(a==='assignment-lock'){
      const id=b.dataset.member;if(G.setAssignmentLock(run,id,!run.assignmentLocks.includes(id))){render();toast('岗位锁定已更新；手动换岗仍然可用。');}return;
    }
    if(a==='assignment-review'){showAssignmentReview();return;}
    if(a==='assignment-undo'){const ok=G.undoAutoAssign(run);if(ok){close();render();toast('已恢复自动分配前的岗位。');}else toast('分工或项目状态已变化，无法撤销。');return;}
    if(a==='auto-assign'){
      const plan=G.autoAssign(run);if(!plan.ok){toast(plan.reason);return;}
      observeTutorial('assigned');
      if(!plan.improved){showDialog(dialogHeader('TEAM ASSIGNMENTS',plan.allLocked?'岗位已全部锁定':'无法优化任务分配了')+`<p class="dialog-desc">${plan.allLocked?'全队岗位均已锁定，请先解锁至少一人。':'当前条件下未找到更优分工。'+(plan.exact?'已比较当前目标、预算与锁定条件下的全部可行分配。':'本次大团队搜索未找到改善，不保证全局最优。')}${esc(plan.reason)}。</p><p class="quality-note">${plan.lockedCount} 人保持锁定。预估计入转岗磨合、同岗协作、上下游依赖、完成度上限与预算。真实模式仍按满效率预估。</p><div class="dialog-actions"><button class="btn-primary" data-action="close">保持当前分工</button></div>`,'auto-assignment');return;}
      render();toast('已调整 '+plan.changes.length+' 人。点击「查看变更」了解理由，或撤销本次分配。');return;
    }
    if(a==='advance'){const warnings=G.softCapWarnings(run),buying=G.buyingStatus(run);if(warnings.length||buying.unfunded)showWorkCapWarning(warnings,buying);else advanceWeek();return;}
    if(a==='confirm-advance'){if(b.dataset.run!==run.id||Number(b.dataset.week)!==run.week){close();toast('项目状态已变化，请重新检查分工。');return;}close();advanceWeek();return;}
    let ok=true;

    if(a==='publisher-contract'){confirmPublisher();return;}
    if(a==='confirm-publisher'){ok=G.signPublisher(run);close();if(ok)toast('签约金 '+yen(run.publisher.advance)+' 已到账；后续开发款随核心进展发放。请重新安排待命人物。');}
    if(a==='budget')ok=G.setAdBudget(run,Number(b.dataset.value));

    if(a==='pace'){if(run.pace!==b.dataset.pace)run.assignmentUndo=null;run.pace=b.dataset.pace;}
    if(a==='assign')ok=G.assign(run,b.dataset.job,Number(b.dataset.delta));
    if(a==='hire')ok=G.hire(run,b.dataset.id);
    if(a==='downsize'){ok=G.downsize(run,b.dataset.id);close();}
    if(!ok&&a!=='advance')toast('当前条件不满足，操作未执行。');render();
  });
  dialog.addEventListener('cancel',()=>{const result=dialogKind==='event-result';if(result)G.acknowledgeEvent(run);hiddenPrompt=true;dialogKind='';if(result)render();});
  dialog.addEventListener('close',renderTutorial);
  document.addEventListener('keydown',e=>{const b=e.target.closest('[data-action="work-module"]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=G.GROUPS.findIndex(g=>g.id===b.dataset.module),n=G.GROUPS.length,next=e.key==='Home'?0:e.key==='End'?n-1:(i+(e.key==='ArrowRight'?1:-1)+n)%n;observeTutorial('module');selectWorkModule(G.GROUPS[next].id);$('work-tab-'+G.GROUPS[next].id)?.scrollIntoView({block:'nearest',inline:'nearest'});});
  document.addEventListener('keydown',e=>{if(e.key===' '&&view==='game'&&!dialog.open&&!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();document.querySelector('.next-week')?.click();}});
  // Terminating a project is always visible from its history tab, including an exhausted budget.
  const originalLogs=logs;logs=function(){return originalLogs()+(!run.over?'<div style="display:flex;justify-content:flex-end;margin-top:18px"><button class="btn-ghost btn-small" data-action="abort">结束当前项目并回收资金</button></div>':'');};
  if(run&&run.over){meta=G.settle(meta,run);}render();
  if(T.shouldOffer(tutorial,tutorialContext()))tutorialWelcome();
})();
