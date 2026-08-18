//db.js is the bridge between express and postgresql
const { Pool } = require("pg") //importing PostgreSQL's Pool object.
require("dotenv").config() //loading .env

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});
module.exports = pool; //return pool or Export the pool object so other files can use it

