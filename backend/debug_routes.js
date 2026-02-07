const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Route, Vehicle, RouteStop } = require('./models');

async function checkRoutes() {
    try {
        const routes26 = await Route.findAll({
            where: { route_date: '2025-12-26' },
            include: [
                { model: Vehicle },
                { model: RouteStop }
            ]
        });

        const detail = routes26.map(r => ({
            id: r.id,
            date: r.route_date,
            vehicle_id: r.vehicle_id,
            hasVehicle: !!r.Vehicle,
            vehiclePlate: r.Vehicle ? r.Vehicle.plate_number : 'N/A',
            stopsCount: r.RouteStops ? r.RouteStops.length : 0,
            stops: r.RouteStops ? r.RouteStops.map(s => ({ id: s.id, stationId: s.station_id })) : []
        }));

        fs.writeFileSync('results_detail.json', JSON.stringify(detail, null, 2));
        console.log("Done writing results_detail.json");
    } catch (error) {
        fs.writeFileSync('results_detail.json', JSON.stringify({ error: error.message }));
    }
}

checkRoutes();
