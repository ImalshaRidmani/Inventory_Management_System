const e = require("express");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    default: "Other",
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  minThreshold:{
    type: Number,
    default: 2,
  },
  description: {
    type: String,
  },
}, { timestamps: true });
 

module.exports = mongoose.model("Product", productSchema);