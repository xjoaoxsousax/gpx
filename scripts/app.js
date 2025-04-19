/**
 * Main application script
 */

// Add event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Set up route search input to respond to Enter key
  const routeInput = document.getElementById('routeNumber');
  routeInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      searchRoutes();
    }
  });

  // Focus the input field on page load
  routeInput.focus();
});

/**
 * Search for routes by route number
 */
async function searchRoutes() {
  const routeNumber = document.getElementById('routeNumber').value.trim();
  const resultsContainer = document.getElementById('results');
  const loadingElement = document.getElementById('loading');
  
  // Clear previous results
  resultsContainer.innerHTML = '';
  
  // Validate input
  if (!routeNumber) {
    showEmptyResults('Por favor, insira um número de rota.');
    return;
  }
  
  // Show loading state
  loadingElement.style.display = 'block';
  
  try {
    // Fetch and filter routes
    const allRoutes = await fetchAllRoutes();
    const filteredRoutes = filterRoutesByNumber(allRoutes, routeNumber);
    
    // Handle no results
    if (filteredRoutes.length === 0) {
      showEmptyResults(`Nenhuma rota encontrada com o número ${routeNumber}.`);
      loadingElement.style.display = 'none';
      return;
    }
    
    // Process each route
    let routeItemsHTML = '';
    let routeCount = 0;
    
    for (const route of filteredRoutes) {
      try {
        // Get route details
        const routeDetails = await fetchRouteDetails(route.id);
        
        if (!routeDetails.patterns || routeDetails.patterns.length === 0) {
          continue;
        }
        
        // Process each pattern
        for (const patternId of routeDetails.patterns) {
          try {
            const pattern = await fetchPattern(patternId);
            
            if (!pattern.shape_id) {
              continue;
            }
            
            // Create route card HTML
            const routeCard = createRouteCard(route, pattern);
            routeItemsHTML += routeCard;
            routeCount++;
          } catch (error) {
            console.error(`Error processing pattern ${patternId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error processing route ${route.id}:`, error);
      }
    }
    
    // Update UI with results
    if (routeCount > 0) {
      resultsContainer.innerHTML = routeItemsHTML;
      // Add animation class to each card after rendering
      setTimeout(() => {
        const cards = document.querySelectorAll('.route-card');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('slide-up');
          }, index * 100);
        });
      }, 50);
    } else {
      showEmptyResults(`Nenhuma rota encontrada com padrões para o número ${routeNumber}.`);
    }
    
  } catch (error) {
    console.error('Error in search process:', error);
    showEmptyResults('Ocorreu um erro ao buscar as rotas. Por favor, tente novamente.');
  } finally {
    loadingElement.style.display = 'none';
  }
}

/**
 * Creates HTML for a route card
 * @param {Object} route Route object
 * @param {Object} pattern Pattern object
 * @returns {string} HTML for the route card
 */
function createRouteCard(route, pattern) {
  return `
    <div class="route-card">
      <div class="route-header">
        <div class="route-number">${route.short_name}</div>
      </div>
      <div class="route-body">
        <div class="route-name">${pattern.headsign}</div>
        <div class="route-actions">
          <button class="btn btn-primary" onclick="previewRoute('${pattern.shape_id}', '${route.short_name} - ${pattern.headsign}')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z"/><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="currentColor"/></svg>
            <span>Visualizar no Mapa</span>
          </button>
          <button class="btn btn-secondary" onclick="downloadRoute('${route.id}', '${pattern.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"><path fill="none" d="M0 0h24v24H0z"/><path d="M3 19h18v2H3v-2zm10-5.828L19.071 7.1l1.414 1.414L12 17 3.515 8.515 4.929 7.1 11 13.17V2h2v11.172z" fill="currentColor"/></svg>
            <span>Baixar GPX</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Shows empty results message
 * @param {string} message Message to display
 */
function showEmptyResults(message) {
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = `
    <div class="empty-results fade-in">
      <p>${message}</p>
    </div>
  `;
}

/**
 * Preview a route on the map
 * @param {string} shapeId Shape ID to preview
 * @param {string} routeName Route name for display
 */
async function previewRoute(shapeId, routeName) {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'block';
  
  try {
    const shapeData = await fetchShapeData(shapeId);
    const coordinates = shapeData.geojson?.geometry?.coordinates;
    
    if (!coordinates || coordinates.length === 0) {
      alert('Coordenadas não encontradas para esta rota.');
      return;
    }
    
    displayRouteOnMap(coordinates, routeName);
  } catch (error) {
    console.error('Error previewing route:', error);
    alert('Ocorreu um erro ao carregar os dados da rota para visualização.');
  } finally {
    loadingElement.style.display = 'none';
  }
}

/**
 * Download a route as GPX
 * @param {string} routeId Route ID
 * @param {string} patternId Pattern ID
 */
async function downloadRoute(routeId, patternId) {
  const loadingElement = document.getElementById('loading');
  loadingElement.style.display = 'block';
  
  try {
    // Fetch necessary data
    const routeDetails = await fetchRouteDetails(routeId);
    const pattern = await fetchPattern(patternId);
    
    if (!pattern.shape_id) {
      alert('Dados indisponíveis para esta rota.');
      return;
    }
    
    const shapeData = await fetchShapeData(pattern.shape_id);
    
    // Generate and download GPX file
    const gpxContent = generateGpxContent(routeDetails, pattern, shapeData);
    const sanitizedHeadsign = pattern.headsign.replace(/[/\\?%*:|"<>]/g, '-');
    const filename = `${routeDetails.short_name}-${sanitizedHeadsign}.gpx`;
    
    downloadGpxFile(gpxContent, filename);
  } catch (error) {
    console.error('Error downloading route:', error);
    alert('Ocorreu um erro ao gerar o arquivo GPX.');
  } finally {
    loadingElement.style.display = 'none';
  }
}