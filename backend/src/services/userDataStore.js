// In-memory per-user store (stand-in for a database). EVERY function takes a userId
// and only ever touches that user's slot, so one user's data cannot leak into another's.
// Production: a DB with a user_id column on every table + row-level security.

const profiles = new Map(); // userId -> profile
const chats = new Map(); // userId -> [{ role, content, aiAvailable?, disclaimer? }]
const MAX_CHAT_MESSAGES = 50;

const copy = (v) => (v === undefined ? undefined : structuredClone(v)); // callers get copies, not references

function getProfile(userId) {
  return copy(profiles.get(userId));
}

function saveProfile(userId, profile) {
  profiles.set(userId, copy(profile));
}

function getChat(userId) {
  return copy(chats.get(userId)) || [];
}

function appendChat(userId, messages) {
  const next = [...(chats.get(userId) || []), ...copy(messages)].slice(-MAX_CHAT_MESSAGES);
  chats.set(userId, next);
}

function clearChat(userId) {
  chats.delete(userId);
}

// Test helper only.
function _resetAll() {
  profiles.clear();
  chats.clear();
}

module.exports = { getProfile, saveProfile, getChat, appendChat, clearChat, _resetAll };
