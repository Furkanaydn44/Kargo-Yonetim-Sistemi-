const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    }
}, {
    tableName: 'users',
    timestamps: true, // created_at ve updated_at otomatik yönetilir
    createdAt: 'created_at',
    updatedAt: false // SQL tablonda updated_at yoksa bunu false yapabilirsin
});

module.exports = User;