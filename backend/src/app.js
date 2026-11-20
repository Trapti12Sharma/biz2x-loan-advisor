const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const productRoutes = require('./routes/productRoutes');
const emiRoutes = require('./routes/emiRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by'); // don't advertise the framework
app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store', // API responses hold personal financial data
  });
  next();
});

// Only our React app may call this API from a browser.
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));

// Parse JSON request bodies into req.body (limit stops huge payloads).
app.use(express.json({ limit: '100kb' }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chat', chatRoutes);

// Must stay LAST: unknown routes, then error handler.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
