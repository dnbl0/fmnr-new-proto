/* ===========================================================================
   Faceted filter — multi-select checkbox dropdowns with dismissible chips
   and a clear-all control. Shared by blog.html and resource-hub.html.

   Markup contract (per page):
     .filter-dropdown[data-facet]          one per facet
       .filter-dropdown-toggle             button, toggles the panel
         .filter-dropdown-label            static label text ("Topic")
         .filter-dropdown-chevron
       .filter-dropdown-panel              checkbox list
         .filter-check > input[type=checkbox][value] + .filter-check-box + .filter-check-text
     #filterChips                          chip container (filled by JS)
     #filterClearAll                       clear-all button
     #filterResultCount                    live result count (data-noun/-plural)
     #filterEmpty                          shown when nothing matches
   Cards: .blog-section[data-filterable] .blog-card with data-<facet> attrs.
   Reflow mode (blog): #filterResults + #resultsGrid present -> matched cards
   are cloned into a single right-sized grid. Otherwise cards are shown/hidden
   in place (resource-hub).

   Within a facet selections are OR'd; across facets they are AND'd.
   =========================================================================== */
(function () {
  const dropdowns = [...document.querySelectorAll('.filter-dropdown')];
  if (!dropdowns.length) return;

  const cards = [...document.querySelectorAll('.blog-section[data-filterable] .blog-card')];
  const sections = [...document.querySelectorAll('.blog-section[data-filterable]')];
  const empty = document.getElementById('filterEmpty');
  const resultCount = document.getElementById('filterResultCount');
  const chipsWrap = document.getElementById('filterChips');
  const clearAllBtn = document.getElementById('filterClearAll');
  const resultsSection = document.getElementById('filterResults');
  const resultsGrid = document.getElementById('resultsGrid');
  const reflow = !!(resultsSection && resultsGrid);
  const MAX_COLS = 4;

  const noun = resultCount ? (resultCount.dataset.noun || 'Result') : 'Result';
  const nounPlural = resultCount ? (resultCount.dataset.nounPlural || noun + 's') : 'Results';

  const facets = dropdowns.map(dd => ({
    el: dd,
    facet: dd.dataset.facet,
    toggle: dd.querySelector('.filter-dropdown-toggle'),
    labelEl: dd.querySelector('.filter-dropdown-label'),
    checks: [...dd.querySelectorAll('input[type="checkbox"]')]
  }));

  function selected(f) {
    return f.checks.filter(c => c.checked);
  }

  // Max columns the viewport can comfortably fit (mirrors the CSS breakpoints).
  function colCap() {
    const w = window.innerWidth;
    if (w <= 600) return 1;
    if (w <= 980) return 2;
    return MAX_COLS;
  }

  function matches(card) {
    return facets.every(f => {
      const sel = selected(f);
      if (!sel.length) return true;
      const tokens = (card.dataset[f.facet] || '').split(/\s+/).filter(Boolean);
      return sel.some(c => tokens.includes(c.value));
    });
  }

  function labelFor(check) {
    const text = check.parentElement.querySelector('.filter-check-text');
    return text ? text.textContent.trim() : check.value;
  }

  // Reflect each dropdown's selection count in its toggle, as a small badge.
  function updateToggles() {
    facets.forEach(f => {
      if (!f.labelEl) return;
      const n = selected(f).length;
      let badge = f.toggle.querySelector('.filter-dropdown-count');
      if (n > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'filter-dropdown-count';
          f.labelEl.after(badge);
        }
        badge.textContent = n;
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function renderChips() {
    if (!chipsWrap) return;
    chipsWrap.innerHTML = '';
    let active = false;
    facets.forEach(f => {
      selected(f).forEach(check => {
        active = true;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'filter-chip';
        chip.dataset.facet = f.facet;
        chip.dataset.value = check.value;
        chip.setAttribute('aria-label', 'Remove filter ' + labelFor(check));
        chip.innerHTML = '<span>' + labelFor(check) +
          '</span><span class="filter-chip-x" aria-hidden="true">×</span>';
        chip.addEventListener('click', () => {
          check.checked = false;
          apply();
        });
        chipsWrap.appendChild(chip);
      });
    });
    if (clearAllBtn) clearAllBtn.hidden = !active;
  }

  function apply() {
    const filtering = facets.some(f => selected(f).length > 0);
    const matched = cards.filter(matches);
    const shown = matched.length;

    if (reflow) {
      if (filtering) {
        // Reflow matched cards into one grid sized to the result count.
        sections.forEach(sec => { sec.style.display = 'none'; });
        resultsGrid.innerHTML = '';
        matched.forEach(card => {
          const clone = card.cloneNode(true);
          clone.style.display = '';
          resultsGrid.appendChild(clone);
        });
        const maxCols = colCap();
        const cols = Math.min(shown, maxCols);
        resultsGrid.style.gridTemplateColumns =
          cols ? 'repeat(' + cols + ', minmax(0, 1fr))' : '';
        resultsGrid.style.maxWidth = (cols && maxCols > 1) ? (cols * 320) + 'px' : '';
        resultsSection.style.display = shown ? '' : 'none';
      } else {
        // No active filter — restore the curated multi-section layout.
        resultsSection.style.display = 'none';
        resultsGrid.innerHTML = '';
        cards.forEach(card => { card.style.display = ''; });
        sections.forEach(sec => { sec.style.display = ''; });
      }
    } else {
      // Inline show/hide; collapse any section left with no visible cards.
      cards.forEach(card => { card.style.display = matches(card) ? '' : 'none'; });
      sections.forEach(sec => {
        const visible = [...sec.querySelectorAll('.blog-card')]
          .some(c => c.style.display !== 'none');
        sec.style.display = visible ? '' : 'none';
      });
    }

    if (empty) empty.style.display = shown ? 'none' : 'block';
    if (resultCount) resultCount.textContent = shown + ' ' + (shown === 1 ? noun : nounPlural);
    updateToggles();
    renderChips();
  }

  // ── Dropdown open/close ──────────────────────────────────────────────────
  function closeAll(except) {
    facets.forEach(f => {
      if (f.el === except) return;
      f.el.classList.remove('open');
      f.toggle.setAttribute('aria-expanded', 'false');
      const panel = f.el.querySelector('.filter-dropdown-panel');
      if (panel) panel.hidden = true;
    });
  }

  facets.forEach(f => {
    const panel = f.el.querySelector('.filter-dropdown-panel');
    f.toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !f.el.classList.contains('open');
      closeAll(willOpen ? f.el : null);
      f.el.classList.toggle('open', willOpen);
      f.toggle.setAttribute('aria-expanded', String(willOpen));
      if (panel) panel.hidden = !willOpen;
    });
    f.checks.forEach(c => c.addEventListener('change', apply));
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown')) closeAll(null);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll(null);
  });

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      facets.forEach(f => f.checks.forEach(c => { c.checked = false; }));
      apply();
    });
  }

  window.addEventListener('resize', apply);
  apply();
})();
