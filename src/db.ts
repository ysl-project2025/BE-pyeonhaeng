const dotenv = require('dotenv');
dotenv.config()
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  database: 'pyeonhaeng',
  dateStrings: true,
});

module.exports = connection;