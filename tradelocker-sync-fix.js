(()=>{
const SB_URL='https://tpziplzdiifxryoourgp.supabase.co',PUB='sb_publishable_xoC6GqPpTNGGbbKcq1nLCw_qiaxUhMK';
function status(text,ok=true){const e=document.getElementById('tlAccountStatus');if(e){e.textContent=text;e.className='status '+(ok?'ok':'bad')}}
async function correctedSync(ev){
 const target=ev.target.closest?.('#tlSyncTrades');if(!target)return;
 ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation();
 let account=null;try{account=JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{}
 if(!account){status('Select and save a LIVE account first.',false);return}
 const sb=window.supabase.createClient(SB_URL,PUB);const {data:{session}}=await sb.auth.getSession();if(!session){status('Sign into CASA BANKO Cloud first.',false);return}
 target.disabled=true;target.textContent='SYNCING…';status('Rebuilding completed trades from TradeLocker…',true);
 try{
  const r=await fetch(SB_URL+'/functions/v1/tradelocker-sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':PUB},body:JSON.stringify({account})});
  const o=await r.json();if(!r.ok)throw new Error(o.error||'Trade sync failed');
  const completed=Array.isArray(o.trades)?o.trades:[];
  // Delete ONLY the incorrect TradeLocker auto-sync rows from cloud. Manual/test trades remain untouched.
  const del=await sb.from('trades').delete().eq('source','AUTO SYNC');if(del.error)throw del.error;
  // Replace ONLY local AUTO SYNC rows. Preserve every manual/test trade.
  let existing=[];try{existing=JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{}
  const manual=existing.filter(t=>String(t?.source||'').toUpperCase()!=='AUTO SYNC');
  localStorage.setItem('casaBankoTrades',JSON.stringify(manual.concat(completed)));
  window.dispatchEvent(new Event('storage'));
  if(typeof refreshAll==='function')refreshAll();
  status('✓ '+completed.length+' COMPLETED TRADE'+(completed.length===1?'':'S')+' SYNCED',true);
 }catch(e){status(e?.message||'TradeLocker sync failed.',false)}finally{target.disabled=false;target.textContent='SYNC TRADES'}
}
document.addEventListener('click',correctedSync,true);
})();