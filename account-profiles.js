// CASA BANKO — TradeLocker account isolation without duplicating full trade histories in localStorage.
// The active account continues to use casaBankoTrades so the rest of the journal stays untouched.
// Inactive account histories are moved to IndexedDB, which is designed for large datasets.
(()=>{
  if(window.CasaBankoAccounts)return;
  const ACTIVE='casaBankoActiveTradeLockerAccountId';
  const LEGACY='casaBankoTrades';
  const OLD_PREFIX='casaBankoTrades::';
  const DB='casaBankoJournal';
  const STORE='tradeLockerAccounts';
  const get=k=>localStorage.getItem(k), set=(k,v)=>localStorage.setItem(k,v), del=k=>localStorage.removeItem(k);
  const oldKey=id=>OLD_PREFIX+String(id);
  function selected(){try{return JSON.parse(get('casaBankoTradeLockerAccount')||'null')}catch{return null}}
  function activeId(){return get(ACTIVE)||String(selected()?.id||'')}
  function parse(v){try{return JSON.parse(v||'[]')}catch{return[]}}
  function tag(trades,id){return trades.map(t=>({...t,tradeLockerAccountId:t.tradeLockerAccountId??id}))}
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function dbGet(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(String(id));r.onsuccess=()=>resolve(Array.isArray(r.result)?r.result:[]);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close()})}
  async function dbSet(id,trades){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(tag(trades,String(id)),String(id));tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function dbDel(id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(String(id));tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
  async function migrateOld(id){const raw=get(oldKey(id));if(raw===null)return;await dbSet(id,parse(raw));del(oldKey(id))}
  async function saveCurrent(){const id=activeId();if(!id)return false;await dbSet(id,parse(get(LEGACY)));return true}
  async function switchTo(account){
    if(!account?.id)return false;
    const next=String(account.id),cur=activeId();
    if(cur===next){set(ACTIVE,next);set('casaBankoTradeLockerAccount',JSON.stringify(account));del(oldKey(next));return true}
    const current=parse(get(LEGACY));
    if(cur)await dbSet(cur,current);
    await migrateOld(next);
    const nextTrades=await dbGet(next);
    // Only one full history lives in localStorage at a time.
    del(LEGACY);
    set(LEGACY,JSON.stringify(tag(nextTrades,next)));
    set(ACTIVE,next);
    set('casaBankoTradeLockerAccount',JSON.stringify(account));
    del(oldKey(next));
    window.dispatchEvent(new Event('storage'));
    if(typeof refreshAll==='function')refreshAll();
    return true;
  }
  function currentTrades(){return parse(get(LEGACY))}
  // Reclaim quota from the old per-account duplicate for the account already open.
  const aid=activeId();
  if(aid&&get(LEGACY)!==null){
    const duplicate=get(oldKey(aid));
    if(duplicate!==null){dbSet(aid,parse(duplicate)).then(()=>del(oldKey(aid))).catch(()=>{});}
  }
  window.CasaBankoAccounts={activeId,selected,switchTo,saveCurrent,currentTrades,profileKey:oldKey,dbGet,dbSet};
})();