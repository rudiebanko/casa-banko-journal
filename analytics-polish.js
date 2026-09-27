/* CASA BANKO Analytics cleanup. Stats owns summary/performance; Analytics owns deeper setup analysis. */
(function(){
  const duplicateTitles=new Set(['TRADE RESULTS','ENTRY MODEL','SESSION','MARKET PHASE','DIRECTION','TRADE GRADE']);
  function polishAnalytics(){
    const root=document.getElementById('analyticsCharts');
    if(!root)return;
    [...root.children].forEach(card=>{
      const title=(card.querySelector('.title')?.textContent||'').trim().toUpperCase();
      if(duplicateTitles.has(title)) card.remove();
    });
    [...root.children].forEach(card=>{
      const title=(card.querySelector('.title')?.textContent||'').trim().toUpperCase();
      card.classList.toggle('analyticsWide',title==='PROGRESS OVER TIME'||title==='BANKOS BY TRADE');
    });
    const filterCard=document.querySelector('#analytics > section.card');
    if(filterCard&&!filterCard.querySelector('.analyticsDeepNote')){
      const note=document.createElement('div');note.className='analyticsDeepNote';
      note.textContent='Deep setup analysis — use Stats for overall performance, sessions, direction, phase, grade and entry-model results.';
      const range=filterCard.querySelector('#analyticsRange');(range||filterCard).insertAdjacentElement('afterend',note);
    }
  }
  const base=window.renderAnalytics;
  if(typeof base==='function')window.renderAnalytics=function(){base();polishAnalytics()};
  document.addEventListener('DOMContentLoaded',()=>setTimeout(polishAnalytics,120));
  window.addEventListener('storage',()=>setTimeout(polishAnalytics,80));
  window.polishAnalytics=polishAnalytics;
})();
