// assets/js/motion-init.js
//
// Site-wide scroll motion effects (mirrors the system used on index.html).
//
// Two ways an element gets animated:
//   1. Explicit  — author adds data-mfx="fade|stagger-fade|parallax|sticky-short"
//                  (plus optional data-mfx-* tuning). index.html uses this.
//   2. Auto      — on pages that carry NO explicit data-mfx, a conservative set
//                  of common design-system blocks (heroes, section headings,
//                  card grids) is tagged automatically so every page gets the
//                  same tasteful reveal without hand-annotation.
//
// The script self-bootstraps its dependencies: it injects motion.css and the
// GSAP + ScrollTrigger CDN bundles if they are not already present. So a page
// only needs:  <script src="/assets/js/motion-init.js" defer></script>
(function(){
  'use strict';

  var GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
  var ST_URL   = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
  // Derive the site root from this script's own URL so the CSS resolves whether
  // served from a domain root (localhost) or a subpath (GitHub Pages project site).
  var SELF     = document.currentScript;
  var ROOT     = (function () {
    var s = (SELF && SELF.src) || '';
    var i = s.indexOf('/assets/js/');
    return i >= 0 ? s.slice(0, i + 1) : '/';
  })();
  var CSS_URL  = ROOT + 'assets/css/motion.css';

  function ready(fn){
    if(document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  // Inject a <link rel=stylesheet> once.
  function ensureCss(){
    if(document.querySelector('link[href*="motion.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CSS_URL;
    document.head.appendChild(link);
  }

  // Load a script once, then call back. Reuses an in-flight/loaded tag.
  function loadScript(src, cb){
    var existing = document.querySelector('script[src="' + src + '"]');
    if(existing){
      if(existing.getAttribute('data-loaded') === 'true') return cb();
      existing.addEventListener('load', cb);
      existing.addEventListener('error', cb);
      return;
    }
    var s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.addEventListener('load', function(){ s.setAttribute('data-loaded','true'); cb(); });
    s.addEventListener('error', function(){ cb(); });
    document.head.appendChild(s);
  }

  // Ensure GSAP + ScrollTrigger exist, then run cb.
  function ensureGsap(cb){
    if(window.gsap && window.ScrollTrigger) return cb();
    loadScript(GSAP_URL, function(){
      loadScript(ST_URL, function(){ cb(); });
    });
  }

  ready(function(){
    var REDUCED  = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var lowMemory = navigator.deviceMemory && navigator.deviceMemory < 2;

    document.body.classList.add('mfx-ready');
    ensureCss();

    // Respect reduced-motion / very low-memory devices: leave content static.
    if(REDUCED || lowMemory) return;

    ensureGsap(function(){
      if(!(window.gsap && window.ScrollTrigger)) return; // CDN blocked — fail silent
      run(isMobile);
    });
  });

  function run(isMobile){
    gsap.registerPlugin(ScrollTrigger);

    // ── Auto-apply: only when the page has not been hand-annotated ──────────
    // Keeps curated pages (index.html) untouched while giving every other page
    // a consistent reveal. Container-level targeting keeps it tasteful and cheap.
    if(!document.querySelector('[data-mfx]')){
      autoApply();
    }

    var observerOptions = { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 };

    function parseFloatAttr(el, name, fallback){
      var v = el.getAttribute(name);
      return v === null ? fallback : parseFloat(v);
    }

    function setupParallax(el){
      var speed = parseFloatAttr(el,'data-mfx-speed', -6);
      if(isMobile && el.getAttribute('data-mfx-disable-on-mobile')==='true') return;
      gsap.to(el, {
        yPercent: speed,
        ease: 'none',
        overwrite: true,
        scrollTrigger: { trigger: el, scrub: true, start: 'top bottom', end: 'bottom top' }
      });
    }

    function setupFade(el){
      var dur = parseFloatAttr(el,'data-mfx-duration', 0.65);
      var y = parseFloatAttr(el,'data-mfx-y', 12);
      var startOffset = parseFloatAttr(el,'data-mfx-offset', 0.12);
      var start = 'top ' + Math.round((1 - startOffset) * 100) + '%';
      gsap.from(el, {
        opacity: 0,
        y: y,
        duration: dur,
        ease: 'power2.out',
        overwrite: true,
        scrollTrigger: { trigger: el, start: start, toggleActions: 'play none none reverse' }
      });
    }

    function setupStaggerFade(el){
      var dur = parseFloatAttr(el,'data-mfx-duration', 0.65);
      var stagger = parseFloatAttr(el,'data-mfx-stagger', 0.08);
      var children = Array.prototype.slice.call(el.children || []);
      if(children.length === 0) return;
      gsap.from(children, {
        opacity: 0,
        y: 12,
        duration: dur,
        stagger: stagger,
        ease: 'power2.out',
        overwrite: true,
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    }

    function initElement(el){
      if(el.getAttribute('data-mfx-done') === 'true') return;
      var type = el.getAttribute('data-mfx');
      if(!type) return;
      el.setAttribute('data-mfx-done','true');
      if(type === 'parallax' || type === 'parallax-img') setupParallax(el);
      else if(type === 'fade') setupFade(el);
      else if(type === 'stagger-fade') setupStaggerFade(el);
      else if(type === 'sticky-short'){
        ScrollTrigger.create({ trigger: el, start: 'top top', end: '+=100%', pin: true });
      }
    }

    var elements = Array.prototype.slice.call(document.querySelectorAll('[data-mfx]'));

    if('IntersectionObserver' in window){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var el = entry.target;
            if('requestIdleCallback' in window){
              requestIdleCallback(function(){ initElement(el); });
            } else {
              setTimeout(function(){ initElement(el); }, 60);
            }
            obs.unobserve(el);
          }
        });
      }, observerOptions);
      elements.forEach(function(el){ obs.observe(el); });
    } else {
      elements.forEach(function(el){ initElement(el); });
    }
  }

  // ── Auto-apply rules ──────────────────────────────────────────────────────
  // Tag common design-system blocks using broad substring/structural selectors
  // so the effect lands across the site's varied class vocabularies
  // (card-grid, stat-grid, doc-grid, related-grid, *-hero-content, …).
  //
  // Two anti-nesting guards keep triggers from stacking:
  //   • skip if an ancestor is already tagged   (el.closest)
  //   • skip if a descendant is already tagged   (el.querySelector)
  // Chrome / interactive regions are excluded outright.
  function autoApply(){
    // Grids / card rows → children reveal in sequence.
    var STAGGER = [
      '[class*="grid"]', '[class*="cards"]', '.cards',
      '.bar-graph-list', '.tl-list', '.carousel-slide'
    ];
    // Hero copy + section heading clusters + side-by-side blocks → block reveal.
    var FADE = [
      '[class*="hero-content"]', '[class*="hero-inner"]', '[class*="hero-text"]',
      '[class*="hero"][class*="left"]', '[class*="hero"][class*="right"]',
      '.hero-label', '.hero-h1', '.hero-subtitle', '.hero-buttons',
      '.banner-overline', '.banner-heading', '.btn-group',
      '[class*="heading-wrap"]', '[class*="section-header"]', '[class*="section-h"]',
      '.section-heading', '.blog-section-header',
      '[class*="intro"]', '.tl-intro'
    ];

    // Never animate chrome or hidden/interactive regions.
    var EXCLUDE = 'header, .header, nav, .mega-panel, footer, #footer, .filter-bar-section';
    // Never fade purely-decorative layers.
    var SKIP_CLASS = /(overlay|-bg\b|backdrop)/;

    function canTag(el){
      if(el.closest(EXCLUDE)) return false;
      if(el.closest('[data-mfx]')) return false;      // ancestor already tagged
      if(el.querySelector('[data-mfx]')) return false; // descendant already tagged
      return true;
    }

    function tag(selectors, type, needChildren){
      selectors.forEach(function(sel){
        var nodes;
        try { nodes = document.querySelectorAll(sel); }
        catch(e){ return; } // ignore any selector a browser rejects
        Array.prototype.forEach.call(nodes, function(el){
          if(needChildren && el.children.length < 2) return;
          if(SKIP_CLASS.test(el.className || '')) return;
          if(!canTag(el)) return;
          el.setAttribute('data-mfx', type);
        });
      });
    }

    // Grids first so an enclosing heading/intro block can't swallow them.
    tag(STAGGER, 'stagger-fade', true);
    tag(FADE, 'fade', false);
  }
})();
