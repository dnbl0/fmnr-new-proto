// Map initialization moved from inline in index.html
document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('map')) return;

  // zoomed out by 1 level (was 3 -> now 2)
  const map = L.map('map', { scrollWheelZoom: false }).setView([6, 20], 2);

  // Use CartoDB Positron tiles (labels in English, clean basemap)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map);

  const locations = [
    { coords: [-25.2744, 133.7751], title: 'Australia', text: 'From Barren to Bountiful: An Australian Farmer\'s Journey' },
    { coords: [9.145, 40.4897], title: 'Ethiopia', text: 'Communities Rebuilding Forests and Livelihoods' },
    { coords: [12.2383, -1.5616], title: 'Burkina Faso', text: 'Planting Hope in the Heart of the Sahel' },
    { coords: [17.5707, -3.9962], title: 'Mali', text: 'How Ancient Wisdom Is Healing Modern Land' },
    { coords: [-0.7893, 113.9213], title: 'Indonesia', text: 'FMNR Takes Root in Southeast Asia' }
  ];

  const markerGroup = L.layerGroup().addTo(map);

  locations.forEach(loc => {
    const marker = L.circleMarker(loc.coords, {
      radius: 8,
      fillColor: '#2da57f',
      color: '#fff',
      weight: 1,
      fillOpacity: 0.95
    }).addTo(markerGroup);
    marker.bindPopup(`<strong>${loc.title}</strong><div style="margin-top:6px">${loc.text}</div>`, { closeButton: true });
    marker.on('click', () => {
      marker.openPopup();
      map.panTo(loc.coords);
    });
  });

  // Wire custom control buttons (first = zoom in, second = zoom out, third = reset)
  const ctrlBtns = document.querySelectorAll('.map-ctrl-btn');
  if (ctrlBtns.length >= 3) {
    ctrlBtns[0].addEventListener('click', () => map.zoomIn());
    ctrlBtns[1].addEventListener('click', () => map.zoomOut());
    ctrlBtns[2].addEventListener('click', () => { map.setView([6,20], 3); });
  }

  // Ensure map renders correctly when coming into view
  setTimeout(() => { map.invalidateSize(); }, 250);
  window.addEventListener('resize', () => map.invalidateSize());
});
