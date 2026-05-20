const Product = require("../models/Product");

// Create Product
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      price,
      minThreshold,
      description
    } = req.body;

    // 🔍 Check name
    const nameExists = await Product.findOne({ name });
    if (nameExists) {
      return res.status(400).json({
        message: "Product already exists",
      });
    }

    const product = new Product({
      name,
      category,
      quantity,
      price,
      minThreshold,
      description
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

    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error deleting product",
    });
  }
};

// Update Product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, category, quantity, price, minThreshold, description } = req.body;

    // 🔴 Check duplicate (excluding current product)
    const existingProduct = await Product.findOne({
      name,
      _id: { $ne: productId },
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product name already exists",
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        category,
        quantity,
        price,
        minThreshold,
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
