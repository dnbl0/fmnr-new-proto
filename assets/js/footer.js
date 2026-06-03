document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('footer')) return; // already present

  // add footer stylesheet
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/footer.css';
  document.head.appendChild(link);

  // fetch and insert footer
  fetch('/footer.html', {cache: 'no-cache'})
    .then(function (res) { if (!res.ok) throw new Error('Footer fetch failed'); return res.text(); })
    .then(function (html) {
      var div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div.firstElementChild);
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
