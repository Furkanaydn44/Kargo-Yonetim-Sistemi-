const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
    plate_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    capacity_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    base_cost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    fuel_cost_per_km: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 1.0
    },
    is_rental: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    status: {
        type: DataTypes.ENUM('active', 'maintenance'),
        defaultValue: 'active'
    }
}, {
    tableName: 'vehicles',
    timestamps: false
});

module.exports = Vehicle;