import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Bot, UserRound, WifiOff } from 'lucide-react'

// Style Markdown elements (no Tailwind typography plugin needed).
const MD = {
  p: (p) => <p className="mb-2 last:mb-0" {...p} />,
  ul: (p) => <ul className="mb-2 list-disc space-y-0.5 pl-5" {...p} />,
  ol: (p) => <ol className="mb-2 list-decimal space-y-0.5 pl-5" {...p} />,
  strong: (p) => <strong className="font-semibold" {...p} />,
  table: (p) => <div className="mb-2 overflow-x-auto"><table className="w-full text-left text-xs" {...p} /></div>,
  th: (p) => <th className="border-b border-slate-300 py-1 pr-3 font-semibold" {...p} />,
  td: (p) => <td className="border-b border-slate-100 py-1 pr-3" {...p} />,
}

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-slate-700 text-white' : 'bg-teal-600 text-white'}`}>
        {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isUser ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            {message.aiAvailable === false && (
              <p className="mb-2 flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">
                <WifiOff className="h-3.5 w-3.5" /> AI unavailable. Showing a rule-based summary.
              </p>
            )}
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD}>{message.content}</ReactMarkdown>
            {message.disclaimer && <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">{message.disclaimer}</p>}
          </>
        )}
      </div>
    </div>
  )
}
