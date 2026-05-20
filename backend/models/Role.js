const e = require("express");
const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  // roleId: {
  //   type: Number,
  //   enum: [1, 2, 3, 4], // 1-Admin, 2-Manager, 3-Employee, 4-Viewer
  // },
  avatar: {
    type: String,
    default: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
  },
  color: {
    type: String,
    default: "#000000",
  },
  permissions: {
    type: [String],
    default: [],
  },
}, { timestamps: true });
 

module.exports = mongoose.model("Role", roleSchema);