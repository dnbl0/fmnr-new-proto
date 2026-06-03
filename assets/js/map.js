// Interactive FMNR impact map — vector choropleth styled after the
// InteractiveGeoMaps / MapGeo WordPress plugin (flat shaded country
// polygons, white borders, hover highlight, cursor tooltip, click popup).
document.addEventListener('DOMContentLoaded', function () {
  const mapEl = document.getElementById('map');
  if (!mapEl || typeof L === 'undefined') return;

  // --- Impact data, keyed by ISO 3166-1 alpha-3 (matches GeoJSON feature.id) ---
  // tier: 'established' | 'active' | 'emerging'
  // flag: emoji shown in the card swatch · hectares: restored-land headline
  // pct: progress-bar fill (0–100) · pctLabel: caption beneath the bar
  const IMPACT = {
    NER: { tier: 'established', title: 'Niger', flag: '🇳🇪', hectares: '5.0M hectares', pct: 82, pctLabel: '82% of degraded land restored' },
    ETH: { tier: 'established', title: 'Ethiopia', flag: '🇪🇹', hectares: '1.2M hectares', pct: 60, pctLabel: '60% of degraded land restored' },
    BFA: { tier: 'established', title: 'Burkina Faso', flag: '🇧🇫', hectares: '0.3M hectares', pct: 40, pctLabel: '40% of degraded land restored' },
    MLI: { tier: 'established', title: 'Mali', flag: '🇲🇱', hectares: '0.5M hectares', pct: 45, pctLabel: '45% of degraded land restored' },
    SEN: { tier: 'established', title: 'Senegal', flag: '🇸🇳', hectares: '0.4M hectares', pct: 42, pctLabel: '42% of degraded land restored' },
    GHA: { tier: 'established', title: 'Ghana', flag: '🇬🇭', hectares: '0.6M hectares', pct: 48, pctLabel: '48% of degraded land restored' },
    KEN: { tier: 'established', title: 'Kenya', flag: '🇰🇪', hectares: '0.8M hectares', pct: 55, pctLabel: '55% of degraded land restored' },
    TZA: { tier: 'established', title: 'Tanzania', flag: '🇹🇿', hectares: '0.7M hectares', pct: 50, pctLabel: '50% of degraded land restored' },
    UGA: { tier: 'established', title: 'Uganda', flag: '🇺🇬', hectares: '0.5M hectares', pct: 46, pctLabel: '46% of degraded land restored' },
    TCD: { tier: 'active', title: 'Chad', flag: '🇹🇩', hectares: '0.2M hectares', pct: 30, pctLabel: '30% of degraded land restored' },
    SOM: { tier: 'active', title: 'Somalia', flag: '🇸🇴', hectares: '0.15M hectares', pct: 25, pctLabel: '25% of degraded land restored' },
    MWI: { tier: 'active', title: 'Malawi', flag: '🇲🇼', hectares: '0.3M hectares', pct: 35, pctLabel: '35% of degraded land restored' },
    RWA: { tier: 'active', title: 'Rwanda', flag: '🇷🇼', hectares: '0.2M hectares', pct: 32, pctLabel: '32% of degraded land restored' },
    ZWE: { tier: 'active', title: 'Zimbabwe', flag: '🇿🇼', hectares: '0.25M hectares', pct: 33, pctLabel: '33% of degraded land restored' },
    AUS: { tier: 'active', title: 'Australia', flag: '🇦🇺', hectares: '0.1M hectares', pct: 20, pctLabel: '20% of degraded land restored' },
    IDN: { tier: 'emerging', title: 'Indonesia', flag: '🇮🇩', hectares: '0.05M hectares', pct: 15, pctLabel: '15% of degraded land restored' },
    TLS: { tier: 'emerging', title: 'Timor-Leste', flag: '🇹🇱', hectares: '0.03M hectares', pct: 12, pctLabel: '12% of degraded land restored' }
  };

  const TIER_COLOR = {
    established: '#1f7a5a',
    active: '#2da57f',
    emerging: '#7fd1b3'
  };
  const BASE_FILL = '#e4e8ea';   // non-impact countries
  const BORDER = '#ffffff';
  const HOVER_FILL = '#14241d';  // dark highlight on hover (impact only)

  const map = L.map('map', {
    scrollWheelZoom: false,
    zoomControl: false,
    attributionControl: true,
    minZoom: 1,
    worldCopyJump: true
  }).setView([12, 18], 3);

  map.attributionControl.setPrefix('');

  function tierOf(feature) {
    const rec = IMPACT[feature.id];
    return rec ? rec.tier : null;
  }

  function baseStyle(feature) {
    const tier = tierOf(feature);
    return {
      fillColor: tier ? TIER_COLOR[tier] : BASE_FILL,
      fillOpacity: 1,
      color: BORDER,
      weight: 0.7,
      opacity: 1
    };
  }

  let geoLayer;
  const DEFAULT_VIEW = { center: [12, 18], zoom: 3 };

  function highlight(layer) {
    const rec = IMPACT[layer.feature.id];
    if (!rec) {
      layer.setStyle({ fillColor: '#cfd6d9', weight: 1 });
      return;
    }
    layer.setStyle({ fillColor: HOVER_FILL, weight: 1.2 });
    if (layer.bringToFront) layer.bringToFront();
  }

  function reset(layer) {
    if (geoLayer) geoLayer.resetStyle(layer);
  }

  function onEachFeature(feature, layer) {
    const rec = IMPACT[feature.id];
    const name = (feature.properties && feature.properties.name) || feature.id;

    // Cursor-following tooltip
    const tipHtml = rec
      ? `<span class="map-tip-name">${rec.title}</span><span class="map-tip-hint">Click to view story</span>`
      : `<span class="map-tip-name">${name}</span>`;
    layer.bindTooltip(tipHtml, {
      sticky: true,
      direction: 'top',
      className: 'map-tip',
      opacity: 1,
      offset: [0, -4]
    });

    if (rec) {
      // Country card component (Figma node 282:37768)
      const popHtml =
        `<div class="country-card">` +
          `<div class="cc-flag-row">` +
            `<div class="cc-flag" aria-hidden="true">${rec.flag || ''}</div>` +
            `<h3 class="cc-name">${rec.title}</h3>` +
          `</div>` +
          `<div class="cc-bar-row">` +
            `<p class="cc-hectares">${rec.hectares}</p>` +
            `<div class="cc-bar"><div class="cc-bar-fill" style="width:${rec.pct}%"></div></div>` +
            `<p class="cc-pct">${rec.pctLabel}</p>` +
          `</div>` +
          `<a class="cc-link" href="#">View country page` +
            `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a>` +
        `</div>`;
      layer.bindPopup(popHtml, { closeButton: true, maxWidth: 340, autoPan: true });
    }

    layer.on({
      mouseover: function () { highlight(layer); },
      mouseout: function () { reset(layer); },
      click: function () {
        if (rec) {
          map.fitBounds(layer.getBounds(), { padding: [40, 40], maxZoom: 5 });
          layer.openPopup();
        }
      }
    });
  }

  // World countries GeoJSON (feature.id = ISO alpha-3)
  fetch('https://cdn.jsdelivr.net/gh/johan/world.geo.json@master/countries.geo.json')
    .then(function (r) { return r.json(); })
    .then(function (geojson) {
      geoLayer = L.geoJSON(geojson, {
        style: baseStyle,
        onEachFeature: onEachFeature
      }).addTo(map);

      // Frame the impact region (Africa + reach into Asia/Oceania)
      map.fitBounds([[-38, -20], [38, 60]]);
      const fitted = map.getZoom();
      DEFAULT_VIEW.center = map.getCenter();
      DEFAULT_VIEW.zoom = fitted;
    })
    .catch(function () {
      mapEl.innerHTML =
        '<div class="map-placeholder-text">Map could not be loaded. Please try again later.</div>';
    });

  // Custom zoom / reset controls
  document.querySelectorAll('.map-ctrl-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const action = btn.getAttribute('data-map-zoom');
      if (action === 'in') map.zoomIn();
      else if (action === 'out') map.zoomOut();
      else map.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom);
    });
  });

  // Render correctly once visible / on resize
  setTimeout(function () { map.invalidateSize(); }, 250);
  window.addEventListener('resize', function () { map.invalidateSize(); });
});
