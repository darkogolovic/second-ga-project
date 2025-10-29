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
    const user = await User.findById(req.session.user.id);

    user.cart = user.cart.filter(i => i.name !== name);
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
router.post("/remove-all", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    user.cart = []; 
    await user.save();

    res.json({ success: true, cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

const nodemailer = require("nodemailer");

router.post("/checkout", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?.id || req.session.user.id;
    if (!userId) return res.status(401).json({ success: false, error: "User not logged in" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: "User not found" });

    const total = user.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // --- Slanje email-a ---
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // npr. smtp.gmail.com
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    for (const item of user.cart) {
      const product = await Product.findOne({ name: item.name });

      if (!product) {
        return res.status(404).json({ success: false, error: `Product ${item.name} not found.` });
      }

      // Proveri da li ima dovoljno na lageru
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Not enough stock for ${item.name}. Available: ${product.quantity}kg.`,
        });
      }

      // Oduzmi kupljenu količinu
      product.quantity -= item.quantity;
      await product.save();
    }


    const itemsList = user.cart.map(i => `${i.quantity}kg ${i.name} - $${(i.price * i.quantity).toFixed(2)}`).join("\n");

    const mailOptions = {
      from: `"Piljara" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Order Confirmation",
      text: `Hi ${user.name},\n\nThank you for your order!\n\nItems:\n${itemsList}\n\nTotal: $${total.toFixed(2)}\n\nWe appreciate your business!`,
    };

    await transporter.sendMail(mailOptions);

    // isprazni korpu
    user.cart = [];
    await user.save();

    res.json({ success: true, total, cart: user.cart });
  } catch (err) {
    console.error("Error in /cart/checkout:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
