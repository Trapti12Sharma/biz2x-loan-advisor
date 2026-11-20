// 500000 -> "₹5,00,000" (Indian digit grouping)
function inr(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

module.exports = { inr };
