import axios from 'axios';

const OSRM_BASE_URL = 'http://router.project-osrm.org/route/v1/driving';

const routingService = {
    /**
     * Fetches the driving route between two coordinates using OSRM.
     * @param {number} startLat 
     * @param {number} startLon 
     * @param {number} endLat 
     * @param {number} endLon 
     * @returns {Promise<Array<{latitude: number, longitude: number}>>} Array of coordinates for the route path
     */
    getRoute: async (startLat, startLon, endLat, endLon) => {
        try {
            // OSRM expects "lon,lat" format
            const url = `${OSRM_BASE_URL}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
            const response = await axios.get(url);

            if (response.data.code === 'Ok' && response.data.routes.length > 0) {
                const coordinates = response.data.routes[0].geometry.coordinates;
                // Convert [lon, lat] to {latitude, longitude}
                return coordinates.map(coord => ({
                    latitude: coord[1],
                    longitude: coord[0]
                }));
            }
            return null;
        } catch (error) {
            console.error('Error fetching route from OSRM:', error);
            return null;
        }
    }
};

export default routingService;
