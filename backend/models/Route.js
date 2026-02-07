const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Route = sequelize.define('Route', {
    route_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    total_distance_km: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    total_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    }
}, {
    tableName: 'routes',
    timestamps: true,
    createdAt: 'calculated_at',
    updatedAt: false
});

module.exports = Route;