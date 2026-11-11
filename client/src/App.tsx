import { useCallback, useState } from 'react';
import { WS_PATH, type ChatMessage, type ServerMessage } from '../../shared/protocol.ts';
import { useWebSocket } from './hooks/useWebSocket.ts';
import { ConnectionStatus } from './components/ConnectionStatus.tsx';
import { MessageList } from './components/MessageList.tsx';
import { MessageForm } from './components/MessageForm.tsx';

// Same origin as the page, so it works behind Docker, Vite's proxy or a reverse proxy.
const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}${WS_PATH}`;
const AUTHOR_KEY = 'chat.author';

function loadAuthor(): string {
  try {
    return localStorage.getItem(AUTHOR_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [author, setAuthor] = useState(loadAuthor);
  const [error, setError] = useState<string | null>(null);

  const onMessage = useCallback((msg: ServerMessage) => {
    switch (msg.type) {
      case 'chat:history':
        // Sent on every (re)connect, so it also fills any gap while offline.
        setMessages(msg.messages);
        return;
      case 'chat:new':
        setMessages((prev) => [...prev, msg.message]);
        return;
      case 'error':
        setError(msg.error);
        return;
      default: {
        const unhandled: never = msg;
        console.warn('[ws] unhandled message', unhandled);
      }
    }
  }, []);

  const { status, send } = useWebSocket(WS_URL, onMessage);

  const changeAuthor = (value: string) => {
    setAuthor(value);
    try {
      localStorage.setItem(AUTHOR_KEY, value);
    } catch {
      /* storage unavailable: ignore */
    }
  };

  const sendMessage = (text: string) => {
    setError(null);
    const sent = send({ type: 'chat:send', author, text });
    if (!sent) setError('Not connected. Your message was not sent.');
    return sent;
  };

  return (
    <main className="mx-auto flex h-dvh max-w-2xl flex-col px-4 py-4 sm:py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Realtime Chat</h1>
        <ConnectionStatus status={status} />
      </header>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <MessageList messages={messages} me={author.trim()} />
        {error && (
          <p className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        <MessageForm
          author={author}
          onAuthorChange={changeAuthor}
          onSend={sendMessage}
          disabled={status !== 'open'}
        />
      </section>
    </main>
  );
}
