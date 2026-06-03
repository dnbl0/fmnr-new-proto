/* ============================================================================
 * Site accessibility enhancements
 * ----------------------------------------------------------------------------
 * 1. Mega menu keyboard / assistive-tech support.
 * 2. Defensive text-shadow for hero text over background imagery.
 * Both are progressive enhancements layered on top of the existing CSS/markup.
 * ========================================================================== */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* --------------------------------------------------------------------------
   * 1. MEGA MENU
   * The per-page inline script drives the panels with the MOUSE by setting
   * `panel.style.display` inline. That inline display:none beats the CSS rule
   *     .mega-item:focus-within .mega-panel { display: block; }
   * so after any hover a keyboard / screen-reader user can no longer open the
   * submenu, the panels expose no ARIA state, and Escape does nothing.
   *
   * This adds the keyboard behaviour on top of the mouse logic. It only reacts
   * to focus + keydown and only clears the inline `display` it set itself, so
   * it coexists with the hover script.
   * ------------------------------------------------------------------------ */
  function initMegaMenu() {
    var items = document.querySelectorAll('.mega-item');
    if (!items.length) return;

    items.forEach(function (item) {
      var panel = item.querySelector('.mega-panel');
      var trigger = item.querySelector('.nav-link');
      if (!panel || !trigger) return;

      // Announce the submenu to assistive tech.
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');

      // Set right after Escape so the focus it returns to the trigger does not
      // immediately re-open the panel via the focusin handler below.
      var suppressOpen = false;

      function open() {
        // Close any sibling panels the hover script may have left open.
        items.forEach(function (other) {
          if (other === item) return;
          var p = other.querySelector('.mega-panel');
          var t = other.querySelector('.nav-link');
          if (p) p.style.display = 'none';
          if (t) t.setAttribute('aria-expanded', 'false');
        });
        // Drop the inline display so the CSS `:focus-within` rule can show it.
        panel.style.display = '';
        trigger.setAttribute('aria-expanded', 'true');
      }

      function close() {
        panel.style.display = 'none';
        trigger.setAttribute('aria-expanded', 'false');
      }

      // Keyboard focus entering the item opens the panel.
      item.addEventListener('focusin', function () {
        if (suppressOpen) { suppressOpen = false; return; }
        open();
      });

      // Focus leaving the item (to anywhere outside it) closes the panel.
      item.addEventListener('focusout', function (e) {
        if (!item.contains(e.relatedTarget)) close();
      });

      // Escape closes the panel and returns focus to the trigger link.
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') {
          suppressOpen = true;
          close();
          trigger.focus();
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
   * 2. HERO TEXT LEGIBILITY
   * The strengthened gradient scrims handle most contrast, but the small hero
   * label sits higher in the text block where the scrim is lighter. A subtle
   * text-shadow guarantees legibility over bright background frames without
   * darkening the imagery further.
   * ------------------------------------------------------------------------ */
  function initHeroTextShadow() {
    var css =
      '.banner-overline,.banner-heading,' +
      '.hero-label,.hero-h1,.hero-subtitle,' +
      '.post-hero-title,.post-hero-inner p,.post-hero-inner span,' +
      '.adopt-hero-label,.adopt-hero-title,.adopt-hero-sub{' +
      'text-shadow:0 1px 3px rgba(0,0,0,0.55),0 0 14px rgba(0,0,0,0.30);}';
    var style = document.createElement('style');
    style.setAttribute('data-a11y', 'hero-text');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  ready(function () {
    initMegaMenu();
    initHeroTextShadow();
  });
})();
