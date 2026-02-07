CREATE DATABASE IF NOT EXISTS kargo 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE kargo;

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '0000';

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, 
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL, 
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_center BOOLEAN DEFAULT FALSE 
);

CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plate_number VARCHAR(20) NOT NULL, 
    capacity_kg INT NOT NULL, 
    base_cost DECIMAL(10, 2) DEFAULT 0,
    fuel_cost_per_km DECIMAL(10, 2) DEFAULT 1.0, 
    is_rental BOOLEAN DEFAULT FALSE, 
    status ENUM('active', 'maintenance') DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS cargos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, 
    station_id INT,
    weight_kg INT NOT NULL,
    status ENUM('pending', 'planned', 'delivered') DEFAULT 'pending',
    request_date DATE DEFAULT (CURRENT_DATE), 
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (station_id) REFERENCES stations(id)
);

CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    route_date DATE,
    total_distance_km DECIMAL(10, 2),
    total_cost DECIMAL(10, 2), 
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS cargos_vehicles(
	id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id INT,
    cargo_id INT , 
    route_date date,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

CREATE TABLE IF NOT EXISTS route_stops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT,
    station_id INT,
    start_station_id INT,
    previous_station_id INT,
    next_station_id INT,
    vehicle_id INT,
    visit_order INT NOT NULL,
    operation_type ENUM('pickup', 'dropoff', 'none') DEFAULT 'pickup', 
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (station_id) REFERENCES stations(id),
    FOREIGN KEY (start_station_id) REFERENCES stations(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (previous_station_id) REFERENCES stations(id),
    FOREIGN KEY (next_station_id) REFERENCES stations(id)
);

/* Örnek Veriler (İsteğe Bağlı) */

/*
INSERT INTO stations (name, latitude, longitude, is_center) VALUES 
('Kocaeli Üniversitesi (Merkez)', 40.8222, 29.9231, TRUE),
('Başiskele', 40.7180, 29.9320, FALSE),
('Çayırova', 40.8170, 29.3750, FALSE),
('Darıca', 40.7740, 29.4050, FALSE),
('Derince', 40.7550, 29.8320, FALSE),
('Dilovası', 40.7870, 29.5440, FALSE),
('Gebze', 40.8020, 29.4300, FALSE),
('Gölcük', 40.7160, 29.8210, FALSE),
('Kandıra', 41.0710, 30.1500, FALSE),
('Karamürsel', 40.6920, 29.6150, FALSE),
('Kartepe', 40.7530, 30.0160, FALSE),
('Körfez', 40.7710, 29.7360, FALSE),
('İzmit', 40.7650, 29.9400, FALSE);

INSERT INTO vehicles (plate_number, capacity_kg, base_cost, is_rental) VALUES 
('41 SABIT 01', 500, 0, FALSE),
('41 SABIT 02', 750, 0, FALSE),
('41 SABIT 03', 1000, 0, FALSE);
*/
