// assets/js/motion-init.js
//
// Scroll motion effects — mirrors Elementor's Motion Effects plugin:
//   Entrance:  fade, slide-up/down/left/right, zoom-in/out, stagger-fade, stagger-up
//   Scroll:    parallax, scroll-x, scroll-scale, scroll-rotate, scroll-blur, scroll-fade
//   Pin:       sticky-short
//
// Usage:
//   Explicit  — add data-mfx="<type>" to any element, tune with data-mfx-* attributes
//   Auto      — pages with no data-mfx get conservative auto-tagging of common blocks
//
// Just include:  <script src="/assets/js/motion-init.js" defer></script>
(function () {
  'use strict';

  var GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  var ST_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  var SELF     = document.currentScript;
  var ROOT     = (function () {
    var s = (SELF && SELF.src) || '';
    var i = s.indexOf('/assets/js/');
    return i >= 0 ? s.slice(0, i + 1) : '/';
  })();
  var CSS_URL = ROOT + 'assets/css/motion.css';

  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  function ensureCss() {
    if (document.querySelector('link[href*="motion.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    document.head.appendChild(link);
  }

  function loadScript(src, cb) {
    var existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') return cb();
      existing.addEventListener('load', cb);
      existing.addEventListener('error', cb);
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.addEventListener('load', function () { s.setAttribute('data-loaded', 'true'); cb(); });
    s.addEventListener('error', cb);
    document.head.appendChild(s);
  }

  function ensureGsap(cb) {
    if (window.gsap && window.ScrollTrigger) return cb();
    loadScript(GSAP_URL, function () {
      loadScript(ST_URL, cb);
    });
  }

  ready(function () {
    var REDUCED   = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile  = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var lowMemory = navigator.deviceMemory && navigator.deviceMemory < 2;

    document.body.classList.add('mfx-ready');
    ensureCss();

    if (REDUCED || lowMemory) return;

    ensureGsap(function () {
      if (!(window.gsap && window.ScrollTrigger)) return;
      run(isMobile);
    });
  });

  // ── Helpers ──────────────────────────────────────────────────────────────

  function attr(el, name, fallback) {
    var v = el.getAttribute(name);
    return v === null ? fallback : parseFloat(v);
  }

  // Compute ScrollTrigger start position from data-mfx-offset (legacy compat)
  // or data-mfx-start (explicit string). Default: element top at 88% viewport.
  function triggerStart(el, defaultPct) {
    var s = el.getAttribute('data-mfx-start');
    if (s) return s;
    var offset = el.getAttribute('data-mfx-offset');
    if (offset !== null) return 'top ' + Math.round((1 - parseFloat(offset)) * 100) + '%';
    return 'top ' + (defaultPct !== undefined ? defaultPct : 88) + '%';
  }

  // Initial hidden states for each entrance effect type.
  // gsap.set() these before ScrollTrigger runs so there is no visible-then-jump flash.
  var ENTRANCE_INIT = {
    'fade':        function (el) { return { opacity: 0, y: attr(el, 'data-mfx-y', 20) }; },
    'slide-up':    function (el) { return { opacity: 0, y: attr(el, 'data-mfx-y', 50) }; },
    'slide-down':  function (el) { return { opacity: 0, y: -attr(el, 'data-mfx-y', 50) }; },
    'slide-left':  function (el) { return { opacity: 0, x: attr(el, 'data-mfx-x', 60) }; },
    'slide-right': function (el) { return { opacity: 0, x: -attr(el, 'data-mfx-x', 60) }; },
    'zoom-in':     function (el) { return { opacity: 0, scale: attr(el, 'data-mfx-scale', 0.82) }; },
    'zoom-out':    function (el) { return { opacity: 0, scale: attr(el, 'data-mfx-scale', 1.18) }; },
  };

  var STAGGER_TYPES = { 'stagger-fade': true, 'stagger-up': true };

  // ── Main init ─────────────────────────────────────────────────────────────

  function run(isMobile) {
    gsap.registerPlugin(ScrollTrigger);

    if (!document.querySelector('[data-mfx]')) autoApply();

    var elements = Array.prototype.slice.call(document.querySelectorAll('[data-mfx]'));

    // Set initial hidden states immediately — prevents the "visible → snap-hidden → animate-in"
    // flash that happens because GSAP loads from CDN after the page has already painted.
    elements.forEach(function (el) {
      var type = el.getAttribute('data-mfx');
      var init = ENTRANCE_INIT[type];
      if (init) {
        gsap.set(el, init(el));
      } else if (STAGGER_TYPES[type]) {
        var kids = Array.prototype.slice.call(el.children || []);
        if (kids.length) gsap.set(kids, { opacity: 0, y: type === 'stagger-up' ? 40 : 18 });
      }
    });

    elements.forEach(function (el) { initElement(el, isMobile); });
  }

  function initElement(el, isMobile) {
    if (el.getAttribute('data-mfx-done') === 'true') return;
    var type = el.getAttribute('data-mfx');
    if (!type) return;
    el.setAttribute('data-mfx-done', 'true');

    var dur   = attr(el, 'data-mfx-duration', 0.72);
    var delay = attr(el, 'data-mfx-delay',    0);
    var ease  = el.getAttribute('data-mfx-ease') || 'power2.out';

    // ── Scroll-scrub effects (continuous, tied to scroll position) ──────────

    if (type === 'parallax' || type === 'parallax-img') {
      if (isMobile && el.getAttribute('data-mfx-disable-on-mobile') === 'true') return;
      gsap.to(el, {
        yPercent: attr(el, 'data-mfx-speed', -6),
        ease: 'none',
        overwrite: true,
        scrollTrigger: { trigger: el, scrub: true, start: 'top bottom', end: 'bottom top' }
      });
      return;
    }

    if (type === 'scroll-x') {
      var dist = attr(el, 'data-mfx-x', 80);
      gsap.fromTo(el,
        { x: -dist },
        { x: dist, ease: 'none', overwrite: true,
          scrollTrigger: { trigger: el, scrub: attr(el, 'data-mfx-scrub', 1), start: 'top bottom', end: 'bottom top' } }
      );
      return;
    }

    if (type === 'scroll-scale') {
      gsap.fromTo(el,
        { scale: attr(el, 'data-mfx-scale-from', 0.92) },
        { scale: attr(el, 'data-mfx-scale-to', 1.06), ease: 'none', overwrite: true,
          scrollTrigger: { trigger: el, scrub: attr(el, 'data-mfx-scrub', 1), start: 'top bottom', end: 'bottom top' } }
      );
      return;
    }

    if (type === 'scroll-rotate') {
      var deg = attr(el, 'data-mfx-deg', 12);
      gsap.fromTo(el,
        { rotation: -deg },
        { rotation: deg, ease: 'none', overwrite: true,
          scrollTrigger: { trigger: el, scrub: attr(el, 'data-mfx-scrub', 1), start: 'top bottom', end: 'bottom top' } }
      );
      return;
    }

    if (type === 'scroll-blur') {
      var maxBlur = attr(el, 'data-mfx-blur', 8);
      gsap.fromTo(el,
        { filter: 'blur(' + maxBlur + 'px)' },
        { filter: 'blur(0px)', ease: 'none', overwrite: true,
          scrollTrigger: { trigger: el, scrub: attr(el, 'data-mfx-scrub', 1), start: 'top 85%', end: 'center 60%' } }
      );
      return;
    }

    if (type === 'scroll-fade') {
      gsap.fromTo(el,
        { opacity: 0 },
        { opacity: 1, ease: 'none', overwrite: true,
          scrollTrigger: { trigger: el, scrub: attr(el, 'data-mfx-scrub', 1), start: 'top 85%', end: 'center 60%' } }
      );
      return;
    }

    if (type === 'sticky-short') {
      ScrollTrigger.create({ trigger: el, start: 'top top', end: '+=100%', pin: true });
      return;
    }

    // ── Entrance effects (fire once, no reverse jolt) ────────────────────────

    var stConfig = { trigger: el, start: triggerStart(el), once: true };

    if (ENTRANCE_TYPES_SET[type]) {
      // Animate TO natural state — initial was already set by gsap.set() above
      var toProps = { opacity: 1, duration: dur, delay: delay, ease: ease, overwrite: true, scrollTrigger: stConfig };
      var init = ENTRANCE_INIT[type](el);
      if (init.y !== undefined) toProps.y = 0;
      if (init.x !== undefined) toProps.x = 0;
      if (init.scale !== undefined) toProps.scale = 1;
      gsap.to(el, toProps);
      return;
    }

    if (type === 'stagger-fade' || type === 'stagger-up') {
      var kids = Array.prototype.slice.call(el.children || []);
      if (!kids.length) return;
      gsap.to(kids, {
        opacity: 1, y: 0, x: 0, scale: 1,
        duration: dur,
        stagger: attr(el, 'data-mfx-stagger', type === 'stagger-up' ? 0.1 : 0.08),
        delay: delay,
        ease: ease,
        overwrite: true,
        scrollTrigger: stConfig
      });
      return;
    }
  }

  // Lookup set for entrance types (avoids repeated Object.keys checks)
  var ENTRANCE_TYPES_SET = (function () {
    var s = {};
    Object.keys(ENTRANCE_INIT).forEach(function (k) { s[k] = true; });
    return s;
  })();

  // ── Auto-apply ─────────────────────────────────────────────────────────────
  // Applied only when the page has zero explicit data-mfx attributes.
  // Uses precise class names (not broad substrings like [class*="grid"]) to
  // avoid tagging interactive components, nested structures, or decorative layers.
  function autoApply() {
    var STAGGER = [
      '.stats-grid', '.stat-grid',
      '.card-grid', '.cards-grid', '.cards-row',
      '.feature-grid', '.team-grid', '.partner-grid', '.logo-grid',
      '.doc-grid', '.related-grid', '.resource-grid',
      '.bar-graph-list', '.tl-list'
    ];
    var FADE = [
      '.hero-content', '.hero-inner', '.hero-text',
      '.hero-label', '.hero-h1', '.hero-subtitle', '.hero-buttons',
      '.banner-overline', '.banner-heading', '.btn-group',
      '.section-heading-wrap', '.section-header', '.section-heading',
      '.blog-section-header', '.tl-intro', '.intro-text',
      '.page-header', '.page-hero', '.content-intro'
    ];

    var EXCLUDE    = 'header, .header, nav, .mega-panel, footer, #footer, .filter-bar-section';
    var SKIP_WORDS = /(overlay|-bg\b|backdrop|video-bg|parallax)/;

    function canTag(el) {
      if (el.closest(EXCLUDE)) return false;
      if (el.closest('[data-mfx]')) return false;
      if (el.querySelector('[data-mfx]')) return false;
      return true;
    }

    function tag(selectors, type, needChildren) {
      selectors.forEach(function (sel) {
        var nodes;
        try { nodes = document.querySelectorAll(sel); } catch (e) { return; }
        Array.prototype.forEach.call(nodes, function (el) {
          if (needChildren && el.children.length < 2) return;
          if (SKIP_WORDS.test(el.className || '')) return;
          if (!canTag(el)) return;
          el.setAttribute('data-mfx', type);
        });
      });
    }

    tag(STAGGER, 'stagger-fade', true);
    tag(FADE, 'fade', false);
  }

  // ── Count-up ──────────────────────────────────────────────────────────────
  // Targets any element with class .count-num and data-to="<number>".
  // Optional data-decimals="1" for values like 2.5.
  // Fires once when the element reaches 40% visibility; respects reduced motion.

  function initCountUp() {
    if (REDUCED) return;
    var nums = Array.prototype.slice.call(document.querySelectorAll('.count-num[data-to]'));
    if (!nums.length || !window.IntersectionObserver) return;

    var seen = new WeakSet();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        observer.unobserve(entry.target);
        animateCountEl(entry.target);
      });
    }, { threshold: 0.4 });

    nums.forEach(function (el) {
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      el.textContent = decimals > 0 ? (0).toFixed(decimals) : '0';
      observer.observe(el);
    });
  }

  function animateCountEl(el) {
    var target   = parseFloat(el.getAttribute('data-to'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var duration = 1800;
    var start    = null;
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    (function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var val = easeOut(progress) * target;
      el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val);
      if (progress < 1) requestAnimationFrame(step);
    })(performance.now());
  }

  ready(initCountUp);
})();
