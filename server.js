const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db')
const env = require('dotenv').config
const {pool} = require('./db.js')
const PORT = 5000;




























app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));

module.exports = app;