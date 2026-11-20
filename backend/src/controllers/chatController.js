const { answer } = require('../services/chatService');
const store = require('../services/userDataStore');

// POST /api/chat  body: { message }   (requires auth)
// Profile and history are read from the server-side store for THIS user.
// Anything the browser sends as "profile"/"history" is ignored on purpose.
async function chat(req, res) {
  const userId = req.user.id;
  const message = req.body && req.body.message;

  const profile = store.getProfile(userId);
  const history = store.getChat(userId).map(({ role, content }) => ({ role, content }));

  const out = await answer({ message, profile: profile || undefined, history });

  // Only reached when the message was valid and answered (or fallback used).
  store.appendChat(userId, [
    { role: 'user', content: message.trim() },
    { role: 'assistant', content: out.reply, aiAvailable: out.aiAvailable, disclaimer: out.disclaimer },
  ]);
  res.json(out);
}

// GET /api/chat/history -> caller's own messages
function history(req, res) {
  res.json({ messages: store.getChat(req.user.id) });
}

// DELETE /api/chat/history -> clears caller's own messages
function clearHistory(req, res) {
  store.clearChat(req.user.id);
  res.json({ ok: true });
}

module.exports = { chat, history, clearHistory };
