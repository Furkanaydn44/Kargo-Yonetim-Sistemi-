const geolib = require('geolib');

class OptimizationService {

    /**
     * Calculate cost: (Base + Distance * Fuel)
     */
    static calculateRouteCost(vehicle, distanceKm) {
        return Number(vehicle.base_cost) + (distanceKm * Number(vehicle.fuel_cost_per_km));
    }

    /**
     * Helper: Sort cargos based on strategy for Knapsack
     * Strategies:
     * - 'WEIGHT': Maximize total weight (Heavier items first)
     * - 'COUNT': Maximize total count (Lighter items first)
     * - 'SAVINGS': VRP Savings method (not fully implemented here, using manual heuristic)
     * 
     * Current Heuristic for "Efficiency":
     * Score = (Weight) / (Distance from Center) [Prefer heavy items close to center?]
     * Actually for Knapsack with fixed capacity:
     * - Maximize Weight: Sort by Weight DESC
     * - Maximize Count: Sort by Weight ASC
     */
    static sortCargos(cargos, stations, centerStationId, strategy = 'WEIGHT') {
        return cargos.sort((a, b) => {
            if (strategy === 'COUNT') {
                return a.weight_kg - b.weight_kg; // Lightest first to fit more
            } else {
                return b.weight_kg - a.weight_kg; // Heaviest first to max utilization
            }
        });
    }

    /**
     * UNLIMITED FLEET MODE (VRP Variant)
     * Goal: Carry ALL cargo. Use fixed fleet first. If full, rent vehicles.
     * Optimization: Decide between "Detour on existing vehicle" vs "Rent new vehicle".
     */
    static async optimizeUnlimited(cargos, stations, fixedVehicles, distanceMatrix) {
        const assignments = [];
        const unassignedCargos = [...cargos]; // sort optional

        // 1. Fill Fixed Vehicles (Largest First)
        // Sort fixed vehicles by capacity DESC
        const sortedFixed = fixedVehicles.sort((a, b) => b.capacity_kg - a.capacity_kg);

        for (const vehicle of sortedFixed) {
            const currentAssignment = {
                vehicle: vehicle,
                isRental: false,
                cargos: [],
                currentLoad: 0,
                stations: new Set()
            };

            for (let i = unassignedCargos.length - 1; i >= 0; i--) {
                const cargo = unassignedCargos[i];
                if (currentAssignment.currentLoad + cargo.weight_kg <= vehicle.capacity_kg) {
                    currentAssignment.cargos.push(cargo);
                    currentAssignment.currentLoad += cargo.weight_kg;
                    currentAssignment.stations.add(cargo.station_id);
                    unassignedCargos.splice(i, 1);
                }
            }

            if (currentAssignment.cargos.length > 0) {
                assignments.push(currentAssignment);
            }
        }

        // 2. Handle Remaining with Rentals
        // Logic: Create rental vehicles (500kg, 200TL base).
        // Since we MUST carry everything in this mode, we just fill rentals.
        // Optimization opportunity: Could we squeeze a small rental load into a fixed vehicle by making a huge detour?
        // Check: Cost of Rental (200 + Dist) vs Cost of Detour (Dist * 1).
        // If Detour < 200, it's better. But we already filled fixed vehicles to capacity!
        // So we can only detour if there is capacity. But we just filled them.
        // So the only decision is: "New Rental" vs "Leave Behind" (but we must carry all).
        // So just fill rentals.

        while (unassignedCargos.length > 0) {
            const rental = {
                plate_number: `RENT-${assignments.length + 1}`,
                capacity_kg: 500,
                base_cost: 200,
                fuel_cost_per_km: 1,
                is_rental: true,
                id: null // Will be created in controller
            };

            const currentAssignment = {
                vehicle: rental,
                isRental: true,
                cargos: [],
                currentLoad: 0,
                stations: new Set()
            };

            for (let i = unassignedCargos.length - 1; i >= 0; i--) {
                const cargo = unassignedCargos[i];
                if (currentAssignment.currentLoad + cargo.weight_kg <= rental.capacity_kg) {
                    currentAssignment.cargos.push(cargo);
                    currentAssignment.currentLoad += cargo.weight_kg;
                    currentAssignment.stations.add(cargo.station_id);
                    unassignedCargos.splice(i, 1);
                }
            }

            // Force take at least one if it doesn't fit (Split cargo not supported, assuming single cargo < max rental)
            if (currentAssignment.cargos.length === 0 && unassignedCargos.length > 0) {
                const cargo = unassignedCargos.pop();
                currentAssignment.cargos.push(cargo);
                currentAssignment.currentLoad += cargo.weight_kg;
                currentAssignment.stations.add(cargo.station_id);
            }

            assignments.push(currentAssignment);
        }

        return { assignments, skippedCargos: [] };
    }

    /**
     * LIMITED FLEET MODE (Knapsack Variant)
     * Goal: Maximize success with ONLY fixed vehicles.
     * Strategy: 'WEIGHT' (Max Load) or 'COUNT' (Max number of orders)
     */
    static async optimizeLimited(cargos, stations, fixedVehicles, strategy, distanceMatrix, centerStationId) {
        const assignments = [];

        // 1. Score/Sort Cargos
        // Need to factor in Distance? 
        // "Efficient": Value/Weight.
        // Knapsack Value = 1 (Count) or Weight (Weight)
        // Cost = Space in truck
        // We also have "Cost" as in money (Distance).
        // If a cargo is very far, it "costs" more to deliver.
        // Heuristic: Value = (StrategyValue) / (DistanceCostFactor)

        // Let's attach a score to each cargo
        const scoredCargos = cargos.map(c => {
            const dist = distanceMatrix[centerStationId][c.station_id] || 1;
            // Avoid div by zero
            const d = dist === 0 ? 0.1 : dist;

            let value = 0;
            if (strategy === 'COUNT') value = 1;
            else value = c.weight_kg;

            // Simple heuristic: Value per km.
            // A 100kg cargo at 10km (score 10) is better than 100kg at 100km (score 1).
            return { ...c.dataValues, _score: value / d, _raw: c };
        });

        // Sort by Score DESC
        scoredCargos.sort((a, b) => b._score - a._score);

        const unassignedCargos = [...scoredCargos];
        const sortedFixed = fixedVehicles.sort((a, b) => b.capacity_kg - a.capacity_kg);

        for (const vehicle of sortedFixed) {
            const currentAssignment = {
                vehicle: vehicle,
                isRental: false,
                cargos: [],
                currentLoad: 0,
                stations: new Set()
            };

            for (let i = 0; i < unassignedCargos.length; i++) {
                const cargo = unassignedCargos[i];
                if (currentAssignment.currentLoad + cargo.weight_kg <= vehicle.capacity_kg) {
                    currentAssignment.cargos.push(cargo._raw);
                    currentAssignment.currentLoad += cargo.weight_kg;
                    currentAssignment.stations.add(cargo.station_id);

                    // Remove from list
                    unassignedCargos.splice(i, 1);
                    i--;
                }
            }
            if (currentAssignment.cargos.length > 0) {
                assignments.push(currentAssignment);
            }
        }

        return { assignments, skippedCargos: unassignedCargos.map(c => c._raw) };
    }
}

module.exports = OptimizationService;
