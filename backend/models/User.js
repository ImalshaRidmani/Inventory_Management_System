const e = require("express");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    default: "123456", // 👈 default password
  },
  roleId: {
    type: Number,
    enum: [1, 2, 3, 4], // 1-Admin, 2-Manager, 3-Employee, 4-Viwer
  },
  status: {
    type: String
  },
  department: {
    type: String,
    default: "General",
  },
  isFirstLogin: {
    type: Boolean,
    default: true, // 👈 important
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);