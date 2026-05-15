const User = require("../models/User");
const bcrypt = require("bcrypt");
const transporter = require("../config/mail");

// Create User
exports.createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      username,
      email,
      phone,
      password,
      roleId,
      status,
      department,
    } = req.body;

    // 🔍 Check username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // 🔍 Check email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const plainPassword = "123456"; // temporary default password

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = new User({
      firstName,
      lastName,
      username,
      email,
      phone,
      password: {
        password: hashedPassword,
        otp: "",
        isFirstLogin: true,
      },
      // roleId,
      status,
      department,
    });

    await user.save();

    // 👇 ADD EMAIL SENDING HERE
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Inventory System Login Details",

        html: `
      <h2>Welcome to Inventory System</h2>

      <p>Your account has been created successfully.</p>
        
      <p><b>Username:</b> ${username}</p>
      <p><b>Password:</b> ${plainPassword}</p>

      <p>Please change your password after first login.</p>
    `,
      });

      console.log("Email sent successfully");
    } catch (emailError) {
      console.log("Email sending failed:", emailError.message);
    }

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.log(err);

    // 🔴 Mongo duplicate safety
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]; // email or username
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ message: "Error creating user" });
  }
};

//Get All Users
// exports.getUsers = async (req, res) => {
//   try {
//     const users = await User.find();
//     res.json(users);
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: "Error fetching users" });
//   }
// };

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
      error: err.message,
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
        message: "User not found",
      });
    }

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting user",
    });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const { firstName, lastName, username, email, phone, roleId, status } =
      req.body;

    // 🔴 Check duplicate (excluding current user)
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
      _id: { $ne: userId },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username or Email already exists",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        username,
        email,
        phone,
        roleId,
        status,
      },
      { new: true }, // return updated data
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating user" });
  }
};
