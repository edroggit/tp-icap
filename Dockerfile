# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---- Stage 1: build the React client -------------------------------------
FROM node:${NODE_VERSION}-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY shared/ /app/shared/
COPY client/ ./
RUN npm run build

# ---- Stage 2: install + typecheck the server, then drop dev deps ---------
FROM node:${NODE_VERSION}-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY shared/ /app/shared/
COPY server/ ./
RUN npm run typecheck && npm prune --omit=dev

# ---- Stage 3: minimal runtime image --------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/app/data/app.db
WORKDIR /app

COPY --from=server-build /app/server/package.json ./server/package.json
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/src ./server/src
COPY --from=server-build /app/shared ./shared
COPY --from=client-build /app/client/dist ./client/dist

# Created with the right owner so a fresh named volume inherits it.
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/health" || exit 1

WORKDIR /app/server
# Node runs the TypeScript sources directly (built-in type stripping).
CMD ["node", "--disable-warning=ExperimentalWarning", "src/index.ts"]
