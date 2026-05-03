const Role = require("../models/Role");

// Create Role
exports.createRole = async (req, res) => {
  try {
    const {
      name,
      description,
      roleId,
      avatar,
      color
    } = req.body;

    // 🔍 Check name
    const nameExists = await Role.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        message: "User Role already exists",
      });
    }

    const role = new Role({
      name,
      description,
      roleId,
      avatar,
      color
    });

    await role.save();

    res.status(201).json({
      message: "User Role created successfully",
      role,
    });
  } catch (err) {
    console.log(err);

    // 🔴 Mongo duplicate safety
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]; // name
      return res.status(400).json({
        message: `${field} already exists`,
      });
    }

    res.status(500).json({ message: "Error creating user role" });
  }
};

//Get All Roles
exports.getRoles = async (req, res) => {
  try {
    console.log("GET /roles hit");

    const roles = await Role.find();

    console.log("User Roles fetched:", roles.length);

    res.json(roles);
  } catch (err) {
    console.error("GET USER ROLES ERROR FULL:", err);
    res.status(500).json({
      message: "Error fetching user roles",
      error: err.message,
    });
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    const role = await Role.findById(roleId);

    if (!role) {
      return res.status(404).json({
        message: "User Role not found",
      });
    }

    await Role.findByIdAndDelete(roleId);

    res.status(200).json({
      message: "User Role deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting user role",
    });
  }
};

// Update Role
exports.updateRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { name, description, avatar, color } = req.body;

    // 🔴 Check duplicate (excluding current role)
    const existingRole = await Role.findOne({
      name,
      _id: { $ne: roleId },
    });

    if (existingRole) {
      return res.status(400).json({
        message: "Role name already exists",
      });
    }

    const updatedRole = await Role.findByIdAndUpdate(
      roleId,
      {
        name,
        description,
        avatar,
        color,
      },
      { new: true }, // return updated data
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "User Role not found" });
    }

    res.json({
      message: "User Role updated successfully",
      user: updatedRole,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating user role" });
  }
};
