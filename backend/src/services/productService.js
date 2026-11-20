const catalog = require('../data/products.json');

const NOTICE = catalog._notice;

// Returns every product (a copy-safe array of plain objects).
function getAllProducts() {
  return catalog.products;
}

// Returns one product or undefined if the id does not exist.
function getProductById(id) {
  return catalog.products.find((p) => p.id === id);
}

module.exports = { getAllProducts, getProductById, NOTICE };
