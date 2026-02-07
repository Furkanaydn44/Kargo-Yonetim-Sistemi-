import { useState, useEffect } from 'react';
import MapComponent from '../components/Map';
import stationService from '../services/stationService';
import cargoService from '../services/cargoService';
import vehicleService from '../services/vehicleService';
import optimizationService from '../services/optimizationService';
import routingService from '../services/routingService';
import { SCENARIOS } from '../constants/scenarios';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
    const [stations, setStations] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [vehicles, setVehicles] = useState([]);

    const handleToggleMaintenance = async (vehicle) => {
        try {
            const newStatus = vehicle.status === 'active' ? 'maintenance' : 'active';
            await vehicleService.updateVehicleStatus(vehicle.id, newStatus);
            toast.success(`Vehicle ${vehicle.plate_number} set to ${newStatus}`);
            fetchVehicles(); // Refresh list
        } catch (error) {
            toast.error('Failed to update vehicle status');
        }
    };

    const [activeRoutes, setActiveRoutes] = useState([]); // Vehicles with routes
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newVehicle, setNewVehicle] = useState({ plate_number: '', capacity_kg: 500, base_cost: 0, fuel_cost_per_km: 1 });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Default today
    const [newStation, setNewStation] = useState({ name: '', latitude: '', longitude: '' });
    const [isPickingLocation, setIsPickingLocation] = useState(false);
    const [expandedStepId, setExpandedStepId] = useState(null); // Track expanded route stop for details
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    const [optimizationMode, setOptimizationMode] = useState('unlimited'); // 'unlimited', 'fixed_count', 'fixed_weight'
    const [scenarioComparison, setScenarioComparison] = useState(null);

    useEffect(() => {
        if (showAnalysisModal) {
            optimizationService.analyzeAllScenarios(selectedDate).then(data => setScenarioComparison(data));
        }
    }, [showAnalysisModal, selectedDate]);

    useEffect(() => {
        fetchStations();
        fetchCargos();
        fetchVehicles();
        fetchActiveRoutes();
    }, [selectedDate]); // Re-fetch when date changes

    const fetchActiveRoutes = async () => {
        try {
            const data = await vehicleService.getVehicleRoutes(selectedDate);
            setActiveRoutes(data);
        } catch (error) {
            console.error(error);
            // toast.error('Failed to load active routes');
        }
    };

    // ... Existing fetchFunctions ...

    const fetchStations = async () => {
        try {
            const data = await stationService.getStations();
            setStations(data);
        } catch (error) {
            toast.error('Failed to load stations');
        }
    };

    const fetchCargos = async () => {
        try {
            const data = await cargoService.getAllCargos(selectedDate);
            setCargos(data);
        } catch (error) {
            toast.error('Failed to load cargos');
        }
    };

    const handleAddStation = async (e) => {
        e.preventDefault();
        try {
            await stationService.addStation(newStation);
            toast.success('Station added successfully');
            fetchStations();
            setNewStation({ name: '', latitude: '', longitude: '' });
            setIsPickingLocation(false);
        } catch (error) {
            toast.error('Failed to add station');
        }
    };

    const handleMapClick = (latlng) => {
        if (isPickingLocation) {
            setNewStation({ ...newStation, latitude: latlng.lat, longitude: latlng.lng });
            // setIsPickingLocation(false); // Optional: Keep picking enabled until save or manual toggle
            toast.info(`Location picked: ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`);
        }
    };

    const fetchVehicles = async () => {
        try {
            const data = await vehicleService.getVehicles();
            setVehicles(data);
        } catch (error) {
            // endpoint might not exist yet, suppress error for now or log
            console.error('Failed to load vehicles');
        }
    };

    const handleAddVehicle = async (e) => {
        e.preventDefault();
        try {
            await vehicleService.addVehicle(newVehicle);
            toast.success('Vehicle added successfully');
            fetchVehicles();
            setNewVehicle({ plate_number: '', capacity_kg: 500, base_cost: 0, fuel_cost_per_km: 1 });
        } catch (error) {
            toast.error('Failed to add vehicle');
        }
    };

    const handleOptimize = async () => {
        const pendingCargos = cargos.filter(c => c.status === 'pending');
        const pendingIds = pendingCargos.map(c => c.id);

        if (pendingIds.length === 0) {
            toast.warn('No pending cargos to optimize.');
            return;
        }

        if (!window.confirm(`Optimize routes for all ${pendingIds.length} pending cargos?`)) return;

        setLoading(true);
        try {
            const result = await optimizationService.optimizeRoutes(pendingIds, optimizationMode, selectedDate);
            if (result.success && result.data && result.data.routes) {
                setRoutes(result.data.routes);
                const msg = `Optimization completed! ${result.data.routes.length} routes.`;
                const dropped = result.data.droppedStations;
                if (dropped && dropped > 0) {
                    toast.warning(`${msg} (${dropped} locations could not be served in Fixed Mode)`);
                } else {
                    toast.success(msg);
                }

                fetchCargos(); // Refresh status
            } else {
                toast.success('Optimization completed (No routes generated or empty)');
            }
        } catch (error) {
            toast.error('Optimization failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCargoClick = async (cargo) => {
        // Find Center Station (KOÜ)
        const centerStation = stations.find(s => s.is_center);
        // Find Target Station from the full list to ensure we have coordinates
        const targetStation = stations.find(s => s.id === cargo.station_id);

        if (centerStation && targetStation) {
            // Show toast first
            toast.info(`Calculating route for Cargo #${cargo.id}...`);

            // Fetch real road path
            const realPath = await routingService.getRoute(
                centerStation.latitude,
                centerStation.longitude,
                targetStation.latitude,
                targetStation.longitude
            );

            // Fallback to straight line if API fails
            const finalPath = realPath || [
                { latitude: centerStation.latitude, longitude: centerStation.longitude },
                { latitude: targetStation.latitude, longitude: targetStation.longitude }
            ];

            setSelectedRoute({
                path: finalPath,
                color: cargo.status === 'planned' ? 'red' : 'orange', // Planned = Red, Pending = Orange
                description: `Cargo #${cargo.id} -> ${targetStation.name} (${cargo.status})`
            });

            if (realPath) {
                toast.success(`Shown road route to ${targetStation.name}`);
            } else {
                toast.warning(`Road route unavailable, showing straight line to ${targetStation.name}`);
            }

        } else {
            console.warn('Coordinates missing:', { centerStation, targetStation, cargoStationId: cargo.station_id });
            toast.warning('Station coordinates not found. Please refresh data.');
        }
    };

    const handleVehicleRouteClick = async (vehicleRoute) => {
        console.log("Clicked Vehicle Route:", vehicleRoute);
        const stops = vehicleRoute.Routes[0].RouteStops;
        console.log("Stops:", stops);

        if (!stops || stops.length === 0) {
            console.warn("No stops found for this route.");
            return;
        }

        toast.info(`Calculating full road route for ${vehicleRoute.plate_number}...`);

        let fullPath = [];

        // Collect all waypoints
        const waypoints = [];

        // Add Start Point (Previous of First Stop)
        if (stops[0].PreviousStation) {
            waypoints.push(stops[0].PreviousStation);
        } else {
            console.warn("First stop missing PreviousStation (Start Point)");
        }

        // Add All Stops
        stops.forEach(s => {
            if (s.Station) waypoints.push(s.Station);
        });

        // Add End Point (Next of Last Stop - Return to Center)
        if (stops[stops.length - 1].NextStation) {
            waypoints.push(stops[stops.length - 1].NextStation);
        } else {
            console.warn("Last stop missing NextStation (End Point)");
        }

        console.log("Waypoints to route:", waypoints);

        if (waypoints.length < 2) {
            toast.error("Not enough waypoints to calculate route.");
            return;
        }

        // Now fetch routes between consecutive waypoints
        for (let i = 0; i < waypoints.length - 1; i++) {
            const start = waypoints[i];
            const end = waypoints[i + 1];
            try {
                const legPath = await routingService.getRoute(start.latitude, start.longitude, end.latitude, end.longitude);
                if (legPath) {
                    fullPath = fullPath.concat(legPath);
                } else {
                    // Fallback straight line
                    fullPath.push({ latitude: start.latitude, longitude: start.longitude });
                    fullPath.push({ latitude: end.latitude, longitude: end.longitude });
                }
            } catch (error) {
                console.error("Routing error for leg", i, error);
                fullPath.push({ latitude: start.latitude, longitude: start.longitude });
                fullPath.push({ latitude: end.latitude, longitude: end.longitude });
            }
        }

        console.log("Full Path Points:", fullPath.length);

        setSelectedRoute({
            type: 'vehicle',
            path: fullPath,
            description: `Vehicle ${vehicleRoute.plate_number} Full Road Route`,
            vehicleRoute: vehicleRoute
        });
        toast.success(`Shown full road route for ${vehicleRoute.plate_number}`);
    };

    const handleStopSegmentClick = async (stop) => {
        if (!selectedRoute || selectedRoute.type !== 'vehicle') return;

        let segmentPath = [];
        if (stop.PreviousStation && stop.Station) {
            try {
                const realPath = await routingService.getRoute(
                    stop.PreviousStation.latitude,
                    stop.PreviousStation.longitude,
                    stop.Station.latitude,
                    stop.Station.longitude
                );
                segmentPath = realPath || [
                    { latitude: stop.PreviousStation.latitude, longitude: stop.PreviousStation.longitude },
                    { latitude: stop.Station.latitude, longitude: stop.Station.longitude }
                ];
            } catch (e) {
                segmentPath = [
                    { latitude: stop.PreviousStation.latitude, longitude: stop.PreviousStation.longitude },
                    { latitude: stop.Station.latitude, longitude: stop.Station.longitude }
                ];
            }
        }

        setSelectedRoute(prev => ({
            ...prev,
            highlightedSegment: segmentPath,
            segmentDescription: `Segment to ${stop.Station.name}`
        }));
    };



    return (
        <div style={{ height: 'calc(100vh - 80px)', overflow: 'hidden', padding: '1rem' }}>
            <div className="flex gap-4" style={{ height: '100%' }}>

                {/* LEFT SIDE: Controls & Lists (Scrollable) */}
                <div className="flex flex-col gap-4" style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>

                    {/* Station Management (Updated) */}
                    <div className="card glass">
                        <h3>Station Management</h3>
                        <form onSubmit={handleAddStation} className="flex flex-col gap-2">
                            <label>Station Name</label>
                            <input
                                type="text"
                                placeholder="Station Name"
                                value={newStation.name}
                                onChange={(e) => setNewStation({ ...newStation, name: e.target.value })}
                                required
                            />

                            <div className="flex gap-2">
                                <div style={{ flex: 1 }}>
                                    <label>Latitude</label>
                                    <input
                                        type="number"
                                        placeholder="Lat"
                                        value={newStation.latitude}
                                        onChange={(e) => setNewStation({ ...newStation, latitude: e.target.value })}
                                        required
                                        step="any"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label>Longitude</label>
                                    <input
                                        type="number"
                                        placeholder="Lng"
                                        value={newStation.longitude}
                                        onChange={(e) => setNewStation({ ...newStation, longitude: e.target.value })}
                                        required
                                        step="any"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                className="btn"
                                onClick={() => setIsPickingLocation(!isPickingLocation)}
                                style={{
                                    background: isPickingLocation ? 'var(--primary)' : 'rgba(255,255,255,0.3)',
                                    border: '1px solid #000000',
                                    marginBottom: '0.5rem',
                                    color: isPickingLocation ? '#1e1e1e' : 'var(--text)'
                                }}
                            >
                                {isPickingLocation ? 'Tap on Map to Pick' : 'Pick from Map'}
                            </button>

                            <button type="submit" className="btn-primary">Add Station</button>
                        </form>
                    </div>

                    {/* Date Picker (NEW) */}
                    <div className="card glass">
                        <h3>Date Selection</h3>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginTop: '0.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                color: 'var(--text)',
                                borderRadius: '0.25rem'
                            }}
                        />
                    </div>

                    {/* Cargo Request & Actions (Merged) */}
                    <div className="card glass">
                        <div className="flex flex-col gap-2 mb-4">
                            <div className="flex justify-between items-center">
                                <h3>Cargo Request</h3>
                                <div className="flex gap-4">
                                    <button
                                        className="btn-primary"
                                        onClick={() => setShowAnalysisModal(true)}
                                    >
                                        Analyze Scenarios
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={handleOptimize}
                                        disabled={loading}
                                    >
                                        {loading ? 'Optimizing...' : 'Optimize Routes'}
                                    </button>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="flex gap-2 items-center" style={{ background: 'rgba(255,255,255,0.05)', padding: '0 1rem', borderRadius: '0.5rem', height: '50px' }}>
                                <label style={{ fontSize: '1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Mod:</label>
                                <select
                                    value={optimizationMode}
                                    onChange={(e) => setOptimizationMode(e.target.value)}
                                    style={{ background: 'transparent', padding: '0 1rem', color: 'var(--text)', border: 'none', outline: 'none', flex: 1, height: '80%', cursor: 'pointer', fontSize: '0.95rem' }}
                                >
                                    <option value="unlimited" style={{ color: 'black' }}>Fixed - Rental Vehicle</option>
                                    <option value="fixed_count" style={{ color: 'black' }}>Fixed - Max Count </option>
                                    <option value="fixed_weight" style={{ color: 'black' }}>Fixed - Max Weight </option>
                                </select>
                            </div>
                        </div>

                        {/* Cargo List Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>

                                        <th style={{ padding: '0.5rem' }}>ID</th>
                                        <th style={{ padding: '0.5rem' }}>User</th>
                                        <th style={{ padding: '0.5rem' }}>Station</th>
                                        <th style={{ padding: '0.5rem' }}>Weight</th>
                                        <th style={{ padding: '0.5rem' }}>Status</th>
                                        <th style={{ padding: '0.5rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargos.filter(c => c.status === 'pending').length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No pending cargo requests.
                                            </td>
                                        </tr>
                                    ) : (
                                        cargos
                                            .filter(c => c.status === 'pending')
                                            .map(cargo => (
                                                <tr
                                                    key={cargo.id}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                                    onClick={() => handleCargoClick(cargo)}
                                                    className="hover-row"
                                                >
                                                    <td style={{ padding: '0.5rem' }}>#{cargo.id}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.User ? cargo.User.username : 'Unknown'}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.Station ? cargo.Station.name : '-'}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.weight_kg} kg</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.status}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.request_date}</td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Vehicle Management */}
                    <div className="card glass">
                        <h3>Vehicle Management</h3>
                        <div className="flex flex-col gap-4">
                            {/* Add Vehicle Form */}
                            <div>
                                <h4>Add New Vehicle</h4>
                                <form onSubmit={handleAddVehicle} className="flex flex-col">
                                    <label>Plate Number</label>
                                    <input type="text" placeholder="34 ABC 123" value={newVehicle.plate_number} onChange={e => setNewVehicle({ ...newVehicle, plate_number: e.target.value })} required />

                                    <label>Capacity (kg)</label>
                                    <input type="number" value={newVehicle.capacity_kg} onChange={e => setNewVehicle({ ...newVehicle, capacity_kg: e.target.value })} required />

                                    <div className="flex gap-4">
                                        <div style={{ flex: 1 }}>
                                            <label>Base Cost</label>
                                            <input type="number" value={newVehicle.base_cost} onChange={e => setNewVehicle({ ...newVehicle, base_cost: e.target.value })} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>Fuel Cost / km</label>
                                            <input type="number" value={newVehicle.fuel_cost_per_km} step="0.1" onChange={e => setNewVehicle({ ...newVehicle, fuel_cost_per_km: e.target.value })} />
                                        </div>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Add Vehicle</button>
                                </form>
                            </div>

                            {/* Vehicle List */}
                            <div>
                                <h4>Existing Vehicles</h4>
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {vehicles.filter(v => !v.is_rental).map(v => (
                                        <li key={v.id} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', marginBottom: '0.5rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span><b>{v.plate_number}</b> ({v.capacity_kg}kg)</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{
                                                    color: v.status === 'active' ? '#4ade80' : '#f87171',
                                                    fontSize: '0.8rem',
                                                    textTransform: 'uppercase'
                                                }}>{v.status}</span>
                                                <button
                                                    onClick={() => handleToggleMaintenance(v)}
                                                    style={{
                                                        padding: '0.2rem 0.5rem',
                                                        fontSize: '0.7rem',
                                                        borderRadius: '0.25rem',
                                                        border: '1px solid var(--border)',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        color: 'var(--text)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {v.status === 'active' ? 'Set Maint.' : 'Set Active'}
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Active Vehicle Routes Pane (NEW) */}
                    <div className="card glass">
                        <div className="flex flex-col gap-1 mb-2">
                            <h3>Active Vehicle Routes</h3>
                            {activeRoutes.length > 0 && (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <span>
                                        Total Cost: <b style={{ color: 'var(--text)' }}>
                                            {activeRoutes.reduce((sum, v) => sum + Number(v.Routes[0].total_cost || 0), 0).toFixed(2)} TL
                                        </b>
                                    </span>
                                    <span>
                                        Total Dist: <b style={{ color: 'var(--text)' }}>
                                            {activeRoutes.reduce((sum, v) => sum + Number(v.Routes[0].total_distance_km || 0), 0).toFixed(1)} km
                                        </b>
                                    </span>
                                    <span>
                                        Total Weight: <b style={{ color: 'var(--text)' }}>
                                            {activeRoutes.reduce((sum, v) => sum + (v.Cargos ? v.Cargos.reduce((w, c) => w + Number(c.weight_kg), 0) : 0), 0)} kg
                                        </b>
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            {activeRoutes.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No routes for selected date.</p>
                            ) : (
                                activeRoutes.map(v => (
                                    <div key={v.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                                        {/* Vehicle Header */}
                                        <div
                                            style={{ padding: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', fontWeight: 'bold' }}
                                            onClick={() => handleVehicleRouteClick(v)}
                                        >
                                            {v.plate_number} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>({v.Routes[0].total_distance_km} km)</span>
                                        </div>

                                        <div style={{ padding: '0.5rem' }}>
                                            {v.Routes[0].RouteStops.map((stop, idx) => {
                                                const stopCargos = v.Cargos ? v.Cargos.filter(c => c.station_id === stop.station_id) : [];
                                                const isExpanded = expandedStepId === stop.id;

                                                return (
                                                    <div key={stop.id} style={{ marginBottom: '0.25rem' }}>
                                                        <div
                                                            style={{
                                                                fontSize: '0.9rem',
                                                                padding: '0.25rem 0.5rem',
                                                                cursor: 'pointer',
                                                                borderLeft: '2px solid var(--primary)',
                                                                marginLeft: '0.5rem',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent'
                                                            }}
                                                            className="hover-row"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStopSegmentClick(stop);
                                                            }}
                                                        >
                                                            <span>Step {idx + 1}: {stop.Station ? stop.Station.name : 'Unknown'}</span>

                                                            {stopCargos.length > 0 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedStepId(isExpanded ? null : stop.id);
                                                                    }}
                                                                    style={{
                                                                        fontSize: '0.7rem',
                                                                        padding: '0.1rem 0.4rem',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid var(--border)',
                                                                        background: 'rgba(255,255,255,0.1)',
                                                                        color: 'var(--text-muted)',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    {isExpanded ? 'Hide' : `Cargos (${stopCargos.length})`}
                                                                </button>
                                                            )}
                                                        </div>

                                                        {isExpanded && stopCargos.length > 0 && (
                                                            <div style={{ marginLeft: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' }}>
                                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                                    {stopCargos.map(c => (
                                                                        <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '2px 0' }}>
                                                                            <span>Cargo #{c.id}</span>
                                                                            <span>{c.weight_kg} kg</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Planned Cargos Pane (NEW) */}
                    <div className="card glass">
                        <h3>Planned Cargos</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '0.5rem' }}>ID</th>
                                        <th style={{ padding: '0.5rem' }}>User</th>
                                        <th style={{ padding: '0.5rem' }}>Station</th>
                                        <th style={{ padding: '0.5rem' }}>Weight</th>
                                        <th style={{ padding: '0.5rem' }}>Status</th>
                                        <th style={{ padding: '0.5rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cargos.filter(c => c.status === 'planned').length === 0 ? (
                                        <tr>
                                            <td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                                No planned cargos yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        cargos
                                            .filter(c => c.status === 'planned')
                                            .map(cargo => (
                                                <tr
                                                    key={cargo.id}
                                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                                                    onClick={() => handleCargoClick(cargo)}
                                                    className="hover-row"
                                                >
                                                    <td style={{ padding: '0.5rem' }}>#{cargo.id}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.User ? cargo.User.username : 'Unknown'}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.Station ? cargo.Station.name : '-'}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.weight_kg} kg</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.status}</td>
                                                    <td style={{ padding: '0.5rem' }}>{cargo.request_date}</td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* RIGHT SIDE: Map (Fixed) */}
                <div style={{ flex: 2, height: '100%', position: 'relative' }}>

                    {/* Route Statistics Overlay */}
                    {selectedRoute && selectedRoute.type === 'vehicle' && selectedRoute.vehicleRoute && (
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            zIndex: 1000,
                            background: 'rgba(30, 41, 59, 0.9)', // fast darker glass
                            backdropFilter: 'blur(10px)',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            minWidth: '220px',
                            color: 'white'
                        }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '0.5rem' }}>
                                Route Stats: {selectedRoute.vehicleRoute.plate_number}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Cargos Delivered:</span>
                                    <span style={{ fontWeight: 'bold' }}>{selectedRoute.vehicleRoute.Routes[0].RouteStops.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Total Weight:</span>
                                    <span style={{ fontWeight: 'bold' }}>
                                        {selectedRoute.vehicleRoute.Cargos
                                            ? selectedRoute.vehicleRoute.Cargos.reduce((sum, c) => sum + Number(c.weight_kg), 0)
                                            : 0} kg
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Total Distance:</span>
                                    <span style={{ fontWeight: 'bold' }}>{selectedRoute.vehicleRoute.Routes[0].total_distance_km} km</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Total Cost:</span>
                                    <span style={{ fontWeight: 'bold' }}>{selectedRoute.vehicleRoute.Routes[0].total_cost} TL</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card glass" style={{ height: '100%', padding: '0.5rem' }}>
                        <MapComponent
                            stations={stations}
                            routes={routes}
                            selectedRoute={selectedRoute}
                            onMapClick={handleMapClick}
                        />
                    </div>
                </div>

            </div>

            {/* ANALYSIS MODAL MOVED TO ROOT */}
            {showAnalysisModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.8)', zIndex: 999999, display: 'flex', justifyContent: 'center', alignItems: 'center',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card glass" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>

                        {scenarioComparison && (
                            <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                <h3 className="mb-2 text-xl font-bold">Optimization Scenario Comparison</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Metric</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'cyan' }}>Unlimited (Best Cost)</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'orange' }}>Fixed (Count Mode)</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'lightgreen' }}>Fixed (Weight Mode)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Total Cost</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.unlimited.totalCost.toFixed(2)} TL</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_count.totalCost.toFixed(2)} TL</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_weight.totalCost.toFixed(2)} TL</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Total Distance</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.unlimited.totalDistance.toFixed(1)} km</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_count.totalDistance.toFixed(1)} km</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_weight.totalDistance.toFixed(1)} km</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Vehicles Used</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.unlimited.vehicleCount}</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_count.vehicleCount}</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_weight.vehicleCount}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>Total Weight</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.unlimited.totalWeight} kg</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_count.totalWeight} kg</td>
                                            <td style={{ padding: '0.5rem' }}>{scenarioComparison.fixed_weight.totalWeight} kg</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-4">
                            <h2>Current Active Routes Detail</h2>
                            <button onClick={() => setShowAnalysisModal(false)} className="btn" style={{ background: 'red' }}>Close</button>
                        </div>

                        {activeRoutes.length === 0 ? (
                            <p>No active scenarios/routes found for this date.</p>
                        ) : (
                            <>
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255,255,255,0.1)' }}>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Vehicle</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Total Cost</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Distance</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Weight</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Calculated Users</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeRoutes.map(v => {
                                            const route = v.Routes[0];
                                            const totalWeight = v.Cargos ? v.Cargos.reduce((sum, c) => sum + Number(c.weight_kg), 0) : 0;
                                            const users = v.Cargos ? [...new Set(v.Cargos.map(c => c.User ? c.User.username : 'Unknown'))] : [];

                                            return (
                                                <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <td style={{ padding: '0.5rem' }}>{v.plate_number} {v.is_rental && <span style={{ fontSize: '0.8rem', color: 'cyan' }}>(RENTAL)</span>}</td>
                                                    <td style={{ padding: '0.5rem' }}>{route.total_cost} TL</td>
                                                    <td style={{ padding: '0.5rem' }}>{route.total_distance_km} km</td>
                                                    <td style={{ padding: '0.5rem' }}>{totalWeight} kg</td>
                                                    <td style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        {users.length > 0 ? users.join(', ') : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                                    <h3>Summary Stats</h3>
                                    <div className="flex" style={{ gap: '4rem', justifyContent: 'space-between' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Total Cost:</span>
                                            <h2>{activeRoutes.reduce((sum, v) => sum + Number(v.Routes[0].total_cost || 0), 0).toFixed(2)} TL</h2>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Total Fleet Distance:</span>
                                            <h2>{activeRoutes.reduce((sum, v) => sum + Number(v.Routes[0].total_distance_km || 0), 0).toFixed(1)} km</h2>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Vehicles Used:</span>
                                            <h2>{activeRoutes.length}</h2>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
