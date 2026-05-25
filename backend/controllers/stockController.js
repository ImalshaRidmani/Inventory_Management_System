const Stock = require("../models/Stock");

// Create Stock
exports.createStock = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      currentStock,
      minRequired,
      maxCapacity,
      status,
      value,
    } = req.body;

    // 🔍 Check name
    const nameExists = await Stock.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        message: "Stock item already exists",
      });
    }

    const stock = new Stock({
      name,
      sku,
      category,
      currentStock,
      minRequired,
      maxCapacity,
      status,
      value,
    });

    await stock.save();

    res.status(201).json({
      message: "Stock item created successfully",
      stock,
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

    res.status(500).json({ message: "Error creating stock item" });
  }
};

//Get All Stocks
exports.getStocks = async (req, res) => {
  try {
    console.log("GET /stocks hit");

    const stocks = await Stock.find();

    console.log("Stocks fetched:", stocks.length);

    res.json(stocks);
  } catch (err) {
    console.error("GET STOCKS ERROR FULL:", err);
    res.status(500).json({
      message: "Error fetching stocks",
      error: err.message,
    });
  }
};

// Delete Stock
exports.deleteStock = async (req, res) => {
  try {
    const stockId = req.params.id;

    const stock = await Stock.findById(stockId);

    if (!stock) {
      return res.status(404).json({
        message: "Stock item not found",
      });
    }

    await Stock.findByIdAndDelete(stockId);

    res.status(200).json({
      message: "Stock item deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting stock item",
    });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  try {
    const stockId = req.params.id;
    const { name, sku, category, currentStock, minRequired, maxCapacity, status, value } =
      req.body;

    // 🔴 Check duplicate (excluding current product)
    const existingStock = await Stock.findOne({
      name,
      _id: { $ne: stockId },
    });

    if (existingStock) {
      return res.status(400).json({
        message: "Stock item name already exists",
      });
    }

    const updatedStock = await Stock.findByIdAndUpdate(
      stockId,
      {
        name,
        sku,
        category,
        currentStock,
        minRequired,
        maxCapacity,
        status,
        value,
      },
      { new: true },
    );

    if (!updatedStock) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    res.json({
      message: "Stock item updated successfully",
      stock: updatedStock,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating stock item" });
  }
};

// Delete Stock
exports.deleteStock = async (req, res) => {
  try {
    const stockId = req.params.id;
    const stock = await Stock.findById(stockId);

    if (!stock) {
      return res.status(404).json({
        message: "Stock item not found",
      });
    }

    await Stock.findByIdAndDelete(stockId);

    res.status(200).json({
      message: "Stock item deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting stock item",
    });
  }
};
