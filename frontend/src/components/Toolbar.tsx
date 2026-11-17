import type { Filters } from '../lib/blotter.ts';

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  loading: boolean;
  onRefresh: () => void;
}

const control = 'rounded border border-slate-300 bg-white px-2 py-1.5 text-sm';

export function Toolbar({ filters, onChange, loading, onRefresh }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <input
        type="search"
        placeholder="Search symbol, trader, book, counterparty"
        value={filters.text}
        onChange={(e) => onChange({ ...filters, text: e.target.value })}
        className={`${control} w-80`}
      />
      <select
        value={filters.side}
        onChange={(e) => onChange({ ...filters, side: e.target.value as Filters['side'] })}
        className={control}
      >
        <option value="ALL">All sides</option>
        <option value="BUY">Buy</option>
        <option value="SELL">Sell</option>
      </select>
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as Filters['status'] })}
        className={control}
      >
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button type="button" onClick={onRefresh} disabled={loading} className={`${control} ml-auto disabled:opacity-50`}>
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </div>
  );
}
