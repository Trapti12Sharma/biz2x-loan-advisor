const { getAllProducts, NOTICE } = require('../services/productService');

// GET /api/products
function listProducts(req, res) {
  res.json({ notice: NOTICE, products: getAllProducts() });
}

module.exports = { listProducts };
