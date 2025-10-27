const express = require('express');
const router = express.Router();
const Product = require('../models/product.js');
const User = require('../models/user.js');

router.get('/',async (req,res)=>{
    const products = await Product.find();
    console.log(products)
    res.render('products/allProducts.ejs',{
        products
    })

})




module.exports = router;