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
    password: String,
    otp: String,
    isFirstLogin: {
      type: Boolean,
      default: true
    } // 👈 default password
  },
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
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
  },
  avatarColor: {
    type: String,
    default: "#4361ee",
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);