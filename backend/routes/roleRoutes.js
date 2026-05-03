const express = require("express");
const router = express.Router();
const roleController = require("../controllers/roleController");

router.get("/", roleController.getRoles);
router.post("/", roleController.createRole);
router.delete("/:id", roleController.deleteRole);
router.put("/:id", roleController.updateRole);

module.exports = router;