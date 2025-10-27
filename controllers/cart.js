const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const nodemailer = require('nodemailer')


router.post('/add',async (req,res)=>{
    const { productId, quantity } = req.body;
  const product = await Product.findById(productId);

  if (!product) return res.status(404).send('Product not found');

  if (!req.session.cart) req.session.cart = [];

  const existingItem = req.session.cart.find(item => item.product._id.toString() === productId);

  if (existingItem) {
    existingItem.quantity += parseFloat(quantity);
  } else {
    req.session.cart.push({ product, quantity: parseFloat(quantity) });
  }
  const totalItems = req.session.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    res.json({ success: true, totalItems });
})

router.get('/add/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Ako session.cart ne postoji, napravi novi niz
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Da li proizvod već postoji u korpi?
    const existingItem = req.session.cart.find(item => item._id.toString() === product._id.toString());

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      req.session.cart.push({
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: product.quantity
      });
    }

    // Sačuvaj session 
    req.session.save(() => {
      req.session.save(() => res.status(200).json({ message: 'Order confirmed!' }));
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding to cart');
  }
});

router.get('/', (req, res) => {
  const cart = req.session.cart || [];
  res.render('partials/cart.ejs', { cart });
});




// ✅ Checkout ruta
router.post('/checkout', async (req, res) => {
  try {
    const cart = req.session.cart || [];
    const user = req.session.user;

    if (!cart.length) {
      return res.status(400).send('Cart is empty');
    }

    if (!user) {
      return res.status(401).send('You must be logged in to checkout');
    }

    // 🔹 1. Umanji quantity u bazi
    for (const item of cart) {
      const product = await Product.findById(item._id);
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
      }
    }

    // 🔹 2. Pošalji e-mail korisniku
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

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: user.email,
      subject: 'Your Order Confirmation - PILJARA',
      html: `
        <h2>Thank you for your purchase, ${user.name}!</h2>
        <p>Here is a summary of your order:</p>
        <ul>${productList}</ul>
        <p><strong>Total: $${total.toFixed(2)}</strong></p>
        <p>We’ll notify you when your order ships.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    // 🔹 3. Očisti korpu
    req.session.cart = [];
    req.session.save(() => {
      res.redirect('/');
    });

  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).send('Error during checkout');
  }
});





module.exports = router;