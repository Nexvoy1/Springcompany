(function(){
  function makeSwitcher(){
    var path = location.pathname;
    var rest;
    var isEn = path.indexOf('/en/') === 0;
    var isKo = path.indexOf('/ko/') === 0;
    if(isEn) rest = path.replace(/^\/en/,'');
    else if(isKo) rest = path.replace(/^\/ko/,'');
    else rest = path;

    var enPath = '/en' + rest;
    var koPath = '/ko' + rest;

    var container = document.createElement('div');
    container.id = 'lang-switcher';
    container.style.cssText = 'position:absolute;right:12px;top:12px;font-family:sans-serif;z-index:9999';

    function makeA(href,label,active){
      var a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      a.style.cssText = 'margin-left:8px;text-decoration:none;color:#333;font-weight:600;padding:6px 8px;border-radius:4px;border:1px solid rgba(0,0,0,0.08);background:#fff';
      if(active) a.style.opacity = '0.6';
      return a;
    }

    var aEn = makeA(enPath,'EN', isEn);
    var aKo = makeA(koPath,'KO', isKo);
    container.appendChild(aEn);
    container.appendChild(aKo);

    var header = document.querySelector('header') || document.body;
    if(getComputedStyle(header).position === 'static') header.style.position = 'relative';
    header.appendChild(container);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeSwitcher);
  else makeSwitcher();
})();
