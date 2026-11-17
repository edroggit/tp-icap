import { describe, expect, it } from 'vitest';
import type { Trade } from '../../../shared/trade.ts';
import { applyView, nextSort, type Filters } from './blotter.ts';

const trade = (id: string, overrides: Partial<Trade>): Trade => ({
  id,
  symbol: 'AAPL',
  side: 'BUY',
  quantity: 100,
  price: 10,
  trader: 'JSMITH',
  book: 'EQUITIES_US',
  counterparty: 'UBS',
  tradeTimestamp: '2026-08-18T09:00:00.000Z',
  status: 'ACTIVE',
  ...overrides,
});

const trades = [
  trade('A', { symbol: 'MSFT', quantity: 500, side: 'SELL' }),
  trade('B', { symbol: 'AAPL', quantity: 100, trader: 'ABROWN' }),
  trade('C', { symbol: 'TSLA', quantity: 2000, status: 'CANCELLED' }),
];
const all: Filters = { text: '', side: 'ALL', status: 'ALL' };
const ids = (list: Trade[]) => list.map((t) => t.id);

describe('applyView', () => {
  it('sorts numbers and text in either direction', () => {
    expect(ids(applyView(trades, all, { key: 'quantity', dir: 'asc' }))).toEqual(['B', 'A', 'C']);
    expect(ids(applyView(trades, all, { key: 'quantity', dir: 'desc' }))).toEqual(['C', 'A', 'B']);
    expect(ids(applyView(trades, all, { key: 'symbol', dir: 'asc' }))).toEqual(['B', 'A', 'C']);
  });

  it('filters by text, side and status', () => {
    const sort = { key: 'id', dir: 'asc' } as const;
    expect(ids(applyView(trades, { ...all, text: 'brown' }, sort))).toEqual(['B']);
    expect(ids(applyView(trades, { ...all, side: 'SELL' }, sort))).toEqual(['A']);
    expect(ids(applyView(trades, { ...all, status: 'ACTIVE', side: 'BUY' }, sort))).toEqual(['B']);
  });
});

describe('nextSort', () => {
  it('flips the active column and starts a new column ascending', () => {
    expect(nextSort({ key: 'price', dir: 'asc' }, 'price')).toEqual({ key: 'price', dir: 'desc' });
    expect(nextSort({ key: 'price', dir: 'desc' }, 'symbol')).toEqual({ key: 'symbol', dir: 'asc' });
  });
});
