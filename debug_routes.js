const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { Route, Vehicle, RouteStop } = require('./backend/models');

async function checkRoutes() {
    try {
        console.log("Checking Routes...");
        console.log(`DB Config: ${process.env.DB_NAME} @ ${process.env.DB_HOST} (${process.env.DB_DIALECT})`);

        const routes = await Route.findAll();
        console.log(`Total Routes: ${routes.length}`);

        routes.forEach(r => {
            console.log(`Route ID: ${r.id}, Date: ${r.route_date} (Type: ${typeof r.route_date}), Vehicle: ${r.vehicle_id}`);
        });

        console.log("\nChecking for 2025-12-26...");
        const targetRoutes = await Route.findAll({ where: { route_date: '2025-12-26' } });
        console.log(`Routes found for '2025-12-26': ${targetRoutes.length}`);

        console.log("\nChecking for 2025-12-27...");
        const targetRoutes2 = await Route.findAll({ where: { route_date: '2025-12-27' } });
        console.log(`Routes found for '2025-12-27': ${targetRoutes2.length}`);

        // Check date format in DB raw if possible (sequelize formats DateOnly as string usually)

    } catch (error) {
        console.error("Error:", error);
    }
}

checkRoutes();
