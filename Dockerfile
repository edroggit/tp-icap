# Stage 1: build the React frontend
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY shared /app/shared
COPY frontend .
RUN npm run build

# Stage 2: the backend, which also serves the built frontend
FROM node:24-alpine
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY shared /app/shared
COPY database /app/database
COPY backend .
RUN npx prisma generate
COPY --from=frontend /app/frontend/dist /app/frontend/dist
EXPOSE 3000
# Apply migrations, then start; `exec` lets node receive Docker's stop signal.
CMD npx prisma migrate deploy && exec node src/index.ts
