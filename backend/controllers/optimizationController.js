const { Station, Vehicle, Cargo, Route, RouteStop, CargoVehicle, sequelize, User } = require('../models');
const geolib = require('geolib');
const OptimizationService = require('../services/optimizationService');

// --- HELPER: Distance Matrix ---
const createDistanceMatrix = (stations) => {
    const matrix = {};
    stations.forEach(source => {
        matrix[source.id] = {};
        stations.forEach(target => {
            if (source.id === target.id) {
                matrix[source.id][target.id] = 0;
            } else {
                const distanceMeters = geolib.getDistance(
                    { latitude: source.latitude, longitude: source.longitude },
                    { latitude: target.latitude, longitude: target.longitude }
                );
                matrix[source.id][target.id] = distanceMeters / 1000;
            }
        });
    });
    return matrix;
};

// --- HELPER: Solve TSP (Nearest Neighbor) ---
const solveTSP = (startStationId, stationsToVisit, distanceMatrix) => {
    let currentStationId = startStationId;
    const path = [];
    const unvisited = Array.from(stationsToVisit);

    while (unvisited.length > 0) {
        let nearestStation = null;
        let minDist = Infinity;
        let indexToRemove = -1;

        unvisited.forEach((stationId, index) => {
            const sId = parseInt(stationId);
            const dist = distanceMatrix[currentStationId][sId];
            if (dist < minDist) {
                minDist = dist;
                nearestStation = sId;
                indexToRemove = index;
            }
        });

        if (nearestStation) {
            path.push({ stationId: nearestStation, distanceFromPrev: minDist });
            currentStationId = nearestStation;
            unvisited.splice(indexToRemove, 1);
        } else {
            break;
        }
    }
    return path;
};

// --- HELPER: Cluster Stations (Simple Radius Clustering) ---
const clusterCargosByLocation = (cargos, stations, radiusKm = 10) => {
    const clusters = [];
    // Station Map for fast lookup
    const stationMap = new Map(stations.map(s => [s.id, s]));

    // Group cargos by Station ID first
    const stationCargos = {};
    cargos.forEach(c => {
        if (!stationCargos[c.station_id]) stationCargos[c.station_id] = [];
        stationCargos[c.station_id].push(c);
    });

    const activeStationIds = Object.keys(stationCargos).map(id => parseInt(id));
    const visitedStations = new Set();

    activeStationIds.forEach(centerStationId => {
        if (visitedStations.has(centerStationId)) return;

        const cluster = {
            stationIds: [centerStationId],
            cargos: [...stationCargos[centerStationId]],
            totalWeight: stationCargos[centerStationId].reduce((sum, c) => sum + c.weight_kg, 0)
        };
        visitedStations.add(centerStationId);

        const centerStation = stationMap.get(centerStationId);

        // Look for neighbors
        activeStationIds.forEach(neighborId => {
            if (visitedStations.has(neighborId)) return;
            const neighbor = stationMap.get(neighborId);

            const distMeters = geolib.getDistance(
                { latitude: centerStation.latitude, longitude: centerStation.longitude },
                { latitude: neighbor.latitude, longitude: neighbor.longitude }
            );

            if (distMeters / 1000 <= radiusKm) {
                cluster.stationIds.push(neighborId);
                cluster.cargos.push(...stationCargos[neighborId]);
                cluster.totalWeight += stationCargos[neighborId].reduce((sum, c) => sum + c.weight_kg, 0);
                visitedStations.add(neighborId);
            }
        });

        clusters.push(cluster);
    });

    return clusters.sort((a, b) => b.totalWeight - a.totalWeight); // Return heaviest clusters first
};


// --- CORE OPTIMIZATION LOGIC (Reusable) ---
const runOptimizationLogic = async (date, options, transaction) => {
    const { allowRentals = true, sortOrder = 'DESC' } = options;
    const todayStr = date || new Date().toISOString().split('T')[0];

    // 1. Fetch Resources
    const pendingCargos = await Cargo.findAll({
        where: { status: 'pending', request_date: todayStr },
        include: [{ model: User, attributes: ['username'] }],
        order: [['weight_kg', sortOrder]]
    });
    const stations = await Station.findAll();
    const centerStation = stations.find(s => s.is_center);

    // 2. Fetch Active Vehicles (Owned only initially)
    let activeVehicles = await Vehicle.findAll({
        where: { status: 'active', is_rental: false },
        order: [['capacity_kg', 'DESC']]
    });

    if (!centerStation) throw new Error("Center station not found");
    if (pendingCargos.length === 0) {
        return { totalRoutes: 0, routes: [], stats: { totalCost: 0, totalDistance: 0, vehicleCount: 0, totalWeight: 0 } };
    }

    const distanceMatrix = createDistanceMatrix(stations);
    const createdRoutes = [];

    // 3. Cluster Cargos
    const clusters = clusterCargosByLocation(pendingCargos, stations, 15);

    // 4. Assign Clusters to Vehicles
    const vehicleAssignments = [];

    // Initialize Owned Vehicles
    activeVehicles.forEach(v => {
        vehicleAssignments.push({
            vehicle: v,
            cargos: [],
            currentLoad: 0,
            stations: new Set(),
            isRental: false
        });
    });

    for (const cluster of clusters) {
        let clusterCargos = [...cluster.cargos];

        while (clusterCargos.length > 0) {
            let bestVehicleIndex = -1;
            let maxFill = -1;
            const minCargoWeight = Math.min(...clusterCargos.map(c => c.weight_kg));

            // Try owned/active vehicles
            for (let i = 0; i < vehicleAssignments.length; i++) {
                const va = vehicleAssignments[i];
                const remainingCap = va.vehicle.capacity_kg - va.currentLoad;
                if (remainingCap < minCargoWeight) continue;

                // COST CHECK FOR RENTALS:
                // If reusing this rental means traveling > 200km (200TL), it's cheaper to get a NEW rental (200TL base).
                if (va.isRental && va.stations.size > 0 && clusterCargos.length > 0) {
                    // Estimate distance from last stop to new cluster start
                    const lastStationId = Array.from(va.stations).pop(); // Simple proxy
                    const nextStationId = clusterCargos[0].station_id;

                    const distKm = distanceMatrix[lastStationId][nextStationId];
                    const detourCost = distKm * va.vehicle.fuel_cost_per_km;

                    // If detour is more expensive than a new rental base cost (200), SKIP this vehicle.
                    // (Unless new rental also has high delivery cost? roughly new rental cost = 200 + local delivery.
                    // Reuse rental cost = Detour + local delivery. So we compare Detour vs 200.)
                    if (detourCost > 200) continue;
                }

                // If valid, prefer the one with best fit (max remaining capacity that fits?? or min waste?)
                // Strategy: Fill largest gaps? Or tightest fit?
                // Logic: "maxFill" selects the vehicle with MOST remaining capacity.
                if (remainingCap > maxFill) {
                    maxFill = remainingCap;
                    bestVehicleIndex = i;
                }
            }

            if (bestVehicleIndex !== -1) {
                const va = vehicleAssignments[bestVehicleIndex];
                let assignedCount = 0;
                for (let k = 0; k < clusterCargos.length; k++) {
                    if (va.currentLoad + clusterCargos[k].weight_kg <= va.vehicle.capacity_kg) {
                        va.cargos.push(clusterCargos[k]);
                        va.currentLoad += clusterCargos[k].weight_kg;
                        va.stations.add(clusterCargos[k].station_id);
                        clusterCargos.splice(k, 1);
                        k--;
                        assignedCount++;
                    }
                }
                if (assignedCount === 0) bestVehicleIndex = -1;
            }

            if (bestVehicleIndex === -1) {
                // RENTAL LOGIC
                if (allowRentals) {
                    while (clusterCargos.length > 0) {
                        const rentalCount = vehicleAssignments.filter(v => v.isRental).length + 1;
                        const nextCargo = clusterCargos[0];
                        const neededForSingleItem = nextCargo.weight_kg;
                        const rentalCapacity = Math.max(500, neededForSingleItem);

                        const rentalVehicle = await Vehicle.create({
                            plate_number: `RENT-${Date.now().toString().slice(-4)}-${rentalCount}`,
                            capacity_kg: rentalCapacity,
                            base_cost: 200,
                            fuel_cost_per_km: 1.0,
                            is_rental: true,
                            status: 'active'
                        }, { transaction });

                        const newAssignment = {
                            vehicle: rentalVehicle,
                            cargos: [],
                            currentLoad: 0,
                            stations: new Set(),
                            isRental: true
                        };
                        vehicleAssignments.push(newAssignment);

                        let assignedToThisRental = 0;
                        for (let k = 0; k < clusterCargos.length; k++) {
                            if (newAssignment.currentLoad + clusterCargos[k].weight_kg <= rentalVehicle.capacity_kg) {
                                newAssignment.cargos.push(clusterCargos[k]);
                                newAssignment.currentLoad += clusterCargos[k].weight_kg;
                                newAssignment.stations.add(clusterCargos[k].station_id);
                                clusterCargos.splice(k, 1);
                                k--;
                                assignedToThisRental++;
                            }
                        }
                        if (assignedToThisRental === 0) break; // prevent infinite
                    }
                } else {
                    // Rentals NOT allowed. Skip remaining cargos in this cluster.
                    // Instead of breaking infinite loop, we just stop processing this cluster because no vehicle fits.
                    // But we must EMPTY the clusterCargos array so the outer while loop breaks?
                    // Or maintain a list of 'unassigned' cargos?
                    // For simulation stats, we just ignore them.
                    clusterCargos = []; // Abandon remaining items
                }
            }
        }
    }

    // 5. Commit Assignments & Create Routes
    let totalCost = 0;
    let totalDist = 0;
    let totalWeight = 0;

    for (const va of vehicleAssignments) {
        if (va.cargos.length === 0) continue;

        // A. Create CargoVehicle
        for (const c of va.cargos) {
            await CargoVehicle.create({
                vehicle_id: va.vehicle.id,
                cargo_id: c.id,
                route_date: todayStr
            }, { transaction });

            // IMPORTANT: For simulation, we updated the memory object, but let's update DB too so logic holds (will rollback anyway)
            await Cargo.update({ status: 'planned' }, { where: { id: c.id }, transaction });
        }

        // B. Optimize Route (TSP)
        const sortedPath = solveTSP(centerStation.id, va.stations, distanceMatrix);
        let routeDist = 0;
        sortedPath.forEach(p => routeDist += p.distanceFromPrev);
        if (sortedPath.length > 0) {
            const lastId = sortedPath[sortedPath.length - 1].stationId;
            routeDist += distanceMatrix[lastId][centerStation.id];
        }

        const routeCost = OptimizationService.calculateRouteCost(va.vehicle, routeDist);

        const newRoute = await Route.create({
            vehicle_id: va.vehicle.id,
            route_date: todayStr,
            total_distance_km: routeDist,
            total_cost: routeCost
        }, { transaction });

        // C. Create Stops
        let visitOrder = 1;
        let prevId = centerStation.id;
        for (let i = 0; i < sortedPath.length; i++) {
            const stop = sortedPath[i];
            await RouteStop.create({
                route_id: newRoute.id,
                station_id: stop.stationId,
                previous_station_id: prevId,
                next_station_id: (i < sortedPath.length - 1) ? sortedPath[i + 1].stationId : centerStation.id,
                vehicle_id: va.vehicle.id,
                visit_order: visitOrder++,
                operation_type: 'dropoff'
            }, { transaction });
            prevId = stop.stationId;
        }

        totalCost += routeCost;
        totalDist += routeDist;
        totalWeight += va.currentLoad;

        // D. Construct Path for Frontend Map
        const path = [];
        const centerCoords = { latitude: centerStation.latitude, longitude: centerStation.longitude };
        const getCoords = (id) => {
            const s = stations.find(st => st.id === id);
            return s ? { latitude: s.latitude, longitude: s.longitude } : centerCoords;
        };

        path.push(centerCoords); // Start
        sortedPath.forEach(p => path.push(getCoords(p.stationId))); // Visits
        path.push(centerCoords); // Return

        createdRoutes.push({
            ...newRoute.dataValues,
            vehiclePlate: va.vehicle.plate_number,
            cargos: va.cargos,
            isRental: va.isRental,
            path: path // <--- Added for Map.jsx
        });
    }

    return {
        totalRoutes: createdRoutes.length,
        routes: createdRoutes,
        stats: {
            totalCost,
            totalDistance: totalDist,
            totalWeight,
            vehicleCount: createdRoutes.length
        }
    };
};

// --- MAIN CONTROLLER (Active Optimization) ---
exports.optimizeRoutes = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        console.log("🚀 Starting Active Optimization...");
        const result = await runOptimizationLogic(req.body.date, { allowRentals: true, sortOrder: 'DESC' }, transaction);

        // This is a REAL run, so we commit
        await transaction.commit();

        const getCoords = (id) => { /* Helper if needed, skipping for brevity in response */ };
        // Logic to format response same as before could go here, but client generally just reloads active routes.
        // We will return success.

        res.status(200).json({
            success: true,
            message: 'Optimization completed and saved to database.',
            data: result
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Optimization Failed:", error);
        res.status(500).json({ message: "Optimization Failed", error: error.message });
    }
};

// --- NEW: ANALYZE ALL SCENARIOS ---
exports.analyzeAllScenarios = async (req, res) => {
    try {
        console.log("📊 Analyzing All Scenarios...");
        const { date } = req.body;
        const todayStr = date || new Date().toISOString().split('T')[0];

        // SCENARIO A: Unlimited (Standard)
        const t1 = await sequelize.transaction();
        const sc1 = await runOptimizationLogic(date, { allowRentals: true, sortOrder: 'DESC' }, t1);
        await t1.rollback();

        // SCENARIO B: Fixed Count (No Rentals)
        const t2 = await sequelize.transaction();
        const sc2 = await runOptimizationLogic(date, { allowRentals: false, sortOrder: 'DESC' }, t2);
        await t2.rollback();

        // SCENARIO C: Fixed Weight (No Rentals, Sort ASC)
        const t3 = await sequelize.transaction();
        const sc3 = await runOptimizationLogic(date, { allowRentals: false, sortOrder: 'ASC' }, t3);
        await t3.rollback();

        res.json({
            unlimited: sc1.stats,
            fixed_count: sc2.stats,
            fixed_weight: sc3.stats
        });

    } catch (error) {
        console.error("Analysis Failed:", error);
        res.status(500).json({ message: "Analysis Failed", error: error.message });
    }
};