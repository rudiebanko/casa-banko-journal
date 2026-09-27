(()=>{
const SB_URL='https://tpziplzdiifxryoourgp.supabase.co',PUB='sb_publishable_xoC6GqPpTNGGbbKcq1nLCw_qiaxUhMK';
function status(text,ok=true){const e=document.getElementById('tlAccountStatus');if(e){e.textContent=text;e.className='status '+(ok?'ok':'bad')}}
function isTradeLockerRow(t){
 const src=String(t?.source||'').trim().toUpperCase();
 const cid=String(t?.clientTradeId||t?.client_trade_id||'');
 const id=String(t?.id||'');
 return src==='AUTO SYNC'||src==='TRADELOCKER'||src==='TRADELOCKER SYNC'||cid.startsWith('tl-')||id.startsWith('tl-')||t?.tradeLockerId!=null||t?.positionId!=null||t?.tradableInstrumentId!=null||t?.accountId!=null&&src!=='MANUAL';
}
async function correctedSync(ev){
 const target=ev.target.closest?.('#tlSyncTrades');if(!target)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 let account=null;try{account=JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{}
 if(!account){status('Select and save a LIVE account first.',false);return}
 const sb=window.supabase.createClient(SB_URL,PUB);const {data:{session}}=await sb.auth.getSession();if(!session){status('Sign into CASA BANKO Cloud first.',false);return}
 target.disabled=true;target.textContent='SYNCING…';status('Replacing TradeLocker trades…',true);
 try{
  const r=await fetch(SB_URL+'/functions/v1/tradelocker-sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':PUB},body:JSON.stringify({account})});
  const o=await r.json();if(!r.ok)throw new Error(o.error||'Trade sync failed');
  const incoming=Array.isArray(o.trades)?o.trades:[];
  const unique=[];const seen=new Set();
  for(const t of incoming){const k=String(t?.clientTradeId||t?.positionId||t?.tradeLockerId||t?.id||'');if(!k||seen.has(k))continue;seen.add(k);unique.push(t)}
  // Cloud cleanup is restricted to broker-generated rows only. Manual/test rows are never touched.
  for(const src of ['AUTO SYNC','TRADELOCKER','TRADELOCKER SYNC']){const d=await sb.from('trades').delete().eq('source',src);if(d.error)throw d.error}
  // Remove every previous TradeLocker-generated local row, including older malformed imports, then add one deduplicated replacement set.
  let existing=[];try{existing=JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{}
  const manual=existing.filter(t=>!isTradeLockerRow(t));
  localStorage.setItem('casaBankoTrades',JSON.stringify(manual.concat(unique)));
  window.dispatchEvent(new Event('storage'));
  if(typeof refreshAll==='function')refreshAll();
  status('✓ '+unique.length+' COMPLETED TRADE'+(unique.length===1?'':'S')+' SYNCED',true);
 }catch(e){status(e?.message||'TradeLocker sync failed.',false)}finally{target.disabled=false;target.textContent='SYNC TRADES'}
}
document.addEventListener('click',correctedSync,true);
})();