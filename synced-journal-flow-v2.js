// CASA BANKO — isolated synced-trade journal workflow.
// UI-only workflow layer: does not alter navigation, TradeLocker sync, Genesis reconciliation, calendar, stats, or analytics.
(()=>{
  const $=id=>document.getElementById(id);
  const source=$('sourceChoice'), save=$('save'), history=$('manageTrades');
  if(!source||!save||!history)return;
  const card=source.closest('.card');
  if(!card||card.dataset.syncedJournalV2==='1')return;
  card.dataset.syncedJournalV2='1';
  let editingIndex=null, manualMode=false, snapshotPanel=null;

  const title=card.querySelector('.title');
  if(title)title.textContent='JOURNAL TRADE';
  const hint=document.createElement('div');
  hint.className='hint'; hint.id='syncedJournalHint';
  hint.textContent='Select a synced trade from Trade History to add your journal details.';
  title?.insertAdjacentElement('afterend',hint);
  const manual=document.createElement('button');
  manual.type='button'; manual.className='manageBtn'; manual.id='syncedManualFallback';
  manual.textContent='+ ADD TRADE MANUALLY';
  hint.insertAdjacentElement('afterend',manual);

  const sourceLabel=source.previousElementSibling;
  if(sourceLabel?.classList.contains('label'))sourceLabel.style.display='none';
  source.style.display='none';

  const manualBox=$('manualBox');
  const manualDetailsLabel=manualBox?.querySelector('.label');
  if(manualDetailsLabel)manualDetailsLabel.textContent='TRADE DETAILS';
  const directionGroup=document.querySelector('.single[data-k="direction"]');
  const sessionGroup=document.querySelector('.single[data-k="session"]');

  const detailLabels={symbol:'SYMBOL',tradeDate:'OPEN TIME',entryPrice:'ENTRY',exitPrice:'CLOSE',stopLoss:'STOP LOSS',pnlInput:'P&L',rInput:'RISK $',result:'RESULT'};
  Object.entries(detailLabels).forEach(([id,text])=>{
    const input=$(id); if(!input||input.parentElement?.classList.contains('detailFieldWrap'))return;
    const wrap=document.createElement('div'); wrap.className='detailFieldWrap detail-'+id;
    wrap.style.cssText='min-width:0;display:flex;flex-direction:column;gap:5px';
    const lab=document.createElement('div'); lab.textContent=text; lab.className='detailFieldMiniLabel';
    lab.style.cssText='font-size:9px;letter-spacing:.08em;font-weight:700;color:#9f947a;padding-left:2px';
    input.parentNode.insertBefore(wrap,input); wrap.append(lab,input);
  });
  const rWrap=$('rInput')?.parentElement;
  if(rWrap&&!$('autoRResult')){const out=document.createElement('div');out.id='autoRResult';out.className='hint';out.style.cssText='font-size:10px;margin-top:1px;color:#d7b84b;min-height:13px';out.textContent='R RESULT: —';rWrap.appendChild(out)}

  let closeTimeInput=$('closeTimeDisplay');
  if(!closeTimeInput&&manualBox){
    const grid=manualBox.querySelector('.fieldGrid');
    if(grid){
      const wrap=document.createElement('div');wrap.className='detailFieldWrap syncedCloseTimeWrap';wrap.style.cssText='min-width:0;display:flex;flex-direction:column;gap:5px';
      const lab=document.createElement('div');lab.textContent='CLOSE TIME';lab.className='detailFieldMiniLabel';lab.style.cssText='font-size:9px;letter-spacing:.08em;font-weight:700;color:#9f947a;padding-left:2px';
      closeTimeInput=document.createElement('input');closeTimeInput.id='closeTimeDisplay';closeTimeInput.className='field executionLocked';closeTimeInput.type='text';closeTimeInput.readOnly=true;closeTimeInput.placeholder='Available after close / Genesis CSV';closeTimeInput.style.cursor='default';
      wrap.append(lab,closeTimeInput);grid.appendChild(wrap);
    }
  }

  const detailsGrid=manualBox?.querySelector('.fieldGrid');
  if(detailsGrid){
    detailsGrid.style.display='grid';
    detailsGrid.style.gridTemplateColumns='minmax(95px,.7fr) minmax(170px,1.3fr) minmax(170px,1.3fr)';
    detailsGrid.style.gap='9px 10px';
    const ordered=['symbol','tradeDate','closeTimeDisplay','entryPrice','exitPrice','pnlInput','stopLoss','rInput','result'];
    ordered.forEach((id,pos)=>{const el=$(id);const wrap=el?.closest('.detailFieldWrap');if(wrap){wrap.style.gridColumn=String((pos%3)+1);wrap.style.gridRow=String(Math.floor(pos/3)+1);detailsGrid.appendChild(wrap)}});
    ordered.forEach(id=>{const el=$(id);if(el){el.style.width='100%';el.style.minWidth='0';el.style.boxSizing='border-box'}});
  }

  const editorNodes=[];let n=manual.nextElementSibling;while(n){editorNodes.push(n);n=n.nextElementSibling}
  const showEditor=show=>editorNodes.forEach(el=>el.style.display=show?'':'none');showEditor(false);
  function trades(){try{return JSON.parse(localStorage.getItem('casaBankoTrades')||'[]')}catch{return[]}}
  function write(a){localStorage.setItem('casaBankoTrades',JSON.stringify(a))}
  function setVal(id,v){const e=$(id);if(e)e.value=v??''}
  function lock(id,on){const e=$(id);if(!e)return;e.readOnly=!!on;e.classList.toggle('executionLocked',!!on)}
  function lockSelect(id,on){const e=$(id);if(!e)return;e.disabled=!!on;e.classList.toggle('executionLocked',!!on);e.style.pointerEvents=on?'none':'';e.style.cursor=on?'default':'';e.setAttribute('aria-disabled',on?'true':'false')}
  function lockDirection(on){if(!directionGroup)return;directionGroup.querySelectorAll('button').forEach(b=>{b.disabled=!!on;b.style.pointerEvents=on?'none':'';b.style.cursor=on?'default':'';b.setAttribute('aria-disabled',on?'true':'false')})}
  function lockSession(on){if(!sessionGroup)return;sessionGroup.querySelectorAll('button').forEach(b=>{b.disabled=!!on;b.style.pointerEvents=on?'none':'';b.style.cursor=on?'default':'';b.setAttribute('aria-disabled',on?'true':'false')})}
  function one(key,val){const g=document.querySelector('.single[data-k="'+key+'"]');if(!g)return;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.textContent===val));S[key]=val||''}
  function many(key,val){const g=document.querySelector('.many[data-k="'+key+'"]');if(!g)return;const vals=Array.isArray(val)?val:(val?[val]:[]);g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',vals.includes(b.textContent)));S[key]=vals}
  function multi(key,val){const g=document.querySelector('.multi[data-k="'+key+'"]');if(!g)return;const vals=Array.isArray(val)?val:(val?[val]:[]);g.querySelectorAll('.drop button').forEach(b=>b.classList.toggle('on',vals.includes(b.textContent)));const top=g.querySelector('.multiTop');if(top)top.textContent=(vals.length?vals.join(' • '):'Select timeframes')+' ▾';S[key]=vals}
  function first(t,names){for(const k of names){if(t?.[k]!==undefined&&t?.[k]!==null&&t[k]!=='')return t[k]}return''}
  function rawOpenTime(t){return first(t,['openTime','open_time','openTimestamp','open_timestamp','openDate','open_date','entryTime','entry_time','date','savedAt'])}
  function rawCloseTime(t){return first(t,['genesisCloseTime','closeTime','close_time','closedAt','closed_at','exitTime','exit_time','closeDate'])}
  function parsedDate(raw){if(raw===undefined||raw===null||raw==='')return null;const num=Number(raw);const d=Number.isFinite(num)&&num>0?new Date(num<1e12?num*1000:num):new Date(raw);return isNaN(d)?null:d}
  function openDate(t){return parsedDate(rawOpenTime(t))}
  function fullTime(raw){const d=parsedDate(raw);if(!d)return String(raw||'');return d.toLocaleString('en-US',{month:'2-digit',day:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}
  function fullOpenTime(t){return fullTime(rawOpenTime(t))}
  function fullCloseTime(t){return fullTime(rawCloseTime(t))}
  function updateRPreview(){const risk=Math.abs(parseFloat($('rInput')?.value));const pnl=parseFloat($('pnlInput')?.value);const out=$('autoRResult');if(!out)return null;if(!Number.isFinite(risk)||risk<=0||!Number.isFinite(pnl)){out.textContent='R RESULT: —';return null}const r=pnl/risk;out.textContent='R RESULT: '+(r>=0?'+':'')+r.toFixed(2)+'R';return +r.toFixed(4)}
  $('rInput')?.addEventListener('input',updateRPreview);
  function sessionFromOpenTime(t){const d=openDate(t);if(!d)return t.session||'';const mins=d.getHours()*60+d.getMinutes();if(mins>=15*60&&mins<23*60)return'ASIA';if(mins>=23*60||mins<4*60)return'LONDON';if(mins>=4*60&&mins<14*60)return'NEW YORK';return t.session||''}
  function ensureSnapshot(t,i){
    if(!snapshotPanel){
      snapshotPanel=document.createElement('aside');snapshotPanel.className='journalTradeSnapshot';snapshotPanel.id='journalTradeSnapshot';
      card.appendChild(snapshotPanel);
    }
    const pnl=Number(t.pnl), pnlText=Number.isFinite(pnl)?((pnl>=0?'+':'')+'
    if(title)title.textContent='JOURNAL TRADE #'+(i+1)+' · '+(t.symbol||'TRADE')+' · '+(t.direction||'—')+' · '+(sessionFromOpenTime(t)||t.session||'—');
    if(manualDetailsLabel)manualDetailsLabel.textContent='TRADE DETAILS';
    hint.textContent='Add your setup, execution notes, grade and screenshot. Synced execution data stays protected.';
    setVal('symbol',t.symbol||'');const td=$('tradeDate');if(td){td.type='text';td.value=fullOpenTime(t);td.title=fullOpenTime(t);td.style.minWidth='0';td.style.cursor='default'}
    if(closeTimeInput){const close=fullCloseTime(t);closeTimeInput.value=close||'—';closeTimeInput.title=close||'Close time not available yet'}
    setVal('entryPrice',first(t,['entry','entryPrice','openPrice','open_price']));setVal('exitPrice',first(t,['exit','exitPrice','closePrice','close_price']));setVal('stopLoss',t.stopLoss);setVal('pnlInput',t.pnl);setVal('rInput',t.riskAmount??t.riskDollar??'');setVal('result',t.result);
    ['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput'].forEach(id=>lock(id,true));lockSelect('result',true);lock('symbol',false);lock('rInput',false);updateRPreview();one('direction',t.direction);lockDirection(true);
    const autoSession=sessionFromOpenTime(t);one('session',autoSession);lockSession(true);one('phase',t.phase);one('liq',t.liq);one('plan',t.plan);one('grade',t.grade);many('model',t.model);multi('keyLevel',t.keyLevel);multi('bosTF',t.bosTF);multi('entryTF',t.entryTF);setVal('notes',t.notes||'');$('shotName').textContent=t.screenshotName||'No screenshot selected.';save.textContent='SAVE JOURNAL ENTRY';$('status').textContent='';card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  history.addEventListener('click',e=>{const row=e.target.closest('.manageRow');if(!row)return;const rows=[...history.querySelectorAll('.manageRow')],i=rows.indexOf(row);if(i<0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openTrade(i)},true);window.addEventListener('casaBankoOpenJournalTrade',e=>{const i=Number(e.detail?.index);if(Number.isInteger(i)&&i>=0)openTrade(i)});
  manual.onclick=()=>{editingIndex=null;manualMode=true;showEditor(true);manual.style.display='none';card.classList.remove('syncedTradeEditing');if(snapshotPanel)snapshotPanel.remove();snapshotPanel=null;if(title)title.textContent='JOURNAL TRADE';if(manualDetailsLabel)manualDetailsLabel.textContent='MANUAL TRADE DETAILS';hint.textContent='Manual fallback entry — use this only for a trade that is not coming from TradeLocker.';const td=$('tradeDate');if(td){td.type='datetime-local';td.style.minWidth='0';td.title='';td.value=''}if(closeTimeInput)closeTimeInput.closest('.syncedCloseTimeWrap').style.display='none';['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput','symbol','rInput'].forEach(id=>lock(id,false));lockSelect('result',false);const rLab=$('rInput')?.parentElement?.querySelector('.detailFieldMiniLabel');if(rLab)rLab.textContent='R RESULT';const rOut=$('autoRResult');if(rOut)rOut.style.display='none';lockDirection(false);lockSession(false);S.source='MANUAL';save.textContent='SAVE MANUAL TRADE'};
  save.onclick=async function(e){
    if(manualMode){
      e?.preventDefault?.();
      const now=new Date().toISOString(), activeId=window.CasaBankoAccounts?.activeId?.()||'';
      const riskRaw=$('rInput')?.value??'', pnlRaw=$('pnlInput')?.value??'';
      const manualTrade={...S,source:'MANUAL',symbol:$('symbol')?.value.trim()||'',date:$('tradeDate')?.value||now,entry:$('entryPrice')?.value===''?null:+$('entryPrice').value,exit:$('exitPrice')?.value===''?null:+$('exitPrice').value,stopLoss:$('stopLoss')?.value===''?null:+$('stopLoss').value,pnl:pnlRaw===''?0:+pnlRaw,r:riskRaw===''?null:+riskRaw,result:$('result')?.value||'',notes:$('notes')?.value||'',screenshotName:$('shot')?.files?.[0]?.name||'',savedAt:now};
      if(activeId)manualTrade.tradeLockerAccountId=String(activeId);
      const a=trades();a.push(manualTrade);write(a);
      try{if(window.CasaBankoAccounts?.saveCurrent)await window.CasaBankoAccounts.saveCurrent()}catch(err){console.warn('CASA BANKO manual trade account persistence:',err)}
      $('status').textContent='✓ MANUAL TRADE SAVED';
      manualMode=false;showEditor(false);manual.style.display='';hint.textContent='Select a synced trade from Trade History to add your journal details.';
      if(typeof refreshAll==='function')refreshAll();
      return;
    }
    if(editingIndex===null)return;
    const a=trades(),old=a[editingIndex];if(!old)return;const risk=Math.abs(parseFloat($('rInput').value));const calculatedR=updateRPreview();const updated={...old,symbol:$('symbol').value.trim()||old.symbol,riskAmount:Number.isFinite(risk)&&risk>0?risk:null,r:calculatedR,result:old.result,session:sessionFromOpenTime(old)||old.session,phase:S.phase||old.phase,keyLevel:S.keyLevel||old.keyLevel,bosTF:S.bosTF||old.bosTF,entryTF:S.entryTF||old.entryTF,liq:S.liq||old.liq,model:S.model||old.model,plan:S.plan||old.plan,grade:S.grade||old.grade,notes:$('notes').value,screenshotName:$('shot').files[0]?.name||old.screenshotName||'',journalUpdatedAt:new Date().toISOString()};a[editingIndex]=updated;write(a);try{if(window.CasaBankoAccounts?.saveCurrent)await window.CasaBankoAccounts.saveCurrent()}catch(err){console.warn('CASA BANKO journal account persistence:',err)}$('status').textContent='✓ Journal entry saved — R calculated from P&L ÷ intended Risk $.';if(typeof refreshAll==='function')refreshAll()};
})();+Math.abs(pnl).toFixed(2)):'—';
    const r=Number(t.r), rText=Number.isFinite(r)?((r>=0?'+':'')+r.toFixed(2)+'R'):'—';
    snapshotPanel.innerHTML='<div class="snapshotHead"><span>TRADE SNAPSHOT</span><b>#'+(i+1)+'</b></div>'+
      '<div class="snapshotHero"><div><small>PAIR</small><strong>'+(t.symbol||'—')+'</strong></div><div><small>DIRECTION</small><strong class="'+(String(t.direction).toUpperCase()==='BUY'?'snapBuy':'snapSell')+'">'+(t.direction||'—')+'</strong></div></div>'+
      '<div class="snapshotStats"><div><small>SESSION</small><b>'+(sessionFromOpenTime(t)||t.session||'—')+'</b></div><div><small>RESULT</small><b>'+(t.result||'—')+'</b></div><div><small>P&L</small><b class="'+(pnl>=0?'snapProfit':'snapLoss')+'">'+pnlText+'</b></div><div><small>R RESULT</small><b>'+rText+'</b></div><div><small>ENTRY</small><b>'+first(t,['entry','entryPrice','openPrice','open_price'])+'</b></div><div><small>EXIT</small><b>'+first(t,['exit','exitPrice','closePrice','close_price'])+'</b></div></div>'+
      '<div class="snapshotTimes"><div><small>OPEN</small><span>'+fullOpenTime(t)+'</span></div><div><small>CLOSE</small><span>'+(fullCloseTime(t)||'—')+'</span></div></div>'+
      '<div class="snapshotChart"><span>CHART SCREENSHOT</span><div class="snapshotEmpty">Upload your trade screenshot<br><small>Preview will live here</small></div></div>';
  }
  function openTrade(i){
    const a=trades(),t=a[i];if(!t)return;editingIndex=i;manualMode=false;showEditor(true);manual.style.display='none';card.classList.add('syncedTradeEditing');ensureSnapshot(t,i);
    if(title)title.textContent='JOURNAL TRADE #'+(i+1)+' · '+(t.symbol||'TRADE')+' · '+(t.direction||'—')+' · '+(sessionFromOpenTime(t)||t.session||'—');
    if(manualDetailsLabel)manualDetailsLabel.textContent='TRADE DETAILS';
    hint.textContent='Add your setup, execution notes, grade and screenshot. Synced execution data stays protected.';
    setVal('symbol',t.symbol||'');const td=$('tradeDate');if(td){td.type='text';td.value=fullOpenTime(t);td.title=fullOpenTime(t);td.style.minWidth='0';td.style.cursor='default'}
    if(closeTimeInput){const close=fullCloseTime(t);closeTimeInput.value=close||'—';closeTimeInput.title=close||'Close time not available yet'}
    setVal('entryPrice',first(t,['entry','entryPrice','openPrice','open_price']));setVal('exitPrice',first(t,['exit','exitPrice','closePrice','close_price']));setVal('stopLoss',t.stopLoss);setVal('pnlInput',t.pnl);setVal('rInput',t.riskAmount??t.riskDollar??'');setVal('result',t.result);
    ['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput'].forEach(id=>lock(id,true));lockSelect('result',true);lock('symbol',false);lock('rInput',false);updateRPreview();one('direction',t.direction);lockDirection(true);
    const autoSession=sessionFromOpenTime(t);one('session',autoSession);lockSession(true);one('phase',t.phase);one('liq',t.liq);one('plan',t.plan);one('grade',t.grade);many('model',t.model);multi('keyLevel',t.keyLevel);multi('bosTF',t.bosTF);multi('entryTF',t.entryTF);setVal('notes',t.notes||'');$('shotName').textContent=t.screenshotName||'No screenshot selected.';save.textContent='SAVE JOURNAL ENTRY';$('status').textContent='';card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  history.addEventListener('click',e=>{const row=e.target.closest('.manageRow');if(!row)return;const rows=[...history.querySelectorAll('.manageRow')],i=rows.indexOf(row);if(i<0)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openTrade(i)},true);window.addEventListener('casaBankoOpenJournalTrade',e=>{const i=Number(e.detail?.index);if(Number.isInteger(i)&&i>=0)openTrade(i)});
  manual.onclick=()=>{editingIndex=null;manualMode=true;showEditor(true);manual.style.display='none';card.classList.remove('syncedTradeEditing');if(title)title.textContent='JOURNAL TRADE';if(manualDetailsLabel)manualDetailsLabel.textContent='MANUAL TRADE DETAILS';hint.textContent='Manual fallback entry — use this only for a trade that is not coming from TradeLocker.';const td=$('tradeDate');if(td){td.type='datetime-local';td.style.minWidth='0';td.title='';td.value=''}if(closeTimeInput)closeTimeInput.closest('.syncedCloseTimeWrap').style.display='none';['tradeDate','entryPrice','exitPrice','stopLoss','pnlInput','symbol','rInput'].forEach(id=>lock(id,false));lockSelect('result',false);const rLab=$('rInput')?.parentElement?.querySelector('.detailFieldMiniLabel');if(rLab)rLab.textContent='R RESULT';const rOut=$('autoRResult');if(rOut)rOut.style.display='none';lockDirection(false);lockSession(false);S.source='MANUAL';save.textContent='SAVE MANUAL TRADE'};
  save.onclick=async function(e){
    if(manualMode){
      e?.preventDefault?.();
      const now=new Date().toISOString(), activeId=window.CasaBankoAccounts?.activeId?.()||'';
      const riskRaw=$('rInput')?.value??'', pnlRaw=$('pnlInput')?.value??'';
      const manualTrade={...S,source:'MANUAL',symbol:$('symbol')?.value.trim()||'',date:$('tradeDate')?.value||now,entry:$('entryPrice')?.value===''?null:+$('entryPrice').value,exit:$('exitPrice')?.value===''?null:+$('exitPrice').value,stopLoss:$('stopLoss')?.value===''?null:+$('stopLoss').value,pnl:pnlRaw===''?0:+pnlRaw,r:riskRaw===''?null:+riskRaw,result:$('result')?.value||'',notes:$('notes')?.value||'',screenshotName:$('shot')?.files?.[0]?.name||'',savedAt:now};
      if(activeId)manualTrade.tradeLockerAccountId=String(activeId);
      const a=trades();a.push(manualTrade);write(a);
      try{if(window.CasaBankoAccounts?.saveCurrent)await window.CasaBankoAccounts.saveCurrent()}catch(err){console.warn('CASA BANKO manual trade account persistence:',err)}
      $('status').textContent='✓ MANUAL TRADE SAVED';
      manualMode=false;showEditor(false);manual.style.display='';hint.textContent='Select a synced trade from Trade History to add your journal details.';
      if(typeof refreshAll==='function')refreshAll();
      return;
    }
    if(editingIndex===null)return;
    const a=trades(),old=a[editingIndex];if(!old)return;const risk=Math.abs(parseFloat($('rInput').value));const calculatedR=updateRPreview();const updated={...old,symbol:$('symbol').value.trim()||old.symbol,riskAmount:Number.isFinite(risk)&&risk>0?risk:null,r:calculatedR,result:old.result,session:sessionFromOpenTime(old)||old.session,phase:S.phase||old.phase,keyLevel:S.keyLevel||old.keyLevel,bosTF:S.bosTF||old.bosTF,entryTF:S.entryTF||old.entryTF,liq:S.liq||old.liq,model:S.model||old.model,plan:S.plan||old.plan,grade:S.grade||old.grade,notes:$('notes').value,screenshotName:$('shot').files[0]?.name||old.screenshotName||'',journalUpdatedAt:new Date().toISOString()};a[editingIndex]=updated;write(a);try{if(window.CasaBankoAccounts?.saveCurrent)await window.CasaBankoAccounts.saveCurrent()}catch(err){console.warn('CASA BANKO journal account persistence:',err)}$('status').textContent='✓ Journal entry saved — R calculated from P&L ÷ intended Risk $.';if(typeof refreshAll==='function')refreshAll()};
})();