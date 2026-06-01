const e = require("express");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: String,
    default: "Other",
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
  },
  // Stock-related fields (kept in sync from Stock records)
  currentStock: {
    type: Number,
    default: 0,
  },
  minRequired: {
    type: Number,
    default: 0,
  },
  maxCapacity: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["In Stock", "Low Stock", "Out of Stock", "Not Set"],
    default: "Not Set",
  },
  value: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });
 

module.exports = mongoose.model("Product", productSchema);