const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'telente_chambers',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create tables if they don't exist
const initDatabase = async () => {
  try {
    // Users table (admin)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Blogs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt VARCHAR(500),
        image VARCHAR(255),
        status ENUM('draft', 'published') DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Testimonials table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        rating INT CHECK (rating >= 1 AND rating <= 5),
        message TEXT NOT NULL,
        approved BOOLEAN DEFAULT FALSE,
        replied BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Contacts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        replied BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    //Add password_reset table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        otp VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        attempts INT DEFAULT 0,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Check if subscribers table needs update (migration)
    try {
      // Try to select the new column. If it fails, we need to recreate the table.
      await pool.query("SELECT unsubscribe_token FROM subscribers LIMIT 1");
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Detected old subscribers table schema. Recreating table...');
        await pool.query("DROP TABLE IF EXISTS subscribers");
      }
    }

    // Subscribers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        unsubscribe_token VARCHAR(255) UNIQUE NOT NULL,
        status ENUM('subscribed', 'unsubscribed') DEFAULT 'subscribed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    const bcrypt = require('bcryptjs');
    const defaultEmail = 'oyinlola.tech@icloud.com';
    const defaultPassword = await bcrypt.hash('Admin@123!!', 10);
    
    await pool.query(
      'INSERT IGNORE INTO users (email, password) VALUES (?, ?)',
      [defaultEmail, defaultPassword]
    );

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

module.exports = { pool, initDatabase };