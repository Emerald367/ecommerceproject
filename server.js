const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db')
const env = require('dotenv').config
const {pool, connectToDb} = require('./db.js')
const bcrypt = require('bcrypt')
const expSession = require('express-session')
app.use(expSession({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}))

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

app.post('/login', async (req, res) => {
    const userID = req.body.userID;
    const password = req.body.password;

    const getPasswordQuery = 'SELECT * FROM users WHERE UserID = $1';

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let result = await pool.query(getPasswordQuery, [userID]);

    if (result.rows.length > 0) {
        let hashedPasswordFromDB = result.rows[0].hashedpassword;
        let isMatch = await bcrypt.compare(password, hashedPasswordFromDB);
        let user = result.rows[0]
        delete user.hashedpassword
        console.log(user)
        if (isMatch) {
         req.session.userID = user.userid
         res.status(200).send('Matching Passwords')
        } else {
         res.status(403).send('Incorrect Password')
        }
    } else {
        res.status(404).send('User not found');
    }


    });










module.exports = app;
























app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));

module.exports = app;