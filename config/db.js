const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,           // Database host (from environment variables)
  user: process.env.MYSQLUSER,           // Database username
  password: process.env.MYSQLPASSWORD,   // Database password
  database: process.env.MYSQLDATABASE,   // Database name
  port: process.env.MYSQLPORT || 3306,   // Default MySQL port is 3306
});
  
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed: ' + err.stack);
      return;
    }
    console.log('Connected to database.');
  });
  
  module.exports = db;