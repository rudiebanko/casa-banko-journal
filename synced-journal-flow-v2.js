// CASA BANKO — isolated synced-trade journal workflow.
// UI-only workflow layer: does not alter navigation, TradeLocker sync, Genesis reconciliation, calendar, stats, or analytics.
(()=>{
  const $=id=>document.getElementById(id);
  const source=$('sourceChoice'), save=$('save'), history=$('manageTrades');
  if(!source||!save||!history)return;
  const card=source.closest('.card');
  if(!card||card.dataset.syncedJournalV2==='1')return;
  card.dataset.syncedJournalV2='1';
  const originalSave=save.onclick;
  let editingIndex=null, manualMode=false;

  const title=card.querySelector('.title');
  if(title)title.textContent='JOURNAL TRADE';
  const hint=document.createElement('div');
  hint.className='hint'; hint.id='syncedJournalHint';
  hint.textContent='Select a synced trade from Trade History to add your journal details.';
  title?.insertAdjacentElement('afterend',hint);
  const manual=document.createElement('button');
  manual.type='button'; manual.className='manageBtn'; manual.id='syncedManualFallback';
  manual.textContent='+ ADD TRADE MANUALLY';
  hint.insertAdjacentElement('afterend',manual);

  const sourceLabel=source.previousElementSibling;
  if(sourceLabel?.classList.contains('label'))sourceLabel.style.display='none';
  source.style.display='none';

  // Everything after our fallback button through the save/status area is the journal editor.
  const editorNodes=[];
  let n=manual.nextElementSibling;
  while(n){editorNodes.push(n);n=n.nextElementSibling}
  const showEditor=show=>editorNodes.forEach(el=>el.style.display=show?'':'none');
  showEditor(false);

  function trades(){try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}}
  function write(a){localStorage.setItem('casaBankoTrades',JSON.stringify(a))}
  function setVal(id,v){const e=$(id);if(e)e.value=v??''}
  function lock(id,on){const e=$(id);if(!e)return;e.readOnly=!!on;e.classList.toggle('executionLocked',!!on)}
  function one(key,val){const g=document.querySelector('.single[data-k="'+key+'"]');if(!g)return;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.textContent===val));S[key]=val||''}
  function many(key,val){const g=document.querySelector('.many[data-k="'+key+'"]');if(!g)return;const vals=Array.isArray(val)?val:(val?[val]:[]);g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',vals.includes(b.textContent)));S[key]=vals}
  function multi(key,val){const g=document.querySelector('.multi[data-k="'+key+'"]');if(!g)return;const vals=Array.isArray(val)?val:(val?[val]:[]);g.querySelectorAll('.drop button').forEach(b=>b.classList.toggle('on',vals.includes(b.textContent)));const top=g.querySelector('.multiTop');if(top)top.textContent=(vals.length?vals.join(' • '):'Select timeframes')+' ▾';S[key]=vals}
  function first(t,names){for(const k of names){if(t?.[k]!==undefined&&t?.[k]!==null&&t[k]!=='')return t[k]}return''}
  function localDateValue(t){const raw=first(t,['openTime','open_time','openTimestamp','open_timestamp','openDate','open_date','entryTime','entry_time','date','savedAt']);if(!raw)return'';const d=new Date(raw);if(isNaN(d))return String(raw).slice(0,16);const z=new Date(d.getTime()-d.getTimezoneOffset()*60000);return z.toISOString().slice(0,16)}
  function openTrade(i){
    const a=trades(),t=a[i];if(!t)return;
    editingIndex=i;manualMode=false;showEditor(true);manual.style.display='none';
    hint.textContent='Journaling synced trade #'+(i+1)+' — execution data stays protected. Symbol is editable until Genesis supplies the verified symbol.';
    setVal('symbol',t.symbol||'');setVal('tradeDate',localDateValue(t));
    setVal('entryPrice',first(t,['entry','entryPrice','openPrice','open_price']));
    setVal('exitPrice',first(t,['exit','exitPrice','closePrice','close_price']));
    setVal('stopLoss',t.stopLoss);setVal('pnlInput',t.pnl);setVal('rInput',t.r);setVal('result',t.result);
    ['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput'].forEach(id=>lock(id,true));
    lock('symbol',false);lock('rInput',false);
    one('direction',t.direction);one('session',t.session);one('phase',t.phase);one('liq',t.liq);one('plan',t.plan);one('grade',t.grade);many('model',t.model);multi('keyLevel',t.keyLevel);multi('bosTF',t.bosTF);multi('entryTF',t.entryTF);
    setVal('notes',t.notes||'');$('shotName').textContent=t.screenshotName||'No screenshot selected.';
    save.textContent='SAVE JOURNAL ENTRY';$('status').textContent='';
    card.scrollIntoView({behavior:'smooth',block:'start'});
  }

  // Capture Trade History clicks before the old "open Stats" behavior.
  history.addEventListener('click',e=>{
    const row=e.target.closest('.manageRow');if(!row)return;
    const rows=[...history.querySelectorAll('.manageRow')],i=rows.indexOf(row);if(i<0)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openTrade(i);
  },true);

  manual.onclick=()=>{
    editingIndex=null;manualMode=true;showEditor(true);manual.style.display='none';
    hint.textContent='Manual fallback entry — use this only for a trade that is not coming from TradeLocker.';
    ['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput','symbol','rInput'].forEach(id=>lock(id,false));
    S.source='MANUAL';save.textContent='SAVE MANUAL TRADE';
  };

  save.onclick=function(e){
    if(manualMode){return originalSave?.call(this,e)}
    if(editingIndex===null)return;
    const a=trades(),old=a[editingIndex];if(!old)return;
    const updated={...old,
      symbol:$('symbol').value.trim()||old.symbol,
      r:$('rInput').value===''?null:+$('rInput').value,
      result:$('result').value||old.result,
      session:S.session||old.session,phase:S.phase||old.phase,keyLevel:S.keyLevel||old.keyLevel,
      bosTF:S.bosTF||old.bosTF,entryTF:S.entryTF||old.entryTF,liq:S.liq||old.liq,
      model:S.model||old.model,plan:S.plan||old.plan,grade:S.grade||old.grade,
      notes:$('notes').value,screenshotName:$('shot').files[0]?.name||old.screenshotName||'',journalUpdatedAt:new Date().toISOString()
    };
    // Intentionally preserve TradeLocker/Genesis identity, timestamps, prices, volume and exact/estimated P&L fields.
    a[editingIndex]=updated;write(a);$('status').textContent='✓ Journal entry saved to this synced trade.';
    if(typeof refreshAll==='function')refreshAll();
  };
})();