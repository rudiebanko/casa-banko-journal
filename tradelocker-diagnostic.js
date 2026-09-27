(()=>{
const SB_URL='https://tpziplzdiifxryoourgp.supabase.co',PUB='sb_publishable_xoC6GqPpTNGGbbKcq1nLCw_qiaxUhMK';
function addButton(){
 const connected=document.getElementById('tlConnected');if(!connected||document.getElementById('tlFilledDiag'))return;
 const b=document.createElement('button');b.id='tlFilledDiag';b.type='button';b.className='settingsBtn';b.textContent='RUN P&L DIAGNOSTIC';b.style.marginTop='10px';
 const s=document.createElement('div');s.id='tlFilledDiagStatus';s.className='status';connected.appendChild(b);connected.appendChild(s);
 b.addEventListener('click',async()=>{let account=null;try{account=JSON.parse(localStorage.getItem('casaBankoTradeLockerAccount')||'null')}catch{}
  if(!account){s.textContent='Select and save a LIVE account first.';s.className='status bad';return}
  const sb=window.supabase.createClient(SB_URL,PUB);const {data:{session}}=await sb.auth.getSession();if(!session){s.textContent='Sign into CASA BANKO Cloud first.';s.className='status bad';return}
  b.disabled=true;b.textContent='CHECKING…';s.textContent='Reconstructing completed-position P&L for verification only…';s.className='status ok';
  try{const r=await fetch(SB_URL+'/functions/v1/tradelocker-pnl-diagnostic',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+session.access_token,'apikey':PUB},body:JSON.stringify({account})});const o=await r.json();if(!r.ok)throw new Error(o.error||'P&L diagnostic failed');s.textContent='✓ P&L DIAGNOSTIC COMPLETE — NO JOURNAL TRADES CHANGED';s.className='status ok'}catch(e){s.textContent=e?.message||'P&L diagnostic failed';s.className='status bad'}finally{b.disabled=false;b.textContent='RUN P&L DIAGNOSTIC'}
 });
}
new MutationObserver(addButton).observe(document.documentElement,{childList:true,subtree:true});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addButton);else addButton();
})();