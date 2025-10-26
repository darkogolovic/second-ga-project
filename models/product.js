const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["Fruit", "Vegetable"],
    default: "Fruit",
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: "/images/default.jpg",
  },

});

const Product = mongoose.model('Product',productSchema)

module.exports= Product;
