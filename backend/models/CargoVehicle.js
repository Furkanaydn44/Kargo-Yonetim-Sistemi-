const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CargoVehicle = sequelize.define('CargoVehicle', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'vehicles',
            key: 'id'
        }
    },
    cargo_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'cargos',
            key: 'id'
        }
    },
    route_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'cargos_vehicles',
    timestamps: false
});

module.exports = CargoVehicle;
