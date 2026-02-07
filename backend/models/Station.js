const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Station = sequelize.define('Station', {
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false
    },
    is_center: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'stations',
    timestamps: false // İstasyon tablosunda tarih tutmaya gerek duymamıştık
});

module.exports = Station;