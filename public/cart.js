const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const nodemailer = require('nodemailer');

// ➤ Dodaj u korpu (POST)
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (!req.session.cart) req.session.cart = [];

    const existingItem = req.session.cart.find(item => item._id.toString() === productId);
    if (existingItem) {
      existingItem.quantity += parseFloat(quantity);
    } else {
      req.session.cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: parseFloat(quantity),
      });
    }

    const totalItems = req.session.cart.reduce((sum, item) => sum + item.quantity, 0);
    res.json({ success: true, totalItems });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// ➤ Prikaz korpe (GET)
router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  res.render('partials/cart.ejs', { cart });
});

// ➤ Checkout (POST)
router.post('/cart/checkout', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const user = req.session.user;

    if (!cart.length) return res.status(400).json({ message: 'Cart is empty' });
    if (!user) return res.status(401).json({ message: 'You must be logged in' });

    // 1️⃣ Umanji quantity u bazi
    for (const item of cart) {
      const product = await Product.findById(item._id);
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
      }
    }

    // 2️⃣ Pošalji e-mail korisniku
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const productList = cart
      .map(
        item =>
          `<li>${item.name} - ${item.quantity} × $${item.price.toFixed(
            2
          )} = $${(item.price * item.quantity).toFixed(2)}</li>`
      )
      .join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Your Order Confirmation - PILJARA',
      html: `
        <h2>Thank you for your purchase, ${user.name}!</h2>
        <p>Your order:</p>
        <ul>${productList}</ul>
        <p><strong>Total: $${total.toFixed(2)}</strong></p>
      `,
    });

    // 3️⃣ Očisti korpu
    req.session.cart = [];
    req.session.save(() => res.status(200).json({ message: 'Order confirmed!' }));

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Error during checkout' });
  }
});

module.exports = router;
