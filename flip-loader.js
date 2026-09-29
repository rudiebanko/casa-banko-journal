/* CASA BANKO feature loader — synchronous so existing screens render immediately */
(function(){
  var touchIcon=document.createElement('link');
  touchIcon.rel='apple-touch-icon';
  touchIcon.sizes='180x180';
  touchIcon.href='casa-banko-app-icon.png?v=20260928-2026';
  document.head.appendChild(touchIcon);

  var favicon=document.createElement('link');
  favicon.rel='icon';
  favicon.type='image/png';
  favicon.href='casa-banko-app-icon.png?v=20260928-2026';
  document.head.appendChild(favicon);
})();
document.write('<link rel="stylesheet" href="flip-road-states.css?v=20260928-1851">');
document.write('<script src="flip-cloud-sync.js?v=20260928-2042"><\/script>');
document.write('<script src="flip-challenge.js?v=20260928-1802"><\/script>');
document.write('<link rel="stylesheet" href="journal-account-journey.css?v=20260928-1947">');
document.write('<script src="journal-account-journey.js?v=20260928-1947"><\/script>');
document.write('<link rel="stylesheet" href="desktop-layout-fix.css?v=20260928-2101">');