const { sequelize, Station, Vehicle } = require('../models');

const seedDatabase = async () => {
    try {
        await sequelize.sync(); // Tabloların oluştuğundan emin ol

        // 1. İSTASYONLARI KONTROL ET VE EKLE
        const stationCount = await Station.count();
        if (stationCount === 0) {
            console.log('📍 İstasyonlar ekleniyor...');
            await Station.bulkCreate([
                { name: 'Kocaeli Üniversitesi (Merkez)', latitude: 40.8222, longitude: 29.9231, is_center: true },
                { name: 'Başiskele', latitude: 40.7180, longitude: 29.9320 },
                { name: 'Çayırova', latitude: 40.8170, longitude: 29.3750 },
                { name: 'Darıca', latitude: 40.7740, longitude: 29.4050 },
                { name: 'Derince', latitude: 40.7550, longitude: 29.8320 },
                { name: 'Dilovası', latitude: 40.7870, longitude: 29.5440 },
                { name: 'Gebze', latitude: 40.8020, longitude: 29.4300 },
                { name: 'Gölcük', latitude: 40.7160, longitude: 29.8210 },
                { name: 'Kandıra', latitude: 41.0710, longitude: 30.1500 },
                { name: 'Karamürsel', latitude: 40.6920, longitude: 29.6150 },
                { name: 'Kartepe', latitude: 40.7530, longitude: 30.0160 },
                { name: 'Körfez', latitude: 40.7710, longitude: 29.7360 },
                { name: 'İzmit', latitude: 40.7650, longitude: 29.9400 }
            ]);
        } else {
            console.log('✅ İstasyonlar zaten mevcut, ekleme yapılmadı.');
        }

        // 2. ARAÇLARI KONTROL ET VE EKLE
        const vehicleCount = await Vehicle.count();
        if (vehicleCount === 0) {
            console.log('🚛 Araçlar ekleniyor...');
            await Vehicle.bulkCreate([
                { plate_number: '41 SABIT 01', capacity_kg: 500, base_cost: 0, is_rental: false },
                { plate_number: '41 SABIT 02', capacity_kg: 750, base_cost: 0, is_rental: false },
                { plate_number: '41 SABIT 03', capacity_kg: 1000, base_cost: 0, is_rental: false }
            ]);
        } else {
            console.log('✅ Araçlar zaten mevcut, ekleme yapılmadı.');
        }

        console.log('🏁 Seed işlemi tamamlandı.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed Hatası:', error);
        process.exit(1);
    }
};

seedDatabase();