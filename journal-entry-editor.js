// CASA BANKO synced-trade journal editor
// Keeps TradeLocker execution data intact while allowing journal fields + temporary symbol edits.
(function(){
  let editingIndex=null;
  const q=id=>document.getElementById(id);
  const form=q('manualTradeForm'), toggle=q('manualTradeToggle'), saveBtn=q('save');
  if(!form||!toggle||!saveBtn)return;
  const originalManualSave=saveBtn.onclick;
  const card=toggle.closest('.card');
  const title=card&&card.querySelector('.title');
  if(title) title.textContent='JOURNAL TRADE';
  const intro=document.createElement('div');
  intro.className='hint';
  intro.id='journalTradeHint';
  intro.textContent='Select a synced trade from Trade History to add your journal details.';
  if(title) title.insertAdjacentElement('afterend',intro);

  function tradeList(){try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}}
  function saveList(a){localStorage.setItem('casaBankoTrades',JSON.stringify(a))}
  function clickButton(group,value,many){
    if(!group)return;
    group.querySelectorAll('button').forEach(b=>{
      const values=Array.isArray(value)?value:[value];
      b.classList.toggle('on',values.includes(b.textContent));
    });
    if(group.dataset&&group.dataset.k) S[group.dataset.k]=value;
  }
  function setMulti(key,value){
    const m=document.querySelector('.multi[data-k="'+key+'"]'); if(!m)return;
    const vals=Array.isArray(value)?value:(value?[value]:[]);
    m.querySelectorAll('.drop button').forEach(b=>b.classList.toggle('on',vals.includes(b.textContent)));
    const top=m.querySelector('.multiTop'); if(top)top.textContent=(vals.length?vals.join(' • '):'Select timeframes')+' ▾';
    S[key]=vals;
  }
  function setLocked(el,locked){if(!el)return;el.readOnly=locked;el.classList.toggle('executionLocked',locked)}
  function openEditor(index){
    const a=tradeList(),t=a[index]; if(!t)return;
    editingIndex=index; selectedIndex=index;
    form.style.display='block'; toggle.style.display='none';
    intro.textContent='Editing synced trade #'+(index+1)+' — TradeLocker execution stays intact. Symbol can be temporary until Genesis replaces it with the verified symbol.';
    q('symbol').value=t.symbol||'';
    q('tradeDate').value=t.date?String(t.date).slice(0,16):'';
    q('entryPrice').value=t.entry??''; q('exitPrice').value=t.exit??''; q('stopLoss').value=t.stopLoss??'';
    q('pnlInput').value=t.pnl??''; q('rInput').value=t.r??''; q('result').value=t.result||'';
    // Synced execution fields are display-only. Symbol intentionally remains editable.
    [q('tradeDate'),q('entryPrice'),q('exitPrice'),q('stopLoss'),q('pnlInput')].forEach(x=>setLocked(x,true));
    setLocked(q('symbol'),false); setLocked(q('rInput'),false);
    q('result').disabled=false;
    clickButton(document.querySelector('.grid[data-k="direction"]'),t.direction||'');
    clickButton(document.querySelector('.grid[data-k="session"]'),t.session||'');
    clickButton(document.querySelector('.grid[data-k="phase"]'),t.phase||'');
    clickButton(document.querySelector('.grid[data-k="liq"]'),t.liq||'');
    clickButton(document.querySelector('.grid[data-k="model"]'),Array.isArray(t.model)?t.model:(t.model?[t.model]:[]),true);
    clickButton(document.querySelector('.grid[data-k="plan"]'),t.plan||'');
    clickButton(document.querySelector('.grid[data-k="grade"]'),t.grade||'');
    setMulti('keyLevel',t.keyLevel); setMulti('bosTF',t.bosTF); setMulti('entryTF',t.entryTF);
    q('notes').value=t.notes||''; q('shotName').textContent=t.screenshotName||'No screenshot selected.';
    Object.assign(S,t);
    saveBtn.textContent='SAVE JOURNAL ENTRY';
    q('status').textContent='';
    card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function resetManual(){
    editingIndex=null; toggle.style.display='block'; form.style.display='none';
    intro.textContent='Select a synced trade from Trade History to add your journal details.';
    saveBtn.textContent='SAVE TRADE';
    [q('tradeDate'),q('entryPrice'),q('exitPrice'),q('stopLoss'),q('pnlInput'),q('symbol'),q('rInput')].forEach(x=>setLocked(x,false));
  }
  saveBtn.onclick=function(){
    if(editingIndex===null){ if(originalManualSave) return originalManualSave.call(this); return; }
    const a=tradeList(),old=a[editingIndex]; if(!old)return;
    const updated={...old,
      symbol:q('symbol').value.trim()||old.symbol,
      r:q('rInput').value===''?null:+q('rInput').value,
      result:q('result').value||old.result,
      session:S.session||old.session,phase:S.phase||old.phase,keyLevel:S.keyLevel||old.keyLevel,
      bosTF:S.bosTF||old.bosTF,entryTF:S.entryTF||old.entryTF,liq:S.liq||old.liq,
      model:S.model||old.model,plan:S.plan||old.plan,grade:S.grade||old.grade,
      notes:q('notes').value,
      screenshotName:q('shot').files[0]?.name||old.screenshotName||'',
      journalUpdatedAt:new Date().toISOString()
    };
    // Do not overwrite TradeLocker/Genesis identity or execution fields here.
    a[editingIndex]=updated; saveList(a);
    q('status').textContent='✓ Journal entry saved to this synced trade.';
    if(typeof refreshAll==='function')refreshAll();
  };

  // Trade History clicks journal the existing synced trade instead of creating another trade.
  function bindHistory(){
    const root=q('manageTrades'); if(!root)return;
    root.querySelectorAll('[data-select]').forEach(el=>{
      el.onclick=function(e){e.preventDefault();e.stopPropagation();openEditor(+this.dataset.select)};
    });
  }
  const root=q('manageTrades');
  if(root){new MutationObserver(bindHistory).observe(root,{childList:true,subtree:true});bindHistory()}
  // Manual entry remains an optional fallback.
  toggle.onclick=function(){
    editingIndex=null; form.style.display='block'; toggle.style.display='none';
    intro.textContent='Manual fallback entry — use this only when a trade is not coming from TradeLocker.';
    [q('tradeDate'),q('entryPrice'),q('exitPrice'),q('stopLoss'),q('pnlInput'),q('symbol'),q('rInput')].forEach(x=>setLocked(x,false));
    saveBtn.textContent='SAVE MANUAL TRADE';
    S.source='MANUAL';
  };
  window.openJournalTrade=openEditor;
})();