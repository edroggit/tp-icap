import { useState, type FormEvent } from 'react';
import { validateTradeInput, type FieldErrors, type Trade, type TradeInput } from '../../../shared/trade.ts';
import { api } from '../api.ts';
import { toLocalInput } from '../lib/format.ts';
import { Modal } from './Modal.tsx';

interface Props {
  trade?: Trade; // omit to book a new trade
  onClose: () => void; // also called after a successful save
}

const FIELDS: { name: keyof TradeInput; label: string; type?: string }[] = [
  { name: 'symbol', label: 'Symbol' },
  { name: 'quantity', label: 'Quantity', type: 'number' },
  { name: 'price', label: 'Price', type: 'number' },
  { name: 'trader', label: 'Trader' },
  { name: 'book', label: 'Book' },
  { name: 'counterparty', label: 'Counterparty' },
  { name: 'tradeTimestamp', label: 'Trade time', type: 'datetime-local' },
];

export function TradeForm({ trade, onClose }: Props) {
  const [values, setValues] = useState<Record<keyof TradeInput, string>>({
    symbol: trade?.symbol ?? '',
    side: trade?.side ?? 'BUY',
    quantity: trade ? String(trade.quantity) : '',
    price: trade ? String(trade.price) : '',
    trader: trade?.trader ?? '',
    book: trade?.book ?? '',
    counterparty: trade?.counterparty ?? '',
    tradeTimestamp: toLocalInput(trade?.tradeTimestamp ?? new Date().toISOString()),
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const set = (name: keyof TradeInput, value: string) => setValues((v) => ({ ...v, [name]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = validateTradeInput({
      ...values,
      quantity: values.quantity === '' ? NaN : Number(values.quantity),
      price: values.price === '' ? NaN : Number(values.price),
      tradeTimestamp: values.tradeTimestamp && new Date(values.tradeTimestamp).toISOString(),
    });
    setErrors(result.ok ? {} : result.errors);
    if (!result.ok) return;

    try {
      await (trade ? api.amendTrade(trade.id, result.value) : api.createTrade(result.value));
      onClose(); // the table updates when the server's broadcast arrives
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <Modal title={trade ? `Amend ${trade.id}` : 'New trade'} onClose={onClose}>
      <form onSubmit={submit} noValidate className="grid grid-cols-2 gap-3 text-sm">
        {formError && <p className="col-span-2 text-rose-700">{formError}</p>}

        <label className="flex flex-col gap-1">
          Side
          <select value={values.side} onChange={(e) => set('side', e.target.value)} className="rounded border px-2 py-1.5">
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </label>

        {FIELDS.map(({ name, label, type }) => (
          <label key={name} className="flex flex-col gap-1">
            {label}
            <input
              type={type ?? 'text'}
              step={type === 'datetime-local' ? 1 : 'any'}
              value={values[name]}
              onChange={(e) => set(name, e.target.value)}
              className={`rounded border px-2 py-1.5 ${errors[name] ? 'border-rose-500' : ''}`}
            />
            {errors[name] && <span className="text-xs text-rose-600">{errors[name]}</span>}
          </label>
        ))}

        <div className="col-span-2 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded px-4 py-2 hover:bg-slate-100">
            Close
          </button>
          <button type="submit" className="rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
            {trade ? 'Save' : 'Book trade'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
