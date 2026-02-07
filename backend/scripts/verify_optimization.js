const OptimizationService = require('../services/optimizationService');
const fs = require('fs');

// Mock Data
const mockStations = [
    { id: 1, name: 'Center', latitude: 40.0, longitude: 29.0, is_center: true },
    { id: 2, name: 'Station A', latitude: 40.1, longitude: 29.1 }, // Close
    { id: 3, name: 'Station B', latitude: 40.5, longitude: 29.5 }  // Far
];

const mockVehicles = [
    { id: 1, capacity_kg: 1000, base_cost: 0, fuel_cost_per_km: 1, is_rental: false },
    { id: 2, capacity_kg: 750, base_cost: 0, fuel_cost_per_km: 1, is_rental: false },
    { id: 3, capacity_kg: 500, base_cost: 0, fuel_cost_per_km: 1, is_rental: false }
];

// Mock Cargos (Total 3000kg > 2250kg Capacity)
const mockCargos = [
    { id: 1, weight_kg: 1000, station_id: 2, dataValues: { id: 1, weight_kg: 1000, station_id: 2 } },
    { id: 2, weight_kg: 1000, station_id: 3, dataValues: { id: 2, weight_kg: 1000, station_id: 3 } },
    { id: 3, weight_kg: 500, station_id: 2, dataValues: { id: 3, weight_kg: 500, station_id: 2 } },
    { id: 4, weight_kg: 500, station_id: 3, dataValues: { id: 4, weight_kg: 500, station_id: 3 } }
];
// Added dataValues property because Knapsack mode accesses cargo.dataValues

// Mock Distance Matrix
const mockDistanceMatrix = {
    1: { 1: 0, 2: 10, 3: 50 },
    2: { 1: 10, 2: 0, 3: 40 },
    3: { 1: 50, 2: 40, 3: 0 }
};

function log(msg) {
    fs.appendFileSync('verify_output.txt', msg + '\n');
    console.log(msg);
}

async function testUnlimited() {
    log('\n--- TESTING UNLIMITED MODE ---');
    const result = await OptimizationService.optimizeUnlimited(
        mockCargos, mockStations, mockVehicles, mockDistanceMatrix
    );

    log(`Assignments: ${result.assignments.length}`);
    result.assignments.forEach((a, i) => {
        log(`Vehicle ${i + 1} (${a.isRental ? 'Rental' : 'Fixed'}): Load ${a.currentLoad}kg`);
    });

    if (result.assignments.some(a => a.isRental) && result.assignments.length >= 3) {
        log('SUCCESS_UNLIMITED: Rentals created for excess cargo.');
    } else {
        log('FAIL_UNLIMITED: Expected rentals.');
    }
}

async function testLimited() {
    log('\n--- TESTING LIMITED MODE (Knapsack) ---');
    const result = await OptimizationService.optimizeLimited(
        mockCargos, mockStations, mockVehicles, 'WEIGHT', mockDistanceMatrix, 1
    );

    log(`Assignments: ${result.assignments.length}`);
    result.assignments.forEach((a, i) => {
        log(`Vehicle ${i + 1} (Fixed): Load ${a.currentLoad}kg`);
    });
    log(`Skipped Cargos: ${result.skippedCargos.length}`);

    if (result.assignments.every(a => !a.isRental) && result.skippedCargos.length > 0) {
        log('SUCCESS_LIMITED: Only fixed vehicles used, excess skipped.');
    } else {
        log('FAIL_LIMITED: Expected skipped cargos and no rentals.');
    }
}

// Run Tests
(async () => {
    try {
        if (fs.existsSync('verify_output.txt')) fs.unlinkSync('verify_output.txt');
        await testUnlimited();
        await testLimited();
    } catch (e) {
        log('ERROR: ' + e.message);
        console.error(e);
    }
})();
