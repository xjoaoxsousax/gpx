/**
 * Map utilities for displaying route shapes
 */

let routeMap = null;
let mapLayers = {
  route: null,
  markers: []
};

/**
 * Initializes the map with the given coordinates
 * @param {Array} startCoords Starting coordinates [lat, lon]
 * @returns {Object} Leaflet map instance
 */
function initializeMap(startCoords) {
  // Remove existing map if present
  if (routeMap) {
    routeMap.remove();
    mapLayers.route = null;
    mapLayers.markers = [];
  }

  // Create new map
  routeMap = L.map('map').setView(startCoords, 13);

  // Add base layers
  const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap Contributors',
    maxZoom: 19
  });

  const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri',
    maxZoom: 19
  });

  // Set default layer
  osmLayer.addTo(routeMap);

  // Add layer control
  const baseMaps = {
    "Mapa Padrão": osmLayer,
    "Satélite": satelliteLayer
  };

  L.control.layers(baseMaps).addTo(routeMap);

  return routeMap;
}

/**
 * Displays a route on the map
 * @param {Array} coordinates Array of [lon, lat] coordinates
 * @param {string} routeName Name of the route for display
 */
function displayRouteOnMap(coordinates, routeName) {
  if (!coordinates || coordinates.length === 0) {
    console.error('No coordinates provided for route display');
    return;
  }

  // Convert coordinates from [lon, lat] to [lat, lon] for Leaflet
  const latlngs = coordinates.map(([lon, lat]) => [lat, lon]);
  
  // Get start and end points
  const startPoint = latlngs[0];
  const endPoint = latlngs[latlngs.length - 1];

  // Initialize map with starting point
  const map = initializeMap(startPoint);

  // Add route line with blue color and increased weight
  mapLayers.route = L.polyline(latlngs, { 
    color: '#0066cc', 
    weight: 8, // Increased line weight
    opacity: 0.8,
    lineCap: 'round',
    lineJoin: 'round'
  }).addTo(map);

  // Add arrows to show direction
  const decorator = L.polylineDecorator(mapLayers.route, {
    patterns: [
      {
        offset: 25,
        repeat: 100,
        symbol: L.Symbol.arrowHead({
          pixelSize: 12,
          polygon: false,
          pathOptions: {
            stroke: true,
            color: '#ffcc00',
            weight: 3
          }
        })
      }
    ]
  }).addTo(map);

  // Add start marker
  const startMarker = L.marker(startPoint, {
    title: 'Início da rota',
    alt: 'Início'
  }).addTo(map);
  startMarker.bindPopup(`<strong>Início:</strong> ${routeName}`);
  mapLayers.markers.push(startMarker);

  // Add end marker
  const endMarker = L.marker(endPoint, {
    title: 'Fim da rota',
    alt: 'Fim'
  }).addTo(map);
  endMarker.bindPopup(`<strong>Fim:</strong> ${routeName}`);
  mapLayers.markers.push(endMarker);

  // Fit map to route bounds
  map.fitBounds(mapLayers.route.getBounds(), {
    padding: [50, 50]
  });

  // Show the map
  showMapModal();
}

/**
 * Shows the map modal with animation
 */
function showMapModal() {
  const mapModal = document.getElementById('mapModal');
  mapModal.style.display = 'flex';
  
  // Force reflow to enable transition
  void mapModal.offsetWidth;
  
  mapModal.classList.add('active');
  
  // Update map size once modal is visible
  if (routeMap) {
    setTimeout(() => {
      routeMap.invalidateSize();
    }, 300);
  }
}

/**
 * Hides the map modal with animation
 */
function hideMapModal() {
  const mapModal = document.getElementById('mapModal');
  mapModal.classList.remove('active');
  
  // Wait for transition to complete before setting display none
  setTimeout(() => {
    mapModal.style.display = 'none';
  }, 300);
}

// Initialize map modal close button
document.addEventListener('DOMContentLoaded', () => {
  const closeMapButton = document.getElementById('closeMap');
  closeMapButton.addEventListener('click', hideMapModal);
  
  // Close map when clicking outside the map
  const mapModal = document.getElementById('mapModal');
  mapModal.addEventListener('click', (event) => {
    if (event.target === mapModal) {
      hideMapModal();
    }
  });
  
  // Close map with escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mapModal.classList.contains('active')) {
      hideMapModal();
    }
  });
});