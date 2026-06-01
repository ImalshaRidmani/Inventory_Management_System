const Stock = require("../models/Stock");
const Product = require("../models/Product");

function getSkuQuery(sku) {
  return sku ? { sku: { $regex: `^${sku.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}$`, $options: "i" } } : { sku };
}

function deriveStatus(currentStock, minRequired) {
  if (currentStock <= 0) {
    return "Out of Stock";
  }
  if (currentStock < minRequired) {
    return "Low Stock";
  }
  return "In Stock";
}

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

    // Normalize SKU to avoid duplicates due to case/whitespace
    const normalizedSku = sku ? sku.trim().toUpperCase() : sku;

    const skuExists = await Stock.findOne(getSkuQuery(normalizedSku));
    if (skuExists) {
      return res.status(400).json({
        message: "Stock item with this SKU already exists",
      });
    }

    // Always auto-calculate status based on quantity - never trust passed status
    const stockStatus = deriveStatus(currentStock, minRequired);

    console.log(`[Stock Create] SKU: ${normalizedSku}, Status: ${stockStatus}, Stock: ${currentStock} (Auto-calculated from qty=${currentStock}, minReq=${minRequired})`);

    const stock = new Stock({
      name,
      sku: normalizedSku,
      category,
      currentStock,
      minRequired,
      maxCapacity,
      status: stockStatus,
      value,
      lastUpdated: new Date(),
    });

    await stock.save();
    console.log(`[Stock Created] Saved to DB - SKU: ${stock.sku}, Stock Qty: ${stock.currentStock}, Status: ${stock.status}`);

    // If a product exists with this SKU, sync stock info to product (non-blocking)
    if (stock && stock.sku) {
      try {
        const query = getSkuQuery(stock.sku);
        console.log(`[Product Sync] Searching for product with SKU: ${stock.sku}`);
        
        const updatePayload = {
          currentStock: stock.currentStock,
          minRequired: stock.minRequired,
          maxCapacity: stock.maxCapacity,
          status: stock.status,
          value: stock.value,
        };
        
        console.log(`[Product Sync] Update payload:`, updatePayload);
        
        const updatedProduct = await Product.findOneAndUpdate(
          query,
          updatePayload,
          { new: true }
        );
        
        if (updatedProduct) {
          console.log(`[Product Sync] ✅ Product updated - Stock Qty: ${updatedProduct.currentStock}, Status: ${updatedProduct.status}`);
        } else {
          console.warn(`[Product Sync] ❌ No product found for SKU: ${stock.sku}`);
        }
      } catch (syncErr) {
        console.error('Error syncing product after stock create (non-critical):', syncErr.message);
        // Don't return error - stock creation was successful
      }
    }

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

    const products = await Product.find().lean();
    const stocks = await Stock.find().lean();

    const stockBySku = stocks.reduce((acc, stock) => {
      const key = stock.sku ? stock.sku.trim().toUpperCase() : '';
      acc[key] = stock;
      return acc;
    }, {});

    const combinedProducts = products.map((product) => {
      const productSkuKey = product.sku ? product.sku.trim().toUpperCase() : '';
      const stock = stockBySku[productSkuKey];
      return {
        ...product,
        name: product.name,
        category: stock?.category || product.category || "Other",
        currentStock: stock?.currentStock ?? 0,
        minRequired: stock?.minRequired ?? 0,
        maxCapacity: stock?.maxCapacity ?? 0,
        status: stock?.status ?? "Not Set",
        lastUpdated: stock?.lastUpdated ?? null,
        value: stock?.value ?? 0,
        stockExists: Boolean(stock),
        _stockId: stock?._id ?? null,
      };
    });

    const productSkus = new Set(products.map((product) => (product.sku ? product.sku.trim().toUpperCase() : '')));
    const unmatchedStocks = stocks
      .filter((stock) => !productSkus.has(stock.sku ? stock.sku.trim().toUpperCase() : ''))
      .map((stock) => ({
        name: stock.name || "Unknown Product",
        sku: stock.sku,
        category: stock.category,
        currentStock: stock.currentStock,
        minRequired: stock.minRequired,
        maxCapacity: stock.maxCapacity,
        status: stock.status,
        lastUpdated: stock.lastUpdated,
        value: stock.value,
        stockExists: true,
        _stockId: stock._id,
        _id: stock._id,
      }));

    const combined = [...combinedProducts, ...unmatchedStocks];

    console.log("Stocks fetched:", combined.length);

    res.json(combined);
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

    console.log(`[Delete Stock] Deleting stock: ${stock.name} (SKU: ${stock.sku})`);

    const deletedStock = await Stock.findByIdAndDelete(stockId);

    if (deletedStock) {
      console.log(`[Delete Stock] ✅ Stock deleted successfully - ID: ${stockId}, SKU: ${stock.sku}`);
      res.status(200).json({
        message: "Stock item deleted successfully",
      });
    } else {
      res.status(404).json({
        message: "Stock item not found during deletion",
      });
    }
  } catch (err) {
    console.error('[Delete Stock] Error:', err);
    res.status(500).json({
      message: "Error deleting stock item",
      error: err.message,
    });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  try {
    const stockId = req.params.id;
    const { name, sku, category, currentStock, minRequired, maxCapacity, status, value } = req.body;

    // Normalize SKU
    const normalizedSku = sku ? sku.trim().toUpperCase() : sku;

    // 🔴 Check duplicate (excluding current stock by sku)
    const existingStock = await Stock.findOne({
      sku: normalizedSku,
      _id: { $ne: stockId },
    });

    if (existingStock) {
      return res.status(400).json({
        message: "Stock item with this SKU already exists",
      });
    }

    // Always auto-calculate status based on quantity - never trust passed status
    const stockStatus = deriveStatus(currentStock, minRequired);

    console.log(`[Stock Update] ID: ${stockId}, SKU: ${normalizedSku}, Status: ${stockStatus}, Stock: ${currentStock} (Auto-calculated from qty=${currentStock}, minReq=${minRequired})`);

    const updatedStock = await Stock.findByIdAndUpdate(
      stockId,
      {
        name,
        sku: normalizedSku,
        category,
        currentStock,
        minRequired,
        maxCapacity,
        status: stockStatus,
        value,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!updatedStock) {
      return res.status(404).json({ message: "Stock item not found" });
    }

    console.log(`[Stock Updated] Saved to DB - ID: ${stockId}, Stock Qty: ${updatedStock.currentStock}, Status: ${updatedStock.status}`);

    // Sync updated stock to product (non-blocking)
    if (updatedStock && updatedStock.sku) {
      try {
        const query = getSkuQuery(updatedStock.sku.trim().toUpperCase());
        console.log(`[Product Sync] Searching for product with SKU: ${updatedStock.sku}`);
        
        const updatePayload = {
          currentStock: updatedStock.currentStock,
          minRequired: updatedStock.minRequired,
          maxCapacity: updatedStock.maxCapacity,
          status: updatedStock.status,
          value: updatedStock.value,
        };
        
        console.log(`[Product Sync] Update payload:`, updatePayload);
        
        const updatedProduct = await Product.findOneAndUpdate(
          query,
          updatePayload,
          { new: true }
        );
        
        if (updatedProduct) {
          console.log(`[Product Sync] ✅ Product updated - Stock Qty: ${updatedProduct.currentStock}, Status: ${updatedProduct.status}`);
        } else {
          console.warn(`[Product Sync] ❌ No product found for SKU: ${updatedStock.sku}`);
        }
      } catch (syncErr) {
        console.error('Error syncing product after stock update (non-critical):', syncErr.message);
        // Don't return error - stock update was successful
      }
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
