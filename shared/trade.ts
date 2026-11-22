/** Trade types and validation, shared by the backend and the frontend form. */

export type Side = 'BUY' | 'SELL';
export type TradeStatus = 'ACTIVE' | 'CANCELLED';

/** The fields a user sets when booking or amending a trade. */
export interface TradeInput {
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  trader: string;
  book: string;
  counterparty: string;
  tradeTimestamp: string; // ISO-8601
}

/** A trade as returned by the API. */
export interface Trade extends TradeInput {
  id: string; // e.g. "TRD-100001"
  status: TradeStatus;
}

/** Audit-trail entry. CREATED holds a snapshot; AMENDED/CANCELLED hold `{ field: { from, to } }`. */
export interface TradeEvent {
  id: number;
  type: 'CREATED' | 'AMENDED' | 'CANCELLED';
  changes: Record<string, unknown>;
  createdAt: string;
}

export type FieldErrors = Partial<Record<keyof TradeInput, string>>;
export type ValidationResult = { ok: true; value: TradeInput } | { ok: false; errors: FieldErrors };

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Validate untrusted input. Used by the API (authoritative) and the form (instant feedback). */
export function validateTradeInput(raw: unknown): ValidationResult {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const { side, quantity, price } = input;
  const errors: FieldErrors = {};

  const symbol = text(input.symbol);
  const trader = text(input.trader);
  const book = text(input.book);
  const counterparty = text(input.counterparty);
  const time = Date.parse(text(input.tradeTimestamp));

  if (!symbol) errors.symbol = 'Symbol is required';
  if (side !== 'BUY' && side !== 'SELL') errors.side = 'Side must be BUY or SELL';
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
    errors.quantity = 'Quantity must be a whole number greater than 0';
  }
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) errors.price = 'Price must be greater than 0';
  if (!trader) errors.trader = 'Trader is required';
  if (!book) errors.book = 'Book is required';
  if (!counterparty) errors.counterparty = 'Counterparty is required';
  if (Number.isNaN(time)) errors.tradeTimestamp = 'Trade time must be a valid date and time';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      symbol,
      side: side as Side,
      quantity: quantity as number,
      price: price as number,
      trader,
      book,
      counterparty,
      tradeTimestamp: new Date(time).toISOString(),
    },
  };
}

/** The one WebSocket message: the server pushes every created, amended or cancelled trade. */
export type ServerMessage = { type: 'trade:upserted'; trade: Trade };
