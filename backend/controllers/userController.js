const User = require("../models/User");

// Create User
exports.createUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, phone, password, roleId, status, department } = req.body;

    // 🔍 Check username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        message: "Username already exists"
      });
    }

    // 🔍 Check email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      roleId,
      status,
      department
    });

    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (err) {
    console.log(err);

    // 🔴 Mongo duplicate safety
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]; // email or username
      return res.status(400).json({
        message: `${field} already exists`
      });
    }

    res.status(500).json({ message: "Error creating user" });
  }
};

//Get All Users
exports.getUsers = async (req, res) => {
  try {
    console.log("GET /users hit");
    
    const users = await User.find();

    console.log("Users fetched:", users.length);

    res.json(users);
  } catch (err) {
    console.error("GET USERS ERROR FULL:", err);
    res.status(500).json({ 
      message: "Error fetching users",
      error: err.message 
    });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting user"
    });
  }
};
