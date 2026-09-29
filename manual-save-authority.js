/* CASA BANKO — authoritative manual trade save path. Owns manual SAVE only. */
(()=>{
  if(window.__casaBankoManualSaveAuthorityV2)return;
  window.__casaBankoManualSaveAuthorityV2=true;
  const $=id=>document.getElementById(id);
  const one=key=>document.querySelector('.single[data-k="'+key+'"] button.on')?.textContent?.trim()||'';
  const many=key=>[...document.querySelectorAll('.many[data-k="'+key+'"] button.on')].map(b=>b.textContent.trim());
  const multi=key=>[...document.querySelectorAll('.multi[data-k="'+key+'"] .drop button.on')].map(b=>b.textContent.trim());
  const num=id=>{const v=$(id)?.value??'';return v===''?null:Number(v)};
  const text=id=>$(id)?.value?.trim?.()||'';
  const read=()=>{try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}};
  function status(msg,ok){const el=$('status');if(!el)return;el.textContent=msg;el.className='status '+(ok?'ok':'bad');el.style.color=ok?'#55d98a':'#ff6b6b';el.style.fontWeight='800';el.style.marginTop='9px'}
  function isManualSave(){const save=$('save'),td=$('tradeDate');if(!save)return false;return /MANUAL/i.test(save.textContent||'') || td?.type==='datetime-local'}
  async function saveManual(e){
    if(!isManualSave())return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    status('SAVING TRADE…',true);
    try{
      const now=new Date().toISOString(),activeId=window.CasaBankoAccounts?.activeId?.()||'';
      const id='manual-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);
      const trade={clientTradeId:id,source:'MANUAL',symbol:text('symbol'),date:$('tradeDate')?.value||now,entry:num('entryPrice'),exit:num('exitPrice'),stopLoss:num('stopLoss'),pnl:num('pnlInput')??0,r:num('rInput'),result:$('result')?.value||'',direction:one('direction'),session:one('session'),phase:one('phase'),keyLevel:multi('keyLevel'),bosTF:multi('bosTF'),entryTF:multi('entryTF'),liq:one('liq'),model:many('model'),plan:one('plan'),grade:one('grade'),notes:$('notes')?.value||'',screenshotName:$('shot')?.files?.[0]?.name||'',savedAt:now};
      if(activeId)trade.tradeLockerAccountId=String(activeId);
      const next=[...read(),trade];localStorage.setItem('casaBankoTrades',JSON.stringify(next));
      if(!read().some(t=>t.clientTradeId===id))throw new Error('local verification failed');
      if(activeId&&window.CasaBankoAccounts?.saveCurrent){await window.CasaBankoAccounts.saveCurrent();const persisted=await window.CasaBankoAccounts.dbGet(activeId);if(!Array.isArray(persisted)||!persisted.some(t=>t.clientTradeId===id))throw new Error('account verification failed')}
      if(typeof refreshAll==='function')refreshAll();
      if(typeof renderManage==='function')renderManage();
      status('✓ TRADE SAVED SUCCESSFULLY',true);
    }catch(err){console.error('CASA BANKO manual save failed:',err);status('✕ TRADE NOT SAVED — '+(err?.message||'PLEASE TRY AGAIN'),false)}
  }
  document.addEventListener('click',e=>{if(e.target.closest?.('#save'))saveManual(e)},true);
})();
