-- CreateTable
CREATE TABLE "Trade" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    "trader" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "counterparty" TEXT NOT NULL,
    "tradeTimestamp" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tradeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TradeEvent_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_tradeTimestamp_idx" ON "Trade"("tradeTimestamp");

-- CreateIndex
CREATE INDEX "TradeEvent_tradeId_idx" ON "TradeEvent"("tradeId");

