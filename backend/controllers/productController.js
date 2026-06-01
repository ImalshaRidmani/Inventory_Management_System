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

    console.log(`[Delete Product] Deleting product: ${product.name} (SKU: ${product.sku})`);

    // Delete associated stock record by SKU (cascading delete)
    if (product.sku) {
      const normalizedSku = product.sku.trim().toUpperCase();
      try {
        const deletedStock = await Stock.findOneAndDelete(
          { sku: normalizedSku },
          { new: true }
        );
        
        if (deletedStock) {
          console.log(`[Delete Product] ✅ Deleted associated stock - ID: ${deletedStock._id}, SKU: ${deletedStock.sku}`);
        } else {
          console.log(`[Delete Product] ℹ️ No associated stock found for SKU: ${normalizedSku}`);
        }
      } catch (stockErr) {
        console.error(`[Delete Product] ⚠️ Error deleting stock for SKU ${normalizedSku}:`, stockErr.message);
        // Continue with product deletion even if stock deletion fails
      }
    }

    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (deletedProduct) {
      res.status(200).json({
        message: "Product and associated stock deleted successfully",
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
