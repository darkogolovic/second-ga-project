const express = require('express');
const router = express.Router();
const Product = require('../models/product.js');
const User = require('../models/user.js');
const { isAdmin } = require('../middleware/authMiddleware.js');


router.get('/dashboard', isAdmin, async (req, res) => {
  const products = await Product.find();
  const users = await User.find();
  res.render('admin/dashboard.ejs', { products, users });
});


router.get('/add', isAdmin, (req, res) => {
  res.render('admin/addProduct.ejs');
});


router.post('/add', isAdmin, async (req, res) => {
  const { name, description, price, category, image, quantity } = req.body;
  await Product.create({ name, description, price, category, image, quantity });
  res.redirect('/admin/dashboard');
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

router.get('/users', isAdmin, async (req, res) => {
  const users = await User.find();
  res.render('admin/users.ejs', { users });
});

module.exports = router;
