const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Rota Dosyalarını Çağır
const authRoutes = require('./routes/authRoutes');
const stationRoutes = require('./routes/stationRoutes');
const cargoRoutes = require('./routes/cargoRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes'); // Bunu zaten yapmıştık

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

// Rotaları Kullan
app.use('/api/auth', authRoutes);       // Örn: localhost:5000/api/auth/login
app.use('/api/stations', stationRoutes); // Örn: localhost:5000/api/stations
app.use('/api/cargos', cargoRoutes);     // Örn: localhost:5000/api/cargos
app.use('/api/vehicles', require('./routes/vehicleRoutes')); // Yeni: Araç yönetimi
app.use('/api', optimizationRoutes);     // Örn: localhost:5000/api/optimize

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});