# Stage 1: Builder (install deps and build the app)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn nx build api --configuration=production

# Stage 2: Runtime (copy built artifacts and install runtime deps)
FROM node:22-alpine AS runner
WORKDIR /app

# Copy built output (includes generated package.json from esbuild)
COPY --from=builder /app/dist/apps/backend-api ./

# Install only production dependencies (externalized @nestjs/* packages, etc.)
# Note: The generated package.json has pinned versions so reproducibility is ensured
# without a lockfile. --frozen-lockfile cannot be used here because the generated
# package.json versions don't match the monorepo yarn.lock ranges.
RUN yarn install --production --no-lockfile && yarn cache clean

# Default port (override via PORT env var at runtime)
ENV PORT=3000
EXPOSE 3000

CMD ["node", "main.js"]
