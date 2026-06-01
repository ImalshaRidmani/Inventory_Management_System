const Product = require("../models/Product");
const Stock = require("../models/Stock");

function getSkuQuery(sku) {
  return sku ? { sku: { $regex: `^${sku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } } : { sku };
}

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      price,
      description
    } = req.body;

    // Normalize SKU to avoid duplicates due to case/whitespace
    const normalizedSku = sku ? sku.trim().toUpperCase() : sku;

    // 🔍 Check sku (case-insensitive)
    const skuExists = await Product.findOne(getSkuQuery(normalizedSku));
    if (skuExists) {
      return res.status(400).json({
        message: "Product with this SKU already exists",
      });
    }

    // 🔍 Check name
    const nameExists = await Product.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        message: "Product already exists",
      });
    }

    const product = new Product({
      name,
      sku: normalizedSku,
      category,
      price,
      description,
      // ensure stock-related fields are initialized
      currentStock: 0,
      minRequired: 0,
      maxCapacity: 0,
      status: 'Not Set',
      value: 0,
    });

    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
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

    res.status(500).json({ message: "Error creating product" });
  }
};

//Get All Products
exports.getProducts = async (req, res) => {
  try {
    console.log("GET /products hit");

    const products = await Product.find();

    console.log("Products fetched:", products.length);
    products.forEach(p => {
      console.log(`  - ${p.name} (SKU: ${p.sku}) Status: ${p.status}`);
    });

    res.json(products);
  } catch (err) {
    console.error("GET PRODUCTS ERROR FULL:", err);
    res.status(500).json({
      message: "Error fetching products",
      error: err.message,
    });
  }
};

// Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    console.log(`[Delete Product] Checking if product can be deleted: ${product.name} (SKU: ${product.sku})`);

    // Check if associated stock record exists (prevent deletion if stock exists)
    if (product.sku) {
      const normalizedSku = product.sku.trim().toUpperCase();
      
      try {
        // Try exact match first
        let existingStock = await Stock.findOne({ sku: normalizedSku });
        
        // If exact match fails, try case-insensitive regex match
        if (!existingStock) {
          const skuQuery = { sku: { $regex: `^${normalizedSku.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } };
          existingStock = await Stock.findOne(skuQuery);
        }
        
        if (existingStock) {
          console.log(`[Delete Product] ❌ Cannot delete - Stock record exists for SKU: ${normalizedSku}, Stock ID: ${existingStock._id}`);
          return res.status(400).json({
            message: `Cannot delete product "${product.name}" because stock records exist for it. Delete the stock first.`,
            error: "STOCK_EXISTS",
          });
        }
      } catch (stockErr) {
        console.error(`[Delete Product] ⚠️ Error checking stock for SKU ${normalizedSku}:`, stockErr.message);
        return res.status(500).json({
          message: "Error checking associated stock",
          error: stockErr.message,
        });
      }
    }

    // Delete the product (only if no stock exists)
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (deletedProduct) {
      console.log(`[Delete Product] ✅ Product deleted successfully - ID: ${productId}, Name: ${product.name}`);
      res.status(200).json({
        message: "Product deleted successfully",
      });
    } else {
      res.status(404).json({
        message: "Product not found during deletion",
      });
    }
  } catch (err) {
    console.error('[Delete Product] Error:', err);
    res.status(500).json({
      message: "Error deleting product",
      error: err.message,
    });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, sku, category, price, description } = req.body;

    // Normalize SKU
    const normalizedSku = sku ? sku.trim().toUpperCase() : sku;

    // 🔴 Check duplicate (excluding current product)
    const existingProduct = await Product.findOne({
      ...getSkuQuery(normalizedSku),
      _id: { $ne: productId },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product with this SKU already exists",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        sku: normalizedSku,
        category,
        // quantity,
        price,
        // minThreshold,
        description
      },
      { new: true }, // return updated data
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error updating product" });
  }
};
