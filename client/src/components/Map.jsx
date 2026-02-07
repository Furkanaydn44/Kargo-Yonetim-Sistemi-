import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet Default Icon Issue
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to handle map clicks
const LocationPicker = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MapComponent = ({ stations, routes, selectedRoute, onMapClick }) => {
    const center = [40.8533, 29.8815]; // Kocaeli Center Coordinates

    // Generate random colors for different routes
    const colors = ['blue', 'red', 'green', 'purple', 'orange', 'black'];

    return (
        <MapContainer center={center} zoom={10} scrollWheelZoom={true} style={{ height: "100%", width: "100%", borderRadius: "1rem", minHeight: "500px" }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {stations.map(station => (
                <Marker key={station.id} position={[station.latitude, station.longitude]}>
                    <Popup>
                        <b>{station.name}</b> <br />
                        {station.is_center ? '(Distribution Center)' : 'Station'}
                    </Popup>
                </Marker>
            ))}

            {routes && routes.map((route, index) => (
                <Polyline
                    key={index}
                    positions={route.path.map(p => [p.latitude, p.longitude])}
                    color={colors[index % colors.length]}
                    weight={5}
                >
                    <Popup>
                        Vehicle: {route.vehicleId} <br />
                        Total Weight: {route.totalWeight} kg <br />
                        Cost: {route.cost}
                    </Popup>
                </Polyline>
            ))}

            {/* Active Vehicle Route (Full Path - Orange) */}
            {selectedRoute && selectedRoute.type === 'vehicle' && (
                <Polyline
                    positions={selectedRoute.path.map(p => [p.latitude, p.longitude])}
                    color="orange"
                    weight={5}
                >
                    <Popup>{selectedRoute.description}</Popup>
                </Polyline>
            )}

            {/* Highlighted Segment (Specific Leg - Red) */}
            {selectedRoute && selectedRoute.highlightedSegment && (
                <Polyline
                    positions={selectedRoute.highlightedSegment.map(p => [p.latitude, p.longitude])}
                    color="red"
                    weight={7}
                >
                    <Popup>Segment: {selectedRoute.segmentDescription}</Popup>
                </Polyline>
            )}

            {/* Legacy/Standard Selected Route (for single cargo view) */}
            {selectedRoute && selectedRoute.type !== 'vehicle' && !selectedRoute.highlightedSegment && (
                <Polyline
                    positions={selectedRoute.path.map(p => [p.latitude, p.longitude])}
                    color={selectedRoute.color || 'orange'}
                    weight={selectedRoute.weight || 6}
                    dashArray={selectedRoute.dashed ? "10, 10" : null}
                >
                    <Popup>
                        {selectedRoute.description}
                    </Popup>
                </Polyline>
            )}

            {/* Click Handler */}
            {onMapClick && <LocationPicker onMapClick={onMapClick} />}
        </MapContainer>
    );
};

export default MapComponent;
