import express from 'express';
import type { Trade } from '../../shared/trade.ts';
import type { PrismaClient } from './db.ts';
import { errorHandler } from './errors.ts';
import { createTradeService } from './trades/service.ts';
import { tradeRoutes } from './trades/routes.ts';

interface AppOptions {
  prisma: PrismaClient;
  /** Called after every trade write, to broadcast it over the WebSocket. */
  onTradeChange: (trade: Trade) => void;
  /** Built frontend to serve. */
  frontendDist?: string;
}

export function createApp({ prisma, onTradeChange, frontendDist }: AppOptions) {
  const app = express();
  app.use(express.json());
  app.use('/api/trades', tradeRoutes(createTradeService(prisma), onTradeChange));
  if (frontendDist) app.use(express.static(frontendDist));
  app.use(errorHandler);
  return app;
}
