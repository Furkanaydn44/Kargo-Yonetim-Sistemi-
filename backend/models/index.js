const { sequelize } = require('../config/db');

// Modelleri İçe Aktar
const User = require('./User');
const Station = require('./Station');
const Vehicle = require('./Vehicle');
const Cargo = require('./Cargo');
const CargoVehicle = require('./CargoVehicle');
const Route = require('./Route');
const RouteStop = require('./RouteStop');

// --- İLİŞKİLER (ASSOCIATIONS) ---

// 1. Kullanıcı - Kargo İlişkisi
User.hasMany(Cargo, { foreignKey: 'user_id' });
Cargo.belongsTo(User, { foreignKey: 'user_id' });

// 2. İstasyon - Kargo İlişkisi
Station.hasMany(Cargo, { foreignKey: 'station_id' });
Cargo.belongsTo(Station, { foreignKey: 'station_id' });

// 3. Araç - Rota İlişkisi
Vehicle.hasMany(Route, { foreignKey: 'vehicle_id' });
Route.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// 4. Rota - Durak İlişkisi
Route.hasMany(RouteStop, { foreignKey: 'route_id' });
RouteStop.belongsTo(Route, { foreignKey: 'route_id' });

// 5. İstasyon - Durak İlişkisi
Station.hasMany(RouteStop, { foreignKey: 'station_id' });
RouteStop.belongsTo(Station, { foreignKey: 'station_id', as: 'Station' }); // Explicit alias might be needed if using 'as' in query, but usually defaults to model name. 
// Wait, in controller we used { model: Station, as: 'Station' }. 
// If generic belongsTo is defined without alias, 'Station' alias works? 
// Code says: RouteStop.belongsTo(Station, { foreignKey: 'station_id' }); 
// In controller: { model: Station, as: 'Station' }. This works if we define it as such or if sequelize auto-aliases.
// Better to be explicit matches.

// Let's add the new ones:
RouteStop.belongsTo(Station, { foreignKey: 'previous_station_id', as: 'PreviousStation' });
RouteStop.belongsTo(Station, { foreignKey: 'next_station_id', as: 'NextStation' });

// 6. Araç - Kargo İlişkisi (Yeni Tablo: cargos_vehicles)
Vehicle.belongsToMany(Cargo, { through: CargoVehicle, foreignKey: 'vehicle_id' });
Cargo.belongsToMany(Vehicle, { through: CargoVehicle, foreignKey: 'cargo_id' });
Cargo.hasMany(CargoVehicle, { foreignKey: 'cargo_id' });
CargoVehicle.belongsTo(Cargo, { foreignKey: 'cargo_id' });
Vehicle.hasMany(CargoVehicle, { foreignKey: 'vehicle_id' });
CargoVehicle.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

// Modelleri dışarı aktar
module.exports = {
    sequelize,
    User,
    Station,
    Vehicle,
    Cargo,
    Route,
    RouteStop,
    CargoVehicle
};