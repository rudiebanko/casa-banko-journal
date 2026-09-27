// CASA BANKO storage quota guard.
// Genesis already keeps an in-memory rollback copy before applying changes, so a second full
// persistent copy of a large journal is unnecessary and can exceed the browser localStorage quota.
(()=>{
  try{
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i)||'';
      if(k==='casaBankoPreGenesisApplyBackup'||k.startsWith('casaBankoPreGenesisApplyBackup::'))localStorage.removeItem(k);
    }
  }catch{}
  const nativeSet=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){
    if(this===localStorage&&String(k).startsWith('casaBankoPreGenesisApplyBackup'))return;
    return nativeSet.call(this,k,v);
  };
})();