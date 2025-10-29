const express = require('express');
const router = express.Router();
const Product = require('../models/product.js');
const User = require('../models/user.js');
const { isAdmin } = require('../middleware/authMiddleware.js');
const { cloudinary } = require('../config/cloudinary.js');
const upload = require('../config/multer.js');
const fs = require('fs')


router.get('/dashboard', isAdmin, async (req, res) => {
  const products = await Product.find();
  const users = await User.find();
  res.render('admin/dashboard.ejs', { products, users });
});


router.get('/add', isAdmin, (req, res) => {
  res.render('admin/addProduct.ejs');
});


router.post('/add', isAdmin,upload.single('image'), async (req, res) => {
  try{
    
  const { name, description, price, category,quantity, } = req.body;
  const uploadResult = await cloudinary.uploader.upload(req.file.path);
   const newProduct = new Product({
      name,
      description,
      price,
      quantity,
      category,
      image: uploadResult.secure_url
    });
    newProduct.save()
    fs.unlinkSync(req.file.path);
    res.redirect('/admin/dashboard')
  } catch(error){
    console.error(error);
    res.status(500).send('Errod adding product');
  }
});


router.get('/edit/:id', isAdmin, async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.render('admin/editProduct.ejs', { product });
});


router.put('/edit/:id', isAdmin, async (req, res) => {
    
  const { name, description, price, category, quantity } = req.body;
  await Product.findByIdAndUpdate(req.params.id, { name, description, price, category, quantity });
  res.redirect('/admin/dashboard');
});


router.get('/delete/:id', isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin/dashboard');
});





module.exports = router;
