const express = require("express");
const router = express.Router();
const Product = require("../models/product");
const User = require("../models/user");
const { isAuthenticated } = require("../middleware/authMiddleware");


router.post('/add', async (req, res) => {
  try {
    // Ako korisnik nije ulogovan, vrati grešku
    if (!req.session.user) {
      return res.status(401).json({ error: 'You must be logged in to add to cart' });
    }

    const { productId, quantity } = req.body;

    const user = await User.findById(req.session.user.id);
   
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingItem = user.cart.find(item => item.name === product.name);

    if (existingItem) {
      existingItem.quantity += parseFloat(quantity);
    } else {
      user.cart.push({
        name: product.name,
        price: product.price,
        quantity: parseFloat(quantity)
      });
    }

    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



router.get("/", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.json({ cart: user.cart });
});


router.post("/update", isAuthenticated, async (req, res) => {
  try {
    const { name, quantity } = req.body;
    const user = await User.findById(req.session.user._id);

    const item = user.cart.find(i => i.name === name);
    if (!item) return res.status(404).json({ success: false });

    item.quantity = parseFloat(quantity);
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


router.post("/remove", isAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.session.user._id);

    user.cart = user.cart.filter(i => i.name !== name);
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
