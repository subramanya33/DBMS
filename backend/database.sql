CREATE TABLE admins (
    admin_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(100) NOT NULL
);

CREATE TABLE cars (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, car_name VARCHAR(255) NOT NULL, category VARCHAR(255) NOT NULL, model VARCHAR(255) NOT NULL, year INT NOT NULL, category_id INT, FOREIGN KEY (category_id) REFERENCES category (id)
);

CREATE TABLE category (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, category_name VARCHAR(255) NOT NULL
);

CREATE TABLE reviews (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, car_id INT, user_id INT, review_text TEXT, review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, performance_rating INT, comfort_rating INT, FOREIGN KEY (car_id) REFERENCES cars (id), FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, contact VARCHAR(20) NOT NULL, email VARCHAR(255) NOT NULL, address TEXT NOT NULL, password VARCHAR(255) NOT NULL, gender ENUM('male', 'female') NOT NULL, rc_no VARCHAR(255), last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, login_count INT DEFAULT 0
);