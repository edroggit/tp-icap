import { useEffect, useState } from 'react';
import type { TradeEvent } from '../../../shared/trade.ts';
import { api } from '../api.ts';
import { formatDateTime } from '../lib/format.ts';
import { Modal } from './Modal.tsx';

/** One-line summary of an audit event, e.g. "quantity: 100 → 200". */
function describe(event: TradeEvent) {
  if (event.type === 'CREATED') {
    const { side, quantity, symbol, price } = event.changes;
    return `${side} ${quantity} ${symbol} @ ${price}`;
  }
  return Object.entries(event.changes as Record<string, { from: unknown; to: unknown }>)
    .map(([field, { from, to }]) => `${field}: ${from} → ${to}`)
    .join(', ');
}

export function TradeHistory({ tradeId, onClose }: { tradeId: string; onClose: () => void }) {
  const [events, setEvents] = useState<TradeEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getHistory(tradeId).then(setEvents, (err: Error) => setError(err.message));
  }, [tradeId]);

  return (
    <Modal title={`History of ${tradeId}`} onClose={onClose}>
      {error && <p className="text-rose-700">{error}</p>}
      <ol className="flex flex-col gap-2 text-sm">
        {events?.map((event) => (
          <li key={event.id}>
            <span className="font-medium">{event.type}</span> {describe(event)}
            <div className="text-xs text-slate-500">{formatDateTime(event.createdAt)}</div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={onClose} className="mt-4 rounded px-4 py-2 text-sm hover:bg-slate-100">
        Close
      </button>
    </Modal>
  );
}
