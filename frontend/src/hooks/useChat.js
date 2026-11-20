import { useState, useCallback, useRef, useEffect } from 'react'
import { sendChat, getChatHistory, clearChatHistory } from '../services/api'

let nextId = 1

// Chat state + actions. The SERVER stores this user's history and profile,
// so we only send the new message text.
export function useChat() {
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const busy = useRef(false) // blocks double-sends even before state updates

  // Load this user's saved conversation once on mount.
  useEffect(() => {
    let cancelled = false
    getChatHistory()
      .then((d) => { if (!cancelled) setMessages(d.messages.map((m) => ({ ...m, id: nextId++ }))) })
      .catch(() => {}) // best-effort
    return () => { cancelled = true }
  }, [])

  const send = useCallback(async (text) => {
    const message = text.trim()
    if (!message || busy.current) return
    busy.current = true

    setMessages((prev) => [...prev, { id: nextId++, role: 'user', content: message }]) // optimistic UI
    setSending(true)
    setError(null)
    try {
      const data = await sendChat(message)
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: 'assistant', content: data.reply, aiAvailable: data.aiAvailable, disclaimer: data.disclaimer },
      ])
    } catch (err) {
      setError({ message: err.message, details: err.details || [] })
    } finally {
      setSending(false)
      busy.current = false
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      await clearChatHistory()
      setMessages([])
      setError(null)
    } catch (err) {
      setError({ message: err.message, details: [] })
    }
  }, [])

  return { messages, sending, error, send, clear }
}
