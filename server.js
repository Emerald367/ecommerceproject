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

app.get('/users/:id', async (req, res) => {
        if (req.session.userID) {
            const userDataQuery = 'SELECT UserId, EmailAddress, ShippingAddress FROM users WHERE UserId = $1'
            const result= await pool.query(userDataQuery, [req.params.id])
            res.json({ profile: result.rows[0], message: 'User Profile Received'});
        } else {
            res.status(404).send('Session not created')
        }
    })

app.post('/products', async (req, res) => {
    const productName = req.body.productName;
    const productDesc = req.body.productDesc;
    const productPrice = req.body.productPrice;
    
    const checkProductQuery = 'SELECT * FROM products WHERE LOWER(ProductName) = LOWER($1)'
    const result = await pool.query(checkProductQuery, [productName])

    if (result.rows.length > 0) {
        res.status(400).send('Product already created')
    } else {
        const query = 'INSERT INTO products (ProductName, ProductDescription, ProductPrice) VALUES ($1, $2, $3)'
        const values = [productName, productDesc, productPrice]
        try {
            await pool.query(query, values);
            res.status(200).send('Product Created');
        } catch (err) {
           console.error(err);
           res.status(500).send('Server error')
        }
    }
})


app.get('/products', async (req, res) => {
    const allProductsQuery = 'SELECT * FROM products'
    const result = await pool.query(allProductsQuery)
    if (result.rows.length > 0) {
        res.json({products: result.rows, message: 'All Products Received'})
    } else {
        res.status(404).send('No Products Found')
    }
})

app.get('/products/:id', async (req, res) => {
    const specificProductQuery = 'SELECT * FROM products WHERE ProductID = $1'
    const result = await pool.query(specificProductQuery, [req.params.id])
    if (result.rows.length > 0) {
        res.json({product: result.rows, message: 'Product Found'})
    } else {
        res.status(404).send('No Product Found')
    }
})

app.put('/products/:id', async (req, res) => {
    const id = req.params.id;
    const updatedName = req.body.updatedName;
    const updatedPrice = req.body.updatedPrice;
    const updatedDesc = req.body.updatedDesc;
    const updateProductQuery = 'UPDATE products SET ProductPrice = $1, ProductDescription = $2, ProductName = $3 WHERE ProductID = $4 RETURNING *'
    const values = [updatedPrice, updatedDesc, updatedName, id]
    const result = await pool.query(updateProductQuery, values)

    if (result.rows.length > 0) {
        res.status(200).send('Product Updated')
    } else {
        res.status(404).send('No Product Found')
    }
})

app.delete('/products/:id', async (req, res) => {
    const deleteProductQuery = 'DELETE FROM products WHERE ProductID = $1'
    const result = await pool.query(deleteProductQuery, [req.params.id])

    if (result.rowCount > 0) {
        res.status(200).send('Product Deleted')
    } else {
        res.status(404).send('No Product Found')
    }

})


app.post('/orders', async (req, res) => {
    if (req.session.userID) {

        try {
            await pool.query('BEGIN')

        const userID = req.body.userID;
        const paymentDetails = req.body.paymentDetails;

        const saltRounds = 10
        const encryptedPaymentDetails = await bcrypt.hash(paymentDetails, saltRounds)
        const paymentInfoQuery = 'INSERT INTO paymentinfo (UserID, PaymentMethodDetails) VALUES ($1, $2)'
        const paymentValue = [userID, encryptedPaymentDetails]
        await pool.query(paymentInfoQuery, paymentValue)

        const OrderDetailsQuery = 'INSERT INTO orders (UserID) VALUES ($1) RETURNING OrderID'
        const orderDetailValues = [userID]
        const result = await pool.query(OrderDetailsQuery, orderDetailValues)

        const products = req.body.products

        for (let i = 0; i < products.length; i++) {
            const productID = products[i].productID
            const quantity = products[i].quantity
            const price = products[i].price
            const orderID = result.rows[0].orderid
            const orderItemsQuery = 'INSERT INTO orderitems (ProductID, Quantity, Price, OrderID) VALUES ($1, $2, $3, $4)'
            const values = [productID, quantity, price, orderID];
            await pool.query(orderItemsQuery, values)
        }

           await pool.query('COMMIT')
        res.status(200).send('Order Created')

        } catch (err) {
            await pool.query('ROLLBACK')
            console.error(err);
        }
        
    }


})

app.get('/orders', async (req, res) => {
    
    
    const getAllOrdersQuery = 'SELECT * FROM orders JOIN orderitems ON orders.orderID = orderitems.orderID;'
    const result = await pool.query(getAllOrdersQuery);

    if (result.rows.length > 0) {
        res.json({orders: result.rows, message: 'All Orders Received'})
    } else {
        res.status(404).send('No orders created')
    }

})







module.exports = app;
























app.listen(PORT, () => console.log(`Server has started on port: ${PORT}`));

module.exports = app;