/**
 * API Service for Carris Metropolitana
 * Handles all API calls and data processing
 */

const API_BASE_URL = 'https://api.carrismetropolitana.pt/v1';

/**
 * Fetches all routes from the API
 * @returns {Promise<Array>} Array of route objects
 */
async function fetchAllRoutes() {
  try {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) throw new Error('Failed to fetch routes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching routes:', error);
    throw error;
  }
}

/**
 * Fetches detailed information for a specific route
 * @param {string} routeId The route ID
 * @returns {Promise<Object>} Route details object
 */
async function fetchRouteDetails(routeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`);
    if (!response.ok) throw new Error(`Failed to fetch details for route ${routeId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching route details for ${routeId}:`, error);
    throw error;
  }
}

/**
 * Fetches pattern information
 * @param {string} patternId The pattern ID
 * @returns {Promise<Object>} Pattern object
 */
async function fetchPattern(patternId) {
  try {
    const response = await fetch(`${API_BASE_URL}/patterns/${patternId}`);
    if (!response.ok) throw new Error(`Failed to fetch pattern ${patternId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching pattern ${patternId}:`, error);
    throw error;
  }
}

/**
 * Fetches shape data for a specific shape ID
 * @param {string} shapeId The shape ID
 * @returns {Promise<Object>} Shape data object with geojson
 */
async function fetchShapeData(shapeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/shapes/${shapeId}`);
    if (!response.ok) throw new Error(`Failed to fetch shape ${shapeId}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching shape ${shapeId}:`, error);
    throw error;
  }
}

/**
 * Filters routes by route number
 * @param {Array} routes Array of route objects
 * @param {string} routeNumber The route number to filter by
 * @returns {Array} Filtered array of routes
 */
function filterRoutesByNumber(routes, routeNumber) {
  return routes.filter(route => route.short_name === routeNumber);
}

/**
 * Generates GPX content from shape data
 * @param {Object} route Route object
 * @param {Object} pattern Pattern object
 * @param {Object} shapeData Shape data with coordinates
 * @returns {string} GPX file content as string
 */
function generateGpxContent(route, pattern, shapeData) {
  if (!shapeData.geojson?.geometry?.coordinates) {
    throw new Error('Shape data does not contain valid coordinates');
  }

  const routeName = `${route.short_name} - ${pattern.headsign}`;
  
  const gpxHeader = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Carris Metropolitana" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeName}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <trkseg>`;

  const gpxPoints = shapeData.geojson.geometry.coordinates
    .map(([lon, lat]) => `      <trkpt lat="${lat}" lon="${lon}"></trkpt>`)
    .join("\n");

  const gpxFooter = `
    </trkseg>
  </trk>
</gpx>`;

  return gpxHeader + gpxPoints + gpxFooter;
}

/**
 * Creates and triggers download of a GPX file
 * @param {string} content GPX file content
 * @param {string} filename Filename for the download
 */
function downloadGpxFile(content, filename) {
  const blob = new Blob([content.trim()], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}