// Tiny in-memory fixed-window rate limiter, keyed per user (req.user.id) or IP.
// Production note: use a shared store (e.g. Redis) so limits hold across servers.
function rateLimit({ windowMs, max }) {
  const hits = new Map(); // key -> { count, resetAt }

  return function limiter(req, res, next) {
    const key = req.user ? req.user.id : req.ip;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' });
    }
    next();
  };
}

module.exports = rateLimit;
