import mongoose from "mongoose";

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
    enum: ["Fruit", "Vegetable", "Other"],
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

export default mongoose.model("Product", productSchema);
