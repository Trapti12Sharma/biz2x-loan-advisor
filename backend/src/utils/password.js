const crypto = require('crypto');

// Stored format: "<salt-hex>:<hash-hex>". scrypt is a slow, memory-hard hash,
// which makes brute-forcing leaked hashes expensive.
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  // timingSafeEqual avoids leaking information through comparison time.
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

module.exports = { hashPassword, verifyPassword };
