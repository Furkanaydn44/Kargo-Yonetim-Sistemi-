const { Vehicle, Route, RouteStop, Station, Cargo, User } = require('../models');
const OptimizationService = require('../services/optimizationService');

exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.findAll();
        res.json(vehicles);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vehicles', error: error.message });
    }
};

exports.addVehicle = async (req, res) => {
    try {
        const { plate_number, capacity_kg, base_cost, fuel_cost_per_km } = req.body;
        const newVehicle = await Vehicle.create({
            plate_number,
            capacity_kg,
            base_cost: base_cost || 0,
            fuel_cost_per_km: fuel_cost_per_km || 1,
            is_rental: false // Admin tarafından eklenenler kiralık değil sabit araçtır
        });
        res.status(201).json(newVehicle);
    } catch (error) {
        res.status(500).json({ message: 'Error adding vehicle', error: error.message });
    }
};

exports.optimizeFleet = async (req, res) => {
    try {
        const { totalWeightKg, distanceKm } = req.body;

        if (!totalWeightKg || !distanceKm) {
            return res.status(400).json({ message: 'Total weight and distance are required' });
        }

        const result = await OptimizationService.optimizeFleet(totalWeightKg, distanceKm);
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating fleet optimization', error: error.message });
    }
};

exports.getVehicleRoutes = async (req, res) => {
    try {
        const { date } = req.query;
        console.log("Fetching routes for date:", date);

        const whereClause = {};
        if (date) {
            whereClause.route_date = date;
        }

        // Fetch Vehicles that have Routes for this date
        // We include Route -> RouteStop -> Station
        // AND Cargo (via CargoVehicle filtered by date) to get weights
        const vehicles = await Vehicle.findAll({
            include: [
                {
                    model: Route,
                    required: true, // Only vehicles WITH routes
                    where: whereClause,
                    include: [{
                        model: RouteStop,
                        include: [
                            { model: Station, as: 'Station' },
                            { model: Station, as: 'PreviousStation' },
                            { model: Station, as: 'NextStation' }
                        ]
                    }]
                },
                {
                    model: Cargo,
                    through: {
                        where: { route_date: date }
                    },
                    include: [{ model: User, attributes: ['username'] }]
                }
            ]
        });

        console.log(`Found ${vehicles.length} vehicles with routes.`);

        // Sort stops strictly in JS if needed, but DB order is usually insertion. 
        // Better to sort by visit_order
        const result = vehicles.map(v => {
            const vehicleJson = v.toJSON();
            // Process routes to sort stops
            if (vehicleJson.Routes) {
                vehicleJson.Routes.forEach(r => {
                    if (r.RouteStops) {
                        r.RouteStops.sort((a, b) => a.visit_order - b.visit_order);
                    }
                });
            }
            return vehicleJson;
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching vehicle routes:', error);
        res.status(500).json({ message: 'Error fetching vehicle routes', error: error.message });
    }
};

exports.updateVehicleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'maintenance'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const vehicle = await Vehicle.findByPk(id);
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        vehicle.status = status;
        await vehicle.save();

        res.json(vehicle);
    } catch (error) {
        res.status(500).json({ message: 'Error updating vehicle status', error: error.message });
    }
};
