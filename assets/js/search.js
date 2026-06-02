(function(){
  'use strict';

  function ready(fn){
    if(document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function(){
    var toggle = document.getElementById('search-toggle');
    var overlay = document.getElementById('search-overlay');
    var form = document.getElementById('search-form');
    var input = document.getElementById('search-input');
    var clearBtn = document.getElementById('search-clear');

    if(!toggle || !overlay || !form || !input) return;

    function openOverlay(){
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden','false');
      toggle.setAttribute('aria-expanded','true');
      // prevent background scroll
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      // small delay to ensure visible before focus
      setTimeout(function(){ input.focus(); input.select(); }, 50);
    }

    function closeOverlay(){
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden','true');
      toggle.setAttribute('aria-expanded','false');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      toggle.focus();
    }

    toggle.addEventListener('click', function(e){
      var isOpen = overlay.classList.contains('open');
      if(isOpen) closeOverlay(); else openOverlay();
    });

    // click outside inner closes
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) closeOverlay();
    });

    // clear input
    if(clearBtn){
      clearBtn.addEventListener('click', function(){
        input.value = '';
        input.focus();
      });
    }

    // keyboard shortcuts
    document.addEventListener('keydown', function(e){
      // Cmd/Ctrl+K
      if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'){
        e.preventDefault();
        if(overlay.classList.contains('open')){ input.focus(); } else { openOverlay(); }
      }

      if(e.key === 'Escape'){
        if(overlay.classList.contains('open')){ closeOverlay(); }
      }
    });

    // allow form to submit normally (GET to resource-hub.html)
    form.addEventListener('submit', function(){
      // close overlay shortly after submit to avoid visible flash
      setTimeout(function(){ closeOverlay(); }, 300);
    });
  });
})();
