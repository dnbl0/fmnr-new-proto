/* ============================================================
   header.js — injects the shared site header (header.html) and
   wires up the mega-menu. Mirrors assets/js/footer.js.

   Pages include this with: <script src="/assets/js/header.js" defer></script>
   and must NOT carry an inline <header class="header"> any more.
   ============================================================ */
// Capture this script's own URL now (document.currentScript is only valid
// during synchronous top-level execution, not inside later callbacks). From it
// we derive the site root so absolute partial paths work whether the site is
// served from a domain root (localhost) or a subpath (GitHub Pages project site).
var SELF = document.currentScript;
function siteRoot() {
  var s = (SELF && SELF.src) || '';
  var i = s.indexOf('/assets/js/');
  return i >= 0 ? s.slice(0, i + 1) : '/';
}
// Rewrite a fetched fragment's root-relative ("/foo") href/src to the real
// site root so its links resolve correctly at any page depth.
function absolutise(el, root) {
  ['href', 'src'].forEach(function (attr) {
    el.querySelectorAll('[' + attr + '^="/"]').forEach(function (node) {
      var v = node.getAttribute(attr);
      if (v.charAt(1) !== '/') node.setAttribute(attr, root + v.slice(1)); // skip protocol-relative //
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.querySelector('header.header')) {
    // Header already present (legacy inline header) — just wire it up.
    initHeader();
    return;
  }

  var root = siteRoot();

  // add header stylesheet
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = root + 'assets/css/header.css';
  document.head.appendChild(link);

  // fetch and insert header (prepended to body so it sits first)
  fetch(root + 'header.html', {cache: 'no-cache'})
    .then(function (res) { if (!res.ok) throw new Error('Header fetch failed'); return res.text(); })
    .then(function (html) {
      var div = document.createElement('div');
      div.innerHTML = html.trim();
      var header = div.querySelector('header.header') || div.firstElementChild;
      absolutise(header, root);
      document.body.insertBefore(header, document.body.firstChild);
      initHeader();
      // let other scripts (e.g. search.js) bind to header elements
      document.dispatchEvent(new Event('header:ready'));
    })
    .catch(function (err) {
      // graceful fallback: minimal header so the page still has a home link
      var fallback = document.createElement('header');
      fallback.className = 'header header-fallback';
      fallback.innerHTML = '<div class="section-container"><a href="' + root + 'index.html" class="logo">FMNR</a></div>';
      document.body.insertBefore(fallback, document.body.firstChild);
      console.warn('Could not load header:', err);
    });

  // ── Header behaviour: mega-panel positioning + hover/click interaction ──
  function initHeader() {
    positionMegaPanels();
    window.addEventListener('resize', positionMegaPanels);
    window.addEventListener('load', positionMegaPanels);

    // .mega-panel is position:fixed so it sits outside .mega-item's layout box.
    // Track mouseenter/mouseleave on both the nav item AND the panel, with a
    // short delay that lets the mouse bridge the gap between them.
    document.querySelectorAll('.mega-item').forEach(function (item) {
      var panel = item.querySelector('.mega-panel');
      if (!panel) return;
      var hideTimer = null;

      function show() {
        clearTimeout(hideTimer);
        document.querySelectorAll('.mega-panel').forEach(function (p) {
          if (p !== panel) p.style.display = 'none';
        });
        panel.style.display = 'block';
      }
      function scheduleHide() {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(function () { panel.style.display = 'none'; }, 80);
      }

      item.addEventListener('mouseenter', show);
      item.addEventListener('mouseleave', scheduleHide);
      panel.addEventListener('mouseenter', show);
      panel.addEventListener('mouseleave', scheduleHide);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.mega-item') && !e.target.closest('.mega-panel')) {
        document.querySelectorAll('.mega-panel').forEach(function (p) { p.style.display = 'none'; });
      }
    });
  }

  function positionMegaPanels() {
    var header = document.querySelector('.header');
    if (!header) return;
    var h = Math.ceil(header.getBoundingClientRect().height);
    document.querySelectorAll('.mega-panel').forEach(function (p) { p.style.top = h + 'px'; });
  }
});
