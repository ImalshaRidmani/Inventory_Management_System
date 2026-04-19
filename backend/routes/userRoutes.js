const express = require("express");
const router = express.Router();
const User = require("../models/User");

// create user
router.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// get users
router.get("/", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

module.exports = router;