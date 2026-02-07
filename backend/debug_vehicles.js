const { Vehicle } = require('./models');
const path = require('path');
require('dotenv').config();

async function checkVehicles() {
    try {
        console.log("Checking Vehicles...");
        const vehicles = await Vehicle.findAll();

        console.log("All Vehicles:");
        vehicles.forEach(v => {
            console.log(`ID: ${v.id}, Plate: ${v.plate_number}, Status: '${v.status}', Rental: ${v.is_rental}, Cap: ${v.capacity_kg}`);
        });

        console.log("\nActive Fixed Vehicles (Query Test):");
        const activeFixed = await Vehicle.findAll({
            where: { status: 'active', is_rental: false }
        });
        console.log(`Found ${activeFixed.length} matches.`);
        activeFixed.forEach(v => console.log(` - ${v.plate_number}`));

    } catch (error) {
        console.error("Error:", error);
    }
}

checkVehicles();
