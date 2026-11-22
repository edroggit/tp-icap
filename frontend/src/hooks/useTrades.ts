import { useCallback, useEffect, useState } from 'react';
import type { Trade } from '../../../shared/trade.ts';
import { api } from '../api.ts';
import { useWebSocket } from './useWebSocket.ts';

/**
 * All trades, loaded over REST and kept up to date by WebSocket pushes.
 * Every change, including this browser's own, arrives as a push.
 */
export function useTrades() {
  const [trades, setTrades] = useState<ReadonlyMap<string, Trade>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listTrades();
      setTrades(new Map(list.map((t) => [t.id, t])));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useWebSocket((msg) => setTrades((prev) => new Map(prev).set(msg.trade.id, msg.trade)));

  return { trades, loading, error, refresh };
}
