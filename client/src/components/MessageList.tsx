import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../../shared/protocol.ts';

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });

export function MessageList({ messages, me }: { messages: ChatMessage[]; me: string }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        No messages yet. Say hello!
      </div>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      {messages.map((m) => {
        const mine = m.author === me;
        return (
          <li key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
            <div className="mb-1 flex gap-2 text-xs text-slate-500">
              <span className="font-medium">{m.author}</span>
              <time dateTime={m.createdAt}>{timeFormat.format(new Date(m.createdAt))}</time>
            </div>
            <p
              className={`max-w-[80%] rounded-2xl px-4 py-2 break-words whitespace-pre-wrap ${
                mine ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800 shadow-sm'
              }`}
            >
              {m.text}
            </p>
          </li>
        );
      })}
      <div ref={endRef} />
    </ul>
  );
}
