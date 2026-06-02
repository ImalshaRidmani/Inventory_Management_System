const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

    // Generate avatar color
    const colors = [
      "#4361ee",
      "#7209b7",
      "#4cc9f0",
      "#f72585",
      "#ff9e00",
      "#2ecc71",
      "#3498db",
      "#e74c3c",
      "#9b59b6",
      "#e67e22",
    ];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

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
      roleId,
      status,
      department,
      avatarColor,
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

    const users = await User.find().populate("roleId", "name color description");

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

// 🔐 LOGIN User
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password required",
      });
    }

    // Find user by username
    const user = await User.findOne({ username }).populate("roleId");

    if (!user) {
      console.log(`❌ Login failed - User not found: ${username}`);
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password.password
    );

    if (!isPasswordValid) {
      console.log(`❌ Login failed - Wrong password for: ${username}`);
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        email: user.email,
        roleId: user.roleId?._id,
        roleName: user.roleId?.name,
      },
      process.env.JWT_SECRET || "your_secret_key_change_in_env",
      { expiresIn: "24h" }
    );

    console.log(`✅ Login successful - User: ${username}`);

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roleName: user.roleId?.name,
        department: user.department,
        avatarColor: user.avatarColor,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Error during login" });
  }
};

// 🔐 CHANGE PASSWORD (First Login)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Current password and new password required",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password.password
    );

    if (!isPasswordValid) {
      console.log(`❌ Change password failed - Wrong current password for: ${user.username}`);
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark first login as false
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        password: {
          password: hashedPassword,
          otp: "",
          isFirstLogin: false,
        },
        isFirstLogin: false,
      },
      { new: true }
    );

    console.log(`✅ Password changed successfully - User: ${user.username}`);

    res.json({
      message: "Password changed successfully",
      user: {
        userId: updatedUser._id,
        username: updatedUser.username,
        isFirstLogin: false,
      },
    });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Error changing password" });
  }
};
