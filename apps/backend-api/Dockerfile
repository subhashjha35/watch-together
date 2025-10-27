# Stage 1: Builder (install deps and build the app)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn nx build api  # Replace 'api' with your app name

# Stage 2: Runtime (copy built artifacts and prune deps)
FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist/apps/backend-api ./
COPY --from=builder /app/package.json /app/yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
# Render assigns PORT (default 10000); use 8080 for flexibility
EXPOSE 8080
# Assumes built entrypoint is index.js; adjust if needed
CMD ["node", "index.js"]
