require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Stock = require("./models/Stock");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("DB connection failed:", error.message);
    process.exit(1);
  }
};

function getSkuQuery(sku) {
  return sku ? { sku: { $regex: `^${sku.replace(/[.*+?^${}()|[\]\]/g, "\\$&")}$`, $options: "i" } } : { sku };
}

const test = async () => {
  await connectDB();

  console.log("\n=== PRODUCTS IN DATABASE ===");
  const products = await Product.find();
  products.forEach(p => {
    console.log(`Name: ${p.name}, SKU: "${p.sku}", Status: "${p.status}"`);
  });

  console.log("\n=== STOCKS IN DATABASE ===");
  const stocks = await Stock.find();
  stocks.forEach(s => {
    console.log(`Name: ${s.name}, SKU: "${s.sku}", Status: "${s.status}", Stock: ${s.currentStock}`);
  });

  if (stocks.length > 0) {
    console.log("\n=== TESTING SKU MATCHING ===");
    const testStock = stocks[0];
    console.log(`Testing stock with SKU: "${testStock.sku}"`);
    
    const query = getSkuQuery(testStock.sku);
    console.log(`Query object:`, query);
    
    const foundProduct = await Product.findOne(query);
    if (foundProduct) {
      console.log(`✅ Found product: ${foundProduct.name}`);
    } else {
      console.log(`❌ No product found`);
      
      // Try direct match
      const directMatch = await Product.findOne({ sku: testStock.sku });
      console.log(`Direct match: ${directMatch ? directMatch.name : "Not found"}`);
      
      // Try case-insensitive
      const caseInsensitive = await Product.findOne({ sku: new RegExp(`^${testStock.sku}$`, "i") });
      console.log(`Case-insensitive match: ${caseInsensitive ? caseInsensitive.name : "Not found"}`);
    }
  }

  await mongoose.connection.close();
  console.log("\n✅ Test complete");
};

test().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
