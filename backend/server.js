const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
// const userRoutes = require("./routes/userRoutes");
const User = require("./models/User");

const app = express();

// connect database
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// routes
// app.use("/api/users", userRoutes);



app.get("/create-test-user", async (req, res) => {
  try {
    const user = new User({
      username: "testuser1",
      email: "test1@mail.com",
      password: "123456"
    });

    await user.save();

    res.send("User created successfully");
  } catch (err) {
    console.log(err);
    res.send("Error creating user");
  }
});

// port
const PORT = process.env.PORT || 5000;

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});