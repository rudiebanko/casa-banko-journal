// CASA BANKO — TradeLocker account journal isolation without duplicating the active journal.
// The selected account lives in casaBankoTrades. Only inactive accounts are parked in per-account keys.
(()=>{
  if(window.CasaBankoAccounts)return;
  const ACTIVE='casaBankoActiveTradeLockerAccountId';
  const LEGACY='casaBankoTrades';
  const PREFIX='casaBankoTrades::';
  const get=k=>localStorage.getItem(k), set=(k,v)=>localStorage.setItem(k,v), del=k=>localStorage.removeItem(k);
  const profileKey=id=>PREFIX+String(id);
  function selected(){try{return JSON.parse(get('casaBankoTradeLockerAccount')||'null')}catch{return null}}
  function activeId(){return get(ACTIVE)||String(selected()?.id||'')}
  function parse(v){try{return JSON.parse(v||'[]')}catch{return[]}}
  function tag(trades,id){return trades.map(t=>({...t,tradeLockerAccountId:t.tradeLockerAccountId??id}))}
  function saveCurrent(){const id=activeId();if(!id)return;const raw=get(LEGACY)||'[]';set(profileKey(id),JSON.stringify(tag(parse(raw),id)))}
  function switchTo(account){
    if(!account?.id)return false;
    const next=String(account.id),cur=activeId();
    if(cur===next){set(ACTIVE,next);set('casaBankoTradeLockerAccount',JSON.stringify(account));del(profileKey(next));return true}
    const currentRaw=get(LEGACY)||'[]';
    const nextRaw=get(profileKey(next))||'[]';
    // Free the active journal before parking it so localStorage never needs two full copies of it.
    del(LEGACY);
    try{
      if(cur)set(profileKey(cur),JSON.stringify(tag(parse(currentRaw),cur)));
      del(profileKey(next));
      set(LEGACY,nextRaw);
      set(ACTIVE,next);
      set('casaBankoTradeLockerAccount',JSON.stringify(account));
    }catch(e){
      // Best-effort recovery: restore the journal that was open before the switch.
      try{del(profileKey(cur));set(LEGACY,currentRaw);if(cur)set(ACTIVE,cur)}catch{}
      throw e;
    }
    window.dispatchEvent(new Event('storage'));if(typeof refreshAll==='function')refreshAll();return true;
  }
  function currentTrades(){return parse(get(LEGACY))}
  // Migration from the old duplicate-storage design: the active account is already in LEGACY,
  // so its parked duplicate can be removed safely and immediately to reclaim quota.
  const aid=activeId();if(aid&&get(LEGACY)!==null)del(profileKey(aid));
  window.CasaBankoAccounts={activeId,selected,switchTo,saveCurrent,currentTrades,profileKey};
})();