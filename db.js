/** Database setup for BizTime. */
const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "biztime_test";
} else {
  DB_URI = "biztime";
}

let db = new Client({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  database: DB_URI,
  port: 5432
});

db.connect();

module.exports = db;
