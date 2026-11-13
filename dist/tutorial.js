/* New-player guidance is a read-only observer of the real career. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StudioTutorial=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='loop_studio_tutorial_v1';
  const STEPS=[
    {id:'project',title:'先做一款小作品',text:'第一作推荐「微型游戏＋理想模式」。取一个作品名，再开始开发。规模越大，需要的人周和启动资金越多。',note:'立项门槛不预扣钱；真正的开发支出按周结算。',label:'去立项',target:'.hero-buttons',view:'home'},
    {id:'assign',title:'给伙伴安排工作',text:'你和天才程序员各自每周负责一项工作。试着修改一个人的岗位，或点击「自动分配」。擅长的能力产出更高，不会的岗位不能选择。',note:'换岗不推进时间；转岗磨合、同岗协作和上限会影响本周产出。',label:'定位人物分工',target:'.crew-strip, .people-grid',view:'game'},
    {id:'modules',title:'认识五类工作',text:'点击任意评级卡切换模块，看看下面的工作。五类模块共 13 项：内容、程序、商业化、宣发推广和上架。',note:'????? 是尚未揭示的评级。宣传能减少问号，也会逐步揭示收入区间。',label:'定位工作模块',target:'.ratings-summary',view:'game'},
    {id:'caps',title:'读懂进度与预期',text:'每项工作都显示当前完成度、软上限和本周预计进展。初始软上限为 70%，需要随机事件提高；提高上限后，还要继续工作。',note:'“等待上游”时先补前置工作；“已到软上限”时换一项做。真实模式的实际结果可能低于满效率预估。',label:'我看懂了，继续',target:'.work-item',view:'game'},
    {id:'budget',title:'一周，也是一笔成本',text:'看一眼资金和本周支出。推进一周才会支付工资、维护与投放费用；待命成员也有工资。初次体验建议保持正常节奏。',note:'没有固定回合上限。士气与技术债旁的问号可查看说明。',label:'准备好了，学习推进',target:'.stats',view:'game'},
    {id:'week',title:'亲手推进一周',text:'确认分工和预算后，点击底部「推进一周」。系统先支付成本、推进安排的工作，再带来一次随机事件。',note:'若出现上限或买量预算提醒，先检查原因，再决定调整还是继续。',label:'定位推进按钮',target:'.next-week',view:'game'},
    {id:'event',title:'处理开发中的小插曲',text:'阅读事件并选择一个选项。有些选项会展示效果，有些要选择后才知道结果，也可能什么都没发生。',note:'事件可能提高软上限或带来其他变化。完成选择与结果确认后，再继续开发。',label:'打开当前事件',target:'.project-aside',view:'game'},
    {id:'publisher',title:'选择自己的发行方式',text:'独立发行需自己安排宣发与上架。微型首作可以试试全托管：签约先领部分开发款，把这四项交给发行团队。仅代理上架则只接管资料和审核，宣发仍由你决定。',note:'全托管按合约分成，销售名誉减半。仅代理上架不预付开发款，抽取自然销售的 10%，保留 80% 销售名誉。签约完全可选。',label:'查看发行合作',target:'.publisher-panel',view:'game'},
    {id:'release',title:'把作品送到玩家手里',text:'发售只要求资料准备与审核都到 100%：先完成资料，再推进审核。其他工作可以自行取舍，但完成度会影响品质与收益。',note:'完成度触顶时调整分工。宣传用于了解评级，买量可不做；自己投放时必须安排人手并设置正预算。',label:'查看上架准备',target:'#group-release',view:'game'},
    {id:'growth',title:'每一作都留下积累',text:'发售后资金、主角能力、伙伴和名誉带到下一作。销售带来名誉，逐步结识高级伙伴、获得团队加成和更好的合约；团队人数不限；经验用于训练主角。',note:'开发历史可以暂停、恢复或结束项目，同一时间只开发一作。所有项目结束后，资金不足可领取创业补助。',label:'完成教程，开始自由开发',target:'#nav-milestones',view:'milestones'}
  ];
  function empty(){return {version:1,status:'unseen',step:'project',runId:null,weekAt:0,route:null,minimized:false};}
  function valid(s){return !!s&&s.version===1&&['unseen','active','paused','skipped','done'].includes(s.status)&&STEPS.some(x=>x.id===s.step)&&(s.runId===null||typeof s.runId==='string')&&Number.isInteger(s.weekAt)&&s.weekAt>=0&&[null,'indie','publisher'].includes(s.route)&&typeof s.minimized==='boolean';}
  function live(ctx){return ctx.run&&!ctx.run.over&&!ctx.run.paused&&ctx.meta.activeRunId===ctx.run.id;}
  function shouldOffer(s,ctx){return s.status==='unseen'&&ctx.meta.stage===1&&!ctx.meta.history.length&&!ctx.meta.pausedProjects.length&&!ctx.meta.activeRunId;}
  function start(s,ctx,restart=false){
    if(!valid(s))s=empty();
    const n={...(restart||!valid(s)?empty():s),status:'active',minimized:false};
    if(restart||['done','skipped','unseen'].includes(s.status)){
      n.step=live(ctx)?ctx.run.pendingEvent||ctx.run.eventResult?.unread?'event':'assign':'project';
      n.runId=live(ctx)?ctx.run.id:null;n.weekAt=live(ctx)?ctx.run.week:0;n.route=null;
    }
    return update(n,'observe',ctx);
  }
  function update(s,signal,ctx){
    const n={...s};if(n.status!=='active')return n;
    if(signal==='pause'){n.status='paused';return n;}
    if(signal==='skip'){n.status='skipped';return n;}
    if(signal==='finish'&&n.step==='growth'){n.status='done';return n;}
    if(signal==='minimize'){n.minimized=!n.minimized;return n;}
    const r=ctx.run;
    if(live(ctx)&&(n.runId!==r.id||n.step==='project')){n.runId=r.id;n.weekAt=r.week;n.route=null;n.step=r.pendingEvent||r.eventResult?.unread?'event':'assign';}
    if(!live(ctx)&&n.step!=='growth'){
      n.step=r?.over&&r.result?.released&&r.id===n.runId?'growth':'project';return n;
    }
    if(n.step==='assign'&&signal==='assigned')n.step='modules';
    else if(n.step==='modules'&&signal==='module')n.step='caps';
    else if(n.step==='caps'&&signal==='next')n.step='budget';
    else if(n.step==='budget'&&signal==='next')n.step=r.week>n.weekAt?'event':'week';
    else if(n.step==='week'&&r.week>n.weekAt)n.step='event';
    if(n.step==='event'&&!r.pendingEvent&&!r.eventResult?.unread&&r.week>1)n.step=r.publisher?'release':'publisher';
    if(n.step==='publisher'){
      if(r.publisher){n.route='publisher';n.step='release';}
      else if(signal==='indie'){n.route='indie';n.step='release';}
    }
    if(n.step==='release'&&signal==='learn-growth')n.step='growth';
    return n;
  }
  function detail(s,ctx){
    const step=STEPS.find(x=>x.id===s.step),d={...step,index:STEPS.indexOf(step)+1,total:STEPS.length};
    if(s.step==='release'&&ctx.run?.publisher){d.text='发行团队会自动推进资料与审核。你可以继续打磨内容、程序和商业化；两项上架工作到 100% 后，点击「正式发售」。';d.note='自动上架仍有前置顺序与每周成本。先完成当前事件，才可发售；你决定什么时候停止打磨。';}
    if(s.step==='project'&&ctx.meta.pausedProjects.length){d.text='可以从开发历史恢复一个暂停项目，也可以重新立项。同一时间只开发一作，所有作品共用资金。';}
    return d;
  }
  function dialogTip(kind,s){
    if(s.status!=='active')return '';
    return {setup:'第一作推荐微型游戏与理想模式。填好名字，再开始本次开发；教程不会替你花钱。',event:'这是本周的随机事件。先看清选项；未知后果会在选择后揭晓，按自己的想法决定即可。','event-result':'这是刚才选择的实际结果。确认后回到开发，效果已保存，不会重复领取。',publisher:'这是可选合约。确认后分成和托管速度会锁定。只有全托管提供分期开发款，终止时需要退还已到账款。','work-cap-warning':'提醒表示部分安排可能没有正向进展。你可以返回换岗，也可以在了解成本后继续。',release:'现在可以发售了。此处显示的是当前认知区间，真实品质与市场结果会在正式发售时揭晓。',result:'本次结算已经保存。关闭报告可继续教程，了解作品如何积累到下一作。'}[kind]||'';
  }
  return {KEY,STEPS,empty,valid,shouldOffer,start,update,detail,dialogTip};
});
