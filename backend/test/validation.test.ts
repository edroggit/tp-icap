import { describe, expect, it } from 'vitest';
import { validateTradeInput } from '../../shared/trade.ts';
import { validInput } from './helpers.ts';

describe('validateTradeInput', () => {
  it('accepts a valid trade', () => {
    expect(validateTradeInput(validInput())).toEqual({ ok: true, value: validInput() });
  });

  it.each([
    [{ quantity: 0 }, 'quantity'],
    [{ quantity: -100 }, 'quantity'],
    [{ price: 0 }, 'price'],
    [{ trader: '  ' }, 'trader'],
    [{ side: 'HOLD' }, 'side'],
    [{ tradeTimestamp: 'not a date' }, 'tradeTimestamp'],
  ])('rejects %j', (overrides, field) => {
    const result = validateTradeInput({ ...validInput(), ...overrides });
    expect(result.ok ? [] : Object.keys(result.errors)).toEqual([field]);
  });
});
