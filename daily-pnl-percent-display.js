/* CASA BANKO: additive daily-return display. Does not alter TradeLocker sync or existing P&L rendering. */
(()=>{
  'use strict';
  const format=n=>(n>=0?'+':'−')+Math.abs(n).toFixed(2)+'%';
  let scheduled=false;
  function paint(){
    const broker=window.casaBankoBrokerDailyPnl;
    let account=null;
    try{account=JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{}
    const balance=Number(account?.balance);
    const amount=broker?.amount;
    const valid=!!account?.id&&broker?.accountId===String(account.id)&&typeof amount==='number'&&Number.isFinite(amount)&&Number.isFinite(balance)&&balance-amount>0;
    const targets=[
      document.querySelector('#globalLiveAccount'),
      document.querySelector('#premiumDashboard .p2liveBox')
    ];
    for(const target of targets){
      if(!target)continue;
      let node=target.querySelector('[data-banko-daily-percent]');
      const daily=target===targets[0]?[...target.children].find(el=>el.textContent.includes('TODAY')):target.querySelector('span');
      if(!valid||!daily||!daily.textContent.includes('TODAY')||daily.textContent.includes('AWAITING')){
        if(node)node.remove();
        continue;
      }
      const pct=amount/(balance-amount)*100;
      const value=format(pct);
      if(!node){
        node=document.createElement('div');
        node.dataset.bankoDailyPercent='1';
        node.style.cssText='font-size:10px;font-weight:900;line-height:1.25;margin-top:3px;text-align:center;';
        daily.insertAdjacentElement('afterend',node);
      }
      if(node.textContent!==value)node.textContent=value;
      const color=amount>=0?'#67d391':'#ff6b6b';
      if(node.style.color!==color)node.style.color=color;
    }
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;paint()});
  }
  function init(){
    schedule();
    const top=document.querySelector('.hero');
    const dashboard=document.getElementById('premiumDashboard');
    if(top)new MutationObserver(schedule).observe(top,{childList:true,subtree:true,characterData:true});
    if(dashboard)new MutationObserver(schedule).observe(dashboard,{childList:true,subtree:true,characterData:true});
    window.addEventListener('casaBankoLiveAccountDisplayed',schedule);
    window.addEventListener('casaBankoLiveBalanceUpdated',schedule);
    window.addEventListener('storage',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();