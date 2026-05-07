const mysql = require('mysql2/promise');
require('dotenv').config(); // Add this at the very top

// const database = mysql.createPool({
//     host : 'localhost',
//     user: 'root',
//     password: '12345678',
//     database: 'mymahir'
// });

const database = mysql.createPool({
    host : process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

(async () => {
    try{
        const connection = await database.getConnection();
        connection.release();
    } catch (err){
        console.error('Database connection failed');
    }
    
});

module.exports = database;