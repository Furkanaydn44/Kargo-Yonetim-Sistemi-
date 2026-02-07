const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { optimizeRoutes } = require('./controllers/optimizationController');
const { sequelize, Cargo, Station, Route, Vehicle, CargoVehicle, RouteStop } = require('./models');

// Mock Request and Response
const req = {
    body: {
        date: '2025-12-28',
        cargoIds: []
    }
};

const res = {
    status: (code) => {
        console.log(`[Response Header ${code}]`);
        return {
            json: (data) => console.log(`[Response Data ${code}]:`, JSON.stringify(data, null, 2))
        };
    },
    json: (data) => {
        console.log(`[Response 200] SUCCESS`);
        console.log(`Total Routes: ${data.data.totalRoutes}`);
        data.data.routes.forEach((r, i) => {
            console.log(`Route ${i + 1}: Vehicle ${r.vehicleId} | Cost: ${r.cost}`);
        });
    }
};

async function runTest() {
    try {
        console.log("Running manual optimization test...");
        await sequelize.authenticate();

        // 1. CLEANUP for specific date
        // Note: Destroys real data for this date, be careful on prod (OK for local debug)
        await CargoVehicle.destroy({ where: { route_date: req.body.date } });
        await Route.destroy({ where: { route_date: req.body.date } }); // Cascade delete RouteStop usually? No, manual clean if no cascade
        // Actually lets just clean RouteStops via Routes if needed, but for now simple cleanup of CargoVehicle is key so cargos become 'pending' again?
        // Wait, if we destroy CargoVehicle, we must also reset Cargo status to 'pending'.

        await Cargo.update({ status: 'pending' }, { where: { status: 'planned', request_date: req.body.date } });

        const testDate = req.body.date;
        console.log("Seeding/Resetting Cargos for", testDate);

        // Ensure we have enough weight for the scenario
        // User said: 2700kg total. Capacity 2250.
        // Let's ensure we have Cargos totaling ~2700kg.
        const stations = await Station.findAll();
        // Assume Stations: 1=Center, 2=Gebze, 3=Dilovası, 4=Çayırova (Hypothetically)
        // Or just pick random stations excluding Center.
        const targetStations = stations.filter(s => !s.is_center).slice(0, 3);

        // Create huge load
        // 450kg * 6 = 2700kg.
        // This allows testing that we fill 500kg vehicles properly (1 item per vehicle roughly, or maybe 2 if small margin error?)
        // With 450kg, we fit 1 item per 500kg vehicle. (Total 6 vehicles expected).
        // If we used 250kg, we would fit 2.

        for (let i = 0; i < 6; i++) {
            // Round-robin station selection from target list
            const st = targetStations[i % targetStations.length];
            await Cargo.create({
                user_id: 1,
                station_id: st.id,
                weight_kg: 450,
                status: 'pending',
                request_date: testDate
            });
        }

        console.log("Starting Optimization...");
        await optimizeRoutes(req, res);

    } catch (error) {
        console.error("Test Harness Error:", error);
    }
}

runTest();
