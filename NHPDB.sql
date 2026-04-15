-- NHP DB

CREATE DATABASE IF NOT EXISTS nhp_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE nhp_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    storage_used_bytes BIGINT DEFAULT 0,
    INDEX idx_email (email),
    INDEX idx_username (username)
) ENGINE=InnoDB;

-- Search logs table
CREATE TABLE IF NOT EXISTS search_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    query VARCHAR(1000) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    results_count INT DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Downloads table
CREATE TABLE IF NOT EXISTS downloads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_url VARCHAR(2048),
    file_size BIGINT DEFAULT 0,
    file_hash VARCHAR(64),
    mime_type VARCHAR(100),
    download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('completed', 'failed', 'in_progress') DEFAULT 'in_progress',
    INDEX idx_user_id (user_id),
    INDEX idx_download_date (download_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- URL safety cache
CREATE TABLE IF NOT EXISTS url_safety_cache (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2048) UNIQUE NOT NULL,
    is_safe BOOLEAN DEFAULT TRUE,
    risk_score INT DEFAULT 0,
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
    warnings TEXT,
    INDEX idx_url (url(255)),
    INDEX idx_last_checked (last_checked)
) ENGINE=InnoDB;

-- NHP Database - Customers table (from assembly code)
CREATE TABLE IF NOT EXISTS nhp_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    age INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- NHP Database - Sellers table (from assembly code)
CREATE TABLE IF NOT EXISTS nhp_sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    food VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    description TEXT,
    tags VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Browser history table
CREATE TABLE IF NOT EXISTS history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(2048) NOT NULL,
    title VARCHAR(255),
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    visit_count INT DEFAULT 1,
    INDEX idx_user_id (user_id),
    INDEX idx_visit_date (visit_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert sample data into NHP tables
INSERT INTO nhp_customers (name, country, city, age) VALUES
('Rahul', 'India', 'Mumbai', 25),
('Alice', 'USA', 'New York', 30),
('Wang Li', 'China', 'Beijing', 28),
('Carlos', 'Brazil', 'Sao Paulo', 35),
('Priya', 'India', 'Delhi', 22),
('James', 'UK', 'London', 40),
('Fatima', 'UAE', 'Dubai', 27),
('Yuki', 'Japan', 'Tokyo', 33);

INSERT INTO nhp_sellers (food, price, stock) VALUES
('Pizza', 250.00, 50),
('Burger', 120.00, 80),
('Biryani', 180.00, 30),
('Pasta', 200.00, 45),
('Dosa', 60.00, 100),
('Sushi', 350.00, 20),
('Tacos', 150.00, 60),
('Noodles', 90.00, 75);

-- Create admin user (password: admin123)
-- Password hash generated with: password_hash('admin123', PASSWORD_BCRYPT)
INSERT INTO users (username, email, password) VALUES
('admin', 'admin@nhp.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- Create indexes for performance
CREATE INDEX idx_search_query ON search_logs(query(255));
CREATE INDEX idx_url_safety ON url_safety_cache(is_safe, risk_score);

-- Views for analytics
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    u.storage_used_bytes,
    COUNT(DISTINCT s.id) as total_searches,
    COUNT(DISTINCT d.id) as total_downloads,
    COUNT(DISTINCT b.id) as total_bookmarks,
    MAX(s.timestamp) as last_search_date,
    MAX(d.download_date) as last_download_date
FROM users u
LEFT JOIN search_logs s ON u.id = s.user_id
LEFT JOIN downloads d ON u.id = d.user_id
LEFT JOIN bookmarks b ON u.id = b.user_id
GROUP BY u.id, u.username, u.email, u.storage_used_bytes;

-- View for popular searches
CREATE OR REPLACE VIEW popular_searches AS
SELECT 
    query,
    COUNT(*) as search_count,
    MAX(timestamp) as last_searched
FROM search_logs
GROUP BY query
ORDER BY search_count DESC
LIMIT 100;

-- Stored procedure to clean old data
DELIMITER //

CREATE PROCEDURE clean_old_data()
BEGIN
    -- Delete search logs older than 90 days
    DELETE FROM search_logs 
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Delete expired sessions
    DELETE FROM sessions 
    WHERE expires_at < NOW();
    
    -- Delete old URL safety cache (older than 7 days)
    DELETE FROM url_safety_cache 
    WHERE last_checked < DATE_SUB(NOW(), INTERVAL 7 DAY);
    
    -- Optimize tables
    OPTIMIZE TABLE search_logs, sessions, url_safety_cache;
END //

DELIMITER ;

-- Event to run cleanup daily
CREATE EVENT IF NOT EXISTS daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO CALL clean_old_data();

SHOW TABLES;
SELECT 'Database nhp_db created successfully!' AS Status;
