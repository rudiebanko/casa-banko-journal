(()=>{
  const TZ='America/Los_Angeles', CUTOFF_HOUR=14;
  const $=id=>document.getElementById(id);
  function laParts(now=new Date()){
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now);
    const out={}; for(const p of parts) if(p.type!=='literal') out[p.type]=Number(p.value); return out;
  }
  function tradingDay(){
    const p=laParts(); let y=p.year,m=p.month,d=p.day;
    if(p.hour<CUTOFF_HOUR){const x=new Date(Date.UTC(y,m-1,d)-86400000);y=x.getUTCFullYear();m=x.getUTCMonth()+1;d=x.getUTCDate()}
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  function savedAccount(){try{return JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{return null}}
  function baselineKey(id){return `casaBankoDailyBalanceLA2::${String(id)}::${tradingDay()}`}
  function currentBalance(a){const n=Number(a?.balance??a?.accountBalance??a?.account_balance??a?.equity);return Number.isFinite(n)?n:null}
  function performance(a){
    const current=currentBalance(a); if(!a?.id||current===null)return null;
    const key=baselineKey(a.id); let start=Number(localStorage.getItem(key));
    if(!Number.isFinite(start)||start<=0){start=current;localStorage.setItem(key,String(start))}
    const diff=current-start,pct=start?diff/start*100:0; return {diff,pct};
  }
  function paint(){
    const box=$('globalLiveAccount'),a=savedAccount(); if(!box||!a)return;
    const p=performance(a); if(!p)return;
    const up=p.diff>=0,sign=up?'+':'−',amount=Math.abs(p.diff).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
    const html=(up?'🟢':'🔴')+' TODAY '+sign+Math.abs(p.pct).toFixed(2)+'% · '+sign+'$'+amount;
    const rows=[...box.querySelectorAll('div')]; const row=rows.find(x=>x.textContent.includes('TODAY'));
    if(row&&row.textContent!==html){row.textContent=html;row.style.color=up?'#67d391':'#ff6b6b'}
  }
  function init(){
    paint();
    const root=document.querySelector('.hero')||document.body;
    new MutationObserver(()=>queueMicrotask(paint)).observe(root,{childList:true,subtree:true,characterData:true});
    setInterval(paint,30000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();