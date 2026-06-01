const e = require("express");
const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema({
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
    currentStock: {
      type: Number,
      required: true,
    },
    minRequired: {
      type: Number,
      default: 2,
    },
    maxCapacity: {
      type: Number,
      default: 100,
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock", "Not Set"],
      default: "Not Set",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    value: {
      type: Number,
      required: true,
    },
}, { timestamps: true });
 

module.exports = mongoose.model("Stock", stockSchema);