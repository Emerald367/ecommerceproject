const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db')
const env = require('dotenv').config
const {pool, connectToDb} = require('./db.js')
const bcrypt = require('bcrypt')
const PORT = 5000;

connectToDb()
    .then(serverTime => console.log(`Connected to DB at ${serverTime}`))
    .catch(err => console.error('Failed to connect to DB', err));


app.post('/register', async (req, res) => {
    const email = req.body.email;
    const shippingAddress = req.body.shippingAddress;
    const password = req.body.password;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
   
    checkEmailQuery = 'SELECT * FROM users WHERE EmailAddress = $1';
    const result = await pool.query(checkEmailQuery, [email]);

    if (result.rows.length > 0) {  
    res.status(400).send('Email is already in use');  
   } else {  
    const query = 'INSERT INTO users (HashedPassword, EmailAddress, ShippingAddress) VALUES ($1, $2, $3)'  
    const values = [hashedPassword, email, shippingAddress];  
    try {  
        await pool.query(query, values);  
        res.status(200).send('Registration Successful');  
    } catch (err) {  
        console.error(err);  
        res.status(500).send('Server error');  
    }  
}
});


module.exports = app;
























app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));

module.exports = app;