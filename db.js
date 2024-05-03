const { Pool } = require('pg');
const env = require('dotenv').config()
const pool = new Pool({    
   connectionString: process.env.CONNECTION_STRING,
   ssl: {
      rejectUnauthorized: false
   }
});
 

function connectToDb() {
    return new Promise((resolve, reject) => {
        pool.query('SELECT NOW()', (err, res) => {
            if(err) {
                console.log('Error connecting to the database', err);
                reject(err);
            } else {
                console.log('Connection Successful, Server Time:', res.rows[0].now);
                resolve(res.rows[0].now);
            }
        });
    });
}

module.exports = {connectToDb, pool};