const { Station } = require('../models');

// TÜM İSTASYONLARI GETİR
exports.getStations = async (req, res) => {
    try {
        const stations = await Station.findAll();
        res.json(stations);
    } catch (error) {
        res.status(500).json({ message: 'İstasyonlar alınamadı.', error: error.message });
    }
};

// İSTASYON EKLE
exports.createStation = async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        const newStation = await Station.create({ name, latitude, longitude });
        res.status(201).json(newStation);
    } catch (error) {
        res.status(500).json({ message: 'İstasyon eklenemedi.', error: error.message });
    }
};