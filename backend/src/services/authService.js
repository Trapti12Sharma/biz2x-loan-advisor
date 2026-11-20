const jwt = require('jsonwebtoken');
const { verifyPassword, hashPassword } = require('../utils/password');
const usersFile = require('../data/users.json');

const users = usersFile.users;

// Hash used to burn the same CPU time when the email is unknown,
// so response time does not reveal which emails exist.
const DUMMY_HASH = hashPassword('not-a-real-password');

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
    this.status = 401;
  }
}

function secret() {
  if (!process.env.AUTH_SECRET) {
    const e = new Error('AUTH_SECRET is not configured');
    e.status = 500; // shown to the client only as a generic message
    throw e;
  }
  return process.env.AUTH_SECRET;
}

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email }); // never includes passwordHash

function login(email, password) {
  const user = typeof email === 'string' ? users.find((u) => u.email === email.trim().toLowerCase()) : undefined;
  const ok = verifyPassword(typeof password === 'string' ? password : '', user ? user.passwordHash : DUMMY_HASH);
  // Same message for "no such user" and "wrong password" (prevents user enumeration).
  if (!user || !ok) throw new AuthError('Invalid email or password');

  const token = jwt.sign({ sub: user.id }, secret(), { expiresIn: process.env.TOKEN_TTL || '2h' });
  return { token, user: publicUser(user) };
}

// Returns the user for a valid token; throws AuthError otherwise.
function authenticate(token) {
  let payload;
  try {
    payload = jwt.verify(token, secret(), { algorithms: ['HS256'] });
  } catch (err) {
    if (err.status === 500) throw err; // misconfiguration, not a bad token
    throw new AuthError('Invalid or expired token');
  }
  const user = users.find((u) => u.id === payload.sub);
  if (!user) throw new AuthError('Invalid or expired token');
  return publicUser(user);
}

module.exports = { login, authenticate, AuthError };
