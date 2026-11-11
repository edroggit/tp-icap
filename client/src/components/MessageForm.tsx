import { useState, type FormEvent } from 'react';
import { LIMITS } from '../../../shared/protocol.ts';

interface Props {
  author: string;
  onAuthorChange: (author: string) => void;
  onSend: (text: string) => boolean;
  disabled: boolean;
}

export function MessageForm({ author, onAuthorChange, onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const canSend = !disabled && author.trim() !== '' && text.trim() !== '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (canSend && onSend(text)) setText('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row">
      <input
        aria-label="Your name"
        className="rounded-lg border border-slate-300 px-3 py-2 sm:w-36"
        placeholder="Your name"
        maxLength={LIMITS.authorMaxLength}
        value={author}
        onChange={(e) => onAuthorChange(e.target.value)}
      />
      <input
        aria-label="Message"
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        placeholder={disabled ? 'Waiting for connection…' : 'Type a message'}
        maxLength={LIMITS.textMaxLength}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        type="submit"
        disabled={!canSend}
        className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
