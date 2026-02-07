const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Cargo = sequelize.define('Cargo', {
    weight_kg: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'planned', 'delivered'),
        defaultValue: 'pending'
    },
    request_date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'cargos',
    timestamps: false
});

module.exports = Cargo;