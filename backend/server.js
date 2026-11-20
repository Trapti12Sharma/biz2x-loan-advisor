require('dotenv').config(); // load .env into process.env BEFORE anything reads it

// Fail fast: refuse to start without the token-signing secret.
if (!process.env.AUTH_SECRET) {
  console.error('AUTH_SECRET is missing. Copy .env.example to .env and set it (long random string).');
  process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Loan Advisor API running on http://localhost:${PORT}`);
});
