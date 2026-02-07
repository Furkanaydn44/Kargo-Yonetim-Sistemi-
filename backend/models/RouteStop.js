const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const RouteStop = sequelize.define('RouteStop', {
    route_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'routes', key: 'id' }
    },
    station_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'stations', key: 'id' }
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'vehicles', key: 'id' }
    },
    previous_station_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'stations', key: 'id' }
    },
    next_station_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'stations', key: 'id' }
    },
    visit_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    operation_type: {
        type: DataTypes.ENUM('pickup', 'dropoff', 'none'),
        defaultValue: 'pickup'
    }
}, {
    tableName: 'route_stops',
    timestamps: false
});

module.exports = RouteStop;