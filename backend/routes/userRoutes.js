const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.post("/login", userController.login);
router.put("/:id/change-password", userController.changePassword);
router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.delete("/:id", userController.deleteUser);
router.put("/:id", userController.updateUser);

module.exports = router;