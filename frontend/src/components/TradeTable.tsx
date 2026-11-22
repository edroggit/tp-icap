import type { Trade } from '../../../shared/trade.ts';
import type { Sort, SortKey } from '../lib/blotter.ts';
import { formatDateTime, formatNumber } from '../lib/format.ts';

const COLUMNS: { key: SortKey; label: string; format?: (t: Trade) => string }[] = [
  { key: 'id', label: 'Trade ID' },
  { key: 'tradeTimestamp', label: 'Time', format: (t) => formatDateTime(t.tradeTimestamp) },
  { key: 'symbol', label: 'Symbol' },
  { key: 'side', label: 'Side' },
  { key: 'quantity', label: 'Quantity', format: (t) => formatNumber(t.quantity) },
  { key: 'price', label: 'Price', format: (t) => formatNumber(t.price) },
  { key: 'trader', label: 'Trader' },
  { key: 'book', label: 'Book' },
  { key: 'counterparty', label: 'Counterparty' },
  { key: 'status', label: 'Status' },
];

interface Props {
  trades: Trade[];
  sort: Sort;
  onSort: (key: SortKey) => void;
  onAmend: (trade: Trade) => void;
  onCancel: (trade: Trade) => void;
  onHistory: (trade: Trade) => void;
}

const action = 'px-1.5 text-indigo-700 hover:underline disabled:text-slate-300 disabled:no-underline';

export function TradeTable({ trades, sort, onSort, onAmend, onCancel, onHistory }: Props) {
  return (
    <table className="w-full text-sm whitespace-nowrap">
      <thead className="sticky top-0 bg-slate-100 text-left">
        <tr>
          {COLUMNS.map((col) => (
            <th key={col.key} className="px-3 py-2 font-medium">
              <button type="button" onClick={() => onSort(col.key)}>
                {col.label} {sort.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
          ))}
          <th />
        </tr>
      </thead>
      <tbody>
        {trades.map((t) => {
          const cancelled = t.status === 'CANCELLED';
          return (
            <tr key={t.id} className={`border-t border-slate-100 ${cancelled ? 'text-slate-400' : ''}`}>
              {COLUMNS.map((col) => (
                <td key={col.key} className="px-3 py-1.5">
                  {col.format ? col.format(t) : t[col.key]}
                </td>
              ))}
              <td className="px-3 text-right">
                <button type="button" className={action} disabled={cancelled} onClick={() => onAmend(t)}>
                  Amend
                </button>
                <button type="button" className={action} disabled={cancelled} onClick={() => onCancel(t)}>
                  Cancel
                </button>
                <button type="button" className={action} onClick={() => onHistory(t)}>
                  History
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
