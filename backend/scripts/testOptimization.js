const OptimizationService = require('../services/optimizationService');

async function test() {
    console.log('--- TEST 1: Within Fixed Capacity ---');
    // Total 2000kg. Fixed fleet is 2250 (1000+750+500). Should fit in fixed.
    let result = await OptimizationService.optimizeFleet(2000, 100);
    console.log('Weight: 2000, Dist: 100');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n--- TEST 2: Exceeding Fixed Capacity ---');
    // Total 3000kg. Fixed 2250. Needs 750kg more.
    // Rental cap 500. So needs 2 rentals (500+500 = 1000 capacity > 750).
    result = await OptimizationService.optimizeFleet(3000, 100);
    console.log('Weight: 3000, Dist: 100');
    console.log('Result:', JSON.stringify(result, null, 2));

    console.log('\n--- TEST 3: Exact Fixed Capacity ---');
    // Total 2250. Should use all 3 fixed.
    result = await OptimizationService.optimizeFleet(2250, 100);
    console.log('Weight: 2250, Dist: 100');
    console.log('Result:', JSON.stringify(result, null, 2));
}

test();
