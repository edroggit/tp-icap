import type { Side, Trade, TradeStatus } from '../../../shared/trade.ts';

export type SortKey = keyof Trade;
export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}
export interface Filters {
  text: string;
  side: Side | 'ALL';
  status: TradeStatus | 'ALL';
}

const compare = (a: string | number, b: string | number) =>
  typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b));

/** Filter then sort. Free text matches symbol, trader, book and counterparty. */
export function applyView(trades: Iterable<Trade>, filters: Filters, sort: Sort): Trade[] {
  const query = filters.text.trim().toLowerCase();
  const direction = sort.dir === 'asc' ? 1 : -1;

  return [...trades]
    .filter(
      (t) =>
        (filters.side === 'ALL' || t.side === filters.side) &&
        (filters.status === 'ALL' || t.status === filters.status) &&
        [t.symbol, t.trader, t.book, t.counterparty].some((f) => f.toLowerCase().includes(query)),
    )
    .sort((a, b) => direction * compare(a[sort.key], b[sort.key]));
}

/** Clicking the sorted column flips its direction; another column starts ascending. */
export const nextSort = (current: Sort, key: SortKey): Sort =>
  current.key === key ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' };
