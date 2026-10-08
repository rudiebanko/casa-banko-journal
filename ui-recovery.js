// CASA BANKO UI recovery: keep navigation independent from journal editor errors.
(function(){
  function showScreen(name){
    var target=document.getElementById(name); if(!target)return;
    document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active')});
    target.classList.add('active');
    document.querySelectorAll('nav button[data-screen]').forEach(function(b){b.classList.toggle('active',b.dataset.screen===name)});
    try{localStorage.setItem('casaBankoActiveTab',name)}catch(e){}
    try{if(typeof refreshAll==='function')refreshAll()}catch(e){console.warn('refreshAll skipped',e)}
    if(name==='journal'){
      var list=document.getElementById('manageList'); if(list)list.classList.add('open');
      try{if(typeof renderManage==='function')renderManage()}catch(e){console.warn('renderManage skipped',e)}
    }
    if(name==='calendar'){try{if(typeof autoOpenCalendarDay==='function')autoOpenCalendarDay()}catch(e){}}
    window.scrollTo(0,0);
  }
  function init(){
    document.querySelectorAll('nav button[data-screen]').forEach(function(btn){
      btn.onclick=function(e){e.preventDefault();e.stopPropagation();showScreen(btn.dataset.screen)};
    });
    // Journal starts clean: no manual form opened automatically.
    var form=document.getElementById('manualTradeForm');
    var toggle=document.getElementById('manualTradeToggle');
    if(form)form.style.display='none';
    if(toggle){toggle.style.display='block';toggle.textContent='＋ ADD TRADE MANUALLY'}
    // Keep synced Trade History visible so a synced trade can be selected and journaled.
    var manage=document.getElementById('manageList'); if(manage)manage.classList.add('open');
    try{if(typeof renderManage==='function')renderManage()}catch(e){}
    var saved='journal';try{saved=localStorage.getItem('casaBankoActiveTab')||'journal'}catch(e){}
    if(!document.getElementById(saved))saved='journal';
    // The main app has already restored and rendered the saved screen on startup.
    // Avoid a second full refresh; keep this recovery handler for subsequent navigation.
    var active=document.querySelector('.screen.active');
    if(!active || active.id!==saved)showScreen(saved);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.casaShowScreen=showScreen;
})();