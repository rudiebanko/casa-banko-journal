(()=>{
  const $=id=>document.getElementById(id);
  const trades=()=>{try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}};
  const account=()=>{try{return JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{return null}};
  const first=(t,names)=>{for(const n of names){const v=t?.[n];if(v!==undefined&&v!==null&&v!=='')return v}return null};
  const time=t=>{const raw=(t?.pnlSource==='GENESIS'&&t?.pnlExact===true&&t?.genesisCloseTime)?t.genesisCloseTime:first(t,['openTime','open_time','openTimestamp','open_timestamp','openDate','open_date','entryTime','entry_time','createdAt','created_at','date','savedAt']);const d=new Date(raw);return isNaN(d)?null:d};
  const key=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const pnl=t=>Number(t?.pnl)||0;
  const currentBalance=()=>{const a=account(),n=Number(a?.balance??a?.accountBalance??a?.account_balance??a?.equity);return Number.isFinite(n)&&n>0?n:null};
  function pctFor(items,dates){
    const current=currentBalance(); if(current===null||!items.length)return null;
    const selectedPnl=items.reduce((s,t)=>s+pnl(t),0);
    let startDate=null;
    if(dates?.length){const sorted=[...dates].sort();startDate=new Date(sorted[0]+'T00:00:00')}
    else {const ds=items.map(time).filter(Boolean).sort((a,b)=>a-b);startDate=ds[0]||null}
    if(!startDate)return null;
    const afterStart=trades().reduce((s,t)=>{const d=time(t);return d&&d>=startDate?s+pnl(t):s},0);
    const startBalance=current-afterStart;
    if(!Number.isFinite(startBalance)||startBalance<=0)return null;
    return selectedPnl/startBalance*100;
  }
  const fmt=p=>p===null?'—':(p>0?'+':'')+p.toFixed(2)+'%';
  function monthItems(){
    const label=$('calMonth');if(!label)return null;const d=new Date('1 '+label.textContent.trim());if(isNaN(d))return null;
    const y=d.getFullYear(),m=d.getMonth(),items=trades().filter(t=>{const x=time(t);return x&&x.getFullYear()===y&&x.getMonth()===m});
    const dates=[...new Set(items.map(t=>{const x=time(t);return x&&key(x)}).filter(Boolean))];return{items,dates};
  }
  function updateMonth(){const ms=$('calMonthStats'),x=monthItems();if(!ms||!x)return;const metrics=ms.querySelectorAll('.calMetric');if(metrics.length<2)return;const p=pctFor(x.items,x.dates);metrics[1].innerHTML='<b class="'+(p<0?'neg':p>0?'pos':'')+'">'+fmt(p)+'</b><span>ACCOUNT %</span>'}
  function updateDetail(){
    const snap=document.querySelector('#daySummary .daySnapshot');if(!snap)return;
    let items=[],dates=[];
    if(Array.isArray(window.casaCalendarSelectionItems)){items=window.casaCalendarSelectionItems.map(x=>x.t||x);dates=Array.isArray(window.casaCalendarSelectionDates)?window.casaCalendarSelectionDates:[]}
    else {const m=($('dayTitle')?.textContent||'').match(/\d{4}-\d{2}-\d{2}/);if(!m)return;dates=[m[0]];items=trades().filter(t=>{const d=time(t);return d&&key(d)===m[0]})}
    const metrics=snap.querySelectorAll('.daySnapMetric');if(metrics.length<2)return;const p=pctFor(items,dates);metrics[1].innerHTML='<b class="'+(p<0?'neg':p>0?'pos':'')+'">'+fmt(p)+'</b><span>ACCOUNT %</span>';
  }
  function updateDays(){
    document.querySelectorAll('#calendarGrid .day[data-date]').forEach(el=>{const k=el.dataset.date,items=trades().filter(t=>{const d=time(t);return d&&key(d)===k});let row=el.querySelector('.dpercent');if(!items.length){row?.remove();return}const p=pctFor(items,[k]);if(!row){row=document.createElement('div');row.className='dpercent';const count=el.querySelector('.dc');el.insertBefore(row,count||null)}row.textContent=fmt(p);row.classList.toggle('pos',p>0);row.classList.toggle('neg',p<0)});
  }
  function update(){updateMonth();updateDetail();updateDays()}
  let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update()})};
  const obs=new MutationObserver(schedule);
  function init(){const cal=$('calendar');if(!cal){setTimeout(init,100);return}obs.observe(cal,{childList:true,subtree:true});document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.screen==='calendar')setTimeout(update,0)}));window.addEventListener('storage',schedule);document.addEventListener('click',e=>{if(e.target.closest('#calendarGrid,#prevMonth,#nextMonth,#calendarSelectToggle'))setTimeout(update,0)});if(!document.getElementById('calendarAccountPercentStyle')){const s=document.createElement('style');s.id='calendarAccountPercentStyle';s.textContent='.dpercent{font-size:7px;font-weight:900;color:#d7c58d;line-height:1.15;margin-top:2px}.dpercent.pos,.calMetric .pos,.daySnapMetric .pos{color:#35d99a!important}.dpercent.neg,.calMetric .neg,.daySnapMetric .neg{color:#ff5e5e!important}';document.head.appendChild(s)}setTimeout(update,0)}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();