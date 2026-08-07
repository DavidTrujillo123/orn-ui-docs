// Copiar-al-portapapeles + toast de confirmación. Vanilla, sin build step,
// se sirve tal cual desde public/. Progressive enhancement puro: sin esto
// el código sigue siendo seleccionable a mano y el botón "Copy page"
// simplemente no aparece — nada se rompe.
//
// Con View Transitions (astro:transitions) la navegación es client-side:
// el DOM de la página se reemplaza pero `document` sigue siendo el mismo,
// así que el click de copiar se delega en `document` (sobrevive a
// cualquier navegación sin re-bindear nada). Lo único que SÍ hay que
// rehacer por página es inyectar el botón de copiar en cada bloque de
// código nuevo — eso corre en 'astro:page-load', que dispara tanto en la
// carga inicial como en cada transición.
(function () {
  var toastRoot = null;

  function getToastRoot() {
    if (toastRoot && toastRoot.isConnected) return toastRoot;
    toastRoot = document.createElement('div');
    toastRoot.className = 'toast-root';
    toastRoot.setAttribute('aria-live', 'polite');
    toastRoot.setAttribute('role', 'status');
    document.body.appendChild(toastRoot);
    return toastRoot;
  }

  function showToast(message) {
    if (!message) return;
    var root = getToastRoot();
    var item = document.createElement('div');
    item.className = 'toast';
    item.textContent = message;
    root.appendChild(item);
    requestAnimationFrame(function () {
      item.classList.add('show');
    });
    setTimeout(function () {
      item.classList.remove('show');
      setTimeout(function () {
        item.remove();
      }, 200);
    }, 2200);
  }

  function injectCodeCopyButtons() {
    document.querySelectorAll('pre.astro-code:not([data-copy-ready])').forEach(function (pre) {
      pre.setAttribute('data-copy-ready', '');
      var wrap = document.createElement('div');
      wrap.className = 'code-wrap';
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.setAttribute('aria-label', 'Copy code');
      btn.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      wrap.appendChild(btn);
    });
  }

  function flashCopied(btn, label) {
    btn.classList.add('copied');
    var prevLabel = btn.getAttribute('aria-label');
    if (label) btn.setAttribute('aria-label', label);
    setTimeout(function () {
      btn.classList.remove('copied');
      if (prevLabel) btn.setAttribute('aria-label', prevLabel);
    }, 1500);
  }

  document.addEventListener('click', function (e) {
    var codeBtn = e.target.closest('.copy-btn');
    if (codeBtn) {
      var pre = codeBtn.closest('.code-wrap').querySelector('pre');
      var text = pre ? pre.textContent || '' : '';
      navigator.clipboard.writeText(text).then(function () {
        flashCopied(codeBtn, 'Copied');
        showToast(document.body.getAttribute('data-toast-code'));
      });
      return;
    }
    var mdBtn = e.target.closest('[data-copy-md]');
    if (mdBtn) {
      var mdText = mdBtn.getAttribute('data-md') || '';
      navigator.clipboard.writeText(mdText).then(function () {
        flashCopied(mdBtn);
        showToast(document.body.getAttribute('data-toast-md'));
      });
    }
  });

  document.addEventListener('astro:page-load', injectCodeCopyButtons);
  injectCodeCopyButtons();
})();
