import type { Trade, TradeEvent, TradeInput } from '../../shared/trade.ts';

/** Calls the API; on failure throws an Error with the server's message. */
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  listTrades: () => request<Trade[]>('/trades'),
  getHistory: (id: string) => request<TradeEvent[]>(`/trades/${id}/history`),
  createTrade: (input: TradeInput) => request<Trade>('/trades', 'POST', input),
  amendTrade: (id: string, input: TradeInput) => request<Trade>(`/trades/${id}`, 'PUT', input),
  cancelTrade: (id: string) => request<Trade>(`/trades/${id}/cancel`, 'POST'),
};
