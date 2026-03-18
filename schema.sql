CREATE DATABASE IF NOT EXISTS tripgodb;
USE tripgodb;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    trip_points INT DEFAULT 0
);

-- Cars Table
CREATE TABLE IF NOT EXISTS cars (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(100),
    location VARCHAR(255),
    price_per_day INT,
    fuel_type VARCHAR(50),
    status VARCHAR(50),
    image_url TEXT,
    owner_name VARCHAR(255),
    owner_email VARCHAR(255),
    transmission VARCHAR(50),
    seating INT,
    luggage INT,
    refundable_deposit INT,
    allow_handover BOOLEAN,
    fuel_charges_included BOOLEAN,
    nearby_hub VARCHAR(255)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT,
    user_id BIGINT,
    start_date DATE,
    end_date DATE,
    total_price INT,
    status VARCHAR(50),
    destination VARCHAR(255),
    pickup_location VARCHAR(255)
);

-- Messages Table (Notifications)
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    subject VARCHAR(255),
    body TEXT,
    timestamp DATETIME,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50),
    car_name VARCHAR(255),
    start_date VARCHAR(100),
    end_date VARCHAR(100),
    price VARCHAR(100),
    location VARCHAR(255),
    origin VARCHAR(255),
    destination VARCHAR(255)
);

-- Handovers Table
CREATE TABLE IF NOT EXISTS handovers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT,
    car_id BIGINT,
    user_id BIGINT,
    taker_id BIGINT,
    taker_name VARCHAR(255),
    status VARCHAR(50),
    pickup_location VARCHAR(255),
    destination VARCHAR(255),
    pickup_date VARCHAR(100),
    return_date VARCHAR(100),
    owner_email VARCHAR(255),
    renter_email VARCHAR(255),
    car_model VARCHAR(255)
);

-- Listed Cars Table (for many-to-many associations if needed)
CREATE TABLE IF NOT EXISTS listed_cars (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    car_id BIGINT,
    user_id BIGINT
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    type VARCHAR(50),
    amount INT,
    points_earned INT,
    description TEXT,
    timestamp DATETIME
);
