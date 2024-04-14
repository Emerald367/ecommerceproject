const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db')
const env = require('dotenv').config
const {pool} = require('./db.js')
const bcrypt = require('bcrypt')
const PORT = 5000;


app.post('/register', async (req, res) => {
    const password = req.body.password;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    bcrypt.hash(password);
    const query = 
})



























app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));

module.exports = app;