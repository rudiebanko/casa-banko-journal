(()=>{
 const $=id=>document.getElementById(id), pad=n=>String(n).padStart(2,'0'), key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 function month(){const el=$('calMonth');if(!el)return null;const d=new Date('1 '+el.textContent.trim());return isNaN(d)?null:d}
 function datesBetween(a,b){const out=[];let d=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00');if(d>e)[d,e]=[e,d];for(;d<=e;d.setDate(d.getDate()+1))out.push(key(d));return out}
 function selectDates(dates,label){
   const grid=$('calendarGrid');if(!grid)return;
   const wanted=new Set(dates);
   grid.querySelectorAll('.day[data-date]').forEach(el=>el.classList.toggle('selectedDay',wanted.has(el.dataset.date)));
   grid.querySelectorAll('[data-week]').forEach(el=>el.classList.remove('selectedWeek'));
   window.casaCalendarSelectionDates=[...wanted].sort();
   const trades=(()=>{try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}})();
   const first=(t,names)=>{for(const n of names){const v=t?.[n];if(v!==undefined&&v!==null&&v!=='')return v}return null};
   const tm=t=>{const raw=(t?.pnlSource==='GENESIS'&&t?.pnlExact===true&&t?.genesisCloseTime)?t.genesisCloseTime:first(t,['openTime','open_time','openTimestamp','open_timestamp','openDate','open_date','entryTime','entry_time','createdAt','created_at','date','savedAt']);const d=new Date(raw);return isNaN(d)?null:d};
   const items=[];trades.forEach((t,i)=>{const d=tm(t);if(d&&wanted.has(key(d)))items.push({t,i})});
   window.casaCalendarSelectionItems=items;
   const detail=$('dayDetail');if(detail)detail.classList.add('open');
   if($('dayTitle'))$('dayTitle').textContent=label;
   if($('dayTrades')){$('dayTrades').innerHTML=items.length?items.sort((a,b)=>(tm(a.t)||0)-(tm(b.t)||0)).map(x=>'<div class="tradeItem clickTrade" data-select="'+x.i+'"><div class="tradeTop"><span>'+(x.t.symbol||'TRADE')+' · '+(x.t.direction||'—')+'</span><span>$'+(+x.t.pnl||0).toFixed(2)+'</span></div><div class="tradeMeta">'+(x.t.session||'—')+' · '+(x.t.result||'—')+' · '+(x.t.grade||'NO GRADE')+'</div></div>').join(''):'<div class="empty">No trades logged for this selection.</div>';$('dayTrades').querySelectorAll('[data-select]').forEach(e=>e.onclick=()=>window.selectTrade&&window.selectTrade(e.dataset.select))}
   window.casaUpdateDayStats&&window.casaUpdateDayStats();
   document.dispatchEvent(new Event('casaCalendarRangeChanged'));
 }
 function close(){document.querySelector('.calendarRangeOverlay')?.classList.remove('open')}
 function ensure(){
   const main=document.querySelector('.calendarMain');if(!main||$('calendarRangeBtn'))return;
   const bar=main.querySelector('.calendarSelectBar');if(!bar)return setTimeout(ensure,100);
   const btn=document.createElement('button');btn.type='button';btn.id='calendarRangeBtn';btn.textContent='SELECT RANGE';bar.insertBefore(btn,bar.firstChild);
   const ov=document.createElement('div');ov.className='calendarRangeOverlay';ov.innerHTML='<div class="calendarRangeModal"><div class="rangeTitle">SELECT CALENDAR RANGE</div><button data-range="month">ENTIRE MONTH</button><button data-range="week">THIS WEEK</button><button data-range="days">SELECT DAYS</button><button data-range="custom">CUSTOM RANGE</button><div class="rangeCustom"><input id="calRangeFrom" type="date"><input id="calRangeTo" type="date"><button id="calRangeApply">APPLY RANGE</button></div><button class="rangeCancel">CANCEL</button></div>';document.body.appendChild(ov);
   btn.onclick=()=>ov.classList.add('open');ov.onclick=e=>{if(e.target===ov)close()};ov.querySelector('.rangeCancel').onclick=close;
   ov.querySelector('[data-range="month"]').onclick=()=>{const m=month();if(!m)return;const y=m.getFullYear(),mo=m.getMonth(),last=new Date(y,mo+1,0).getDate(),dates=[];for(let n=1;n<=last;n++)dates.push(key(new Date(y,mo,n)));selectDates(dates,m.toLocaleString('en-US',{month:'long',year:'numeric'}).toUpperCase());close()};
   ov.querySelector('[data-range="week"]').onclick=()=>{const now=new Date(),s=new Date(now);s.setDate(now.getDate()-now.getDay());const e=new Date(s);e.setDate(s.getDate()+6);selectDates(datesBetween(key(s),key(e)),'THIS WEEK');close()};
   ov.querySelector('[data-range="days"]').onclick=()=>{$('calendarSelectToggle')?.click();close()};
   ov.querySelector('[data-range="custom"]').onclick=()=>ov.querySelector('.rangeCustom').classList.toggle('open');
   $('calRangeApply').onclick=()=>{const a=$('calRangeFrom').value,b=$('calRangeTo').value;if(!a||!b)return;selectDates(datesBetween(a,b),a+' → '+b);close()};
   const s=document.createElement('style');s.textContent='.calendarRangeOverlay{display:none;position:fixed;inset:0;background:#000a;z-index:9999;align-items:center;justify-content:center;padding:20px}.calendarRangeOverlay.open{display:flex}.calendarRangeModal{width:min(330px,92vw);background:#0d0c0a;border:1px solid #66501d;border-radius:14px;padding:16px;box-shadow:0 18px 55px #000}.rangeTitle{color:#d7c58d;font-size:11px;font-weight:900;letter-spacing:.8px;margin:2px 0 12px;text-align:center}.calendarRangeModal>button,.rangeCustom button{width:100%;border:1px solid #5b4716;background:#15130e;color:#d7c58d;border-radius:9px;padding:10px;margin:5px 0;font-size:10px;font-weight:900;letter-spacing:.4px}.calendarRangeModal>button:active,.rangeCustom button:active{border-color:#f2cc60;color:#f2cc60}.rangeCustom{display:none;grid-template-columns:1fr 1fr;gap:7px;margin:7px 0}.rangeCustom.open{display:grid}.rangeCustom input{min-width:0;background:#111;color:#d7c58d;border:1px solid #4c401f;border-radius:8px;padding:9px;font-size:10px}.rangeCustom button{grid-column:1/-1}.calendarRangeModal .rangeCancel{color:#777;border-color:#2d2a22}';document.head.appendChild(s)
 }
 document.addEventListener('DOMContentLoaded',ensure);setTimeout(ensure,0);document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.screen==='calendar')setTimeout(ensure,50)}));
})();