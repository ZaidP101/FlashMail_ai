FROM oven/bun:1.4 AS base
WORKDIR /app

# Install workspace deps from the lockfile first (better layer caching)
COPY package.json bun.lock ./
COPY packages/configs/package.json packages/configs/
COPY packages/models/package.json packages/models/
COPY packages/schemas/package.json packages/schemas/
COPY packages/utils/package.json packages/utils/
COPY apps/api/package.json apps/api/
RUN bun install --frozen-lockfile

# Copy the rest of the workspace sources
COPY turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 8081
CMD ["bun", "src/server.js"]
