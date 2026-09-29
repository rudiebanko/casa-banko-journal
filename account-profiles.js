// CASA BANKO — TradeLocker account isolation. Only the active account lives in localStorage;
// inactive account histories live in IndexedDB so Calendar/Stats/Analytics never mix accounts.
(()=>{
  if(window.CasaBankoAccounts)return;
  const ACTIVE='casaBankoActiveTradeLockerAccountId', LEGACY='casaBankoTrades', OLD_PREFIX='casaBankoTrades::';
  const SELECTED='casaBankoTradeLockerAccount';
  const DB='casaBankoJournal', STORE='tradeLockerAccounts';
  const rawRemove=Storage.prototype.removeItem;
  const get=k=>localStorage.getItem(k), set=(k,v)=>localStorage.setItem(k,v), del=k=>rawRemove.call(localStorage,k);
  const oldKey=id=>OLD_PREFIX+String(id);
  function selected(){try{return JSON.parse(get(SELECTED)||'null')}catch{return null}}
  function activeId(){return get(ACTIVE)||String(selected()?.id||'')}
  function parse(v){try{return JSON.parse(v||'[]')}catch{return[]}}
  function tag(trades,id){return trades.map(t=>({...t,tradeLockerAccountId:t.tradeLockerAccountId??id}))}
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function dbGet(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(String(id));r.onsuccess=()=>resolve(Array.isArray(r.result)?r.result:[]);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close()})}
  async function dbSet(id,trades){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(tag(trades,String(id)),String(id));tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function migrateOld(id){const raw=get(oldKey(id));if(raw===null)return;await dbSet(id,parse(raw));del(oldKey(id))}
  async function saveCurrent(){const id=activeId();if(!id)return false;await dbSet(id,parse(get(LEGACY)));return true}
  async function switchTo(account){
    if(!account?.id)return false;
    const next=String(account.id),cur=activeId();
    if(cur===next){set(ACTIVE,next);set(SELECTED,JSON.stringify(account));return true}
    const current=parse(get(LEGACY));
    if(cur)await dbSet(cur,current);
    await migrateOld(next);
    const nextTrades=await dbGet(next);
    set(LEGACY,JSON.stringify(tag(nextTrades,next)));
    set(ACTIVE,next);set(SELECTED,JSON.stringify(account));del(oldKey(next));
    window.dispatchEvent(new Event('storage'));if(typeof refreshAll==='function')refreshAll();return true;
  }
  function currentTrades(){return parse(get(LEGACY))}

  // One-time repair for data created before account isolation existed.
  // Rows already tagged with a TradeLocker account are split immediately so the active UI
  // can never show another account's Calendar/Stats/Journal data.
  const chosen=selected(), chosenId=String(chosen?.id||'');
  if(chosenId){
    const rows=parse(get(LEGACY));
    const groups={}; const active=[];
    for(const t of rows){
      const tid=t?.tradeLockerAccountId!=null?String(t.tradeLockerAccountId):'';
      if(tid && tid!==chosenId){(groups[tid]??=[]).push(t);}
      else active.push({...t,tradeLockerAccountId:t.tradeLockerAccountId??chosenId});
    }
    // Filter synchronously before the rest of the app renders.
    set(LEGACY,JSON.stringify(active)); set(ACTIVE,chosenId);
    Object.entries(groups).forEach(([id,trades])=>dbSet(id,trades).catch(()=>{}));
    dbSet(chosenId,active).catch(()=>{});
  }

  // Persistence guard: TradeLocker disconnect means "stop the broker session", not
  // "forget which CASA BANKO journal/account owns this data".  Keep the selected account
  // identity in place so LIVE ACCOUNT, Account Journey and all account-scoped history survive
  // logout/reconnect. A deliberate account switch still replaces this value through switchTo().
  Storage.prototype.removeItem=function(k){
    if(k===SELECTED)return;
    return rawRemove.call(this,k);
  };

  window.CasaBankoAccounts={activeId,selected,switchTo,saveCurrent,currentTrades,profileKey:oldKey,dbGet,dbSet};
})();