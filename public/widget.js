(function () {
  var base = (document.currentScript && new URL(document.currentScript.src).origin) || location.origin;
  var btn = document.createElement('button');
  btn.textContent = 'Chat with us';
  btn.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:99999;padding:12px 18px;border:0;border-radius:24px;background:#4f46e5;color:#fff;font:600 14px system-ui;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)';
  var frame = document.createElement('iframe');
  frame.src = base + '/chat';
  frame.style.cssText = 'position:fixed;right:20px;bottom:76px;width:360px;height:520px;max-height:80vh;border:0;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.3);display:none;z-index:99999;background:#fff';
  btn.onclick = function () { frame.style.display = frame.style.display === 'none' ? 'block' : 'none'; };
  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
