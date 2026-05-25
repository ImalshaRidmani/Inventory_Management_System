const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockController");

router.get("/", stockController.getStocks);
router.post("/", stockController.createStock);
router.delete("/:id", stockController.deleteStock);
router.put("/:id", stockController.updateStock);

module.exports = router;