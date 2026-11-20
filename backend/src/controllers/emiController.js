const { calculateEmi, compareTenures } = require('../services/emiService');

// POST /api/emi  body: { principal, annualRatePercent, tenureMonths }
function emi(req, res) {
  const { principal, annualRatePercent, tenureMonths } = req.body || {};
  res.json(calculateEmi({ principal, annualRatePercent, tenureMonths }));
}

// POST /api/emi/compare-tenures  body: { principal, annualRatePercent, tenures: [12, 24, 36] }
function tenures(req, res) {
  const { principal, annualRatePercent, tenures: list } = req.body || {};
  res.json(compareTenures({ principal, annualRatePercent, tenures: list }));
}

module.exports = { emi, tenures };
