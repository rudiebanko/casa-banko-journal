/* CASA BANKO Stats upgrade. Reads the active account's already-isolated allTrades() data. */
(function(){
  const money=n=>(n<0?'-$':'$')+Math.abs(n).toFixed(2);
  const pct=(w,l)=>w+l?Math.round(w/(w+l)*100)+'%':'—';
  const arr=v=>Array.isArray(v)?v:(v?[v]:[]);
  const esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function filtered(){try{return byRange(statsFilter,customFrom,customTo,$('rangeLabel'))||[]}catch(e){return typeof allTrades==='function'?allTrades():[]}}
  function group(a,key){let m={};a.forEach(t=>arr(t[key]).forEach(v=>{if(!v||v==='NONE')return;let x=m[v]||(m[v]={n:0,w:0,l:0,p:0});x.n++;if(t.result==='WIN')x.w++;if(t.result==='LOSS')x.l++;x.p+=+t.pnl||0}));return Object.entries(m).sort((a,b)=>b[1].p-a[1].p)}
  function rows(title,data){let h='<section class="card statsBreakCard"><div class="statsSectionTitle">'+title+'</div>';if(!data.length)return h+'<div class="statsEmpty">No tagged data yet.</div></section>';data.forEach(([name,x])=>{h+='<div class="statsBreakRow"><div><div class="statsBreakName">'+esc(name)+'</div><div class="statsBreakMeta">'+x.n+' trades · '+pct(x.w,x.l)+' win</div></div><div class="statsBreakValue '+(x.p>0?'pos':x.p<0?'neg':'')+'">'+money(x.p)+'<small>'+x.w+'W · '+x.l+'L</small></div></div>'});return h+'</section>'}
  function streaks(a){let o=[...a].sort((x,y)=>(tradeTime(x)||0)-(tradeTime(y)||0)),bestW=0,bestL=0,cw=0,cl=0;for(const t of o){if(t.result==='WIN'){cw++;cl=0;bestW=Math.max(bestW,cw)}else if(t.result==='LOSS'){cl++;cw=0;bestL=Math.max(bestL,cl)}else{cw=cl=0}}return{bestW,bestL}}
  function renderFinishedStats(){
    if(!document.getElementById('stats')||typeof byRange!=='function')return;
    const a=filtered(),w=a.filter(x=>x.result==='WIN').length,l=a.filter(x=>x.result==='LOSS').length,b=a.filter(x=>x.result==='BREAKEVEN').length,p=a.reduce((s,x)=>s+(+x.pnl||0),0),rs=a.filter(x=>x.r!==null&&x.r!==''&&Number.isFinite(+x.r)),totalR=rs.reduce((s,x)=>s+(+x.r),0),avgWin=w?a.filter(x=>x.result==='WIN').reduce((s,x)=>s+(+x.pnl||0),0)/w:0,avgLoss=l?a.filter(x=>x.result==='LOSS').reduce((s,x)=>s+(+x.pnl||0),0)/l:0,taggedPlan=a.filter(x=>x.plan==='YES'||x.plan==='NO'),plan=taggedPlan.length?Math.round(taggedPlan.filter(x=>x.plan==='YES').length/taggedPlan.length*100):null,graded=a.filter(x=>['A','A+'].includes(x.grade)).length,st=streaks(a);
    const first=document.querySelector('#stats > .card'); if(!first)return;
    first.classList.add('statsHero');
    /* The compact hero replaces the old duplicate stat cards, while the existing filters stay functional. */
    const legacyGrid=first.querySelector('.statGrid'); if(legacyGrid)legacyGrid.style.display='none';
    const legacyMini=[...document.querySelectorAll('#stats > .card')].find(c=>c!==first&&c.querySelector('#wins')); if(legacyMini)legacyMini.style.display='none';
    let old=document.getElementById('statsFinishedSummary'); if(old)old.remove();
    const box=document.createElement('div');box.id='statsFinishedSummary';box.innerHTML='<div class="statsHeroTop"><div class="statsHeroPnl"><div class="k">NET P&L</div><div class="v '+(p>0?'pos':p<0?'neg':'')+'">'+money(p)+'</div></div><div class="statsHeroSide"><div class="k">WIN RATE</div><div class="v">'+pct(w,l)+'</div></div></div><div class="statsQuick"><div class="statsQuickBox"><div class="k">TRADES</div><div class="v">'+a.length+'</div></div><div class="statsQuickBox"><div class="k">W / L / BE</div><div class="v">'+w+' / '+l+' / '+b+'</div></div><div class="statsQuickBox"><div class="k">AVG WIN</div><div class="v pos">'+money(avgWin)+'</div></div><div class="statsQuickBox"><div class="k">AVG LOSS</div><div class="v neg">'+money(avgLoss)+'</div></div><div class="statsQuickBox"><div class="k">TOTAL R</div><div class="v">'+(rs.length?totalR.toFixed(2)+'R':'—')+'</div></div><div class="statsQuickBox"><div class="k">AVG R</div><div class="v">'+(rs.length?(totalR/rs.length).toFixed(2)+'R':'—')+'</div></div></div>';
    const title=first.querySelector('.title'); title.insertAdjacentElement('afterend',box);
    let details=document.getElementById('statsFinishedDetails');if(details)details.remove();details=document.createElement('div');details.id='statsFinishedDetails';details.innerHTML='<section class="card statsQuality"><div class="statsSectionTitle">EXECUTION QUALITY</div><div class="statsStreakGrid"><div class="statsStreak"><div class="k">PLAN FOLLOWED</div><div class="v">'+(plan===null?'—':plan+'%')+'</div></div><div class="statsStreak"><div class="k">A / A+ TRADES</div><div class="v">'+graded+'</div></div><div class="statsStreak"><div class="k">BEST WIN STREAK</div><div class="v">'+st.bestW+'</div></div><div class="statsStreak"><div class="k">MAX LOSS STREAK</div><div class="v">'+st.bestL+'</div></div></div></section>'+rows('SESSION PERFORMANCE',group(a,'session'))+rows('DIRECTION PERFORMANCE',group(a,'direction'))+rows('MARKET PHASE',group(a,'phase'))+rows('TRADE GRADE',group(a,'grade'))+rows('ENTRY MODEL',group(a,'model'));
    document.getElementById('stats').appendChild(details);
  }
  const base=window.renderStats;if(typeof base==='function')window.renderStats=function(){base();renderFinishedStats()};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(renderFinishedStats,100));
  window.addEventListener('storage',()=>setTimeout(renderFinishedStats,50));
  window.renderFinishedStats=renderFinishedStats;
})();