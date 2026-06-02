// assets/js/motion-init.js
(function(){
  'use strict';

  function ready(fn){
    if(document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    // Conservative defaults
    var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    var lowMemory = navigator.deviceMemory && navigator.deviceMemory < 2;

    // Add ready flag so CSS can toggle will-change safely
    document.body.classList.add('mfx-ready');

    if(REDUCED || lowMemory){
      // Skip heavy effects entirely
      return;
    }

    // Ensure GSAP is available
    if(!(window.gsap && window.ScrollTrigger)){
      // If GSAP not loaded, skip silently
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var observerOptions = { root: null, rootMargin: '0px 0px 200px 0px', threshold: 0 };

    function parseFloatAttr(el, name, fallback){
      var v = el.getAttribute(name);
      return v === null ? fallback : parseFloat(v);
    }

    function setupParallax(el){
      var speed = parseFloatAttr(el,'data-mfx-speed', -6);
      // If mobile disabled on element
      if(isMobile && el.getAttribute('data-mfx-disable-on-mobile')==='true') return;
      gsap.to(el, {
        yPercent: speed,
        ease: 'none',
        overwrite: true,
        scrollTrigger: {
          trigger: el,
          scrub: true,
          start: 'top bottom',
          end: 'bottom top'
        }
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
      var type = el.getAttribute('data-mfx');
      if(!type) return;
      if(type === 'parallax') setupParallax(el);
      else if(type === 'parallax-img') setupParallax(el);
      else if(type === 'fade') setupFade(el);
      else if(type === 'stagger-fade') setupStaggerFade(el);
      else if(type === 'sticky-short'){
        ScrollTrigger.create({ trigger: el, start: 'top top', end: '+=100%', pin: true });
      }
    }

    var elements = Array.prototype.slice.call(document.querySelectorAll('[data-mfx]'));

    // Lazy-init using IntersectionObserver
    if('IntersectionObserver' in window){
      var obs = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            var el = entry.target;
            // Defer setup to idle time where possible
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
      // Fallback: init all immediately
      elements.forEach(function(el){ initElement(el); });
    }
  });
})();
