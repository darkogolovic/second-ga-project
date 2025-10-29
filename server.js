const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path')
const authController = require('./controllers/auth.js');
const adminController = require('./controllers/admin.js')
const Product = require('./models/product.js')
const productController = require('./controllers/products.js')
const cartController = require('./controllers/cart.js')


//midlleware

app.use(express.static(path.join(__dirname, 'public')));
const port = process.env.PORT ? process.env.PORT : '3000';
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


app.get('/', async (req,res)=>{
  const products = await Product.find();
    res.render('index.ejs',{
      products
    })
})
app.use('/',authController)
app.use('/admin',adminController)
app.use('/products',productController)
app.use('/cart',cartController)

app.listen(port,()=>{
    console.log(`Server running on port: ${port}`)
})