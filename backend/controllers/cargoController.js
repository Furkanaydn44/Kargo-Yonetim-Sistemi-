const { Cargo, Station, User } = require('../models');

// KARGO EKLEME (Kullanıcı Paneli İçin)
// KARGO EKLEME (Kullanıcı Paneli İçin)
exports.createCargo = async (req, res) => {
    try {
        // req.user, auth middleware'inden gelecek (giriş yapan kullanıcı)
        const userId = req.user.id;
        const { station_id, weight_kg, request_date, count } = req.body;

        const cargoCount = parseInt(count) || 1;

        if (cargoCount > 1) {
            // Batch create
            const cargoArray = [];
            for (let i = 0; i < cargoCount; i++) {
                cargoArray.push({
                    user_id: userId,
                    station_id,
                    weight_kg,
                    request_date: request_date || new Date(),
                    status: 'pending'
                });
            }
            const createdCargos = await Cargo.bulkCreate(cargoArray);
            return res.status(201).json({ message: `${cargoCount} adet kargo talebi alındı.`, data: createdCargos });
        } else {
            // Single create
            const newCargo = await Cargo.create({
                user_id: userId,
                station_id,
                weight_kg,
                request_date: request_date || new Date(),
                status: 'pending'
            });
            return res.status(201).json({ message: 'Kargo talebi alındı.', data: newCargo });
        }

    } catch (error) {
        res.status(500).json({ message: 'Kargo eklenirken hata oluştu.', error: error.message });
    }
};

// KARGOLARI LİSTELEME
exports.getAllCargos = async (req, res) => {
    try {
        // Eğer admin ise hepsini görsün, değilse sadece kendininkini
        const whereClause = req.user.role === 'admin' ? {} : { user_id: req.user.id };

        // Tarih filtresi (Opsiyonel)
        if (req.query.date) {
            whereClause.request_date = req.query.date;
        }

        const cargos = await Cargo.findAll({
            where: whereClause,
            include: [
                { model: Station, attributes: ['name'] }, // İstasyon adını getir
                { model: User, attributes: ['username'] } // Kimin gönderdiğini getir
            ],
            order: [['request_date', 'DESC']]
        });

        res.json(cargos);

    } catch (error) {
        res.status(500).json({ message: 'Kargolar getirilemedi.', error: error.message });
    }
};

// BULK CREATE (Senaryolar İçin)
exports.bulkCreateCargos = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cargos } = req.body; // Array of { station_id, weight_kg, request_date, status }

        // Assign user_id to all
        const cargosWithUser = cargos.map(c => ({
            ...c,
            user_id: userId,
            status: 'pending'
        }));

        const createdCargos = await Cargo.bulkCreate(cargosWithUser);
        res.status(201).json({ message: 'Toplu kargo eklendi.', count: createdCargos.length });

    } catch (error) {
        res.status(500).json({ message: 'Toplu kargo eklenirken hata oluştu.', error: error.message });
    }
};

// DELETE ALL (Senaryo Sıfırlama İçin)
exports.deleteAllCargos = async (req, res) => {
    try {
        // Sadece admin yapabilmeli (routeda kontrol edilecek)
        await Cargo.destroy({
            where: {},
            truncate: true // ID'leri de sıfırlayabilir (sqlite'da değişir)
        });
        res.json({ message: 'Tüm kargolar silindi.' });
    } catch (error) {
        res.status(500).json({ message: 'Kargolar silinemedi.', error: error.message });
    }
};