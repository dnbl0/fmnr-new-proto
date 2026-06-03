// Capture this script's own URL while document.currentScript is still valid, so
// we can derive the site root (works from a domain root or a GitHub Pages subpath).
var SELF = document.currentScript;
function siteRoot() {
  var s = (SELF && SELF.src) || '';
  var i = s.indexOf('/assets/js/');
  return i >= 0 ? s.slice(0, i + 1) : '/';
}
function absolutise(el, root) {
  ['href', 'src'].forEach(function (attr) {
    el.querySelectorAll('[' + attr + '^="/"]').forEach(function (node) {
      var v = node.getAttribute(attr);
      if (v.charAt(1) !== '/') node.setAttribute(attr, root + v.slice(1)); // skip protocol-relative //
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('footer')) return; // already present

  var root = siteRoot();

  // add footer stylesheet
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = root + 'assets/css/footer.css';
  document.head.appendChild(link);

  // fetch and insert footer
  fetch(root + 'footer.html', {cache: 'no-cache'})
    .then(function (res) { if (!res.ok) throw new Error('Footer fetch failed'); return res.text(); })
    .then(function (html) {
      var div = document.createElement('div');
      div.innerHTML = html;
      var footer = div.firstElementChild;
      absolutise(footer, root);
      document.body.appendChild(footer);
    })
    .catch(function (err) {
      // graceful fallback: append minimal footer node
      var fallback = document.createElement('footer');
      fallback.id = 'footer';
      fallback.className = 'footer-fallback';
      fallback.innerHTML = '<div class="footer-inner"><p>FMNR — World Vision Australia</p></div>';
      document.body.appendChild(fallback);
      console.warn('Could not load footer:', err);
    });
});
