import { Router } from 'express';
import { validateTradeInput, type Trade, type TradeInput } from '../../../shared/trade.ts';
import { HttpError } from '../errors.ts';
import type { TradeService } from './service.ts';

function parseInput(body: unknown): TradeInput {
  const result = validateTradeInput(body);
  if (!result.ok) throw new HttpError(400, 'Please fix the highlighted fields', result.errors);
  return result.value;
}

/** REST endpoints for trades. `onChange` is called after every successful write. */
export function tradeRoutes(trades: TradeService, onChange: (trade: Trade) => void): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await trades.list());
  });

  router.get('/:id/history', async (req, res) => {
    res.json(await trades.history(req.params.id));
  });

  router.post('/', async (req, res) => {
    const trade = await trades.create(parseInput(req.body));
    onChange(trade);
    res.status(201).json(trade);
  });

  router.put('/:id', async (req, res) => {
    const trade = await trades.amend(req.params.id, parseInput(req.body));
    onChange(trade);
    res.json(trade);
  });

  router.post('/:id/cancel', async (req, res) => {
    const trade = await trades.cancel(req.params.id);
    onChange(trade);
    res.json(trade);
  });

  return router;
}
