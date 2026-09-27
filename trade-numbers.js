// CASA BANKO trade numbering + trade management behavior
// Loaded after app.js so this is the final Trade History renderer.
let bankoManageMode = false;
let bankoOpenTradeMenu = null;

function renderManage(){
  const a=allTrades();
  $('manageTrades').innerHTML=a.length?a.map((x,i)=>{
    const bp=bankoParts(x);
    const number=`TRADE #${i+1} · `;
    const controls=bankoManageMode?`<div class="manageActions"><button class="tradeGear" data-gear="${i}" aria-label="Trade settings">⚙️</button>${bankoOpenTradeMenu===i?`<div class="tradeActionMenu"><button class="deleteBtn" data-delete="${i}">DELETE TRADE</button></div>`:''}</div>`:'';
    return `<div class="manageRow"><div class="clickTrade" data-select="${i}"><div class="tradeTop"><span>${number}${x.symbol||'TRADE'} · ${x.direction||'—'}</span><span>${x.result||'—'}</span></div><div class="tradeMeta">${tradeTime(x)?.toLocaleString()||'No date'} · ${x.session||'—'} · $${(+x.pnl||0).toFixed(2)} · ${signed(bp.total)} BANKOS · ${x.grade||'NO GRADE'}</div></div>${controls}</div>`;
  }).join(''):'<div class="empty">No saved trades yet.</div>';

  $('manageTrades').querySelectorAll('[data-select]').forEach(e=>e.onclick=()=>selectTrade(e.dataset.select));
  $('manageTrades').querySelectorAll('[data-gear]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const i=+b.dataset.gear;
    bankoOpenTradeMenu=bankoOpenTradeMenu===i?null:i;
    renderManage();
  });
  $('manageTrades').querySelectorAll('[data-delete]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const i=+b.dataset.delete,a=allTrades();
    if(a[i]&&confirm('Delete this trade? This cannot be undone.')){
      a.splice(i,1);saveTrades(a);
      if(selectedIndex===i)selectedIndex=null;
      else if(selectedIndex!==null&&selectedIndex>i)selectedIndex--;
      bankoOpenTradeMenu=null;
      refreshAll();
    }
  });
}

if($('manageToggle')) $('manageToggle').onclick=()=>{
  bankoManageMode=!bankoManageMode;
  bankoOpenTradeMenu=null;
  $('manageList').classList.add('open');
  $('manageToggle').textContent=bankoManageMode?'DONE':'MANAGE TRADES';
  renderManage();
};

document.addEventListener('click',e=>{
  if(bankoOpenTradeMenu!==null&&!e.target.closest('.manageActions')){
    bankoOpenTradeMenu=null;
    renderManage();
  }
});

renderManage();
