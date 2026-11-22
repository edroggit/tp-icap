import { useMemo, useState } from 'react';
import type { Trade } from '../../shared/trade.ts';
import { api } from './api.ts';
import { Toolbar } from './components/Toolbar.tsx';
import { TradeForm } from './components/TradeForm.tsx';
import { TradeHistory } from './components/TradeHistory.tsx';
import { TradeTable } from './components/TradeTable.tsx';
import { useTrades } from './hooks/useTrades.ts';
import { applyView, nextSort, type Filters, type Sort } from './lib/blotter.ts';

type Dialog = { kind: 'create' } | { kind: 'amend'; trade: Trade } | { kind: 'history'; tradeId: string } | null;

export default function App() {
  const { trades, loading, error, refresh } = useTrades();
  const [filters, setFilters] = useState<Filters>({ text: '', side: 'ALL', status: 'ALL' });
  const [sort, setSort] = useState<Sort>({ key: 'tradeTimestamp', dir: 'desc' });
  const [dialog, setDialog] = useState<Dialog>(null);

  const rows = useMemo(() => applyView(trades.values(), filters, sort), [trades, filters, sort]);
  const closeDialog = () => setDialog(null);

  const cancelTrade = async (trade: Trade) => {
    if (!window.confirm(`Cancel ${trade.id}?`)) return;
    try {
      await api.cancelTrade(trade.id);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  return (
    <div className="flex h-dvh flex-col gap-3 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trade Blotter</h1>
        <button
          type="button"
          onClick={() => setDialog({ kind: 'create' })}
          className="rounded bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500"
        >
          New trade
        </button>
      </header>

      <Toolbar filters={filters} onChange={setFilters} loading={loading} onRefresh={() => void refresh()} />
      {error && <p className="text-sm text-rose-700">{error}</p>}

      <div className="min-h-0 flex-1 overflow-auto rounded border border-slate-200 bg-white">
        <TradeTable
          trades={rows}
          sort={sort}
          onSort={(key) => setSort((s) => nextSort(s, key))}
          onAmend={(trade) => setDialog({ kind: 'amend', trade })}
          onCancel={(trade) => void cancelTrade(trade)}
          onHistory={(trade) => setDialog({ kind: 'history', tradeId: trade.id })}
        />
      </div>

      {dialog?.kind === 'create' && <TradeForm onClose={closeDialog} />}
      {dialog?.kind === 'amend' && <TradeForm trade={dialog.trade} onClose={closeDialog} />}
      {dialog?.kind === 'history' && <TradeHistory tradeId={dialog.tradeId} onClose={closeDialog} />}
    </div>
  );
}
