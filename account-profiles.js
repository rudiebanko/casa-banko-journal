// CASA BANKO — TradeLocker account journal isolation.
// Each selected TradeLocker account owns its own journal dataset.
(()=>{
  const ACTIVE='casaBankoActiveTradeLockerAccountId';
  const LEGACY='casaBankoTrades';
  const PREFIX='casaBankoTrades::';
  const rawGet=Storage.prototype.getItem, rawSet=Storage.prototype.setItem;
  const get=(k)=>rawGet.call(localStorage,k), set=(k,v)=>rawSet.call(localStorage,k,v);
  const profileKey=id=>PREFIX+String(id);
  function selected(){try{return JSON.parse(get('casaBankoTradeLockerAccount')||'null')}catch{return null}}
  function activeId(){return get(ACTIVE)||String(selected()?.id||'')}
  function parse(v){try{return JSON.parse(v||'[]')}catch{return[]}}
  function tag(trades,id){return trades.map(t=>({...t,tradeLockerAccountId:t.tradeLockerAccountId??id}))}
  function saveCurrent(){const id=activeId();if(!id)return;set(profileKey(id),JSON.stringify(tag(parse(get(LEGACY)),id)))}
  function switchTo(account){if(!account?.id)return false;const next=String(account.id),cur=activeId();
    if(cur&&cur!==next)saveCurrent();
    let nextRaw=get(profileKey(next));
    // First profile migration: preserve the journal that was already open under the previously selected account.
    if(nextRaw===null&&(!cur||cur===next)){
      const legacy=parse(get(LEGACY));
      if(legacy.length){nextRaw=JSON.stringify(tag(legacy,next));set(profileKey(next),nextRaw)}
    }
    if(nextRaw===null)nextRaw='[]';
    set(ACTIVE,next);set(LEGACY,nextRaw);set('casaBankoTradeLockerAccount',JSON.stringify(account));
    window.dispatchEvent(new Event('storage'));if(typeof refreshAll==='function')refreshAll();return true;
  }
  function currentTrades(){const id=activeId();return id?parse(get(profileKey(id))):parse(get(LEGACY))}
  // Mirror every journal write into the active account profile.
  const nativeSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){nativeSet.call(this,k,v);if(this===localStorage&&k===LEGACY){const id=activeId();if(id)rawSet.call(localStorage,profileKey(id),JSON.stringify(tag(parse(v),id)))}};
  window.CasaBankoAccounts={activeId,selected,switchTo,saveCurrent,currentTrades,profileKey};
})();