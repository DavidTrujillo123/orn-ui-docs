// Buscador global (Cmd/Ctrl+K). Todo por delegación de eventos en
// `document` — con View Transitions activas, el header y el botón que
// abre el modal se re-renderizan en cada navegación (no persisten), pero
// `document` sí, así que delegar evita tener que re-bindear nada en
// 'astro:page-load'. El índice se fetchea una sola vez y se cachea en
// memoria — cero requests por tecla.
(function () {
  var indexPromise = null;
  function getIndex() {
    if (!indexPromise) indexPromise = fetch('/search-index.json').then(function (r) { return r.json(); });
    return indexPromise;
  }

  var results = [];
  var activeIndex = -1;

  function els() {
    return {
      root: document.getElementById('search-modal'),
      input: document.getElementById('search-input'),
      list: document.getElementById('search-results'),
      empty: document.getElementById('search-empty-msg'),
    };
  }

  function isOpen() {
    var e = els();
    return !!e.root && !e.root.hidden;
  }

  function open() {
    var e = els();
    if (!e.root) return;
    e.root.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    e.input.value = '';
    render([]);
    getIndex();
    setTimeout(function () { e.input.focus(); }, 0);
  }

  function close() {
    var e = els();
    if (!e.root) return;
    e.root.hidden = true;
    document.documentElement.style.overflow = '';
    var trigger = document.getElementById('search-trigger');
    if (trigger) trigger.focus();
  }

  function hrefFor(slug) {
    // Trailing slash SIEMPRE — el resto del sitio (Sidebar, nav, home
    // grid) linkea con "/components/button/", no "/components/button".
    // Sin esto, comparar contra location.pathname para marcar el item
    // activo del sidebar fallaba después de navegar desde acá.
    var esPrefix = document.documentElement.lang === 'es' ? '/es' : '';
    return esPrefix + '/' + slug + '/';
  }

  function render(items) {
    var e = els();
    results = items;
    activeIndex = items.length ? 0 : -1;
    e.list.innerHTML = '';
    var hasQuery = e.input.value.trim().length > 0;
    e.empty.hidden = !hasQuery || items.length !== 0;
    items.forEach(function (item, i) {
      var li = document.createElement('li');
      li.id = 'search-option-' + i;
      li.setAttribute('role', 'option');
      var a = document.createElement('a');
      a.href = hrefFor(item.slug);
      a.className = 'search-result';
      var name = document.createElement('span');
      name.className = 'search-result-name';
      name.textContent = item.name;
      var cat = document.createElement('span');
      cat.className = 'search-result-cat';
      cat.textContent = item.category;
      a.appendChild(name);
      a.appendChild(cat);
      li.appendChild(a);
      e.list.appendChild(li);
    });
    updateActive();
  }

  function updateActive() {
    var e = els();
    if (!e.list) return;
    Array.prototype.forEach.call(e.list.children, function (li, i) {
      var active = i === activeIndex;
      li.setAttribute('aria-selected', active ? 'true' : 'false');
      li.classList.toggle('active', active);
      if (active) li.scrollIntoView({ block: 'nearest' });
    });
    if (e.input) {
      if (activeIndex >= 0) e.input.setAttribute('aria-activedescendant', 'search-option-' + activeIndex);
      else e.input.removeAttribute('aria-activedescendant');
    }
  }

  function filter(query) {
    var q = query.trim().toLowerCase();
    if (!q) { render([]); return; }
    getIndex().then(function (all) {
      var matches = all.filter(function (item) { return item.haystack.indexOf(q) !== -1; }).slice(0, 20);
      render(matches);
    });
  }

  function go(i) {
    var item = results[i];
    if (!item) return;
    window.location.href = hrefFor(item.slug);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('#search-trigger')) { e.preventDefault(); open(); return; }
    if (e.target.closest('#search-close') || e.target.closest('.search-backdrop')) { close(); }
  });

  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'search-input') filter(e.target.value);
  });

  document.addEventListener('keydown', function (e) {
    var mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen()) close(); else open();
      return;
    }
    if (!isOpen()) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) { activeIndex = (activeIndex + 1) % results.length; updateActive(); }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) { activeIndex = (activeIndex - 1 + results.length) % results.length; updateActive(); }
      return;
    }
    if (e.key === 'Enter') { e.preventDefault(); go(activeIndex); }
  });

  // Si se navega (view transitions) con el modal abierto, ciérralo — el
  // resultado clickeado ya dispara la navegación por su cuenta; esto
  // cubre el caso de Cmd/Ctrl+click a otra ruta mientras seguía abierto.
  document.addEventListener('astro:before-preparation', function () {
    if (isOpen()) close();
  });
})();
