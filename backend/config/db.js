const { Sequelize } = require('sequelize');
require('dotenv').config();

// Veritabanı bağlantı ayarları (.env dosyasından okur)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false, // Konsolun SQL sorgularıyla dolmaması için false yaptık
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Bağlantıyı test etme fonksiyonu
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Veritabanı Bağlantısı Başarılı!');
    } catch (error) {
        console.error('❌ Veritabanı Bağlantı Hatası:', error);
        process.exit(1); // Hata varsa uygulamayı durdur
    }
};

module.exports = { sequelize, connectDB };